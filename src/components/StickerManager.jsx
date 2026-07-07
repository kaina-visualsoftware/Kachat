import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { Plus, Trash2, Upload, X } from 'lucide-react'
import { theme } from '../theme'

export default function StickerManager({ onClose }) {
  const { uploadStickerImage, getStickerPacks, createStickerPack, getStickers, addStickerToPack, deleteStickerPack, deleteSticker } = useAuth()
  const [packs, setPacks] = useState([])
  const [selectedPack, setSelectedPack] = useState(null)
  const [stickers, setStickers] = useState([])
  const [showNewPackInput, setShowNewPackInput] = useState(false)
  const [newPackName, setNewPackName] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    loadPacks()
  }, [])

  const loadPacks = async () => {
    const { data } = await getStickerPacks()
    setPacks(data || [])
    if (data?.length > 0 && !selectedPack) {
      setSelectedPack(data[0].id)
    }
  }

  const loadStickers = async (packId) => {
    const { data } = await getStickers(packId)
    setStickers(data || [])
  }

  useEffect(() => {
    if (selectedPack) {
      loadStickers(selectedPack)
    } else {
      setStickers([])
    }
  }, [selectedPack])

  const handleCreatePack = async () => {
    if (!newPackName.trim()) return
    const { data } = await createStickerPack(newPackName.trim())
    if (data) {
      setNewPackName('')
      setShowNewPackInput(false)
      await loadPacks()
      setSelectedPack(data.id)
    }
  }

  const handleUploadSticker = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !selectedPack) return

    const maxSize = 1 * 1024 * 1024
    if (file.size > maxSize) {
      alert('Figurinha deve ter no máximo 1MB')
      return
    }

    const validTypes = ['image/png', 'image/webp', 'image/jpeg', 'image/gif']
    if (!validTypes.includes(file.type)) {
      alert('Formatos permitidos: PNG, WebP, JPEG, GIF')
      return
    }

    setUploading(true)
    const { data: uploadData, error: uploadError } = await uploadStickerImage(file)
    
    if (uploadError) {
      alert('Erro ao fazer upload: ' + uploadError.message)
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    const { error: addError } = await addStickerToPack(selectedPack, uploadData.url)
    
    if (addError) {
      alert('Erro ao adicionar figurinha: ' + addError.message)
    } else {
      await loadStickers(selectedPack)
    }
    
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDeletePack = async (packId) => {
    if (!confirm('Deletar este pack e todas as suas figurinhas?')) return
    const { error } = await deleteStickerPack(packId)
    if (!error) {
      if (selectedPack === packId) setSelectedPack(null)
      await loadPacks()
    }
  }

  const handleDeleteSticker = async (stickerId) => {
    if (!confirm('Deletar esta figurinha?')) return
    const { error } = await deleteSticker(stickerId)
    if (!error) {
      await loadStickers(selectedPack)
    }
  }

  return (
    <div style={{
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
      padding: 20
    }}>
      <div style={{
        width: '100%',
        maxWidth: 500,
        maxHeight: '80vh',
        background: '#18181B',
        borderRadius: 16,
        border: '1px solid #3F3F46',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)',
        display: 'flex',
        flexDirection: 'column',
        animation: 'fadeInUp 0.2s ease-out'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid #3F3F46'
        }}>
          <span style={{ color: '#FAFAFA', fontSize: 16, fontWeight: 600 }}>
            Gerenciar figurinhas
          </span>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32,
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
            <X size={18} />
          </button>
        </div>

        {/* Pack selector */}
        <div style={{
          display: 'flex',
          gap: 8,
          padding: '12px 20px',
          borderBottom: '1px solid #3F3F46',
          flexWrap: 'wrap'
        }}>
          {packs.map(pack => (
            <div key={pack.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                onClick={() => setSelectedPack(pack.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 16,
                  border: 'none',
                  background: selectedPack === pack.id ? theme.accent : theme.bgTertiary,
                  color: '#FFFFFF',
                  fontSize: 12,
                  cursor: 'pointer',
                  fontWeight: selectedPack === pack.id ? 600 : 400
                }}
              >
                {pack.name}
              </button>
              <button
                onClick={() => handleDeletePack(pack.id)}
                style={{
                  width: 24, height: 24,
                  borderRadius: '50%',
                  border: 'none',
                  background: 'transparent',
                  color: '#EF4444',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  opacity: 0.6
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
              >
                <X size={12} />
              </button>
            </div>
          ))}

          {showNewPackInput ? (
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input
                value={newPackName}
                onChange={(e) => setNewPackName(e.target.value)}
                placeholder="Nome do pack"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreatePack()
                  if (e.key === 'Escape') setShowNewPackInput(false)
                }}
                style={{
                  padding: '4px 10px',
                  borderRadius: 8,
                  border: '1px solid #52525B',
                  background: theme.bgTertiary,
                  color: '#FFFFFF',
                  fontSize: 12,
                  outline: 'none',
                  width: 130
                }}
              />
              <button
                onClick={handleCreatePack}
                style={{
                  padding: '4px 10px',
                  borderRadius: 8,
                  border: 'none',
                  background: theme.accent,
                  color: 'white',
                  fontSize: 11,
                  cursor: 'pointer'
                }}
              >
                Criar
              </button>
              <button
                onClick={() => setShowNewPackInput(false)}
                style={{
                  padding: '4px 8px',
                  borderRadius: 8,
                  border: '1px solid #52525B',
                  background: 'transparent',
                  color: '#A1A1AA',
                  fontSize: 11,
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowNewPackInput(true)}
              style={{
                width: 32, height: 32,
                borderRadius: '50%',
                border: '1px dashed #52525B',
                background: 'transparent',
                color: '#A1A1AA',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Plus size={16} />
            </button>
          )}
        </div>

        {/* Sticker grid */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: 16,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          alignContent: 'flex-start'
        }}>
          {!selectedPack ? (
            <div style={{ color: '#A1A1AA', fontSize: 13, textAlign: 'center', width: '100%', padding: 40 }}>
              Selecione ou crie um pack para começar
            </div>
          ) : stickers.length === 0 ? (
            <div style={{ color: '#A1A1AA', fontSize: 13, textAlign: 'center', width: '100%', padding: 40 }}>
              Nenhuma figurinha neste pack ainda
            </div>
          ) : (
            stickers.map(sticker => (
              <div key={sticker.id} style={{
                position: 'relative',
                width: 90,
                height: 90,
                borderRadius: 12,
                overflow: 'hidden',
                background: theme.bgTertiary,
                border: '1px solid #3F3F46'
              }}>
                <img
                  src={sticker.image_url}
                  alt="Figurinha"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    padding: 6
                  }}
                />
                <button
                  onClick={() => handleDeleteSticker(sticker.id)}
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    width: 22, height: 22,
                    borderRadius: '50%',
                    background: 'rgba(239,68,68,0.8)',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10
                  }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Add sticker button */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid #3F3F46',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/webp,image/jpeg,image/gif"
            onChange={handleUploadSticker}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={!selectedPack || uploading}
            style={{
              padding: '10px 24px',
              borderRadius: 10,
              border: 'none',
              background: !selectedPack ? '#3F3F46' : 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
              color: '#FFFFFF',
              fontSize: 14,
              fontWeight: 600,
              cursor: !selectedPack ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <Upload size={18} />
            {uploading ? 'Enviando...' : 'Adicionar figurinha'}
          </button>
        </div>
      </div>
    </div>
  )
}
