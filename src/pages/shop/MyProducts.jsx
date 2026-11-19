
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import {
  Package,
  Search,
  RefreshCw,
  AlertTriangle,
  PackageX,
  CheckCircle
} from 'lucide-react'

function MyProducts() {
  const { profile } = useAuth()

  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchProducts = useCallback(async () => {
    if (!profile?.shop_id) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('shop_products')
      .select(`
        *,
        products(product_name, product_code, unit, description)
      `)
      .eq('shop_id', profile.shop_id)
      .order('updated_at', { ascending: false })

    if (error) {
      setError(error.message)
      setProducts([])
    } else {
      setProducts(data || [])
    }

    setLoading(false)
  }, [profile?.shop_id])

  useEffect(() => {
    fetchProducts()

    if (!profile?.shop_id) return

    const channel = supabase
      .channel(`my-products-${profile.shop_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shop_products',
          filter: `shop_id=eq.${profile.shop_id}`
        },
        () => fetchProducts()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile?.shop_id, fetchProducts])

  const filteredProducts = products.filter((item) => {
    const name = item.products?.product_name?.toLowerCase() || ''
    const code = item.products?.product_code?.toLowerCase() || ''

    return (
      name.includes(search.toLowerCase()) ||
      code.includes(search.toLowerCase())
    )
  })

  const getStatus = (item) => {
    const quantity = Number(item.stock_quantity)
    const threshold = Number(item.low_stock_threshold)

    if (quantity <= 0) {
      return {
        label: 'Out of Stock',
        className: 'bg-red-100 text-red-700',
        icon: PackageX
      }
    }

    if (quantity <= threshold) {
      return {
        label: 'Low Stock',
        className: 'bg-amber-100 text-amber-700',
        icon: AlertTriangle
      }
    }

    return {
      label: 'Available',
      className: 'bg-green-100 text-green-700',
      icon: CheckCircle
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            My Products
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            View products assigned to your shop
          </p>
        </div>

        <button
          onClick={fetchProducts}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800"
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border rounded-xl p-5">
          <p className="text-sm text-slate-500">Total Assigned Products</p>
          <h2 className="text-3xl font-bold mt-2">{products.length}</h2>
        </div>

        <div className="bg-white border rounded-xl p-5">
          <p className="text-sm text-slate-500">Matching Products</p>
          <h2 className="text-3xl font-bold text-blue-600 mt-2">
            {filteredProducts.length}
          </h2>
        </div>
      </div>

      <div className="bg-white border rounded-xl p-4">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product name or code..."
            className="w-full border rounded-lg pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white p-10 rounded-xl text-center text-slate-500">
          Loading products...
        </div>
      ) : !profile?.shop_id ? (
        <div className="bg-white p-10 rounded-xl text-center">
          <Package size={35} className="mx-auto text-slate-400" />
          <p className="font-semibold mt-3">No Shop Assigned</p>
          <p className="text-sm text-slate-500 mt-1">
            Contact your agency administrator.
          </p>
        </div>
      ) : (
        <div className="bg-white border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="text-left p-4">Product</th>
                  <th className="text-left p-4">Product Code</th>
                  <th className="text-left p-4">Unit</th>
                  <th className="text-left p-4">Current Stock</th>
                  <th className="text-left p-4">Low Stock Limit</th>
                  <th className="text-left p-4">Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map((item) => {
                  const status = getStatus(item)
                  const StatusIcon = status.icon

                  return (
                    <tr key={item.id} className="border-t hover:bg-slate-50">
                      <td className="p-4 font-medium text-slate-800">
                        {item.products?.product_name || 'Unknown Product'}
                      </td>

                      <td className="p-4 text-slate-500">
                        {item.products?.product_code || '-'}
                      </td>

                      <td className="p-4">
                        {item.products?.unit || '-'}
                      </td>

                      <td className="p-4 font-semibold">
                        {item.stock_quantity}
                      </td>

                      <td className="p-4">
                        {item.low_stock_threshold}
                      </td>

                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${status.className}`}>
                          <StatusIcon size={14} />
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}

                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-10 text-center text-slate-500">
                      No products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyProducts
