export function extractYouTubeVideoId(url) {
  if (!url) return null;
  
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&\s]+)/,
    /(?:https?:\/\/)?youtu\.be\/([^\?\s]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([^\?\s]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^\?\s]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function isYouTubeUrl(url) {
  return extractYouTubeVideoId(url) !== null;
}

export function detectUrls(text) {
  if (!text) return [];
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
}

export function detectMentions(text) {
  if (!text) return [];
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;
  const matches = text.match(mentionRegex);
  return matches ? matches.map(m => m.slice(1)) : [];
}

export function renderTextWithLinks(text, isMe, highlightMentions = false, members = []) {
  if (!text) return <span></span>;
  
  // Primeiro processar menções se habilitado
  if (highlightMentions && members.length > 0) {
    const mentionPattern = /@([a-zA-Z0-9_]+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    
    while ((match = mentionPattern.exec(text)) !== null) {
      // Adicionar texto antes da menção
      if (match.index > lastIndex) {
        const textPart = text.slice(lastIndex, match.index);
        const urlParts = processUrls(textPart);
        parts.push(...urlParts.map(p => ({ ...p, key: parts.length })));
      }
      
      // Adicionar menção destacada
      const username = match[1];
      const isMentioned = members.some(m => 
        m.username?.toLowerCase() === username.toLowerCase()
      );
      
      parts.push({
        type: 'mention',
        content: match[0],
        username,
        isValid: isMentioned,
        key: parts.length
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Adicionar texto restante
    if (lastIndex < text.length) {
      const textPart = text.slice(lastIndex);
      const urlParts = processUrls(textPart);
      parts.push(...urlParts.map(p => ({ ...p, key: parts.length })));
    }
    
    return parts.length > 0 ? parts : <span>{text}</span>;
  }
  
  // Comportamento original sem highlight de menções
  const urls = detectUrls(text);
  
  if (urls.length === 0) {
    return <span>{text}</span>;
  }
  
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  
  return parts.map((part, index) => {
    if (detectUrls(part).length > 0) {
      const videoId = extractYouTubeVideoId(part);
      if (videoId) {
        return { type: 'youtube', url: part, videoId, key: index };
      } else {
        return { type: 'link', url: part, key: index };
      }
    }
    return { type: 'text', content: part, key: index };
  }).filter(Boolean);
}

function processUrls(text) {
  const urls = detectUrls(text);
  if (urls.length === 0) return [{ type: 'text', content: text }];
  
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return parts.map((part, index) => {
    if (detectUrls(part).length > 0) {
      const videoId = extractYouTubeVideoId(part);
      if (videoId) {
        return { type: 'youtube', url: part, videoId, key: index };
      } else {
        return { type: 'link', url: part, key: index };
      }
    }
    return { type: 'text', content: part, key: index };
  }).filter(Boolean);
}

export function parseVoiceMessage(content) {
  const voiceRegex = /\[voice\](\S+)\|(\d+)\|(\d+)\[\/voice\]/;
  const match = content.match(voiceRegex);

  if (!match) return null;

  return {
    type: 'voice',
    url: match[1],
    duration: parseInt(match[2]),
    fileSize: parseInt(match[3])
  };
}

export function parseStickerMessage(content) {
  const stickerRegex = /\[sticker\](\S+)\|(.+?)\[\/sticker\]/;
  const match = content.match(stickerRegex);

  if (!match) return null;

  return {
    type: 'sticker',
    url: match[1],
    stickerId: match[2]
  };
}

export function parseFileMessage(content) {
  const fileRegex = /\[file\](\S+)\|(.+?)\|(.+?)\|(\d+)\[\/file\]/;
  const match = content.match(fileRegex);
  
  if (!match) return null;

  const [_, url, fileName, fileType, fileSize] = match;
    
  return {
    type: 'file',
    url,
    fileName,
    fileType,
    fileSize: parseInt(fileSize)
  }
}

export function detectCode(text) {
  if (!text) return null;
  
  // Verifica se tem múltiplas linhas
  const lines = text.split('\n');
  if (lines.length < 2) return null;
  
  // Padrões de linguagens
  const patterns = {
    sql: /\b(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|JOIN|CREATE|ALTER|DROP|TABLE)\b/i,
    javascript: /\b(function|const|let|var|=>|import|export|require|console\.)\b/,
    python: /\b(def|class|import|from|print|return|if __name__|lambda)\b/,
    html: /<\w+>.*<\/\w+>|<\w+\s*\/?>|<\w+\s+[^>]*>/,
    css: /\{([^}]*)\}|@media|@import|@keyframes/,
    json: /^\s*[\{\[]/,
    bash: /\b(echo|sudo|apt|npm|git|cd|ls|mkdir|rm|cp|mv)\b/,
    java: /\b(public|private|class|static|void|int|String|System\.out)\b/,
    cpp: /\b(#include|cout|cin|std::|vector|template|class)\b/,
    php: /\b(<\?php|\$\w+|echo|function|array\(\))\b/i,
    ruby: /\b(def|end|puts|require|class|attr_accessor)\b/,
    go: /\b(func|package|import|type|struct|fmt\.)\b/,
    rust: /\b(fn|let|mut|println!|use |struct|impl)\b/,
  };
    
  const scores = {};
  for (const [lang, regex] of Object.entries(patterns)) {
    const matches = text.match(regex) || [];
    if (matches.length > 0) {
      scores[lang] = matches.length;
    }
  }
    
  // Se encontrou alguma linguagem
  if (Object.keys(scores).length > 0) {
    const detectedLang = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
    return detectedLang;
  }
    
  // Verifica se parece código (indentação, símbolos)
  const codeIndicators = text.match(/[{}();=<>]/g) || [];
  const hasCodeStructure = codeIndicators.length > text.length * 0.05; // >5% de símbolos
    
  if (hasCodeStructure && lines.length >= 3) {
    return 'code'; // Genérico
  }
    
  return null;
}
