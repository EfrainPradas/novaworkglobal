import { useState, useRef } from 'react'
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
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Get user initials for placeholder
  const getInitials = () => {
    const user = supabase.auth.getUser()
    return 'U'
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0]
      if (!file) return

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('Image size should be less than 2MB')
        return
      }

      setUploading(true)

      // Create unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      console.log('📤 Uploading avatar:', filePath)

      // Upload to Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        // If bucket doesn't exist, show helpful message
        if (uploadError.message.includes('not found')) {
          alert('Storage bucket not configured. Please contact support.')
        } else {
          alert(`Error uploading image: ${uploadError.message}`)
        }
        return
      }

      console.log('✅ Upload successful:', data)

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      console.log('🔗 Public URL:', publicUrl)

      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      })

      if (updateError) {
        console.error('Error updating user metadata:', updateError)
        alert('Error updating profile')
        return
      }

      console.log('✅ User metadata updated')

      // Update local state
      setAvatarUrl(publicUrl)

      // Notify parent component
      if (onAvatarUpdate) {
        onAvatarUpdate(publicUrl)
      }

      alert('Profile photo updated successfully!')
    } catch (error) {
      console.error('Error uploading avatar:', error)
      alert('An error occurred while uploading the image')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Avatar Display */}
      <div className="relative group">
        <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-3xl font-semibold shadow-lg">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{getInitials()}</span>
          )}
        </div>

        {/* Upload Button Overlay */}
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

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload Button */}
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors disabled:opacity-50"
      >
        {uploading ? 'Uploading...' : 'Change Photo'}
      </button>

      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
        JPG, PNG or GIF. Max size 2MB.
      </p>
    </div>
  )
}
