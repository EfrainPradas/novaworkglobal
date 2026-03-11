import { useState, useEffect, useRef } from 'react'
import { Bell, CalendarPlus } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  action_label?: string;
  action_url?: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationBellProps {
  userId: string;
}

export default function NotificationBell({ userId }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (!error && data) {
      setNotifications(data);
    }
  }

  useEffect(() => {
    fetchNotifications();
    // Setting up a real-time subscription is great but a bit verbose for this prompt.
    // For now, load on mount and every time it opens.
  }, [userId])

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) fetchNotifications();
        }}
        className="relative p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 border-2 border-white dark:border-gray-900 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/80">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-xs bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300 px-2 py-0.5 rounded-full font-medium">
                {unreadCount} New
              </span>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                You have no notifications yet.
              </div>
            ) : (
              notifications.map((n) => (
                <div 
                  key={n.id} 
                  className={`p-4 border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${!n.is_read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                  onClick={() => { if(!n.is_read) markAsRead(n.id) }}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className={`text-sm ${!n.is_read ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-200'}`}>
                      {n.title}
                    </h4>
                    {!n.is_read && <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 leading-relaxed">
                    {n.message}
                  </p>
                  
                  {n.action_url && n.action_label && (
                    <a 
                      href={n.action_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                          e.stopPropagation(); // don't trigger the parent onClick
                          if(!n.is_read) markAsRead(n.id);
                      }}
                      className="inline-flex items-center gap-1.5 mt-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-lg transition-colors border border-blue-200 dark:border-blue-800"
                    >
                      {n.type === 'booking_accepted' ? <CalendarPlus className="w-3.5 h-3.5" /> : null}
                      {n.action_label}
                    </a>
                  )}
                  
                  <div className="mt-2 text-[10px] text-gray-400 dark:text-gray-500">
                    {new Date(n.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
