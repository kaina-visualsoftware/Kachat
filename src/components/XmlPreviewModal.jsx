import { useState, useEffect } from 'react'
import { X, Copy, Download } from 'lucide-react'

export function XmlPreviewModal({ data, onClose }) {
  const [xmlContent, setXmlContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!data?.url) return
    
    fetch(data.url)
      .then(res => res.text())
      .then(text => {
        setXmlContent(text)
        setLoading(false)
      })
      .catch(err => {
        setError('Erro ao carregar arquivo')
        setLoading(false)
      })
  }, [data?.url])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(xmlContent)
  }

  const downloadFile = () => {
    const link = document.createElement('a')
    link.href = data.url
    link.download = data.fileName
    link.click()
  }

  // Simple XML syntax highlighting
  const highlightXml = (line) => {
    const escaped = escapeHtml(line)
    
    // Tags
    let result = escaped.replace(/(&lt;\/?)([\w:-]+)/g, '$1<span style="color: #569CD6">$2</span>')
    
    // Attributes
    result = result.replace(/([\w:-]+)=(&quot;)/g, '<span style="color: #9CDCFE">$1</span>=<span style="color: #CE9178">$2')
    result = result.replace(/(=)(&quot;[^&]*&quot;)/g, '<span style="color: #9CDCFE">$1</span><span style="color: #CE9178">$2</span>')
    
    // Closing tags
    result = result.replace(/(\/&gt;)/g, '<span style="color: #569CD6">$1</span>')
    
    return result
  }

  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        cursor: 'pointer',
        padding: 40
      }}
    >
      <div 
        onClick={e => e.stopPropagation()}
        style={{
          width: '90vw',
          height: '90vh',
          background: '#1e1e1e',
          borderRadius: 12,
          border: '1px solid #3F3F46',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid #3F3F46',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#27272A'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ 
              width: 32, height: 32, borderRadius: 6, 
              background: 'linear-gradient(135deg, #EC4899, #DB2777)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: '#FFFFFF'
            }}>
              XML
            </div>
            <div>
              <div style={{ color: '#FAFAFA', fontWeight: 600, fontSize: 14 }}>
                {data?.fileName || 'XML File'}
              </div>
              <div style={{ color: '#71717A', fontSize: 12 }}>
                {data?.fileSize ? `${(data.fileSize / 1024).toFixed(1)} KB` : ''}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={(e) => { e.stopPropagation(); copyToClipboard() }}
              style={{
                padding: '6px 12px',
                background: 'transparent',
                border: '1px solid #3F3F46',
                borderRadius: 6,
                color: '#A1A1AA',
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <Copy size={14} /> Copiar
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); downloadFile() }}
              style={{
                padding: '6px 12px',
                background: 'transparent',
                border: '1px solid #3F3F46',
                borderRadius: 6,
                color: '#A1A1AA',
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <Download size={14} /> Baixar
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onClose() }}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'transparent',
                border: 'none',
                color: '#A1A1AA',
                fontSize: 20,
                cursor: 'pointer'
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Code Display */}
        <div style={{ flex: 1, overflow: 'auto', background: '#1e1e1e' }}>
          {loading && (
            <div style={{ color: '#71717A', textAlign: 'center', padding: 40 }}>
              Carregando...
            </div>
          )}
          {error && (
            <div style={{ color: '#EF4444', textAlign: 'center', padding: 40 }}>
              {error}
            </div>
          )}
          {xmlContent && (
            <pre style={{ 
              margin: 0, 
              padding: 20,
              fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace", 
              fontSize: 13, 
              lineHeight: 1.6, 
              color: '#D4D4D4' 
            }}>
              {xmlContent.split('\n').map((line, i) => (
                <div key={i} style={{ display: 'flex' }}>
                  <span style={{ 
                    color: '#6A9955', 
                    marginRight: 16, 
                    userSelect: 'none', 
                    minWidth: 40, 
                    textAlign: 'right' 
                  }}>
                    {i + 1}
                  </span>
                  <code 
                    style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}
                    dangerouslySetInnerHTML={{ __html: highlightXml(line) }}
                  />
                </div>
              ))}
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}