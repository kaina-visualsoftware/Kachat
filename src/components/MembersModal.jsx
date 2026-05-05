import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { X, Crown } from 'lucide-react'
import { Avatar } from './Avatar'

export default function MembersModal({ groupId, currentUserId, members, isAdmin, onClose, onRemoveSuccess }) {
  const [loading, setLoading] = useState(false)
  const [membersWithProfiles, setMembersWithProfiles] = useState(members)

  useEffect(() => {
    if (!members || members.length === 0) return

    const userIds = members.map(m => m.user_id)
    supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', userIds)
      .then(({ data }) => {
        if (data) {
          const profileMap = {}
          data.forEach(p => { profileMap[p.id] = p })
          
          setMembersWithProfiles(members.map(m => ({
            ...m,
            profile: profileMap[m.user_id] || m.profile
          })))
        }
      })
  }, [members])

  const handleRemove = async (memberId) => {
    if (!isAdmin) return
    if (!confirm('Remover este membro do grupo?')) return

    setLoading(true)
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', memberId)

    if (!error) {
      onRemoveSuccess?.()
    }
    setLoading(false)
  }

  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        cursor: 'pointer',
        padding: 20
      }}
    >
      <div 
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 400,
          background: '#18181B',
          borderRadius: 12,
          overflow: 'hidden',
          border: '1px solid #3F3F46',
          cursor: 'default'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #3F3F46',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#FAFAFA' }}>
            Membros ({membersWithProfiles.length})
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
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
            <X size={20} />
          </button>
        </div>

        {/* Members List */}
        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          {membersWithProfiles.map((member) => {
            const isCurrentUser = member.user_id === currentUserId
            const isMemberAdmin = member.role === 'admin'
            const hasProfile = !!member.profile?.avatar_url

            return (
              <div
                key={member.user_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 20px',
                  borderBottom: '1px solid #27272A'
                }}
              >
                {/* Avatar */}
                <Avatar
                  url={member.profile?.avatar_url}
                  initials={member.profile?.username?.charAt(0).toUpperCase() || member.username?.charAt(0).toUpperCase() || '?'}
                  size={40}
                />

                {/* Name and Role */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: '#FAFAFA', fontWeight: 500, fontSize: 14 }}>
                      {member.profile?.username || member.username || 'Usuário'}
                    </span>
                    {isMemberAdmin && (
                      <Crown size={14} color="#F59E0B" />
                    )}
                    {isCurrentUser && (
                      <span style={{ color: '#8B5CF6', fontSize: 12 }}>Você</span>
                    )}
                  </div>
                </div>

                {/* Remove Button (only for admins and not for self) */}
                {isAdmin && !isCurrentUser && !isMemberAdmin && (
                  <button
                    onClick={() => handleRemove(member.user_id)}
                    disabled={loading}
                    style={{
                      padding: '6px 12px',
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid #EF4444',
                      borderRadius: 6,
                      color: '#EF4444',
                      fontSize: 12,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.5 : 1
                    }}
                  >
                    Remover
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Close Button */}
        <div style={{ padding: 16, borderTop: '1px solid #3F3F46' }}>
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '12px 20px',
              background: '#27272A',
              border: '1px solid #3F3F46',
              borderRadius: 8,
              color: '#FAFAFA',
              fontSize: 14,
              cursor: 'pointer'
            }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}