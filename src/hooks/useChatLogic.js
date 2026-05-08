import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'
import { parseFileMessage } from '../utils/linkDetector.jsx'
import { getCommands, processCommand } from '../utils/commands'

export function useChatLogic({
  chatType,
  chatId,
  fetchMessages,
  sendMessage,
  uploadFiles,
  subscribe,
  currentUserId,
  currentUserProfile,
  members = [],
  isGroupChat = false
}) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('connecting')
  const messagesEndRef = useRef(null)
  
  // Profiles map for avatars
  const [profilesMap, setProfilesMap] = useState({})

  // File upload states
  const [selectedFiles, setSelectedFiles] = useState([])
  const [uploadProgress, setUploadProgress] = useState({}) // { [index]: percent }
  const [uploadStatus, setUploadStatus] = useState({}) // { [index]: 'pending' | 'uploading' | 'success' | 'error' }
  const [previews, setPreviews] = useState([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  // Preview states
  const [previewImage, setPreviewImage] = useState(null)
  const [previewVideo, setPreviewVideo] = useState(null)
  const [previewPdf, setPreviewPdf] = useState(null)
  const [previewDoc, setPreviewDoc] = useState(null)
  const [previewHtml, setPreviewHtml] = useState(null)
  const [previewCsv, setPreviewCsv] = useState(null)
  const [previewSvg, setPreviewSvg] = useState(null)
  const [previewPython, setPreviewPython] = useState(null)
  const [previewOfx, setPreviewOfx] = useState(null)
  const [previewXml, setPreviewXml] = useState(null)
  const [previewSql, setPreviewSql] = useState(null)
  const [previewJsonc, setPreviewJsonc] = useState(null)
  const [previewJson, setPreviewJson] = useState(null)
  const [previewMd, setPreviewMd] = useState(null)
  const [previewCode, setPreviewCode] = useState(null)
  const [previewArchive, setPreviewArchive] = useState(null)

  // Command states
  const [showCommandList, setShowCommandList] = useState(false)
  const [filteredCommands, setFilteredCommands] = useState([])
  const [commandIndex, setCommandIndex] = useState(-1)

  // Mention states (only for groups)
  const [showMentionList, setShowMentionList] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')

  // Reply states
  const [replyTo, setReplyTo] = useState(null)
  const [mentionFilter, setMentionFilter] = useState([])
  const [mentionIndex, setMentionIndex] = useState(0)

  // Edit state
  const [editingMessage, setEditingMessage] = useState(null)

  // Message menu state
  const [messageMenu, setMessageMenu] = useState(null)

  // Drag states
  const [isDragOver, setIsDragOver] = useState(false)
  const [dragCounter, setDragCounter] = useState(0)

  // Audio states
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState(null)
  const audioBlobRef = useRef(null)
  const [mediaRecorder, setMediaRecorder] = useState(null)
  const recordingTimerRef = useRef(null)

  const inputRef = useRef(null)

  // Load messages on mount
  useEffect(() => {
    if (!chatId) return
    
    setLoading(true)
    fetchMessages().then(data => {
      setMessages(data || [])
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }, [chatId])

  // Subscribe to real-time messages
  useEffect(() => {
    if (!chatId) return

    const { unsubscribe } = subscribe(setMessages, chatId)
    return unsubscribe
  }, [chatId])

  // Load profiles when messages change
  useEffect(() => {
    if (!messages || messages.length === 0) return
    
    const userIds = [...new Set(messages.map(m => m.sender_id).filter(Boolean))]
    if (userIds.length === 0) return
    
    supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', userIds)
      .then(({ data }) => {
        const map = {}
        data?.forEach(p => { map[p.id] = p })
        setProfilesMap(map)
      })
  }, [messages])

  // Drag counter effect
  useEffect(() => {
    if (isGroupChat) {
      setIsDragOver(dragCounter > 0)
    }
  }, [dragCounter, isGroupChat])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const getSenderName = (message) => {
    if (message.sender_id === currentUserId) {
      return currentUserProfile?.username || 'Você'
    }
    return message.sender?.username || message.sender_name || 'Usuário'
  }

  const getInitials = (name) => {
    return name?.charAt(0).toUpperCase() || '?'
  }

  const handleSendMessage = async (e) => {
    e?.preventDefault()
    if (!input.trim()) return
    
    // Command handling
    if (input.startsWith('/')) {
      const result = processCommand(input)
      if (result) {
        if (result.type === 'action' && result.message === '__CLEAR__') {
          setMessages([])
        } else if (result.type === 'system' || result.type === 'message') {
          await sendMessage(result.message)
        }
      }
      setInput('')
      setShowCommandList(false)
      return
    }
    
    // Mention handling for groups
    if (isGroupChat) {
      const mentionMatch = input.match(/@(\w+)$/)
      if (mentionMatch) {
        const username = mentionMatch[1]
        const matchedMember = members.find(m => m.username?.toLowerCase().startsWith(username.toLowerCase()))
        if (matchedMember) {
          setInput(input.replace(/@\w+$/, `@${matchedMember.username} `))
          setShowMentionList(false)
          return
        }
      }
    }
    
    await sendMessage(input, replyTo)
    setInput('')
    setShowCommandList(false)
    setShowMentionList(false)
    setReplyTo(null)
    scrollToBottom()
  }

  const startEditing = (message) => {
    setEditingMessage({
      id: message.id,
      content: message.content,
      originalContent: message.content
    })
  }

  const cancelEditing = () => {
    setEditingMessage(null)
  }

  const saveEdit = async () => {
    if (!editingMessage) return
    
    const newContent = editingMessage.content.trim()
    if (!newContent || newContent === editingMessage.originalContent) {
      setEditingMessage(null)
      return
    }

    const messageIndex = messages.findIndex(m => m.id === editingMessage.id)
    if (messageIndex === -1) {
      setEditingMessage(null)
      return
    }

    if (chatType === 'group') {
      const { error } = await supabase
        .from('group_messages')
        .update({ content: newContent })
        .eq('id', editingMessage.id)
      if (!error) {
        setMessages(prev => prev.map((m, i) => 
          i === messageIndex ? { ...m, content: newContent } : m
        ))
      }
    } else {
      const { error } = await supabase
        .from('direct_messages')
        .update({ content: newContent })
        .eq('id', editingMessage.id)
      if (!error) {
        setMessages(prev => prev.map((m, i) => 
          i === messageIndex ? { ...m, content: newContent } : m
        ))
      }
    }
    
    setEditingMessage(null)
  }

  const BLOCKED_MIME_TYPES = [
    'application/x-executable',
    'application/x-msdownload',
    'application/x-sh',
    'application/x-shellscript',
    'application/x-script',
    'application/x-python',
    'text/x-python',
    'text/x-shellscript',
    'text/x-script.python',
    'application/javascript',
    'text/javascript',
    'application/x-javascript',
    'application/node',
    'application/vnd.microsoft.portable-executable',
    'application/x-elf',
    'application/x-mach-binary',
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar',
    'application/vnd.rar'
  ]

  const isFileTypeAllowed = (file) => {
    const mime = file.type.toLowerCase()
    
    for (const blocked of BLOCKED_MIME_TYPES) {
      if (mime.includes(blocked) || mime.includes(blocked.split('/')[1])) {
        return false
      }
    }
    
    const extension = file.name.split('.').pop()?.toLowerCase()
    const blockedExtensions = ['exe', 'sh', 'bat', 'cmd', 'msi', 'dll', 'so', 'dylib', 'app', 'jar', 'py', 'js', 'rb', 'php', 'pl', 'cgi', 'com']
    
    if (blockedExtensions.includes(extension)) {
      return false
    }
    
    return true
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return
    
    const maxSize = 100 * 1024 * 1024
    
    const oversized = files.filter(f => f.size > maxSize)
    if (oversized.length > 0) {
      alert(`Arquivos muito grandes (máx 100MB): ${oversized.map(f => f.name).join(', ')}`)
      return
    }
    
    const blocked = files.filter(f => !isFileTypeAllowed(f))
    if (blocked.length > 0) {
      alert(`Tipos de arquivo não permitidos: ${blocked.map(f => f.name).join(', ')}\n\nArquivos permitidos: Imagens, documentos, PDFs, texto, compactados (zip).`)
      return
    }
    
    setSelectedFiles(files)
    setPreviews(files.map(file => ({
      file,
      url: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      name: file.name,
      size: file.size,
      type: file.type
    })))
  }

  const sendFiles = async () => {
    if (selectedFiles.length === 0) return
    
    setUploading(true)
    try {
      // Set all to uploading
      const statusMap = {}
      selectedFiles.forEach((_, i) => { statusMap[i] = 'uploading' })
      setUploadStatus(statusMap)
      
      const result = await uploadFiles(selectedFiles)
      if (result.error) throw result.error
      
      // Upload each file and update progress
      for (let i = 0; i < result.data.length; i++) {
        const fileData = result.data[i]
        
        // Update progress to 100%
        setUploadProgress(prev => ({ ...prev, [i]: 100 }))
        setUploadStatus(prev => ({ ...prev, [i]: 'success' }))
        
        const messageContent = `[file]${fileData.url}|${fileData.fileName}|${fileData.fileType}|${fileData.fileSize}[/file]`
        await sendMessage(messageContent)
      }
      
      // Clear after successful upload
      setSelectedFiles([])
      setPreviews([])
      setUploadProgress({})
      previews.forEach(p => { if (p.url) URL.revokeObjectURL(p.url) })
    } catch (error) {
      // Set all to error
      const errorMap = {}
      selectedFiles.forEach((_, i) => { errorMap[i] = 'error' })
      setUploadStatus(errorMap)
      alert('Erro no upload: ' + error.message)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const cancelFiles = () => {
    setSelectedFiles([])
    setPreviews([])
    previews.forEach(p => { if (p.url) URL.revokeObjectURL(p.url) })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (isGroupChat) {
      setDragCounter(prev => prev + 1)
    } else {
      setIsDragOver(true)
    }
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (isGroupChat) {
      setDragCounter(prev => prev - 1)
    } else {
      setIsDragOver(false)
    }
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragCounter(0)
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length === 0) return
    
    const maxSize = 100 * 1024 * 1024
    const invalid = files.filter(f => f.size > maxSize)
    if (invalid.length > 0) {
      alert(`Arquivos muito grandes (máx 100MB): ${invalid.map(f => f.name).join(', ')}`)
      return
    }
    
    // Set initial states
    setSelectedFiles(files)
    setPreviews(files.map(file => ({
      file,
      url: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      name: file.name,
      size: file.size,
      type: file.type
    })))
    
    // Initialize upload status
    const initialStatus = {}
    const initialProgress = {}
    files.forEach((_, i) => {
      initialStatus[i] = 'pending'
      initialProgress[i] = 0
    })
    setUploadStatus(initialStatus)
    setUploadProgress(initialProgress)
    
    // Auto-upload immediately
    await sendFiles()
  }

  // Audio recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks = []
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        setAudioBlob(blob)
        audioBlobRef.current = blob
        stream.getTracks().forEach(track => track.stop())
      }
      
      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
      setRecordingTime(0)
      
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch (err) {
      alert('Erro ao acessar microfone: ' + err.message)
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
      clearInterval(recordingTimerRef.current)
      setIsRecording(false)
    }
  }

  const sendAudio = async () => {
    if (isRecording && mediaRecorder && mediaRecorder.state !== 'inactive') {
      await new Promise((resolve) => {
        const originalOnStop = mediaRecorder.onstop
        mediaRecorder.onstop = () => {
          if (originalOnStop) originalOnStop()
          resolve()
        }
        mediaRecorder.stop()
        clearInterval(recordingTimerRef.current)
        setIsRecording(false)
      })
    }
    
    const blobToUse = audioBlob || audioBlobRef.current
    if (!blobToUse) {
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
    const finalBlob = audioBlob || audioBlobRef.current
    if (!finalBlob) {
      alert('Nenhum áudio gravado')
      return
    }
    
    if (!audioBlob && finalBlob) {
      setAudioBlob(finalBlob)
    }
    
    setUploading(true)
    try {
      const file = new File([finalBlob], `audio_${Date.now()}.webm`, { type: 'audio/webm' })
      const result = await uploadFiles([file])
      
      if (result.error) throw result.error
      
      for (const fileData of result.data) {
        const messageContent = `[file]${fileData.url}|${fileData.fileName}|${fileData.fileType}|${fileData.fileSize}[/file]`
        await sendMessage(messageContent)
      }
      
      setAudioBlob(null)
      audioBlobRef.current = null
      if (fileInputRef.current) fileInputRef.current.value = ''
      scrollToBottom()
    } catch (error) {
      alert('Erro ao enviar áudio: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  const cancelRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
    }
    clearInterval(recordingTimerRef.current)
    setIsRecording(false)
    setRecordingTime(0)
    setAudioBlob(null)
    audioBlobRef.current = null
  }

  // Command list handler
  const handleInputChange = (value) => {
    setInput(value)
    
    if (value.startsWith('/')) {
      const query = value.slice(1).toLowerCase()
      const commands = getCommands()
      const filtered = commands.filter(cmd => 
        cmd.name.toLowerCase().includes(query) || 
        cmd.description.toLowerCase().includes(query)
      )
      setFilteredCommands(filtered)
      setShowCommandList(filtered.length > 0)
      setCommandIndex(-1)
    } else if (isGroupChat && value.includes('@')) {
      const lastAtIndex = value.lastIndexOf('@')
      const query = value.slice(lastAtIndex + 1).toLowerCase()
      
      if (query) {
        const filtered = members.filter(m => 
          m.username?.toLowerCase().includes(query) ||
          m.user_id === currentUserId
        ).slice(0, 5)
        
        setMentionFilter(filtered)
        setShowMentionList(filtered.length > 0)
        setMentionQuery(query)
        setMentionIndex(0)
      } else {
        setMentionFilter(members.slice(0, 5))
        setShowMentionList(members.length > 0)
        setMentionQuery('')
      }
    } else {
      setShowCommandList(false)
      setShowMentionList(false)
    }
  }

  const handleKeyDown = (e) => {
    // Allow Shift+Enter for new line - prevent form submit
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault()
      // Let default behavior create new line by inserting \n
      const textarea = e.target
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const value = textarea.value
      const newValue = value.substring(0, start) + '\n' + value.substring(end)
      rest.setInput(newValue)
      
      // Move cursor after the inserted newline
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1
      }, 0)
      return
    }
    
    // Enter without Shift sends message
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      e.stopPropagation()
      if (input.trim()) {
        handleSendMessage()
      }
      return false
    }
    
    if (showCommandList && filteredCommands.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setCommandIndex(prev => (prev + 1) % filteredCommands.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setCommandIndex(prev => prev <= 0 ? filteredCommands.length - 1 : prev - 1)
      } else if (e.key === 'Enter' && commandIndex >= 0) {
        e.preventDefault()
        const cmd = filteredCommands[commandIndex]
        setInput(`/${cmd.name} `)
        setShowCommandList(false)
        inputRef.current?.focus()
      } else if (e.key === 'Escape') {
        setShowCommandList(false)
      }
    }
    
    if (showMentionList && mentionFilter.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setMentionIndex(prev => (prev + 1) % mentionFilter.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setMentionIndex(prev => prev <= 0 ? mentionFilter.length - 1 : prev - 1)
      } else if (e.key === 'Enter' && mentionIndex >= 0) {
        e.preventDefault()
        const member = mentionFilter[mentionIndex]
        const lastAtIndex = input.lastIndexOf('@')
        setInput(input.slice(0, lastAtIndex) + `@${member.username} `)
        setShowMentionList(false)
        inputRef.current?.focus()
      } else if (e.key === 'Escape') {
        setShowMentionList(false)
      }
    }
  }

  return {
    // States
    messages, setMessages,
    input, setInput: handleInputChange,
    loading,
    status, setStatus,
    messagesEndRef,
    profilesMap,
    selectedFiles, setSelectedFiles,
    uploadProgress, setUploadProgress,
    uploadStatus, setUploadStatus,
    previews, setPreviews,
    uploading,
    fileInputRef,
    previewImage, setPreviewImage,
    previewVideo, setPreviewVideo,
    previewPdf, setPreviewPdf,
    previewDoc, setPreviewDoc,
    previewHtml, setPreviewHtml,
    previewCsv, setPreviewCsv,
    previewSvg, setPreviewSvg,
    previewPython, setPreviewPython,
    previewOfx, setPreviewOfx,
    previewXml, setPreviewXml,
    previewSql, setPreviewSql,
    previewJsonc, setPreviewJsonc,
    previewJson, setPreviewJson,
    previewMd, setPreviewMd,
    previewCode, setPreviewCode,
    previewArchive, setPreviewArchive,
    showCommandList, setShowCommandList,
    filteredCommands, setFilteredCommands,
    commandIndex, setCommandIndex,
    showMentionList, setShowMentionList,
    mentionFilter, setMentionFilter,
    mentionIndex, setMentionIndex,
    isDragOver,
    dragCounter,
    isRecording,
    recordingTime,
    audioBlob,
    mediaRecorder,
    inputRef,

    // Functions
    handleSendMessage,
    handleFileSelect,
    sendFiles,
    cancelFiles,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    startRecording,
    stopRecording,
    sendAudio,
    cancelRecording,
    handleKeyDown,
    scrollToBottom,
    replyTo, setReplyTo,
    editingMessage, setEditingMessage,
    startEditing,
    cancelEditing,
    saveEdit,
    messageMenu, setMessageMenu,
    getSenderName,
    getInitials
  }
}