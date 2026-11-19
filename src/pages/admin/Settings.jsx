
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Settings as SettingsIcon, Save, User, Mail, Phone, Loader2 } from 'lucide-react'

function Settings() {
  const { user, profile, refreshProfile } = useAuth()

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    agency_name: '',
    address: ''
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .maybeSingle()

      if (error) {
        setError(error.message)
      } else {
        setForm(prev => ({
          ...prev,
          full_name: data?.full_name || '',
          email: data?.email || user.email || ''
        }))
      }

      setLoading(false)
    }

    loadSettings()
  }, [user])

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    })
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: form.full_name
      })
      .eq('id', user.id)

    if (error) {
      setError(error.message)
    } else {
      setMessage('Profile updated successfully.')
      await refreshProfile()
    }

    setSaving(false)
  }

  if (loading) {
    return <div className="p-8 text-center">Loading settings...</div>
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your agency administrator profile
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <SettingsIcon className="text-blue-600" size={24} />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800">Admin Profile</h2>
            <p className="text-sm text-slate-500">Update your personal information</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm">
            {message}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">Full Name</label>
          <div className="relative">
            <User size={18} className="absolute left-3 top-3 text-slate-400" />
            <input
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              required
              className="w-full border rounded-lg pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter full name"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Email Address</label>
          <div className="relative">
            <Mail size={18} className="absolute left-3 top-3 text-slate-400" />
            <input
              value={form.email}
              readOnly
              className="w-full border rounded-lg pl-10 pr-4 py-2.5 bg-slate-50 text-slate-500"
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Email address is managed by your login account.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Phone Number</label>
          <div className="relative">
            <Phone size={18} className="absolute left-3 top-3 text-slate-400" />
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full border rounded-lg pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter phone number"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Agency Name</label>
          <input
            name="agency_name"
            value={form.agency_name}
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter agency name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Address</label>
          <textarea
            name="address"
            value={form.address}
            onChange={handleChange}
            rows="3"
            className="w-full border rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter agency address"
          />
        </div>

        <div className="flex justify-end border-t pt-5">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default Settings
