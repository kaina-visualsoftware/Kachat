import { parseFileMessage, renderTextWithLinks } from '../utils/linkDetector.jsx'
import { FileText, FileSpreadsheet, FileJson, FileCode } from 'lucide-react'
import { theme, fileColors } from '../theme'

export function renderMessageContent(content, isMe, sender, {
  setPreviewImage,
  setPreviewPdf,
  setPreviewDoc,
  setPreviewHtml,
  setPreviewSvg,
  setPreviewCsv,
  setPreviewPython,
  setPreviewOfx,
  setPreviewXml,
  setPreviewSql
}) {
  // System messages
  if (content.startsWith('📋') || content.startsWith('🕐') || content.startsWith('📅') || 
      content.startsWith('🏓') || content.startsWith('🎲') || content.startsWith('🪙') || 
      content.startsWith('🔀') || content.startsWith('¯') || content.startsWith('(╯') || 
      content.startsWith('┬─') || content.startsWith('( ͡°') || content.startsWith('📱') || 
      content.startsWith('⏱️') || content.startsWith('__CLEAR__')) {
    
    if (content === '__CLEAR__') return null
    
    const isSystem = content.startsWith('📋') || content.startsWith('🕐') || 
                      content.startsWith('📅') || content.startsWith('🏓') || 
                      content.startsWith('⏱️') || content.startsWith('📱')
    
    return (
      <div style={{
        fontSize: 12,
        color: isSystem ? theme.textMuted : theme.text,
        fontStyle: isSystem ? 'italic' : 'normal',
        padding: '4px 8px',
        textAlign: 'center'
      }}>
        {content}
      </div>
    )
  }
  
  // Check for YouTube
  const youtubeMatch = content.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)
  if (youtubeMatch) {
    const videoId = youtubeMatch[1]
    return (
      <div style={{ marginTop: 8 }}>
        <div style={{ 
          position: 'relative', 
          paddingBottom: '56.25%', 
          height: 0,
          borderRadius: 12,
          overflow: 'hidden'
        }}>
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            title="YouTube Video"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              border: 'none'
            }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    )
  }
  
  // File message
  const fileData = parseFileMessage(content)
  if (fileData) {
    const { url, fileName, fileType, fileSize } = fileData
    
    // Image
    if (fileType.startsWith('image/')) {
      return (
        <div style={{ marginTop: 8, maxWidth: 300 }}>
          <img 
            src={url} 
            alt={fileName}
            style={{ 
              maxWidth: '100%', 
              borderRadius: 12,
              cursor: 'pointer'
            }}
            onClick={() => setPreviewImage?.(url)}
          />
          <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4, color: theme.text }}>
            {fileName} ({(fileSize / 1024).toFixed(1)} KB)
          </div>
        </div>
      )
    }
    
    // Video
    if (fileType.startsWith('video/')) {
      return (
        <video controls style={{ maxWidth: 300, borderRadius: 12, marginTop: 8 }}>
          <source src={url} type={fileType} />
        </video>
      )
    }
    
    // Audio
    if (fileType.startsWith('audio/')) {
      return (
        <div style={{ marginTop: 8, width: '100%', maxWidth: 600 }}>
          <audio 
            controls 
            style={{ 
              width: '100%', 
              borderRadius: 8,
              background: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              padding: '4px 8px',
              height: 40,
              color: theme.text
            }}
          >
            <source src={url} type={fileType} />
          </audio>
          <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4, color: theme.text }}>
            {fileName} ({(fileSize / 1024).toFixed(1)} KB)
          </div>
        </div>
      )
    }
    
    // PDF
    if (fileName.endsWith('.pdf') || fileType === 'application/pdf') {
      const colors = fileColors.pdf
      return (
        <div style={{ marginTop: 8, cursor: 'pointer' }} onClick={() => setPreviewPdf?.(url)}>
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: 8, 
            padding: '12px 16px', background: colors.bg, 
            border: `2px solid ${colors.border}`, borderRadius: 12, color: theme.text
          }}>
            <FileText size={18} color={colors.icon} />
            <div>
              <div style={{ fontWeight: 600, color: colors.text }}>{fileName}</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>{(fileSize / 1024).toFixed(1)} KB</div>
            </div>
          </div>
        </div>
      )
    }
    
    // TXT/MD
    if (fileType === 'text/plain' || fileType === 'text/markdown' || fileName.endsWith('.txt') || fileName.endsWith('.md')) {
      const colors = fileColors.txt
      return (
        <div style={{ marginTop: 8, cursor: 'pointer' }} onClick={() => setPreviewDoc?.({ url, fileName, fileType })}>
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: 8, 
            padding: '12px 16px', background: colors.bg, 
            border: `2px solid ${colors.border}`, borderRadius: 12, color: theme.text
          }}>
            <FileText size={18} color={colors.icon} />
            <div>
              <div style={{ fontWeight: 600, color: colors.text }}>{fileName}</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>{(fileSize / 1024).toFixed(1)} KB</div>
            </div>
          </div>
        </div>
      )
    }
    
    // HTML
    if (fileType === 'text/html' || fileName.endsWith('.html') || fileName.endsWith('.htm')) {
      const colors = fileColors.html
      return (
        <div style={{ marginTop: 8, cursor: 'pointer' }} onClick={() => setPreviewHtml?.(url)}>
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: 8, 
            padding: '12px 16px', background: colors.bg, 
            border: `2px solid ${colors.border}`, borderRadius: 12, color: theme.text
          }}>
            <FileText size={18} color={colors.icon} />
            <div>
              <div style={{ fontWeight: 600, color: colors.text }}>{fileName}</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>{(fileSize / 1024).toFixed(1)} KB</div>
            </div>
          </div>
        </div>
      )
    }
    
    // SVG
    if (fileName.endsWith('.svg') || fileType === 'image/svg+xml') {
      return (
        <div style={{ marginTop: 8, maxWidth: 300 }}>
          <img src={url} alt={fileName} style={{ maxWidth: '100%', borderRadius: 12, cursor: 'pointer', background: 'rgba(255, 255, 255, 0.05)' }} onClick={() => setPreviewSvg?.(url)} />
          <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4, color: theme.text }}>{fileName} ({(fileSize / 1024).toFixed(1)} KB)</div>
        </div>
      )
    }
    
    // ICO
    if (fileName.endsWith('.ico') || fileType === 'image/x-icon' || fileType === 'image/vnd.microsoft.icon') {
      return (
        <div style={{ marginTop: 8, maxWidth: 300 }}>
          <img src={url} alt={fileName} style={{ maxWidth: '100%', borderRadius: 8, cursor: 'pointer', background: 'rgba(255, 255, 255, 0.05)' }} onClick={() => setPreviewImage?.(url)} />
          <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4, color: theme.text }}>{fileName} ({(fileSize / 1024).toFixed(1)} KB)</div>
        </div>
      )
    }
    
    // CSV
    if (fileName.endsWith('.csv') || fileType === 'text/csv' || fileType === 'text/tab-separated-values') {
      const colors = fileColors.csv
      return (
        <div style={{ marginTop: 8, cursor: 'pointer' }} onClick={() => setPreviewCsv?.({ url, fileName, fileSize })}>
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: 8, 
            padding: '12px 16px', background: colors.bg, 
            border: `2px solid ${colors.border}`, borderRadius: 12, color: theme.text
          }}>
            <FileSpreadsheet size={18} color={colors.icon} />
            <div>
              <div style={{ fontWeight: 600, color: colors.text }}>{fileName}</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>{(fileSize / 1024).toFixed(1)} KB</div>
            </div>
          </div>
        </div>
      )
    }
    
    // JSON
    if (fileName.endsWith('.json') || fileType === 'application/json') {
      const colors = fileColors.json
      return (
        <div style={{ marginTop: 8, cursor: 'pointer' }} onClick={() => setPreviewDoc?.({ url, fileName, fileType: 'application/json' })}>
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: 8, 
            padding: '12px 16px', background: colors.bg, 
            border: `2px solid ${colors.border}`, borderRadius: 12, color: theme.text
          }}>
            <FileJson size={18} color={colors.icon} />
            <div>
              <div style={{ fontWeight: 600, color: colors.text }}>{fileName}</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>{(fileSize / 1024).toFixed(1)} KB</div>
            </div>
          </div>
        </div>
      )
    }
    
    // XML
    if (fileName.endsWith('.xml') || fileType === 'text/xml' || fileType === 'application/xml') {
      const colors = fileColors.xml
      return (
        <div style={{ marginTop: 8, cursor: 'pointer' }} onClick={() => setPreviewXml?.({ url, fileName, fileSize })}>
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: 8, 
            padding: '12px 16px', background: colors.bg, 
            border: `2px solid ${colors.border}`, borderRadius: 12, color: theme.text
          }}>
            <FileText size={18} color={colors.icon} />
            <div>
              <div style={{ fontWeight: 600, color: colors.text }}>{fileName}</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>{(fileSize / 1024).toFixed(1)} KB</div>
            </div>
          </div>
        </div>
      )
    }
    
    // Python (.py, .pyw)
    if (fileName.endsWith('.py') || fileName.endsWith('.pyw') || fileType === 'text/x-python' || fileType === 'application/x-python') {
      const colors = fileColors.python
      return (
        <div style={{ marginTop: 8, cursor: 'pointer' }} onClick={() => setPreviewPython?.({ url, fileName, fileSize })}>
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: 8, 
            padding: '12px 16px', background: colors.bg, 
            border: `2px solid ${colors.border}`, borderRadius: 12, color: theme.text
          }}>
            <FileCode size={18} color={colors.icon} />
            <div>
              <div style={{ fontWeight: 600, color: colors.text }}>{fileName}</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>{(fileSize / 1024).toFixed(1)} KB</div>
            </div>
          </div>
        </div>
      )
    }
    
    // SQL (.sql)
    if (fileName.endsWith('.sql') || fileType === 'application/sql' || fileType === 'text/x-sql') {
      const colors = fileColors.sql
      return (
        <div style={{ marginTop: 8, cursor: 'pointer' }} onClick={() => setPreviewSql?.({ url, fileName, fileSize })}>
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: 8, 
            padding: '12px 16px', background: colors.bg, 
            border: `2px solid ${colors.border}`, borderRadius: 12, color: theme.text
          }}>
            <FileCode size={18} color={colors.icon} />
            <div>
              <div style={{ fontWeight: 600, color: colors.text }}>{fileName}</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>{(fileSize / 1024).toFixed(1)} KB</div>
            </div>
          </div>
        </div>
      )
    }
    
    // OFX (Open Financial Exchange)
    if (fileName.endsWith('.ofx') || fileType === 'application/x-ofx' || fileType === 'text/x-ofx') {
      const colors = fileColors.ofx
      return (
        <div style={{ marginTop: 8, cursor: 'pointer' }} onClick={() => setPreviewOfx?.({ url, fileName, fileSize })}>
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: 8, 
            padding: '12px 16px', background: colors.bg, 
            border: `2px solid ${colors.border}`, borderRadius: 12, color: theme.text
          }}>
            <FileCode size={18} color={colors.icon} />
            <div>
              <div style={{ fontWeight: 600, color: colors.text }}>{fileName}</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>{(fileSize / 1024).toFixed(1)} KB</div>
            </div>
          </div>
        </div>
      )
    }
    
    // TEC (Arquivo de tecnologia)
    if (fileName.endsWith('.tec') || fileType === 'application/x-tec' || fileType === 'text/x-tec') {
      const colors = fileColors.tec
      return (
        <div style={{ marginTop: 8, cursor: 'pointer' }} onClick={() => window.open(url, '_blank')}>
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: 8, 
            padding: '12px 16px', background: colors.bg, 
            border: `2px solid ${colors.border}`, borderRadius: 12, color: theme.text
          }}>
            <FileCode size={18} color={colors.icon} />
            <div>
              <div style={{ fontWeight: 600, color: colors.text }}>{fileName}</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>{(fileSize / 1024).toFixed(1)} KB</div>
            </div>
          </div>
        </div>
      )
    }
    
    // OpenOffice files (.odt, .ods, .odp)
    if (fileName.endsWith('.odt') || fileType === 'application/vnd.oasis.opendocument.text') {
      const colors = fileColors.odt
      return (
        <div style={{ marginTop: 8, cursor: 'pointer' }} onClick={() => window.open(url, '_blank')}>
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: 8, 
            padding: '12px 16px', background: colors.bg, 
            border: `2px solid ${colors.border}`, borderRadius: 12, color: theme.text
          }}>
            <FileText size={18} color={colors.icon} />
            <div>
              <div style={{ fontWeight: 600, color: colors.text }}>{fileName}</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>{(fileSize / 1024).toFixed(1)} KB - Documento ODT</div>
            </div>
          </div>
        </div>
      )
    }
    
    if (fileName.endsWith('.ods') || fileType === 'application/vnd.oasis.opendocument.spreadsheet') {
      const colors = fileColors.ods
      return (
        <div style={{ marginTop: 8, cursor: 'pointer' }} onClick={() => window.open(url, '_blank')}>
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: 8, 
            padding: '12px 16px', background: colors.bg, 
            border: `2px solid ${colors.border}`, borderRadius: 12, color: theme.text
          }}>
            <FileSpreadsheet size={18} color={colors.icon} />
            <div>
              <div style={{ fontWeight: 600, color: colors.text }}>{fileName}</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>{(fileSize / 1024).toFixed(1)} KB - Planilha ODS</div>
            </div>
          </div>
        </div>
      )
    }
    
    if (fileName.endsWith('.odp') || fileType === 'application/vnd.oasis.opendocument.presentation') {
      const colors = fileColors.odp
      return (
        <div style={{ marginTop: 8, cursor: 'pointer' }} onClick={() => window.open(url, '_blank')}>
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: 8, 
            padding: '12px 16px', background: colors.bg, 
            border: `2px solid ${colors.border}`, borderRadius: 12, color: theme.text
          }}>
            <FileText size={18} color={colors.icon} />
            <div>
              <div style={{ fontWeight: 600, color: colors.text }}>{fileName}</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>{(fileSize / 1024).toFixed(1)} KB - Apresentação ODP</div>
            </div>
          </div>
        </div>
      )
    }
    
    // Generic file
    return (
      <div style={{ marginTop: 8 }}>
        <div style={{ 
          padding: '12px 16px', 
          background: fileColors.default.bg, 
          border: `2px solid ${fileColors.default.border}`, 
          borderRadius: 12 
        }}>
          <div style={{ color: fileColors.default.text, fontWeight: 600 }}>{fileName}</div>
          <div style={{ fontSize: 11, opacity: 0.8, color: theme.text }}>{(fileSize / 1024).toFixed(1)} KB</div>
        </div>
      </div>
    )
  }
  
  // Plain text with links
  const renderedParts = renderTextWithLinks(content, isMe)
  
  if (!Array.isArray(renderedParts)) {
    return <span style={{ color: theme.text }}>{content}</span>
  }

  return renderedParts.map((part) => {
    if (part.type === 'youtube') {
      return (
        <div key={part.key} style={{ marginTop: 8, maxWidth: 300 }}>
          <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: 12, overflow: 'hidden' }}>
            <iframe src={`https://www.youtube.com/embed/${part.videoId}`} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          </div>
        </div>
      )
    }
    if (part.type === 'link') {
      return <a key={part.key} href={part.url} target="_blank" rel="noopener noreferrer" style={{ color: theme.text, textDecoration: 'underline', fontWeight: 500 }}>{part.url}</a>
    }
    return <span key={part.key} style={{ color: theme.text }}>{part.content}</span>
  })
}