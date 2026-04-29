import { useEffect, useState, useRef } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useParams, useNavigate } from 'react-router-dom'

export default function ChatDM() {
  const { receiverId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [receiverName, setReceiverName] = useState('')
  const [currentUserName, setCurrentUserName] = useState('')
  const [status, setStatus] = useState('Conectando...')
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (!user || !receiverId) return

    loadMessages()
    loadReceiverName()
    loadCurrentUserName()

    // Inscrição Realtime para DMs (escuta ambas as direções)
    const channel = supabase.channel(`dm_${[user.id, receiverId].sort().join('_')}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'direct_messages'
        },
        (payload) => {
          const msg = payload.new
          // Filtra apenas mensagens entre os dois usuários
          const isRelevant = 
            (msg.sender_id === user.id && msg.receiver_id === receiverId) ||
            (msg.sender_id === receiverId && msg.receiver_id === user.id)
          
          if (isRelevant) {
            console.log('Nova DM recebida:', payload)
            setMessages(prev => [...prev, msg])
          }
        }
      )
      .subscribe((status) => {
        console.log('Status Realtime DM:', status)
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
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 20, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
        <button onClick={() => navigate('/')} style={{ padding: '8px 16px', border: '1px solid #ccc', borderRadius: 5, background: 'white', cursor: 'pointer' }}>← Voltar</button>
        <h2 style={{ margin: 0 }}>{receiverName || 'Carregando...'}</h2>
        <div style={{ 
          padding: '5px 10px', 
          borderRadius: 5,
          backgroundColor: status === 'SUBSCRIBED' ? '#d4edda' : '#f8d7da',
          color: status === 'SUBSCRIBED' ? '#155724' : '#721c24',
          fontSize: 12
        }}>
          {status === 'SUBSCRIBED' ? '✓ Online' : '⚠ Offline'}
        </div>
      </div>
      <div style={{ flex: 1, border: '1px solid #e0e0e0', borderRadius: 10, padding: 15, overflowY: 'scroll', marginBottom: 15, background: '#f8f9fa' }}>
        {messages.length === 0 ? (
          <p style={{ color: '#999', textAlign: 'center', marginTop: 50 }}>Nenhuma mensagem ainda. Seja o primeiro a enviar!</p>
        ) : (
          messages.map(m => {
            const isMe = m.sender_id === user.id
            return (
              <div 
                key={m.id} 
                style={{ 
                  margin: '12px 0', 
                  textAlign: isMe ? 'right' : 'left'
                }}
              >
                <div style={{ 
                  fontSize: 12,
                  color: '#666',
                  marginBottom: 4,
                  fontWeight: 500,
                  paddingLeft: isMe ? 0 : 8,
                  paddingRight: isMe ? 8 : 0
                }}>
                  {getSenderName(m)}
                </div>
                <div style={{ 
                  display: 'inline-block',
                  background: isMe ? 'linear-gradient(135deg, #007bff, #0056b3)' : 'white',
                  color: isMe ? 'white' : '#333',
                  padding: '10px 15px',
                  borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  maxWidth: '70%',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  wordWrap: 'break-word'
                }}>
                  {m.content}
                  <div style={{ fontSize: 10, opacity: 0.7, marginTop: 5, textAlign: 'right' }}>
                    {new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage} style={{ display: 'flex', gap: 10 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Digite sua mensagem..."
          style={{ flex: 1, padding: 12, borderRadius: 25, border: '1px solid #ccc', fontSize: 14 }}
        />
        <button type="submit" style={{ padding: '12px 24px', background: '#007bff', color: 'white', border: 'none', borderRadius: 25, fontWeight: 'bold', cursor: 'pointer' }}>
          Enviar
        </button>
      </form>
    </div>
  )
}
