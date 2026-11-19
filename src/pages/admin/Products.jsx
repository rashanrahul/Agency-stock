
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import {
  Package,
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Power,
  X,
  Store
} from 'lucide-react'

function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [shops, setShops] = useState([])
const [assigningProduct, setAssigningProduct] = useState(null)
const [selectedShopIds, setSelectedShopIds] = useState([])
const [assignLoading, setAssignLoading] = useState(false)
const [assignError, setAssignError] = useState('')

  const emptyForm = {
    product_name: '',
    product_code: '',
    description: '',
    unit: ''
  }

  const [form, setForm] = useState(emptyForm)

  const fetchProducts = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setProducts(data || [])
    }

    setLoading(false)
  }

  const fetchShops = async () => {
  const { data, error } = await supabase
    .from('shops')
    .select('id, shop_name')
    .eq('is_active', true)
    .order('shop_name')

  if (error) {
    setAssignError(error.message)
    return
  }

  setShops(data || [])
}

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    })
  }

  const handleEdit = (product) => {
    setEditingProduct(product)

    setForm({
      product_name: product.product_name || '',
      product_code: product.product_code || '',
      description: product.description || '',
      unit: product.unit || ''
    })

    setError('')
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (
      !form.product_name.trim() ||
      !form.product_code.trim() ||
      !form.unit.trim()
    ) {
      setError('Product name, code and unit are required.')
      return
    }

    setSaving(true)

    const productData = {
      product_name: form.product_name.trim(),
      product_code: form.product_code.trim(),
      description: form.description.trim(),
      unit: form.unit.trim()
    }

    let result

    if (editingProduct) {
      result = await supabase
        .from('products')
        .update(productData)
        .eq('id', editingProduct.id)
    } else {
      result = await supabase
        .from('products')
        .insert([productData])
    }

    if (result.error) {
      setError(result.error.message)
    } else {
      setForm(emptyForm)
      setEditingProduct(null)
      setShowForm(false)
      await fetchProducts()
    }

    setSaving(false)
  }

  const toggleProductStatus = async (product) => {
    const { error } = await supabase
      .from('products')
      .update({ is_active: !product.is_active })
      .eq('id', product.id)

    if (error) {
      alert(error.message)
    } else {
      await fetchProducts()
    }
  }

  const handleAssignProduct = async () => {
  setAssignError('')

  if (!assigningProduct) return

  if (selectedShopIds.length === 0) {
    setAssignError('Please select at least one shop.')
    return
  }

  setAssignLoading(true)

  const assignments = selectedShopIds.map((shopId) => ({
    shop_id: shopId,
    product_id: assigningProduct.id,
    stock_quantity: 0,
    low_stock_threshold: 10
  }))

  const { error } = await supabase
    .from('shop_products')
    .upsert(assignments, {
      onConflict: 'shop_id,product_id',
      ignoreDuplicates: true
    })

  if (error) {
    setAssignError(error.message)
  } else {
    alert('Product assigned successfully!')

    setAssigningProduct(null)
    setSelectedShopIds([])
  }

  setAssignLoading(false)
}

  const filteredProducts = products.filter((product) =>
    `${product.product_name} ${product.product_code}`
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Product Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage all products in your agency.
          </p>
        </div>

        <button
          onClick={() => {
            setForm(emptyForm)
            setEditingProduct(null)
            setError('')
            setShowForm(true)
          }}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-medium"
        >
          <Plus size={18} />
          Add New Product
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        <div className="bg-white border rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 text-blue-600 p-3 rounded-xl">
              <Package size={22} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Products</p>
              <h2 className="text-2xl font-bold">
                {products.length}
              </h2>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-5">
          <p className="text-sm text-slate-500">Active Products</p>
          <h2 className="text-2xl font-bold text-green-600 mt-2">
            {products.filter(p => p.is_active).length}
          </h2>
        </div>

      </div>

      <div className="bg-white border rounded-2xl p-5">

        <div className="flex flex-col sm:flex-row gap-3 justify-between mb-5">
          <h2 className="text-lg font-semibold">All Products</h2>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full border rounded-lg pl-10 pr-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={fetchProducts}
              className="border rounded-lg px-3 hover:bg-slate-50"
              title="Refresh"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-center py-10 text-slate-500">
            Loading products...
          </p>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="font-medium text-slate-600">
              No products found
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b text-slate-500">
                  <th className="py-3 px-3">Product Name</th>
                  <th className="py-3 px-3">Product Code</th>
                  <th className="py-3 px-3">Unit</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b hover:bg-slate-50">
                    <td className="py-4 px-3 font-semibold">
                      {product.product_name}
                    </td>

                    <td className="py-4 px-3">
                      {product.product_code}
                    </td>

                    <td className="py-4 px-3">
                      {product.unit}
                    </td>

                    <td className="py-4 px-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        product.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    <td className="py-4 px-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-blue-600 flex items-center gap-1"
                        >
                          <Pencil size={16} />
                          Edit
                        </button>

                        <button
                          onClick={() => toggleProductStatus(product)}
                          className={`flex items-center gap-1 ${
                            product.is_active
                              ? 'text-red-600'
                              : 'text-green-600'
                          }`}
                        >
                          <Power size={16} />
                          {product.is_active ? 'Deactivate' : 'Activate'}
                        </button>

                        <button
  onClick={async () => {
    setAssigningProduct(product)
    setSelectedShopIds([])
    setAssignError('')
    await fetchShops()
  }}
  className="flex items-center gap-1 text-purple-600 hover:text-purple-800"
>
  <Store size={16} />
  Assign
</button>


                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-xl font-bold">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>

              <button
                onClick={() => {
                  setShowForm(false)
                  setEditingProduct(null)
                  setError('')
                }}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">

              {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">
                  Product Name *
                </label>
                <input
                  name="product_name"
                  value={form.product_name}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-lg px-3 py-2.5"
                  placeholder="Enter product name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Product Code *
                </label>
                <input
                  name="product_code"
                  value={form.product_code}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-lg px-3 py-2.5"
                  placeholder="Example: PRD001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Unit *
                </label>
                <input
                  name="unit"
                  value={form.unit}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-lg px-3 py-2.5"
                  placeholder="Example: kg, packet, bottle"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full border rounded-lg px-3 py-2.5"
                  placeholder="Product description"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-lg font-semibold"
              >
                {saving
                  ? 'Saving...'
                  : editingProduct
                    ? 'Save Changes'
                    : 'Create Product'}
              </button>

            </form>
          </div>

         

        </div>
      )}

       {assigningProduct && (
  <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl w-full max-w-lg p-6">

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">
          Assign Product to Shops
        </h2>

        <button
          onClick={() => setAssigningProduct(null)}
          className="p-2 hover:bg-slate-100 rounded-lg"
        >
          <X size={20} />
        </button>
      </div>

      <div className="bg-blue-50 p-4 rounded-xl mb-4">
        <p className="text-sm text-blue-600">Selected Product</p>
        <p className="font-bold text-blue-900">
          {assigningProduct.product_name}
        </p>
        <p className="text-sm text-blue-700">
          Code: {assigningProduct.product_code}
        </p>
      </div>

      <p className="font-semibold mb-3">
        Select Shops
      </p>

      <div className="border rounded-xl p-3 max-h-64 overflow-y-auto space-y-3">

        {shops.length === 0 ? (
          <p className="text-sm text-slate-500">
            No active shops available.
          </p>
        ) : (
          shops.map((shop) => (
            <label
              key={shop.id}
              className="flex items-center gap-3 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedShopIds.includes(shop.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedShopIds((prev) => [
                      ...prev,
                      shop.id
                    ])
                  } else {
                    setSelectedShopIds((prev) =>
                      prev.filter((id) => id !== shop.id)
                    )
                  }
                }}
                className="w-4 h-4"
              />

              <span className="text-sm font-medium">
                {shop.shop_name}
              </span>
            </label>
          ))
        )}

      </div>

      <p className="text-xs text-slate-500 mt-3">
        Initial stock quantity will be 0 for newly assigned shops.
      </p>

      {assignError && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mt-3">
          {assignError}
        </div>
      )}

      <button
        onClick={handleAssignProduct}
        disabled={assignLoading || shops.length === 0}
        className="w-full mt-5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-lg font-semibold"
      >
        {assignLoading ? 'Assigning...' : 'Assign Product'}
      </button>

    </div>
  </div>
)}


    </div>
  )
}

export default Products
