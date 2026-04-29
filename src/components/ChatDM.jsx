import { useEffect, useState, useRef } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Circle } from 'lucide-react'

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

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '16px 20px',
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 12,
            color: 'rgba(248, 250, 252, 0.8)',
            cursor: 'pointer',
            transition: 'all 200ms ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.1)'
            e.target.style.color = '#F8FAFC'
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.05)'
            e.target.style.color = 'rgba(248, 250, 252, 0.8)'
          }}
        >
          <ArrowLeft size={18} />
        </button>

        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 16,
            fontWeight: 600,
            color: '#F8FAFC'
          }}>
            {receiverName || 'Carregando...'}
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            color: 'rgba(248, 250, 252, 0.5)'
          }}>
            <Circle 
              size={8} 
              color={status === 'SUBSCRIBED' ? '#22C55E' : '#94A3B8'} 
              fill={status === 'SUBSCRIBED' ? '#22C55E' : '#94A3B8'} 
            />
            {status === 'SUBSCRIBED' ? 'Online' : 'Conectando...'}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div style={{
        flex: 1,
        overflowY: 'scroll',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 16
      }}>
        {messages.length === 0 ? (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(248, 250, 252, 0.4)',
            fontSize: 14,
            textAlign: 'center',
            padding: 40
          }}>
            Nenhuma mensagem ainda.<br />Seja o primeiro a enviar!
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
                  animationDelay: `${index * 50}ms`,
                  animationFillMode: 'forwards'
                }}
              >
                {/* Sender Name */}
                <div style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'rgba(248, 250, 252, 0.5)',
                  marginBottom: 6,
                  paddingLeft: isMe ? 0 : 12,
                  paddingRight: isMe ? 12 : 0
                }}>
                  {getSenderName(m)}
                </div>

                {/* Message Bubble */}
                <div style={{
                  maxWidth: '70%',
                  padding: '12px 16px',
                  background: isMe 
                    ? 'rgba(6, 182, 212, 0.15)' 
                    : 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid',
                  borderColor: isMe 
                    ? 'rgba(6, 182, 212, 0.2)' 
                    : 'rgba(255, 255, 255, 0.1)',
                  borderLeft: `3px solid ${isMe ? '#06B6D4' : 'transparent'}`,
                  borderRadius: 16,
                  borderTopRightRadius: isMe ? 4 : 16,
                  borderTopLeftRadius: isMe ? 16 : 4,
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                  wordWrap: 'break-word'
                }}>
                  <div style={{
                    fontSize: 14,
                    color: '#F8FAFC',
                    lineHeight: 1.5,
                    marginBottom: 8
                  }}>
                    {m.content}
                  </div>
                  <div style={{
                    fontSize: 11,
                    color: 'rgba(248, 250, 252, 0.4)',
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
        padding: 20,
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <form onSubmit={sendMessage} style={{ display: 'flex', gap: 12 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Digite sua mensagem..."
            style={{
              flex: 1,
              padding: '14px 16px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 14,
              color: '#F8FAFC',
              fontSize: 14,
              outline: 'none',
              transition: 'all 200ms ease'
            }}
            onFocus={(e) => {
              e.target.style.border = '1px solid rgba(6, 182, 212, 0.5)'
              e.target.style.background = 'rgba(255, 255, 255, 0.08)'
            }}
            onBlur={(e) => {
              e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)'
              e.target.style.background = 'rgba(255, 255, 255, 0.05)'
            }}
          />
          <button
            type="submit"
            disabled={!input.trim()}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              background: input.trim() 
                ? 'linear-gradient(135deg, #06B6D4, #3B82F6)' 
                : 'rgba(255, 255, 255, 0.05)',
              border: 'none',
              borderRadius: 14,
              color: 'white',
              cursor: input.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 200ms ease',
              opacity: input.trim() ? 1 : 0.5
            }}
            onMouseEnter={(e) => {
              if (input.trim()) {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 4px 12px rgba(6, 182, 212, 0.4)'
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = 'none'
            }}
          >
            <Send size={18} />
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
      `}</style>
    </div>
  )
}
