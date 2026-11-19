
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

import {
  LayoutDashboard,
  Store,
  Package,
  History,
  Settings,
  LogOut,
  Menu,
  X,
  Building2,
  Boxes,
  AlertTriangle,
  PackageX
} from 'lucide-react'

import { useState } from 'react'

function AdminLayout({ children }) {
  const { profile, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileMenu, setMobileMenu] = useState(false)

  const menuItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Shops', path: '/admin/shops', icon: Store },
    { name: 'All Products', path: '/admin/products', icon: Package },
    { name: 'Stock History', path: '/admin/history', icon: History },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
    { name: 'Shop Products', path: '/admin/shop-products', icon: Boxes},
    { name: 'Low Stock', path: '/admin/low-stock', icon: AlertTriangle},
    { name: 'Out of Stock', path: '/admin/out-of-stock', icon: PackageX},
  ]

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout failed:', error.message)
    }
  }

  const SidebarContent = () => (
    <>
      <div className="h-20 flex items-center gap-3 px-6 border-b border-slate-700">
        <div className="bg-blue-600 p-2 rounded-xl">
          <Building2 size={25} className="text-white" />
        </div>

        <div>
          <h1 className="font-bold text-white text-lg">
            Agency Stock
          </h1>
          <p className="text-xs text-slate-400">
            Management System
          </p>
        </div>
      </div>

      <div className="px-4 py-6">
        <p className="text-xs font-semibold text-slate-500 uppercase mb-4 px-3">
          Main Menu
        </p>

        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/admin/dashboard'}
                onClick={() => setMobileMenu(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <Icon size={19} />
                <span className="text-sm font-medium">
                  {item.name}
                </span>
              </NavLink>
            )
          })}
        </nav>
      </div>

      <div className="mt-auto p-4 border-t border-slate-700">
        <div className="mb-4 px-3">
          <p className="text-sm font-semibold text-white">
            {profile?.full_name || 'Agency Admin'}
          </p>
          <p className="text-xs text-slate-400">
            Administrator
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-slate-800 rounded-xl"
        >
          <LogOut size={19} />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-slate-100">

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 bg-slate-900 flex-col z-40">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {mobileMenu && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileMenu(false)}
          />

          <aside className="relative w-72 h-full bg-slate-900 flex flex-col">
            <button
              onClick={() => setMobileMenu(false)}
              className="absolute top-6 right-4 text-white"
            >
              <X size={22} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="lg:ml-64">

        <header className="h-20 bg-white border-b flex items-center justify-between px-5 lg:px-8 sticky top-0 z-30">

          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenu(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100"
            >
              <Menu size={23} />
            </button>

            <div>
              <h2 className="font-bold text-slate-800">
                Agency Administration
              </h2>
              <p className="text-xs text-slate-500">
                Manage all your shops
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-800">
                {profile?.full_name || 'Admin'}
              </p>
              <p className="text-xs text-slate-500">
                Agency Administrator
              </p>
            </div>

            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
              {(profile?.full_name || 'A').charAt(0).toUpperCase()}
            </div>
          </div>

        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>

      </div>
    </div>
  )
}

export default AdminLayout
