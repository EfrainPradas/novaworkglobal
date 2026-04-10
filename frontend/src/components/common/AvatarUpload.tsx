import { useState, useRef, useEffect } from 'react'
import { Camera, Loader } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface AvatarUploadProps {
  userId: string
  currentAvatarUrl?: string
  onAvatarUpdate?: (url: string) => void
}

export default function AvatarUpload({ userId, currentAvatarUrl, onAvatarUpdate }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl)
  const [imgError, setImgError] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync when prop changes
  useEffect(() => {
    setAvatarUrl(currentAvatarUrl)
    setImgError(false)
  }, [currentAvatarUrl])

  // Load from DB if no currentAvatarUrl provided
  useEffect(() => {
    if (currentAvatarUrl || !userId) return
    const load = async () => {
      const { data } = await supabase
        .from('users')
        .select('avatar_url')
        .eq('id', userId)
        .single()
      if (data?.avatar_url) setAvatarUrl(data.avatar_url)
    }
    load()
  }, [userId, currentAvatarUrl])

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0]
      if (!file) return

      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB')
        return
      }

      setUploading(true)

      // 1. Get presigned URL from backend (R2)
      const { data: { session } } = await supabase.auth.getSession()
      const apiBase = import.meta.env.VITE_API_URL || ''
      const presignRes = await fetch(`${apiBase}/api/upload/presigned-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
          folder: 'avatars',
        }),
      })

      if (!presignRes.ok) throw new Error('Failed to get upload URL')
      const { uploadUrl, publicUrl } = await presignRes.json()

      // 2. Upload to R2
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })

      if (!uploadRes.ok) throw new Error('Upload failed')

      // 3. Save to users.avatar_url
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', userId)

      if (updateError) throw updateError

      setAvatarUrl(publicUrl)
      setImgError(false)

      if (onAvatarUpdate) onAvatarUpdate(publicUrl)
    } catch (error: any) {
      console.error('Error uploading avatar:', error)
      alert('An error occurred while uploading the image: ' + (error?.message || 'unknown'))
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Avatar Display */}
      <div className="relative group">
        <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-3xl font-semibold shadow-lg">
          {avatarUrl && !imgError ? (
            <img
              src={avatarUrl}
              alt=""
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
            />
          ) : (
            <span>U</span>
          )}
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
        >
          {uploading ? (
            <Loader className="w-8 h-8 text-white animate-spin" />
          ) : (
            <Camera className="w-8 h-8 text-white" />
          )}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors disabled:opacity-50"
      >
        {uploading ? 'Uploading...' : 'Change Photo'}
      </button>

      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
        JPG, PNG or GIF. Max size 5MB.
      </p>
    </div>
  )
}
