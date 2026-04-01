import { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Users, LogOut, Settings, Tags, Image, Ticket, Menu, X, Crown, RotateCcw } from 'lucide-react';
import { useStore } from '../store/useStore';
import { logout } from '../firebase';

export default function VipAdminLayout() {
  const { userRole, isAuthReady } = useStore();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!isAuthReady) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  if (userRole !== 'admin') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <h1 className="text-4xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-8">You do not have permission to view this VIP admin page.</p>
        <Link to="/vip" className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
          Return to VIP Store
        </Link>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    navigate('/vip');
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
        <div className="h-16 flex items-center justify-between px-6 bg-gray-950 border-b border-purple-500/30">
          <div className="flex items-center space-x-2">
            <Crown className="w-5 h-5 text-purple-500" />
            <span className="text-xl font-bold tracking-wider text-purple-500">VIP ADMIN</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <Link to="/vip-admin" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center px-4 py-3 text-gray-300 hover:bg-purple-900/30 hover:text-white rounded-md transition-colors">
            <LayoutDashboard className="w-5 h-5 mr-3 text-purple-400" />
            VIP Dashboard
          </Link>
          <Link to="/vip-admin/products" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center px-4 py-3 text-gray-300 hover:bg-purple-900/30 hover:text-white rounded-md transition-colors">
            <Package className="w-5 h-5 mr-3 text-purple-400" />
            Bulk Products
          </Link>
          <Link to="/vip-admin/orders" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center px-4 py-3 text-gray-300 hover:bg-purple-900/30 hover:text-white rounded-md transition-colors">
            <ShoppingCart className="w-5 h-5 mr-3 text-purple-400" />
            Bulk Orders
          </Link>
          <Link to="/vip-admin/returns" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center px-4 py-3 text-gray-300 hover:bg-purple-900/30 hover:text-white rounded-md transition-colors">
            <RotateCcw className="w-5 h-5 mr-3 text-purple-400" />
            Bulk Returns
          </Link>
          <Link to="/vip-admin/categories" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center px-4 py-3 text-gray-300 hover:bg-purple-900/30 hover:text-white rounded-md transition-colors">
            <Tags className="w-5 h-5 mr-3 text-purple-400" />
            VIP Categories
          </Link>
          <Link to="/vip-admin/banners" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center px-4 py-3 text-gray-300 hover:bg-purple-900/30 hover:text-white rounded-md transition-colors">
            <Image className="w-5 h-5 mr-3 text-purple-400" />
            VIP Banners
          </Link>
          <Link to="/vip-admin/users" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center px-4 py-3 text-gray-300 hover:bg-purple-900/30 hover:text-white rounded-md transition-colors">
            <Users className="w-5 h-5 mr-3 text-purple-400" />
            VIP Users
          </Link>
        </nav>
        <div className="p-4 border-t border-gray-800">
          <Link to="/admin" className="flex items-center w-full px-4 py-2 text-blue-400 hover:text-blue-300 hover:bg-gray-800 rounded-md transition-colors mb-2">
            <Settings className="w-5 h-5 mr-3" />
            Regular Admin
          </Link>
          <button onClick={handleLogout} className="flex items-center w-full px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors">
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden w-full">
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-4 md:px-8 border-b border-purple-100">
          <div className="flex items-center">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden mr-4 text-gray-600 hover:text-gray-900">
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-semibold text-gray-800 flex items-center">
              <Crown className="w-5 h-5 mr-2 text-purple-600" />
              VIP Admin Panel
            </h2>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/vip" className="text-sm font-medium text-purple-600 hover:text-purple-700">View VIP Store</Link>
            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
              V
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
