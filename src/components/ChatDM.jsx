import { useEffect, useState, useRef } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Circle } from 'lucide-react'
import { useChatLogic } from '../hooks/useChatLogic'
import { ChatBase } from '../components/ChatBase'
import { Avatar } from '../components/Avatar'

export default function ChatDM() {
  const { receiverId } = useParams()
  const navigate = useNavigate()
  const { user, profile, uploadChatFiles, loading: authLoading } = useAuth()
  const [receiverName, setReceiverName] = useState('')
  const [currentUserName, setCurrentUserName] = useState('')
  const [receiverProfile, setReceiverProfile] = useState(null)

  const lastMessageTime = useRef(0)
  const messageCount = useRef(0)
  const messageCountReset = useRef(null)

  const checkRateLimit = () => {
    const now = Date.now()
    const minInterval = 1000
    const maxBurst = 5
    const burstWindow = 10000

    if (now - lastMessageTime.current < minInterval) {
      return { allowed: false, reason: 'Aguarde um momento antes de enviar outra mensagem.' }
    }

    if (!messageCountReset.current || now - messageCountReset.current > burstWindow) {
      messageCount.current = 1
      messageCountReset.current = now
      lastMessageTime.current = now
      return { allowed: true }
    }

    messageCount.current++
    lastMessageTime.current = now

    if (messageCount.current > maxBurst) {
      return { allowed: false, reason: 'Muitas mensagens. Aguarde alguns segundos.' }
    }

    return { allowed: true }
  }

  const chatLogic = useChatLogic({
    chatType: 'dm',
    chatId: receiverId,
    fetchMessages: async () => {
      const { data } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`)
        .order('created_at')
      return data || []
    },
    sendMessage: async (content, replyTo = null) => {
      const rateCheck = checkRateLimit()
      if (!rateCheck.allowed) {
        alert(rateCheck.reason)
        return
      }
      await supabase.from('direct_messages').insert({
        sender_id: user.id,
        receiver_id: receiverId,
        content,
        reply_to: replyTo
      })
    },
    uploadFiles: (files) => uploadChatFiles(files, receiverId),
    subscribe: (setMessages, chatId) => {
      const channel = supabase.channel(`dm_${[user.id, receiverId].sort().join('_')}`)
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'direct_messages'
          },
          (payload) => {
            const msg = payload.new
            const isRelevant = 
              (msg.sender_id === user.id && msg.receiver_id === receiverId) ||
              (msg.sender_id === receiverId && msg.receiver_id === user.id)
            
            if (isRelevant) {
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
    isGroupChat: false
  })

  useEffect(() => {
    if (!receiverId || !user) return

    // Load receiver name and profile
    const loadReceiverInfo = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .eq('id', receiverId)
        .single()
      
      if (data) {
        setReceiverName(data.username)
        setReceiverProfile(data)
      }
    }

    // Load current user name
    const loadCurrentUserName = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single()
      
      if (data) setCurrentUserName(data.username)
    }

    loadReceiverInfo()
    loadCurrentUserName()
  }, [receiverId, user])

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
      chatType="dm"
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
            url={receiverProfile?.avatar_url}
            initials={receiverName?.charAt(0).toUpperCase() || '?'}
            size={40}
          />
          
          <div style={{ flex: 1 }}>
            <div style={{ color: '#FAFAFA', fontWeight: 600, fontSize: 16 }}>
              {receiverName || 'Chat'}
            </div>
            <div style={{ color: '#71717A', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Circle size={8} fill={chatLogic.status === 'SUBSCRIBED' ? '#22C55E' : '#71717A'} color={chatLogic.status === 'SUBSCRIBED' ? '#22C55E' : '#71717A'} />
              {chatLogic.status === 'SUBSCRIBED' ? 'Online' : 'Conectando...'}
            </div>
          </div>
        </div>
      )}
      onBack={() => navigate('/chat')}
      currentUserId={user?.id}
      currentUserProfile={profile}
      receiverProfile={receiverProfile}
      profilesMap={chatLogic.profilesMap}
      {...chatLogic}
    />
  )
}