
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import {
  Package,
  RefreshCw,
  Save,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

function UpdateStock() {
  const { profile } = useAuth()

  const [products, setProducts] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const fetchProducts = useCallback(async () => {
    if (!profile?.shop_id) {
      setLoading(false)
      return
    }

    setLoading(true)

    const { data, error } = await supabase
      .from('shop_products')
      .select(`
        id,
        stock_quantity,
        low_stock_threshold,
        products(product_name, product_code, unit)
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
  }, [fetchProducts])

  const selectedProduct = products.find(
    item => item.id === selectedId
  )

  const handleProductChange = (id) => {
    setSelectedId(id)
    setMessage('')
    setError('')

    const product = products.find(item => item.id === id)

    if (product) {
      setQuantity(String(product.stock_quantity))
    } else {
      setQuantity('')
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()

    setMessage('')
    setError('')

    if (!selectedId) {
      setError('Please select a product.')
      return
    }

    const newQuantity = Number(quantity)

    if (quantity.trim() === '' || !Number.isFinite(newQuantity) || newQuantity < 0) {
      setError('Please enter a valid stock quantity.')
      return
    }

    if (!Number.isFinite(Number(selectedProduct?.stock_quantity))) {
      setError('Current stock quantity is invalid.')
      return
    }

    setSaving(true)

    const { error } = await supabase.rpc('update_my_stock', {
      p_shop_product_id: selectedId,
      p_new_quantity: newQuantity
    })

    if (error) {
      setError(error.message)
    } else {
      setMessage('Stock updated successfully!')
      await fetchProducts()
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <div className="p-10 text-center text-slate-500">
        Loading products...
      </div>
    )
  }

  if (!profile?.shop_id) {
    return (
      <div className="bg-white p-10 rounded-xl text-center">
        <Package size={35} className="mx-auto text-slate-400" />
        <h2 className="font-semibold mt-3">No Shop Assigned</h2>
        <p className="text-sm text-slate-500 mt-1">
          Contact your agency administrator.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          Update Stock
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Update product quantities in your shop
        </p>
      </div>

      <div className="bg-white border rounded-xl p-6">
        <div className="flex items-center gap-3 border-b pb-5 mb-6">
          <div className="bg-green-100 text-green-700 p-3 rounded-xl">
            <Package size={25} />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800">
              Stock Adjustment
            </h2>
            <p className="text-sm text-slate-500">
              Select a product and enter its new quantity
            </p>
          </div>
        </div>

        {message && (
          <div className="mb-5 bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg flex items-center gap-2">
            <CheckCircle size={18} />
            {message}
          </div>
        )}

        {error && (
          <div className="mb-5 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-center gap-2">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {products.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            No products assigned to your shop yet.
          </div>
        ) : (
          <form onSubmit={handleUpdate} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select Product
              </label>

              <select
                value={selectedId}
                onChange={(e) => handleProductChange(e.target.value)}
                required
                className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Choose a product</option>

                {products.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.products?.product_name} ({item.products?.product_code})
                  </option>
                ))}
              </select>
            </div>

            {selectedProduct && (
              <div className="bg-slate-50 border rounded-lg p-4 space-y-2">
                <p className="text-sm text-slate-500">Selected Product</p>
                <h3 className="font-semibold text-slate-800">
                  {selectedProduct.products?.product_name}
                </h3>
                <p className="text-sm text-slate-600">
                  Current Stock: {selectedProduct.stock_quantity} {selectedProduct.products?.unit || ''}
                </p>
                <p className="text-sm text-slate-600">
                  Low Stock Limit: {selectedProduct.low_stock_threshold}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                New Stock Quantity
              </label>

              <input
                type="number"
                min="0"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                placeholder="Enter new stock quantity"
                className="w-full border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={saving || !selectedId}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-5 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <Save size={18} />
                {saving ? 'Updating...' : 'Update Stock'}
              </button>

              <button
                type="button"
                onClick={fetchProducts}
                disabled={saving}
                className="flex items-center justify-center gap-2 border px-5 py-3 rounded-lg hover:bg-slate-50"
              >
                <RefreshCw size={18} />
                Refresh
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default UpdateStock
