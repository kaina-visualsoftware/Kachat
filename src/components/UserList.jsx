import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { LogOut, Search } from 'lucide-react'

export default function UserList() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    loadUsers()
  }, [user])

  const loadUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username')
      .neq('id', user.id)
    
    if (!error && data) setUsers(data)
    setLoading(false)
  }

  const startChat = (userId) => {
    navigate(`/chat/${userId}`)
  }

  const getInitials = (name) => {
    return name?.charAt(0).toUpperCase() || '?'
  }

  const getAvatarColor = (id) => {
    const colors = [
      'linear-gradient(135deg, #06B6D4, #0891B2)', // Cyan
      'linear-gradient(135deg, #3B82F6, #2563EB)', // Blue
      'linear-gradient(135deg, #8B5CF6, #7C3AED)', // Purple
      'linear-gradient(135deg, #EC4899, #DB2777)', // Pink
      'linear-gradient(135deg, #F59E0B, #D97706)', // Amber
    ]
    const index = id ? id.charCodeAt(0) % colors.length : 0
    return colors[index]
  }

  const filteredUsers = users.filter(u => 
    u.username?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
      color: 'rgba(248, 250, 252, 0.6)',
      fontSize: 14
    }}>
      Carregando usuários...
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)',
      padding: 20
    }}>
      <div style={{
        maxWidth: 600,
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24
        }}>
          <h1 style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 600,
            color: '#F8FAFC',
            letterSpacing: -0.5
          }}>
            Usuários
          </h1>
          <button
            onClick={signOut}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px',
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 12,
              color: 'rgba(248, 250, 252, 0.8)',
              fontSize: 14,
              cursor: 'pointer',
              transition: 'all 200ms ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)'
              e.target.style.color = '#F8FAFC'
              e.target.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.05)'
              e.target.style.color = 'rgba(248, 250, 252, 0.8)'
              e.target.style.transform = 'translateY(0)'
            }}
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <Search size={18} color="rgba(248, 250, 252, 0.5)" style={{
            position: 'absolute',
            left: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none'
          }} />
          <input
            type="text"
            placeholder="Buscar usuários..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 16px 14px 44px',
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 12,
              color: '#F8FAFC',
              fontSize: 14,
              outline: 'none',
              transition: 'all 200ms ease',
              boxSizing: 'border-box'
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
        </div>

        {/* User List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filteredUsers.length === 0 ? (
            <div style={{
              padding: 40,
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 16,
              color: 'rgba(248, 250, 252, 0.6)',
              fontSize: 14
            }}>
              {search ? 'Nenhum usuário encontrado' : 'Nenhum usuário disponível'}
            </div>
          ) : (
            filteredUsers.map(u => (
              <div
                key={u.id}
                onClick={() => startChat(u.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: 16,
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 16,
                  cursor: 'pointer',
                  transition: 'all 200ms ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: getAvatarColor(u.id),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  fontWeight: 600,
                  color: 'white',
                  flexShrink: 0
                }}>
                  {getInitials(u.username)}
                </div>

                {/* User Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 16,
                    fontWeight: 500,
                    color: '#F8FAFC',
                    marginBottom: 4
                  }}>
                    {u.username}
                  </div>
                  <div style={{
                    fontSize: 12,
                    color: 'rgba(248, 250, 252, 0.5)'
                  }}>
                    Clique para conversar
                  </div>
                </div>

                {/* Status Indicator */}
                <div style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: '#22C55E', // Green for online (simplified)
                  flexShrink: 0,
                  boxShadow: '0 0 8px rgba(34, 197, 94, 0.5)'
                }} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
