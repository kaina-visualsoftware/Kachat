import { useEffect, useState } from 'react'
import { supabase } from './supabase'

function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [status, setStatus] = useState('Conectando...')

  useEffect(() => {
    supabase.from('messages').select('*').order('created_at').then(({ data, error }) => {
      if (error) console.error('Erro ao carregar mensagens:', error)
      if (data) setMessages(data)
    })

    const channel = supabase.channel('messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          console.log('Nova mensagem recebida:', payload)
          setMessages(prev => [...prev, payload.new])
        }
      )
      .subscribe((status) => {
        console.log('Status do Realtime:', status)
        setStatus(status)
      })

    return () => supabase.removeChannel(channel)
  }, [])

  const send = async (e) => {
    e.preventDefault()
    if (!input.trim()) return
    const { error } = await supabase.from('messages').insert({ content: input })
    if (error) {
      console.error('Erro ao enviar:', error)
      alert('Erro ao enviar mensagem: ' + error.message)
    } else {
      setInput('')
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
      <h1>Chat Real-time</h1>
      <div style={{ 
        padding: '5px 10px', 
        marginBottom: 10, 
        borderRadius: 5,
        backgroundColor: status === 'SUBSCRIBED' ? '#d4edda' : '#f8d7da',
        color: status === 'SUBSCRIBED' ? '#155724' : '#721c24'
      }}>
        Status: {status === 'SUBSCRIBED' ? '✓ Conectado' : '⚠ ' + status}
      </div>
      <div style={{ border: '1px solid #ccc', height: 400, overflowY: 'scroll', padding: 10, marginBottom: 10 }}>
        {messages.map(m => (
          <p key={m.id} style={{ margin: '5px 0' }}>
            <strong>{new Date(m.created_at).toLocaleTimeString()}:</strong> {m.content}
          </p>
        ))}
      </div>
      <form onSubmit={send} style={{ display: 'flex', gap: 10 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Digite sua mensagem..."
          style={{ flex: 1, padding: 8 }}
        />
        <button type="submit" style={{ padding: '8px 16px' }}>Enviar</button>
      </form>
    </div>
  )
}

export default App
