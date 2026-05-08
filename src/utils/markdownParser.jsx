const escapeHtml = (text) => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

const stripTags = (html) => {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')
    .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, '[SVG bloqueado]')
    .replace(/<[^>]+>/g, '')
}

const isValidUrl = (url) => {
  if (!url || typeof url !== 'string') return false
  
  const trimmed = url.trim().toLowerCase()
  
  const invalidProtocols = [
    'javascript:',
    'data:',
    'vbscript:',
    'mailto:',
    'tel:',
    'file:',
    'ftp:',
    'ws:',
    'wss:'
  ]
  
  for (const protocol of invalidProtocols) {
    if (trimmed.startsWith(protocol)) {
      return false
    }
  }
  
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return false
  }
  
  return true
}

const sanitizeUrl = (url) => {
  if (!isValidUrl(url)) {
    return null
  }
  return url
}

const hasMarkdown = (text) => {
  const patterns = [
    /^#{1,6}\s+.+$/m,
    /\*\*.+?\*\*/,
    /__.+?__/,
    /\*.+?\*/,
    /_.+?_/,
    /`[^`]+`/,
    /\[.+?\]\(.+?\)/,
    /^[\s]*[-*]\s+.+$/m,
    /^\s*\d+\.\s+.+$/m,
    /^>\s+.+$/m,
    /```[\s\S]*?```/,
  ]
  return patterns.some(p => p.test(text))
}

const parseMarkdown = (text, inline = true) => {
  let html = escapeHtml(text)
  
  if (inline) {
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong style="font-weight:700;color:inherit;">$1</strong>')
    html = html.replace(/__([^_]+)__/g, '<strong style="font-weight:700;color:inherit;">$1</strong>')
    html = html.replace(/\*([^*]+)\*/g, '<em style="font-style:italic;color:inherit;">$1</em>')
    html = html.replace(/_([^_]+)_/g, '<em style="font-style:italic;color:inherit;">$1</em>')
    html = html.replace(/`([^`]+)`/g, '<code style="background:rgba(63,63,70,0.5);padding:2px 6px;border-radius:4px;font-family:monospace;font-size:12px;">$1</code>')
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
      const safeUrl = sanitizeUrl(url)
      if (!safeUrl) return `<span style="color:#A1A1AA;text-decoration:line-through;">${text}</span>`
      return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="color:#8B5CF6;text-decoration:underline;">${text}</a>`
    })
  } else {
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
      return `<pre style="background:#27272A;padding:16px;border-radius:8px;overflow-x:auto;margin:12px 0;"><code>${code.trim()}</code></pre>`
    })
    
    html = html.replace(/`([^`]+)`/g, '<code style="background:#27272A;padding:2px 6px;border-radius:4px;font-family:monospace;font-size:13px;">$1</code>')
    
    html = html.replace(/^###### (.+)$/gm, '<h6 style="color:inherit;font-size:14px;font-weight:600;margin:16px 0 8px;">$1</h6>')
    html = html.replace(/^##### (.+)$/gm, '<h5 style="color:inherit;font-size:16px;font-weight:600;margin:16px 0 8px;">$1</h5>')
    html = html.replace(/^#### (.+)$/gm, '<h4 style="color:inherit;font-size:18px;font-weight:600;margin:16px 0 8px;">$1</h4>')
    html = html.replace(/^### (.+)$/gm, '<h3 style="color:inherit;font-size:20px;font-weight:600;margin:16px 0 8px;">$1</h3>')
    html = html.replace(/^## (.+)$/gm, '<h2 style="color:inherit;font-size:22px;font-weight:600;margin:16px 0 8px;border-bottom:1px solid #3F3F46;padding-bottom:8px;">$1</h2>')
    html = html.replace(/^# (.+)$/gm, '<h1 style="color:inherit;font-size:26px;font-weight:700;margin:16px 0 12px;border-bottom:1px solid #3F3F46;padding-bottom:12px;">$1</h1>')
    
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong style="font-weight:700;color:inherit;">$1</strong>')
    html = html.replace(/__([^_]+)__/g, '<strong style="font-weight:700;color:inherit;">$1</strong>')
    html = html.replace(/\*([^*]+)\*/g, '<em style="font-style:italic;color:inherit;">$1</em>')
    html = html.replace(/_([^_]+)_/g, '<em style="font-style:italic;color:inherit;">$1</em>')
    
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
      const safeUrl = sanitizeUrl(url)
      if (!safeUrl) return `<span style="color:#A1A1AA;text-decoration:line-through;">${text}</span>`
      return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="color:#8B5CF6;text-decoration:underline;">${text}</a>`
    })
    
    html = html.replace(/^[\-\*] (.+)$/gm, '<li style="color:inherit;margin:4px 0;padding-left:8px;">• $1</li>')
    html = html.replace(/^\d+\. (.+)$/gm, '<li style="color:inherit;margin:4px 0;padding-left:8px;list-style:decimal;">$1</li>')
    
    html = html.replace(/^> (.+)$/gm, '<blockquote style="border-left:4px solid #8B5CF6;padding-left:16px;margin:12px 0;color:#A1A1AA;font-style:italic;">$1</blockquote>')
    
    html = html.replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #3F3F46;margin:20px 0;" />')
    
    html = html.replace(/\n\n/g, '</p><p style="color:inherit;margin:8px 0;line-height:1.6;">')
    html = '<p style="color:inherit;margin:8px 0;line-height:1.6;">' + html + '</p>'
    html = html.replace(/<p style="color:inherit;margin:8px 0;line-height:1.6;"><\/p>/g, '')
  }
  
  return html
}

export { parseMarkdown, hasMarkdown, escapeHtml }