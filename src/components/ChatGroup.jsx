import { useEffect, useState, useRef } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Upload, Mic, Square, FileText, Download, X, Users, Settings, LogOut, Image as ImageIcon, MessageSquare, UserPlus } from 'lucide-react'
import AddMembersModal from './AddMembersModal'
import { renderTextWithLinks, parseFileMessage, detectCode } from '../utils/linkDetector.jsx'
import { getCommands, processCommand } from '../utils/commands'

export default function ChatGroup() {
  const { groupId } = useParams()
  const { user, profile, uploadChatFiles, getGroupMessages, sendGroupMessage, getGroupMembers, leaveGroup } = useAuth()
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [groupName, setGroupName] = useState('')
  const [members, setMembers] = useState([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('connecting')
  const [showAddMembersModal, setShowAddMembersModal] = useState(false)
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
  const [previewCsv, setPreviewCsv] = useState(null)
  const [previewSvg, setPreviewSvg] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)
  
  // Audio recording states
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState(null)
  const audioBlobRef = useRef(null)
  const [mediaRecorder, setMediaRecorder] = useState(null)
  const recordingTimerRef = useRef(null)

  // Command states
  const [showCommandList, setShowCommandList] = useState(false)
  const [filteredCommands, setFilteredCommands] = useState([])
  const [commandIndex, setCommandIndex] = useState(-1)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!user || !groupId) return
    loadGroupInfo()
    loadMessages()
    loadMembers()

    const channel = supabase.channel(`group_${groupId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'group_messages'
        },
        (payload) => {
          const msg = payload.new
          if (msg.group_id === groupId) {
            // Fetch sender info
            supabase
              .from('profiles')
              .select('id, username, avatar_url')
              .eq('id', msg.sender_id)
              .single()
              .then(({ data }) => {
                setMessages(prev => [...prev, { ...msg, sender: data }])
              })
          }
        }
      )
      .subscribe((status) => {
        setStatus(status)
      })

    return () => supabase.removeChannel(channel)
  }, [user, groupId])

  const loadGroupInfo = async () => {
    const { data } = await supabase
      .from('groups')
      .select('name')
      .eq('id', groupId)
      .single()
    
    if (data) setGroupName(data.name)
  }

  const loadMessages = async () => {
    const { data, error } = await getGroupMessages(groupId, 100)
    if (!error && data) {
      setMessages(data)
    }
    setLoading(false)
  }

  const loadMembers = async () => {
    const { data, error } = await getGroupMembers(groupId)
    if (!error && data) {
      setMembers(data)
      // Check if current user is admin
      const current = data.find(m => m.id === user.id)
      setIsAdmin(current?.role === 'admin')
    }
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!input.trim()) return
    
    // Check if it's a command
    if (input.startsWith('/')) {
      const result = processCommand(input)
      
      if (result) {
        if (result.type === 'action') {
          if (result.message === '__CLEAR__') {
            setMessages([])
          }
        } else if (result.type === 'system' || result.type === 'message') {
          const { error } = await sendGroupMessage(groupId, result.message)
        }
      }
      
      setInput('')
      setShowCommandList(false)
      inputRef.current?.focus()
      return
    }
    
    const { error } = await sendGroupMessage(groupId, input)

    if (!error) {
      setInput('')
    }
  }

  const getSenderName = (message) => {
    if (message.sender_id === user.id) {
      return profile?.username || 'Você'
    }
    return message.sender?.username || 'Usuário'
  }

  const getInitials = (name) => {
    return name?.charAt(0).toUpperCase() || '?'
  }

  const renderMessageContent = (content, isMe, sender) => {
    // Check if it's a system message
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
          color: isSystem ? '#71717A' : '#FAFAFA',
          fontStyle: isSystem ? 'italic' : 'normal',
          padding: '4px 8px',
          textAlign: 'center',
          opacity: 0.8
        }}>
          {content}
        </div>
      )
    }
    
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
                color: '#FAFAFA',
                overflow: 'visible'
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
      
      // SVG preview
      if (fileName.endsWith('.svg') || fileType === 'image/svg+xml') {
        return (
          <div style={{ marginTop: 8, maxWidth: 300 }}>
            <img 
              src={url} 
              alt={fileName}
              style={{ 
                maxWidth: '100%', 
                borderRadius: 12,
                cursor: 'pointer',
                background: 'rgba(255, 255, 255, 0.05)'
              }}
              onClick={() => setPreviewSvg(url)}
            />
            <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4, color: isMe ? '#BFDBFE' : '#818CF8' }}>
              {fileName} ({(fileSize / 1024).toFixed(1)} KB)
            </div>
          </div>
        )
      }
      
      // ICO preview
      if (fileName.endsWith('.ico') || fileType === 'image/x-icon' || fileType === 'image/vnd.microsoft.icon') {
        return (
          <div style={{ marginTop: 8, maxWidth: 300 }}>
            <img 
              src={url} 
              alt={fileName}
              style={{ 
                maxWidth: '100%', 
                borderRadius: 8,
                cursor: 'pointer',
                background: 'rgba(255, 255, 255, 0.05)'
              }}
              onClick={() => setPreviewImage(url)}
            />
            <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4, color: isMe ? '#BFDBFE' : '#818CF8' }}>
              {fileName} ({(fileSize / 1024).toFixed(1)} KB)
            </div>
          </div>
        )
      }
      
      // CSV preview
      if (fileName.endsWith('.csv') || fileType === 'text/csv' || fileType === 'text/tab-separated-values') {
        return (
          <div 
            style={{ marginTop: 8, cursor: 'pointer' }}
            onClick={() => setPreviewCsv({ url, fileName, fileSize })}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8, 
              padding: '12px 16px', 
              background: 'rgba(16, 185, 129, 0.1)', 
              border: '1px solid rgba(16, 185, 129, 0.3)', 
              borderRadius: 12,
              color: isMe ? '#6EE7B7' : '#34D399'
            }}>
              <FileText size={16} />
              <div>
                <div style={{ fontWeight: 500 }}>{fileName}</div>
                <div style={{ fontSize: 11, opacity: 0.7 }}>
                  {(fileSize / 1024).toFixed(1)} KB - Clique para visualizar tabela
                </div>
              </div>
            </div>
          </div>
        )
      }
      
      // JSON preview
      if (fileName.endsWith('.json') || fileType === 'application/json') {
        return (
          <div 
            style={{ marginTop: 8, cursor: 'pointer' }}
            onClick={() => setPreviewDoc({ url, fileName, fileType: 'application/json' })}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8, 
              padding: '12px 16px', 
              background: 'rgba(245, 158, 11, 0.1)', 
              border: '1px solid rgba(245, 158, 11, 0.3)', 
              borderRadius: 12,
              color: isMe ? '#FCD34D' : '#FBBF24'
            }}>
              <FileText size={16} />
              <div>
                <div style={{ fontWeight: 500 }}>{fileName}</div>
                <div style={{ fontSize: 11, opacity: 0.7 }}>
                  {(fileSize / 1024).toFixed(1)} KB - Clique para visualizar JSON
                </div>
              </div>
            </div>
          </div>
        )
      }
      
      // XML preview
      if (fileName.endsWith('.xml') || fileType === 'text/xml' || fileType === 'application/xml') {
        return (
          <div 
            style={{ marginTop: 8, cursor: 'pointer' }}
            onClick={() => setPreviewDoc({ url, fileName, fileType: 'text/xml' })}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8, 
              padding: '12px 16px', 
              background: 'rgba(236, 72, 153, 0.1)', 
              border: '1px solid rgba(236, 72, 153, 0.3)', 
              borderRadius: 12,
              color: isMe ? '#F9A8D4' : '#F472B6'
            }}>
              <FileText size={16} />
              <div>
                <div style={{ fontWeight: 500 }}>{fileName}</div>
                <div style={{ fontSize: 11, opacity: 0.7 }}>
                  {(fileSize / 1024).toFixed(1)} KB - Clique para visualizar XML
                </div>
              </div>
            </div>
          </div>
        )
      }
      
      // ZIP preview
      if (fileName.endsWith('.zip') || fileType === 'application/zip' || fileType === 'application/x-zip-compressed') {
        return (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8, 
            padding: '12px 16px', 
            background: 'rgba(99, 102, 241, 0.1)', 
            border: '1px solid rgba(99, 102, 241, 0.3)', 
            borderRadius: 12,
            color: isMe ? '#C7D2FE' : '#A5B4FC',
            marginTop: 8
          }}>
            <Download size={16} />
            <div>
              <div style={{ fontWeight: 500 }}>{fileName}</div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>
                {(fileSize / 1024).toFixed(1)} KB
              </div>
            </div>
          </div>
        )
      }
      
      // Generic file download
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 16px',
            background: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: 12,
            color: isMe ? '#BFDBFE' : '#818CF8',
            marginTop: 8,
            cursor: 'pointer'
          }}
          onClick={() => window.open(url, '_blank')}
        >
          <Download size={16} />
          <div>
            <div style={{ fontWeight: 500 }}>{fileName}</div>
            <div style={{ fontSize: 11, opacity: 0.7 }}>
              {(fileSize / 1024).toFixed(1)} KB
            </div>
          </div>
        </div>
      )
    }
    
    // Code preview
    const codeLang = detectCode(content)
    if (codeLang) {
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
          <div style={{
            padding: 12,
            background: 'rgba(24, 24, 27, 0.9)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderBottomLeftRadius: 8,
            borderBottomRightRadius: 8,
            fontFamily: 'monospace',
            fontSize: 12,
            color: '#FAFAFA',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            overflowX: 'auto'
          }}>
            {content}
          </div>
        </div>
      )
    }
    
    // Regular text message
    const textParts = renderTextWithLinks(content, isMe)
    if (Array.isArray(textParts)) {
      return (
        <div style={{ 
          fontSize: 13, 
          color: '#FAFAFA', 
          lineHeight: 1.5,
          marginBottom: 6,
          wordBreak: 'break-word'
        }}>
          {textParts.map((part, idx) => {
            if (part.type === 'youtube') {
              return (
                <span key={part.key}>
                  <span 
                    style={{ 
                      color: isMe ? '#60A5FA' : '#818CF8', 
                      textDecoration: 'underline',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      const videoId = part.videoId
                      window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank')
                    }}
                  >
                    {part.url}
                  </span>
                  {' '}
                </span>
              )
            } else if (part.type === 'link') {
              return (
                <span key={part.key}>
                  <span 
                    style={{ 
                      color: isMe ? '#60A5FA' : '#818CF8', 
                      textDecoration: 'underline',
                      cursor: 'pointer'
                    }}
                    onClick={() => window.open(part.url, '_blank')}
                  >
                    {part.url}
                  </span>
                  {' '}
                </span>
              )
            } else {
              return <span key={part.key}>{part.content}</span>
            }
          })}
        </div>
      )
    }
    
    return (
      <div style={{ 
        fontSize: 13, 
        color: '#FAFAFA', 
        lineHeight: 1.5,
        marginBottom: 6,
        wordBreak: 'break-word'
      }}>
        {content}
      </div>
    )
  }

  if (loading) return (
    <div style={{
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#09090B'
    }}>
      <div style={{
        padding: '16px 24px',
        background: 'rgba(24, 24, 27, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: 12,
        border: '1px solid rgba(63, 63, 70, 0.5)',
        color: '#A1A1AA',
        fontSize: 14
      }}>
        Carregando grupo...
      </div>
    </div>
  )

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
    >
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        background: 'rgba(24, 24, 27, 0.98)',
        borderBottom: '1px solid rgba(63, 63, 70, 0.5)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexShrink: 0
      }}>
        <button
          onClick={() => navigate('/groups')}
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
          title="Voltar"
        >
          <ArrowLeft size={16} />
        </button>

        <div style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          fontWeight: 600,
          color: 'white',
          flexShrink: 0
        }}>
          {getInitials(groupName)}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 16,
            fontWeight: 600,
            color: '#FAFAFA',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {groupName}
          </div>
          <div style={{
            fontSize: 11,
            color: '#71717A'
          }}>
            {members.length} membros
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowAddMembersModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              background: 'rgba(139, 92, 246, 0.15)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: 10,
              color: '#A78BFA',
              cursor: 'pointer',
              transition: 'all 200ms ease',
              marginRight: 8
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(139, 92, 246, 0.25)'
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(139, 92, 246, 0.15)'
            }}
            title="Adicionar membros"
          >
            <UserPlus size={16} />
          </button>
        )}

        <button
          onClick={() => {
            if (window.confirm('Deseja realmente sair deste grupo?')) {
              leaveGroup(groupId).then(() => {
                navigate('/groups')
              })
            }
          }}
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
            e.target.style.background = 'rgba(239, 68, 68, 0.15)'
            e.target.style.color = '#EF4444'
            e.target.style.borderColor = 'rgba(239, 68, 68, 0.3)'
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(63, 63, 70, 0.3)'
            e.target.style.color = '#A1A1AA'
            e.target.style.borderColor = 'rgba(63, 63, 70, 0.5)'
          }}
          title="Sair do grupo"
        >
          <LogOut size={16} />
        </button>
      </div>

      {/* Messages Area */}
      <div style={{
        flex: 1,
        overflowY: 'scroll',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8
      }}>
        {messages.length === 0 ? (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#71717A',
            fontSize: 13
          }}>
            <MessageSquare size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
            <div style={{ fontWeight: 500, marginBottom: 4 }}>
              Nenhuma mensagem ainda
            </div>
            <div style={{ fontSize: 12 }}>
              Seja o primeiro a enviar uma mensagem!
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
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: 8,
                  animation: 'fadeInUp 300ms ease forwards',
                  opacity: 0,
                  animationDelay: `${Math.min(index * 30, 500)}ms`,
                  animationFillMode: 'forwards',
                  flexDirection: isMe ? 'row-reverse' : 'row'
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: isMe 
                    ? 'linear-gradient(135deg, #8B5CF6, #7C3AED)' 
                    : 'linear-gradient(135deg, #3B82F6, #2563EB)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'white',
                  flexShrink: 0,
                  overflow: 'hidden'
                }}>
                  {m.sender?.avatar_url ? (
                    <img 
                      src={m.sender.avatar_url} 
                      alt="avatar"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    getInitials(m.sender?.username || 'U')
                  )}
                </div>

                {/* Message Content */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isMe ? 'flex-end' : 'flex-start',
                  flex: 1,
                  minWidth: 0
                }}>
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
                      {renderMessageContent(m.content, isMe, m.sender)}
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
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: preview.url ? 0 : '8px 12px',
                background: 'rgba(63, 63, 70, 0.3)',
                borderRadius: 8,
                position: 'relative'
              }}>
                {preview.url ? (
                  <div style={{ position: 'relative' }}>
                    <img 
                      src={preview.url} 
                      alt={preview.name}
                      style={{ 
                        width: 100, 
                        height: 100, 
                        objectFit: 'cover', 
                        borderRadius: 8 
                      }} 
                    />
                    <button
                      onClick={() => {
                        const newPreviews = previews.filter((_, i) => i !== index)
                        setPreviews(newPreviews)
                        const newFiles = selectedFiles.filter((_, i) => i !== index)
                        setSelectedFiles(newFiles)
                        if (preview.url) URL.revokeObjectURL(preview.url)
                      }}
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: 'rgba(0, 0, 0, 0.6)',
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
                ) : (
                  <>
                    <div style={{ fontSize: 12, color: '#FAFAFA' }}>{preview.name}</div>
                    <div style={{ fontSize: 10, color: '#71717A' }}>
                      {(preview.size / 1024).toFixed(1)} KB
                    </div>
                    <button
                      onClick={() => {
                        const newPreviews = previews.filter((_, i) => i !== index)
                        setPreviews(newPreviews)
                        const newFiles = selectedFiles.filter((_, i) => i !== index)
                        setSelectedFiles(newFiles)
                      }}
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#EF4444',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10
                      }}
                    >
                      ×
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        <form onSubmit={sendMessage} style={{ display: 'flex', gap: 10, alignItems: 'center', position: 'relative' }}>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={async (e) => {
              const files = Array.from(e.target.files || [])
              if (files.length === 0) return
              
              const maxSize = 100 * 1024 * 1024
              const invalid = files.filter(f => f.size > maxSize)
              if (invalid.length > 0) {
                alert(`Arquivos muito grandes (máx 100MB): ${invalid.map(f => f.name).join(', ')}`)
                return
              }
              
              setSelectedFiles(files)
              
              const newPreviews = files.map(file => ({
                file,
                url: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
                name: file.name,
                size: file.size,
                type: file.type
              }))
              
              setPreviews(newPreviews)
            }}
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
            ref={inputRef}
            value={input}
            onChange={e => {
              const value = e.target.value
              setInput(value)
              
              // Detect command
              if (value.startsWith('/')) {
                const query = value.slice(1).toLowerCase()
                const matches = getCommands().filter(c => c.name.startsWith(query))
                setFilteredCommands(matches)
                setShowCommandList(matches.length > 0 && query.length > 0)
                setCommandIndex(-1)
              } else {
                setShowCommandList(false)
              }
            }}
            onKeyDown={e => {
              // Shift + Enter = new line (default behavior)
              if (e.key === 'Enter' && e.shiftKey) {
                // Allow default behavior (new line)
                return
              }
              
              if (showCommandList && filteredCommands.length > 0) {
                if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  setCommandIndex(prev => (prev + 1) % filteredCommands.length)
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  setCommandIndex(prev => prev <= 0 ? filteredCommands.length - 1 : prev - 1)
                } else if (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey)) {
                  if (commandIndex >= 0) {
                    e.preventDefault()
                    setInput('/' + filteredCommands[commandIndex].name + ' ')
                    setShowCommandList(false)
                  }
                } else if (e.key === 'Escape') {
                  setShowCommandList(false)
                }
              }
            }}
            placeholder="Digite sua mensagem ou / para comandos..."
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
              setTimeout(() => setShowCommandList(false), 200)
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

          {/* Command Autocomplete List */}
          {showCommandList && filteredCommands.length > 0 && (
            <div style={{
              position: 'absolute',
              bottom: '100%',
              left: 0,
              right: 0,
              marginBottom: 8,
              background: 'rgba(39, 39, 42, 0.98)',
              border: '1px solid rgba(63, 63, 70, 0.5)',
              borderRadius: 12,
              maxHeight: 200,
              overflowY: 'auto',
              zIndex: 100
            }}>
              {filteredCommands.map((cmd, idx) => (
                <div
                  key={cmd.name}
                  onClick={() => {
                    setInput('/' + cmd.name + ' ')
                    setShowCommandList(false)
                    inputRef.current?.focus()
                  }}
                  style={{
                    padding: '10px 16px',
                    cursor: 'pointer',
                    background: idx === commandIndex ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                    borderBottom: idx < filteredCommands.length - 1 ? '1px solid rgba(63, 63, 70, 0.3)' : 'none',
                    transition: 'background 100ms ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)'
                    setCommandIndex(idx)
                  }}
                  onMouseLeave={(e) => {
                    if (idx !== commandIndex) {
                      e.currentTarget.style.background = 'transparent'
                    }
                  }}
                >
                  <div style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: '#FAFAFA',
                    marginBottom: 2
                  }}>
                    /{cmd.name}
                  </div>
                  <div style={{
                    fontSize: 11,
                    color: '#71717A'
                  }}>
                    {cmd.description}
                  </div>
                </div>
              ))}
            </div>
          )}
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
      `}</style>

      {/* Preview Modals (reuse from ChatDM) */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
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

      {showAddMembersModal && (
        <AddMembersModal
          groupId={groupId}
          currentMembers={members}
          onClose={() => setShowAddMembersModal(false)}
          onSuccess={() => {
            setShowAddMembersModal(false)
            loadMembers()
          }}
        />
      )}
    </div>
  )
}
