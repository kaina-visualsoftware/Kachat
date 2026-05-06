import { useState, useEffect, useMemo } from 'react'
import { X, Copy, Download, Code, Eye, Search, TreePine, Globe } from 'lucide-react'

export function EnhancedHtmlPreviewModal({ data, onClose }) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showPreview, setShowPreview] = useState(false)
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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content)
  }

  const downloadFile = () => {
    const link = document.createElement('a')
    link.href = data.url
    link.download = data.fileName
    link.click()
  }

  const prettyHtml = useMemo(() => {
    try {
      // Simple HTML formatter
      let formatted = content
        // Add newlines after closing tags
        .replace(/>/g, '>\n')
        // Remove extra whitespace
        .replace(/\n\s*\n/g, '\n')
        // Indent block elements
        .replace(/<\/(div|p|ul|ol|li|table|tr|td|th|thead|tbody|head|body|html|head|style|script|section|article|aside|header|footer|nav|main|h[1-6])>/g, '</$1>\n')
      
      // Simple indent
      const lines = formatted.split('\n')
      let indent = 0
      const result = lines.map(line => {
        const trimmed = line.trim()
        if (!trimmed) return ''
        
        if (trimmed.startsWith('</')) {
          indent = Math.max(0, indent - 1)
        }
        
        const result = '  '.repeat(indent) + trimmed
        
        if (trimmed.startsWith('<') && !trimmed.startsWith('</') && !trimmed.endsWith('/>') && !['<br', '<hr', '<img', '<input', '<meta', '<link'].some(t => trimmed.startsWith(t))) {
          indent++
        }
        
        return result
      }).join('\n')
      
      return result
    } catch (e) {
      return content
    }
  }, [content])

  const highlightHtml = (line) => {
    let result = escapeHtml(line)
    // Tags
    result = result.replace(/(&lt;\/?)([\w:-]+)/g, '$1<span style="color: #569CD6">$2</span>')
    // Attributes
    result = result.replace(/([\w:-]+)=(&quot;)/g, '<span style="color: #9CDCFE">$1</span>=<span style="color: #CE9178">$2')
    result = result.replace(/(=)(&quot;[^&]*&quot;)/g, '<span style="color: #9CDCFE">$1</span><span style="color: #CE9178">$2</span>')
    // Closing tags
    result = result.replace(/(\/&gt;)/g, '<span style="color: #569CD6">$1</span>')
    // DOCTYPE
    result = result.replace(/(&lt;!DOCTYPE)/gi, '<span style="color: #C586C0">$1</span>')
    return result
  }

  const buildTree = useMemo(() => {
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(content, 'text/html')
      const errorNode = doc.querySelector('parsererror')
      if (errorNode) return null

      const buildNode = (node, path = 'root', depth = 0) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent.trim()
          return text ? { type: 'text', content: text, path, depth } : null
        }
        
        if (node.nodeType !== Node.ELEMENT_NODE) return null
        
        const currentPath = path + '/' + (node.tagName || 'element')
        const children = []
        
        node.childNodes.forEach((child, i) => {
          const childNode = buildNode(child, currentPath + '_' + i, depth + 1)
          if (childNode) children.push(childNode)
        })
        
        return {
          type: 'element',
          tag: node.tagName,
          attributes: Array.from(node.attributes || []).map(a => ({ name: a.name, value: a.value })),
          children,
          path: currentPath,
          depth
        }
      }
      
      return buildNode(doc.body || doc.documentElement)
    } catch (e) {
      return null
    }
  }, [content])

  const renderTree = (node, index) => {
    if (!node) return null
    
    if (node.type === 'text') {
      return (
        <div key={index} style={{ 
          padding: '2px 8px', color: '#A1A1AA', fontStyle: 'italic',
          background: searchTerm && node.content.toLowerCase().includes(searchTerm.toLowerCase()) ? 'rgba(139, 92, 246, 0.2)' : 'transparent'
        }}>
          "{node.content}"
        </div>
      )
    }
    
    const hasChildren = node.children && node.children.length > 0
    const tagColor = node.tag ? '#EC4899' : '#8B5CF6'
    
    return (
      <div key={index} style={{ marginLeft: node.depth * 16 }}>
        <div style={{ 
          padding: '4px 8px', borderRadius: 4,
          background: searchTerm && node.tag?.toLowerCase().includes(searchTerm.toLowerCase()) ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
          display: 'flex', alignItems: 'center', gap: 4
        }}>
          <span style={{ color: tagColor }}>&lt;</span>
          <span style={{ color: '#569CD6', fontWeight: 600 }}>{node.tag}</span>
          {node.attributes?.slice(0, 3).map((attr, i) => (
            <span key={i} style={{ color: '#9CDCFE' }}>
              {' '}{attr.name}="<span style={{ color: '#CE9178' }}>{attr.value.length > 15 ? attr.value.slice(0,15)+'...' : attr.value}</span>"
            </span>
          ))}
          {node.attributes?.length > 3 && <span style={{ color: '#71717A' }}>...</span>}
          <span style={{ color: tagColor }}>&gt;</span>
        </div>
        {hasChildren && node.children.map((child, i) => renderTree(child, node.path + '_' + i))}
      </div>
    )
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.95)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 9999, cursor: 'pointer', padding: 20
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 1000, height: '90vh', background: '#1e1e1e',
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
              background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Globe size={20} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ color: '#FAFAFA', fontWeight: 600, fontSize: 14 }}>
                {data?.fileName || 'HTML File'}
              </div>
              <div style={{ color: '#71717A', fontSize: 12 }}>
                HTML • {content.split('\n').length} linhas
                {data?.fileSize ? ` • ${(data.fileSize / 1024).toFixed(1)} KB` : ''}
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={(e) => { e.stopPropagation(); setShowPreview(!showPreview) }}
              style={{
                padding: '6px 12px', background: showPreview ? '#6366F1' : 'transparent',
                border: '1px solid #3F3F46', borderRadius: 6, color: showPreview ? 'white' : '#A1A1AA',
                fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
              }}>
              <Eye size={14} /> {showPreview ? 'Código' : 'Visualizar'}
            </button>
            {buildTree && (
              <button onClick={(e) => { e.stopPropagation(); setShowTree(!showTree) }}
                style={{
                  padding: '6px 12px', background: showTree ? '#6366F1' : 'transparent',
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
          
          {!loading && !error && content && showPreview && (
            <iframe 
              srcDoc={content}
              style={{ width: '100%', height: '100%', border: 'none', background: 'white' }}
              title="HTML Preview"
            />
          )}
          
          {!loading && !error && content && !showPreview && showTree && buildTree ? (
            <div style={{ padding: 16, fontFamily: 'monospace', fontSize: 13 }}>
              {renderTree(buildTree, 0)}
            </div>
          ) : (
            !loading && !error && content && (
              <pre style={{ 
                margin: 0, padding: 16, fontFamily: "'Consolas', 'Monaco', monospace", 
                fontSize: 13, lineHeight: 1.6, color: '#D4D4D4', background: '#1e1e1e'
              }}>
                {(searchTerm ? prettyHtml.split('\n').filter(l => l.toLowerCase().includes(searchTerm.toLowerCase())) : prettyHtml.split('\n')).map((line, i) => (
                  <div key={i} style={{ display: 'flex' }}>
                    <span style={{ color: '#6A9955', marginRight: 16, userSelect: 'none', minWidth: 40, textAlign: 'right' }}>
                      {i + 1}
                    </span>
                    <code style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }} dangerouslySetInnerHTML={{ __html: highlightHtml(line) }} />
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