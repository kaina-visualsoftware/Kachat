import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../context/AuthContext'
import { UserCog, ArrowLeft, Upload, Save, X } from 'lucide-react'

export default function Profile() {
  const { user, profile, updateProfile, uploadAvatar, loadProfile } = useAuth()
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '')
      setBio(profile.bio || '')
      setAvatarUrl(profile.avatar_url || '')
    }
  }, [profile])

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Por favor, selecione uma imagem válida' })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'A imagem deve ter no máximo 5MB' })
      return
    }

    setUploading(true)
    setMessage({ type: '', text: '' })

    try {
      const result = await uploadAvatar(file)
      if (result.error) throw result.error
      setMessage({ type: 'success', text: 'Avatar atualizado com sucesso!' })
      // Reload profile to get new avatar URL
      if (user) loadProfile(user.id)
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const { error } = await updateProfile({
        username,
        bio
      })
      if (error) throw error
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' })
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setSaving(false)
    }
  }

  const getInitials = (name) => {
    return name?.charAt(0).toUpperCase() || '?'
  }

  const navigate = useNavigate()

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(180deg, #09090B 0%, rgba(24, 24, 27, 0.5) 100%)',
      overflowY: 'auto'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '16px 20px',
        background: 'rgba(24, 24, 27, 0.98)',
        borderBottom: '1px solid rgba(63, 63, 70, 0.5)',
        minHeight: 64
      }}>
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            background: 'rgba(63, 63, 70, 0.3)',
            border: '1px solid rgba(63, 63, 70, 0.5)',
            borderRadius: 10,
            color: '#A1A1AA',
            cursor: 'pointer',
            transition: 'all 200ms ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(139, 92, 246, 0.15)'
            e.target.style.color = '#A78BFA'
            e.target.style.borderColor = 'rgba(139, 92, 246, 0.3)'
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(63, 63, 70, 0.3)'
            e.target.style.color = '#A1A1AA'
            e.target.style.borderColor = 'rgba(63, 63, 70, 0.5)'
          }}
        >
          <ArrowLeft size={16} />
        </button>
        <h2 style={{
          margin: 0,
          fontSize: 16,
          fontWeight: 600,
          color: '#FAFAFA'
        }}>
          Meu Perfil
        </h2>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        padding: 32,
        display: 'flex',
        justifyContent: 'center'
      }}>
        <div style={{
          width: '100%',
          maxWidth: 600
        }}>
          {/* Message */}
          {message.text && (
            <div style={{
              padding: '12px 16px',
              marginBottom: 24,
              background: message.type === 'success' 
                ? 'rgba(16, 185, 129, 0.1)' 
                : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${message.type === 'success' 
                ? 'rgba(16, 185, 129, 0.3)' 
                : 'rgba(239, 68, 68, 0.3)'}`,
              borderRadius: 12,
              color: message.type === 'success' ? '#86EFAC' : '#FCA5A5',
              fontSize: 13
            }}>
              {message.text}
            </div>
          )}

          {/* Avatar Section */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: 32
          }}>
            <div style={{
              width: 120,
              height: 120,
              borderRadius: 20,
              background: avatarUrl 
                ? `url(${avatarUrl}) center/cover` 
                : 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 36,
              fontWeight: 600,
              color: 'white',
              marginBottom: 16,
              border: '3px solid rgba(139, 92, 246, 0.3)',
              cursor: 'pointer',
              transition: 'all 200ms ease',
              overflow: 'hidden',
              position: 'relative'
            }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = 'rgba(139, 92, 246, 0.6)'
                e.target.style.transform = 'scale(1.05)'
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = 'rgba(139, 92, 246, 0.3)'
                e.target.style.transform = 'scale(1)'
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              {!avatarUrl && getInitials(username)}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
              />
              {uploading && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0, 0, 0, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: 12
                }}>
                  Enviando...
                </div>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                background: 'rgba(139, 92, 246, 0.1)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: 8,
                color: '#A78BFA',
                fontSize: 13,
                cursor: uploading ? 'not-allowed' : 'pointer',
                transition: 'all 200ms ease',
                opacity: uploading ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (!uploading) {
                  e.target.style.background = 'rgba(139, 92, 246, 0.2)'
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(139, 92, 246, 0.1)'
              }}
            >
              <Upload size={14} />
              {uploading ? 'Enviando...' : 'Alterar Avatar'}
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Username */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: 8,
                fontSize: 13,
                fontWeight: 500,
                color: '#A1A1AA'
              }}>
                Nome de usuário
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: 'rgba(39, 39, 42, 0.8)',
                  border: '1px solid rgba(63, 63, 70, 0.5)',
                  borderRadius: 12,
                  color: '#FAFAFA',
                  fontSize: 13,
                  outline: 'none',
                  transition: 'all 200ms ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.border = '1px solid rgba(139, 92, 246, 0.5)'
                  e.target.style.background = 'rgba(39, 39, 42, 1)'
                }}
                onBlur={(e) => {
                  e.target.style.border = '1px solid rgba(63, 63, 70, 0.5)'
                  e.target.style.background = 'rgba(39, 39, 42, 0.8)'
                }}
              />
            </div>

            {/* Email (read-only) */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: 8,
                fontSize: 13,
                fontWeight: 500,
                color: '#A1A1AA'
              }}>
                Email
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: 'rgba(39, 39, 42, 0.4)',
                  border: '1px solid rgba(63, 63, 70, 0.3)',
                  borderRadius: 12,
                  color: '#71717A',
                  fontSize: 13,
                  outline: 'none',
                  boxSizing: 'border-box',
                  cursor: 'not-allowed'
                }}
              />
            </div>

            {/* Bio */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: 8,
                fontSize: 13,
                fontWeight: 500,
                color: '#A1A1AA'
              }}>
                Bio (opcional)
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: 'rgba(39, 39, 42, 0.8)',
                  border: '1px solid rgba(63, 63, 70, 0.5)',
                  borderRadius: 12,
                  color: '#FAFAFA',
                  fontSize: 13,
                  outline: 'none',
                  transition: 'all 200ms ease',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
                onFocus={(e) => {
                  e.target.style.border = '1px solid rgba(139, 92, 246, 0.5)'
                  e.target.style.background = 'rgba(39, 39, 42, 1)'
                }}
                onBlur={(e) => {
                  e.target.style.border = '1px solid rgba(63, 63, 70, 0.5)'
                  e.target.style.background = 'rgba(39, 39, 42, 0.8)'
                }}
              />
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={saving}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                width: '100%',
                padding: '12px',
                background: saving 
                  ? 'rgba(139, 92, 246, 0.5)' 
                  : 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
                color: 'white',
                border: 'none',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'all 200ms ease',
                opacity: saving ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (!saving) {
                  e.target.style.transform = 'translateY(-2px)'
                  e.target.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.4)'
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = 'none'
              }}
            >
              <Save size={16} />
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
