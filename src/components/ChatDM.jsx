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
  const [status, setStatus] = useState('Conectando...')
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (!user || !receiverId) return

    loadMessages()
    loadReceiverName()

    // Inscrição Realtime para DMs
    const channel = supabase.channel(`dm_${[user.id, receiverId].sort().join('_')}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'direct_messages',
          filter: `sender_id=eq.${user.id},receiver_id=eq.${receiverId}`
        },
        (payload) => {
          console.log('Nova DM recebida:', payload)
          setMessages(prev => [...prev, payload.new])
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

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 20, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <button onClick={() => navigate('/')} style={{ padding: '8px 16px' }}>← Voltar</button>
        <h2 style={{ margin: 0 }}>Chat com {receiverName || '...'}</h2>
        <div style={{ 
          padding: '5px 10px', 
          borderRadius: 5,
          backgroundColor: status === 'SUBSCRIBED' ? '#d4edda' : '#f8d7da',
          color: status === 'SUBSCRIBED' ? '#155724' : '#721c24'
        }}>
          {status === 'SUBSCRIBED' ? '✓' : '⚠'}
        </div>
      </div>
      <div style={{ flex: 1, border: '1px solid #ccc', borderRadius: 5, padding: 10, overflowY: 'scroll', marginBottom: 10 }}>
        {messages.length === 0 ? (
          <p style={{ color: '#999', textAlign: 'center' }}>Nenhuma mensagem ainda</p>
        ) : (
          messages.map(m => (
            <div 
              key={m.id} 
              style={{ 
                margin: '5px 0', 
                textAlign: m.sender_id === user.id ? 'right' : 'left'
              }}
            >
              <div style={{ 
                display: 'inline-block',
                background: m.sender_id === user.id ? '#007bff' : '#e9ecef',
                color: m.sender_id === user.id ? 'white' : 'black',
                padding: '8px 12px',
                borderRadius: 15,
                maxWidth: '70%'
              }}>
                {m.content}
                <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>
                  {new Date(m.created_at).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage} style={{ display: 'flex', gap: 10 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Digite sua mensagem..."
          style={{ flex: 1, padding: 8, borderRadius: 5, border: '1px solid #ccc' }}
        />
        <button type="submit" style={{ padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: 5 }}>
          Enviar
        </button>
      </form>
    </div>
  )
}
