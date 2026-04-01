import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { Users, Package, ShoppingCart, DollarSign, Crown, ArrowLeft } from 'lucide-react';

import { useNavigate } from 'react-router-dom';

export default function VipDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    users: 0,
    products: 0,
    orders: 0,
    revenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersSnap, productsSnap, ordersSnap] = await Promise.all([
          getDocs(collection(db, 'users')), // Users are shared
          getDocs(collection(db, 'vip_products')),
          getDocs(collection(db, 'vip_orders'))
        ]);

        const totalRevenue = ordersSnap.docs.reduce((acc, doc) => acc + (doc.data().totalAmount || 0), 0);

        setStats({
          users: usersSnap.size,
          products: productsSnap.size,
          orders: ordersSnap.size,
          revenue: totalRevenue
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'vip_stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]">Loading VIP dashboard...</div>;

  return (
    <div className="space-y-6">
      <button 
        onClick={() => navigate('/vip')}
        className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 font-bold transition-colors group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span>Back to VIP Store</span>
      </button>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">VIP Dashboard Overview</h1>
        <div className="flex items-center bg-purple-100 text-purple-700 px-4 py-2 rounded-full font-bold text-sm">
          <Crown className="w-4 h-4 mr-2" />
          Bulk Store Mode
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Users</p>
            <p className="text-2xl font-bold text-gray-900">{stats.users}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">VIP Revenue</p>
            <p className="text-2xl font-bold text-gray-900">₹{stats.revenue.toFixed(2)}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Bulk Orders</p>
            <p className="text-2xl font-bold text-gray-900">{stats.orders}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-lg">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Bulk Products</p>
            <p className="text-2xl font-bold text-gray-900">{stats.products}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Recent VIP Activity</h2>
        <p className="text-gray-500">VIP Analytics charts will be displayed here.</p>
      </div>
    </div>
  );
}
