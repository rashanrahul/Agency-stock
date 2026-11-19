import Shops from './pages/admin/Shops'
import Products from './pages/admin/Products'
import ShopProducts from './pages/admin/ShopProducts'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AdminLayout from './components/layout/AdminLayout'
import { AuthProvider } from './context/AuthContext'
import LowStock from './pages/admin/LowStock'
import OutOfStock from './pages/admin/OutOfStock'

import ProtectedRoute from './components/common/ProtectedRoute'

import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Unauthorized from './pages/auth/Unauthorized'

import AdminDashboard from './pages/admin/Dashboard'
import ShopDashboard from './pages/shop/ShopDashboard'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Admin Routes */}
          <Route element={<ProtectedRoute allowedRole="agency_admin" />}>
            <Route
  path="/admin/dashboard"
  element={
    <AdminLayout>
      <AdminDashboard />
    </AdminLayout>
  }
/>

<Route
  path="/admin/shops"
  element={
    <AdminLayout>
      <Shops />
    </AdminLayout>
  }
/>

<Route
  path="/admin/products"
  element={
    <AdminLayout>
      <Products />
    </AdminLayout>
  }
/>

<Route
  path="/admin/shop-products"
  element={
    <AdminLayout>
      <ShopProducts />
    </AdminLayout>
  }
/>

<Route
  path="/admin/low-stock"
  element={
    <AdminLayout>
      <LowStock />
    </AdminLayout>
  }
/>

<Route
  path="/admin/out-of-stock"
  element={
    <AdminLayout>
      <OutOfStock />
    </AdminLayout>
  }
/>
          </Route>

          {/* Shop Owner Routes */}
          <Route element={<ProtectedRoute allowedRole="shop_owner" />}>
            <Route
              path="/shop/dashboard"
              element={<ShopDashboard />}
            />
          </Route>

          {/* Default Route */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
