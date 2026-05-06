import { useState, useEffect } from 'react'
import { X, Download, Archive, File, Folder, FileArchive, Terminal, FileBox } from 'lucide-react'

export function ArchivePreviewModal({ data, onClose }) {
  const [info, setInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fileName = data?.fileName || ''
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  
  const getFileType = () => {
    if (ext === 'zip') return { type: 'ZIP', icon: '📦', color: '#3B82F6', desc: 'Arquivo compactado ZIP' }
    if (ext === 'rar') return { type: 'RAR', icon: '📚', color: '#F59E0B', desc: 'Arquivo compactado RAR' }
    if (ext === '7z') return { type: '7z', icon: '📁', color: '#10B981', desc: 'Arquivo compactado 7-Zip' }
    if (ext === 'bat') return { type: 'BAT', icon: '⚡', color: '#8B5CF6', desc: 'Script em lote do Windows' }
    if (ext === 'cmd') return { type: 'CMD', icon: '⚡', color: '#8B5CF6', desc: 'Comando do Windows' }
    if (ext === 'exe') return { type: 'EXE', icon: '⚙️', color: '#EF4444', desc: 'Executável Windows' }
    if (ext === 'msi') return { type: 'MSI', icon: '📦', color: '#6366F1', desc: 'Instalador Windows' }
    return { type: ext.toUpperCase(), icon: '📄', color: '#71717A', desc: 'Arquivo compactado' }
  }

  const fileType = getFileType()
  const isExecutable = ['bat', 'cmd', 'exe', 'msi'].includes(ext)
  const isArchive = ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)

  const formatSize = (bytes) => {
    if (!bytes) return ''
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const downloadFile = () => {
    const link = document.createElement('a')
    link.href = data.url
    link.download = data.fileName
    link.click()
  }

  // For archives, we can show basic info
  // For executables, we show security warning
  const isWindows = typeof window !== 'undefined' && navigator.platform.toLowerCase().includes('win')

  return (
    <div onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.95)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 9999, cursor: 'pointer', padding: 20
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 480, background: '#18181B',
        borderRadius: 20, border: '1px solid #3F3F46', overflow: 'hidden'
      }}>
        {/* Header with Icon */}
        <div style={{
          padding: '32px 24px', textAlign: 'center',
          background: `linear-gradient(135deg, ${fileType.color}22, transparent)`,
          borderBottom: '1px solid #3F3F46'
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: 20,
            background: `linear-gradient(135deg, ${fileType.color}, ${fileType.color}88)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', fontSize: 36
          }}>
            {isArchive ? <FileArchive size={40} color="#FFFFFF" /> : 
             isExecutable ? <Terminal size={40} color="#FFFFFF" /> :
             <FileBox size={40} color="#FFFFFF" />}
          </div>
          <h2 style={{ color: '#FAFAFA', margin: 0, fontSize: 20, fontWeight: 600 }}>
            {fileName}
          </h2>
          <p style={{ color: '#71717A', margin: '8px 0 0', fontSize: 14 }}>
            {fileType.desc}
          </p>
        </div>

        {/* Info Cards */}
        <div style={{ padding: 24 }}>
          <div style={{ 
            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 24 
          }}>
            <div style={{ 
              padding: 16, background: '#27272A', borderRadius: 12,
              border: '1px solid #3F3F46'
            }}>
              <div style={{ color: '#71717A', fontSize: 12, marginBottom: 4 }}>Tipo</div>
              <div style={{ color: '#FAFAFA', fontSize: 14, fontWeight: 600 }}>{fileType.type}</div>
            </div>
            <div style={{ 
              padding: 16, background: '#27272A', borderRadius: 12,
              border: '1px solid #3F3F46'
            }}>
              <div style={{ color: '#71717A', fontSize: 12, marginBottom: 4 }}>Tamanho</div>
              <div style={{ color: '#FAFAFA', fontSize: 14, fontWeight: 600 }}>
                {formatSize(data?.fileSize) || 'Calculando...'}
              </div>
            </div>
          </div>

          {/* Warning for executables */}
          {isExecutable && (
            <div style={{
              padding: 16, background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: 12, border: '1px solid rgba(239, 68, 68, 0.3)',
              marginBottom: 24
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ color: '#EF4444', fontSize: 16 }}>⚠️</span>
                <span style={{ color: '#EF4444', fontWeight: 600 }}>Atenção</span>
              </div>
              <p style={{ color: '#A1A1AA', fontSize: 13, margin: 0, lineHeight: 1.5 }}>
                {isWindows 
                  ? 'Este arquivo pode executar comandos no seu computador. Execute apenas se confiar na fonte.'
                  : 'Arquivo executável detectado. Execute com cautela.'}
              </p>
            </div>
          )}

          {/* Info for archives */}
          {isArchive && (
            <div style={{
              padding: 16, background: 'rgba(59, 130, 246, 0.1)',
              borderRadius: 12, border: '1px solid rgba(59, 130, 246, 0.3)',
              marginBottom: 24
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Archive size={18} color="#3B82F6" />
                <span style={{ color: '#3B82F6', fontWeight: 500 }}>Arquivo compactado</span>
              </div>
              <p style={{ color: '#A1A1AA', fontSize: 13, margin: '8px 0 0', lineHeight: 1.5 }}>
                Para visualizar o conteúdo, baixe o arquivo e use um aplicativo de descompactação.
              </p>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={(e) => { e.stopPropagation(); onClose() }}
              style={{
                flex: 1, padding: '14px 20px', borderRadius: 10,
                background: '#27272A', border: '1px solid #3F3F46',
                color: '#FAFAFA', fontSize: 14, fontWeight: 500,
                cursor: 'pointer'
              }}>
              Fechar
            </button>
            <button onClick={(e) => { e.stopPropagation(); downloadFile() }}
              style={{
                flex: 1, padding: '14px 20px', borderRadius: 10,
                background: fileType.color, border: 'none',
                color: '#FFFFFF', fontSize: 14, fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 8
              }}>
              <Download size={18} /> Baixar
            </button>
          </div>

          {/* Quick actions for ZIP */}
          {ext === 'zip' && (
            <div style={{ marginTop: 24 }}>
              <p style={{ color: '#71717A', fontSize: 12, marginBottom: 8 }}>Opções rápidas</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <a 
                  href={`https://products.office.com/pt-BR/excel`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '8px 12px', background: '#27272A', borderRadius: 6,
                    color: '#A1A1AA', fontSize: 12, textDecoration: 'none'
                  }}
                >
                  Abrir com...
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}