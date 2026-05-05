import { useState, useEffect } from 'react'
import { PythonPreviewModal } from './PythonPreviewModal'
import { OfxPreviewModal } from './OfxPreviewModal'
import { XmlPreviewModal } from './XmlPreviewModal'
import { SqlPreviewModal } from './SqlPreviewModal'

export function CsvPreviewModal({ data, onClose }) {
  const [csvData, setCsvData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!data?.url) return
    
    fetch(data.url)
      .then(res => res.text())
      .then(text => {
        const lines = text.split('\n').filter(line => line.trim())
        const delimiter = lines[0].includes('\t') ? '\t' : ','
        const parsed = lines.map(line => {
          const cells = []
          let current = ''
          let inQuotes = false
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i]
            if (char === '"') {
              inQuotes = !inQuotes
            } else if (char === delimiter && !inQuotes) {
              cells.push(current.trim())
              current = ''
            } else {
              current += char
            }
          }
          cells.push(current.trim())
          return cells
        })
        setCsvData(parsed)
        setLoading(false)
      })
      .catch(err => {
        setError('Erro ao carregar CSV')
        setLoading(false)
      })
  }, [data?.url])

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
          background: '#18181B',
          borderRadius: 12,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid rgba(63, 63, 70, 0.5)'
        }}
      >
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(63, 63, 70, 0.5)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{
            fontSize: 16,
            fontWeight: 600,
            color: '#FAFAFA'
          }}>
            {data?.fileName || 'CSV Preview'}
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
              fontSize: 18,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>
        
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: 16
        }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: 40, color: '#71717A' }}>
              Carregando CSV...
            </div>
          )}
          
          {error && (
            <div style={{ textAlign: 'center', padding: 40, color: '#EF4444' }}>
              {error}
            </div>
          )}
          
          {csvData && csvData.length > 0 && (
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 13,
              color: '#FAFAFA'
            }}>
              <thead>
                <tr>
                  {csvData[0].map((cell, i) => (
                    <th key={i} style={{
                      padding: '10px 12px',
                      borderBottom: '2px solid rgba(139, 92, 246, 0.3)',
                      textAlign: 'left',
                      fontWeight: 600,
                      color: '#A78BFA',
                      background: 'rgba(139, 92, 246, 0.1)',
                      position: 'sticky',
                      top: 0
                    }}>
                      {cell}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {csvData.slice(1).map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} style={{
                        padding: '8px 12px',
                        borderBottom: '1px solid rgba(63, 63, 70, 0.5)'
                      }}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

export function ImagePreviewModal({ src, onClose }) {
  if (!src) return null
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
      <img
        src={src}
        alt="Preview"
        style={{
          maxWidth: '90vw',
          maxHeight: '90vh',
          borderRadius: 12,
          objectFit: 'contain'
        }}
      />
      <button
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          color: 'white',
          fontSize: 20,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        ×
      </button>
    </div>
  )
}

export function VideoPreviewModal({ videoId, onClose }) {
  if (!videoId) return null
  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.98)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        cursor: 'pointer',
        padding: 40
      }}
    >
      <div style={{ 
        position: 'relative', 
        width: '100%', 
        maxWidth: '90vw', 
        paddingBottom: '56.25%', 
        height: 0, 
        borderRadius: 12 
      }}>
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
          title="YouTube Video"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            borderRadius: 16,
            border: 'none'
          }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          color: 'white',
          fontSize: 20,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        ×
      </button>
    </div>
  )
}

export function PdfPreviewModal({ src, onClose }) {
  if (!src) return null
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
      <iframe
        src={src}
        title="PDF Preview"
        style={{
          width: '90vw',
          height: '90vh',
          borderRadius: 12,
          border: 'none'
        }}
      />
      <button
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          color: 'white',
          fontSize: 20,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        ×
      </button>
    </div>
  )
}

export function DocPreviewModal({ data, onClose }) {
  if (!data) return null
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
      <div style={{ 
        width: '90vw', 
        height: '90vh', 
        background: '#1a1a1a', 
        borderRadius: 12, 
        overflow: 'auto', 
        padding: 20, 
        color: '#FAFAFA' 
      }}>
        <iframe 
          src={data.url} 
          title="Document Preview"
          style={{ width: '100%', height: '100%', border: 'none', borderRadius: 12 }}
        />
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          color: 'white',
          fontSize: 20,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        ×
      </button>
    </div>
  )
}

export function HtmlPreviewModal({ src, onClose }) {
  const [viewMode, setViewMode] = useState('rendered')
  const [htmlSource, setHtmlSource] = useState('')
  const [loadingSource, setLoadingSource] = useState(false)

  useEffect(() => {
    if (viewMode === 'source' && !htmlSource) {
      setLoadingSource(true)
      fetch(src)
        .then(res => res.text())
        .then(text => {
          setHtmlSource(text)
          setLoadingSource(false)
        })
        .catch(() => {
          setLoadingSource(false)
        })
    }
  }, [viewMode, src])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(htmlSource)
  }

  if (!src) return null

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
          background: '#18181B',
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
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setViewMode('rendered')}
              style={{
                padding: '6px 16px',
                background: viewMode === 'rendered' ? '#8B5CF6' : 'transparent',
                border: '1px solid #3F3F46',
                borderRadius: 6,
                color: '#FAFAFA',
                fontSize: 13,
                cursor: 'pointer'
              }}
            >
              Renderizado
            </button>
            <button
              onClick={() => setViewMode('source')}
              style={{
                padding: '6px 16px',
                background: viewMode === 'source' ? '#8B5CF6' : 'transparent',
                border: '1px solid #3F3F46',
                borderRadius: 6,
                color: '#FAFAFA',
                fontSize: 13,
                cursor: 'pointer'
              }}
            >
              Código Fonte
            </button>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {viewMode === 'source' && (
              <button
                onClick={(e) => { e.stopPropagation(); copyToClipboard() }}
                style={{
                  padding: '6px 12px',
                  background: 'transparent',
                  border: '1px solid #3F3F46',
                  borderRadius: 6,
                  color: '#A1A1AA',
                  fontSize: 12,
                  cursor: 'pointer'
                }}
              >
                Copiar
              </button>
            )}
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
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {viewMode === 'rendered' ? (
            <iframe
              src={src}
              title="HTML Preview"
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                background: 'white'
              }}
            />
          ) : (
            <div style={{ 
              width: '100%', 
              height: '100%', 
              overflow: 'auto', 
              padding: 20,
              background: '#1e1e1e'
            }}>
              {loadingSource ? (
                <div style={{ color: '#71717A', padding: 20 }}>Carregando código...</div>
              ) : htmlSource ? (
                <pre style={{ 
                  margin: 0, 
                  fontFamily: "'Consolas', 'Monaco', monospace", 
                  fontSize: 13, 
                  lineHeight: 1.6, 
                  color: '#FAFAFA',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all'
                }}>
                  <code>{htmlSource}</code>
                </pre>
              ) : (
                <div style={{ color: '#EF4444' }}>Erro ao carregar código</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function SvgPreviewModal({ src, onClose }) {
  if (!src) return null
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
      <img
        src={src}
        alt="SVG Preview"
        style={{
          maxWidth: '90vw',
          maxHeight: '90vh',
          borderRadius: 12,
          objectFit: 'contain'
        }}
      />
      <button
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          color: 'white',
          fontSize: 20,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        ×
      </button>
    </div>
  )
}

export function PreviewModals({ 
  previewImage, 
  setPreviewImage,
  previewVideo, 
  setPreviewVideo,
  previewPdf, 
  setPreviewPdf,
  previewDoc, 
  setPreviewDoc,
  previewHtml, 
  setPreviewHtml,
  previewSvg, 
  setPreviewSvg,
  previewCsv, 
  setPreviewCsv,
  previewPython,
  setPreviewPython,
  previewOfx,
  setPreviewOfx,
  previewXml,
  setPreviewXml,
  previewSql,
  setPreviewSql
}) {
  return (
    <>
      {previewImage && (
        <ImagePreviewModal 
          src={previewImage} 
          onClose={() => setPreviewImage(null)} 
        />
      )}
      
      {previewVideo && (
        <VideoPreviewModal 
          videoId={previewVideo} 
          onClose={() => setPreviewVideo(null)} 
        />
      )}
      
      {previewPdf && (
        <PdfPreviewModal 
          src={previewPdf} 
          onClose={() => setPreviewPdf(null)} 
        />
      )}
      
      {previewDoc && (
        <DocPreviewModal 
          data={previewDoc} 
          onClose={() => setPreviewDoc(null)} 
        />
      )}
      
      {previewHtml && (
        <HtmlPreviewModal 
          src={previewHtml} 
          onClose={() => setPreviewHtml(null)} 
        />
      )}
      
      {previewSvg && (
        <SvgPreviewModal 
          src={previewSvg} 
          onClose={() => setPreviewSvg(null)} 
        />
      )}
      
      {previewCsv && (
        <CsvPreviewModal 
          data={previewCsv} 
          onClose={() => setPreviewCsv(null)} 
        />
      )}
      
      {previewPython && (
        <PythonPreviewModal 
          data={previewPython} 
          onClose={() => setPreviewPython(null)} 
        />
      )}
      
      {previewOfx && (
        <OfxPreviewModal 
          data={previewOfx} 
          onClose={() => setPreviewOfx(null)} 
        />
      )}
      
      {previewXml && (
        <XmlPreviewModal 
          data={previewXml} 
          onClose={() => setPreviewXml(null)} 
        />
      )}
      
      {previewSql && (
        <SqlPreviewModal 
          data={previewSql} 
          onClose={() => setPreviewSql(null)} 
        />
      )}
    </>
  )
}