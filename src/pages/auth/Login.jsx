import { supabase } from '../../lib/supabase'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Store, Lock, Mail } from 'lucide-react'

function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await login(email, password)

      const { data: profile, error } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', data.user.id)
  .single()

if (error) throw error

if (profile.role === 'agency_admin') {
  navigate('/admin/dashboard')
} else if (profile.role === 'shop_owner') {
  navigate('/shop/dashboard')
} else {
  setError('Account role not configured.')
}

      if (result.error) throw result.error

      if (result.data.role === 'agency_admin') {
        navigate('/admin/dashboard')
      } else if (result.data.role === 'shop_owner') {
        navigate('/shop/dashboard')
      } else {
        setError('Your account role is not configured.')
      }

    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">

        <div className="flex justify-center mb-5">
          <div className="bg-blue-100 p-4 rounded-2xl">
            <Store size={35} className="text-blue-700" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-slate-800">
          Agency Stock Management
        </h1>

        <p className="text-center text-gray-500 mt-2 mb-8">
          Sign in to your account
        </p>

        <form onSubmit={handleLogin} className="space-y-5">

          <div>
            <label className="block text-sm font-medium mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400" size={19}/>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full border rounded-lg py-3 pl-10 pr-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={19}/>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full border rounded-lg py-3 pl-10 pr-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-lg disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          New shop owner?{' '}
          <Link to="/register" className="text-blue-700 font-semibold">
            Register
          </Link>
        </p>

      </div>
    </div>
  )
}

export default Login
