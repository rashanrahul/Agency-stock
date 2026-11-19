
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

import {
  Store,
  Package,
  AlertTriangle,
  PackageX,
  RefreshCw,
  TrendingUp,
  Clock,
  Activity
} from 'lucide-react'

function AdminDashboard() {
  const [stats, setStats] = useState({
    shops: 0,
    products: 0,
    lowStock: 0,
    outOfStock: 0
  })

  const [recentUpdates, setRecentUpdates] = useState([])
  const [shopStocks, setShopStocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchDashboard = useCallback(async () => {
    setError('')

    try {
      const [
        shopsResult,
        productsResult,
        stockResult,
        historyResult
      ] = await Promise.all([
        supabase.from('shops').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase
          .from('shop_products')
          .select(`
            id,
            shop_id,
            product_id,
            stock_quantity,
            low_stock_threshold,
            shops(shop_name),
            products(product_name, product_code)
          `),
        supabase
          .from('stock_history')
          .select(`
            id,
            old_quantity,
            new_quantity,
            change_amount,
            created_at,
            shops(shop_name),
            products(product_name)
          `)
          .order('created_at', { ascending: false })
          .limit(8)
      ])

      if (shopsResult.error) throw shopsResult.error
      if (productsResult.error) throw productsResult.error
      if (stockResult.error) throw stockResult.error
      if (historyResult.error) throw historyResult.error

      const stocks = stockResult.data || []

      const low = stocks.filter(
        item =>
          Number(item.stock_quantity) > 0 &&
          Number(item.stock_quantity) <= Number(item.low_stock_threshold)
      )

      const out = stocks.filter(
        item => Number(item.stock_quantity) <= 0
      )

      setStats({
        shops: shopsResult.count || 0,
        products: productsResult.count || 0,
        lowStock: low.length,
        outOfStock: out.length
      })

      setShopStocks(stocks)
      setRecentUpdates(historyResult.data || [])

    } catch (err) {
      console.error('Dashboard error:', err)
      setError(err.message || 'Unable to load dashboard data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboard()

    const channel = supabase
      .channel('agency-dashboard-live')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shops'
        },
        fetchDashboard
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products'
        },
        fetchDashboard
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shop_products'
        },
        fetchDashboard
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'stock_history'
        },
        fetchDashboard
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchDashboard])

  const cards = [
    {
      title: 'Total Shops',
      value: stats.shops,
      icon: Store,
      color: 'blue',
      description: 'Registered shops'
    },
    {
      title: 'Total Products',
      value: stats.products,
      icon: Package,
      color: 'violet',
      description: 'Agency products'
    },
    {
      title: 'Low Stock',
      value: stats.lowStock,
      icon: AlertTriangle,
      color: 'amber',
      description: 'Need restocking'
    },
    {
      title: 'Out of Stock',
      value: stats.outOfStock,
      icon: PackageX,
      color: 'red',
      description: 'Currently unavailable'
    }
  ]

  const colors = {
    blue: 'bg-blue-100 text-blue-700',
    violet: 'bg-violet-100 text-violet-700',
    amber: 'bg-amber-100 text-amber-700',
    red: 'bg-red-100 text-red-700'
  }

  const getStatus = (item) => {
    const quantity = Number(item.stock_quantity)

    if (quantity <= 0) {
      return {
        label: 'Out of Stock',
        style: 'bg-red-100 text-red-700'
      }
    }

    if (quantity <= Number(item.low_stock_threshold)) {
      return {
        label: 'Low Stock',
        style: 'bg-amber-100 text-amber-700'
      }
    }

    return {
      label: 'In Stock',
      style: 'bg-green-100 text-green-700'
    }
  }

  return (
    <div className="space-y-7">

      {/* Page Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Dashboard
          </h1>
          <p className="text-slate-500 mt-1">
            Overview of your agency stock management system.
          </p>
        </div>

        <button
          onClick={fetchDashboard}
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-5 py-3 rounded-xl disabled:opacity-50"
        >
          <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">
          {error}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

        {cards.map((card) => {
          const Icon = card.icon

          return (
            <div
              key={card.title}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-xl ${colors[card.color]}`}>
                  <Icon size={24} />
                </div>

                <TrendingUp size={19} className="text-slate-300" />
              </div>

              <p className="text-slate-500 text-sm mt-5">
                {card.title}
              </p>

              <h2 className="text-3xl font-bold text-slate-900 mt-1">
                {loading ? '...' : card.value}
              </h2>

              <p className="text-xs text-slate-400 mt-2">
                {card.description}
              </p>
            </div>
          )
        })}

      </div>

      {/* Stock Overview */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

        <div className="p-5 border-b flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg text-slate-900">
              Shop Stock Overview
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Stock details across all shops
            </p>
          </div>

          <Activity className="text-blue-600" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-5 py-4">Product</th>
                <th className="px-5 py-4">Shop</th>
                <th className="px-5 py-4">Stock</th>
                <th className="px-5 py-4">Minimum</th>
                <th className="px-5 py-4">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {shopStocks.slice(0, 10).map((item) => {
                const status = getStatus(item)

                return (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-medium text-slate-800">
                      {item.products?.product_name || 'Unknown Product'}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {item.shops?.shop_name || 'Unknown Shop'}
                    </td>

                    <td className="px-5 py-4 font-semibold">
                      {item.stock_quantity}
                    </td>

                    <td className="px-5 py-4 text-slate-500">
                      {item.low_stock_threshold}
                    </td>

                    <td className="px-5 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status.style}`}>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                )
              })}

              {!loading && shopStocks.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-10 text-slate-400">
                    No shop stock records found.
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan="5" className="text-center py-10 text-slate-400">
                    Loading stock data...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Stock Updates */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">

        <div className="p-5 border-b">
          <div className="flex items-center gap-2">
            <Clock className="text-blue-600" />
            <h2 className="font-bold text-lg text-slate-900">
              Recent Stock Updates
            </h2>
          </div>

          <p className="text-sm text-slate-500 mt-1">
            Latest stock changes from your shops
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {recentUpdates.map((item) => (
            <div
              key={item.id}
              className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <p className="font-semibold text-slate-800">
                  {item.products?.product_name || 'Product'}
                </p>

                <p className="text-sm text-slate-500 mt-1">
                  {item.shops?.shop_name || 'Shop'}
                </p>

                <p className="text-xs text-slate-400 mt-1">
                  {new Date(item.created_at).toLocaleString()}
                </p>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <span className="text-slate-500">
                  {item.old_quantity}
                </span>

                <span className="text-slate-400">→</span>

                <span className="font-bold text-blue-700">
                  {item.new_quantity}
                </span>

                <span className={`text-xs font-semibold ${
                  Number(item.change_amount) < 0
                    ? 'text-red-600'
                    : 'text-green-600'
                }`}>
                  {Number(item.change_amount) > 0 ? '+' : ''}
                  {item.change_amount}
                </span>
              </div>
            </div>
          ))}

          {!loading && recentUpdates.length === 0 && (
            <p className="text-center text-slate-400 py-10">
              No stock updates yet.
            </p>
          )}
        </div>
      </div>

    </div>
  )
}

export default AdminDashboard
