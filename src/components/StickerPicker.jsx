import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { Settings, Plus } from 'lucide-react'
import { theme } from '../theme'

export function StickerPicker({ onSelectSticker, onOpenManager, onClose }) {
  const { getStickerPacks, getStickers } = useAuth()
  const [packs, setPacks] = useState([])
  const [stickersMap, setStickersMap] = useState({})
  const [activePack, setActivePack] = useState(null)
  const [loading, setLoading] = useState(true)
  const pickerRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        onClose?.()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  useEffect(() => {
    loadPacks()
  }, [])

  const loadPacks = async () => {
    setLoading(true)
    const { data: packsData } = await getStickerPacks()
    setPacks(packsData || [])
    if (packsData?.length > 0) {
      setActivePack(packsData[0].id)
      await loadStickersForPack(packsData[0].id)
    }
    setLoading(false)
  }

  const loadStickersForPack = async (packId) => {
    const { data } = await getStickers(packId)
    setStickersMap(prev => ({ ...prev, [packId]: data || [] }))
  }

  useEffect(() => {
    if (activePack && !stickersMap[activePack]) {
      loadStickersForPack(activePack)
    }
  }, [activePack])

  return (
    <div ref={pickerRef} style={{
      position: 'absolute',
      bottom: '100%',
      left: 0,
      right: 0,
      background: '#1E1E1E',
      border: '1px solid #3F3F46',
      borderBottom: 'none',
      borderRadius: '16px 16px 0 0',
      maxHeight: 320,
      display: 'flex',
      flexDirection: 'column',
      zIndex: 50,
      boxShadow: '0 -8px 32px rgba(0,0,0,0.5)',
      marginBottom: 8
    }}>
      {/* Header with packs tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px 12px',
        borderBottom: '1px solid #3F3F46',
        gap: 8,
        overflowX: 'auto',
        flexShrink: 0
      }}>
        {packs.map(pack => (
          <button
            key={pack.id}
            onClick={() => {
              setActivePack(pack.id)
              if (!stickersMap[pack.id]) {
                loadStickersForPack(pack.id)
              }
            }}
            style={{
              padding: '6px 14px',
              borderRadius: 16,
              border: 'none',
              background: activePack === pack.id ? theme.accent : theme.bgTertiary,
              color: '#FFFFFF',
              fontSize: 12,
              fontWeight: activePack === pack.id ? 600 : 400,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
          >
            {pack.name}
          </button>
        ))}
        <button
          onClick={onOpenManager}
          title="Gerenciar figurinhas"
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: 'none',
            background: 'transparent',
            color: '#A1A1AA',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginLeft: 'auto'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = theme.bgTertiary}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <Settings size={16} />
        </button>
      </div>

      {/* Sticker grid */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: 12,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        alignContent: 'flex-start'
      }}>
        {loading ? (
          <div style={{ color: '#A1A1AA', fontSize: 13, padding: 20, textAlign: 'center', width: '100%' }}>
            Carregando...
          </div>
        ) : packs.length === 0 ? (
          <div style={{ color: '#A1A1AA', fontSize: 13, padding: 20, textAlign: 'center', width: '100%' }}>
            Nenhum pack de figurinhas ainda.
          </div>
        ) : (
          (stickersMap[activePack] || []).map(sticker => (
            <div
              key={sticker.id}
              onClick={() => onSelectSticker?.(sticker.image_url, sticker.id)}
              style={{
                width: 80,
                height: 80,
                borderRadius: 12,
                overflow: 'hidden',
                cursor: 'pointer',
                background: theme.bgTertiary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
                border: '1px solid transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = theme.accent
                e.currentTarget.style.transform = 'scale(1.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'transparent'
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              <img
                src={sticker.image_url}
                alt="Figurinha"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  padding: 4
                }}
              />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
