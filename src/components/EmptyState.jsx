import { MessageSquare } from 'lucide-react'

export default function EmptyState() {
  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(180deg, #09090B 0%, rgba(24, 24, 27, 0.5) 100%)',
      gap: 16
    }}>
      <div style={{
        width: 80,
        height: 80,
        borderRadius: 20,
        background: 'rgba(139, 92, 246, 0.1)',
        border: '1px solid rgba(139, 92, 246, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <MessageSquare size={36} color="rgba(139, 92, 246, 0.4)" />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: 18,
          fontWeight: 600,
          color: '#A1A1AA',
          marginBottom: 8
        }}>
          Nenhuma conversa selecionada
        </div>
        <div style={{
          fontSize: 13,
          color: '#71717A',
          maxWidth: 300
        }}>
          Selecione um usuário na lista à esquerda para iniciar uma conversa
        </div>
      </div>
    </div>
  )
}
