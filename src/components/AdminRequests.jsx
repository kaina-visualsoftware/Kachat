import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { X, Check, UserPlus } from 'lucide-react'
import { theme } from '../theme'

export default function AdminRequests({ onClose }) {
  const { getPendingUsers, approveUser, rejectUser } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = async () => {
    setLoading(true)
    const { data } = await getPendingUsers()
    setRequests(data || [])
    setLoading(false)
  }

  const handleApprove = async (userId) => {
    const { error } = await approveUser(userId)
    if (!error) {
      setRequests(prev => prev.filter(r => r.id !== userId))
    } else {
      alert('Erro ao aprovar: ' + error.message)
    }
  }

  const handleReject = async (userId) => {
    if (!confirm('Rejeitar este usuário?')) return
    const { error } = await rejectUser(userId)
    if (!error) {
      setRequests(prev => prev.filter(r => r.id !== userId))
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
        maxWidth: 480,
        maxHeight: '80vh',
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
              Solicitações de acesso
            </span>
            {requests.length > 0 && (
              <span style={{
                background: '#EF4444',
                color: '#FFFFFF',
                fontSize: 11,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 10,
                lineHeight: '16px'
              }}>
                {requests.length}
              </span>
            )}
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
          ) : requests.length === 0 ? (
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
            requests.map((req, idx) => (
              <div
                key={req.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  marginBottom: 8,
                  background: 'rgba(39, 39, 42, 0.5)',
                  borderRadius: 12,
                  border: '1px solid rgba(63, 63, 70, 0.4)',
                  animation: 'fadeInUp 0.2s ease-out'
                }}
              >
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
                  {req.avatar_url ? (
                    <img src={req.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    req.username?.charAt(0).toUpperCase() || '?'
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#FAFAFA',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {req.username}
                  </div>
                  <div style={{
                    fontSize: 11,
                    color: '#71717A',
                    marginTop: 2
                  }}>
                    Solicitou em {formatDate(req.created_at)}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => handleApprove(req.id)}
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
                    onClick={() => handleReject(req.id)}
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
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
