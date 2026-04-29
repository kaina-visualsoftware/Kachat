import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { LogOut, Search, MessageSquare } from 'lucide-react'

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
      'linear-gradient(135deg, #8B5CF6, #7C3AED)', // Purple
      'linear-gradient(135deg, #3B82F6, #2563EB)', // Blue
      'linear-gradient(135deg, #EC4899, #DB2777)', // Pink
      'linear-gradient(135deg, #F59E0B, #D97706)', // Amber
      'linear-gradient(135deg, #10B981, #059669)', // Emerald
    ]
    const index = id ? id.charCodeAt(0) % colors.length : 0
    return colors[index]
  }

  const filteredUsers = users.filter(u => 
    u.username?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'rgba(24, 24, 27, 0.98)'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 16px 16px',
        borderBottom: '1px solid rgba(63, 63, 70, 0.5)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16
        }}>
          <h1 style={{
            margin: 0,
            fontSize: 24,
            fontWeight: 700,
            color: '#FAFAFA',
            letterSpacing: -0.5
          }}>
            Chat
          </h1>
          <button
            onClick={signOut}
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
            title="Sair"
          >
            <LogOut size={16} />
          </button>
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative' }}>
          <Search size={16} color="#71717A" style={{
            position: 'absolute',
            left: 12,
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
              padding: '10px 12px 10px 36px',
              background: 'rgba(39, 39, 42, 0.8)',
              border: '1px solid rgba(63, 63, 70, 0.5)',
              borderRadius: 10,
              color: '#FAFAFA',
              fontSize: 13,
              outline: 'none',
              transition: 'all 200ms ease',
              boxSizing: 'border-box'
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
        </div>
      </div>

      {/* User List - Scrollable */}
      <div style={{
        flex: 1,
        overflowY: 'scroll',
        padding: '8px 8px'
      }}>
        {loading ? (
          <div style={{
            padding: 20,
            textAlign: 'center',
            color: '#71717A',
            fontSize: 13
          }}>
            Carregando usuários...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{
            padding: '40px 20px',
            textAlign: 'center',
            color: '#71717A',
            fontSize: 13
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
                gap: 12,
                padding: '12px',
                marginBottom: 4,
                borderRadius: 12,
                cursor: 'pointer',
                transition: 'all 200ms ease',
                background: 'transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(63, 63, 70, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              {/* Avatar */}
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: getAvatarColor(u.id),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                fontWeight: 600,
                color: 'white',
                flexShrink: 0
              }}>
                {getInitials(u.username)}
              </div>

              {/* User Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: '#FAFAFA',
                  marginBottom: 2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {u.username}
                </div>
                <div style={{
                  fontSize: 12,
                  color: '#71717A',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <MessageSquare size={12} />
                  Clique para conversar
                </div>
              </div>

              {/* Status Indicator */}
              <div style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: '#10B981',
                flexShrink: 0,
                boxShadow: '0 0 8px rgba(16, 185, 129, 0.5)'
              }} />
            </div>
          ))
        )}
      </div>

      {/* Footer com info do usuário logado */}
      <div style={{
        padding: 16,
        borderTop: '1px solid rgba(63, 63, 70, 0.5)',
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          fontWeight: 600,
          color: 'white',
          flexShrink: 0
        }}>
          {getInitials(user?.email || 'U')}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13,
            fontWeight: 500,
            color: '#FAFAFA',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {user?.email}
          </div>
          <div style={{ fontSize: 11, color: '#71717A' }}>
            Online
          </div>
        </div>
      </div>
    </div>
  )
}
