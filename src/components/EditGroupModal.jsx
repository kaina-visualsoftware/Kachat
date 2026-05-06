import { useState, useRef } from 'react'
import { X, Camera, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Avatar } from './Avatar'

export default function EditGroupModal({ group, onClose, onSuccess }) {
  const { updateGroup, uploadChatFiles } = useAuth()
  const [name, setName] = useState(group?.name || '')
  const [description, setDescription] = useState(group?.description || '')
  const [avatarUrl, setAvatarUrl] = useState(group?.avatar_url || null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onload = (e) => setAvatarUrl(e.target.result)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Nome é obrigatório')
      return
    }

    setLoading(true)
    setError(null)

    try {
      let newAvatarUrl = avatarUrl

      // Upload new avatar if changed
      if (avatarFile) {
        const { data: files, error: uploadError } = await uploadChatFiles([avatarFile])
        if (uploadError) {
          setError('Erro ao上传ar foto')
          setLoading(false)
          return
        }
        if (files && files[0]) {
          newAvatarUrl = files[0].url
        }
      }

      // Update group
      const { error: updateError } = await updateGroup(group.id, {
        name: name.trim(),
        description: description.trim(),
        avatar_url: newAvatarUrl
      })

      if (updateError && updateError.message) {
        setError('Erro ao atualizar grupo')
        setLoading(false)
        return
      }

      onSuccess?.()
      onClose()
    } catch (err) {
      setError('Erro ao atualizar grupo')
    }

    setLoading(false)
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 20,
      boxSizing: 'border-box'
    }} onClick={onClose}>
      <div style={{
        background: '#18181B',
        borderRadius: 16,
        width: '100%',
        maxWidth: 400,
        padding: 24,
        border: '1px solid #27272A',
        boxSizing: 'border-box',
        maxHeight: '90vh',
        overflowY: 'auto'
      }} onClick={e => e.stopPropagation()}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24
        }}>
          <h2 style={{ color: '#FAFAFA', margin: 0, fontSize: 18 }}>Editar Grupo</h2>
          <button onClick={onClose} style={{
            background: 'none',
            border: 'none',
            color: '#A1A1AA',
            cursor: 'pointer',
            padding: 4
          }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Avatar */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 20,
            position: 'relative'
          }}>
            <div style={{ position: 'relative' }}>
              <Avatar
                url={avatarUrl}
                initials={name?.charAt(0)?.toUpperCase()}
                size={80}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: '#8B5CF6',
                  border: '3px solid #18181B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'white'
                }}
              >
                <Camera size={14} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {/* Name */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: '#A1A1AA', fontSize: 12, marginBottom: 6, display: 'block' }}>
              Nome do grupo
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              style={{
                width: '100%',
                maxWidth: '100%',
                padding: '12px 16px',
                borderRadius: 8,
                background: '#27272A',
                border: '1px solid #3F3F46',
                color: '#FAFAFA',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box'
              }}
              placeholder="Nome do grupo"
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ color: '#A1A1AA', fontSize: 12, marginBottom: 6, display: 'block' }}>
              Descrição (opcional)
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={{
                width: '100%',
                maxWidth: '100%',
                padding: '12px 16px',
                borderRadius: 8,
                background: '#27272A',
                border: '1px solid #3F3F46',
                color: '#FAFAFA',
                fontSize: 14,
                outline: 'none',
                resize: 'vertical',
                minHeight: 80,
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
              placeholder="Descrição do grupo..."
            />
          </div>

          {error && (
            <div style={{
              color: '#EF4444',
              fontSize: 13,
              marginBottom: 16,
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 8,
              background: '#8B5CF6',
              border: 'none',
              color: 'white',
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Salvar alterações
          </button>
        </form>
      </div>
    </div>
  )
}