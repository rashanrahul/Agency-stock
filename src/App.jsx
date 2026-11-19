import Shops from './pages/admin/Shops'
import Products from './pages/admin/Products'
import ShopProducts from './pages/admin/ShopProducts'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AdminLayout from './components/layout/AdminLayout'
import { AuthProvider } from './context/AuthContext'
import LowStock from './pages/admin/LowStock'
import OutOfStock from './pages/admin/OutOfStock'
import StockHistory from './pages/admin/StockHistory'
import Settings from './pages/admin/Settings'
import ShopLayout from './components/layout/ShopLayout'
import MyProducts from './pages/shop/MyProducts'
import UpdateStock from './pages/shop/UpdateStock'
import ShopStockHistory from './pages/shop/StockHistory'
import Notifications from './pages/shop/Notifications'
import Profile from './pages/shop/Profile'
import AdminNotifications from './pages/admin/Notifications'

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

<Route
  path="/admin/history"
  element={
    <AdminLayout>
      <StockHistory />
    </AdminLayout>
  }
/>

<Route
  path="/admin/notifications"
  element={<AdminNotifications />}
/>

<Route
  path="/admin/settings"
  element={
    <AdminLayout>
      <Settings />
    </AdminLayout>
  }
/>
          </Route>

          {/* Shop Owner Routes */}
          <Route element={<ProtectedRoute allowedRole="shop_owner" />}>
  <Route
    path="/shop/dashboard"
    element={
      <ShopLayout>
        <ShopDashboard />
      </ShopLayout>
    }
  />
</Route>

<Route
  path="/shop/products"
  element={
    <ShopLayout>
      <MyProducts />
    </ShopLayout>
  }
/>

<Route
  path="/shop/update-stock"
  element={
    <ShopLayout>
      <UpdateStock />
    </ShopLayout>
  }
/>

<Route
  path="/shop/history"
  element={
    <ShopLayout>
      <ShopStockHistory />
    </ShopLayout>
  }
/>

<Route
  path="/shop/notifications"
  element={
    <ShopLayout>
      <Notifications />
    </ShopLayout>
  }
/>

<Route
  path="/shop/profile"
  element={
    <ShopLayout>
      <Profile />
    </ShopLayout>
  }
/>

          {/* Default Route */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
