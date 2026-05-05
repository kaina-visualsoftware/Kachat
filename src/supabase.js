import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    logger: import.meta.env.DEV ? (kind, msg, data) => console.log(`[Realtime] ${kind}: ${msg}`, data) : false,
    params: {
      eventsPerSecond: 10
    }
  }
})
