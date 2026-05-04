import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { Search, X } from 'lucide-react'

export default function AddMembersModal({ groupId, currentMembers, onClose, onSuccess }) {
  const { user, addGroupMember } = useAuth()
  const [users, setUsers] = useState([])
  const [selectedMembers, setSelectedMembers] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchUsers, setSearchUsers] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .neq('id', user.id)
    
    if (data) {
      const filtered = data.filter(u => u.username)
      setUsers(filtered)
    }
  }

  const toggleMember = (userId) => {
    if (selectedMembers.includes(userId)) {
      setSelectedMembers(prev => prev.filter(id => id !== userId))
    } else {
      setSelectedMembers(prev => [...prev, userId])
    }
  }

  const handleAdd = async () => {
    if (selectedMembers.length === 0) return

    setAdding(true)
    let errors = []

    for (const userId of selectedMembers) {
      const { error } = await addGroupMember(groupId, userId)
      if (error) {
        errors.push(error.message)
      }
    }

    setAdding(false)

    if (errors.length > 0) {
      alert('Alguns usuários não puderam ser adicionados: ' + errors.join(', '))
    } else {
      onSuccess()
    }
  }

  const currentMemberIds = currentMembers.map(m => m.user_id || m.id)

  const availableUsers = users.filter(u => !currentMemberIds.includes(u.id))

  const filteredUsers = availableUsers.filter(u => 
    u.username?.toLowerCase().includes(searchUsers.toLowerCase())
  )

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }} onClick={onClose}>
      <div style={{
        width: 480,
        maxHeight: '80vh',
        background: '#18181B',
        borderRadius: 16,
        border: '1px solid rgba(63, 63, 70, 0.5)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(63, 63, 70, 0.5)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 600,
            color: '#FAFAFA'
          }}>
            Adicionar Membros
          </h2>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
              fontSize: 18,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>

        <div style={{
          padding: '24px',
          flex: 1,
          overflowY: 'auto'
        }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 500,
              color: '#A1A1AA',
              marginBottom: 8
            }}>
              Selecionar Membros ({selectedMembers.length} selecionados)
            </label>
            
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <Search size={16} color="#71717A" style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none'
              }} />
              <input
                type="text"
                value={searchUsers}
                onChange={(e) => setSearchUsers(e.target.value)}
                placeholder="Buscar usuários..."
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  background: 'rgba(39, 39, 42, 0.8)',
                  border: '1px solid rgba(63, 63, 70, 0.5)',
                  borderRadius: 8,
                  color: '#FAFAFA',
                  fontSize: 12,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {filteredUsers.length === 0 ? (
              <div style={{
                padding: 20,
                textAlign: 'center',
                color: '#71717A',
                fontSize: 13
              }}>
                {availableUsers.length === 0 
                  ? 'Todos os usuários já são membros deste grupo'
                  : 'Nenhum usuário encontrado'}
              </div>
            ) : (
              <div style={{
                maxHeight: 250,
                overflowY: 'auto',
                border: '1px solid rgba(63, 63, 70, 0.3)',
                borderRadius: 10
              }}>
                {filteredUsers.map(u => (
                  <div
                    key={u.id}
                    onClick={() => toggleMember(u.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 12px',
                      cursor: 'pointer',
                      background: selectedMembers.includes(u.id) ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                      borderBottom: '1px solid rgba(63, 63, 70, 0.3)',
                      transition: 'background 100ms ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!selectedMembers.includes(u.id)) {
                        e.currentTarget.style.background = 'rgba(63, 63, 70, 0.3)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!selectedMembers.includes(u.id)) {
                        e.currentTarget.style.background = 'transparent'
                      }
                    }}
                  >
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'white',
                      flexShrink: 0,
                      overflow: 'hidden'
                    }}>
                      {u.avatar_url ? (
                        <img 
                          src={u.avatar_url} 
                          alt={u.username}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        u.username?.charAt(0).toUpperCase() || '?'
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 13,
                        color: '#FAFAFA',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {u.username}
                      </div>
                    </div>
                    {selectedMembers.includes(u.id) && (
                      <div style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: 'rgba(139, 92, 246, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        color: '#A78BFA'
                      }}>
                        ✓
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid rgba(63, 63, 70, 0.5)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 12
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: 'rgba(63, 63, 70, 0.3)',
              border: '1px solid rgba(63, 63, 70, 0.5)',
              borderRadius: 10,
              color: '#A1A1AA',
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 200ms ease'
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleAdd}
            disabled={adding || selectedMembers.length === 0}
            style={{
              padding: '10px 20px',
              background: (adding || selectedMembers.length === 0) 
                ? 'rgba(63, 63, 70, 0.3)' 
                : 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
              border: 'none',
              borderRadius: 10,
              color: 'white',
              fontSize: 13,
              fontWeight: 600,
              cursor: (adding || selectedMembers.length === 0) ? 'not-allowed' : 'pointer',
              opacity: (adding || selectedMembers.length === 0) ? 0.5 : 1,
              transition: 'all 200ms ease'
            }}
          >
            {adding ? 'Adicionando...' : 'Adicionar Membros'}
          </button>
        </div>
      </div>
    </div>
  )
}