import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { useStore } from '../../store/useStore';
import { Heart, ArrowLeft, Filter, Sparkles } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  price: number;
  discountPrice?: number;
  images: string[];
  category: string;
}

export default function Shop() {
  const { isVipMode, wishlist, toggleWishlist } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const prefix = isVipMode ? 'vip_' : '';
      try {
        const q = query(collection(db, `${prefix}products`));
        const snapshot = await getDocs(q);
        setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[]);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `${prefix}products`);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [isVipMode]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link 
            to={isVipMode ? '/vip' : '/'} 
            className={`p-2 rounded-full ${isVipMode ? 'hover:bg-purple-100 text-purple-600' : 'hover:bg-blue-100 text-blue-600'} transition-colors`}
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              {isVipMode ? 'VIP Bulk ' : ''}All Products
            </h1>
            <p className="text-gray-500 text-sm">{products.length} products found</p>
          </div>
        </div>
        <button className={`flex items-center space-x-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors`}>
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filter</span>
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="animate-pulse bg-white rounded-xl p-3 md:p-4 shadow-sm">
              <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {products.map(product => (
            <Link 
              key={product.id} 
              to={`${isVipMode ? '/vip' : ''}/product/${product.id}`} 
              className="group bg-white rounded-2xl p-2 md:p-3 shadow-sm hover:shadow-xl transition-all border border-gray-50 flex flex-col h-full relative overflow-hidden"
            >
              <div className="relative aspect-[3/4] mb-3 overflow-hidden rounded-xl bg-gray-50 flex-shrink-0">
                <img 
                  src={product.images[0] || 'https://picsum.photos/seed/product/400/400'} 
                  alt={product.title}
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleWishlist(product.id);
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-all z-10"
                >
                  <Heart className={`w-4 h-4 ${wishlist.includes(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                </button>
                {product.discountPrice && (
                  <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                    {Math.round(((product.price - (product.discountPrice || 0)) / product.price) * 100)}% OFF
                  </div>
                )}
              </div>
              <div className="flex flex-col flex-grow text-center px-1 pb-2">
                <h3 className="font-bold text-gray-900 text-sm md:text-base line-clamp-1 mb-1">{product.title}</h3>
                <p className="text-[10px] text-gray-400 mb-2 uppercase tracking-tighter">{product.category}</p>
                <div className="mt-auto flex items-center justify-between">
                   <div className="flex flex-col text-left">
                      {product.discountPrice && (
                        <span className="text-[10px] text-gray-400 line-through font-medium">₹{product.price}</span>
                      )}
                      <span className={`font-black text-sm md:text-base ${isVipMode ? 'text-purple-600' : 'text-blue-600'}`}>
                        ₹{product.discountPrice || product.price}
                      </span>
                    </div>
                    <div className={`w-8 h-8 rounded-xl ${isVipMode ? 'bg-purple-600' : 'bg-gray-900'} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <Sparkles className="w-4 h-4" />
                    </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <p className="text-gray-500 text-lg">No products found.</p>
          <Link 
            to={isVipMode ? '/vip' : '/'} 
            className={`mt-4 inline-block font-bold ${isVipMode ? 'text-purple-600' : 'text-blue-600'} hover:underline`}
          >
            Back to Home
          </Link>
        </div>
      )}
    </div>
  );
}
