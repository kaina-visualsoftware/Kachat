import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './components/Login'
import UserList from './components/UserList'
import ChatDM from './components/ChatDM'
import GroupList from './components/GroupList'
import ChatGroup from './components/ChatGroup'
import EmptyState from './components/EmptyState'
import Profile from './components/Profile'
import { useState, useEffect } from 'react'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  
  return children
}

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#09090B'
    }}>
      <div style={{
        padding: '16px 24px',
        background: 'rgba(24, 24, 27, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: 12,
        border: '1px solid rgba(63, 63, 70, 0.5)',
        color: '#A1A1AA',
        fontSize: 14
      }}>
        Carregando...
      </div>
    </div>
  )
}

function AppRoutes() {
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState('conversations') // 'conversations' or 'groups'

  // Sync tab with URL on initial load
  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (hash.startsWith('/group')) {
      setActiveTab('groups')
    } else {
      setActiveTab('conversations')
    }
  }, [])

  if (loading) return <LoadingScreen />

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <WhatsAppLayout activeTab={activeTab} setActiveTab={setActiveTab}>
            <EmptyState />
          </WhatsAppLayout>
        </ProtectedRoute>
      } />
      <Route path="/groups" element={
        <ProtectedRoute>
          <WhatsAppLayout activeTab="groups" setActiveTab={setActiveTab}>
            <GroupList />
          </WhatsAppLayout>
        </ProtectedRoute>
      } />
      <Route path="/group/:groupId" element={
        <ProtectedRoute>
          <WhatsAppLayout activeTab="groups" setActiveTab={setActiveTab}>
            <ChatGroup />
          </WhatsAppLayout>
        </ProtectedRoute>
      } />
      <Route path="/chat/:receiverId" element={
        <ProtectedRoute>
          <WhatsAppLayout activeTab="conversations" setActiveTab={setActiveTab}>
            <ChatDM />
          </WhatsAppLayout>
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <WhatsAppLayout activeTab={activeTab} setActiveTab={setActiveTab}>
            <Profile />
          </WhatsAppLayout>
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function WhatsAppLayout({ children, activeTab, setActiveTab }) {
  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100%',
      overflow: 'hidden',
      background: '#09090B',
      margin: 0,
      padding: 0
    }}>
      {/* Sidebar */}
      <div style={{
        width: 380,
        minWidth: 380,
        height: '100%',
        background: 'rgba(24, 24, 27, 0.98)',
        borderRight: '1px solid rgba(63, 63, 70, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid rgba(63, 63, 70, 0.5)'
        }}>
          <button
            onClick={() => setActiveTab('conversations')}
            style={{
              flex: 1,
              padding: '14px 16px',
              background: activeTab === 'conversations' ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'conversations' ? '2px solid #8B5CF6' : '2px solid transparent',
              color: activeTab === 'conversations' ? '#A78BFA' : '#71717A',
              fontSize: 13,
              fontWeight: activeTab === 'conversations' ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 200ms ease'
            }}
          >
            Conversas
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            style={{
              flex: 1,
              padding: '14px 16px',
              background: activeTab === 'groups' ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'groups' ? '2px solid #8B5CF6' : '2px solid transparent',
              color: activeTab === 'groups' ? '#A78BFA' : '#71717A',
              fontSize: 13,
              fontWeight: activeTab === 'groups' ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 200ms ease'
            }}
          >
            Grupos
          </button>
        </div>

        {/* Content based on active tab */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          {activeTab === 'conversations' ? <UserList /> : <GroupList />}
        </div>
      </div>

      {/* Main Chat Area */}
      <div style={{
        flex: 1,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {children}
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AuthProvider>
  )
}

export default App
