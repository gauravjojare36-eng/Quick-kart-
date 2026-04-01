import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { useStore } from './store/useStore';

// Components
import SplashScreen from './components/SplashScreen';
import Chatbot from './components/Chatbot';

// Auth Pages
import Login from './pages/auth/Login';

// Layouts
import UserLayout from './layouts/UserLayout';
import VipLayout from './layouts/VipLayout';
import AdminLayout from './layouts/AdminLayout';
import VipAdminLayout from './layouts/VipAdminLayout';

// User Pages
import Home from './pages/user/Home';
import ProductDetail from './pages/user/ProductDetail';
import Cart from './pages/user/Cart';
import Checkout from './pages/user/Checkout';
import Profile from './pages/user/Profile';
import Orders from './pages/user/Orders';
import Wishlist from './pages/user/Wishlist';
import CategoryProducts from './pages/user/CategoryProducts';
import Shop from './pages/user/Shop';
import Categories from './pages/user/Categories';

// Admin Pages
import Dashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AdminOrders from './pages/admin/Orders';
import AdminReturns from './pages/admin/Returns';
import AdminCategories from './pages/admin/Categories';
import AdminBanners from './pages/admin/Banners';
import AdminCoupons from './pages/admin/Coupons';
import AdminUsers from './pages/admin/Users';

// VIP Admin Pages
import VipDashboard from './pages/vip-admin/Dashboard';
import VipAdminProducts from './pages/vip-admin/Products';
import VipAdminOrders from './pages/vip-admin/Orders';
import VipAdminReturns from './pages/vip-admin/Returns';
import VipAdminCategories from './pages/vip-admin/Categories';
import VipAdminBanners from './pages/vip-admin/Banners';
import VipAdminUsers from './pages/vip-admin/Users';

function App() {
  const { user, setUser, setAuthReady, userRole, isAuthReady } = useStore();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Hide splash screen after 3 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          let role: 'user' | 'admin' = 'user';
          
          if (userDoc.exists()) {
            role = userDoc.data().role as 'user' | 'admin';
          } else {
            // Check if this is the first admin (shamsunderjojare@gmail.com)
            if (currentUser.email === 'shamsunderjojare@gmail.com' && currentUser.emailVerified) {
              role = 'admin';
            }
            // Create user document
            await setDoc(userDocRef, {
              uid: currentUser.uid,
              name: currentUser.displayName || 'User',
              email: currentUser.email,
              role: role,
              addresses: [],
              createdAt: new Date().toISOString()
            });
          }
          
          setUser(currentUser, role);
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, 'users');
        }
      } else {
        setUser(null, null);
      }
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, [setUser, setAuthReady]);

  if (showSplash) {
    return <SplashScreen />;
  }

  if (!isAuthReady) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white font-bold tracking-widest uppercase text-xs">Initializing...</div>;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Router>
      <Routes>
        {/* User Routes */}
        <Route path="/" element={<UserLayout />}>
          <Route index element={<Home />} />
          <Route path="product/:id" element={<ProductDetail />} />
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="profile" element={<Profile />} />
          <Route path="orders" element={<Orders />} />
          <Route path="wishlist" element={<Wishlist />} />
          <Route path="category/:categoryName" element={<CategoryProducts />} />
          <Route path="shop" element={<Shop />} />
          <Route path="categories" element={<Categories />} />
        </Route>

        {/* VIP Store Routes */}
        <Route path="/vip" element={<VipLayout />}>
          <Route index element={<Home />} />
          <Route path="product/:id" element={<ProductDetail />} />
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="profile" element={<Profile />} />
          <Route path="orders" element={<Orders />} />
          <Route path="wishlist" element={<Wishlist />} />
          <Route path="category/:categoryName" element={<CategoryProducts />} />
          <Route path="shop" element={<Shop />} />
          <Route path="categories" element={<Categories />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="returns" element={<AdminReturns />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="banners" element={<AdminBanners />} />
          <Route path="coupons" element={<AdminCoupons />} />
          <Route path="users" element={<AdminUsers />} />
        </Route>

        {/* VIP Admin Routes */}
        <Route path="/vip-admin" element={<VipAdminLayout />}>
          <Route index element={<VipDashboard />} />
          <Route path="products" element={<VipAdminProducts />} />
          <Route path="orders" element={<VipAdminOrders />} />
          <Route path="returns" element={<VipAdminReturns />} />
          <Route path="categories" element={<VipAdminCategories />} />
          <Route path="banners" element={<VipAdminBanners />} />
          <Route path="users" element={<VipAdminUsers />} />
        </Route>
      </Routes>
      <Chatbot />
    </Router>
  );
}

export default App;
