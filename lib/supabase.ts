import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jvllgjgvbalirniaheyj.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_gcI3JQsR6fPSs-pN7fmkEw_f8mN0ICx'

export const supabase = createClient(supabaseUrl, supabaseKey)
