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
  const fileRegex = /\[file\](.*?)\|(.*?)\|(.*?)\|(\d+)\[\/file\]/
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
