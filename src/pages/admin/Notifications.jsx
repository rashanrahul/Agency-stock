
import { useCallback, useEffect, useState } from 'react'
import {
  Bell,
  RefreshCw,
  AlertTriangle,
  PackageX,
  CheckCheck,
  Phone,
  Store
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        shops (
          shop_name,
          owner_name,
          phone
        ),
        products (
          product_name,
          product_code,
          unit
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Notification error:', error.message)
    } else {
      setNotifications(data || [])
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    fetchNotifications()

    const channel = supabase
      .channel('admin-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications'
        },
        () => fetchNotifications()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchNotifications])

  const markAsRead = async (id) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)

    if (error) {
      alert(error.message)
    } else {
      await fetchNotifications()
    }
  }

  const markAllAsRead = async () => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('is_read', false)

    if (error) {
      alert(error.message)
    } else {
      await fetchNotifications()
    }
  }

  const unreadCount = notifications.filter(
    item => !item.is_read
  ).length

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Stock Notifications
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor low stock and out of stock alerts from all shops.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchNotifications}
            className="border rounded-xl px-4 py-3 hover:bg-white flex items-center gap-2"
          >
            <RefreshCw size={18} />
            Refresh
          </button>

          <button
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="bg-blue-600 text-white rounded-xl px-4 py-3 flex items-center gap-2 disabled:opacity-50"
          >
            <CheckCheck size={18} />
            Mark All Read
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        <div className="bg-white border rounded-2xl p-5">
          <p className="text-sm text-slate-500">Total Notifications</p>
          <h2 className="text-3xl font-bold mt-2">
            {notifications.length}
          </h2>
        </div>

        <div className="bg-white border rounded-2xl p-5">
          <p className="text-sm text-slate-500">Unread Notifications</p>
          <h2 className="text-3xl font-bold text-red-600 mt-2">
            {unreadCount}
          </h2>
        </div>

      </div>

      {loading ? (
        <div className="bg-white border rounded-2xl p-10 text-center text-slate-500">
          Loading notifications...
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white border rounded-2xl p-12 text-center">
          <Bell size={42} className="mx-auto text-slate-300 mb-3" />
          <p className="font-semibold text-slate-700">
            No notifications yet
          </p>
          <p className="text-sm text-slate-500 mt-1">
            Low stock and out of stock alerts will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">

          {notifications.map((item) => {
            const isOutOfStock =
              item.title?.toLowerCase().includes('out of stock')

            return (
              <div
                key={item.id}
                className={`bg-white border rounded-2xl p-5 ${
                  !item.is_read
                    ? 'border-l-4 border-l-orange-500'
                    : ''
                }`}
              >

                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">

                  <div className="flex gap-3">

                    <div className={`p-3 rounded-xl h-fit ${
                      isOutOfStock
                        ? 'bg-red-100 text-red-600'
                        : 'bg-orange-100 text-orange-600'
                    }`}>
                      {isOutOfStock
                        ? <PackageX size={23} />
                        : <AlertTriangle size={23} />
                      }
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900">
                        {item.title}
                      </h3>

                      <p className="text-sm text-slate-600 mt-1">
                        {item.message}
                      </p>

                      <div className="mt-4 space-y-2 text-sm">

                        <p className="flex items-center gap-2 text-slate-700">
                          <Store size={16} />
                          <strong>
                            {item.shops?.shop_name || 'Unknown Shop'}
                          </strong>
                        </p>

                        <p className="text-slate-600">
                          Owner: {item.shops?.owner_name || 'N/A'}
                        </p>

                        <p className="flex items-center gap-2 text-slate-600">
                          <Phone size={15} />
                          {item.shops?.phone ? (
                            <a
                              href={`tel:${item.shops.phone}`}
                              className="text-blue-600 hover:underline"
                            >
                              {item.shops.phone}
                            </a>
                          ) : 'No phone number'}
                        </p>

                        <p className="text-slate-600">
                          Product: {item.products?.product_name || 'Unknown'}
                        </p>

                        <p className="text-xs text-slate-400 mt-2">
                          {new Date(item.created_at).toLocaleString()}
                        </p>

                      </div>
                    </div>

                  </div>

                  <div className="flex flex-col items-start sm:items-end gap-3">

                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      isOutOfStock
                        ? 'bg-red-100 text-red-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {isOutOfStock ? 'Out of Stock' : 'Low Stock'}
                    </span>

                    {!item.is_read && (
                      <button
                        onClick={() => markAsRead(item.id)}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Mark as Read
                      </button>
                    )}

                    {item.is_read && (
                      <span className="text-xs text-green-600">
                        Read
                      </span>
                    )}

                  </div>

                </div>
              </div>
            )
          })}

        </div>
      )}

    </div>
  )
}

export default Notifications
