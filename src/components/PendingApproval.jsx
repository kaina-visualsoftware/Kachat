import { useAuth } from '../context/AuthContext'
import { LogOut, Shield } from 'lucide-react'

export default function PendingApproval() {
  const { signOut, user } = useAuth()

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#09090B',
      padding: 20
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: 380
      }}>
        <div style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'rgba(139, 92, 246, 0.1)',
          border: '2px solid rgba(139, 92, 246, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px'
        }}>
          <Shield size={36} color="#8B5CF6" />
        </div>

        <h1 style={{
          color: '#FAFAFA',
          fontSize: 22,
          fontWeight: 700,
          margin: '0 0 12px'
        }}>
          Aguardando aprovação
        </h1>

        <p style={{
          color: '#A1A1AA',
          fontSize: 14,
          lineHeight: 1.6,
          margin: '0 0 8px'
        }}>
          Sua conta está aguardando aprovação do administrador.
        </p>
        <p style={{
          color: '#71717A',
          fontSize: 13,
          lineHeight: 1.5,
          margin: '0 0 32px'
        }}>
          Você receberá acesso assim que for aprovado.
        </p>

        <div style={{
          background: 'rgba(24, 24, 27, 0.95)',
          border: '1px solid rgba(63, 63, 70, 0.5)',
          borderRadius: 12,
          padding: '16px',
          marginBottom: 24
        }}>
          <div style={{
            fontSize: 12,
            color: '#71717A',
            marginBottom: 4
          }}>
            Email
          </div>
          <div style={{
            fontSize: 14,
            color: '#FAFAFA',
            fontWeight: 500
          }}>
            {user?.email}
          </div>
        </div>

        <button
          onClick={signOut}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 24px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 10,
            color: '#EF4444',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
          }}
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </div>
  )
}
