import { useState, useEffect, useMemo } from 'react'
import { X, Copy, Download, Code, TreePine, Search, ChevronRight, ChevronDown, Minus, Plus } from 'lucide-react'

export function XmlPreviewModal({ data, onClose }) {
  const [xmlContent, setXmlContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showTree, setShowTree] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [collapsedNodes, setCollapsedNodes] = useState(new Set())

  useEffect(() => {
    if (!data?.url) return
    
    setLoading(true)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    
    fetch(data.url, { signal: controller.signal })
      .then(res => res.text())
      .then(text => {
        setXmlContent(text)
        setLoading(false)
      })
      .catch(err => {
        setError(err.name === 'AbortError' ? 'Tempo limite excedido' : 'Erro ao carregar arquivo')
        setLoading(false)
      })
    
    return () => clearTimeout(timeout)
  }, [data?.url])

  const toggleNode = (path) => {
    const newCollapsed = new Set(collapsedNodes)
    if (newCollapsed.has(path)) {
      newCollapsed.delete(path)
    } else {
      newCollapsed.add(path)
    }
    setCollapsedNodes(newCollapsed)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(xmlContent)
  }

  const downloadFile = () => {
    const link = document.createElement('a')
    link.href = data.url
    link.download = data.fileName
    link.click()
  }

  const prettyXml = useMemo(() => {
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(xmlContent, 'text/xml')
      const errorNode = doc.querySelector('parsererror')
      if (errorNode) return xmlContent
      
      const format = (node, indent = 0) => {
        const spaces = '  '.repeat(indent)
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent.trim()
          return text ? spaces + text + '\n' : ''
        }
        if (node.nodeType !== Node.ELEMENT_NODE) return ''
        
        const children = Array.from(node.childNodes)
        const textChildren = children.filter(c => c.nodeType === Node.TEXT_NODE && c.textContent.trim())
        const elementChildren = children.filter(c => c.nodeType === Node.ELEMENT_NODE)
        
        let result = spaces + '<' + node.tagName
        const attrs = Array.from(node.attributes).map(a => ` ${a.name}="${a.value}"`).join('')
        result += attrs
        
        if (elementChildren.length === 0 && textChildren.length === 0) {
          result += ' />\n'
        } else if (elementChildren.length === 0 && textChildren.length === 1 && textChildren[0].textContent.trim()) {
          result += '>' + textChildren[0].textContent.trim() + '</' + node.tagName + '>\n'
        } else {
          result += '>\n'
          elementChildren.forEach(child => {
            result += format(child, indent + 1)
          })
          result += spaces + '</' + node.tagName + '>\n'
        }
        return result
      }
      
      const root = doc.documentElement
      if (!root) return xmlContent
      return format(root)
    } catch (e) {
      return xmlContent
    }
  }, [xmlContent])

  const xmlTree = useMemo(() => {
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(xmlContent, 'text/xml')
      const errorNode = doc.querySelector('parsererror')
      if (errorNode) return null
      
      const buildTree = (node, path = 'root') => {
        const currentPath = path + '/' + (node.tagName || 'document')
        
        const children = Array.from(node.childNodes)
          .filter(c => c.nodeType === Node.ELEMENT_NODE)
          .map((child, i) => buildTree(child, currentPath + '_' + i))
        
        const textContent = Array.from(node.childNodes)
          .filter(c => c.nodeType === Node.TEXT_NODE && c.textContent.trim())
          .map(c => c.textContent.trim())
          .join('')
        
        return {
          tagName: node.tagName,
          attributes: Array.from(node.attributes || []),
          textContent,
          children,
          path: currentPath
        }
      }
      
      return buildTree(doc.documentElement)
    } catch (e) {
      return null
    }
  }, [xmlContent])

  const highlightXml = (line) => {
    const escaped = escapeHtml(line)
    let result = escaped.replace(/(&lt;\/?)([\w:-]+)/g, '$1<span class="xml-tag">$2</span>')
    result = result.replace(/([\w:-]+)=(&quot;)/g, '<span class="xml-attr">$1</span>=<span class="xml-string">$2')
    result = result.replace(/(=)(&quot;[^&]*&quot;)/g, '<span class="xml-attr">$1</span><span class="xml-string">$2</span>')
    result = result.replace(/(\/&gt;)/g, '<span class="xml-tag">$1</span>')
    return result
  }

  const renderTreeNode = (node, depth = 0) => {
    const isCollapsed = collapsedNodes.has(node.path)
    const hasChildren = node.children && node.children.length > 0
    
    return (
      <div key={node.path} style={{ marginLeft: depth * 16 }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 4,
          padding: '4px 8px',
          borderRadius: 4,
          cursor: hasChildren ? 'pointer' : 'default',
          background: searchTerm && (node.tagName?.includes(searchTerm) || node.textContent?.includes(searchTerm)) 
            ? 'rgba(139, 92, 246, 0.2)' : 'transparent'
        }} onClick={() => hasChildren && toggleNode(node.path)}>
          {hasChildren && (
            isCollapsed ? <ChevronRight size={14} color="#8B5CF6" /> : <ChevronDown size={14} color="#8B5CF6" />
          )}
          <span style={{ color: '#EC4899', fontWeight: 500 }}>&lt;</span>
          <span style={{ color: '#569CD6', fontWeight: 600 }}>{node.tagName}</span>
          {node.attributes?.map(attr => (
            <span key={attr.name}>
              <span style={{ color: '#9CDCFE' }}> {attr.name}</span>
              <span style={{ color: '#CE9178' }}>=</span>
              <span style={{ color: '#CE9178' }}>"{attr.value}"</span>
            </span>
          ))}
          {node.textContent && !hasChildren && (
            <span>
              <span style={{ color: '#EC4899' }}>&gt;</span>
              <span style={{ color: '#A1A1AA' }}>{node.textContent}</span>
            </span>
          )}
          <span style={{ color: '#EC4899' }}>&gt;</span>
        </div>
        {hasChildren && !isCollapsed && node.children.map(child => renderTreeNode(child, depth + 1))}
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
              background: 'linear-gradient(135deg, #EC4899, #DB2777)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: '#FFFFFF'
            }}>XML</div>
            <div>
              <div style={{ color: '#FAFAFA', fontWeight: 600, fontSize: 14 }}>
                {data?.fileName || 'XML File'}
              </div>
              <div style={{ color: '#71717A', fontSize: 12 }}>
                {xmlContent ? `${xmlContent.split('\n').length} linhas` : ''}
                {data?.fileSize ? ` • ${(data.fileSize / 1024).toFixed(1)} KB` : ''}
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {xmlTree && (
              <button onClick={(e) => { e.stopPropagation(); setShowTree(!showTree) }}
                style={{
                  padding: '6px 12px', background: showTree ? '#8B5CF6' : 'transparent',
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

        {/* Search Bar */}
        <div style={{ padding: '8px 16px', borderBottom: '1px solid #3F3F46', background: '#1e1e1e' }}>
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: 8, 
            background: '#27272A', borderRadius: 8, padding: '6px 12px',
            border: '1px solid #3F3F46'
          }}>
            <Search size={16} color="#71717A" />
            <input 
              type="text" 
              placeholder="Buscar no XML..." 
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
          
          {!loading && !error && xmlContent && showTree && xmlTree ? (
            <div style={{ padding: 16, fontFamily: 'monospace', fontSize: 13 }}>
              {renderTreeNode(xmlTree)}
            </div>
          ) : (
            !loading && !error && xmlContent && (
              <pre style={{ 
                margin: 0, padding: 20, fontFamily: "'Consolas', 'Monaco', monospace", 
                fontSize: 13, lineHeight: 1.6, color: '#D4D4D4', background: '#1e1e1e'
              }}>
                <style>{`
                  .xml-tag { color: #569CD6; }
                  .xml-attr { color: #9CDCFE; }
                  .xml-string { color: #CE9178; }
                `}</style>
                {(searchTerm ? prettyXml.split('\n').filter(l => l.toLowerCase().includes(searchTerm.toLowerCase())) : prettyXml.split('\n')).map((line, i) => (
                  <div key={i} style={{ display: 'flex' }}>
                    <span style={{ color: '#6A9955', marginRight: 16, userSelect: 'none', minWidth: 40, textAlign: 'right' }}>
                      {i + 1}
                    </span>
                    <code style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }} dangerouslySetInnerHTML={{ __html: highlightXml(line) }} />
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