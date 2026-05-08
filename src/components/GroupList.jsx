import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { LogOut, Search, MessageSquare, Plus, Users, Settings } from 'lucide-react'

export default function GroupList() {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [lastMessages, setLastMessages] = useState({})
  const { user, signOut, getGroups, profile } = useAuth()
  const navigate = useNavigate()
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    loadGroups()
    loadLastMessages()
  }, [user])

  const loadGroups = async () => {
    const { data, error } = await getGroups()
    if (!error && data) setGroups(data)
    setLoading(false)
  }

  const loadLastMessages = async () => {
    if (!user?.id) return
    
    const { data: messages } = await supabase
      .from('group_messages')
      .select('group_id, sender_id, created_at')
      .order('created_at', { ascending: false })
    
    if (!messages) return
    
    const lastByGroup = {}
    messages.forEach(msg => {
      if (!lastByGroup[msg.group_id] || new Date(msg.created_at) > new Date(lastByGroup[msg.group_id].created_at)) {
        lastByGroup[msg.group_id] = msg
      }
    })
    
    setLastMessages(lastByGroup)
  }

  useEffect(() => {
    const channel = supabase
      .channel('grouplist_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'group_messages'
      }, () => {
        loadLastMessages()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  const openGroup = (groupId) => {
    navigate(`/group/${groupId}`)
  }

  const filteredGroups = groups.filter(g => 
    g.name?.toLowerCase().includes(search.toLowerCase())
  )

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

  if (loading) return (
    <div style={{
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(24, 24, 27, 0.98)',
      color: '#71717A',
      fontSize: 13
    }}>
      Carregando grupos...
    </div>
  )

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'rgba(24, 24, 27, 0.98)',
      margin: 0,
      padding: 0
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
            Grupos
          </h1>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
              border: 'none',
              borderRadius: 10,
              color: 'white',
              cursor: 'pointer',
              transition: 'all 200ms ease'
            }}
            onMouseEnter={(e) => { e.target.style.transform = 'scale(1.1)' }}
            onMouseLeave={(e) => { e.target.style.transform = 'scale(1)' }}
            title="Criar grupo"
          >
            <Plus size={16} />
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
            placeholder="Buscar grupos..."
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

      {/* Group List - Scrollable */}
      <div style={{
        flex: 1,
        overflowY: 'scroll',
        padding: '8px 8px'
      }}>
        {filteredGroups.length === 0 ? (
          <div style={{
            padding: '40px 20px',
            textAlign: 'center',
            color: '#71717A',
            fontSize: 13
          }}>
            {search ? 'Nenhum grupo encontrado' : 'Nenhum grupo criado ainda'}
          </div>
        ) : (
          filteredGroups.map(g => (
            <div
              key={g.id}
              onClick={() => openGroup(g.id)}
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
                borderRadius: '50%',
                background: g.avatar_url ? 'transparent' : getAvatarColor(g.id),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                fontWeight: 600,
                color: 'white',
                flexShrink: 0,
                overflow: 'hidden'
              }}>
                {g.avatar_url ? (
                  <img 
                    src={g.avatar_url} 
                    alt={g.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  getInitials(g.name)
                )}
              </div>

              {/* Group Info */}
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
                  {g.name}
                </div>
                <div style={{
                  fontSize: 12,
                  color: '#71717A',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <Users size={12} />
                  {g.member_count} membros
                  {g.role === 'admin' && (
                    <span style={{
                      background: 'rgba(139, 92, 246, 0.2)',
                      color: '#A78BFA',
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 600
                    }}>
                      ADMIN
                    </span>
                  )}
                </div>
              </div>

              {/* Status Indicator - green dot only if last message is from other user */}
              {lastMessages[g.id] && lastMessages[g.id].sender_id !== user.id && (
                <div style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: '#10B981',
                  flexShrink: 0,
                  boxShadow: '0 0 8px rgba(16, 185, 129, 0.5)'
                }} />
              )}
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
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          fontWeight: 600,
          color: 'white',
          flexShrink: 0,
          overflow: 'hidden'
        }}>
          {profile?.avatar_url ? (
            <img 
              src={profile.avatar_url} 
              alt="avatar"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            getInitials(profile?.username || user?.email || 'U')
          )}
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
            {profile?.username || user?.email}
          </div>
          <div style={{ fontSize: 11, color: '#71717A' }}>
            Online
          </div>
        </div>
        <button
          onClick={() => navigate('/profile')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            background: 'rgba(63, 63, 70, 0.3)',
            border: '1px solid rgba(63, 63, 70, 0.5)',
            borderRadius: 8,
            color: '#A1A1AA',
            cursor: 'pointer',
            transition: 'all 200ms ease',
            flexShrink: 0
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
          title="Meu Perfil"
        >
          <Settings size={14} />
        </button>
        <button
          onClick={signOut}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            background: 'rgba(63, 63, 70, 0.3)',
            border: '1px solid rgba(63, 63, 70, 0.5)',
            borderRadius: 8,
            color: '#A1A1AA',
            cursor: 'pointer',
            transition: 'all 200ms ease',
            flexShrink: 0
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
          <LogOut size={14} />
        </button>
      </div>

      {showCreateModal && (
        <CreateGroupModal 
          onClose={() => setShowCreateModal(false)} 
          onCreated={() => {
            setShowCreateModal(false)
            loadGroups()
          }}
        />
      )}
    </div>
  )
}

function CreateGroupModal({ onClose, onCreated }) {
  const { user, createGroup } = useAuth()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [users, setUsers] = useState([])
  const [selectedMembers, setSelectedMembers] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchUsers, setSearchUsers] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .neq('id', user.id)
    
    if (data) setUsers(data.filter(u => u.username))
  }

  const toggleMember = (userId) => {
    if (selectedMembers.includes(userId)) {
      setSelectedMembers(prev => prev.filter(id => id !== userId))
    } else {
      setSelectedMembers(prev => [...prev, userId])
    }
  }

  const handleCreate = async () => {
    if (!name.trim()) {
      alert('Digite um nome para o grupo')
      return
    }

    setLoading(true)
    const { error } = await createGroup(name.trim(), description.trim(), selectedMembers)
    setLoading(false)

    if (error) {
      alert('Erro ao criar grupo: ' + error.message)
    } else {
      onCreated()
    }
  }

  const filteredUsers = users.filter(u => 
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
        {/* Header */}
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
            Criar Novo Grupo
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

        {/* Form */}
        <div style={{
          padding: '24px',
          flex: 1,
          overflowY: 'auto'
        }}>
          {/* Group Name */}
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 500,
              color: '#A1A1AA',
              marginBottom: 8
            }}>
              Nome do Grupo *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 100))}
              maxLength={100}
              placeholder="Digite o nome do grupo..."
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'rgba(39, 39, 42, 0.8)',
                border: '1px solid rgba(63, 63, 70, 0.5)',
                borderRadius: 10,
                color: '#FAFAFA',
                fontSize: 13,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 500,
              color: '#A1A1AA',
              marginBottom: 8
            }}>
              Descrição (opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 500))}
              maxLength={500}
              placeholder="Digite uma descrição..."
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'rgba(39, 39, 42, 0.8)',
                border: '1px solid rgba(63, 63, 70, 0.5)',
                borderRadius: 10,
                color: '#FAFAFA',
                fontSize: 13,
                outline: 'none',
                resize: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {/* Members */}
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 500,
              color: '#A1A1AA',
              marginBottom: 8
            }}>
              Adicionar Membros ({selectedMembers.length} selecionados)
            </label>
            
            {/* Search Users */}
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

            {/* Users List */}
            <div style={{
              maxHeight: 200,
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
          </div>
        </div>

        {/* Footer */}
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
            onClick={handleCreate}
            disabled={loading || !name.trim()}
            style={{
              padding: '10px 20px',
              background: (loading || !name.trim()) 
                ? 'rgba(63, 63, 70, 0.3)' 
                : 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
              border: 'none',
              borderRadius: 10,
              color: 'white',
              fontSize: 13,
              fontWeight: 600,
              cursor: (loading || !name.trim()) ? 'not-allowed' : 'pointer',
              opacity: (loading || !name.trim()) ? 0.5 : 1,
              transition: 'all 200ms ease'
            }}
          >
            {loading ? 'Criando...' : 'Criar Grupo'}
          </button>
        </div>
      </div>
    </div>
  )
}
