
import { useEffect, useState } from 'react'
import {
  Package,
  Search,
  RefreshCw,
  Store,
  AlertTriangle,
  PackageX,
  Pencil,
  X,
  Save
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

function ShopProducts() {
  const [items, setItems] = useState([])
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedShop, setSelectedShop] = useState('all')
  const [error, setError] = useState('')
  const [editingItem, setEditingItem] = useState(null)
const [newQuantity, setNewQuantity] = useState('')
const [saving, setSaving] = useState(false)
const [editError, setEditError] = useState('')

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
          product_id,
          stock_quantity,
          low_stock_threshold,
          updated_at,
          shops (
            shop_name
          ),
          products (
            product_name,
            product_code,
            unit,
            is_active
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
      setItems(stockResult.data || [])
    }

    setLoading(false)
  }

  const handleEditStock = (item) => {
  setEditingItem(item)
  setNewQuantity(String(item.stock_quantity))
  setEditError('')
}

const handleSaveStock = async (e) => {
  e.preventDefault()

  const quantity = Number(newQuantity)

  if (newQuantity.trim() === '' || !Number.isFinite(quantity) || quantity < 0) {
    setEditError('Please enter a valid stock quantity.')
    return
  }

  setSaving(true)
  setEditError('')

  const { data: result, error } = await supabase.rpc(
    'admin_update_shop_stock',
    {
      p_shop_product_id: editingItem.id,
      p_new_quantity: quantity
    }
  )

  if (error) {
    setEditError(error.message)
    setSaving(false)
    return
  }

  setEditingItem(null)
  setNewQuantity('')
  setSaving(false)

  await fetchData()
}

  useEffect(() => {
    fetchData()

    const channel = supabase
      .channel('admin-shop-products-overview')
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

  const getStatus = (item) => {
    if (Number(item.stock_quantity) <= 0) {
      return {
        label: 'Out of Stock',
        style: 'bg-red-100 text-red-700'
      }
    }

    if (
      Number(item.stock_quantity) <=
      Number(item.low_stock_threshold)
    ) {
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

  const filteredItems = items.filter((item) => {
    const product = item.products
    const shop = item.shops

    if (!product || !shop) return false

    const matchesShop =
      selectedShop === 'all' ||
      item.shop_id === selectedShop

    const matchesSearch =
      `${product.product_name} ${product.product_code} ${shop.shop_name}`
        .toLowerCase()
        .includes(search.toLowerCase())

    return matchesShop && matchesSearch
  })

  const lowStockCount = items.filter(
    item =>
      Number(item.stock_quantity) > 0 &&
      Number(item.stock_quantity) <=
      Number(item.low_stock_threshold)
  ).length

  const outOfStockCount = items.filter(
    item => Number(item.stock_quantity) <= 0
  ).length

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Shop Products Overview
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            View product stock across all shops.
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        <div className="bg-white border rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <Package className="text-blue-600" size={24} />
            <div>
              <p className="text-sm text-slate-500">Assigned Products</p>
              <h2 className="text-2xl font-bold">{items.length}</h2>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-amber-600" size={24} />
            <div>
              <p className="text-sm text-slate-500">Low Stock</p>
              <h2 className="text-2xl font-bold">{lowStockCount}</h2>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <PackageX className="text-red-600" size={24} />
            <div>
              <p className="text-sm text-slate-500">Out of Stock</p>
              <h2 className="text-2xl font-bold">{outOfStockCount}</h2>
            </div>
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
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search shop or product..."
              className="w-full border rounded-lg pl-10 pr-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={selectedShop}
            onChange={(e) => setSelectedShop(e.target.value)}
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
            Loading shop products...
          </p>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <Store size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="font-medium text-slate-600">
              No assigned products found.
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
                  <th className="py-3 px-3">Stock</th>
                  <th className="py-3 px-3">Threshold</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredItems.map(item => {
                  const status = getStatus(item)

                  return (
                    <tr key={item.id} className="border-b hover:bg-slate-50">
                      <td className="py-4 px-3 font-semibold">
                        {item.shops?.shop_name}
                      </td>

                      <td className="py-4 px-3">
                        {item.products?.product_name}
                      </td>

                      <td className="py-4 px-3">
                        {item.products?.product_code}
                      </td>

                      <td className="py-4 px-3 font-bold">
                        {Number(item.stock_quantity)} {item.products?.unit}
                      </td>

                      <td className="py-4 px-3">
                        {Number(item.low_stock_threshold)}
                      </td>

                      <td className="py-4 px-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.style}`}>
                          {status.label}
                        </span>
                      </td>

                      <td className="py-4 px-3">
  <button
    onClick={() => handleEditStock(item)}
    className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
  >
    <Pencil size={15} />
    Edit Stock
  </button>
</td>


                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>


{editingItem && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">

      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Edit Stock Quantity
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {editingItem.products?.product_name}
          </p>
          <p className="text-xs text-slate-400">
            {editingItem.shops?.shop_name}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingItem(null)
            setEditError('')
          }}
          className="rounded-lg p-2 hover:bg-slate-100"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSaveStock} className="space-y-4">

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            New Stock Quantity
          </label>

          <input
            type="number"
            min="0"
            step="any"
            value={newQuantity}
            onChange={(e) => setNewQuantity(e.target.value)}
            className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-500"
            required
          />

          <p className="mt-2 text-xs text-slate-500">
            Current Stock: {editingItem.stock_quantity} {editingItem.products?.unit}
          </p>
        </div>

        {editError && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {editError}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              setEditingItem(null)
              setEditError('')
            }}
            className="rounded-lg border px-4 py-2.5 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Save size={17} />
            {saving ? 'Saving...' : 'Update Stock'}
          </button>
        </div>

      </form>
    </div>
  </div>
)}




    </div>
  )
}

export default ShopProducts
