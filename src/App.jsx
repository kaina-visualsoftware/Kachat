import { useEffect, useState } from 'react'
import { supabase } from './supabase'

function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [status, setStatus] = useState('Conectando...')

  useEffect(() => {
    loadMessages()
    
    const channel = supabase.channel('messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          console.log('Nova msg recebida:', payload)
          setMessages(prev => [...prev, payload.new])
        }
      )
      .subscribe((status) => {
        console.log('Status Realtime:', status)
        setStatus(status)
      })

    return () => supabase.removeChannel(channel)
  }, [])

  const loadMessages = async () => {
    console.log('Carregando mensagens...')
    const { data, error } = await supabase.from('messages').select('*').order('created_at')
    console.log('Resultado:', { data, error })
    if (error) {
      console.error('Erro SELECT:', error)
      alert('Erro ao carregar: ' + error.message)
    }
    if (data) {
      console.log('Mensagens carregadas:', data.length)
      setMessages(data)
    }
  }

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
        <span style={{ marginLeft: 10 }}>| Mensagens: {messages.length}</span>
      </div>
      <div style={{ marginBottom: 10, display: 'flex', gap: 10 }}>
        <button onClick={loadMessages}>Recarregar</button>
        <button onClick={async () => {
          const { error } = await supabase.from('messages').insert({ content: 'Teste ' + Date.now() })
          if (error) alert('Erro: ' + error.message)
        }}>Inserir Teste</button>
      </div>
      <div style={{ border: '1px solid #ccc', height: 400, overflowY: 'scroll', padding: 10, marginBottom: 10 }}>
        {messages.length === 0 ? (
          <p style={{ color: '#999', textAlign: 'center' }}>Nenhuma mensagem ainda. Clique em "Inserir Teste" ou envie uma mensagem.</p>
        ) : (
          messages.map(m => (
            <p key={m.id} style={{ margin: '5px 0' }}>
              <strong>{new Date(m.created_at).toLocaleTimeString()}:</strong> {m.content}
            </p>
          ))
        )}
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
