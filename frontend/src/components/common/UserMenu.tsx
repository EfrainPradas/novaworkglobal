import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { User, Settings, LogOut, Moon, Sun, ChevronDown, Copy, UserCircle, Globe, TrendingUp, CreditCard } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'
import i18n from '../../i18n/config'

interface UserMenuProps {
  user: any
  userProfile?: {
    full_name?: string
  }
  sizeClass?: string
}

export default function UserMenu({ user, userProfile, sizeClass = "w-10 h-10" }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [isCoach, setIsCoach] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [customAvatarUrl, setCustomAvatarUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { theme, toggleTheme } = useTheme()

  // Check if user is a coach
  useEffect(() => {
    const checkCoachStatus = async () => {
      if (!user?.id) return
      try {
        const { data } = await supabase
          .from('users')
          .select('is_coach')
          .eq('id', user.id)
          .single()
        setIsCoach(data?.is_coach === true)
      } catch (err) {
        console.error('Error checking coach status:', err)
      }
    }
    checkCoachStatus()
  }, [user?.id])

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setShowSettings(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  // Copy to clipboard functions
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // You could add a toast notification here
      alert(`${label} copied to clipboard!`)
    } catch (err) {
      console.error('Failed to copy: ', err)
      alert('Failed to copy to clipboard')
    }
  }

  const copyEmail = () => {
    if (user?.email) {
      copyToClipboard(user.email, 'Email')
    }
  }

  const copyProfileLink = () => {
    const profileUrl = `${window.location.origin}/profile/${user?.id}`
    copyToClipboard(profileUrl, 'Profile Link')
  }

  const copyUserId = () => {
    if (user?.id) {
      copyToClipboard(user.id, 'User ID')
    }
  }

  // Get user initials from full name or email
  const getUserInitials = () => {
    if (userProfile?.full_name) {
      const names = userProfile.full_name.split(' ')
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
      }
      return names[0].substring(0, 2).toUpperCase()
    }
    if (user?.email) {
      const emailName = user.email.split('@')[0]
      return emailName.substring(0, 2).toUpperCase()
    }
    return 'U'
  }

  // Get display name
  const getDisplayName = () => {
    if (userProfile?.full_name) {
      return userProfile.full_name
        .split('.')
        .map((n: string) => n.charAt(0).toUpperCase() + n.slice(1))
        .join(' ')
    }
    if (user?.email) {
      return user.email
        .split('@')[0]
        .split('.')
        .map((n: string) => n.charAt(0).toUpperCase() + n.slice(1))
        .join(' ')
    }
    return 'User'
  }

  // Load avatar_url from users table (DB) on mount — overrides auth metadata
  useEffect(() => {
    const loadAvatar = async () => {
      if (!user?.id) return
      const { data } = await supabase
        .from('users')
        .select('avatar_url')
        .eq('id', user.id)
        .single()
      if (data?.avatar_url) setCustomAvatarUrl(data.avatar_url)
    }
    loadAvatar()
  }, [user?.id])

  // Get user avatar URL — prefer DB custom upload, fallback to auth metadata
  const avatarUrl = customAvatarUrl || user?.user_metadata?.avatar_url

  useEffect(() => {
    setImgError(false)
  }, [avatarUrl])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return

    // Validate file
    if (!file.type.startsWith('image/')) {
      alert(t('userMenu.invalidImageType', 'Please select an image file'))
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert(t('userMenu.imageTooLarge', 'Image must be less than 5MB'))
      return
    }

    try {
      setUploadingAvatar(true)

      // 1. Get presigned URL from backend
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
        .eq('id', user.id)

      if (updateError) throw updateError

      setCustomAvatarUrl(publicUrl)
      setImgError(false)
    } catch (err: any) {
      console.error('Avatar upload error:', err)
      alert(t('userMenu.avatarUploadError', 'Failed to upload avatar: ') + (err?.message || 'unknown error'))
    } finally {
      setUploadingAvatar(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* User Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        {/* Avatar */}
        <div className={`${sizeClass} rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold text-sm overflow-hidden`}>
          {avatarUrl && !imgError ? (
            <img 
              src={avatarUrl} 
              alt="User avatar" 
              className="w-full h-full object-cover" 
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)} 
            />
          ) : (
            getUserInitials()
          )}
        </div>

        {/* Chevron */}
        <ChevronDown
          className={`w-4 h-4 text-gray-600 dark:text-gray-300 transition-transform ${isOpen ? 'rotate-180' : ''
            }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
          {!showSettings ? (
            <>
              {/* User Info Section */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold overflow-hidden">
                    {avatarUrl && !imgError ? (
                      <img 
                        src={avatarUrl} 
                        alt="User avatar" 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                        onError={() => setImgError(true)} 
                      />
                    ) : (
                      <span className="text-lg">{getUserInitials()}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {getDisplayName()}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Coach Dashboard Access — Only visible to coaches */}
              {isCoach && (
                <div className="border-b border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => {
                      navigate('/coach')
                      setIsOpen(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 text-amber-700 dark:text-amber-400 hover:from-amber-100 hover:to-orange-100 dark:hover:from-amber-900/30 dark:hover:to-orange-900/30 transition-all"
                  >
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                      <TrendingUp className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="text-left">
                      <span className="block">{t('userMenu.coachDashboard', 'Coach Dashboard')}</span>
                      <span className="text-xs text-amber-600/70 dark:text-amber-400/70 font-normal">{t('userMenu.manageClients', 'Manage your clients')}</span>
                    </div>
                  </button>
                </div>
              )}

              {/* Menu Items */}
              <div className="py-2">
                <button
                  onClick={() => {
                    navigate('/dashboard/resume-builder/profile')
                    setIsOpen(false)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>{t('userMenu.myProfile', 'My Profile')}</span>
                </button>

                {/* Admin Only - Translations */}
                {user?.email && ['awoodw@gmail.com', 'efrain.pradas@gmail.com', 'isacriperez@gmail.com'].includes(user.email.toLowerCase()) && (
                  <button
                    onClick={() => {
                      navigate('/admin/translations')
                      setIsOpen(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/10 hover:bg-purple-100 dark:hover:bg-purple-900/20 transition-colors font-medium border-l-2 border-purple-500"
                  >
                    <Globe className="w-4 h-4" />
                    <span>{t('userMenu.translations', 'Translations')}</span>
                  </button>
                )}

                <button
                  onClick={() => setShowSettings(true)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span>{t('userMenu.settingsTheme', 'Settings & Theme')}</span>
                </button>

                <button
                  onClick={() => { navigate('/dashboard/billing'); setIsOpen(false) }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>{t('userMenu.billing', 'Billing & Plan')}</span>
                </button>

                <hr className="my-2 border-gray-200 dark:border-gray-700" />

                <div className="px-4 py-2">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">{t('userMenu.quickActions', 'Quick Actions')}</p>
                </div>

                <button
                  onClick={() => {
                    copyEmail()
                    setIsOpen(false)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  <span>{t('userMenu.copyEmail', 'Copy Email')}</span>
                </button>

                <button
                  onClick={() => {
                    copyProfileLink()
                    setIsOpen(false)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  <span>{t('userMenu.copyProfileLink', 'Copy Profile Link')}</span>
                </button>

                <button
                  onClick={() => {
                    copyUserId()
                    setIsOpen(false)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  <span>{t('userMenu.copyUserId', 'Copy User ID')}</span>
                </button>

                {/* DEV TOOLS - TIER SWITCHING */}
                <hr className="my-2 border-gray-200 dark:border-gray-700" />
                <div className="px-4 py-2">
                  <p className="text-xs font-semibold text-amber-600 dark:text-amber-500 mb-2">{t('userMenu.devSwitchTier', 'Dev: Switch Tier')}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        if (!user) return
                        const { error } = await supabase.from('users').update({ subscription_tier: 'esenciales' }).eq('id', user.id)
                        if (error) alert('Error: ' + error.message)
                        else window.location.reload()
                      }}
                      className="flex-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
                    >
                      {t('userMenu.essentials', 'Essentials')}
                    </button>
                    <button
                      onClick={async () => {
                        if (!user) return
                        const { error } = await supabase.from('users').update({ subscription_tier: 'momentum' }).eq('id', user.id)
                        if (error) alert('Error: ' + error.message)
                        else window.location.reload()
                      }}
                      className="flex-1 px-2 py-1 text-xs bg-emerald-100 dark:bg-emerald-900/30 rounded hover:bg-emerald-200 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400"
                    >
                      {t('userMenu.momentum', 'Momentum')}
                    </button>
                    <button
                      onClick={async () => {
                        if (!user) return
                        const { error } = await supabase.from('users').update({ subscription_tier: 'vanguard' }).eq('id', user.id)
                        if (error) alert('Error: ' + error.message)
                        else window.location.reload()
                      }}
                      className="flex-1 px-2 py-1 text-xs bg-amber-100 dark:bg-amber-900/30 rounded hover:bg-amber-200 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400"
                    >
                      {t('userMenu.vanguard', 'Vanguard')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Language Switcher */}
              <hr className="my-2 border-gray-200 dark:border-gray-700" />
              <div className="px-4 py-2">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <select
                    value={i18n.language?.startsWith('en') ? 'en' : i18n.language?.startsWith('es') ? 'es' : i18n.language?.startsWith('fr') ? 'fr' : i18n.language?.startsWith('it') ? 'it' : i18n.language?.startsWith('pt') ? 'pt' : 'en'}
                    onChange={(e) => {
                      i18n.changeLanguage(e.target.value).then(() => {
                        window.location.reload()
                      })
                    }}
                    className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 cursor-pointer focus:ring-2 focus:ring-primary-500 outline-none"
                  >
                    <option value="en">🇺🇸 English</option>
                    <option value="es">🇪🇸 Español</option>
                    <option value="fr">🇫🇷 Français</option>
                    <option value="it">🇮🇹 Italiano</option>
                    <option value="pt">🇧🇷 Português</option>
                  </select>
                </div>
              </div>

              {/* Sign Out */}
              <div className="border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('userMenu.signOut', 'Sign Out')}</span>
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Settings Panel */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t('userMenu.settingsTheme', 'Settings & Theme')}</h3>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    {t('userMenu.back', 'Back')}
                  </button>
                </div>

                {/* Theme Toggle */}
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                      {t('userMenu.appearance', 'Appearance')}
                    </label>
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        {theme === 'dark' ? (
                          <Moon className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                        ) : (
                          <Sun className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                        )}
                        <span className="text-sm text-gray-700 dark:text-gray-200">
                          {theme === 'dark' ? t('userMenu.darkMode', 'Dark Mode') : t('userMenu.lightMode', 'Light Mode')}
                        </span>
                      </div>
                      <button
                        onClick={toggleTheme}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${theme === 'dark' ? 'bg-primary-600' : 'bg-gray-300'
                          }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                            }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                      {t('userMenu.account', 'Account')}
                    </label>
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          navigate('/dashboard/resume-builder/profile')
                          setShowSettings(false)
                          setIsOpen(false)
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <UserCircle className="w-4 h-4" />
                        <span>{t('userMenu.editProfile', 'Edit Profile')}</span>
                      </button>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <UserCircle className="w-4 h-4" />
                        <span>{uploadingAvatar ? t('userMenu.uploading', 'Uploading...') : t('userMenu.changeAvatar', 'Change Avatar')}</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                      {t('userMenu.dataPrivacy', 'Data & Privacy')}
                    </label>
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          alert('Export data feature coming soon!')
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                        <span>{t('userMenu.exportMyData', 'Export My Data')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
