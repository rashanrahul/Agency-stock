
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import {
  History,
  Search,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'

function StockHistory() {
  const [history, setHistory] = useState([])
  const [shops, setShops] = useState([])
  const [search, setSearch] = useState('')
  const [selectedShop, setSelectedShop] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchHistory = async () => {
    setLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('stock_history')
      .select(`
        *,
        shops(shop_name),
        products(product_name, product_code)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Stock history error:', error.message)
      setError(error.message)
      setHistory([])
    } else {
      setHistory(data || [])
    }

    setLoading(false)
  }

  const fetchShops = async () => {
    const { data, error } = await supabase
      .from('shops')
      .select('id, shop_name')
      .order('shop_name')

    if (error) {
      console.error('Shops error:', error.message)
      return
    }

    setShops(data || [])
  }

  useEffect(() => {
    fetchHistory()
    fetchShops()

    const channel = supabase
      .channel('admin-stock-history')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'stock_history'
        },
        () => fetchHistory()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const filteredHistory = history.filter((item) => {
    const searchText = search.toLowerCase()

    const matchesSearch =
      item.products?.product_name?.toLowerCase().includes(searchText) ||
      item.products?.product_code?.toLowerCase().includes(searchText) ||
      item.shops?.shop_name?.toLowerCase().includes(searchText)

    const matchesShop =
      selectedShop === 'all' || item.shop_id === selectedShop

    return matchesSearch && matchesShop
  })

  const formatDate = (date) => {
    return new Date(date).toLocaleString()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Stock History
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            View all stock changes across your shops
          </p>
        </div>

        <button
          onClick={fetchHistory}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">Total Stock Updates</p>
          <h2 className="text-3xl font-bold text-slate-800 mt-2">
            {history.length}
          </h2>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500">Filtered Records</p>
          <h2 className="text-3xl font-bold text-blue-600 mt-2">
            {filteredHistory.length}
          </h2>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search shop or product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-slate-200 rounded-lg pl-10 pr-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={selectedShop}
          onChange={(e) => setSelectedShop(e.target.value)}
          className="border border-slate-200 rounded-lg px-4 py-2 outline-none"
        >
          <option value="all">All Shops</option>
          {shops.map((shop) => (
            <option key={shop.id} value={shop.id}>
              {shop.shop_name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center gap-2">
          <History size={20} className="text-slate-600" />
          <h2 className="font-semibold text-slate-800">Stock Update Records</h2>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-500">
            Loading stock history...
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">
            {error}
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            No stock history records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="text-left p-4">Date & Time</th>
                  <th className="text-left p-4">Shop</th>
                  <th className="text-left p-4">Product</th>
                  <th className="text-left p-4">Old Stock</th>
                  <th className="text-left p-4">New Stock</th>
                  <th className="text-left p-4">Change</th>
                </tr>
              </thead>

              <tbody>
                {filteredHistory.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="p-4 whitespace-nowrap text-slate-600">
                      {formatDate(item.created_at)}
                    </td>

                    <td className="p-4 font-medium text-slate-800">
                      {item.shops?.shop_name || 'Unknown Shop'}
                    </td>

                    <td className="p-4">
                      <p className="font-medium text-slate-800">
                        {item.products?.product_name || 'Unknown Product'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {item.products?.product_code || ''}
                      </p>
                    </td>

                    <td className="p-4">{item.old_quantity}</td>
                    <td className="p-4">{item.new_quantity}</td>

                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 font-semibold ${
                        Number(item.change_amount) >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {Number(item.change_amount) >= 0
                          ? <ArrowUpRight size={16} />
                          : <ArrowDownRight size={16} />}
                        {Number(item.change_amount) > 0 ? '+' : ''}
                        {item.change_amount}
                      </span>
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
