
import { useCallback, useEffect, useState } from 'react'
import {
  Bell,
  RefreshCw,
  CheckCheck,
  AlertTriangle,
  Info
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

function Notifications() {
  const { profile } = useAuth()

  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    if (!profile?.shop_id) {
      setNotifications([])
      setLoading(false)
      return
    }

    setLoading(true)

    const { data, error } = await supabase
      .from('notifications')
      .select('*, products(product_name, product_code)')
      .eq('shop_id', profile.shop_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Notifications error:', error.message)
      setNotifications([])
    } else {
      setNotifications(data || [])
    }

    setLoading(false)
  }, [profile?.shop_id])

  useEffect(() => {
    fetchNotifications()

    if (!profile?.shop_id) return

    const channel = supabase
      .channel(`shop-notifications-${profile.shop_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `shop_id=eq.${profile.shop_id}`
        },
        () => fetchNotifications()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchNotifications, profile?.shop_id])

  const markAsRead = async (id) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('shop_id', profile.shop_id)

    if (error) {
      alert(error.message)
      return
    }

    fetchNotifications()
  }

  const markAllAsRead = async () => {
    const unreadIds = notifications
      .filter((item) => !item.is_read)
      .map((item) => item.id)

    if (!unreadIds.length) return

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', unreadIds)
      .eq('shop_id', profile.shop_id)

    if (error) {
      alert(error.message)
      return
    }

    fetchNotifications()
  }

  const unreadCount = notifications.filter(
    (item) => !item.is_read
  ).length

  const getIcon = (type) => {
    if (type === 'warning' || type === 'low_stock') {
      return <AlertTriangle className="text-amber-500" size={22} />
    }

    return <Info className="text-blue-500" size={22} />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Updates and alerts from your agency
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchNotifications}
            className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm hover:bg-slate-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <button
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            <CheckCheck size={16} />
            Mark All Read
          </button>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-5">
        <p className="text-sm text-slate-500">Unread Notifications</p>
        <p className="mt-1 text-3xl font-bold text-slate-800">
          {unreadCount}
        </p>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="rounded-xl border bg-white p-8 text-center text-slate-500">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-xl border bg-white p-12 text-center">
            <Bell className="mx-auto mb-3 text-slate-300" size={42} />
            <p className="font-semibold text-slate-700">
              No notifications yet
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Your agency updates will appear here.
            </p>
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              className={`flex flex-col gap-4 rounded-xl border bg-white p-5 sm:flex-row sm:items-start ${
                !item.is_read ? 'border-l-4 border-l-green-500' : ''
              }`}
            >
              <div className="rounded-lg bg-slate-50 p-3">
                {getIcon(item.notification_type)}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-slate-800">
                    {item.title}
                  </h3>

                  {!item.is_read && (
                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                      New
                    </span>
                  )}
                </div>

                <p className="mt-1 text-sm text-slate-600">
                  {item.message}
                </p>

                {item.products?.product_name && (
                  <p className="mt-2 text-xs text-slate-500">
                    Product: {item.products.product_name}
                    {item.products.product_code
                      ? ` (${item.products.product_code})`
                      : ''}
                  </p>
                )}

                <p className="mt-2 text-xs text-slate-400">
                  {new Date(item.created_at).toLocaleString()}
                </p>
              </div>

              {!item.is_read && (
                <button
                  onClick={() => markAsRead(item.id)}
                  className="self-start rounded-lg border px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  Mark as Read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Notifications
