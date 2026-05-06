import { useState, useEffect } from 'react'
import { X, Copy, Download, FileText, Code, Eye } from 'lucide-react'

const parseMarkdown = (md) => {
  let html = md
  
  // Escape HTML first
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  
  // Code blocks (```language ... ```)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre style="background:#27272A;padding:16px;border-radius:8px;overflow-x:auto;margin:12px 0;"><code>${code.trim()}</code></pre>`
  })
  
  // Inline code (`code`)
  html = html.replace(/`([^`]+)`/g, '<code style="background:#27272A;padding:2px 6px;border-radius:4px;font-family:monospace;font-size:13px;">$1</code>')
  
  // Headers
  html = html.replace(/^###### (.+)$/gm, '<h6 style="color:#FAFAFA;font-size:14px;font-weight:600;margin:16px 0 8px;">$1</h6>')
  html = html.replace(/^##### (.+)$/gm, '<h5 style="color:#FAFAFA;font-size:16px;font-weight:600;margin:16px 0 8px;">$1</h5>')
  html = html.replace(/^#### (.+)$/gm, '<h4 style="color:#FAFAFA;font-size:18px;font-weight:600;margin:16px 0 8px;">$1</h4>')
  html = html.replace(/^### (.+)$/gm, '<h3 style="color:#FAFAFA;font-size:20px;font-weight:600;margin:16px 0 8px;">$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2 style="color:#FAFAFA;font-size:22px;font-weight:600;margin:16px 0 8px;border-bottom:1px solid #3F3F46;padding-bottom:8px;">$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1 style="color:#FAFAFA;font-size:26px;font-weight:700;margin:16px 0 12px;border-bottom:1px solid #3F3F46;padding-bottom:12px;">$1</h1>')
  
  // Bold (**text** or __text__)
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong style="font-weight:700;color:#FAFAFA;">$1</strong>')
  html = html.replace(/__([^_]+)__/g, '<strong style="font-weight:700;color:#FAFAFA;">$1</strong>')
  
  // Italic (*text* or _text_)
  html = html.replace(/\*([^*]+)\*/g, '<em style="color:#D4D4D8;">$1</em>')
  html = html.replace(/_([^_]+)_/g, '<em style="color:#D4D4D8;">$1</em>')
  
  // Strikethrough (~~text~~)
  html = html.replace(/~~([^~]+)~~/g, '<del style="color:#71717A;">$1</del>')
  
  // Links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color:#8B5CF6;text-decoration:underline;">$1</a>')
  
  // Images ![alt](url)
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:8px;margin:12px 0;" />')
  
  // Unordered lists
  html = html.replace(/^[\-\*] (.+)$/gm, '<li style="color:#D4D4D8;margin:4px 0;padding-left:8px;">• $1</li>')
  
  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li style="color:#D4D4D8;margin:4px 0;padding-left:8px;list-style:decimal;">$1</li>')
  
  // Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote style="border-left:4px solid #8B5CF6;padding-left:16px;margin:12px 0;color:#A1A1AA;font-style:italic;">$1</blockquote>')
  
  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #3F3F46;margin:20px 0;" />')
  
  // Paragraphs
  html = html.replace(/\n\n/g, '</p><p style="color:#D4D4D8;margin:8px 0;line-height:1.6;">')
  html = '<p style="color:#D4D4D8;margin:8px 0;line-height:1.6;">' + html + '</p>'
  
  // Clean up empty paragraphs
  html = html.replace(/<p style="color:#D4D4D8;margin:8px 0;line-height:1.6;"><\/p>/g, '')
  
  return html
}

export function MarkdownPreviewModal({ data, onClose }) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showRaw, setShowRaw] = useState(false)

  useEffect(() => {
    if (!data?.url) return
    
    setLoading(true)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    
    fetch(data.url, { signal: controller.signal })
      .then(res => res.text())
      .then(text => {
        setContent(text)
        setLoading(false)
      })
      .catch(err => {
        setError(err.name === 'AbortError' ? 'Tempo limite excedido' : 'Erro ao carregar arquivo')
        setLoading(false)
      })
    
    return () => clearTimeout(timeout)
  }, [data?.url])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content)
  }

  const downloadFile = () => {
    const link = document.createElement('a')
    link.href = data.url
    link.download = data.fileName
    link.click()
  }

  const renderedHtml = parseMarkdown(content)

  return (
    <div onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.95)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 9999, cursor: 'pointer', padding: 20
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 800, height: '90vh', background: '#18181B',
        borderRadius: 16, border: '1px solid #3F3F46', display: 'flex',
        flexDirection: 'column', overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '12px 16px', borderBottom: '1px solid #3F3F46',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: '#27272A', flexWrap: 'wrap', gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ 
              width: 36, height: 36, borderRadius: 8, 
              background: 'linear-gradient(135deg, #083FA1, #0F4C81)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <FileText size={20} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ color: '#FAFAFA', fontWeight: 600, fontSize: 14 }}>
                {data?.fileName || 'Markdown File'}
              </div>
              <div style={{ color: '#71717A', fontSize: 12 }}>
                Markdown • {content.split('\n').length} linhas
                {data?.fileSize ? ` • ${(data.fileSize / 1024).toFixed(1)} KB` : ''}
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={(e) => { e.stopPropagation(); setShowRaw(!showRaw) }}
              style={{
                padding: '6px 12px', background: showRaw ? '#083FA1' : 'transparent',
                border: '1px solid #3F3F46', borderRadius: 6, color: showRaw ? 'white' : '#A1A1AA',
                fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
              }}>
              <Code size={14} /> {showRaw ? 'Visualizar' : 'Código'}
            </button>
            <button onClick={(e) => { e.stopPropagation(); copyToClipboard() }}
              style={{
                padding: '6px 12px', background: 'transparent', border: '1px solid #3F3F46',
                borderRadius: 6, color: '#A1A1AA', fontSize: 12, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4
              }}>
              <Copy size={14} /> Copiar
            </button>
            <button onClick={(e) => { e.stopPropagation(); downloadFile() }}
              style={{
                padding: '6px 12px', background: 'transparent', border: '1px solid #3F3F46',
                borderRadius: 6, color: '#A1A1AA', fontSize: 12, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4
              }}>
              <Download size={14} /> Baixar
            </button>
            <button onClick={(e) => { e.stopPropagation(); onClose() }}
              style={{
                width: 32, height: 32, borderRadius: '50%', background: 'transparent',
                border: 'none', color: '#A1A1AA', fontSize: 20, cursor: 'pointer'
              }}>×</button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: 24, background: '#18181B' }}>
          {loading && <div style={{ color: '#71717A', textAlign: 'center', padding: 40 }}>Carregando...</div>}
          {error && <div style={{ color: '#EF4444', textAlign: 'center', padding: 40 }}>{error}</div>}
          
          {!loading && !error && content && showRaw && (
            <pre style={{ 
              margin: 0, padding: 16, background: '#27272A', borderRadius: 12,
              fontFamily: "'Consolas', monospace", fontSize: 13, lineHeight: 1.6,
              color: '#D4D4D8', overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all'
            }}>
              {content}
            </pre>
          )}
          
          {!loading && !error && content && !showRaw && (
            <div 
              style={{ color: '#D4D4D8', lineHeight: 1.7, fontSize: 15 }}
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          )}
        </div>
      </div>
    </div>
  )
}