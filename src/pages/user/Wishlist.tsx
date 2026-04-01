import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, where, documentId } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { Heart, ShoppingCart, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { motion } from 'motion/react';

import { useNavigate } from 'react-router-dom';

interface Product {
  id: string;
  title: string;
  price: number;
  discountPrice?: number;
  images: string[];
  category: string;
}

export default function Wishlist() {
  const { wishlist, toggleWishlist, addToCart, isVipMode } = useStore();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWishlistProducts = async () => {
      if (wishlist.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      try {
        const collectionName = isVipMode ? 'vip_products' : 'products';
        const q = query(collection(db, collectionName), where(documentId(), 'in', wishlist));
        const snapshot = await getDocs(q);
        setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[]);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, isVipMode ? 'vip_wishlist' : 'wishlist');
      } finally {
        setLoading(false);
      }
    };

    fetchWishlistProducts();
  }, [wishlist, isVipMode]);

  const handleAddToCart = (product: Product) => {
    addToCart({
      productId: product.id,
      title: product.title,
      price: product.discountPrice || product.price,
      quantity: isVipMode ? 10 : 1,
      image: product.images[0]
    }, isVipMode);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${isVipMode ? 'border-purple-600' : 'border-blue-600'}`}></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <button 
        onClick={() => navigate(isVipMode ? '/vip/profile' : '/profile')}
        className={`flex items-center space-x-2 ${isVipMode ? 'text-purple-600 hover:text-purple-700' : 'text-blue-600 hover:text-blue-700'} font-bold transition-colors group`}
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span>Back to Profile</span>
      </button>

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Heart className={`mr-3 h-8 w-8 ${isVipMode ? 'text-purple-600' : 'text-red-500'} fill-current`} />
          My Wishlist
        </h1>
        <span className="text-gray-500 font-medium">{products.length} Items</span>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${isVipMode ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'} mb-6`}>
            <Heart className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your wishlist is empty</h2>
          <p className="text-gray-500 mb-8 max-w-xs mx-auto">Save items you love to your wishlist and they'll appear here.</p>
          <Link
            to={isVipMode ? '/vip' : '/'}
            className={`inline-flex items-center px-8 py-3 rounded-full font-bold text-white transition-all ${isVipMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            Start Shopping
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {products.map((product) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={product.id}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center group"
            >
              <Link to={`${isVipMode ? '/vip' : ''}/product/${product.id}`} className="flex-shrink-0">
                <img
                  src={product.images[0]}
                  alt={product.title}
                  className="w-24 h-24 md:w-32 md:h-32 object-cover rounded-xl group-hover:scale-105 transition-transform"
                  referrerPolicy="no-referrer"
                />
              </Link>
              <div className="ml-4 md:ml-8 flex-grow">
                <Link to={`${isVipMode ? '/vip' : ''}/product/${product.id}`}>
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{product.title}</h3>
                </Link>
                <p className="text-sm text-gray-500 mb-2">{product.category}</p>
                <div className="flex items-center space-x-3">
                  <span className={`font-bold text-lg ${isVipMode ? 'text-purple-600' : 'text-blue-600'}`}>
                    ₹{product.discountPrice || product.price}
                  </span>
                  {product.discountPrice && (
                    <span className="text-sm text-gray-400 line-through">₹{product.price}</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-2">
                <button
                  onClick={() => handleAddToCart(product)}
                  className={`p-3 rounded-xl text-white transition-all shadow-md hover:shadow-lg ${isVipMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                  title="Add to Cart"
                >
                  <ShoppingCart className="h-5 w-5" />
                </button>
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className="p-3 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-all border border-red-100"
                  title="Remove from Wishlist"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
