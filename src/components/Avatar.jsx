export function Avatar({ 
  url,           
  initials,       
  gradient,       
  size = 40,     
  style = {}      
}) {
  const finalGradient = gradient || 'linear-gradient(135deg, #8B5CF6, #7C3AED)'
  
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      overflow: 'hidden',
      position: 'relative',
      flexShrink: 0,
      boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
      ...style
    }}>
      {url && (
        <img 
          src={url} 
          alt="avatar"
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover'
          }}
        />
      )}
      
      {/* Fallback - iniciais */}
      <div style={{
        display: url ? 'none' : 'flex',
        width: '100%',
        height: '100%',
        background: finalGradient,
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.4,
        fontWeight: 600,
        color: '#FFFFFF'
      }}>
        {initials || '?'}
      </div>
    </div>
  )
}