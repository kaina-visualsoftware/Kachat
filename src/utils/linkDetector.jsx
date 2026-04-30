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

export function renderTextWithLinks(text, isMe) {
  const urls = detectUrls(text);
  
  if (urls.length === 0) {
    return <span>{text}</span>;
  }
  
  // Split text by URLs
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

export function parseFileMessage(content) {
  const fileRegex = /\[file\](.*?)\|(.*?)\|(.*?)\|(\d+)\[\/file\]/;
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
