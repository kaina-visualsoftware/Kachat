import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './components/Login'
import UserList from './components/UserList'
import ChatDM from './components/ChatDM'
import EmptyState from './components/EmptyState'

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

  if (loading) return <LoadingScreen />

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <WhatsAppLayout>
            <EmptyState />
          </WhatsAppLayout>
        </ProtectedRoute>
      } />
      <Route path="/chat/:receiverId" element={
        <ProtectedRoute>
          <WhatsAppLayout>
            <ChatDM />
          </WhatsAppLayout>
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function WhatsAppLayout({ children }) {
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
      {/* Sidebar - UserList */}
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
        <UserList />
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
      <BrowserRouter basename="/chat-realtime">
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
