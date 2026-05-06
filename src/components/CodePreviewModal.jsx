import { useState, useEffect, useMemo } from 'react'
import { X, Copy, Download, Search, Code, FileCode, Hash } from 'lucide-react'

const languageConfig = {
  javascript: { name: 'JavaScript', color: '#F7DF1E', extensions: ['.js', '.mjs', '.cjs'] },
  typescript: { name: 'TypeScript', color: '#3178C6', extensions: ['.ts', '.tsx', '.mts', '.cts'] },
  c: { name: 'C', color: '#A8B9CC', extensions: ['.c', '.h'] },
  cpp: { name: 'C++', color: '#00599C', extensions: ['.cpp', '.hpp', '.cc', '.cxx'] },
  pascal: { name: 'Pascal', color: '#0072C6', extensions: ['.pas', '.pp', '.inc'] },
  go: { name: 'Go', color: '#00ADD8', extensions: ['.go'] },
  rust: { name: 'Rust', color: '#DEA584', extensions: ['.rs'] },
  ruby: { name: 'Ruby', color: '#CC342D', extensions: ['.rb', '.erb'] },
  java: { name: 'Java', color: '#ED8B00', extensions: ['.java'] },
  php: { name: 'PHP', color: '#777BB4', extensions: ['.php'] },
  swift: { name: 'Swift', color: '#FA7343', extensions: ['.swift'] },
  kotlin: { name: 'Kotlin', color: '#7F52FF', extensions: ['.kt', '.kts'] },
  shell: { name: 'Shell', color: '#4EAA25', extensions: ['.sh', '.bash', '.zsh'] },
  batch: { name: 'Batch', color: '#4EAA25', extensions: ['.bat', '.cmd'] },
  yaml: { name: 'YAML', color: '#CB171E', extensions: ['.yml', '.yaml'] },
  ini: { name: 'Config', color: '#6B6B6B', extensions: ['.ini', '.conf', '.cfg', '.config'] },
  git: { name: 'Git', color: '#F05032', extensions: ['.gitignore', '.gitattributes'] },
  md: { name: 'Markdown', color: '#083FA1', extensions: ['.md', '.markdown'] },
  tex: { name: 'LaTeX', color: '#008080', extensions: ['.tex'] },
  lua: { name: 'Lua', color: '#000080', extensions: ['.lua'] },
  r: { name: 'R', color: '#198CE7', extensions: ['.r', '.R'] },
  scala: { name: 'Scala', color: '#DC322F', extensions: ['.scala', '.sc'] },
  vue: { name: 'Vue', color: '#42B883', extensions: ['.vue'] },
  jsx: { name: 'JSX', color: '#61DAFB', extensions: ['.jsx'] },
  css: { name: 'CSS', color: '#264DE4', extensions: ['.css', '.scss', '.sass', '.less'] },
  sass: { name: 'Sass', color: '#CF649A', extensions: ['.sass'] },
  less: { name: 'Less', color: '#1D365D', extensions: ['.less'] },
}

const detectLanguage = (fileName) => {
  const ext = fileName.toLowerCase()
  for (const [lang, config] of Object.entries(languageConfig)) {
    if (config.extensions.some(e => ext.endsWith(e))) {
      return { lang, ...config }
    }
  }
  return { lang: 'text', name: 'Plain Text', color: '#71717A', extensions: [] }
}

const keywords = {
  javascript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'try', 'catch', 'throw', 'class', 'extends', 'new', 'this', 'super', 'import', 'export', 'default', 'async', 'await', 'typeof', 'instanceof', 'null', 'undefined', 'true', 'false', 'in', 'of', 'yield', 'static', 'get', 'set', 'delete', 'void'],
  typescript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'try', 'catch', 'throw', 'class', 'extends', 'new', 'this', 'super', 'import', 'export', 'default', 'async', 'await', 'typeof', 'instanceof', 'null', 'undefined', 'true', 'false', 'in', 'of', 'yield', 'static', 'get', 'set', 'delete', 'void', 'interface', 'type', 'enum', 'namespace', 'module', 'declare', 'abstract', 'implements', 'private', 'public', 'protected', 'readonly', 'as', 'is', 'keyof', 'infer', 'never', 'unknown', 'any'],
  c: ['int', 'char', 'float', 'double', 'void', 'long', 'short', 'unsigned', 'signed', 'const', 'static', 'extern', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'goto', 'struct', 'union', 'enum', 'typedef', 'sizeof', 'NULL', 'include', 'define', 'ifdef', 'ifndef', 'endif', 'printf', 'scanf', 'malloc', 'free'],
  cpp: ['int', 'char', 'float', 'double', 'void', 'long', 'short', 'unsigned', 'signed', 'const', 'static', 'extern', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'goto', 'struct', 'union', 'enum', 'typedef', 'sizeof', 'class', 'public', 'private', 'protected', 'virtual', 'override', 'new', 'delete', 'this', 'nullptr', 'true', 'false', 'namespace', 'using', 'template', 'typename', 'try', 'catch', 'throw', 'std', 'cout', 'cin', 'endl', 'include', 'define'],
  pascal: ['program', 'begin', 'end', 'var', 'const', 'type', 'function', 'procedure', 'if', 'then', 'else', 'for', 'to', 'downto', 'while', 'do', 'repeat', 'until', 'case', 'of', 'break', 'continue', 'exit', 'result', 'true', 'false', 'nil', 'and', 'or', 'not', 'in', 'is', 'as', 'class', 'interface', 'implementation', 'initialization', 'finalization', 'try', 'except', 'finally', 'raise', 'inherited', 'constructor', 'destructor'],
  java: ['public', 'private', 'protected', 'static', 'final', 'abstract', 'class', 'interface', 'extends', 'implements', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'try', 'catch', 'throw', 'throws', 'new', 'this', 'super', 'null', 'true', 'false', 'import', 'package', 'void', 'int', 'long', 'double', 'float', 'boolean', 'char', 'byte', 'short', 'enum', 'instanceof', 'synchronized', 'volatile', 'transient', 'native'],
  go: ['package', 'import', 'func', 'var', 'const', 'type', 'struct', 'interface', 'map', 'chan', 'return', 'if', 'else', 'for', 'range', 'switch', 'case', 'default', 'break', 'continue', 'goto', 'fallthrough', 'defer', 'go', 'select', 'nil', 'true', 'false', 'iota', 'make', 'new', 'len', 'cap', 'append', 'copy', 'delete', 'panic', 'recover'],
  rust: ['fn', 'let', 'mut', 'const', 'static', 'struct', 'enum', 'trait', 'impl', 'pub', 'mod', 'use', 'crate', 'self', 'super', 'return', 'if', 'else', 'match', 'for', 'while', 'loop', 'break', 'continue', 'as', 'in', 'where', 'async', 'await', 'move', 'ref', 'type', 'dyn', 'unsafe', 'extern', 'true', 'false', 'Some', 'None', 'Ok', 'Err', 'self'],
  python: ['def', 'class', 'return', 'if', 'elif', 'else', 'for', 'while', 'break', 'continue', 'pass', 'try', 'except', 'finally', 'raise', 'import', 'from', 'as', 'with', 'yield', 'lambda', 'global', 'nonlocal', 'assert', 'del', 'in', 'is', 'not', 'and', 'or', 'True', 'False', 'None', 'async', 'await', 'self', 'print'],
  batch: ['echo', 'set', 'if', 'else', 'not', 'exist', 'defined', 'goto', 'call', 'exit', 'rem', 'pause', 'cls', 'cd', 'dir', 'copy', 'move', 'del', 'mkdir', 'rmdir', 'type', 'find', 'start', 'tasklist', 'taskkill', 'ping', 'ipconfig', 'net', 'sc', 'reg', 'attrib', 'format', 'chkdsk', 'cls', 'title', 'prompt', 'setlocal', 'endlocal', 'enabledelayedexpansion', 'for', 'in', 'do', 'goto', 'shift', 'errorlevel', 'nul', 'comspec', 'processor', 'random', 'time', 'date', 'ver', 'vol', 'break', 'off', 'on'],
}

const highlightCode = (code, language) => {
  const lines = code.split('\n')
  return lines.map((line, lineNum) => {
    let result = escapeHtml(line)
    
    // Comments
    if (language === 'python' || language === 'shell' || language === 'yaml' || language === 'git') {
      result = result.replace(/(#.*)$/gm, '<span class="code-comment">$1</span>')
    } else {
      result = result.replace(/(\/\/.*)$/gm, '<span class="code-comment">$1</span>')
      result = result.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="code-comment">$1</span>')
    }
    
    // Strings
    result = result.replace(/(["'`])(?:(?!\1)[^\\]|\\.)*\1/g, '<span class="code-string">$&</span>')
    
    // Numbers
    result = result.replace(/\b(\d+\.?\d*)\b/g, '<span class="code-number">$1</span>')
    
    // Keywords
    const langKeywords = keywords[language] || keywords.javascript
    langKeywords.forEach(kw => {
      const regex = new RegExp(`\\b(${kw})\\b`, 'g')
      result = result.replace(regex, '<span class="code-keyword">$1</span>')
    })
    
    // Functions
    result = result.replace(/(\w+)\s*\(/g, '<span class="code-function">$1</span>(')
    
    // Types (for typed languages)
    if (['typescript', 'java', 'cpp', 'c', 'rust', 'go'].includes(language)) {
      result = result.replace(/\b([A-Z][a-zA-Z0-9_]*)\b/g, '<span class="code-type">$1</span>')
    }
    
    return { num: lineNum + 1, code: result }
  })
}

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function CodePreviewModal({ data, onClose }) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  const fileName = data?.fileName || ''
  const langInfo = detectLanguage(fileName)

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

  const highlightedLines = useMemo(() => {
    if (!content) return []
    return highlightCode(content, langInfo.lang)
  }, [content, langInfo.lang])

  const filteredLines = searchTerm 
    ? highlightedLines.filter(l => l.code.toLowerCase().includes(searchTerm.toLowerCase()))
    : highlightedLines

  const lineCount = content.split('\n').length

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
              background: `linear-gradient(135deg, ${langInfo.color}, ${langInfo.color}88)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <FileCode size={20} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ color: '#FAFAFA', fontWeight: 600, fontSize: 14 }}>
                {data?.fileName || 'Code File'}
              </div>
              <div style={{ color: '#71717A', fontSize: 12 }}>
                {langInfo.name} • {lineCount} linhas
                {data?.fileSize ? ` • ${(data.fileSize / 1024).toFixed(1)} KB` : ''}
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
              placeholder={`Buscar em ${lineCount} linhas...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: 'transparent', border: 'none', color: '#FAFAFA',
                fontSize: 13, outline: 'none', width: '100%'
              }}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', color: '#71717A', cursor: 'pointer' }}>×</button>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', background: '#1e1e1e' }}>
          <style>{`
            .code-keyword { color: #569CD6; font-weight: 500; }
            .code-string { color: #CE9178; }
            .code-number { color: #B5CEA8; }
            .code-comment { color: #6A9955; font-style: italic; }
            .code-function { color: #DCDCAA; }
            .code-type { color: #4EC9B0; }
          `}</style>
          
          {loading && <div style={{ color: '#71717A', textAlign: 'center', padding: 40 }}>Carregando...</div>}
          {error && <div style={{ color: '#EF4444', textAlign: 'center', padding: 40 }}>{error}</div>}
          
          {!loading && !error && content && (
            <pre style={{ 
              margin: 0, padding: 16, fontFamily: "'Consolas', 'Monaco', 'Fira Code', monospace", 
              fontSize: 13, lineHeight: 1.6, color: '#D4D4D4', background: '#1e1e1e'
            }}>
              {filteredLines.map((line, i) => (
                <div key={i} style={{ display: 'flex' }}>
                  <span style={{ 
                    color: '#6A9955', marginRight: 16, userSelect: 'none', 
                    minWidth: 40, textAlign: 'right', fontSize: 12 
                  }}>
                    {line.num}
                  </span>
                  <code 
                    style={{ whiteSpace: 'pre', wordBreak: 'break-all', flex: 1 }}
                    dangerouslySetInnerHTML={{ __html: line.code }}
                  />
                </div>
              ))}
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}