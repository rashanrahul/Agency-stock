
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import {
  Package,
  PackageCheck,
  AlertTriangle,
  PackageX,
  RefreshCw,
  LogOut,
  Store
} from 'lucide-react'

function ShopDashboard() {
  const { profile, logout } = useAuth()

  const [shop, setShop] = useState(null)
  const [products, setProducts] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchDashboard = useCallback(async () => {
    if (!profile?.shop_id) {
      setLoading(false)
      return
    }

    setError('')

    const [shopResult, productResult, historyResult] = await Promise.all([
      supabase
        .from('shops')
        .select('*')
        .eq('id', profile.shop_id)
        .maybeSingle(),

      supabase
        .from('shop_products')
        .select(`
          *,
          products(product_name, product_code, unit)
        `)
        .eq('shop_id', profile.shop_id),

      supabase
        .from('stock_history')
        .select(`
          *,
          products(product_name, unit)
        `)
        .eq('shop_id', profile.shop_id)
        .order('created_at', { ascending: false })
        .limit(5)
    ])

    if (shopResult.error) {
      setError(shopResult.error.message)
    } else {
      setShop(shopResult.data)
    }

    if (productResult.error) {
      setError(productResult.error.message)
    } else {
      setProducts(productResult.data || [])
    }

    if (historyResult.error) {
      setError(historyResult.error.message)
    } else {
      setHistory(historyResult.data || [])
    }

    setLoading(false)
  }, [profile?.shop_id])

  useEffect(() => {
    fetchDashboard()

    if (!profile?.shop_id) return

    const channel = supabase
      .channel(`shop-dashboard-${profile.shop_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shop_products',
          filter: `shop_id=eq.${profile.shop_id}`
        },
        () => fetchDashboard()
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'stock_history',
          filter: `shop_id=eq.${profile.shop_id}`
        },
        () => fetchDashboard()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile?.shop_id, fetchDashboard])

  const totalProducts = products.length

  const availableStock = products.reduce(
    (total, item) => total + Number(item.stock_quantity || 0),
    0
  )

  const lowStock = products.filter(
    item =>
      Number(item.stock_quantity) > 0 &&
      Number(item.stock_quantity) <= Number(item.low_stock_threshold)
  ).length

  const outOfStock = products.filter(
    item => Number(item.stock_quantity) <= 0
  ).length

  const stats = [
    {
      title: 'Total Products',
      value: totalProducts,
      icon: Package,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      title: 'Available Stock',
      value: availableStock,
      icon: PackageCheck,
      color: 'bg-green-100 text-green-600'
    },
    {
      title: 'Low Stock',
      value: lowStock,
      icon: AlertTriangle,
      color: 'bg-amber-100 text-amber-600'
    },
    {
      title: 'Out of Stock',
      value: outOfStock,
      icon: PackageX,
      color: 'bg-red-100 text-red-600'
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading dashboard...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">
            Shop Owner Dashboard
          </h1>
          <p className="text-sm text-slate-500">
            Welcome, {profile?.full_name || 'Shop Owner'}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchDashboard}
            className="p-2 border rounded-lg hover:bg-slate-50"
            title="Refresh"
          >
            <RefreshCw size={19} />
          </button>

          <button
            onClick={logout}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </header>

      <main className="p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
            {error}
          </div>
        )}

        {!profile?.shop_id ? (
          <div className="bg-white p-6 rounded-xl border text-center">
            <Store size={35} className="mx-auto text-slate-400" />
            <h2 className="font-semibold mt-3">No Shop Assigned</h2>
            <p className="text-sm text-slate-500 mt-1">
              Please contact your agency administrator.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white p-5 rounded-xl border flex items-center gap-4">
              <div className="bg-green-100 text-green-700 p-3 rounded-xl">
                <Store size={28} />
              </div>
              <div>
                <p className="text-sm text-slate-500">My Shop</p>
                <h2 className="text-xl font-bold text-slate-800">
                  {shop?.shop_name || 'Loading shop details...'}
                </h2>
                <p className="text-sm text-slate-500">
                  {shop?.address || ''}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
              {stats.map((stat) => {
                const Icon = stat.icon

                return (
                  <div
                    key={stat.title}
                    className="bg-white p-5 rounded-xl border shadow-sm"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-slate-500">
                          {stat.title}
                        </p>
                        <h2 className="text-3xl font-bold mt-2 text-slate-800">
                          {stat.value}
                        </h2>
                      </div>

                      <div className={`p-3 rounded-xl ${stat.color}`}>
                        <Icon size={25} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="p-5 border-b">
                <h2 className="font-bold text-slate-800">
                  My Products
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="text-left p-4">Product</th>
                      <th className="text-left p-4">Code</th>
                      <th className="text-left p-4">Stock</th>
                      <th className="text-left p-4">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {products.map((item) => {
                      const quantity = Number(item.stock_quantity)
                      const threshold = Number(item.low_stock_threshold)

                      const status =
                        quantity <= 0
                          ? 'Out of Stock'
                          : quantity <= threshold
                            ? 'Low Stock'
                            : 'Available'

                      return (
                        <tr key={item.id} className="border-t">
                          <td className="p-4 font-medium">
                            {item.products?.product_name || 'Unknown'}
                          </td>
                          <td className="p-4 text-slate-500">
                            {item.products?.product_code || '-'}
                          </td>
                          <td className="p-4">
                            {quantity} {item.products?.unit || ''}
                          </td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              status === 'Available'
                                ? 'bg-green-100 text-green-700'
                                : status === 'Low Stock'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-red-100 text-red-700'
                            }`}>
                              {status}
                            </span>
                          </td>
                        </tr>
                      )
                    })}

                    {products.length === 0 && (
                      <tr>
                        <td colSpan="4" className="p-8 text-center text-slate-500">
                          No products assigned to your shop yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="p-5 border-b">
                <h2 className="font-bold text-slate-800">
                  Recent Stock Updates
                </h2>
              </div>

              {history.length === 0 ? (
                <p className="p-8 text-center text-slate-500">
                  No stock updates yet.
                </p>
              ) : (
                <div className="divide-y">
                  {history.map((item) => (
                    <div key={item.id} className="p-4 flex justify-between gap-4">
                      <div>
                        <p className="font-medium text-slate-800">
                          {item.products?.product_name || 'Unknown Product'}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(item.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="font-semibold">
                          {item.old_quantity} → {item.new_quantity}
                        </p>
                        <p className="text-slate-500">
                          Change: {item.change_amount}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default ShopDashboard
