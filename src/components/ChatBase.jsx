import { useEffect, useRef } from 'react'
import { Send, Upload, Mic, Square, X } from 'lucide-react'
import { PreviewModals } from './PreviewModals'
import { renderMessageContent } from '../utils/renderMessageContent'
import { theme } from '../theme'
import { Avatar } from './Avatar'

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
  
  // Modais extras (render prop)
  renderExtraModals,
  
  // Navigation
  onBack,
  
  // Additional props
  ...rest
}) {
  const isGroupChat = chatType === 'group'

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
        padding: '16px',
        paddingBottom: 0
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
            
            // Check consecutive messages (WhatsApp style)
            const prevMessage = messages[index - 1]
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
              <div key={index} className="chat-message" style={{
                display: 'flex',
                flexDirection: isMe ? 'row-reverse' : 'row',
                alignItems: 'flex-start',
                marginBottom: 16,
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
                    maxWidth: '85%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isMe ? 'flex-end' : 'flex-start'
                  }}>
                  {/* Sender name in group */}
                  {isGroupChat && !isMe && senderUsername && (
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
                    background: isMe 
                      ? `linear-gradient(135deg, #6D28D9, #5B21B6)` 
                      : theme.bgTertiary,
                    border: '1px solid',
                    borderColor: isMe 
                      ? 'rgba(139, 92, 246, 0.4)' 
                      : 'rgba(63, 63, 70, 0.6)',
                    borderLeft: isMe ? '3px solid #7C3AED' : '3px solid transparent',
                    borderRadius: 20,
                    padding: '12px 16px',
                    borderTopLeftRadius: isGroupChat && !isMe ? 4 : 20,
                    borderTopRightRadius: isMe ? 4 : 20,
                    wordBreak: 'break-word',
                    boxShadow: isMe 
                      ? '0 4px 12px rgba(99, 102, 241, 0.4)' 
                      : '0 4px 12px rgba(0, 0, 0, 0.4)'
                  }}>
                    <div style={{
                      color: theme.text,
                      fontSize: 14,
                      lineHeight: 1.5,
                      marginBottom: isLastInGroup ? 4 : 0
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
                        setPreviewSql
                      })}
                    </div>
                    {(isLastInGroup || isGroupChat) && (
                      <div style={{
                        fontSize: 10,
                        color: isMe ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.5)',
                        textAlign: 'right',
                        marginTop: 2
                      }}>
                        {(() => {
                          const date = new Date(message.created_at)
                          const offset = -3 * 60
                          const adjusted = new Date(date.getTime() + offset * 60 * 1000)
                          return adjusted.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

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
        
        {/* Recording UI */}
        {isRecording && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 12,
            padding: '8px 12px',
            background: 'rgba(239, 68, 68, 0.1)',
            borderRadius: 8,
            border: '1px solid rgba(239, 68, 68, 0.3)'
          }}>
            <div style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: 'theme.error',
              animation: 'pulse 1s infinite'
            }} />
            <span style={{ color: 'theme.error', fontSize: 13, flex: 1 }}>
              Gravando... {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
            </span>
            <button
              type="button"
              onClick={cancelRecording}
              style={{
                background: 'none',
                border: 'none',
                color: '#FFFFFF',
                cursor: 'pointer',
                padding: 4
              }}
            >
              <X size={18} />
            </button>
            <button
              type="button"
              onClick={stopRecording}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                background: 'theme.error',
                border: 'none',
                color: 'white',
                fontSize: 13,
                cursor: 'pointer'
              }}
            >
              Parar
            </button>
          </div>
        )}
        
        {/* Audio recorded UI */}
        {!isRecording && (
          <audio 
            src={rest.audioBlob ? URL.createObjectURL(rest.audioBlob) : null}
            controls
            style={{ 
              width: '100%', 
              marginBottom: 12,
              borderRadius: 8,
              display: rest.audioBlob ? 'block' : 'none'
            }}
          />
        )}
        
        {/* Command List */}
        {showCommandList && filteredCommands.length > 0 && (
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
            {filteredCommands.map((cmd, idx) => (
              <div
                key={idx}
                style={{
                  padding: '10px 14px',
                  cursor: 'pointer',
                  background: idx === commandIndex ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                  borderBottom: idx < filteredCommands.length - 1 ? '1px solid rgba(63, 63, 70, 0.3)' : 'none'
                }}
                onClick={() => {
                  rest.setInput(`/${cmd.name} `)
                  rest.setShowCommandList(false)
                  inputRef.current?.focus()
                }}
              >
                <div style={{ color: '#FFFFFF', fontWeight: 500 }}>/{cmd.name}</div>
                <div style={{ color: '#FFFFFF', fontSize: 12 }}>{cmd.description}</div>
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
        
        {/* Input Row */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            ref={inputRef}
            type="text"
            className="chat-input"
            value={input}
            onChange={(e) => rest.setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isGroupChat ? 'Mensagem ou @menção...' : 'Mensagem...'}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 24,
              border: '1px solid rgba(63, 63, 70, 0.5)',
              background: theme.bgTertiary,
              color: '#FFFFFF',
              fontSize: 14,
              outline: 'none'
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
          
          {!isRecording ? (
            <button
              type="button"
              className="chat-button"
              onClick={startRecording}
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
              <Mic size={20} />
            </button>
          ) : (
            <button
              type="button"
              onClick={sendAudio}
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'theme.error',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Send size={20} />
            </button>
          )}
          
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
      />

      {/* Extra Modals */}
      {renderExtraModals?.()}
    </div>
  )
}