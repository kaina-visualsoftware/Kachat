import { useState, useEffect } from 'react'
import { X, Download, DollarSign, Calendar, ArrowUpRight, ArrowDownLeft, Code, FileText } from 'lucide-react'

export function OfxPreviewModal({ data, onClose }) {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [rawContent, setRawContent] = useState('')
  const [showRaw, setShowRaw] = useState(false)
  const [accountInfo, setAccountInfo] = useState(null)

  useEffect(() => {
    if (!data?.url) return
    
    setLoading(true)
    setError(null)
    
    // Fetch com timeout e tratamento de erro
    const fetchContent = async () => {
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 10000)
        
        const response = await fetch(data.url, { 
          signal: controller.signal,
          headers: { 'Accept': 'application/x-ofx, text/plain, */*' }
        })
        
        clearTimeout(timeout)
        
        if (!response.ok) {
          throw new Error(`Erro HTTP: ${response.status}`)
        }
        
        const text = await response.text()
        setRawContent(text)
        
        // Parse OFX
        const parsed = parseOFX(text)
        if (parsed.transactions.length > 0) {
          setTransactions(parsed.transactions)
          setAccountInfo(parsed.accountInfo)
        } else if (text.trim()) {
          // Se tem conteúdo mas não conseguiu parsing, mostra raw
          setError('Formato OFX não reconhecido, mostrando conteúdo raw')
        }
      } catch (err) {
        console.error('OFX fetch error:', err)
        if (err.name === 'AbortError') {
          setError('Tempo limite excedido ao carregar arquivo')
        } else if (err.message.includes('Failed to fetch')) {
          setError('Erro ao carregar arquivo (CORS ou rede)')
        } else {
          setError('Erro ao processar arquivo: ' + err.message)
        }
      } finally {
        setLoading(false)
      }
    }
    
    fetchContent()
  }, [data?.url])

  const parseOFX = (text) => {
    const transactions = []
    let accountInfo = null
    
    // Tentar como XML primeiro
    try {
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(text, 'text/xml')
      
      // Verificar se é XML válido
      const parseError = xmlDoc.querySelector('parsererror')
      if (!parseError) {
        // Extrair informações da conta
        const acctInfo = xmlDoc.getElementsByTagName('ACCTINFO')[0]
        if (acctInfo) {
          const getTagText = (tag) => {
            const el = acctInfo.getElementsByTagName(tag)[0]
            return el ? el.textContent?.trim() : ''
          }
          accountInfo = {
            bankId: getTagText('BANKID'),
            accountId: getTagText('ACCTID'),
            accountType: getTagText('ACCTTYPE')
          }
        }
        
        // Extrair transações
        const stmtTrnNodes = xmlDoc.getElementsByTagName('STMTTRN')
        for (let i = 0; i < stmtTrnNodes.length; i++) {
          const node = stmtTrnNodes[i]
          const getText = (tag) => {
            const el = node.getElementsByTagName(tag)[0]
            return el ? el.textContent?.trim() : ''
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
        
        return { transactions, accountInfo }
      }
    } catch (e) {
      console.log('XML parsing failed, trying SGML:', e)
    }
    
    // Tentar como SGML (formato antigo de OFX)
    try {
      // OFX antigo usa tags sem fechamento explícito
      const lines = text.split('\n')
      let currentTrn = {}
      let inTrn = false
      
      // Expressões regulares para capturar campos
      const patterns = {
        dtposted: /<DTPOSTED>([^<\[]+)/i,
        trnamt: /<TRNAMT>([^<\[]+)/i,
        fitid: /<FITID>([^<\[]+)/i,
        memo: /<MEMO>([^<\[]+)/i,
        name: /<NAME>([^<\[]+)/i,
        trntype: /<TRNTYPE>([^<\[]+)/i,
        bankid: /<BANKID>([^<\[]+)/i,
        acctid: /<ACCTID>([^<\[]+)/i,
        accttype: /<ACCTTYPE>([^<\[]+)/i
      }
      
      // Primeiro tenta pegar info da conta
      const bankIdMatch = text.match(patterns.bankid)
      const acctIdMatch = text.match(patterns.acctid)
      const acctTypeMatch = text.match(patterns.accttype)
      
      if (bankIdMatch || acctIdMatch) {
        accountInfo = {
          bankId: bankIdMatch?.[1] || '',
          accountId: acctIdMatch?.[1] || '',
          accountType: acctTypeMatch?.[1] || ''
        }
      }
      
      // Agora pega as transações
      const globalRegex = /<STMTTRN[^>]*>([\s\S]*?)(?=<STMTTRN|$)/gi
      let match
      
      while ((match = globalRegex.exec(text)) !== null) {
        const trnText = match[1]
        
        const dtposted = trnText.match(patterns.dtposted)?.[1] || ''
        const trnamt = trnText.match(patterns.trnamt)?.[1] || ''
        const fitid = trnText.match(patterns.fitid)?.[1] || ''
        const memo = trnText.match(patterns.memo)?.[1] || ''
        const name = trnText.match(patterns.name)?.[1] || ''
        const trntype = trnText.match(patterns.trntype)?.[1] || ''
        
        if (trnamt) {
          transactions.push({
            date: dtposted,
            amount: trnamt,
            fitId: fitid,
            memo: memo,
            name: name,
            type: trntype
          })
        }
      }
    } catch (e) {
      console.log('SGML parsing failed:', e)
    }
    
    return { transactions, accountInfo }
  }

  const downloadFile = () => {
    const link = document.createElement('a')
    link.href = data.url
    link.download = data.fileName
    link.click()
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    try {
      // Tentar vários formatos de data OFX
      // Formato OFX: YYYYMMDD ou YYYYMMDDHHMMSS
      const cleaned = dateStr.replace(/[^0-9]/g, '').substring(0, 8)
      if (cleaned.length >= 8) {
        const year = cleaned.substring(0, 4)
        const month = cleaned.substring(4, 6)
        const day = cleaned.substring(6, 8)
        if (year >= 1900 && year <= 2100) {
          return `${day}/${month}/${year}`
        }
      }
      // Se não conseguir, tenta parser nativo
      const date = new Date(dateStr)
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('pt-BR')
      }
    } catch (e) {}
    return dateStr
  }

  const formatAmount = (amountStr) => {
    if (!amountStr) return 'R$ 0,00'
    try {
      const amount = parseFloat(amountStr.replace(/[^0-9.-]/g, ''))
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount)
    } catch (e) {
      return 'R$ 0,00'
    }
  }

  const formatAccount = () => {
    if (!accountInfo?.accountId) return null
    // Mascara o ID da conta
    const acc = accountInfo.accountId
    const masked = acc.length > 4 ? '****' + acc.slice(-4) : acc
    return masked
  }

  const totalIncome = transactions
    .filter(t => parseFloat(t.amount) > 0)
    .reduce((sum, t) => sum + parseFloat(t.amount), 0)
  
  const totalExpense = transactions
    .filter(t => parseFloat(t.amount) < 0)
    .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0)

  const balance = totalIncome - totalExpense

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
        padding: 20
      }}
    >
      <div 
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 800,
          height: '90vh',
          background: '#18181B',
          borderRadius: 16,
          border: '1px solid #3F3F46',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #3F3F46',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#27272A'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ 
              width: 40, height: 40, borderRadius: 10, 
              background: 'linear-gradient(135deg, #10B981, #059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <DollarSign size={22} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ color: '#FAFAFA', fontWeight: 600, fontSize: 15 }}>
                {data?.fileName || 'Extrato OFX'}
              </div>
              <div style={{ color: '#71717A', fontSize: 12 }}>
                {accountInfo?.bankId && `Banco: ${accountInfo.bankId} • `}
                {formatAccount() && `Conta: ${formatAccount()} • `}
                {transactions.length} transação{transactions.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={(e) => { e.stopPropagation(); setShowRaw(!showRaw) }}
              style={{
                padding: '6px 12px',
                background: showRaw ? '#8B5CF6' : 'transparent',
                border: '1px solid #3F3F46',
                borderRadius: 6,
                color: showRaw ? 'white' : '#A1A1AA',
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <Code size={14} /> Código
            </button>
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
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {showRaw ? (
            // Raw content view
            <div style={{ padding: 16 }}>
              <pre style={{
                background: '#27272A',
                padding: 16,
                borderRadius: 8,
                color: '#A1A1AA',
                fontSize: 12,
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                maxHeight: 'calc(90vh - 150px)',
                overflow: 'auto'
              }}>
                {rawContent || 'Carregando...'}
              </pre>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div style={{ 
                display: 'flex', gap: 12, padding: 16, 
                borderBottom: '1px solid #3F3F46',
                background: '#27272A'
              }}>
                <div style={{ 
                  flex: 1, padding: 16, background: 'rgba(16, 185, 129, 0.1)', 
                  borderRadius: 12, border: '1px solid rgba(16, 185, 129, 0.3)'
                }}>
                  <div style={{ color: '#10B981', fontSize: 12, marginBottom: 4 }}>Receitas</div>
                  <div style={{ color: '#10B981', fontSize: 22, fontWeight: 700 }}>
                    {formatAmount(String(totalIncome))}
                  </div>
                </div>
                <div style={{ 
                  flex: 1, padding: 16, background: 'rgba(239, 68, 68, 0.1)', 
                  borderRadius: 12, border: '1px solid rgba(239, 68, 68, 0.3)'
                }}>
                  <div style={{ color: '#EF4444', fontSize: 12, marginBottom: 4 }}>Despesas</div>
                  <div style={{ color: '#EF4444', fontSize: 22, fontWeight: 700 }}>
                    {formatAmount(String(totalExpense))}
                  </div>
                </div>
                <div style={{ 
                  flex: 1, padding: 16, background: balance >= 0 ? 'rgba(139, 92, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)', 
                  borderRadius: 12, border: balance >= 0 ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)'
                }}>
                  <div style={{ color: balance >= 0 ? '#8B5CF6' : '#F59E0B', fontSize: 12, marginBottom: 4 }}>Saldo</div>
                  <div style={{ color: balance >= 0 ? '#8B5CF6' : '#F59E0B', fontSize: 22, fontWeight: 700 }}>
                    {formatAmount(String(balance))}
                  </div>
                </div>
              </div>

              {/* Transactions List */}
              <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
                {loading && (
                  <div style={{ color: '#71717A', textAlign: 'center', padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                    <div style={{ width: 20, height: 20, border: '2px solid #3F3F46', borderTopColor: '#8B5CF6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    Carregando transações...
                  </div>
                )}
                
                {error && transactions.length === 0 && !loading && (
                  <div style={{ 
                    color: '#F59E0B', 
                    textAlign: 'center', 
                    padding: 24, 
                    background: 'rgba(245, 158, 11, 0.1)',
                    borderRadius: 12,
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    marginBottom: 16
                  }}>
                    <FileText size={24} style={{ marginBottom: 8 }} />
                    <div>{error}</div>
                    <button 
                      onClick={() => setShowRaw(true)}
                      style={{
                        marginTop: 12,
                        padding: '8px 16px',
                        background: '#8B5CF6',
                        border: 'none',
                        borderRadius: 6,
                        color: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      Ver conteúdo raw
                    </button>
                  </div>
                )}
                
                {transactions.length === 0 && !loading && !error && (
                  <div style={{ color: '#71717A', textAlign: 'center', padding: 40 }}>
                    Nenhuma transação encontrada
                  </div>
                )}
                
                {transactions.map((tr, idx) => {
                  const isIncome = parseFloat(tr.amount) >= 0
                  return (
                    <div key={idx} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '14px 16px',
                      background: '#27272A',
                      borderRadius: 12,
                      marginBottom: 8,
                      border: '1px solid #3F3F46'
                    }}>
                      <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: isIncome ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {isIncome 
                          ? <ArrowDownLeft size={22} color="#10B981" />
                          : <ArrowUpRight size={22} color="#EF4444" />
                        }
                      </div>
                      
                      <div style={{ flex: 1 }}>
                        <div style={{ color: '#FAFAFA', fontWeight: 500, fontSize: 14, marginBottom: 2 }}>
                          {tr.name || tr.memo || 'Transação'}
                        </div>
                        <div style={{ color: '#71717A', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Calendar size={12} /> 
                          {formatDate(tr.date)}
                          {tr.type && <span style={{ opacity: 0.7 }}>• {tr.type}</span>}
                        </div>
                      </div>
                      
                      <div style={{ 
                        color: isIncome ? '#10B981' : '#EF4444',
                        fontWeight: 700,
                        fontSize: 15
                      }}>
                        {isIncome ? '+' : ''}{formatAmount(tr.amount)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}