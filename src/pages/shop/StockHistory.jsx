
import { useCallback, useEffect, useState } from 'react'
import { History, RefreshCw, Search } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

function StockHistory() {
  const { profile } = useAuth()

  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchHistory = useCallback(async () => {
    if (!profile?.shop_id) {
      setHistory([])
      setLoading(false)
      return
    }

    setLoading(true)

    const { data, error } = await supabase
      .from('stock_history')
      .select(`
        *,
        products (
          product_name,
          product_code,
          unit
        )
      `)
      .eq('shop_id', profile.shop_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Stock history error:', error.message)
      setHistory([])
    } else {
      setHistory(data || [])
    }

    setLoading(false)
  }, [profile?.shop_id])

  useEffect(() => {
    fetchHistory()

    if (!profile?.shop_id) return

    const channel = supabase
      .channel(`shop-stock-history-${profile.shop_id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'stock_history',
          filter: `shop_id=eq.${profile.shop_id}`
        },
        () => fetchHistory()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchHistory, profile?.shop_id])

  const filteredHistory = history.filter((item) =>
    item.products?.product_name
      ?.toLowerCase()
      .includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Stock History
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            View your previous stock updates
          </p>
        </div>

        <button
          onClick={fetchHistory}
          className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <div className="relative max-w-md">
          <Search
            size={18}
            className="absolute left-3 top-3 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product..."
            className="w-full rounded-lg border py-2.5 pl-10 pr-4 outline-none focus:border-green-500"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white">
        {loading ? (
          <p className="p-8 text-center text-slate-500">
            Loading stock history...
          </p>
        ) : filteredHistory.length === 0 ? (
          <div className="p-12 text-center">
            <History className="mx-auto mb-3 text-slate-300" size={40} />
            <p className="font-medium text-slate-700">
              No stock history found
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Your stock updates will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="p-4">Product</th>
                  <th className="p-4">Previous Stock</th>
                  <th className="p-4">New Stock</th>
                  <th className="p-4">Change</th>
                  <th className="p-4">Date & Time</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {filteredHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="p-4">
                      <p className="font-semibold text-slate-800">
                        {item.products?.product_name || 'Unknown Product'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {item.products?.product_code || '-'}
                      </p>
                    </td>

                    <td className="p-4">
                      {Number(item.old_quantity).toLocaleString()}
                    </td>

                    <td className="p-4 font-semibold">
                      {Number(item.new_quantity).toLocaleString()}
                    </td>

                    <td className="p-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        Number(item.change_amount) >= 0
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {Number(item.change_amount) > 0 ? '+' : ''}
                        {Number(item.change_amount).toLocaleString()}
                      </span>
                    </td>

                    <td className="p-4 text-slate-500">
                      {new Date(item.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default StockHistory
