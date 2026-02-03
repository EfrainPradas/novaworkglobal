import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Settings, LogOut, Moon, Sun, ChevronDown, Copy, UserCircle } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { supabase } from '../../lib/supabase'

interface UserMenuProps {
  user: any
  userProfile?: {
    full_name?: string
  }
}

export default function UserMenu({ user, userProfile }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()

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

  // Get user avatar URL if available
  const avatarUrl = user?.user_metadata?.avatar_url

  return (
    <div className="relative" ref={menuRef}>
      {/* User Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold text-sm overflow-hidden">
          {avatarUrl ? (
            <img src={avatarUrl} alt="User avatar" className="w-full h-full object-cover" />
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
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="User avatar" className="w-full h-full object-cover" />
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

              {/* Menu Items */}
              <div className="py-2">
                <button
                  onClick={() => {
                    navigate('/resume-builder/profile')
                    setIsOpen(false)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>My Profile</span>
                </button>

                <button
                  onClick={() => setShowSettings(true)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings & Theme</span>
                </button>

                <hr className="my-2 border-gray-200 dark:border-gray-700" />

                <div className="px-4 py-2">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Quick Actions</p>
                </div>

                <button
                  onClick={() => {
                    copyEmail()
                    setIsOpen(false)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy Email</span>
                </button>

                <button
                  onClick={() => {
                    copyProfileLink()
                    setIsOpen(false)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy Profile Link</span>
                </button>

                <button
                  onClick={() => {
                    copyUserId()
                    setIsOpen(false)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy User ID</span>
                </button>

                {/* DEV TOOLS - TIER SWITCHING */}
                <hr className="my-2 border-gray-200 dark:border-gray-700" />
                <div className="px-4 py-2">
                  <p className="text-xs font-semibold text-amber-600 dark:text-amber-500 mb-2">Dev: Switch Tier</p>
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        if (!user) return
                        const { error } = await supabase.from('users').update({ subscription_tier: 'basic' }).eq('id', user.id)
                        if (error) alert('Error: ' + error.message)
                        else window.location.reload()
                      }}
                      className="flex-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
                    >
                      Basic
                    </button>
                    <button
                      onClick={async () => {
                        if (!user) return
                        const { error } = await supabase.from('users').update({ subscription_tier: 'pro' }).eq('id', user.id)
                        if (error) alert('Error: ' + error.message)
                        else window.location.reload()
                      }}
                      className="flex-1 px-2 py-1 text-xs bg-emerald-100 dark:bg-emerald-900/30 rounded hover:bg-emerald-200 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400"
                    >
                      Pro
                    </button>
                    <button
                      onClick={async () => {
                        if (!user) return
                        const { error } = await supabase.from('users').update({ subscription_tier: 'executive' }).eq('id', user.id)
                        if (error) alert('Error: ' + error.message)
                        else window.location.reload()
                      }}
                      className="flex-1 px-2 py-1 text-xs bg-amber-100 dark:bg-amber-900/30 rounded hover:bg-amber-200 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400"
                    >
                      Exec
                    </button>
                  </div>
                </div>
              </div>

              {/* Sign Out */}
              <div className="border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Settings Panel */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Settings & Theme</h3>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    Back
                  </button>
                </div>

                {/* Theme Toggle */}
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                      Appearance
                    </label>
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        {theme === 'dark' ? (
                          <Moon className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                        ) : (
                          <Sun className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                        )}
                        <span className="text-sm text-gray-700 dark:text-gray-200">
                          {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
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
                      Account
                    </label>
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          navigate('/resume-builder/profile')
                          setShowSettings(false)
                          setIsOpen(false)
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <UserCircle className="w-4 h-4" />
                        <span>Edit Profile</span>
                      </button>

                      <button
                        onClick={() => {
                          // TODO: Implement avatar upload
                          alert('Avatar upload coming soon!')
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <UserCircle className="w-4 h-4" />
                        <span>Change Avatar</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                      Data & Privacy
                    </label>
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          alert('Export data feature coming soon!')
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                        <span>Export My Data</span>
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
