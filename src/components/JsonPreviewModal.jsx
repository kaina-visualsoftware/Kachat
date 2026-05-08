import { useState, useEffect, useMemo } from 'react'
import { X, Copy, Download, Search, TreePine } from 'lucide-react'

export function JsonPreviewModal({ data, onClose }) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showTree, setShowTree] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (!data?.url) return
    
    setLoading(true)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    
    fetch(data.url, { signal: controller.signal })
      .then(res => res.text())
      .then(text => {
        setContent(text)
        setLoading(false)
      })
      .catch(err => {
        setError(err.name === 'AbortError' ? 'Tempo limite excedido' : 'Erro ao carregar arquivo')
        setLoading(false)
      })
    
    return () => clearTimeout(timeout)
  }, [data?.url])

  const parsedJson = useMemo(() => {
    try {
      return JSON.parse(content)
    } catch (e) {
      return null
    }
  }, [content])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content)
  }

  const downloadFile = () => {
    const link = document.createElement('a')
    link.href = data.url
    link.download = data.fileName
    link.click()
  }

  const highlightJson = (line, indent = 0) => {
    let result = escapeHtml(line)
    result = result.replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:')
    result = result.replace(/: "([^"]*)"/g, ': <span class="json-string">"$1"</span>')
    result = result.replace(/: (-?\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
    result = result.replace(/\b(true|false|null)\b/g, '<span class="json-boolean">$1</span>')
    return result
  }

  const prettyJson = useMemo(() => {
    try {
      const parsed = JSON.parse(content)
      return JSON.stringify(parsed, null, 2)
    } catch (e) {
      return content
    }
  }, [content])

  const renderTree = (obj, key = null, depth = 0, path = 'root') => {
    const isObject = obj !== null && typeof obj === 'object'
    const isArray = Array.isArray(obj)
    const isCollapsed = depth > 2
    
    if (!isObject) {
      const valueColor = typeof obj === 'string' ? '#CE9178' : typeof obj === 'number' ? '#B5CEA8' : '#569CD6'
      return (
        <span style={{ color: valueColor }}>
          {typeof obj === 'string' ? `"${obj}"` : String(obj)}
        </span>
      )
    }
    
    const entries = Object.entries(obj)
    const currentPath = path + '/' + (key || 'root')
    
    return (
      <div style={{ marginLeft: depth > 0 ? 16 : 0 }}>
        <span style={{ color: isArray ? '#DCDCAA' : '#EC4899' }}>
          {key ? `"${key}": ` : ''}
          {isArray ? '[' : '{'}
        </span>
        {!isCollapsed && entries.map(([k, v], i) => (
          <div key={k}>
            {renderTree(v, isArray ? null : k, depth + 1, currentPath + '_' + i)}
            {i < entries.length - 1 && <span style={{ color: '#71717A' }}>,</span>}
          </div>
        ))}
        {isCollapsed && <span style={{ color: '#71717A' }}>...</span>}
        <span style={{ color: isArray ? '#DCDCAA' : '#EC4899' }}>
          {isArray ? ']' : '}'}
        </span>
      </div>
    )
  }

  const lineCount = content.split('\n').length

  return (
    <div onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.95)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 9999, cursor: 'pointer', padding: 20
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: '800px', maxHeight: '80vh', background: '#1e1e1e',
        borderRadius: 16, border: '1px solid #3F3F46', display: 'flex',
        flexDirection: 'column', overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '12px 16px', borderBottom: '1px solid #3F3F46',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: '#27272A', flexWrap: 'wrap', gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ 
              width: 36, height: 36, borderRadius: 8, 
              background: 'linear-gradient(135deg, #10B981, #059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: '#FFFFFF'
            }}>JSON</div>
            <div>
              <div style={{ color: '#FAFAFA', fontWeight: 600, fontSize: 14 }}>
                {data?.fileName || 'JSON File'}
              </div>
              <div style={{ color: '#71717A', fontSize: 12 }}>
                {lineCount} linhas • {parsedJson ? 'Válido' : 'Inválido'}
                {data?.fileSize ? ` • ${(data.fileSize / 1024).toFixed(1)} KB` : ''}
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {parsedJson && (
              <button onClick={(e) => { e.stopPropagation(); setShowTree(!showTree) }}
                style={{
                  padding: '6px 12px', background: showTree ? '#10B981' : 'transparent',
                  border: '1px solid #3F3F46', borderRadius: 6, color: showTree ? 'white' : '#A1A1AA',
                  fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                }}>
                <TreePine size={14} /> {showTree ? 'Código' : 'Árvore'}
              </button>
            )}
            <button onClick={(e) => { e.stopPropagation(); copyToClipboard() }}
              style={{
                padding: '6px 12px', background: 'transparent', border: '1px solid #3F3F46',
                borderRadius: 6, color: '#A1A1AA', fontSize: 12, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4
              }}>
              <Copy size={14} /> Copiar
            </button>
            <button onClick={(e) => { e.stopPropagation(); downloadFile() }}
              style={{
                padding: '6px 12px', background: 'transparent', border: '1px solid #3F3F46',
                borderRadius: 6, color: '#A1A1AA', fontSize: 12, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4
              }}>
              <Download size={14} /> Baixar
            </button>
            <button onClick={(e) => { e.stopPropagation(); onClose() }}
              style={{
                width: 32, height: 32, borderRadius: '50%', background: 'transparent',
                border: 'none', color: '#A1A1AA', fontSize: 20, cursor: 'pointer'
              }}>×</button>
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: '8px 16px', borderBottom: '1px solid #3F3F46', background: '#1e1e1e' }}>
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: 8, 
            background: '#27272A', borderRadius: 8, padding: '6px 12px',
            border: '1px solid #3F3F46'
          }}>
            <Search size={16} color="#71717A" />
            <input 
              type="text" 
              placeholder="Buscar..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: 'transparent', border: 'none', color: '#FAFAFA',
                fontSize: 13, outline: 'none', width: '100%'
              }}
            />
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', background: '#1e1e1e' }}>
          {loading && <div style={{ color: '#71717A', textAlign: 'center', padding: 40 }}>Carregando...</div>}
          {error && <div style={{ color: '#EF4444', textAlign: 'center', padding: 40 }}>{error}</div>}
          
          {!loading && !error && content && showTree && parsedJson ? (
            <div style={{ padding: 20, fontFamily: 'monospace', fontSize: 13 }}>
              <pre style={{ margin: 0, color: '#D4D4D8' }}>
                {renderTree(parsedJson)}
              </pre>
            </div>
          ) : (
            !loading && !error && content && (
              <pre style={{ 
                margin: 0, padding: 20, fontFamily: "'Consolas', 'Monaco', monospace", 
                fontSize: 13, lineHeight: 1.6, color: '#D4D4D4', background: '#1e1e1e'
              }}>
                <style>{`
                  .json-key { color: #9CDCFE; }
                  .json-string { color: #CE9178; }
                  .json-number { color: #B5CEA8; }
                  .json-boolean { color: #569CD6; }
                `}</style>
                {(searchTerm ? prettyJson.split('\n').filter(l => l.toLowerCase().includes(searchTerm.toLowerCase())) : prettyJson.split('\n')).map((line, i) => (
                  <div key={i} style={{ display: 'flex' }}>
                    <span style={{ color: '#6A9955', marginRight: 16, userSelect: 'none', minWidth: 40, textAlign: 'right' }}>
                      {i + 1}
                    </span>
                    <code style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }} dangerouslySetInnerHTML={{ __html: highlightJson(line) }} />
                  </div>
                ))}
              </pre>
            )
          )}
        </div>
      </div>
    </div>
  )
}

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}