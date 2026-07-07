import { useState, useRef, useEffect } from 'react'
import { theme } from '../theme'

export function VoiceNote({ url, duration, isMe }) {
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const audioRef = useRef(null)
  const progressRef = useRef(null)
  const animationRef = useRef(null)

  useEffect(() => {
    const audio = new Audio(url)
    audio.preload = 'metadata'
    audio.onloadedmetadata = () => setLoaded(true)
    audioRef.current = audio

    audio.onended = () => {
      setPlaying(false)
      setCurrentTime(0)
    }

    audio.ontimeupdate = () => {
      if (audio.duration) {
        setCurrentTime(audio.currentTime)
      }
    }

    return () => {
      audio.pause()
      audio.src = ''
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [url])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return

    if (playing) {
      audio.pause()
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    } else {
      audio.play().catch(() => {})
      const update = () => {
        if (audio.duration) {
          setCurrentTime(audio.currentTime)
        }
        animationRef.current = requestAnimationFrame(update)
      }
      animationRef.current = requestAnimationFrame(update)
    }
    setPlaying(!playing)
  }

  const handleProgressClick = (e) => {
    const audio = audioRef.current
    if (!audio || !loaded) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const pct = x / rect.width
    audio.currentTime = pct * audio.duration
    setCurrentTime(audio.currentTime)

    if (!playing) {
      audio.play().catch(() => {})
      setPlaying(true)
      const update = () => {
        if (audio.duration) setCurrentTime(audio.currentTime)
        animationRef.current = requestAnimationFrame(update)
      }
      animationRef.current = requestAnimationFrame(update)
    }
  }

  const displayDuration = duration || (loaded && audioRef.current?.duration ? Math.round(audioRef.current.duration) : 0)
  const progress = loaded && audioRef.current?.duration ? (currentTime / audioRef.current.duration) * 100 : 0
  const currentDisplay = Math.floor(currentTime)

  const formatTime = (s) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const barCount = 30

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      minWidth: 200,
      maxWidth: 260,
      padding: '2px 0'
    }}>
      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: 'none',
          background: isMe ? 'rgba(255,255,255,0.2)' : 'rgba(139, 92, 246, 0.2)',
          color: isMe ? '#FFFFFF' : theme.accent,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'all 0.15s ease'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        {playing ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="8,5 19,12 8,19" />
          </svg>
        )}
      </button>

      {/* Waveform / Progress */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {/* Waveform bars */}
        <div
          ref={progressRef}
          onClick={handleProgressClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            height: 28,
            cursor: 'pointer',
            position: 'relative'
          }}
        >
          {Array.from({ length: barCount }).map((_, i) => {
            const barProgress = (i / barCount) * 100
            const isPlayed = barProgress <= progress
            const height = 5 + Math.sin((i / barCount) * Math.PI * 4) * 10 + Math.sin(i * 2.7) * 4
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: Math.max(4, height),
                  borderRadius: 2,
                  background: isPlayed
                    ? (isMe ? '#FFFFFF' : theme.accent)
                    : (isMe ? 'rgba(255,255,255,0.3)' : 'rgba(139, 92, 246, 0.25)'),
                  transition: 'background 0.1s ease',
                  minWidth: 2
                }}
              />
            )
          })}
        </div>

        {/* Time */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 10,
          color: isMe ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.5)'
        }}>
          <span>{playing ? formatTime(currentDisplay) : formatTime(displayDuration)}</span>
          <span>{formatTime(displayDuration)}</span>
        </div>
      </div>
    </div>
  )
}
