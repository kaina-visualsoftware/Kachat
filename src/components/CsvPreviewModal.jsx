import { useState, useEffect, useMemo, useRef } from 'react'
import { X, Copy, Download, Search, Download as DownloadIcon, FileSpreadsheet, ArrowUpDown } from 'lucide-react'

const detectDelimiter = (text) => {
  const firstLines = text.split('\n').slice(0, 5).filter(l => l.trim())
  if (firstLines.length === 0) return ','
  
  const delimiters = [
    { char: ';', name: 'semicolon' },
    { char: ',', name: 'comma' },
    { char: '\t', name: 'tab' },
    { char: '|', name: 'pipe' }
  ]
  
  let bestDelimiter = ','
  let maxScore = 0
  
  delimiters.forEach(({ char, name }) => {
    let score = 0
    let consistent = true
    let prevCount = 0
    
    firstLines.forEach(line => {
      const count = (line.match(new RegExp(char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length
      
      if (firstLines.indexOf(line) > 0 && prevCount !== 0 && count !== prevCount) {
        consistent = false
      }
      score += count
      prevCount = count
    })
    
    // Prefer consistent delimiters with higher counts
    const finalScore = consistent ? score * 2 : score
    
    if (finalScore > maxScore) {
      maxScore = finalScore
      bestDelimiter = char
    }
  })
  
  return bestDelimiter
}

export function CsvPreviewModal({ data, onClose }) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortColumn, setSortColumn] = useState(null)
  const [sortDirection, setSortDirection] = useState('asc')
  const delimiterRef = useRef(',')

  useEffect(() => {
    if (!data?.url) return
    
    setLoading(true)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    
    fetch(data.url, { signal: controller.signal })
      .then(res => res.text())
      .then(text => {
        delimiterRef.current = detectDelimiter(text)
        setContent(text)
        setLoading(false)
      })
      .catch(err => {
        setError(err.name === 'AbortError' ? 'Tempo limite excedido' : 'Erro ao carregar arquivo')
        setLoading(false)
      })
    
    return () => clearTimeout(timeout)
  }, [data?.url])

  const tableData = useMemo(() => {
    if (!content) return { headers: [], rows: [], totalRows: 0, delimiter: ',' }
    
    const delimiter = delimiterRef.current
    
    const lines = content.split('\n').filter(l => l.trim())
    if (lines.length === 0) return { headers: [], rows: [], totalRows: 0, delimiter }
    
    const parseRow = (line) => {
      const result = []
      let current = ''
      let inQuotes = false
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === delimiter && !inQuotes) {
          result.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      result.push(current.trim())
      return result
    }
    
    const headers = parseRow(lines[0])
    const rows = lines.slice(1).map(parseRow)
    
    // Apply sorting
    if (sortColumn !== null) {
      rows.sort((a, b) => {
        const aVal = a[sortColumn] || ''
        const bVal = b[sortColumn] || ''
        
        // Try numeric sort
        const aNum = parseFloat(aVal)
        const bNum = parseFloat(bVal)
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortDirection === 'asc' ? aNum - bNum : bNum - aNum
        }
        
        // String sort
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      })
    }
    
    // Apply search filter
    const filteredRows = searchTerm
      ? rows.filter(row => row.some(cell => cell.toLowerCase().includes(searchTerm.toLowerCase())))
      : rows
    
    const currentDelimiter = delimiterRef.current
    
    return { 
      headers, 
      rows: filteredRows, 
      totalRows: rows.length,
      filteredRows: filteredRows.length,
      delimiter: currentDelimiter
    }
  }, [content, sortColumn, sortDirection, searchTerm])

  const handleSort = (colIndex) => {
    if (sortColumn === colIndex) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(colIndex)
      setSortDirection('asc')
    }
  }

  const downloadFile = () => {
    const link = document.createElement('a')
    link.href = data.url
    link.download = data.fileName
    link.click()
  }

  const downloadFiltered = () => {
    const currentDelimiter = tableData.delimiter || ','
    const csv = [tableData.headers.join(currentDelimiter), ...tableData.rows.map(r => r.join(currentDelimiter))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `filtered_${data.fileName}`
    link.click()
    URL.revokeObjectURL(url)
  }

  const exportToJson = () => {
    const json = tableData.rows.map(row => {
      const obj = {}
      tableData.headers.forEach((h, i) => obj[h] = row[i])
      return obj
    })
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = data.fileName.replace(/\.csv$/i, '.json')
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.95)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 9999, cursor: 'pointer', padding: 20
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: '800px', maxHeight: '80vh', background: '#18181B',
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
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <FileSpreadsheet size={20} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ color: '#FAFAFA', fontWeight: 600, fontSize: 14 }}>
                {data?.fileName || 'CSV File'}
              </div>
              <div style={{ color: '#71717A', fontSize: 12 }}>
                {tableData.headers.length} colunas • {tableData.totalRows} linhas
                {searchTerm && ` • ${tableData.filteredRows} filtradas`}
                • Delimitador: {tableData.delimiter === ';' ? ';' : tableData.delimiter === '\t' ? 'Tab' : tableData.delimiter === '|' ? '|' : ','}
                {data?.fileSize ? ` • ${(data.fileSize / 1024).toFixed(1)} KB` : ''}
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={(e) => { e.stopPropagation(); downloadFiltered() }}
              style={{
                padding: '6px 12px', background: 'transparent', border: '1px solid #3F3F46',
                borderRadius: 6, color: '#A1A1AA', fontSize: 12, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4
              }}>
              <DownloadIcon size={14} /> Exportar
            </button>
            <button onClick={(e) => { e.stopPropagation(); exportToJson() }}
              style={{
                padding: '6px 12px', background: 'transparent', border: '1px solid #3F3F46',
                borderRadius: 6, color: '#A1A1AA', fontSize: 12, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4
              }}>
              JSON
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
        <div style={{ padding: '8px 16px', borderBottom: '1px solid #3F3F46', background: '#18181B' }}>
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: 8, 
            background: '#27272A', borderRadius: 8, padding: '6px 12px',
            border: '1px solid #3F3F46'
          }}>
            <Search size={16} color="#71717A" />
            <input 
              type="text" 
              placeholder="Buscar em todas as colunas..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: 'transparent', border: 'none', color: '#FAFAFA',
                fontSize: 13, outline: 'none', width: '100%'
              }}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', color: '#71717A', cursor: 'pointer' }}>
                ×
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflow: 'auto', background: '#18181B' }}>
          {loading && <div style={{ color: '#71717A', textAlign: 'center', padding: 40 }}>Carregando...</div>}
          {error && <div style={{ color: '#EF4444', textAlign: 'center', padding: 40 }}>{error}</div>}
          
          {!loading && !error && tableData.headers.length > 0 && (
            <table style={{ 
              width: '100%', borderCollapse: 'collapse', 
              fontSize: 13, fontFamily: 'monospace'
            }}>
              <thead style={{ position: 'sticky', top: 0, background: '#27272A', zIndex: 1 }}>
                <tr>
                  <th style={{ 
                    padding: '10px 12px', textAlign: 'left', color: '#A1A1AA', 
                    borderBottom: '1px solid #3F3F46', fontWeight: 600, cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}>#</th>
                  {tableData.headers.map((header, i) => (
                    <th key={i} onClick={() => handleSort(i)} style={{ 
                      padding: '10px 12px', textAlign: 'left', color: '#FAFAFA', 
                      borderBottom: '1px solid #3F3F46', fontWeight: 600, cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {header}
                        <ArrowUpDown size={14} color={sortColumn === i ? '#8B5CF6' : '#71717A'} />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.rows.map((row, rowIndex) => (
                  <tr key={rowIndex} style={{ background: rowIndex % 2 === 0 ? 'transparent' : 'rgba(39, 39, 42, 0.3)' }}>
                    <td style={{ padding: '8px 12px', color: '#71717A', borderBottom: '1px solid #27272A' }}>
                      {rowIndex + 1}
                    </td>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} style={{ 
                        padding: '8px 12px', color: '#D4D4D8', borderBottom: '1px solid #27272A',
                        maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                      }}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          
          {!loading && !error && tableData.headers.length === 0 && (
            <div style={{ color: '#71717A', textAlign: 'center', padding: 40 }}>
              Nenhum dado encontrado
            </div>
          )}
        </div>
      </div>
    </div>
  )
}