import { createClient } from '@supabase/supabase-js'
import cron from 'node-cron'

// Use only public keys for client-side code
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export function scheduleCleanup() {
  // Run daily at 3 AM
  cron.schedule('0 3 * * *', async () => {
    console.log('Running scheduled document cleanup...')
    try {
      const { data, error } = await supabase.rpc('manual_cleanup_guest_documents')
      
      if (error) {
        console.error('Cleanup error:', error)
      } else {
        console.log('Cleanup successful:', data)
      }
    } catch (err) {
      console.error('Failed to execute cleanup:', err)
    }
  })
}