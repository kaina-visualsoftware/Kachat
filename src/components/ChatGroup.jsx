import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Users, Settings, UserPlus, LogOut } from 'lucide-react'
import AddMembersModal from './AddMembersModal'
import MembersModal from './MembersModal'
import { Avatar } from '../components/Avatar'
import { useChatLogic } from '../hooks/useChatLogic'
import { ChatBase } from '../components/ChatBase'

export default function ChatGroup() {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const { user, profile, uploadChatFiles, getGroupMessages, sendGroupMessage, getGroupMembers, leaveGroup, loading: authLoading } = useAuth()
  const [groupName, setGroupName] = useState('')
  const [groupAvatarUrl, setGroupAvatarUrl] = useState(null)
  const [members, setMembers] = useState([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAddMembersModal, setShowAddMembersModal] = useState(false)
  const [showMembersModal, setShowMembersModal] = useState(false)
  const [showGroupMenu, setShowGroupMenu] = useState(false)

  const chatLogic = useChatLogic({
    chatType: 'group',
    chatId: groupId,
    fetchMessages: async () => {
      const { data, error } = await getGroupMessages(groupId, 100)
      if (!error && data) return data
      return []
    },
    sendMessage: async (content) => {
      await sendGroupMessage(groupId, content)
    },
    uploadFiles: (files) => uploadChatFiles(files, null, groupId),
    subscribe: (setMessages, chatId) => {
      const channel = supabase.channel(`group_${groupId}`)
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'group_messages'
          },
          (payload) => {
            const msg = payload.new
            if (msg.group_id === groupId) {
              setMessages(prev => [...prev, msg])
            }
          }
        )
        .subscribe((status) => {
          chatLogic.setStatus(status)
        })

      return { unsubscribe: () => supabase.removeChannel(channel) }
    },
    currentUserId: user?.id,
    currentUserProfile: profile,
    members: members,
    isGroupChat: true
  })

  useEffect(() => {
    if (!groupId || !user) return

    // Load group info
    const loadGroupInfo = async () => {
      const { data } = await supabase
        .from('chat_groups')
        .select('name, avatar_url')
        .eq('id', groupId)
        .single()
      
      if (data) {
        setGroupName(data.name)
        setGroupAvatarUrl(data.avatar_url)
      }
    }

    // Load members
    const loadMembers = async () => {
      const { data, error } = await getGroupMembers(groupId)
      if (!error && data) {
        setMembers(data)
        const current = data.find(m => m.id === user.id || m.user_id === user.id)
        setIsAdmin(current?.role === 'admin')
      }
    }

    loadGroupInfo()
    loadMembers()
  }, [groupId, user])

  if (authLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#18181B',
        color: '#FAFAFA'
      }}>
        Carregando...
      </div>
    )
  }

  return (
    <ChatBase
      chatType="group"
      loading={chatLogic.loading}
      renderHeader={() => (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 16px',
          borderBottom: '1px solid rgba(63, 63, 70, 0.5)',
          background: '#27272A'
        }}>
          <button
            onClick={() => navigate('/chat')}
            style={{
              background: 'none',
              border: 'none',
              color: '#A78BFA',
              cursor: 'pointer',
              padding: 8,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <ArrowLeft size={24} />
          </button>
          
          <Avatar 
            url={groupAvatarUrl}
            initials={groupName?.charAt(0).toUpperCase() || '?'}
            size={40}
          />
          
          <div style={{ flex: 1 }}>
            <div style={{ color: '#FAFAFA', fontWeight: 600, fontSize: 16 }}>
              {groupName || 'Grupo'}
            </div>
            <div style={{ color: '#71717A', fontSize: 12 }}>
              {members.length} membro{members.length !== 1 ? 's' : ''}
            </div>
          </div>
          
          <button
            onClick={() => setShowGroupMenu(!showGroupMenu)}
            style={{
              background: 'none',
              border: 'none',
              color: '#A78BFA',
              cursor: 'pointer',
              padding: 8,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Users size={24} />
          </button>
          
          {showGroupMenu && (
            <div style={{
              position: 'absolute',
              top: 60,
              right: 16,
              background: '#27272A',
              borderRadius: 8,
              border: '1px solid rgba(63, 63, 70, 0.5)',
              padding: 8,
              zIndex: 1000,
              minWidth: 180
            }}>
              {isAdmin && (
                <button
                  onClick={() => { setShowGroupMenu(false); setShowAddMembersModal(true) }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                    padding: '10px 12px',
                    background: 'none',
                    border: 'none',
                    color: '#FAFAFA',
                    cursor: 'pointer',
                    fontSize: 14,
                    borderRadius: 6
                  }}
                  onMouseOver={(e) => e.target.style.background = 'rgba(139, 92, 246, 0.1)'}
                  onMouseOut={(e) => e.target.style.background = 'transparent'}
                >
                  <UserPlus size={18} />
                  Adicionar membros
                </button>
              )}
              
              <button
                onClick={() => {
                  setShowGroupMenu(false)
                  setShowMembersModal(true)
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '10px 12px',
                  background: 'none',
                  border: 'none',
                  color: '#FAFAFA',
                  cursor: 'pointer',
                  fontSize: 14,
                  borderRadius: 6
                }}
                onMouseOver={(e) => e.target.style.background = 'rgba(139, 92, 246, 0.1)'}
                onMouseOut={(e) => e.target.style.background = 'transparent'}
              >
                <Users size={18} />
                Ver membros
              </button>
              
              <button
                onClick={async () => {
                  if (confirm('Sair do grupo?')) {
                    await leaveGroup(groupId)
                    navigate('/chat')
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '10px 12px',
                  background: 'none',
                  border: 'none',
                  color: '#EF4444',
                  cursor: 'pointer',
                  fontSize: 14,
                  borderRadius: 6
                }}
                onMouseOver={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.1)'}
                onMouseOut={(e) => e.target.style.background = 'transparent'}
              >
                <LogOut size={18} />
                Sair do grupo
              </button>
            </div>
          )}
        </div>
      )}
      onBack={() => navigate('/chat')}
      currentUserId={user?.id}
      currentUserProfile={profile}
      profilesMap={chatLogic.profilesMap}
      members={members}
      isAdmin={isAdmin}
      showAddMembersModal={showAddMembersModal}
      setShowAddMembersModal={setShowAddMembersModal}
      renderExtraModals={() => (
        <>
          {showAddMembersModal && (
            <AddMembersModal
              groupId={groupId}
              currentMembers={members}
              onClose={() => setShowAddMembersModal(false)}
              onSuccess={() => {
                setShowAddMembersModal(false)
                getGroupMembers(groupId).then(({ data }) => {
                  if (data) setMembers(data)
                })
              }}
            />
          )}
          {showMembersModal && (
            <MembersModal
              groupId={groupId}
              currentUserId={user?.id}
              members={members}
              isAdmin={isAdmin}
              onClose={() => setShowMembersModal(false)}
              onRemoveSuccess={() => {
                getGroupMembers(groupId).then(({ data }) => {
                  if (data) setMembers(data)
                })
              }}
            />
          )}
        </>
      )}
      {...chatLogic}
    />
  )
}