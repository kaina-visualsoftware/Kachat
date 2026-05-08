import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { lazy, Suspense, useState } from 'react'

const Login = lazy(() => import('./components/Login'))
const UserList = lazy(() => import('./components/UserList'))
const ChatDM = lazy(() => import('./components/ChatDM'))
const GroupList = lazy(() => import('./components/GroupList'))
const ChatGroup = lazy(() => import('./components/ChatGroup'))
const EmptyState = lazy(() => import('./components/EmptyState'))
const Profile = lazy(() => import('./components/Profile'))

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

function LazyFallback({ children }) {
  return <Suspense fallback={<LoadingScreen />}>{children}</Suspense>
}

function AppRoutes() {
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.slice(1)
    return hash.startsWith('/group') ? 'groups' : 'conversations'
  })

  if (loading) return <LoadingScreen />

  return (
    <Routes>
      <Route path="/login" element={<LazyFallback>{user ? <Navigate to="/" replace /> : <Login />}</LazyFallback>} />
      <Route path="/" element={
        <ProtectedRoute>
          <LazyFallback>
            <WhatsAppLayout activeTab={activeTab} setActiveTab={setActiveTab}>
              <EmptyState />
            </WhatsAppLayout>
          </LazyFallback>
        </ProtectedRoute>
      } />
      <Route path="/groups" element={
        <ProtectedRoute>
          <LazyFallback>
            <WhatsAppLayout activeTab="groups" setActiveTab={setActiveTab}>
              <EmptyState />
            </WhatsAppLayout>
          </LazyFallback>
        </ProtectedRoute>
      } />
      <Route path="/group/:groupId" element={
        <ProtectedRoute>
          <LazyFallback>
            <WhatsAppLayout activeTab="groups" setActiveTab={setActiveTab}>
              <ChatGroup />
            </WhatsAppLayout>
          </LazyFallback>
        </ProtectedRoute>
      } />
      <Route path="/chat/:receiverId" element={
        <ProtectedRoute>
          <LazyFallback>
            <WhatsAppLayout activeTab="conversations" setActiveTab={setActiveTab}>
              <ChatDM />
            </WhatsAppLayout>
          </LazyFallback>
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <LazyFallback>
            <WhatsAppLayout activeTab={activeTab} setActiveTab={setActiveTab}>
              <Profile />
            </WhatsAppLayout>
          </LazyFallback>
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
          borderBottom: '1px solid rgba(63, 63, 70, 0.5)',
          position: 'relative',
          zIndex: 10
        }}>
          <button
             type="button"
             onClick={() => {
               setActiveTab('conversations')
               window.location.hash = ''
             }}
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
             type="button"
             onClick={() => {
               setActiveTab('groups')
               window.location.hash = 'groups'
             }}
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
