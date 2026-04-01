import { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Users, LogOut, Settings, Tags, Image, Ticket, Menu, X, RotateCcw } from 'lucide-react';
import { useStore } from '../store/useStore';
import { logout } from '../firebase';

export default function AdminLayout() {
  const { userRole, isAuthReady } = useStore();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!isAuthReady) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  if (userRole !== 'admin') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <h1 className="text-4xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-8">You do not have permission to view this page.</p>
        <Link to="/" className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Return Home
        </Link>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex bg-gray-100 font-sans relative">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white flex flex-col transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="h-16 flex items-center justify-between px-6 bg-gray-950">
          <span className="text-xl font-bold tracking-wider text-blue-500">STAYRAW ADMIN</span>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-md transition-colors">
            <LayoutDashboard className="w-5 h-5 mr-3" />
            Dashboard
          </Link>
          <Link to="/admin/products" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-md transition-colors">
            <Package className="w-5 h-5 mr-3" />
            Products
          </Link>
          <Link to="/admin/orders" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-md transition-colors">
            <ShoppingCart className="w-5 h-5 mr-3" />
            Orders
          </Link>
          <Link to="/admin/returns" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-md transition-colors">
            <RotateCcw className="w-5 h-5 mr-3" />
            Returns
          </Link>
          <Link to="/admin/categories" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-md transition-colors">
            <Tags className="w-5 h-5 mr-3" />
            Categories
          </Link>
          <Link to="/admin/banners" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-md transition-colors">
            <Image className="w-5 h-5 mr-3" />
            Banners
          </Link>
          <Link to="/admin/coupons" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-md transition-colors">
            <Ticket className="w-5 h-5 mr-3" />
            Coupons
          </Link>
          <Link to="/admin/users" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-md transition-colors">
            <Users className="w-5 h-5 mr-3" />
            Users
          </Link>
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button onClick={handleLogout} className="flex items-center w-full px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors">
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden w-full">
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-4 md:px-8">
          <div className="flex items-center">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden mr-4 text-gray-600 hover:text-gray-900">
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-semibold text-gray-800">Admin Panel</h2>
          </div>
          <div className="flex items-center space-x-4">
            <Settings className="w-5 h-5 text-gray-500 cursor-pointer hover:text-gray-700" />
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
              A
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
