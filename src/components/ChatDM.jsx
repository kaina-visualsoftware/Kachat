import { useEffect, useState, useRef } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Circle, MessageSquare, Upload, FileText, Download, X } from 'lucide-react'
import { extractYouTubeVideoId, renderTextWithLinks, parseFileMessage } from '../utils/linkDetector.jsx'

export default function ChatDM() {
  const { receiverId } = useParams()
  const { user, uploadChatFiles } = useAuth()
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [receiverName, setReceiverName] = useState('')
  const [currentUserName, setCurrentUserName] = useState('')
  const [status, setStatus] = useState('connecting')
  const messagesEndRef = useRef(null)
  
  // File upload states
  const [selectedFiles, setSelectedFiles] = useState([])
  const [previews, setPreviews] = useState([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)
  
  // Image preview state
  const [previewImage, setPreviewImage] = useState(null)
  const [previewVideo, setPreviewVideo] = useState(null)

  useEffect(() => {
    if (!user || !receiverId) return

    loadMessages()
    loadReceiverName()
    loadCurrentUserName()

    const channel = supabase.channel(`dm_${[user.id, receiverId].sort().join('_')}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'direct_messages'
        },
        (payload) => {
          const msg = payload.new
          const isRelevant = 
            (msg.sender_id === user.id && msg.receiver_id === receiverId) ||
            (msg.sender_id === receiverId && msg.receiver_id === user.id)
          
          if (isRelevant) {
            setMessages(prev => [...prev, msg])
          }
        }
      )
      .subscribe((status) => {
        setStatus(status)
      })

    return () => supabase.removeChannel(channel)
  }, [user, receiverId])

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from('direct_messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`)
      .order('created_at')
    
    if (!error && data) {
      setMessages(data)
    }
  }

  const loadReceiverName = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', receiverId)
      .single()
    
    if (data) setReceiverName(data.username)
  }

  const loadCurrentUserName = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', user.id)
      .single()
    
    if (data) setCurrentUserName(data.username)
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!input.trim()) return

    const { error } = await supabase.from('direct_messages').insert({
      sender_id: user.id,
      receiver_id: receiverId,
      content: input
    })

    if (!error) {
      setInput('')
    }
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    
    // Validate file sizes (max 100MB each)
    const maxSize = 100 * 1024 * 1024
    const invalid = files.filter(f => f.size > maxSize)
    if (invalid.length > 0) {
      alert(`Arquivos muito grandes (máx 100MB): ${invalid.map(f => f.name).join(', ')}`)
      return
    }
    
    setSelectedFiles(files)
    
    // Create preview URLs for images
    const newPreviews = files.map(file => ({
      file,
      url: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      name: file.name,
      size: file.size,
      type: file.type
    }))
    
    setPreviews(newPreviews)
  }

  const sendFiles = async () => {
    if (selectedFiles.length === 0) return
    
    setUploading(true)
    try {
      const result = await uploadChatFiles(selectedFiles, receiverId)
      if (result.error) throw result.error
      
      // Send a message for each file
      for (const fileData of result.data) {
        const messageContent = `[file]${fileData.url}|${fileData.fileName}|${fileData.fileType}|${fileData.fileSize}[/file]`
        
        await supabase.from('direct_messages').insert({
          sender_id: user.id,
          receiver_id: receiverId,
          content: messageContent
        })
      }
      
      // Clear selection
      setSelectedFiles([])
      setPreviews([])
      // Revoke preview URLs
      previews.forEach(p => {
        if (p.url) URL.revokeObjectURL(p.url)
      })
    } catch (error) {
      alert('Erro no upload: ' + error.message)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const getSenderName = (message) => {
    if (message.sender_id === user.id) {
      return currentUserName || 'Você'
    }
    return receiverName || 'Contato'
  }

  const getInitials = (name) => {
    return name?.charAt(0).toUpperCase() || '?'
  }

  const renderMessageContent = (content, isMe) => {
    // First check if it's a file message
    const fileData = parseFileMessage(content)
    if (fileData) {
      const { url, fileName, fileType, fileSize } = fileData
      
      // Image or GIF: show inline
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
              onClick={() => setPreviewImage(url)}
            />
            <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4, color: isMe ? '#BFDBFE' : '#818CF8' }}>
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
      
      // Generic file download
      return (
        <a
          href={url}
          download={fileName}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 16px',
            background: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: 12,
            color: isMe ? '#BFDBFE' : '#818CF8',
            textDecoration: 'none',
            marginTop: 8
          }}
        >
          <Download size={16} />
          <div>
            <div style={{ fontWeight: 500 }}>{fileName}</div>
            <div style={{ fontSize: 11, opacity: 0.7 }}>
              {(fileSize / 1024).toFixed(1)} KB
            </div>
          </div>
        </a>
      )
    }
    
    // Otherwise render as text with links/YouTube
    const renderedParts = renderTextWithLinks(content, isMe)
    
    if (!Array.isArray(renderedParts)) {
      return <span style={{ color: '#FAFAFA' }}>{content}</span>
    }

    return renderedParts.map((part) => {
      if (part.type === 'youtube') {
        return (
          <div key={part.key} style={{ marginTop: 8, marginBottom: 4, width: '100%', maxWidth: 560, cursor: 'pointer' }}
               onClick={() => setPreviewVideo(part.videoId)}>
            <div style={{ 
              position: 'relative', 
              width: '100%', 
              paddingBottom: '56.25%', 
              height: 0, 
              overflow: 'hidden', 
              borderRadius: 16, 
              background: '#000',
              boxShadow: '0 8px 32px rgba(139, 92, 246, 0.3)'
            }}>
              <iframe
                src={`https://www.youtube.com/embed/${part.videoId}?autoplay=0&rel=0&modestbranding=1&showinfo=0`}
                title="YouTube Video"
                style={{
                  position: 'absolute',
                  top:0,
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
            <div style={{ fontSize: 11, color: isMe ? '#BFDBFE' : '#818CF8', marginTop: 4, opacity: 0.7 }}>
              🎬 Clique para ampliar
            </div>
          </div>
        )
      }
    })
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#09090B',
      margin: 0,
      padding: 0,
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        background: 'rgba(24, 24, 27, 0.98)',
        borderBottom: '1px solid rgba(63, 63, 70, 0.5)',
        minHeight: 64
      }}>
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            background: 'rgba(63, 63, 70, 0.3)',
            border: '1px solid rgba(63, 63, 70, 0.5)',
            borderRadius: 10,
            color: '#A1A1AA',
            cursor: 'pointer',
            transition: 'all 200ms ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(139, 92, 246, 0.15)'
            e.target.style.color = '#A78BFA'
            e.target.style.borderColor = 'rgba(139, 92, 246, 0.3)'
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(63, 63, 70, 0.3)'
            e.target.style.color = '#A1A1AA'
            e.target.style.borderColor = 'rgba(63, 63, 70, 0.5)'
          }}
        >
          <ArrowLeft size={16} />
        </button>

        {/* Avatar do contato */}
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          fontWeight: 600,
          color: 'white',
          flexShrink: 0
        }}>
          {getInitials(receiverName)}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#FAFAFA'
          }}>
            {receiverName || 'Carregando...'}
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11,
            color: status === 'SUBSCRIBED' ? '#10B981' : '#71717A'
          }}>
            <Circle 
              size={6} 
              color={status === 'SUBSCRIBED' ? '#10B981' : '#71717A'} 
              fill={status === 'SUBSCRIBED' ? '#10B981' : '#71717A'} 
            />
            {status === 'SUBSCRIBED' ? 'Online' : 'Conectando...'}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div style={{
        flex: 1,
        overflowY: 'scroll',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        background: 'linear-gradient(180deg, #09090B 0%, rgba(24, 24, 27, 0.5) 100%)'
      }}>
        {messages.length === 0 ? (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#71717A',
            fontSize: 13,
            textAlign: 'center',
            gap: 12
          }}>
            <MessageSquare size={48} color="rgba(139, 92, 246, 0.3)" />
            <div>
              <div style={{ fontSize: 15, fontWeight: 500, color: '#A1A1AA', marginBottom: 4 }}>
                Nenhuma mensagem ainda
              </div>
              <div style={{ fontSize: 12 }}>
                Seja o primeiro a enviar uma mensagem!
              </div>
            </div>
          </div>
        ) : (
          messages.map((m, index) => {
            const isMe = m.sender_id === user.id
            return (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isMe ? 'flex-end' : 'flex-start',
                  animation: 'fadeInUp 300ms ease forwards',
                  opacity: 0,
                  animationDelay: `${Math.min(index * 30, 500)}ms`,
                  animationFillMode: 'forwards'
                }}
              >
                {/* Sender Name */}
                <div style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: 'rgba(250, 250, 250, 0.4)',
                  marginBottom: 4,
                  paddingLeft: isMe ? 0 : 8,
                  paddingRight: isMe ? 8 : 0
                }}>
                  {getSenderName(m)}
                </div>

                {/* Message Bubble */}
                <div style={{
                  maxWidth: '90%',
                  padding: '10px 14px',
                  background: isMe 
                    ? 'rgba(139, 92, 246, 0.2)' 
                    : 'rgba(39, 39, 42, 0.9)',
                  border: '1px solid',
                  borderColor: isMe 
                    ? 'rgba(139, 92, 246, 0.3)' 
                    : 'rgba(63, 63, 70, 0.5)',
                  borderLeft: `3px solid ${isMe ? '#8B5CF6' : 'transparent'}`,
                  borderRadius: 14,
                  borderTopRightRadius: isMe ? 4 : 14,
                  borderTopLeftRadius: isMe ? 14 : 4,
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                  wordWrap: 'break-word'
                }}>
                  <div style={{
                    fontSize: 13,
                    color: '#FAFAFA',
                    lineHeight: 1.5,
                    marginBottom: 6
                  }}>
                    {renderMessageContent(m.content, isMe)}
                  </div>
                  <div style={{
                    fontSize: 10,
                    color: 'rgba(250, 250, 250, 0.3)',
                    textAlign: 'right'
                  }}>
                    {new Date(m.created_at).toLocaleTimeString('pt-BR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>
            )
          })
        )}
      <div ref={messagesEndRef} />
       </div>

      {/* Input Area */}
      <div style={{
        padding: '12px 16px',
        background: 'rgba(24, 24, 27, 0.98)',
        borderTop: '1px solid rgba(63, 63, 70, 0.5)'
      }}>
        {/* File Preview UI */}
        {previews.length > 0 && (
          <div style={{
            padding: 12,
            background: 'rgba(39, 39, 42, 0.8)',
            borderRadius: 12,
            marginBottom: 12,
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            maxHeight: 200,
            overflowY: 'auto'
          }}>
            {previews.map((preview, index) => (
              <div key={index} style={{
                position: 'relative',
                width: preview.url ? 100 : 'auto',
                borderRadius: 8,
                overflow: 'hidden',
                background: 'rgba(63, 63, 70, 0.5)',
                padding: preview.url ? 0 : 8
              }}>
                {preview.url ? (
                  <>
                    <img 
                      src={preview.url} 
                      alt={preview.name}
                      style={{ width: '100%', height: 80, objectFit: 'cover' }}
                    />
                    <div style={{
                      padding: '4px 8px',
                      fontSize: 10,
                      color: '#A1A1AA',
                      background: 'rgba(0, 0, 0, 0.5)'
                    }}>
                      {(preview.size / 1024).toFixed(1)} KB
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: 8 }}>
                    <FileText size={16} color="#A78BFA" />
                    <div>
                      <div style={{ fontSize: 12, color: '#FAFAFA' }}>{preview.name}</div>
                      <div style={{ fontSize: 10, color: '#71717A' }}>
                        {(preview.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => {
                    const newPreviews = previews.filter((_, i) => i !== index)
                    setPreviews(newPreviews)
                    setSelectedFiles(newPreviews.map(p => p.file))
                    if (preview.url) URL.revokeObjectURL(preview.url)
                  }}
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: 'rgba(239, 68, 68, 0.8)',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12
                  }}
                >
                  ×
                </button>
              </div>
            ))}

            {/* Send Files Button */}
            <div style={{ width: '100%', marginTop: 8, display: 'flex', gap: 8 }}>
              <button
                onClick={sendFiles}
                disabled={uploading}
                style={{
                  flex: 1,
                  padding: '8px 16px',
                  background: uploading ? 'rgba(139, 92, 246, 0.5)' : 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
                  border: 'none',
                  borderRadius: 8,
                  color: 'white',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: uploading ? 'not-allowed' : 'pointer'
                }}
              >
                {uploading ? 'Enviando...' : `Enviar ${previews.length} arquivo(s)`}
              </button>
              <button
                onClick={() => {
                  previews.forEach(p => {
                    if (p.url) URL.revokeObjectURL(p.url)
                  })
                  setPreviews([])
                  setSelectedFiles([])
                }}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(63, 63, 70, 0.5)',
                  border: '1px solid rgba(63, 63, 70, 0.8)',
                  borderRadius: 8,
                  color: '#A1A1AA',
                  fontSize: 13,
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        <form onSubmit={sendMessage} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            accept="*/*"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 44,
              height: 44,
              background: uploading ? 'rgba(63, 63, 70, 0.3)' : 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: 12,
              color: uploading ? '#71717A' : '#A78BFA',
              cursor: uploading ? 'not-allowed' : 'pointer',
              transition: 'all 200ms ease',
              opacity: uploading ? 0.5 : 1,
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              if (!uploading) {
                e.target.style.background = 'rgba(139, 92, 246, 0.2)'
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.background = uploading ? 'rgba(63, 63, 70, 0.3)' : 'rgba(139, 92, 246, 0.1)'
            }}
          >
            <Upload size={16} />
          </button>

          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Digite sua mensagem..."
            style={{
              flex: 1,
              padding: '12px 16px',
              background: 'rgba(39, 39, 42, 0.8)',
              border: '1px solid rgba(63, 63, 70, 0.5)',
              borderRadius: 12,
              color: '#FAFAFA',
              fontSize: 13,
              outline: 'none',
              transition: 'all 200ms ease'
            }}
            onFocus={(e) => {
              e.target.style.border = '1px solid rgba(139, 92, 246, 0.5)'
              e.target.style.background = 'rgba(39, 39, 42, 1)'
            }}
            onBlur={(e) => {
              e.target.style.border = '1px solid rgba(63, 63, 70, 0.5)'
              e.target.style.background = 'rgba(39, 39, 42, 0.8)'
            }}
          />
          <button
            type="submit"
            disabled={!input.trim()}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 44,
              height: 44,
              background: input.trim() 
                ? 'linear-gradient(135deg, #8B5CF6, #7C3AED)' 
                : 'rgba(63, 63, 70, 0.3)',
              border: 'none',
              borderRadius: 12,
              color: 'white',
              cursor: input.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 200ms ease',
              opacity: input.trim() ? 1 : 0.5,
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              if (input.trim()) {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.4)'
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = 'none'
            }}
          >
            <Send size={16} />
          </button>
        </form>
      </div>

      {/* Animation Keyframes */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Scrollbar styling */
        div::-webkit-scrollbar {
          width: 6px;
        }
        div::-webkit-scrollbar-track {
          background: transparent;
        }
        div::-webkit-scrollbar-thumb {
          background: rgba(63, 63, 70, 0.5);
          border-radius: 3px;
        }
        div::-webkit-scrollbar-thumb:hover {
          background: rgba(63, 63, 70, 0.8);
        }
      `}</style>

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            cursor: 'pointer'
          }}
        >
          <img 
            src={previewImage} 
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
              setPreviewImage(null)
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
      )}

      {/* YouTube Video Modal */}
      {previewVideo && (
        <div 
          onClick={() => setPreviewVideo(null)}
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
            padding: 20
          }}
        >
          <div style={{ 
            position: 'relative', 
            width: '100%', 
            maxWidth: 900, 
            paddingBottom: '56.25%', 
            height: 0, 
            borderRadius: 16 
          }}>
            <iframe
              src={`https://www.youtube.com/embed/${previewVideo}?autoplay=1&rel=0`}
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
              setPreviewVideo(null)
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
      )}
    </div>
  )
}
