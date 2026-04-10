import { useEffect, useState } from 'react'
import { CheckCircle2, Loader2, UserCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface Props {
  coachId: string | undefined
}

export default function CoachProfileView({ coachId }: Props) {
  const [bio, setBio] = useState('')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!coachId) return
    loadProfile()
  }, [coachId])

  const loadProfile = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('coach_profiles')
        .select('bio, title')
        .eq('user_id', coachId)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      if (data) {
        setBio(data.bio || '')
        setTitle(data.title || '')
      }
    } catch (e: any) {
      console.error('Load profile error:', e)
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!coachId) return
    setSaving(true)
    setError(null)
    try {
      const { error } = await supabase
        .from('coach_profiles')
        .update({ bio: bio.trim() || null, title: title.trim() || null })
        .eq('user_id', coachId)

      if (error) throw error
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e: any) {
      console.error('Save profile error:', e)
      setError(e.message || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
        <Loader2 size={24} className="animate-spin" color="#1F5BAA" />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #e8edf2', padding: 28, boxShadow: '0 2px 12px #0000000a' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <UserCircle size={22} color="#1F5BAA" />
          <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: 0 }}>My Coach Profile</h2>
        </div>
        <p style={{ fontSize: 13, color: '#64748b', marginTop: 0, marginBottom: 24 }}>
          This information is shown to clients on the "My Coaches" page.
        </p>

        {error && (
          <div style={{ padding: 12, marginBottom: 16, background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 10, color: '#b91c1c', fontSize: 13 }}>
            {error}
          </div>
        )}

        {saved && (
          <div style={{ padding: 12, marginBottom: 16, background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: 10, color: '#15803d', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={16} /> Profile saved successfully!
          </div>
        )}

        {/* Title */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
            Title / Headline
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. Executive Career Coach"
            style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, color: '#0f172a', outline: 'none', transition: 'border-color 0.15s' }}
            onFocus={e => (e.currentTarget.style.borderColor = '#1F5BAA')}
            onBlur={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
          />
          <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, marginBottom: 0 }}>
            If empty, "Executive Career Coach" will be shown.
          </p>
        </div>

        {/* Bio */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
            Bio / Personal Message
          </label>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="Share your personal message to potential clients. What makes you unique? Your background, specialties, or approach..."
            rows={6}
            style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, color: '#0f172a', outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }}
            onFocus={e => (e.currentTarget.style.borderColor = '#1F5BAA')}
            onBlur={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
          />
          <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, marginBottom: 0 }}>
            If empty, a default message will be shown to clients.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{ padding: '12px 24px', borderRadius: 10, background: '#1F5BAA', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 8 }}
        >
          {saving && <Loader2 size={16} className="animate-spin" />}
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  )
}
