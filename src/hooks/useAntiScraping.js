import { useEffect, useRef } from 'react'

const CLICK_THRESHOLD = 20
const CLICK_WINDOW = 3000
const PAGE_THRESHOLD = 15
const PAGE_WINDOW = 5000

export default function useAntiScraping() {
  const clicks = useRef([])
  const pageVisits = useRef([])
  const blocked = useRef(false)

  useEffect(() => {
    const handleClick = () => {
      if (blocked.current) return
      const now = Date.now()
      clicks.current = clicks.current.filter(t => now - t < CLICK_WINDOW)
      clicks.current.push(now)
      if (clicks.current.length > CLICK_THRESHOLD) {
        blocked.current = true
        document.body.style.pointerEvents = 'none'
        setTimeout(() => {
          blocked.current = false
          clicks.current = []
          document.body.style.pointerEvents = ''
        }, 10000)
      }
    }

    const handlePopState = () => {
      if (blocked.current) return
      const now = Date.now()
      pageVisits.current = pageVisits.current.filter(t => now - t < PAGE_WINDOW)
      pageVisits.current.push(now)
      if (pageVisits.current.length > PAGE_THRESHOLD) {
        blocked.current = true
        document.body.style.pointerEvents = 'none'
        setTimeout(() => {
          blocked.current = false
          pageVisits.current = []
          document.body.style.pointerEvents = ''
        }, 15000)
      }
    }

    document.addEventListener('click', handleClick)
    window.addEventListener('popstate', handlePopState)
    window.addEventListener('hashchange', handlePopState)

    return () => {
      document.removeEventListener('click', handleClick)
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('hashchange', handlePopState)
    }
  }, [])
}
