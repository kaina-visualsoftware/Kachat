import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './components/Login'
import UserList from './components/UserList'
import ChatDM from './components/ChatDM'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  
  if (loading) return <div>Carregando...</div>
  if (!user) return <Navigate to="/login" replace />
  
  return children
}

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) return <div style={{ textAlign: 'center', marginTop: 50 }}>Carregando...</div>

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <UserList />
        </ProtectedRoute>
      } />
      <Route path="/chat/:receiverId" element={
        <ProtectedRoute>
          <ChatDM />
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
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
