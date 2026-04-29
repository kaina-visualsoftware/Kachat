import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Mail, Lock, User, LogIn, UserPlus, ArrowRight, MessageSquare } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const { signUp, signIn } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, username)
        if (error) throw error
        setMessage('Cadastro realizado! Verifique seu email.')
        setEmail('')
        setPassword('')
        setUsername('')
      } else {
        const { error } = await signIn(email, password)
        if (error) throw error
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #09090B 0%, #18181B 50%, #09090B 100%)',
      padding: 20
    }}>
      <div style={{
        width: '100%',
        maxWidth: 420,
        padding: 40,
        background: 'rgba(24, 24, 27, 0.95)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderRadius: 20,
        border: '1px solid rgba(63, 63, 70, 0.5)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 60,
            height: 60,
            margin: '0 auto 16px',
            borderRadius: 16,
            background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <MessageSquare size={28} color="white" />
          </div>
          <h1 style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 700,
            color: '#FAFAFA',
            letterSpacing: -0.5
          }}>
            {isSignUp ? 'Criar Conta' : 'Bem-vindo'}
          </h1>
          <p style={{
            margin: '8px 0 0',
            fontSize: 14,
            color: '#71717A'
          }}>
            {isSignUp ? 'Preencha os dados abaixo' : 'Entre para continuar'}
          </p>
        </div>

        {error && (
          <div style={{
            padding: '12px 16px',
            marginBottom: 20,
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 12,
            color: '#FCA5A5',
            fontSize: 13
          }}>
            {error}
          </div>
        )}

        {message && (
          <div style={{
            padding: '12px 16px',
            marginBottom: 20,
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 12,
            color: '#86EFAC',
            fontSize: 13
          }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {isSignUp && (
            <div style={{ position: 'relative' }}>
              <User size={16} color="#71717A" style={{
                position: 'absolute',
                left: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none'
              }} />
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 40px',
                  background: 'rgba(39, 39, 42, 0.8)',
                  border: '1px solid rgba(63, 63, 70, 0.5)',
                  borderRadius: 12,
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
          )}

          <div style={{ position: 'relative' }}>
            <Mail size={16} color="#71717A" style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none'
            }} />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 14px 12px 40px',
                background: 'rgba(39, 39, 42, 0.8)',
                border: '1px solid rgba(63, 63, 70, 0.5)',
                borderRadius: 12,
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

          <div style={{ position: 'relative' }}>
            <Lock size={16} color="#71717A" style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none'
            }} />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 14px 12px 40px',
                background: 'rgba(39, 39, 42, 0.8)',
                border: '1px solid rgba(63, 63, 70, 0.5)',
                borderRadius: 12,
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

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: loading ? 'rgba(139, 92, 246, 0.5)' : 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
              color: 'white',
              border: 'none',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 200ms ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.4)'
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = 'none'
            }}
          >
            {loading ? 'Carregando...' : (
              <>
                {isSignUp ? <UserPlus size={16} /> : <LogIn size={16} />}
                {isSignUp ? 'Cadastrar' : 'Entrar'}
              </>
            )}
          </button>
        </form>

        <p style={{
          marginTop: 24,
          textAlign: 'center',
          fontSize: 13,
          color: '#71717A'
        }}>
          {isSignUp ? 'Já tem conta?' : 'Não tem conta?'}
          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage('') }}
            style={{
              marginLeft: 8,
              background: 'none',
              border: 'none',
              color: '#8B5CF6',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              transition: 'opacity 200ms ease'
            }}
            onMouseEnter={(e) => e.target.style.opacity = 0.7}
            onMouseLeave={(e) => e.target.style.opacity = 1}
          >
            {isSignUp ? 'Faça login' : 'Cadastre-se'}
            <ArrowRight size={12} style={{ marginLeft: 4, verticalAlign: 'middle' }} />
          </button>
        </p>
      </div>
    </div>
  )
}
