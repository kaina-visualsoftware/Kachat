import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { X, Check, UserPlus, Users, Search } from 'lucide-react'

export default function AdminRequests({ onClose }) {
  const { getPendingUsers, getAllUsers, approveUser, rejectUser } = useAuth()
  const [tab, setTab] = useState('pending')
  const [pending, setPending] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const [pendingRes, allRes] = await Promise.all([
      getPendingUsers(),
      getAllUsers()
    ])
    setPending(pendingRes.data || [])
    setAllUsers(allRes.data || [])
    setLoading(false)
  }

  const handleApprove = async (userId) => {
    const { error } = await approveUser(userId)
    if (!error) {
      setPending(prev => prev.filter(r => r.id !== userId))
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, approved: true } : u))
    } else {
      alert('Erro ao aprovar: ' + error.message)
    }
  }

  const handleReject = async (userId) => {
    if (!confirm('Rejeitar este usuário?')) return
    const { error } = await rejectUser(userId)
    if (!error) {
      setPending(prev => prev.filter(r => r.id !== userId))
    } else {
      alert('Erro ao rejeitar: ' + error.message)
    }
  }

  const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    const offset = -3 * 60
    const adjusted = new Date(d.getTime() + offset * 60 * 1000)
    return adjusted.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredUsers = allUsers.filter(u =>
    u.username?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: 20
    }}>
      <div style={{
        width: '100%',
        maxWidth: 520,
        maxHeight: '85vh',
        background: '#18181B',
        borderRadius: 16,
        border: '1px solid #3F3F46',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)',
        display: 'flex',
        flexDirection: 'column',
        animation: 'fadeInUp 0.2s ease-out'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid #3F3F46'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <UserPlus size={18} color="#A78BFA" />
            <span style={{ color: '#FAFAFA', fontSize: 16, fontWeight: 600 }}>
              Administração
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32,
              borderRadius: '50%',
              background: 'transparent',
              border: 'none',
              color: '#A1A1AA',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #3F3F46',
          padding: '0 20px'
        }}>
          <button
            onClick={() => setTab('pending')}
            style={{
              flex: 1,
              padding: '12px 0',
              background: 'none',
              border: 'none',
              borderBottom: tab === 'pending' ? '2px solid #8B5CF6' : '2px solid transparent',
              color: tab === 'pending' ? '#FAFAFA' : '#71717A',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'all 0.15s ease'
            }}
          >
            <UserPlus size={14} />
            Pendentes
            {pending.length > 0 && (
              <span style={{
                background: '#EF4444',
                color: '#FFFFFF',
                fontSize: 10,
                fontWeight: 700,
                padding: '1px 7px',
                borderRadius: 10,
                lineHeight: '16px'
              }}>
                {pending.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('all')}
            style={{
              flex: 1,
              padding: '12px 0',
              background: 'none',
              border: 'none',
              borderBottom: tab === 'all' ? '2px solid #8B5CF6' : '2px solid transparent',
              color: tab === 'all' ? '#FAFAFA' : '#71717A',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              transition: 'all 0.15s ease'
            }}
          >
            <Users size={14} />
            Todos os usuários
          </button>
        </div>

        {/* Search (only on "todos" tab) */}
        {tab === 'all' && (
          <div style={{ padding: '12px 20px', borderBottom: '1px solid #27272A' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: '#27272A',
              borderRadius: 8,
              padding: '8px 12px',
              border: '1px solid #3F3F46'
            }}>
              <Search size={14} color="#71717A" />
              <input
                placeholder="Buscar por username..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  color: '#FAFAFA',
                  fontSize: 13,
                  fontFamily: 'inherit'
                }}
              />
            </div>
          </div>
        )}

        {/* List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: 16
        }}>
          {loading ? (
            <div style={{ color: '#A1A1AA', fontSize: 13, textAlign: 'center', padding: 40 }}>
              Carregando...
            </div>
          ) : tab === 'pending' ? (
            pending.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <div style={{
                  width: 56, height: 56,
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '2px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px'
                }}>
                  <Check size={24} color="#10B981" />
                </div>
                <div style={{ color: '#A1A1AA', fontSize: 14, marginBottom: 4 }}>
                  Nenhuma solicitação pendente
                </div>
                <div style={{ color: '#71717A', fontSize: 12 }}>
                  Todos os usuários já foram aprovados.
                </div>
              </div>
            ) : (
              pending.map((req) => (
                <UserRow
                  key={req.id}
                  user={req}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  formatDate={formatDate}
                  showActions={true}
                />
              ))
            )
          ) : (
            filteredUsers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ color: '#A1A1AA', fontSize: 14 }}>
                  {search ? 'Nenhum usuário encontrado.' : 'Nenhum usuário cadastrado.'}
                </div>
              </div>
            ) : (
              filteredUsers.map((u) => (
                <UserRow
                  key={u.id}
                  user={u}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  formatDate={formatDate}
                  showActions={!u.approved}
                />
              ))
            )
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid #3F3F46',
          color: '#71717A',
          fontSize: 11,
          textAlign: 'center'
        }}>
          {tab === 'all' ? `${filteredUsers.length} usuário(s)` : `${pending.length} pendente(s)`}
        </div>
      </div>
    </div>
  )
}

function UserRow({ user, onApprove, onReject, formatDate, showActions }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 16px',
      marginBottom: 8,
      background: 'rgba(39, 39, 42, 0.5)',
      borderRadius: 12,
      border: '1px solid rgba(63, 63, 70, 0.4)',
      animation: 'fadeInUp 0.2s ease-out'
    }}>
      {/* Avatar */}
      <div style={{
        width: 40,
        height: 40,
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
        {user.avatar_url ? (
          <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          user.username?.charAt(0).toUpperCase() || '?'
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}>
          <span style={{
            fontSize: 14,
            fontWeight: 500,
            color: '#FAFAFA',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {user.username}
          </span>
          {user.role === 'admin' && (
            <span style={{
              fontSize: 10,
              fontWeight: 600,
              color: '#A78BFA',
              background: 'rgba(139, 92, 246, 0.15)',
              padding: '1px 7px',
              borderRadius: 6,
              lineHeight: '18px',
              flexShrink: 0
            }}>
              ADMIN
            </span>
          )}
          <span style={{
            fontSize: 10,
            fontWeight: 500,
            padding: '1px 7px',
            borderRadius: 6,
            lineHeight: '18px',
            flexShrink: 0,
            background: user.approved
              ? 'rgba(16, 185, 129, 0.15)'
              : 'rgba(250, 204, 21, 0.15)',
            color: user.approved ? '#10B981' : '#EAB308'
          }}>
            {user.approved ? 'Aprovado' : 'Pendente'}
          </span>
        </div>
        <div style={{
          fontSize: 11,
          color: '#71717A',
          marginTop: 2
        }}>
          Cadastrado em {formatDate(user.created_at)}
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => onApprove(user.id)}
            title="Aprovar"
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10B981',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.3)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)'}
          >
            <Check size={18} />
          </button>
          <button
            onClick={() => onReject(user.id)}
            title="Rejeitar"
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#EF4444',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
          >
            <X size={18} />
          </button>
        </div>
      )}
    </div>
  )
}
