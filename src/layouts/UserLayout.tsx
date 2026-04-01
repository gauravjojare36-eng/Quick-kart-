import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Heart, User as UserIcon, LogOut, Search, Menu, Sparkles, Crown, MessageCircle, Home as HomeIcon, ShoppingBag, Phone } from 'lucide-react';
import { useStore } from '../store/useStore';
import { signInWithGoogle, logout, db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { getSmartSearchRecommendations } from '../services/ai';

export default function UserLayout() {
  const { user, cart, wishlist } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length > 2) {
        setIsSearching(true);
        setShowResults(true);
        try {
          const snapshot = await getDocs(collection(db, 'products'));
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
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <div className="bg-blue-600 p-1.5 rounded-lg">
                  <ShoppingBag className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-gray-900 tracking-tighter">
                  STAY<span className="text-blue-600">RAW</span>
                </span>
              </Link>
            </div>

            {/* Search Bar - Hidden on mobile */}
            <div className="hidden md:flex flex-1 max-w-lg mx-8 relative">
              <div className="relative w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.length > 2 && setShowResults(true)}
                  onBlur={() => setTimeout(() => setShowResults(false), 200)}
                  placeholder="Search for products, brands and more (AI Powered)"
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <Sparkles className="absolute right-3 top-2.5 h-5 w-5 text-purple-500" />
              </div>
              
              {/* AI Search Results Dropdown */}
              {showResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                  <div className="p-3 bg-purple-50 border-b border-purple-100 flex items-center text-purple-700 text-sm font-medium">
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI Smart Search Results
                  </div>
                  {isSearching ? (
                    <div className="p-4 text-center text-gray-500">Analyzing intent...</div>
                  ) : searchResults.length > 0 ? (
                    <div className="max-h-96 overflow-y-auto">
                      {searchResults.map(product => (
                        <Link 
                          key={product.id} 
                          to={`/product/${product.id}`}
                          onClick={() => { setShowResults(false); setSearchQuery(''); }}
                          className="flex items-center p-3 hover:bg-gray-50 border-b border-gray-50 last:border-0"
                        >
                          <img src={product.images?.[0] || 'https://picsum.photos/seed/product/50/50'} alt="" className="w-12 h-12 rounded-md object-cover mr-4" referrerPolicy="no-referrer" />
                          <div>
                            <div className="font-medium text-gray-900 line-clamp-1">{product.title}</div>
                            <div className="text-sm text-gray-500">₹{product.discountPrice || product.price}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500">No matching products found.</div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3 sm:space-x-6">
              <Link to="/vip" className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-bold text-[10px] uppercase tracking-wider hover:from-purple-700 hover:to-indigo-700 transition-all shadow-md">
                <Sparkles className="w-3.5 h-3.5" />
                <span>VIP</span>
              </Link>
              <Link to="/wishlist" className="p-2 bg-gray-100 rounded-full text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all relative">
                <Heart className="h-7 w-7" />
                {wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-white shadow-sm">
                    {wishlist.length}
                  </span>
                )}
              </Link>
              <Link to="/cart" className="flex items-center text-gray-600 hover:text-blue-600 relative">
                <ShoppingCart className="h-6 w-6" />
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-white shadow-sm">
                    {cart.reduce((acc, item) => acc + item.quantity, 0)}
                  </span>
                )}
              </Link>
              {user ? (
                <div className="hidden sm:flex items-center space-x-4">
                  <Link to="/profile" className="flex items-center text-gray-700 hover:text-blue-600">
                    <UserIcon className="h-5 w-5 mr-1" />
                    <span>{user.displayName?.split(' ')[0]}</span>
                  </Link>
                  <button onClick={handleLogout} className="text-gray-500 hover:text-red-500">
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleLogin}
                  className="hidden sm:block text-blue-600 font-medium hover:text-blue-800"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Mobile Search Bar - Only on home or search */}
        <div className="md:hidden px-4 pb-4 bg-white relative z-40">
          <div className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.length > 2 && setShowResults(true)}
              onBlur={() => setTimeout(() => setShowResults(false), 200)}
              placeholder="Search products (AI Powered)"
              className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm"
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Sparkles className="absolute right-3 top-3 h-4 w-4 text-purple-500" />
          </div>
          
          {/* Mobile AI Search Results Dropdown */}
          {showResults && (
            <div className="absolute top-full left-4 right-4 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
              <div className="p-2 bg-purple-50 border-b border-purple-100 flex items-center text-purple-700 text-xs font-medium">
                <Sparkles className="w-3 h-3 mr-1" />
                AI Smart Search Results
              </div>
              {isSearching ? (
                <div className="p-3 text-center text-gray-500 text-sm">Analyzing intent...</div>
              ) : searchResults.length > 0 ? (
                <div className="max-h-60 overflow-y-auto">
                  {searchResults.map(product => (
                    <Link 
                      key={product.id} 
                      to={`/product/${product.id}`}
                      onClick={() => { setShowResults(false); setSearchQuery(''); }}
                      className="flex items-center p-2 hover:bg-gray-50 border-b border-gray-50 last:border-0"
                    >
                      <img src={product.images?.[0] || 'https://picsum.photos/seed/product/50/50'} alt="" className="w-10 h-10 rounded-md object-cover mr-3" referrerPolicy="no-referrer" />
                      <div>
                        <div className="font-medium text-gray-900 line-clamp-1 text-sm">{product.title}</div>
                        <div className="text-xs text-gray-500">₹{product.discountPrice || product.price}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-3 text-center text-gray-500 text-sm">No matching products found.</div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8 pb-24 md:pb-8">
        <Outlet />
      </main>

      {/* Bottom Navigation (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 flex justify-between items-center z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <Link to="/" className={`flex flex-col items-center space-y-1 transition-colors ${location.pathname === '/' ? 'text-blue-600' : 'text-gray-400 hover:text-blue-600'}`}>
          <HomeIcon className="h-6 w-6" />
          <span className="text-[10px] font-medium">Home</span>
        </Link>
        <Link to="/wishlist" className={`flex flex-col items-center space-y-1 transition-colors relative ${location.pathname === '/wishlist' ? 'text-blue-600' : 'text-gray-400 hover:text-blue-600'}`}>
          <Heart className="h-6 w-6" />
          {wishlist.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold rounded-full h-4 w-4 flex items-center justify-center border border-white">
              {wishlist.length}
            </span>
          )}
          <span className="text-[10px] font-medium">Wishlist</span>
        </Link>
        <Link to="/cart" className={`flex flex-col items-center space-y-1 transition-colors relative ${location.pathname === '/cart' ? 'text-blue-600' : 'text-gray-400 hover:text-blue-600'}`}>
          <ShoppingCart className="h-6 w-6" />
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[8px] font-bold rounded-full h-4 w-4 flex items-center justify-center border border-white">
              {cart.reduce((acc, item) => acc + item.quantity, 0)}
            </span>
          )}
          <span className="text-[10px] font-medium">Cart</span>
        </Link>
        <Link to="/profile" className={`flex flex-col items-center space-y-1 transition-colors ${location.pathname === '/profile' ? 'text-blue-600' : 'text-gray-400 hover:text-blue-600'}`}>
          <UserIcon className="h-6 w-6" />
          <span className="text-[10px] font-medium">Profile</span>
        </Link>
      </nav>

      {/* Fixed Support Button */}
      <a 
        href="tel:9595344699" 
        className="fixed bottom-24 left-4 bg-gray-900 text-white p-3 rounded-full shadow-lg hover:bg-gray-800 transition-all z-50 flex items-center justify-center"
        title="Support"
      >
        <Phone className="h-6 w-6" />
      </a>
    </div>
  );
}
