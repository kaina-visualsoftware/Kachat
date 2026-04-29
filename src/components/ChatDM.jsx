import { useEffect, useState, useRef } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Circle, MessageSquare } from 'lucide-react'
import { extractYouTubeVideoId, renderTextWithLinks } from '../utils/linkDetector.jsx'
import LiteYouTubeEmbed from 'react-lite-youtube-embed'
import 'react-lite-youtube-embed/dist/LiteYouTubeEmbed.css'

export default function ChatDM() {
  const { receiverId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [receiverName, setReceiverName] = useState('')
  const [currentUserName, setCurrentUserName] = useState('')
  const [status, setStatus] = useState('connecting')
  const messagesEndRef = useRef(null)

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
    const renderedParts = renderTextWithLinks(content, isMe)
    
    if (!Array.isArray(renderedParts)) {
      return <span style={{ color: '#FAFAFA' }}>{content}</span>
    }

    return renderedParts.map((part) => {
      if (part.type === 'youtube') {
        return (
          <div key={part.key} style={{ marginTop: 8, marginBottom: 4 }}>
            <LiteYouTubeEmbed
              id={part.videoId}
              title="YouTube Video"
              poster="maxresdefault"
              style={{ borderRadius: 12, overflow: 'hidden' }}
            />
          </div>
        )
      } else if (part.type === 'link') {
        return (
          <a
            key={part.key}
            href={part.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: isMe ? '#BFDBFE' : '#818CF8',
              textDecoration: 'underline',
              wordBreak: 'break-all'
            }}
          >
            {part.url}
          </a>
        )
      } else {
        return <span key={part.key} style={{ color: '#FAFAFA' }}>{part.content}</span>
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
                  maxWidth: '65%',
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
        <form onSubmit={sendMessage} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
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
    </div>
  )
}
