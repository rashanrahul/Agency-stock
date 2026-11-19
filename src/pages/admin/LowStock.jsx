
import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  Search,
  RefreshCw,
  Store,
  Package
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

function LowStock() {
  const [items, setItems] = useState([])
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedShop, setSelectedShop] = useState('all')
  const [error, setError] = useState('')

  const fetchData = async () => {
    setLoading(true)
    setError('')

    const [shopResult, stockResult] = await Promise.all([
      supabase
        .from('shops')
        .select('id, shop_name')
        .order('shop_name'),

      supabase
        .from('shop_products')
        .select(`
          id,
          shop_id,
          stock_quantity,
          low_stock_threshold,
          updated_at,
          shops (
            shop_name
          ),
          products (
            product_name,
            product_code,
            unit
          )
        `)
        .order('updated_at', { ascending: false })
    ])

    if (shopResult.error) {
      setError(shopResult.error.message)
    } else {
      setShops(shopResult.data || [])
    }

    if (stockResult.error) {
      setError(stockResult.error.message)
    } else {
      const lowStockItems = (stockResult.data || []).filter(item => {
        const quantity = Number(item.stock_quantity)
        const threshold = Number(item.low_stock_threshold)

        return quantity > 0 && quantity <= threshold
      })

      setItems(lowStockItems)
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchData()

    const channel = supabase
      .channel('admin-low-stock-live')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shop_products'
        },
        () => fetchData()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const filteredItems = items.filter(item => {
    const product = item.products
    const shop = item.shops

    if (!product || !shop) return false

    const matchesShop =
      selectedShop === 'all' || item.shop_id === selectedShop

    const matchesSearch =
      `${product.product_name} ${product.product_code} ${shop.shop_name}`
        .toLowerCase()
        .includes(search.toLowerCase())

    return matchesShop && matchesSearch
  })

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Low Stock Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor products that need restocking.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="flex items-center justify-center gap-2 border bg-white px-4 py-3 rounded-xl hover:bg-slate-50"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <AlertTriangle className="text-amber-600" size={28} />

          <div>
            <p className="text-sm text-amber-700">
              Total Low Stock Products
            </p>
            <h2 className="text-3xl font-bold text-amber-800">
              {items.length}
            </h2>
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-2xl p-5">

        <div className="flex flex-col md:flex-row gap-3 justify-between mb-5">

          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search shop or product..."
              className="w-full border rounded-lg pl-10 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <select
            value={selectedShop}
            onChange={e => setSelectedShop(e.target.value)}
            className="border rounded-lg px-3 py-2.5 min-w-52"
          >
            <option value="all">All Shops</option>

            {shops.map(shop => (
              <option key={shop.id} value={shop.id}>
                {shop.shop_name}
              </option>
            ))}
          </select>

        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-center py-10 text-slate-500">
            Loading low stock products...
          </p>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <Package
              size={40}
              className="mx-auto text-slate-300 mb-3"
            />
            <p className="font-medium text-slate-600">
              No low stock products found.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b text-slate-500">
                  <th className="py-3 px-3">Shop Name</th>
                  <th className="py-3 px-3">Product</th>
                  <th className="py-3 px-3">Product Code</th>
                  <th className="py-3 px-3">Current Stock</th>
                  <th className="py-3 px-3">Threshold</th>
                  <th className="py-3 px-3">Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredItems.map(item => (
                  <tr
                    key={item.id}
                    className="border-b hover:bg-amber-50"
                  >
                    <td className="py-4 px-3 font-semibold">
                      {item.shops?.shop_name}
                    </td>

                    <td className="py-4 px-3">
                      {item.products?.product_name}
                    </td>

                    <td className="py-4 px-3">
                      {item.products?.product_code}
                    </td>

                    <td className="py-4 px-3 font-bold text-amber-700">
                      {Number(item.stock_quantity)} {item.products?.unit}
                    </td>

                    <td className="py-4 px-3">
                      {Number(item.low_stock_threshold)}
                    </td>

                    <td className="py-4 px-3">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                        Low Stock
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

export default LowStock
