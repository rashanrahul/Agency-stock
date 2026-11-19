
import { useAuth } from '../../context/AuthContext'

function ShopDashboard() {
  const { profile, logout } = useAuth()

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <h1 className="text-3xl font-bold text-green-700">
        Shop Owner Dashboard
      </h1>

      <p className="mt-4">
        Welcome, {profile?.full_name}
      </p>

      <button
        onClick={logout}
        className="mt-6 bg-red-600 text-white px-5 py-2 rounded-lg"
      >
        Logout
      </button>
    </div>
  )
}

export default ShopDashboard
