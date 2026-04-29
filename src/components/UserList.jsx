import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function UserList() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    loadUsers()
  }, [user])

  const loadUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username')
      .neq('id', user.id) // Exclui o próprio usuário
    if (!error) setUsers(data)
    setLoading(false)
  }

  const startChat = (userId) => {
    navigate(`/chat/${userId}`)
  }

  if (loading) return <div>Carregando usuários...</div>

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Usuários</h1>
        <button onClick={signOut} style={{ padding: '8px 16px' }}>Sair</button>
      </div>
      <div style={{ border: '1px solid #ccc', borderRadius: 5 }}>
        {users.length === 0 ? (
          <p style={{ padding: 20, color: '#999' }}>Nenhum usuário encontrado</p>
        ) : (
          users.map(u => (
            <div 
              key={u.id} 
              onClick={() => startChat(u.id)}
              style={{ 
                padding: 15, 
                borderBottom: '1px solid #eee', 
                cursor: 'pointer',
                ':hover': { backgroundColor: '#f5f5f5' }
              }}
            >
              <strong>{u.username}</strong>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
