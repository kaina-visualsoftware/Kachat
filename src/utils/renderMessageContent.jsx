import { parseFileMessage, renderTextWithLinks } from '../utils/linkDetector.jsx'
import { parseMarkdown, hasMarkdown } from '../utils/markdownParser.jsx'
import { FileText, FileSpreadsheet, FileJson, FileCode, FileArchive, Terminal, FileCode2, FileType } from 'lucide-react'
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
  setPreviewSql,
  setPreviewJsonc,
  setPreviewJson,
  setPreviewMd,
  setPreviewCode,
  setPreviewArchive
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
    
    // TXT only (plain text files, excluding .md)
    if ((fileType === 'text/plain' || fileName.endsWith('.txt')) && fileName && !fileName.toLowerCase().endsWith('.md')) {
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
        <div style={{ marginTop: 8, cursor: 'pointer' }} onClick={() => setPreviewHtml?.({ url, fileName, fileSize })}>
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
    
    // SVG - Blocked for security (can contain scripts)
    if (fileName.endsWith('.svg') || fileType === 'image/svg+xml') {
      return (
        <div style={{ marginTop: 8, cursor: 'pointer' }} onClick={() => window.open(url, '_blank')}>
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: 8, 
            padding: '12px 16px', background: 'rgba(63, 63, 70, 0.5)', 
            borderRadius: 12, border: `1px solid ${theme.border || '#3F3F46'}` 
          }}>
            <FileText size={24} style={{ color: '#fbbf24' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: theme.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileName}</div>
              <div style={{ fontSize: 11, opacity: 0.7, color: theme.subtext }}>{(fileSize / 1024).toFixed(1)} KB • Baixar para visualizar</div>
            </div>
          </div>
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
    const jsonExtensions = ['.json']
    const isJsonFile = jsonExtensions.some(ext => fileName.toLowerCase().endsWith(ext))
    const isJsonType = fileType === 'application/json' || fileType === 'text/json'
    if (isJsonFile || isJsonType) {
      const colors = fileColors.json
      return (
        <div style={{ marginTop: 8, cursor: 'pointer' }} onClick={() => setPreviewJson?.({ url, fileName, fileSize })}>
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
    const ofxTypes = ['application/x-ofx', 'application/x-ofx+xml', 'text/x-ofx', 'text/x-ofx+xml', 'application/vnd.intu.qbo', 'text/plain']
    const isOfxFile = fileName.toLowerCase().endsWith('.ofx') || ofxTypes.includes(fileType?.toLowerCase())
    if (isOfxFile) {
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
    
    // JSONC (JSON with Comments)
    if (fileName.endsWith('.jsonc') || fileName.endsWith('.json5') || fileType === 'application/jsonc') {
      const colors = { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.4)', icon: '#F59E0B', text: '#F59E0B' }
      return (
        <div style={{ marginTop: 8, cursor: 'pointer' }} onClick={() => setPreviewJsonc?.({ url, fileName, fileSize })}>
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: 8, 
            padding: '12px 16px', background: colors.bg, 
            border: `2px solid ${colors.border}`, borderRadius: 12, color: theme.text
          }}>
            <FileJson size={18} color={colors.icon} />
            <div>
              <div style={{ fontWeight: 600, color: colors.text }}>{fileName}</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>{(fileSize / 1024).toFixed(1)} KB - JSON com comentários</div>
            </div>
          </div>
        </div>
      )
    }
    
    // Archive files (ZIP, RAR, 7Z)
    if (fileName.endsWith('.zip') || fileName.endsWith('.rar') || fileName.endsWith('.7z') || 
        fileName.endsWith('.tar') || fileName.endsWith('.gz') || fileType?.includes('zip') || fileType?.includes('compressed')) {
      const colors = { bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.4)', icon: '#3B82F6', text: '#3B82F6' }
      return (
        <div style={{ marginTop: 8, cursor: 'pointer' }} onClick={() => setPreviewArchive?.({ url, fileName, fileSize })}>
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: 8, 
            padding: '12px 16px', background: colors.bg, 
            border: `2px solid ${colors.border}`, borderRadius: 12, color: theme.text
          }}>
            <FileArchive size={18} color={colors.icon} />
            <div>
              <div style={{ fontWeight: 600, color: colors.text }}>{fileName}</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>{(fileSize / 1024).toFixed(1)} KB - Arquivo compactado</div>
            </div>
          </div>
        </div>
      )
    }
    
    // BAT/CMD scripts
    if (fileName.endsWith('.bat') || fileName.endsWith('.cmd') || fileType === 'application/x-bat') {
      const colors = { bg: 'rgba(139, 92, 246, 0.1)', border: 'rgba(139, 92, 246, 0.4)', icon: '#8B5CF6', text: '#8B5CF6' }
      return (
        <div style={{ marginTop: 8, cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); e.preventDefault(); setPreviewCode?.({ url, fileName, fileSize }) }}>
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: 8, 
            padding: '12px 16px', background: colors.bg, 
            border: `2px solid ${colors.border}`, borderRadius: 12, color: theme.text
          }}>
            <Terminal size={18} color={colors.icon} />
            <div>
              <div style={{ fontWeight: 600, color: colors.text }}>{fileName}</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>Script Batch</div>
            </div>
          </div>
        </div>
      )
    }
    
    // Markdown (.md, .markdown)
    const mdExtensions = ['.md', '.markdown']
    const isMdFile = mdExtensions.some(ext => fileName.toLowerCase().endsWith(ext))
    const isMdType = fileType === 'text/markdown' || fileType === 'text/x-markdown' || fileType === 'text/x-web-markdown'
    if (isMdFile || isMdType) {
      const colors = fileColors.md
      return (
        <div style={{ marginTop: 8, cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); e.preventDefault(); setPreviewMd?.({ url, fileName, fileSize }) }}>
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: 8, 
            padding: '12px 16px', background: colors.bg, 
            border: `2px solid ${colors.border}`, borderRadius: 12, color: theme.text
          }}>
            <FileText size={18} color={colors.icon} />
            <div>
              <div style={{ fontWeight: 600, color: colors.text }}>{fileName}</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>{(fileSize / 1024).toFixed(1)} KB - Markdown</div>
            </div>
          </div>
        </div>
      )
    }
    
    // JavaScript (.js, .mjs, .cjs)
    if (fileName.toLowerCase().endsWith('.js') || fileName.toLowerCase().endsWith('.mjs') || fileName.toLowerCase().endsWith('.cjs') || fileName.toLowerCase().endsWith('.jsx')) {
      const colors = fileColors.js
      return (
        <div style={{ marginTop: 8, cursor: 'pointer' }} onClick={() => setPreviewCode?.({ url, fileName, fileSize })}>
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: 8, 
            padding: '12px 16px', background: colors.bg, 
            border: `2px solid ${colors.border}`, borderRadius: 12, color: theme.text
          }}>
            <FileCode2 size={18} color={colors.icon} />
            <div>
              <div style={{ fontWeight: 600, color: colors.text }}>{fileName}</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>JavaScript</div>
            </div>
          </div>
        </div>
      )
    }
    
    // TypeScript (.ts, .tsx)
    if (fileName.toLowerCase().endsWith('.ts') || fileName.toLowerCase().endsWith('.tsx') || fileName.toLowerCase().endsWith('.mts') || fileName.toLowerCase().endsWith('.cts')) {
      const colors = fileColors.ts
      return (
        <div style={{ marginTop: 8, cursor: 'pointer' }} onClick={() => setPreviewCode?.({ url, fileName, fileSize })}>
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: 8, 
            padding: '12px 16px', background: colors.bg, 
            border: `2px solid ${colors.border}`, borderRadius: 12, color: theme.text
          }}>
            <FileCode2 size={18} color={colors.icon} />
            <div>
              <div style={{ fontWeight: 600, color: colors.text }}>{fileName}</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>TypeScript</div>
            </div>
          </div>
        </div>
      )
    }
    
    // C / C++ (.c, .h, .cpp, .hpp, .cc, .cxx)
    if (fileName.toLowerCase().endsWith('.c') || fileName.toLowerCase().endsWith('.h') || 
        fileName.toLowerCase().endsWith('.cpp') || fileName.toLowerCase().endsWith('.hpp') ||
        fileName.toLowerCase().endsWith('.cc') || fileName.toLowerCase().endsWith('.cxx')) {
      const colors = fileName.toLowerCase().endsWith('.cpp') || fileName.toLowerCase().endsWith('.hpp') || fileName.toLowerCase().endsWith('.cxx') || fileName.toLowerCase().endsWith('.cc') ? fileColors.cpp : fileColors.c
      return (
        <div style={{ marginTop: 8, cursor: 'pointer' }} onClick={() => setPreviewCode?.({ url, fileName, fileSize })}>
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: 8, 
            padding: '12px 16px', background: colors.bg, 
            border: `2px solid ${colors.border}`, borderRadius: 12, color: theme.text
          }}>
            <FileCode2 size={18} color={colors.icon} />
            <div>
              <div style={{ fontWeight: 600, color: colors.text }}>{fileName}</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>{fileName.toLowerCase().endsWith('.cpp') || fileName.toLowerCase().endsWith('.hpp') || fileName.toLowerCase().endsWith('.cxx') || fileName.toLowerCase().endsWith('.cc') ? 'C++' : 'C'}</div>
            </div>
          </div>
        </div>
      )
    }
    
    // Java (.java)
    if (fileName.toLowerCase().endsWith('.java')) {
      const colors = fileColors.java
      return (
        <div style={{ marginTop: 8, cursor: 'pointer' }} onClick={() => setPreviewCode?.({ url, fileName, fileSize })}>
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: 8, 
            padding: '12px 16px', background: colors.bg, 
            border: `2px solid ${colors.border}`, borderRadius: 12, color: theme.text
          }}>
            <FileCode2 size={18} color={colors.icon} />
            <div>
              <div style={{ fontWeight: 600, color: colors.text }}>{fileName}</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>Java</div>
            </div>
          </div>
        </div>
      )
    }
    
    // Go (.go)
    if (fileName.toLowerCase().endsWith('.go')) {
      const colors = fileColors.go
      return (
        <div style={{ marginTop: 8, cursor: 'pointer' }} onClick={() => setPreviewCode?.({ url, fileName, fileSize })}>
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: 8, 
            padding: '12px 16px', background: colors.bg, 
            border: `2px solid ${colors.border}`, borderRadius: 12, color: theme.text
          }}>
            <FileCode2 size={18} color={colors.icon} />
            <div>
              <div style={{ fontWeight: 600, color: colors.text }}>{fileName}</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>Go</div>
            </div>
          </div>
        </div>
      )
    }
    
    // Rust (.rs)
    if (fileName.toLowerCase().endsWith('.rs')) {
      const colors = fileColors.rust
      return (
        <div style={{ marginTop: 8, cursor: 'pointer' }} onClick={() => setPreviewCode?.({ url, fileName, fileSize })}>
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: 8, 
            padding: '12px 16px', background: colors.bg, 
            border: `2px solid ${colors.border}`, borderRadius: 12, color: theme.text
          }}>
            <FileCode2 size={18} color={colors.icon} />
            <div>
              <div style={{ fontWeight: 600, color: colors.text }}>{fileName}</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>Rust</div>
            </div>
          </div>
        </div>
      )
    }
    
    // Ruby (.rb)
    if (fileName.toLowerCase().endsWith('.rb') || fileName.toLowerCase().endsWith('.erb')) {
      const colors = fileColors.ruby
      return (
        <div style={{ marginTop: 8, cursor: 'pointer' }} onClick={() => setPreviewCode?.({ url, fileName, fileSize })}>
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: 8, 
            padding: '12px 16px', background: colors.bg, 
            border: `2px solid ${colors.border}`, borderRadius: 12, color: theme.text
          }}>
            <FileCode2 size={18} color={colors.icon} />
            <div>
              <div style={{ fontWeight: 600, color: colors.text }}>{fileName}</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>Ruby</div>
            </div>
          </div>
        </div>
      )
    }
    
    // PHP (.php)
    if (fileName.toLowerCase().endsWith('.php')) {
      const colors = fileColors.php
      return (
        <div style={{ marginTop: 8, cursor: 'pointer' }} onClick={() => setPreviewCode?.({ url, fileName, fileSize })}>
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: 8, 
            padding: '12px 16px', background: colors.bg, 
            border: `2px solid ${colors.border}`, borderRadius: 12, color: theme.text
          }}>
            <FileCode2 size={18} color={colors.icon} />
            <div>
              <div style={{ fontWeight: 600, color: colors.text }}>{fileName}</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>PHP</div>
            </div>
          </div>
        </div>
      )
    }
    
    // Shell scripts (.sh, .bash)
    if (fileName.toLowerCase().endsWith('.sh') || fileName.toLowerCase().endsWith('.bash')) {
      const colors = fileColors.shell
      return (
        <div style={{ marginTop: 8, cursor: 'pointer' }} onClick={() => setPreviewCode?.({ url, fileName, fileSize })}>
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: 8, 
            padding: '12px 16px', background: colors.bg, 
            border: `2px solid ${colors.border}`, borderRadius: 12, color: theme.text
          }}>
            <Terminal size={18} color={colors.icon} />
            <div>
              <div style={{ fontWeight: 600, color: colors.text }}>{fileName}</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>Shell Script</div>
            </div>
          </div>
        </div>
      )
    }
    
    // YAML (.yml, .yaml)
    if (fileName.toLowerCase().endsWith('.yml') || fileName.toLowerCase().endsWith('.yaml')) {
      const colors = fileColors.yaml
      return (
        <div style={{ marginTop: 8, cursor: 'pointer' }} onClick={() => setPreviewCode?.({ url, fileName, fileSize })}>
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: 8, 
            padding: '12px 16px', background: colors.bg, 
            border: `2px solid ${colors.border}`, borderRadius: 12, color: theme.text
          }}>
            <FileCode2 size={18} color={colors.icon} />
            <div>
              <div style={{ fontWeight: 600, color: colors.text }}>{fileName}</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>YAML</div>
            </div>
          </div>
        </div>
      )
    }
    
    // Git files (.gitignore, .gitattributes)
    if (fileName.toLowerCase().startsWith('.git')) {
      const colors = fileColors.git
      return (
        <div style={{ marginTop: 8, cursor: 'pointer' }} onClick={() => setPreviewCode?.({ url, fileName, fileSize })}>
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: 8, 
            padding: '12px 16px', background: colors.bg, 
            border: `2px solid ${colors.border}`, borderRadius: 12, color: theme.text
          }}>
            <FileCode2 size={18} color={colors.icon} />
            <div>
              <div style={{ fontWeight: 600, color: colors.text }}>{fileName}</div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>Git Config</div>
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
  
  // Check for markdown in text messages
  if (hasMarkdown(content)) {
    const markdownHtml = parseMarkdown(content, true)
    return (
      <span 
        style={{ 
          color: isMe ? '#FFFFFF' : theme.text,
          lineHeight: 1.5,
          wordBreak: 'break-word'
        }}
        dangerouslySetInnerHTML={{ __html: markdownHtml }}
      />
    )
  }
  
  // Plain text with links
  const renderedParts = renderTextWithLinks(content, isMe)
  
  if (!Array.isArray(renderedParts)) {
    const lines = content.split('\n')
    if (lines.length > 1) {
      return (
        <span style={{ color: isMe ? '#FFFFFF' : theme.text, whiteSpace: 'pre-wrap' }}>
          {lines.map((line, idx) => (
            <span key={idx}>
              {line}
              {idx < lines.length - 1 && <br />}
            </span>
          ))}
        </span>
      )
    }
    return <span style={{ color: isMe ? '#FFFFFF' : theme.text }}>{content}</span>
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
    if (part.type === 'text' && part.content && part.content.includes('\n')) {
      const lines = part.content.split('\n')
      return (
        <span key={part.key} style={{ color: isMe ? '#FFFFFF' : theme.text }}>
          {lines.map((line, idx) => (
            <span key={idx}>
              {line}
              {idx < lines.length - 1 && <br />}
            </span>
          ))}
        </span>
      )
    }
    return <span key={part.key} style={{ color: isMe ? '#FFFFFF' : theme.text }}>{part.content}</span>
  })
}