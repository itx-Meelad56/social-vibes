import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const supabaseUrl = 'https://qswwlweygugftvslxzou.supabase.co'

const supabaseKey = 'sb_publishable_zB72Gw1aE6YIZTWwU9Otqw_JDmFFkIJ'

const supabase = createClient(supabaseUrl, supabaseKey)

export { supabase }

