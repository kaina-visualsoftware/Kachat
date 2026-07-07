import { useEffect, useRef } from 'react'
import { Send, Upload, Mic, Square, X, Quote, Reply, Smile } from 'lucide-react'
import { PreviewModals } from './PreviewModals'
import { StickerPicker } from './StickerPicker'
import StickerManager from './StickerManager'
import { renderMessageContent } from '../utils/renderMessageContent'
import { theme } from '../theme'
import { Avatar } from './Avatar'
import { useResponsive } from '../hooks/useMediaQuery'

export function ChatBase({
  chatType,
  loading,
  
  // Header (render prop)
  renderHeader,
  
  // Messages
  messages,
  messagesEndRef,
  currentUserId,
  currentUserProfile,
  receiverProfile,
  profilesMap,
  
  // Input
  input,
  inputRef,
  handleSendMessage,
  showCommandList,
  filteredCommands,
  commandIndex,
  showMentionList,
  mentionFilter,
  mentionIndex,
  handleKeyDown,
  
  // File upload
  previews,
  selectedFiles,
  uploading,
  fileInputRef,
  handleFileSelect,
  handlePaste,
  sendFiles,
  cancelFiles,
  isDragOver,
  handleDragOver,
  handleDragEnter,
  handleDragLeave,
  handleDrop,
  
  // Audio
  isRecording,
  recordingTime,
  startRecording,
  stopRecording,
  sendAudio,
  cancelRecording,
  
  // Preview states
  previewImage, setPreviewImage,
  previewVideo, setPreviewVideo,
  previewPdf, setPreviewPdf,
  previewDoc, setPreviewDoc,
  previewHtml, setPreviewHtml,
  previewSvg, setPreviewSvg,
  previewCsv, setPreviewCsv,
  previewPython, setPreviewPython,
  previewOfx, setPreviewOfx,
  previewXml, setPreviewXml,
  previewSql, setPreviewSql,
  previewJsonc, setPreviewJsonc,
  previewJson, setPreviewJson,
  previewMd, setPreviewMd,
  previewCode, setPreviewCode,
  previewArchive, setPreviewArchive,
  
  // Reply
  replyTo,
  setReplyTo,
  
  // Edit
  editingMessage,
  setEditingMessage,
  startEditing,
  cancelEditing,
  saveEdit,
  
  // Stickers
  showStickerPicker,
  setShowStickerPicker,
  showStickerManager,
  setShowStickerManager,
  sendSticker,

  // Message menu
  messageMenu,
  setMessageMenu,
  
  // Modais extras (render prop)
  renderExtraModals,
  
  // Navigation
  onBack,
  
  // Additional props
  ...rest
}) {
  const isGroupChat = chatType === 'group'
  const { isMobile } = useResponsive()

  // Format timestamp for messages - shows date + time for DMs, time only for groups
  const formatMessageTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const offset = -3 * 60; // Brasília timezone
    const adjusted = new Date(date.getTime() + offset * 60 * 1000);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const messageDate = new Date(adjusted);
    messageDate.setHours(0, 0, 0, 0);
    
    const timeString = adjusted.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    if (messageDate.getTime() === today.getTime()) {
      return timeString;
    }
    
    if (messageDate.getTime() === yesterday.getTime()) {
      return `Ontem ${timeString}`;
    }
    
    const dateString = adjusted.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit'
    });
    
    return `${dateString} ${timeString}`;
  };

  // Format date separator (Discord style)
  const formatDateSeparator = (timestamp) => {
    const date = new Date(timestamp);
    const offset = -3 * 60; // Brasília timezone
    const adjusted = new Date(date.getTime() + offset * 60 * 1000);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const messageDate = new Date(adjusted);
    messageDate.setHours(0, 0, 0, 0);
    
    if (messageDate.getTime() === today.getTime()) {
      return 'Hoje';
    }
    
    if (messageDate.getTime() === yesterday.getTime()) {
      return 'Ontem';
    }
    
    return adjusted.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: adjusted.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    }).replace(/^\w/, c => c.toUpperCase());
  };

  // Get date key for message grouping
  const getMessageDateKey = (timestamp) => {
    const date = new Date(timestamp);
    const offset = -3 * 60; // Brasília timezone
    const adjusted = new Date(date.getTime() + offset * 60 * 1000);
    return adjusted.toISOString().split('T')[0];
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: theme.bg,
      position: 'relative'
    }}>
      {/* Animations and Scrollbar Styles */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .chat-message {
          animation: fadeInUp 0.3s ease-out;
        }
        
        .chat-input::placeholder {
          color: #A1A1AA;
        }
        
        /* Scrollbar styling */
        .chat-messages::-webkit-scrollbar {
          width: 6px;
        }
        .chat-messages::-webkit-scrollbar-track {
          background: transparent;
        }
        .chat-messages::-webkit-scrollbar-thumb {
          background: rgba(63, 63, 70, 0.5);
          border-radius: 3px;
        }
        .chat-messages::-webkit-scrollbar-thumb:hover {
          background: rgba(63, 63, 70, 0.8);
        }
        
        /* Input focus */
        .chat-input {
          transition: all 0.2s ease;
        }
        .chat-input:focus {
          border-color: theme.accent;
          box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2);
        }
        
        /* Button hover */
        .chat-button:hover {
          background: rgba(139, 92, 246, 0.15) !important;
        }
        
        /* Message menu button */
        .chat-message-menu-btn {
          opacity: 0;
        }
        .chat-message:hover .chat-message-menu-btn {
          opacity: 0.7 !important;
        }
        .chat-message-menu-btn:hover {
          opacity: 1 !important;
          background: rgba(139, 92, 246, 0.15) !important;
        }
        
        /* Drag overlay animation */
        .drag-overlay {
          animation: fadeInUp 0.2s ease-out;
        }
      `}</style>

      {/* Header */}
      {renderHeader?.()}

      {/* Messages */}
      <div className="chat-messages" style={{
        flex: 1,
        overflowY: 'auto',
        padding: isMobile ? '12px' : '16px',
        paddingBottom: 0,
        position: 'relative'
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#FFFFFF', paddingTop: 40 }}>
            Carregando mensagens...
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#FFFFFF', paddingTop: 40 }}>
            Nenhuma mensagem ainda. Envie uma mensagem para começar!
          </div>
        ) : (
messages.map((message, index) => {
            const isMe = message.sender_id === currentUserId
            const sender = message.sender
            // Get profile from map or fallback
            const profileFromMap = profilesMap[message.sender_id]
            const senderAvatar = profileFromMap?.avatar_url || sender?.avatar_url
            const senderUsername = profileFromMap?.username || sender?.username
            
            // Check if date changed (for date separator)
            const prevMessage = messages[index - 1]
            const currentDateKey = getMessageDateKey(message.created_at)
            const prevDateKey = prevMessage ? getMessageDateKey(prevMessage.created_at) : null
            const showDateSeparator = !prevMessage || currentDateKey !== prevDateKey
            
            // Check consecutive messages (WhatsApp style)
            const nextMessage = messages[index + 1]
            const timeDiff = prevMessage ? new Date(message.created_at) - new Date(prevMessage.created_at) : 0
            const isConsecutive = prevMessage && prevMessage.sender_id === message.sender_id && timeDiff <= 60 * 1000
            const isLastInGroup = !nextMessage || nextMessage.sender_id !== message.sender_id || 
              (new Date(nextMessage.created_at) - new Date(message.created_at) > 60 * 1000)
            const isFirstInGroup = !isConsecutive
            
            // Avatar color based on user
            const getAvatarGradient = (userId) => {
              const hash = String(userId).split('').reduce((a, b) => a + b.charCodeAt(0), 0)
              const colors = [
                [theme.accent, theme.accentHover], // Purple
                ['#3B82F6', '#2563EB'], // Blue
                [theme.success, '#059669'], // Green
                [theme.warning, '#D97706'], // Yellow
                [theme.error, '#DC2626'], // Red
                ['#EC4899', '#DB2777'], // Pink
                [theme.accent, theme.accentHover], // Violet
              ]
              return colors[hash % colors.length]
            }
            const avatarColors = getAvatarGradient(message.sender_id)
            
            return (
              <>
                {/* Date Separator (Discord Style) */}
                {showDateSeparator && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    margin: '32px 0 20px 0'
                  }}>
                    <div style={{
                      flex: 1,
                      height: '2px',
                      background: 'linear-gradient(90deg, rgba(139, 92, 246, 0), rgba(139, 92, 246, 0.4), rgba(139, 92, 246, 0))'
                    }} />
                    <div style={{
                      background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
                      padding: '8px 16px',
                      borderRadius: 20,
                      border: '1.5px solid rgba(139, 92, 246, 0.6)',
                      boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                      whiteSpace: 'nowrap',
                    }}>
                      <span style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#FFFFFF',
                        textTransform: 'capitalize',
                        letterSpacing: '0.3px'
                      }}>
                      {formatDateSeparator(message.created_at)}
                      </span>
                    </div>
                    <div style={{
                      flex: 1,
                      height: '2px',
                      background: 'linear-gradient(90deg, rgba(139, 92, 246, 0), rgba(139, 92, 246, 0.4), rgba(139, 92, 246, 0))'
                    }} />
                  </div>
                )}
                
                {/* Message */}
              <div key={index} className="chat-message" style={{
                display: 'flex',
                flexDirection: isMe ? 'row-reverse' : 'row',
                alignItems: 'flex-start',
                marginBottom: isLastInGroup ? 12 : 4,
                gap: 10
              }}>
                {/* Avatar - mostrar só na primeira mensagem do grupo */}
                {isFirstInGroup && (
                  <Avatar
                    url={isMe ? currentUserProfile?.avatar_url : senderAvatar}
                    initials={isMe 
                      ? currentUserProfile?.username?.charAt(0).toUpperCase()
                      : senderUsername?.charAt(0).toUpperCase()
                    }
                    gradient={!isMe ? `linear-gradient(135deg, ${avatarColors[0]}, ${avatarColors[1]})` : undefined}
                    size={36}
                  />
                )}
                {!isFirstInGroup && <div style={{ width: 36 }} />}
                
                <div style={{
                    maxWidth: isMobile ? '88%' : '78%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isMe ? 'flex-end' : 'flex-start'
                  }}>
                  {/* Sender name in group - only show on first message of a group */}
                  {isGroupChat && !isMe && senderUsername && isFirstInGroup && (
                    <div style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'theme.accentLight',
                      marginBottom: 6,
                      marginLeft: 4
                    }}>
                      {senderUsername}
                    </div>
                  )}
                  
                  {/* Message bubble */}
                  <div style={{
                    background: isMe ? '#5B21B6' : '#1F1F23',
                    borderRadius: 16,
                    borderBottomRightRadius: isMe ? 4 : 16,
                    borderBottomLeftRadius: !isMe ? 4 : 16,
                    padding: '10px 14px',
                    wordBreak: 'break-word',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    cursor: 'text',
                    position: 'relative'
                  }}>
                    {/* Reply preview inside bubble */}
                    {message.reply_to && (
                      <div style={{
                        background: isMe ? 'rgba(0,0,0,0.2)' : 'rgba(139, 92, 246, 0.1)',
                        borderLeft: '3px solid #A78BFA',
                        borderRadius: 8,
                        padding: '8px 10px',
                        marginBottom: 8
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          marginBottom: 4
                        }}>
                          <Reply size={11} color={isMe ? '#C4B5FD' : '#A78BFA'} />
                          <span style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: isMe ? '#C4B5FD' : '#A78BFA'
                          }}>
                            {message.reply_to.sender_name || 'Usuário'}
                          </span>
                        </div>
                        <div style={{
                          fontSize: 12,
                          color: isMe ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.55)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}>
                          {message.reply_to.content}
                        </div>
                      </div>
                    )}
                    <div style={{
                      color: isMe ? '#FFFFFF' : '#E4E4E7',
                      fontSize: 14,
                      lineHeight: 1.5,
                      marginBottom: isLastInGroup ? 6 : 0
                    }}>
                      {renderMessageContent(message.content, isMe, sender, {
                        setPreviewImage,
                        setPreviewPdf,
                        setPreviewDoc,
                        setPreviewHtml,
                        setPreviewSvg,
                        setPreviewCsv,
                        setPreviewPython,
                        setPreviewOfx,
                        setPreviewXml,
                        setPreviewSql,
                        setPreviewJsonc,
                        setPreviewJson,
                        setPreviewMd,
                        setPreviewCode,
                        setPreviewArchive
                      })}
                    </div>
                    {(!isGroupChat || isLastInGroup) && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: 4,
                        marginTop: -2
                      }}>
                        <span style={{
                          fontSize: 11,
                          color: isMe ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.35)'
                        }}>
                          {formatMessageTimestamp(message.created_at)}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            const rect = e.currentTarget.getBoundingClientRect()
                            setMessageMenu({
                              messageId: message.id,
                              x: rect.right - 10,
                              y: rect.top,
                              isMe,
                              message
                            })
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: isMe ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.3)',
                            cursor: 'pointer',
                            padding: '2px 4px',
                            fontSize: 14,
                            lineHeight: 1,
                            borderRadius: 4,
                            opacity: 0,
                            transition: 'opacity 0.15s ease'
                          }}
                          className="chat-message-menu-btn"
                          title="Mais opções"
                        >
                          ⋮
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              </>
            )
          })
        )}
        <div ref={messagesEndRef} />
        
        {/* Message Context Menu */}
        {messageMenu && (
          <>
            <div 
              onClick={() => setMessageMenu(null)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 999
              }}
            />
            <div style={{
              position: 'fixed',
              top: Math.min(messageMenu.y, window.innerHeight - 180),
              left: Math.min(messageMenu.x, window.innerWidth - 180),
              background: '#1E1E1E',
              border: '1px solid #3F3F46',
              borderRadius: 12,
              padding: '8px 0',
              minWidth: 160,
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
              zIndex: 1000,
              animation: 'fadeInUp 0.15s ease-out'
            }}>
              {messageMenu.isMe && (
                <button
                  type="button"
                  onClick={() => {
                    startEditing(messageMenu.message)
                    setMessageMenu(null)
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'transparent',
                    border: 'none',
                    color: '#E4E4E7',
                    fontSize: 14,
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    transition: 'all 0.1s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(139, 92, 246, 0.15)'; e.currentTarget.style.color = '#A78BFA' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#E4E4E7' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Editar
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setReplyTo({
                    id: messageMenu.message.id,
                    content: messageMenu.message.content,
                    sender_name: messageMenu.isMe ? currentUserProfile?.username : messageMenu.message.sender?.username || 'Usuário'
                  })
                  setMessageMenu(null)
                }}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'transparent',
                  border: 'none',
                  color: '#E4E4E7',
                  fontSize: 14,
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                Responder
              </button>
            </div>
          </>
        )}
      </div>

      {/* Edit Message Modal */}
      {editingMessage && (
        <div 
          onClick={() => cancelEditing()}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            cursor: 'pointer',
            padding: 20
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 500,
              background: '#18181B',
              borderRadius: 16,
              border: '1px solid #3F3F46',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
              animation: 'fadeInUp 0.2s ease-out'
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid #3F3F46'
            }}>
              <span style={{ color: '#FAFAFA', fontSize: 16, fontWeight: 600 }}>
                Editar mensagem
              </span>
              <button
                type="button"
                onClick={() => cancelEditing()}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'transparent',
                  border: 'none',
                  color: '#A1A1AA',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>
            
            {/* Content */}
            <div style={{ padding: 20 }}>
              <textarea
                value={editingMessage.content}
                onChange={(e) => setEditingMessage({ ...editingMessage, content: e.target.value })}
                autoFocus
                rows={6}
                style={{
                  width: '100%',
                  background: '#27272A',
                  border: '1px solid #3F3F46',
                  borderRadius: 12,
                  padding: '14px 16px',
                  color: '#FFFFFF',
                  fontSize: 15,
                  lineHeight: 1.6,
                  resize: 'none',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#8B5CF6'}
                onBlur={(e) => e.target.style.borderColor = '#3F3F46'}
              />
            </div>
            
            {/* Actions */}
            <div style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'flex-end',
              padding: '12px 20px',
              borderTop: '1px solid #3F3F46'
            }}>
              <button
                type="button"
                onClick={() => cancelEditing()}
                style={{
                  padding: '10px 20px',
                  borderRadius: 10,
                  border: '1px solid #3F3F46',
                  background: 'transparent',
                  color: '#A1A1AA',
                  fontSize: 14,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#52525B'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#3F3F46'}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => saveEdit()}
                style={{
                  padding: '10px 24px',
                  borderRadius: 10,
                  border: 'none',
                  background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
                  color: '#FFFFFF',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <form 
        onSubmit={handleSendMessage}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          padding: 12,
          borderTop: '1px solid rgba(63, 63, 70, 0.5)',
          position: 'relative'
        }}
      >
        {/* Sticker Picker */}
        {showStickerPicker && (
          <StickerPicker
            onSelectSticker={(url, id) => sendSticker?.(url, id)}
            onOpenManager={() => {
              setShowStickerPicker?.(false)
              setShowStickerManager?.(true)
            }}
            onClose={() => setShowStickerPicker?.(false)}
          />
        )}
        {/* File Previews */}
        {previews.length > 0 && (
          <div style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            marginBottom: 12
          }}>
            {previews.map((preview, idx) => {
                const status = rest.uploadStatus?.[idx]
                const progress = rest.uploadProgress?.[idx]
                
                return (
                <div key={idx} style={{
                  position: 'relative',
                  width: 60,
                  height: 60,
                  borderRadius: 8,
                  overflow: 'hidden',
                  background: theme.bgTertiary,
                  border: status === 'success' ? '2px solid #10B981' : status === 'error' ? '2px solid #EF4444' : 'none'
                }}>
                {preview.url ? (
                  <img 
                    src={preview.url} 
                    alt={preview.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    fontSize: 10,
                    textAlign: 'center',
                    padding: 4
                  }}>
                    {preview.name.length > 10 ? preview.name.slice(0, 10) + '...' : preview.name}
                  </div>
                )}
                
                {/* Progress bar */}
                {(status === 'uploading' || status === 'success') && progress !== undefined && (
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    background: '#3F3F46'
                  }}>
                    <div style={{
                      width: `${progress}%`,
                      height: '100%',
                      background: status === 'success' ? '#10B981' : theme.accent,
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                )}
                
                {/* Status icon */}
                {status === 'success' && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: '#10B981',
                    borderRadius: '50%',
                    width: 24,
                    height: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14
                  }}>✓</div>
                )}
                {status === 'error' && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: '#EF4444',
                    borderRadius: '50%',
                    width: 24,
                    height: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14
                  }}>✕</div>
                )}
                
                {/* Remove button (only when not uploading/complete) */}
                {status !== 'uploading' && status !== 'success' && (
                  <button
                    type="button"
                    onClick={() => {
                      rest.setSelectedFiles(prev => prev.filter((_, i) => i !== idx))
                      rest.setPreviews(prev => prev.filter((_, i) => i !== idx))
                    }}
                    style={{
                      position: 'absolute',
                      top: 2,
                      right: 2,
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: 'rgba(0,0,0,0.7)',
                      border: 'none',
                      color: 'white',
                      fontSize: 12,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            )
            })}
            
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                type="button"
                onClick={sendFiles}
                disabled={uploading}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  background: uploading ? 'theme.accent' : 'theme.accent',
                  border: 'none',
                  color: 'white',
                  fontSize: 14,
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Upload size={16} />
                {uploading ? 'Enviando...' : 'Enviar'}
              </button>
              
              <button
                type="button"
                onClick={cancelFiles}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: 'transparent',
                  border: `1px solid ${theme.border}`,
                  color: '#FFFFFF',
                  fontSize: 14,
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
        
        {/* Recording UI - WhatsApp style */}
        {isRecording && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 12,
            padding: '10px 16px',
            background: 'rgba(239, 68, 68, 0.08)',
            borderRadius: 12,
            border: '1px solid rgba(239, 68, 68, 0.25)',
            animation: 'fadeInUp 0.15s ease-out'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}>
              <div style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: '#EF4444',
                animation: 'pulse 1s infinite'
              }} />
              <span style={{
                fontSize: 11,
                color: '#EF4444',
                fontWeight: 500,
                marginLeft: 2
              }}>
                {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
              </span>
            </div>

            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}>
              <span style={{
                fontSize: 11,
                color: '#EF4444',
                opacity: 0.7
              }}>
                ← Deslize para cancelar
              </span>
            </div>

            <button
              type="button"
              onClick={cancelRecording}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                border: 'none',
                color: '#EF4444',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
            >
              <X size={16} />
            </button>
          </div>
        )}
        
        {/* Command List */}
        {showCommandList && filteredCommands.length > 0 && (
          <div style={{
            position: 'absolute',
            bottom: '100%',
            left: 12,
            right: 12,
            background: '#1A1A1E',
            borderRadius: 12,
            border: '1px solid rgba(99, 102, 241, 0.15)',
            boxShadow: '0 -8px 30px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.05)',
            maxHeight: 240,
            overflow: 'auto',
            marginBottom: 8,
            padding: '6px 0'
          }}>
            {filteredCommands.map((cmd, idx) => (
              <div
                key={idx}
                style={{
                  padding: '10px 14px',
                  cursor: 'pointer',
                  background: idx === commandIndex
                    ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(99, 102, 241, 0.08))'
                    : 'transparent',
                  borderLeft: `3px solid ${idx === commandIndex ? '#8B5CF6' : 'transparent'}`,
                  transition: 'all 0.12s ease'
                }}
                onClick={() => {
                  rest.setInput(`/${cmd.name} `)
                  rest.setShowCommandList(false)
                  inputRef.current?.focus()
                }}
                onMouseEnter={(e) => {
                  if (idx !== commandIndex) {
                    e.currentTarget.style.background = 'rgba(39, 39, 42, 0.5)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (idx !== commandIndex) {
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 2
                }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    background: 'rgba(139, 92, 246, 0.12)',
                    color: '#A78BFA',
                    fontSize: 11,
                    fontWeight: 700,
                    flexShrink: 0
                  }}>
                    /
                  </span>
                  <span style={{
                    color: '#E4E4E7',
                    fontWeight: 600,
                    fontSize: 13
                  }}>
                    {cmd.name}
                  </span>
                </div>
                <div style={{
                  color: '#71717A',
                  fontSize: 12,
                  marginLeft: 30,
                  lineHeight: 1.4
                }}>
                  {cmd.description}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Mention List */}
        {showMentionList && mentionFilter.length > 0 && (
          <div style={{
            position: 'absolute',
            bottom: '100%',
            left: 12,
            right: 12,
            background: theme.bgTertiary,
            borderRadius: 8,
            border: '1px solid rgba(63, 63, 70, 0.5)',
            maxHeight: 200,
            overflow: 'auto',
            marginBottom: 8
          }}>
            {mentionFilter.map((member, idx) => (
              <div
                key={idx}
                style={{
                  padding: '10px 14px',
                  cursor: 'pointer',
                  background: idx === mentionIndex ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  borderBottom: idx < mentionFilter.length - 1 ? '1px solid rgba(63, 63, 70, 0.3)' : 'none'
                }}
                onClick={() => {
                  const lastAtIndex = input.lastIndexOf('@')
                  rest.setInput(input.slice(0, lastAtIndex) + `@${member.username} `)
                  rest.setShowMentionList(false)
                  inputRef.current?.focus()
                }}
              >
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, theme.accent, theme.accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 600
                }}>
                  {member.username?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <div style={{ color: theme.text, fontWeight: 500 }}>@{member.username}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Reply Preview */}
        {replyTo && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 16px',
            marginBottom: 8,
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(124, 58, 237, 0.1))',
            borderLeft: '4px solid #8B5CF6',
            borderRadius: '0 12px 12px 8px',
            borderTopRightRadius: 12,
            borderBottomRightRadius: 12
          }}>
            <Reply size={18} color="#8B5CF6" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ 
                fontSize: 12, 
                color: '#A78BFA', 
                fontWeight: 600, 
                marginBottom: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                <span>Respondendo a</span>
                <span style={{ color: '#C4B5FD' }}>{replyTo.sender_name || 'usuário'}</span>
              </div>
              <div style={{ 
                fontSize: 13, 
                color: '#A1A1AA', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis', 
                whiteSpace: 'nowrap',
                maxWidth: '100%'
              }}>
                {replyTo.content?.substring(0, 80)}{replyTo.content?.length > 80 ? '...' : ''}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              title="Cancelar resposta"
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#EF4444',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)'
                e.currentTarget.style.transform = 'scale(1.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              <X size={16} />
            </button>
          </div>
        )}
        
        
        
        {/* Input Row */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            className="chat-input"
            value={input}
            onChange={(e) => rest.setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={isGroupChat ? 'Mensagem ou @menção...' : 'Mensagem...'}
            maxLength={10000}
            rows={1}
            style={{
              flex: 1,
              padding: isMobile ? '10px 14px' : '12px 16px',
              borderRadius: 24,
              border: '1px solid rgba(63, 63, 70, 0.5)',
              background: theme.bgTertiary,
              color: '#FFFFFF',
              fontSize: isMobile ? 13 : 14,
              outline: 'none',
              resize: 'none',
              maxHeight: 120,
              minHeight: 44,
              lineHeight: 1.4,
              overflow: 'auto'
            }}
            onFocus={(e) => e.target.style.borderColor = theme.accent}
            onBlur={(e) => e.target.style.borderColor = 'rgba(63, 63, 70, 0.5)'}
          />
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          
          <button
            type="button"
            className="chat-button"
            onClick={() => fileInputRef.current?.click()}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.background = theme.bgTertiary}
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: theme.bgTertiary,
              border: '1px solid rgba(63, 63, 70, 0.5)',
              color: 'theme.accentLight',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
          >
            <Upload size={20} />
          </button>

          <button
            type="button"
            className="chat-button"
            onClick={() => setShowStickerPicker?.(prev => !prev)}
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: showStickerPicker ? theme.accent : theme.bgTertiary,
              border: '1px solid rgba(63, 63, 70, 0.5)',
              color: showStickerPicker ? '#FFFFFF' : 'theme.accentLight',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
          >
            <Smile size={20} />
          </button>
          
          <button
            type="button"
            className="chat-button"
            onMouseDown={() => startRecording?.()}
            onMouseUp={() => { if (isRecording) sendAudio?.() }}
            onTouchStart={() => startRecording?.()}
            onTouchEnd={(e) => { e.preventDefault(); if (isRecording) sendAudio?.() }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)'}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = theme.bgTertiary
              if (isRecording) sendAudio?.()
            }}
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: isRecording ? '#EF4444' : theme.bgTertiary,
              border: isRecording ? 'none' : '1px solid rgba(63, 63, 70, 0.5)',
              color: isRecording ? '#FFFFFF' : 'theme.accentLight',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              transform: isRecording ? 'scale(1.1)' : 'scale(1)',
              boxShadow: isRecording ? '0 0 20px rgba(239, 68, 68, 0.4)' : 'none'
            }}
          >
            <Mic size={20} />
          </button>
          
          <button
            type="submit"
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, theme.accent, theme.accent)',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4)'
            }}
          >
            <Send size={20} />
          </button>
        </div>
      </form>

      {/* Drag Overlay */}
      {isDragOver && (
        <div className="drag-overlay" style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(139, 92, 246, 0.15)',
          border: `3px dashed ${theme.accent}`,
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          pointerEvents: 'none'
        }}>
          <div style={{
            padding: 32,
            background: theme.bgTertiary,
            borderRadius: 16,
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
          }}>
            <Upload size={56} color={theme.accent} />
            <div style={{ color: theme.text, fontSize: 20, fontWeight: 500, marginTop: 16 }}>
              Solte os arquivos aqui
            </div>
            {selectedFiles.length > 0 && (
              <div style={{ 
                background: 'rgba(139, 92, 246, 0.2)', 
                padding: '8px 16px', 
                borderRadius: 20,
                color: theme.accentLight,
                fontSize: 14,
                marginTop: 12
              }}>
                {selectedFiles.length} arquivo{selectedFiles.length !== 1 ? 's' : ''} selecionado{selectedFiles.length !== 1 ? 's' : ''}
              </div>
            )}
            <div style={{ color: '#A1A1AA', fontSize: 12, marginTop: 12 }}>
              Tamanho máx: 100MB
            </div>
          </div>
        </div>
      )}

      {/* Preview Modals */}
      <PreviewModals 
        previewImage={previewImage}
        setPreviewImage={setPreviewImage}
        previewVideo={previewVideo}
        setPreviewVideo={setPreviewVideo}
        previewPdf={previewPdf}
        setPreviewPdf={setPreviewPdf}
        previewDoc={previewDoc}
        setPreviewDoc={setPreviewDoc}
        previewHtml={previewHtml}
        setPreviewHtml={setPreviewHtml}
        previewSvg={previewSvg}
        setPreviewSvg={setPreviewSvg}
        previewCsv={previewCsv}
        setPreviewCsv={setPreviewCsv}
        previewPython={previewPython}
        setPreviewPython={setPreviewPython}
        previewOfx={previewOfx}
        setPreviewOfx={setPreviewOfx}
        previewXml={previewXml}
        setPreviewXml={setPreviewXml}
        previewSql={previewSql}
        setPreviewSql={setPreviewSql}
        previewJsonc={previewJsonc}
        setPreviewJsonc={setPreviewJsonc}
        previewJson={previewJson}
        setPreviewJson={setPreviewJson}
        previewMd={previewMd}
        setPreviewMd={setPreviewMd}
        previewCode={previewCode}
        setPreviewCode={setPreviewCode}
        previewArchive={previewArchive}
        setPreviewArchive={setPreviewArchive}
      />

      {/* Sticker Manager Modal */}
      {showStickerManager && (
        <StickerManager onClose={() => setShowStickerManager?.(false)} />
      )}

      {/* Extra Modals */}
      {renderExtraModals?.()}
    </div>
  )
}