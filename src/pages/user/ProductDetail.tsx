import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { useStore } from '../../store/useStore';
import { Star, ShoppingCart, Heart, ShieldCheck, Truck, RotateCcw, Crown, Sparkles, ChevronRight, ArrowLeft } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  price: number;
  discountPrice?: number;
  description: string;
  images: string[];
  category: string;
  rating: number;
  stock: number;
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, wishlist, isVipMode } = useStore();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(isVipMode ? 10 : 1);

  useEffect(() => {
    const fetchProductAndRelated = async () => {
      if (!id) return;
      const prefix = isVipMode ? 'vip_' : '';
      try {
        const docRef = doc(db, `${prefix}products`, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const productData = { id: docSnap.id, ...docSnap.data() } as Product;
          setProduct(productData);

          // Fetch related products
          const relatedQuery = query(
            collection(db, `${prefix}products`),
            where('category', '==', productData.category),
            limit(5)
          );
          const relatedSnap = await getDocs(relatedQuery);
          const related = relatedSnap.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as Product))
            .filter(p => p.id !== id);
          setRelatedProducts(related);
        } else {
          navigate(isVipMode ? '/vip' : '/');
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `${isVipMode ? 'vip_' : ''}products/${id}`);
      } finally {
        setLoading(false);
      }
    };

    fetchProductAndRelated();
  }, [id, navigate, isVipMode]);

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
      <div className={`w-12 h-12 border-4 ${isVipMode ? 'border-purple-600' : 'border-blue-600'} border-t-transparent rounded-full animate-spin`}></div>
      <p className="text-gray-500 font-bold animate-pulse">Loading Product Details...</p>
    </div>
  );
  
  if (!product) return null;

  const isWishlisted = wishlist.includes(product.id);
  const currentPrice = product.discountPrice || product.price;

  const handleAddToCart = () => {
    if (isVipMode && quantity < 10) {
      alert('Minimum 10 items required for VIP bulk orders.');
      return;
    }
    addToCart({
      productId: product.id,
      title: product.title,
      price: currentPrice,
      quantity: quantity,
      image: product.images?.[0] || 'https://picsum.photos/seed/product/400/400'
    }, isVipMode);
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)}
        className={`flex items-center space-x-2 ${isVipMode ? 'text-purple-600 hover:text-purple-700' : 'text-blue-600 hover:text-blue-700'} font-bold transition-colors group`}
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span>Back to Products</span>
      </button>

      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
          {/* Image Gallery */}
          <div className="p-4 md:p-8 space-y-6 bg-gray-50/50">
            <div className="aspect-[4/5] rounded-[2rem] overflow-hidden bg-white shadow-inner border border-gray-100 relative group">
              <img 
                src={product.images?.[selectedImage] || 'https://picsum.photos/seed/product/800/800'} 
                alt={product.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <button 
                onClick={() => toggleWishlist(product.id)}
                className="absolute top-6 right-6 p-4 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl hover:bg-white transition-all group/heart"
              >
                <Heart className={`w-6 h-6 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400 group-hover/heart:text-red-400'} transition-colors`} />
              </button>
              
              {product.discountPrice && (
                <div className="absolute top-6 left-6 bg-red-600 text-white text-xs font-black px-4 py-2 rounded-xl shadow-xl uppercase tracking-widest">
                  {Math.round(((product.price - product.discountPrice) / product.price) * 100)}% OFF
                </div>
              )}
            </div>
            
            {product.images?.length > 1 && (
              <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
                {product.images.map((img: string, idx: number) => (
                  <button 
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden border-4 transition-all ${selectedImage === idx ? `border-${isVipMode ? 'purple' : 'blue'}-600 scale-105 shadow-lg` : 'border-white hover:border-gray-200'}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="p-8 md:p-12 flex flex-col">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] ${isVipMode ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                  {product.category}
                </div>
                <div className="flex items-center space-x-1 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-100">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-yellow-800 font-black text-sm">{product.rating || '4.5'}</span>
                </div>
              </div>

              <h1 className="text-3xl md:text-5xl font-black text-gray-900 leading-tight tracking-tight">{product.title}</h1>
              
              <div className="flex items-baseline space-x-4">
                <span className="text-4xl md:text-5xl font-black text-gray-900">₹{currentPrice}</span>
                {product.discountPrice && (
                  <span className="text-xl text-gray-400 line-through font-bold">₹{product.price}</span>
                )}
                {isVipMode && (
                  <div className="flex items-center px-3 py-1 bg-purple-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">
                    <Crown className="w-3 h-3 mr-1.5" /> Bulk Price
                  </div>
                )}
              </div>

              <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-3">Description</h3>
                <p className="text-gray-600 leading-relaxed font-medium">{product.description}</p>
              </div>

              {isVipMode && (
                <div className="p-5 bg-purple-50 border-2 border-dashed border-purple-200 rounded-2xl flex items-center">
                  <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center mr-4 flex-shrink-0">
                    <Crown className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-purple-900 font-black text-sm uppercase tracking-tight">VIP Bulk Order Requirement</p>
                    <p className="text-purple-600 text-xs font-bold">A minimum of 10 items is required for this product.</p>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-8 py-4">
                <div className="flex flex-col space-y-2">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Quantity</span>
                  <div className="flex items-center bg-gray-100 rounded-2xl p-1 border border-gray-200">
                    <button 
                      onClick={() => setQuantity(prev => Math.max(isVipMode ? 10 : 1, prev - 1))}
                      className="w-10 h-10 rounded-xl bg-white shadow-sm hover:bg-gray-50 flex items-center justify-center font-bold text-gray-600 transition-colors"
                    >
                      -
                    </button>
                    <input 
                      type="number" 
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(isVipMode ? 10 : 1, parseInt(e.target.value) || (isVipMode ? 10 : 1)))}
                      className="w-16 bg-transparent text-center font-black text-gray-900 focus:outline-none"
                    />
                    <button 
                      onClick={() => setQuantity(prev => prev + 1)}
                      className="w-10 h-10 rounded-xl bg-white shadow-sm hover:bg-gray-50 flex items-center justify-center font-bold text-gray-600 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-2 flex-1 w-full">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Availability</span>
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full ${product.stock > 0 ? 'bg-green-500 animate-pulse' : 'bg-red-500'} mr-2`}></div>
                    <span className={`font-bold ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {product.stock > 0 ? `In Stock (${product.stock} units)` : 'Out of Stock'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button 
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className={`group relative flex items-center justify-center px-8 py-5 rounded-2xl font-black text-lg transition-all overflow-hidden shadow-xl hover:shadow-2xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${isVipMode ? 'bg-purple-600 text-white' : 'bg-gray-900 text-white'}`}
              >
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                <ShoppingCart className="w-6 h-6 mr-3 relative z-10" />
                <span className="relative z-10">Add to Cart</span>
              </button>
              <button 
                onClick={() => { handleAddToCart(); navigate(isVipMode ? '/vip/checkout' : '/checkout'); }}
                disabled={product.stock <= 0}
                className={`flex items-center justify-center px-8 py-5 rounded-2xl font-black text-lg transition-all shadow-xl hover:shadow-2xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${isVipMode ? 'bg-indigo-600 text-white' : 'bg-orange-500 text-white'}`}
              >
                <Sparkles className="w-6 h-6 mr-3" />
                Buy Now
              </button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 mt-12 pt-8 border-t border-gray-100">
              <div className="flex flex-col items-center text-center group">
                <div className={`w-12 h-12 rounded-2xl ${isVipMode ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Secure Checkout</span>
              </div>
              <div className="flex flex-col items-center text-center group">
                <div className={`w-12 h-12 rounded-2xl ${isVipMode ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <RotateCcw className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Easy Returns</span>
              </div>
              <div className="flex flex-col items-center text-center group">
                <div className={`w-12 h-12 rounded-2xl ${isVipMode ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <Truck className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fast Shipping</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-xl ${isVipMode ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'} flex items-center justify-center`}>
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">Related {isVipMode ? 'Bulk ' : ''}Products</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {relatedProducts.map(p => (
              <Link 
                key={p.id} 
                to={`${isVipMode ? '/vip' : ''}/product/${p.id}`} 
                className="group bg-white rounded-[2rem] p-3 shadow-sm hover:shadow-xl transition-all border border-gray-100 flex flex-col h-full relative overflow-hidden"
              >
                <div className="relative aspect-[3/4] mb-4 overflow-hidden rounded-[1.5rem] bg-gray-50 flex-shrink-0">
                  <img 
                    src={p.images[0]} 
                    alt={p.title}
                    className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex flex-col flex-grow px-2 pb-2">
                  <h3 className="font-bold text-gray-900 text-sm line-clamp-2 mb-3 leading-tight group-hover:text-blue-600 transition-colors">{p.title}</h3>
                  <div className="mt-auto flex items-center justify-between">
                    <span className={`font-black text-lg ${isVipMode ? 'text-purple-700' : 'text-gray-900'}`}>
                      ₹{p.discountPrice || p.price}
                    </span>
                    <div className={`w-8 h-8 rounded-xl ${isVipMode ? 'bg-purple-600' : 'bg-gray-900'} text-white flex items-center justify-center shadow-lg`}>
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
