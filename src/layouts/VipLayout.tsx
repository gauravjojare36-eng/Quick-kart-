import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Heart, User as UserIcon, LogOut, Search, Sparkles, Crown, MessageCircle, Home as HomeIcon, ShoppingBag, ShieldCheck } from 'lucide-react';
import { useStore } from '../store/useStore';
import { signInWithGoogle, logout, db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { getSmartSearchRecommendations } from '../services/ai';

export default function VipLayout() {
  const { user, vipCart, wishlist, setVipMode } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    setVipMode(true);
    return () => setVipMode(false);
  }, [setVipMode]);

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/vip');
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length > 2) {
        setIsSearching(true);
        setShowResults(true);
        try {
          const snapshot = await getDocs(collection(db, 'vip_products'));
          const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          const recommendedIds = await getSmartSearchRecommendations(searchQuery, products);
          const results = products.filter(p => recommendedIds.includes(p.id));
          setSearchResults(results);
        } catch (error) {
          console.error(error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 800);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* VIP Header */}
      <header className="bg-gray-900 shadow-xl sticky top-0 z-50 border-b border-purple-500/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/vip" className="flex items-center space-x-2">
                <div className="bg-gradient-to-br from-purple-600 to-indigo-600 p-1.5 rounded-lg shadow-lg shadow-purple-500/20">
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white tracking-tighter">
                  STAY<span className="text-purple-500">VIP</span>
                </span>
              </Link>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-lg mx-8 relative">
              <div className="relative w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.length > 2 && setShowResults(true)}
                  onBlur={() => setTimeout(() => setShowResults(false), 200)}
                  placeholder="Search VIP Bulk Products..."
                  className="w-full pl-10 pr-10 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-800 text-white"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
                <Sparkles className="absolute right-3 top-2.5 h-5 w-5 text-purple-500" />
              </div>
              
              {showResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 overflow-hidden z-50">
                  <div className="p-3 bg-purple-900/30 border-b border-purple-500/20 flex items-center text-purple-300 text-sm font-medium">
                    <Sparkles className="w-4 h-4 mr-2" />
                    VIP Bulk Recommendations
                  </div>
                  {isSearching ? (
                    <div className="p-4 text-center text-gray-400">Analyzing intent...</div>
                  ) : searchResults.length > 0 ? (
                    <div className="max-h-96 overflow-y-auto">
                      {searchResults.map(product => (
                        <Link 
                          key={product.id} 
                          to={`/vip/product/${product.id}`}
                          onClick={() => { setShowResults(false); setSearchQuery(''); }}
                          className="flex items-center p-3 hover:bg-gray-700 border-b border-gray-700 last:border-0"
                        >
                          <img src={product.images?.[0] || 'https://picsum.photos/seed/product/50/50'} alt="" className="w-12 h-12 rounded-md object-cover mr-4" referrerPolicy="no-referrer" />
                          <div>
                            <div className="font-medium text-white line-clamp-1">{product.title}</div>
                            <div className="text-sm text-gray-400">₹{product.discountPrice || product.price} (Bulk)</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-400">No matching VIP products found.</div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3 sm:space-x-6">
              <Link to="/" className="flex items-center space-x-1 px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg font-bold text-[10px] sm:text-xs uppercase tracking-wider hover:bg-gray-700 transition-all border border-gray-700">
                <ShoppingBag className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Regular Store</span>
              </Link>
              <Link to="/vip/wishlist" className="text-gray-400 hover:text-purple-400 relative">
                <Heart className="h-6 w-6" />
                {wishlist.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-gray-900 shadow-sm">
                    {wishlist.length}
                  </span>
                )}
              </Link>
              <Link to="/vip/cart" className="flex items-center text-gray-400 hover:text-purple-400 relative">
                <ShoppingCart className="h-6 w-6" />
                {vipCart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-gray-900 shadow-sm">
                    {vipCart.reduce((acc, item) => acc + item.quantity, 0)}
                  </span>
                )}
              </Link>
              {user ? (
                <div className="hidden sm:flex items-center space-x-4">
                  <Link to="/vip/profile" className="flex items-center text-gray-300 hover:text-purple-400">
                    <UserIcon className="h-5 w-5 mr-1" />
                    <span>{user.displayName?.split(' ')[0]}</span>
                  </Link>
                  <button onClick={handleLogout} className="text-gray-500 hover:text-red-400">
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleLogin}
                  className="hidden sm:block text-purple-400 font-medium hover:text-purple-300"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8 pb-24 md:pb-8">
        <div className="mb-6 bg-purple-600 text-white px-4 py-2 rounded-lg text-center font-bold text-sm uppercase tracking-widest animate-pulse">
          VIP Bulk Store - Minimum 10 Items per Product
        </div>
        <Outlet />
      </main>

      {/* Bottom Navigation (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 px-4 py-3 flex justify-between items-center z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.2)]">
        <Link to="/vip" className={`flex flex-col items-center space-y-1 transition-colors ${location.pathname === '/vip' ? 'text-purple-500' : 'text-gray-500 hover:text-purple-500'}`}>
          <HomeIcon className="h-6 w-6" />
          <span className="text-[10px] font-medium">Home</span>
        </Link>
        <Link to="/vip/wishlist" className={`flex flex-col items-center space-y-1 transition-colors relative ${location.pathname === '/vip/wishlist' ? 'text-purple-500' : 'text-gray-500 hover:text-purple-500'}`}>
          <Heart className="h-6 w-6" />
          {wishlist.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold rounded-full h-4 w-4 flex items-center justify-center border border-gray-900">
              {wishlist.length}
            </span>
          )}
          <span className="text-[10px] font-medium">Wishlist</span>
        </Link>
        <Link to="/vip/cart" className={`flex flex-col items-center space-y-1 transition-colors relative ${location.pathname === '/vip/cart' ? 'text-purple-500' : 'text-gray-500 hover:text-purple-500'}`}>
          <ShoppingCart className="h-6 w-6" />
          {vipCart.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-[8px] font-bold rounded-full h-4 w-4 flex items-center justify-center border border-gray-900">
              {vipCart.reduce((acc, item) => acc + item.quantity, 0)}
            </span>
          )}
          <span className="text-[10px] font-medium">Cart</span>
        </Link>
        <Link to="/vip/profile" className={`flex flex-col items-center space-y-1 transition-colors ${location.pathname === '/vip/profile' ? 'text-purple-500' : 'text-gray-500 hover:text-purple-500'}`}>
          <UserIcon className="h-6 w-6" />
          <span className="text-[10px] font-medium">Profile</span>
        </Link>
      </nav>
    </div>
  );
}
