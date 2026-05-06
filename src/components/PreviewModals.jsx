import { useState, useEffect } from 'react'
import { PythonPreviewModal } from './PythonPreviewModal'
import { OfxPreviewModal } from './OfxPreviewModal'
import { XmlPreviewModal } from './XmlPreviewModal'
import { SqlPreviewModal } from './SqlPreviewModal'
import { JsoncPreviewModal } from './JsoncPreviewModal'
import { CsvPreviewModal } from './CsvPreviewModal'
import { ArchivePreviewModal } from './ArchivePreviewModal'
import { CodePreviewModal } from './CodePreviewModal'
import { MarkdownPreviewModal } from './MarkdownPreviewModal'
import { EnhancedHtmlPreviewModal } from './HtmlPreviewModal'

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
  setPreviewSql,
  previewJsonc,
  setPreviewJsonc,
  previewJson,
  setPreviewJson,
  previewMd,
  setPreviewMd,
  previewCode,
  setPreviewCode,
  previewArchive,
  setPreviewArchive
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
      
      {previewJsonc && (
        <JsoncPreviewModal 
          data={previewJsonc} 
          onClose={() => setPreviewJsonc(null)} 
        />
      )}
      
      {previewArchive && (
        <ArchivePreviewModal 
          data={previewArchive} 
          onClose={() => setPreviewArchive(null)} 
        />
      )}
      
      {previewJson && (
        <JsoncPreviewModal 
          data={previewJson} 
          onClose={() => setPreviewJson(null)} 
        />
      )}
      
      {previewMd && (
        <MarkdownPreviewModal 
          data={previewMd} 
          onClose={() => setPreviewMd(null)} 
        />
      )}
      
      {previewCode && (
        <CodePreviewModal 
          data={previewCode} 
          onClose={() => setPreviewCode(null)} 
        />
      )}
    </>
  )
}