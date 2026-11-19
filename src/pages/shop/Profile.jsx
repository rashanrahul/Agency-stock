
import { useEffect, useState } from 'react'
import { User, Store, Mail, Phone, MapPin, Save } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

function Profile() {
  const { user, profile, refreshProfile } = useAuth()

  const [shop, setShop] = useState(null)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      if (!profile) return

      setFullName(profile.full_name || '')

      if (profile.shop_id) {
        const { data, error } = await supabase
          .from('shops')
          .select('*')
          .eq('id', profile.shop_id)
          .maybeSingle()

        if (error) {
          console.error('Shop details error:', error.message)
        } else {
          setShop(data)
          setPhone(data?.phone || '')
        }
      }

      setLoading(false)
    }

    fetchProfile()
  }, [profile])

  const handleSave = async (e) => {
    e.preventDefault()

    if (!fullName.trim()) {
      alert('Please enter your full name.')
      return
    }

    setSaving(true)

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim() })
      .eq('id', user.id)

    if (profileError) {
      alert(profileError.message)
      setSaving(false)
      return
    }

    if (shop) {
      const { error: shopError } = await supabase
        .from('shops')
        .update({ phone: phone.trim() })
        .eq('id', shop.id)

      if (shopError) {
        alert(shopError.message)
        setSaving(false)
        return
      }
    }

    await refreshProfile()

    alert('Profile updated successfully!')
    setSaving(false)
  }

  if (loading) {
    return <div className="p-8 text-center">Loading profile...</div>
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Profile</h1>
        <p className="mt-1 text-sm text-slate-500">
          View and update your account details
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-xl border bg-white p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-full bg-green-100 p-3">
              <User className="text-green-700" size={24} />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800">Account Details</h2>
              <p className="text-sm text-slate-500">Your personal information</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Full Name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border px-4 py-3 outline-none focus:border-green-500"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-slate-400" size={18} />
                <input
                  value={user?.email || ''}
                  disabled
                  className="w-full rounded-lg border bg-slate-50 py-3 pl-10 pr-4 text-slate-500"
                />
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Email cannot be changed here.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-full bg-blue-100 p-3">
              <Store className="text-blue-700" size={24} />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800">Shop Details</h2>
              <p className="text-sm text-slate-500">Your assigned shop information</p>
            </div>
          </div>

          {shop ? (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Shop Name</label>
                <input
                  value={shop.shop_name || ''}
                  disabled
                  className="w-full rounded-lg border bg-slate-50 px-4 py-3 text-slate-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Contact Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3.5 text-slate-400" size={18} />
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-lg border py-3 pl-10 pr-4 outline-none focus:border-green-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Shop Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3.5 text-slate-400" size={18} />
                  <input
                    value={shop.address || ''}
                    disabled
                    className="w-full rounded-lg border bg-slate-50 py-3 pl-10 pr-4 text-slate-500"
                  />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-amber-600">
              No shop is assigned to this account.
            </p>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default Profile
