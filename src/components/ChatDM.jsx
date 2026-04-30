import { useEffect, useState, useRef } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Circle, MessageSquare, Upload, FileText, Download, X, Mic, Square } from 'lucide-react'
import { extractYouTubeVideoId, renderTextWithLinks, parseFileMessage, detectCode } from '../utils/linkDetector.jsx'

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
  const [previewPdf, setPreviewPdf] = useState(null)
  const [previewDoc, setPreviewDoc] = useState(null)
  const [previewHtml, setPreviewHtml] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)
  
  // Audio recording states
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState(null)
  const [mediaRecorder, setMediaRecorder] = useState(null)
  const recordingTimerRef = useRef(null)

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

  // Drag and Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
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

  // Audio recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks = []
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        setAudioBlob(blob)
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop())
      }
      
      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
      setRecordingTime(0)
      
      // Timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (err) {
      alert('Erro ao acessar microfone: ' + err.message)
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
      clearInterval(recordingTimerRef.current)
      setIsRecording(false)
    }
  }

  const sendAudio = async () => {
    if (!audioBlob) return
    
    setUploading(true)
    try {
      // Convert Blob to File object
      const file = new File(
        [audioBlob], 
        `audio_${Date.now()}.webm`, 
        { type: 'audio/webm' }
      )
      
      const result = await uploadChatFiles([file], receiverId)
      if (result.error) throw result.error
      
      // Send message
      const fileData = result.data[0]
      const messageContent = `[file]${fileData.url}|${fileData.fileName}|${fileData.fileType}|${fileData.fileSize}[/file]`
      
      await supabase.from('direct_messages').insert({
        sender_id: user.id,
        receiver_id: receiverId,
        content: messageContent
      })
      
      // Cleanup
      setAudioBlob(null)
      setRecordingTime(0)
    } catch (error) {
      alert('Erro ao enviar áudio: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const cancelRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
    }
    clearInterval(recordingTimerRef.current)
    setIsRecording(false)
    setAudioBlob(null)
    setRecordingTime(0)
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
        
        // Audio preview with player
        if (fileType.startsWith('audio/')) {
          return (
            <div style={{ marginTop: 8, width: '100%', maxWidth: 450 }}>
              <audio 
                controls 
                style={{ 
                  width: '100%', 
                  borderRadius: 8,
                  background: 'rgba(139, 92, 246, 0.1)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  padding: '4px 8px',
                  height: 40,
                  color: '#FAFAFA'
                }}
              >
                <source src={url} type={fileType} />
              </audio>
              <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4, color: isMe ? '#BFDBFE' : '#818CF8' }}>
                {fileName} ({(fileSize / 1024).toFixed(1)} KB
              </div>
            </div>
          )
        }
        
        // PDF preview
       if (fileType === 'application/pdf') {
         return (
           <div 
             style={{ marginTop: 8, cursor: 'pointer' }}
             onClick={() => setPreviewPdf(url)}
           >
             <div style={{ 
               display: 'flex', 
               alignItems: 'center', 
               gap: 8, 
               padding: '12px 16px', 
               background: 'rgba(139, 92, 246, 0.1)', 
               border: '1px solid rgba(139, 92, 246, 0.3)', 
               borderRadius: 12,
               color: isMe ? '#BFDBFE' : '#818CF8'
             }}>
               <FileText size={16} />
               <div>
                 <div style={{ fontWeight: 500 }}>{fileName}</div>
                 <div style={{ fontSize: 11, opacity: 0.7 }}>
                   {(fileSize / 1024).toFixed(1)} KB - Clique para visualizar
                 </div>
               </div>
             </div>
           </div>
         )
       }
       
       // TXT/MD preview
       if (fileType === 'text/plain' || fileType === 'text/markdown' || fileName.endsWith('.txt') || fileName.endsWith('.md')) {
         return (
           <div 
             style={{ marginTop: 8, cursor: 'pointer' }}
             onClick={() => setPreviewDoc({ url, fileName, fileType })}
           >
             <div style={{ 
               display: 'flex', 
               alignItems: 'center', 
               gap: 8, 
               padding: '12px 16px', 
               background: 'rgba(139, 92, 246, 0.1)', 
               border: '1px solid rgba(139, 92, 246, 0.3)', 
               borderRadius: 12,
               color: isMe ? '#BFDBFE' : '#818CF8'
             }}>
               <FileText size={16} />
               <div>
                 <div style={{ fontWeight: 500 }}>{fileName}</div>
                 <div style={{ fontSize: 11, opacity: 0.7 }}>
                   {(fileSize / 1024).toFixed(1)} KB - Clique para ler
                 </div>
               </div>
             </div>
           </div>
         )
       }
       
       // HTML preview
       if (fileType === 'text/html' || fileName.endsWith('.html') || fileName.endsWith('.htm')) {
         return (
           <div 
             style={{ marginTop: 8, cursor: 'pointer' }}
             onClick={() => setPreviewHtml(url)}
           >
             <div style={{ 
               display: 'flex', 
               alignItems: 'center', 
               gap: 8, 
               padding: '12px 16px', 
               background: 'rgba(139, 92, 246, 0.1)', 
               border: '1px solid rgba(139, 92, 246, 0.3)', 
               borderRadius: 12,
               color: isMe ? '#BFDBFE' : '#818CF8'
             }}>
               <FileText size={16} />
               <div>
                 <div style={{ fontWeight: 500 }}>{fileName}</div>
                 <div style={{ fontSize: 11, opacity: 0.7 }}>
                   {(fileSize / 1024).toFixed(1)} KB - Clique para visualizar HTML
                 </div>
               </div>
             </div>
           </div>
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
      
      // Code preview
      const codeLang = detectCode(content)
      if (codeLang && !fileData) {
        const langLabels = {
          sql: 'SQL',
          javascript: 'JavaScript',
          python: 'Python',
          html: 'HTML',
          css: 'CSS',
          json: 'JSON',
          bash: 'Bash',
          java: 'Java',
          cpp: 'C++',
          php: 'PHP',
          ruby: 'Ruby',
          go: 'Go',
          rust: 'Rust',
          code: 'Código'
        }
        
        const label = langLabels[codeLang] || 'Código'
        
        return (
          <div style={{ marginTop: 8, width: '100%' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              background: 'rgba(139, 92, 246, 0.2)',
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderBottom: 'none'
            }}>
              <div style={{
                fontSize: 11,
                fontWeight: 600,
                color: isMe ? '#BFDBFE' : '#A78BFA',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {label}
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(content)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: isMe ? '#BFDBFE' : '#A78BFA',
                  cursor: 'pointer',
                  fontSize: 11,
                  padding: '2px 8px',
                  borderRadius: 4,
                  transition: 'all 200ms ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(139, 92, 246, 0.2)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'none'
                }}
              >
                Copiar
              </button>
            </div>
            <pre style={{
              margin: 0,
              padding: '12px 16px',
              background: 'rgba(0, 0, 0, 0.6)',
              borderBottomLeftRadius: 8,
              borderBottomRightRadius: 8,
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderTop: 'none',
              overflowX: 'auto',
              fontSize: 12,
              lineHeight: 1.6,
              color: '#E2E8F0',
              fontFamily: "'Fira Code', 'Monaco', 'Courier New', monospace",
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all'
            }}>
              <code>{content}</code>
            </pre>
          </div>
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
    <div 
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#09090B',
        margin:0,
        padding: 0,
        overflow: 'hidden',
        position: 'relative'
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag Overlay */}
      {isDragOver && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(139, 92, 246, 0.2)',
          border: '3px dashed #8B5CF6',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            textAlign: 'center',
            color: '#A78BFA',
            fontSize: 18,
            fontWeight: 600
          }}>
            📎 Solte para enviar arquivo(s)
          </div>
        </div>
      )}

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

          {/* Audio Recording Button */}
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 44,
              height: 44,
              background: isRecording 
                ? 'rgba(239, 68, 68, 0.1)' 
                : uploading ? 'rgba(63, 63, 70, 0.3)' 
                  : 'rgba(139, 92, 246, 0.1)',
              border: isRecording 
                ? '1px solid rgba(239, 68, 68, 0.3)' 
                : '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: 12,
              color: isRecording ? '#EF4444' : uploading ? '#71717A' : '#A78BFA',
              cursor: uploading ? 'not-allowed' : 'pointer',
              transition: 'all 200ms ease',
              flexShrink: 0
            }}
            title={isRecording ? 'Parar gravação' : 'Gravar áudio'}
          >
            {isRecording ? <Square size={16} /> : <Mic size={16} />}
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

          {/* Audio Recording Status */}
          {isRecording && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '8px 16px',
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: 12,
              marginTop: 8
            }}>
              <div style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#EF4444',
                animation: 'pulse 1.5s infinite'
              }} />
              <span style={{ color: '#EF4444', fontSize: 13, flex: 1 }}>
                Gravando... {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
              </span>
              <button
                onClick={cancelRecording}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#EF4444',
                  cursor: 'pointer',
                  fontSize: 13
                }}
              >
                Cancelar
              </button>
              <button
                onClick={sendAudio}
                disabled={uploading}
                style={{
                  padding: '6px 12px',
                  background: uploading 
                    ? 'rgba(139, 92, 246, 0.5)' 
                    : 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
                  border: 'none',
                  borderRadius: 8,
                  color: 'white',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: uploading ? 'not-allowed' : 'pointer'
                }}
              >
                {uploading ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Animation Keyframes */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
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
              maxWidth: '95vw', 
              maxHeight: '95vh',
              borderRadius: 8,
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

      {/* PDF Preview Modal */}
      {previewPdf && (
        <div 
          onClick={() => setPreviewPdf(null)}
          style={{
            position: 'fixed',
            top:0,
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
            src={previewPdf}
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
              setPreviewPdf(null)
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

      {/* TXT/MD Preview Modal */}
      {previewDoc && (
        <div 
          onClick={() => setPreviewDoc(null)}
          style={{
            position: 'fixed',
            top:0,
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
              src={previewDoc.url} 
              title="Document Preview"
              style={{ width: '100%', height: '100%', border: 'none', borderRadius: 12 }}
            />
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setPreviewDoc(null)
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

      {/* HTML Preview Modal */}
      {previewHtml && (
        <div 
          onClick={() => setPreviewHtml(null)}
          style={{
            position: 'fixed',
            top:0,
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
            src={previewHtml}
            title="HTML Preview"
            sandbox="allow-scripts"
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
              setPreviewHtml(null)
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
