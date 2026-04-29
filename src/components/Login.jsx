import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const { signUp, signIn } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, username)
        if (error) throw error
        setMessage('Cadastro realizado! Verifique seu email para confirmar.')
      } else {
        const { error } = await signIn(email, password)
        if (error) throw error
      }
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '100px auto', padding: 20 }}>
      <h1>{isSignUp ? 'Cadastro' : 'Login'}</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {message && <p style={{ color: 'green' }}>{message}</p>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {isSignUp && (
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            style={{ padding: 8 }}
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{ padding: 8 }}
        />
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={{ padding: 8 }}
        />
        <button type="submit" style={{ padding: 10, background: '#007bff', color: 'white', border: 'none' }}>
          {isSignUp ? 'Cadastrar' : 'Entrar'}
        </button>
      </form>
      <p style={{ marginTop: 10 }}>
        {isSignUp ? 'Já tem conta?' : 'Não tem conta?'}
        <button 
          onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage('') }} 
          style={{ marginLeft: 5, background: 'none', border: 'none', color: '#007bff', cursor: 'pointer' }}
        >
          {isSignUp ? 'Faça login' : 'Cadastre-se'}
        </button>
      </p>
    </div>
  )
}
