import { useState, useEffect } from 'react'
import { X, Image, Video, FileText, Download, Clock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function MediaGalleryModal({ groupId, groupName, onClose }) {
  const { getGroupMedia } = useAuth()
  const [media, setMedia] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [selectedMedia, setSelectedMedia] = useState(null)

  useEffect(() => {
    loadMedia()
  }, [groupId])

  const loadMedia = async () => {
    setLoading(true)
    const { data, error } = await getGroupMedia(groupId)
    if (!error && data) {
      setMedia(data)
    }
    setLoading(false)
  }

  const isImage = (type) => type?.startsWith('image/')
  const isVideo = (type) => type?.startsWith('video/')
  const isPdf = (type) => type === 'application/pdf'
  const isDocument = (type) => type?.startsWith('text/') || ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(type)

  const filteredMedia = media.filter(item => {
    if (activeTab === 'all') return true
    if (activeTab === 'images') return isImage(item.fileType)
    if (activeTab === 'videos') return isVideo(item.fileType)
    if (activeTab === 'files') return !isImage(item.fileType) && !isVideo(item.fileType)
    return true
  })

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    const offset = -3 * 60
    const adjusted = new Date(date.getTime() + offset * 60 * 1000)
    return adjusted.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const tabs = [
    { id: 'all', label: 'Todas', icon: null },
    { id: 'images', label: 'Imagens', icon: Image },
    { id: 'videos', label: 'Vídeos', icon: Video },
    { id: 'files', label: 'Arquivos', icon: FileText }
  ]

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }} onClick={onClose}>
      <div style={{
        background: '#18181B',
        borderRadius: 16,
        width: '95%',
        maxWidth: 800,
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid #27272A'
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px',
          borderBottom: '1px solid #27272A'
        }}>
          <div>
            <h2 style={{ color: '#FAFAFA', margin: 0, fontSize: 18 }}>Mídias e Arquivos</h2>
            <p style={{ color: '#A1A1AA', margin: '4px 0 0', fontSize: 13 }}>{groupName}</p>
          </div>
          <button onClick={onClose} style={{
            background: 'none',
            border: 'none',
            color: '#A1A1AA',
            cursor: 'pointer',
            padding: 4
          }}>
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: 4,
          padding: '12px 20px',
          borderBottom: '1px solid #27272A',
          overflowX: 'auto'
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 16px',
                borderRadius: 20,
                background: activeTab === tab.id ? '#8B5CF6' : '#27272A',
                border: 'none',
                color: activeTab === tab.id ? 'white' : '#A1A1AA',
                fontSize: 13,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              {tab.icon && <tab.icon size={14} />}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: 16
        }}>
          {loading ? (
            <div style={{ color: '#A1A1AA', textAlign: 'center', padding: 40 }}>
              Carregando...
            </div>
          ) : filteredMedia.length === 0 ? (
            <div style={{ color: '#A1A1AA', textAlign: 'center', padding: 40 }}>
              Nenhum arquivo encontrado
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: 12
            }}>
              {filteredMedia.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedMedia(item)}
                  style={{
                    borderRadius: 8,
                    overflow: 'hidden',
                    background: '#27272A',
                    cursor: 'pointer',
                    position: 'relative',
                    aspectRatio: '1'
                  }}
                >
                  {isImage(item.fileType) ? (
                    <img
                      src={item.url}
                      alt={item.fileName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : isVideo(item.fileType) ? (
                    <video src={item.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 16
                    }}>
                      <FileText size={32} color="#8B5CF6" />
                      <span style={{ color: '#FAFAFA', fontSize: 11, marginTop: 8, textAlign: 'center', wordBreak: 'break-word' }}>
                        {item.fileName?.slice(0, 20)}
                      </span>
                    </div>
                  )}
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '8px 10px',
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ color: '#FAFAFA', fontSize: 10 }}>
                      {formatFileSize(item.fileSize)}
                    </span>
                    <a
                      href={item.url}
                      download={item.fileName}
                      onClick={e => e.stopPropagation()}
                      style={{ color: 'white', textDecoration: 'none' }}
                    >
                      <Download size={14} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid #27272A',
          color: '#A1A1AA',
          fontSize: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <Clock size={14} />
          {filteredMedia.length} arquivo(s)
        </div>
      </div>

      {/* Preview Modal */}
      {selectedMedia && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001
          }}
          onClick={() => setSelectedMedia(null)}
        >
          <button
            onClick={() => setSelectedMedia(null)}
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            <X size={24} />
          </button>

          {isImage(selectedMedia.fileType) ? (
            <img
              src={selectedMedia.url}
              alt={selectedMedia.fileName}
              style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }}
            />
          ) : isVideo(selectedMedia.fileType) ? (
            <video
              src={selectedMedia.url}
              controls
              style={{ maxWidth: '90%', maxHeight: '90%' }}
            />
          ) : (
            <div style={{
              textAlign: 'center',
              color: 'white'
            }}>
              <FileText size={64} color="#8B5CF6" />
              <p style={{ marginTop: 16 }}>{selectedMedia.fileName}</p>
              <p style={{ color: '#A1A1AA', fontSize: 14 }}>
                {formatFileSize(selectedMedia.fileSize)} • {formatDate(selectedMedia.createdAt)}
              </p>
              <a
                href={selectedMedia.url}
                download={selectedMedia.fileName}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 20,
                  padding: '12px 24px',
                  background: '#8B5CF6',
                  color: 'white',
                  borderRadius: 8,
                  textDecoration: 'none'
                }}
              >
                <Download size={18} />
                Baixar arquivo
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}