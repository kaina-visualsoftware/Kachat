import { useState, useEffect } from 'react'
import { X, Download, DollarSign, Calendar, ArrowUpRight, ArrowDownLeft } from 'lucide-react'

export function OfxPreviewModal({ data, onClose }) {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [rawContent, setRawContent] = useState('')

  useEffect(() => {
    if (!data?.url) return
    
    fetch(data.url)
      .then(res => res.text())
      .then(text => {
        setRawContent(text)
        // Parse OFX XML
        try {
          const parser = new DOMParser()
          const xmlDoc = parser.parseFromString(text, 'text/xml')
          
          // Extract transactions from OFX
          const stmtTrnNodes = xmlDoc.getElementsByTagName('STMTTRN')
          const transactions = []
          
          for (let i = 0; i < stmtTrnNodes.length; i++) {
            const node = stmtTrnNodes[i]
            const getText = (tag) => {
              const el = node.getElementsByTagName(tag)[0]
              return el ? el.textContent : ''
            }
            
            transactions.push({
              date: getText('DTPOSTED'),
              amount: getText('TRNAMT'),
              fitId: getText('FITID'),
              memo: getText('MEMO'),
              name: getText('NAME'),
              type: getText('TRNTYPE')
            })
          }
          
          setTransactions(transactions)
          setLoading(false)
        } catch (err) {
          setError('Erro ao analisar arquivo OFX')
          setLoading(false)
        }
      })
      .catch(err => {
        setError('Erro ao carregar arquivo')
        setLoading(false)
      })
  }, [data?.url])

  const downloadFile = () => {
    const link = document.createElement('a')
    link.href = data.url
    link.download = data.fileName
    link.click()
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    // OFX dates are typically in format YYYYMMDD
    if (dateStr.length >= 8) {
      const year = dateStr.substring(0, 4)
      const month = dateStr.substring(4, 6)
      const day = dateStr.substring(6, 8)
      return `${day}/${month}/${year}`
    }
    return dateStr
  }

  const formatAmount = (amountStr) => {
    if (!amountStr) return 'R$ 0,00'
    const amount = parseFloat(amountStr)
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount)
  }

  const totalIncome = transactions
    .filter(t => parseFloat(t.amount) > 0)
    .reduce((sum, t) => sum + parseFloat(t.amount), 0)
  
  const totalExpense = transactions
    .filter(t => parseFloat(t.amount) < 0)
    .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0)

  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        cursor: 'pointer',
        padding: 40
      }}
    >
      <div 
        onClick={e => e.stopPropagation()}
        style={{
          width: '90vw',
          height: '90vh',
          background: '#18181B',
          borderRadius: 12,
          border: '1px solid #3F3F46',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid #3F3F46',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#27272A'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ 
              width: 32, height: 32, borderRadius: 6, 
              background: 'linear-gradient(135deg, #10B981, #059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <DollarSign size={18} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ color: '#FAFAFA', fontWeight: 600, fontSize: 14 }}>
                {data?.fileName || 'Arquivo OFX'}
              </div>
              <div style={{ color: '#71717A', fontSize: 12 }}>
                {transactions.length} transação{transactions.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={(e) => { e.stopPropagation(); downloadFile() }}
              style={{
                padding: '6px 12px',
                background: 'transparent',
                border: '1px solid #3F3F46',
                borderRadius: 6,
                color: '#A1A1AA',
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <Download size={14} /> Baixar
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onClose() }}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'transparent',
                border: 'none',
                color: '#A1A1AA',
                fontSize: 20,
                cursor: 'pointer'
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div style={{ 
          display: 'flex', gap: 16, padding: 16, 
          borderBottom: '1px solid #3F3F46',
          background: '#27272A'
        }}>
          <div style={{ 
            flex: 1, padding: 16, background: 'rgba(16, 185, 129, 0.1)', 
            borderRadius: 8, border: '1px solid #10B981'
          }}>
            <div style={{ color: '#10B981', fontSize: 12, marginBottom: 4 }}>Receitas</div>
            <div style={{ color: '#10B981', fontSize: 20, fontWeight: 600 }}>
              {formatAmount(String(totalIncome))}
            </div>
          </div>
          <div style={{ 
            flex: 1, padding: 16, background: 'rgba(239, 68, 68, 0.1)', 
            borderRadius: 8, border: '1px solid #EF4444'
          }}>
            <div style={{ color: '#EF4444', fontSize: 12, marginBottom: 4 }}>Despesas</div>
            <div style={{ color: '#EF4444', fontSize: 20, fontWeight: 600 }}>
              {formatAmount(String(totalExpense))}
            </div>
          </div>
          <div style={{ 
            flex: 1, padding: 16, background: 'rgba(139, 92, 246, 0.1)', 
            borderRadius: 8, border: '1px solid #8B5CF6'
          }}>
            <div style={{ color: '#8B5CF6', fontSize: 12, marginBottom: 4 }}>Saldo</div>
            <div style={{ color: '#8B5CF6', fontSize: 20, fontWeight: 600 }}>
              {formatAmount(String(totalIncome - totalExpense))}
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          {loading && <div style={{ color: '#71717A', textAlign: 'center', padding: 40 }}>Carregando...</div>}
          {error && <div style={{ color: '#EF4444', textAlign: 'center', padding: 40 }}>{error}</div>}
          
          {transactions.length === 0 && !loading && !error && (
            <div style={{ color: '#71717A', textAlign: 'center', padding: 40 }}>
              Nenhuma transação encontrada
            </div>
          )}
          
          {transactions.map((tr, idx) => (
            <div key={idx} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              background: '#27272A',
              borderRadius: 8,
              marginBottom: 8,
              border: '1px solid #3F3F46'
            }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: parseFloat(tr.amount) >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {parseFloat(tr.amount) >= 0 
                  ? <ArrowDownLeft size={20} color="#10B981" />
                  : <ArrowUpRight size={20} color="#EF4444" />
                }
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ color: '#FAFAFA', fontWeight: 500, fontSize: 14 }}>
                  {tr.name || tr.memo || 'Transação'}
                </div>
                <div style={{ color: '#71717A', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Calendar size={12} /> {formatDate(tr.date)}
                </div>
              </div>
              
              <div style={{ 
                color: parseFloat(tr.amount) >= 0 ? '#10B981' : '#EF4444',
                fontWeight: 600,
                fontSize: 14
              }}>
                {formatAmount(tr.amount)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}