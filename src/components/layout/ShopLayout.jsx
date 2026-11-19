
import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard,
  Package,
  RefreshCw,
  History,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  Store
} from 'lucide-react'

function ShopLayout({ children }) {
  const { profile, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/shop/dashboard',
      icon: LayoutDashboard
    },
    {
      name: 'My Products',
      path: '/shop/products',
      icon: Package
    },
    {
      name: 'Update Stock',
      path: '/shop/update-stock',
      icon: RefreshCw
    },
    {
      name: 'Stock History',
      path: '/shop/history',
      icon: History
    },
    {
      name: 'Notifications',
      path: '/shop/notifications',
      icon: Bell
    },
    {
      name: 'My Profile',
      path: '/shop/profile',
      icon: User
    }
  ]

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col transform transition-transform duration-300 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="h-20 px-6 flex items-center gap-3 border-b border-slate-700">
          <div className="bg-green-500 p-2 rounded-lg">
            <Store size={24} />
          </div>
          <div>
            <h1 className="font-bold text-lg">Shop Panel</h1>
            <p className="text-xs text-slate-400">Stock Management</p>
          </div>

          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto lg:hidden"
          >
            <X size={22} />
          </button>
        </div>

        <div className="px-5 py-5 border-b border-slate-700">
          <p className="text-xs text-slate-400">LOGGED IN AS</p>
          <p className="font-semibold mt-1">
            {profile?.full_name || 'Shop Owner'}
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/shop/dashboard'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    isActive
                      ? 'bg-green-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <Icon size={19} />
                <span className="text-sm font-medium">{item.name}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-300 hover:bg-red-500/10"
          >
            <LogOut size={19} />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="lg:hidden bg-white border-b px-4 py-3 flex items-center gap-3">
          <button onClick={() => setMobileOpen(true)}>
            <Menu size={24} />
          </button>
          <h2 className="font-semibold text-slate-800">Shop Owner Panel</h2>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

export default ShopLayout
