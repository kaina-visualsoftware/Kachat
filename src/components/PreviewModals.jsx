import { useState, useEffect } from 'react'
import { PythonPreviewModal } from './PythonPreviewModal'
import { OfxPreviewModal } from './OfxPreviewModal'
import { XmlPreviewModal } from './XmlPreviewModal'
import { SqlPreviewModal } from './SqlPreviewModal'
import { JsoncPreviewModal } from './JsoncPreviewModal'
import { JsonPreviewModal } from './JsonPreviewModal'
import { CsvPreviewModal } from './CsvPreviewModal'
import { ArchivePreviewModal } from './ArchivePreviewModal'
import { CodePreviewModal } from './CodePreviewModal'
import { MarkdownPreviewModal } from './MarkdownPreviewModal'
import { EnhancedHtmlPreviewModal } from './HtmlPreviewModal'

export function ImagePreviewModal({ src, onClose }) {
  if (!src) return null

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-label="Visualização de imagem"
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
        aria-label="Fechar visualização"
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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-label="Reprodução de vídeo"
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
        cursor: 'pointer'
      }}
    >
      <div 
        onClick={e => e.stopPropagation()}
        style={{ 
          position: 'relative', 
          width: '90vw', 
          maxWidth: '1400px',
          aspectRatio: '16/9',
          borderRadius: 16,
          overflow: 'hidden'
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
        aria-label="Fechar visualização"
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
  
  const [pdfError, setPdfError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  const googleDocsUrl = src.includes('drive.google') || src.includes('googledrive')
    ? `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(src)}`
    : src

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-label="Visualização de PDF"
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
        cursor: 'pointer'
      }}
    >
      <div 
        onClick={e => e.stopPropagation()}
        role="document"
        style={{
          width: '100vw',
          height: '100vh',
          maxWidth: 'none',
          maxHeight: 'none',
          display: 'flex',
          flexDirection: 'column',
          background: '#1a1a1a'
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          background: '#27272A',
          borderBottom: '1px solid #3F3F46'
        }}>
          <span style={{ color: '#FAFAFA', fontSize: 14, fontWeight: 500 }}>Visualização de PDF</span>
          <button
            onClick={onClose}
            aria-label="Fechar visualização"
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid #3F3F46',
              color: '#FAFAFA',
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
        <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
          {isLoading && (
            <div style={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)',
              color: '#A1A1AA',
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}>
              <div style={{ 
                width: 24, height: 24, 
                border: '2px solid #3F3F46', 
                borderTopColor: '#8B5CF6', 
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              Carregando PDF...
            </div>
          )}
          {pdfError ? (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center',
              height: '100%',
              color: '#EF4444',
              gap: 16
            }}>
              <span>Erro ao carregar PDF</span>
              <a 
                href={src} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ color: '#8B5CF6', textDecoration: 'underline' }}
              >
                Abrir em nova aba
              </a>
            </div>
          ) : (
            <iframe
              src={googleDocsUrl}
              title="PDF Preview"
              onLoad={() => setIsLoading(false)}
              onError={() => { setPdfError(true); setIsLoading(false); }}
              style={{
                width: '100%',
                height: '100%',
                border: 'none'
              }}
            />
          )}
        </div>
      </div>
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
        width: '100%', 
        maxWidth: '800px', 
        maxHeight: '80vh', 
        background: '#1a1a1a', 
        borderRadius: 16, 
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
          width: '100%',
          maxWidth: '800px',
          maxHeight: '80vh',
          background: '#18181B',
          borderRadius: 16,
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
          maxWidth: '800px',
          maxHeight: '80vh',
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
  // Base styles shared by all preview modals
  const baseOverlayStyle = {
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
    padding: 20,
  };
  
  const innerModalStyle = {
    width: '100%',
    maxWidth: '800px',
    maxHeight: '80vh',
    background: '#1e1e1e',
    borderRadius: 16,
    border: '1px solid #3F3F46',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };
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
        <EnhancedHtmlPreviewModal 
          data={previewHtml} 
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
        <JsonPreviewModal 
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