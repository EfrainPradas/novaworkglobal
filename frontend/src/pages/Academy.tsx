import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Academy from '../components/academy/Academy'
import AcademyAdmin from '../components/academy/AcademyAdmin'

const ADMIN_EMAIL = 'efrain.pradas@gmail.com'

export default function AcademyPage() {
  const navigate = useNavigate()
  const [showAdmin, setShowAdmin] = useState(false)

  useEffect(() => {
    async function loadUserData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/signin')
        return
      }
    }
    loadUserData()
  }, [navigate])

  return (
    <>
      <Academy onOpenAdmin={() => setShowAdmin(true)} />
      <AcademyAdmin isOpen={showAdmin} onClose={() => setShowAdmin(false)} />
    </>
  )
}
