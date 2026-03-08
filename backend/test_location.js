import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function test_col() {
    const { data, error } = await supabase.from('education').select('location_city').limit(1)
    if (error) {
        console.error("COLUMN ERROR", error)
    } else {
        console.log("COLUMN EXISTS", data)
    }
}
test_col()
