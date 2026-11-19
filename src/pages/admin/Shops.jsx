
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import {
  Store,
  Plus,
  Search,
  RefreshCw,
  X,
  Phone,
  MapPin,
  Mail,
  Pencil,
  Power,
  UserPlus
} from 'lucide-react'

function Shops() {
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingShop, setEditingShop] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [assigningShop, setAssigningShop] = useState(null)
const [ownerEmail, setOwnerEmail] = useState('')
const [assignError, setAssignError] = useState('')
const [assigning, setAssigning] = useState(false)

  const [form, setForm] = useState({
    shop_name: '',
    owner_name: '',
    phone: '',
    email: '',
    address: ''
  })

  const fetchShops = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setShops(data || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchShops()
  }, [])

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    })
  }

  const handleEdit = (shop) => {
  setEditingShop(shop)

  setForm({
    shop_name: shop.shop_name || '',
    owner_name: shop.owner_name || '',
    phone: shop.phone || '',
    email: shop.email || '',
    address: shop.address || ''
  })

  setError('')
  setShowForm(true)
}

const toggleShopStatus = async (shop) => {
  const newStatus = !shop.is_active

  const { error } = await supabase
    .from('shops')
    .update({ is_active: newStatus })
    .eq('id', shop.id)

  if (error) {
    alert(error.message)
    return
  }

  await fetchShops()
}

const handleAssignOwner = async (e) => {
  e.preventDefault()
  setAssignError('')

  if (!ownerEmail.trim()) {
    setAssignError('Please enter the Shop Owner email.')
    return
  }

  setAssigning(true)

  // Find the Shop Owner account
  const { data: owner, error: ownerError } = await supabase
    .from('profiles')
    .select('id, email, shop_id')
    .eq('email', ownerEmail.trim())
    .eq('role', 'shop_owner')
    .maybeSingle()

  if (ownerError) {
    setAssignError(ownerError.message)
    setAssigning(false)
    return
  }

  if (!owner) {
    setAssignError('No Shop Owner account found with this email.')
    setAssigning(false)
    return
  }

  if (owner.shop_id && owner.shop_id !== assigningShop.id) {
    setAssignError('This account is already assigned to another shop.')
    setAssigning(false)
    return
  }

  // Check whether this shop already has another owner
  const { data: existingOwner, error: existingError } = await supabase
    .from('profiles')
    .select('id')
    .eq('shop_id', assigningShop.id)
    .neq('id', owner.id)
    .limit(1)

  if (existingError) {
    setAssignError(existingError.message)
    setAssigning(false)
    return
  }

  if (existingOwner && existingOwner.length > 0) {
    setAssignError('This shop already has an assigned owner.')
    setAssigning(false)
    return
  }

  // Assign owner to the shop
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ shop_id: assigningShop.id })
    .eq('id', owner.id)

  if (updateError) {
    setAssignError(updateError.message)
  } else {
    setAssigningShop(null)
    setOwnerEmail('')
    setAssignError('')
    alert('Shop Owner assigned successfully!')
  }

  setAssigning(false)
}

const handleSubmit = async (e) => {
  e.preventDefault()
  setError('')

  if (!form.shop_name.trim() || !form.owner_name.trim()) {
    setError('Shop name and owner name are required.')
    return
  }

  setSaving(true)

  let query

  if (editingShop) {
    query = await supabase
      .from('shops')
      .update({
        shop_name: form.shop_name.trim(),
        owner_name: form.owner_name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim()
      })
      .eq('id', editingShop.id)
  } else {
    query = await supabase
      .from('shops')
      .insert([{
        shop_name: form.shop_name.trim(),
        owner_name: form.owner_name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        is_active: true
      }])
  }

  if (query.error) {
    setError(query.error.message)
  } else {
    setForm({
      shop_name: '',
      owner_name: '',
      phone: '',
      email: '',
      address: ''
    })

    setEditingShop(null)
    setShowForm(false)
    await fetchShops()
  }

  setSaving(false)
}

  const filteredShops = shops.filter((shop) =>
    `${shop.shop_name} ${shop.owner_name} ${shop.phone}`
      .toLowerCase()
      .includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Shop Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage all shops connected to your agency.
          </p>
        </div>

        <button
  onClick={() => {
    setForm({
      shop_name: '',
      owner_name: '',
      phone: '',
      email: '',
      address: ''
    })

    setEditingShop(null)
    setError('')
    setShowForm(true)
  }}
  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-medium"
>
  <Plus size={18} />
  Add New Shop
</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 text-blue-600 p-3 rounded-xl">
              <Store size={22} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Shops</p>
              <h2 className="text-2xl font-bold">{shops.length}</h2>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-sm text-slate-500">Active Shops</p>
          <h2 className="text-2xl font-bold text-green-600 mt-2">
            {shops.filter(shop => shop.is_active).length}
          </h2>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-sm text-slate-500">Inactive Shops</p>
          <h2 className="text-2xl font-bold text-red-600 mt-2">
            {shops.filter(shop => !shop.is_active).length}
          </h2>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5">

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-5">
          <h2 className="font-semibold text-lg">All Shops</h2>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search shops..."
                className="w-full border border-slate-200 rounded-lg pl-10 pr-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={fetchShops}
              className="border border-slate-200 rounded-lg px-3 text-slate-600 hover:bg-slate-50"
              title="Refresh"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-center py-10 text-slate-500">
            Loading shops...
          </p>
        ) : filteredShops.length === 0 ? (
          <div className="text-center py-12">
            <Store size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="font-medium text-slate-600">No shops found</p>
            <p className="text-sm text-slate-400 mt-1">
              Add your first shop to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-3 px-3">Shop Name</th>
                  <th className="py-3 px-3">Owner</th>
                  <th className="py-3 px-3">Contact</th>
                  <th className="py-3 px-3">Address</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredShops.map((shop) => (
                  <tr key={shop.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-4 px-3 font-semibold text-slate-800">
                      {shop.shop_name}
                    </td>

                    <td className="py-4 px-3">
                      {shop.owner_name}
                    </td>

                    <td className="py-4 px-3">
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-slate-400" />
                        {shop.phone || '-'}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-slate-500">
                        <Mail size={14} />
                        {shop.email || '-'}
                      </div>
                    </td>

                    <td className="py-4 px-3">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-slate-400" />
                        {shop.address || '-'}
                      </div>
                    </td>

                    <td className="py-4 px-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        shop.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {shop.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    <td className="py-4 px-3">
  <div className="flex items-center gap-3">

    <button
      onClick={() => handleEdit(shop)}
      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
    >
      <Pencil size={16} />
      Edit
    </button>

    <button
      onClick={() => toggleShopStatus(shop)}
      className={`flex items-center gap-1 font-medium ${
        shop.is_active
          ? 'text-red-600 hover:text-red-800'
          : 'text-green-600 hover:text-green-800'
      }`}
    >
      <Power size={16} />
      {shop.is_active ? 'Deactivate' : 'Activate'}
    </button>

    <button
  onClick={() => {
    setAssigningShop(shop)
    setOwnerEmail('')
    setAssignError('')
  }}
  className="flex items-center gap-1 text-purple-600 hover:text-purple-800 font-medium"
>
  <UserPlus size={16} />
  Assign Owner
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
  {editingShop ? 'Edit Shop' : 'Add New Shop'}
</h2>

              <button
                onClick={() => setShowForm(false)}
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
                  Shop Name *
                </label>
                <input
                  name="shop_name"
                  value={form.shop_name}
                  onChange={handleChange}
                  required
                  placeholder="Enter shop name"
                  className="w-full border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Owner Name *
                </label>
                <input
                  name="owner_name"
                  value={form.owner_name}
                  onChange={handleChange}
                  required
                  placeholder="Enter owner name"
                  className="w-full border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Phone Number
                </label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  className="w-full border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                  className="w-full border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Shop Address
                </label>
                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Enter shop address"
                  className="w-full border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-lg font-semibold"
              >
                {saving
  ? 'Saving...'
  : editingShop
    ? 'Save Changes'
    : 'Create Shop'}
              </button>

            </form>
          </div>
        </div>
      )}

       {assigningShop && (
  <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl w-full max-w-md p-6">

      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold">
          Assign Shop Owner
        </h2>

        <button
          onClick={() => setAssigningShop(null)}
          className="p-2 hover:bg-slate-100 rounded-lg"
        >
          <X size={20} />
        </button>
      </div>

      <p className="text-sm text-slate-500 mb-4">
        Shop: <strong>{assigningShop.shop_name}</strong>
      </p>

      <form onSubmit={handleAssignOwner} className="space-y-4">

        <div>
          <label className="block text-sm font-medium mb-2">
            Shop Owner Email
          </label>

          <input
            type="email"
            value={ownerEmail}
            onChange={(e) => setOwnerEmail(e.target.value)}
            placeholder="owner@example.com"
            required
            className="w-full border rounded-lg px-3 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {assignError && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
            {assignError}
          </div>
        )}

        <button
          type="submit"
          disabled={assigning}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-lg font-semibold"
        >
          {assigning ? 'Assigning...' : 'Assign Owner'}
        </button>

      </form>
    </div>
  </div>
)}


    </div>
  )
}

export default Shops
