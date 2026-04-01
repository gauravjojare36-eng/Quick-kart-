import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, limit, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { Star, TrendingUp, Sparkles, Tags, Heart } from 'lucide-react';
import { useStore } from '../../store/useStore';

interface Product {
  id: string;
  title: string;
  price: number;
  discountPrice?: number;
  images: string[];
  rating: number;
  category: string;
}

interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  isActive: boolean;
}

interface Category {
  id: string;
  name: string;
  image: string;
}

export default function Home() {
  const { isVipMode, wishlist, toggleWishlist } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [banners]);

  useEffect(() => {
    const fetchData = async () => {
      const prefix = isVipMode ? 'vip_' : '';
      try {
        const [productsSnap, trendingSnap, bannersSnap, categoriesSnap] = await Promise.all([
          getDocs(query(collection(db, `${prefix}products`), limit(10))),
          getDocs(query(collection(db, `${prefix}products`), where('isTrending', '==', true), limit(5))),
          getDocs(query(collection(db, `${prefix}banners`), where('isActive', '==', true))),
          getDocs(collection(db, `${prefix}categories`))
        ]);

        setProducts(productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[]);
        setTrendingProducts(trendingSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[]);
        setBanners(bannersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Banner[]);
        setCategories(categoriesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Category[]);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `${prefix}home_data`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isVipMode]);

  return (
    <div className="space-y-12">
      {/* Hero Banner */}
      {banners.length > 0 ? (
        <div className="relative rounded-2xl overflow-hidden shadow-xl aspect-[16/10] md:aspect-[21/8]">
          <div 
            className="flex transition-transform duration-1000 ease-in-out h-full"
            style={{ transform: `translateX(-${currentBannerIndex * 100}%)` }}
          >
            {banners.map((banner) => (
              <div key={banner.id} className="min-w-full h-full relative">
                <img 
                  src={banner.imageUrl} 
                  alt={banner.title} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-8 md:p-12">
                  <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4">{banner.title}</h1>
                  <Link 
                    to={`${isVipMode ? '/vip' : ''}/shop`}
                    className="bg-white text-gray-900 px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition-colors w-max shadow-lg inline-block"
                  >
                    Shop Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
          
          {/* Banner Indicators */}
          {banners.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentBannerIndex(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    currentBannerIndex === i ? 'bg-white w-6' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className={`relative ${isVipMode ? 'bg-purple-900' : 'bg-[#FF0000]'} rounded-2xl overflow-hidden shadow-xl min-h-[200px] md:min-h-[300px] flex items-center`}>
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="relative w-full px-6 py-8 md:px-12 flex flex-col md:flex-row items-center justify-between text-white">
            <div className="text-center md:text-left mb-6 md:mb-0">
              <h2 className="text-xl md:text-2xl font-bold uppercase tracking-wider mb-1">{isVipMode ? 'VIP Bulk' : 'Discount'}</h2>
              <p className="text-sm md:text-lg opacity-90 mb-4">{isVipMode ? 'Exclusive Bulk Deals' : 'Special discount'}</p>
              <Link 
                to={`${isVipMode ? '/vip' : ''}/shop`}
                className={`${isVipMode ? 'bg-purple-500' : 'bg-[#4D4DFF]'} text-white px-8 py-2.5 rounded-lg font-bold hover:opacity-90 transition-all shadow-lg text-sm md:text-base inline-block`}
              >
                Shop Now
              </Link>
            </div>
            <div className="relative flex flex-col items-center">
              <div className={`text-5xl md:text-8xl font-black italic uppercase leading-none tracking-tighter ${isVipMode ? 'text-purple-400' : 'text-yellow-400'} drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]`}>
                {isVipMode ? 'VIP' : 'SUPER'}<br/>SALE
              </div>
              <div className="mt-2 bg-white text-black px-4 py-1 rounded-full font-black text-xs md:text-sm uppercase tracking-widest">
                {isVipMode ? 'Bulk Only' : 'Up to 50% Off'}
              </div>
            </div>
          </div>
          <div className="absolute top-4 right-4 text-yellow-400 opacity-50">
            <Sparkles className="w-8 h-8" />
          </div>
        </div>
      )}

      {/* Categories */}
      {categories.length > 0 && (
        <section className="relative bg-white p-6 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-xl ${isVipMode ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'} flex items-center justify-center`}>
                <Tags className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Shop by {isVipMode ? 'VIP ' : ''}Category</h2>
            </div>
            <Link to={`${isVipMode ? '/vip' : ''}/categories`} className="text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors">View All</Link>
          </div>
          <div className="flex space-x-6 overflow-x-auto pb-6 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
            {categories.map(category => (
              <Link 
                key={category.id} 
                to={`${isVipMode ? '/vip' : ''}/category/${category.name}`}
                className="flex flex-col items-center space-y-4 flex-shrink-0 cursor-pointer group"
              >
                <div className={`w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-white overflow-hidden border-2 ${isVipMode ? 'border-purple-50 group-hover:border-purple-500' : 'border-gray-50 group-hover:border-blue-500'} transition-all shadow-sm p-1.5 relative`}>
                  <div className="w-full h-full rounded-2xl overflow-hidden relative">
                    {category.image ? (
                      <img src={category.image} alt={category.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300 font-black text-3xl">
                        {category.name.charAt(0)}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                  </div>
                </div>
                <span className={`text-sm font-black text-gray-700 group-hover:text-${isVipMode ? 'purple' : 'blue'}-600 transition-colors uppercase tracking-widest text-[10px] md:text-xs`}>{category.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Deals of the Day */}
      <section>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl ${isVipMode ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'} flex items-center justify-center`}>
              <Sparkles className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">{isVipMode ? 'VIP Bulk Deals' : 'Deals of the Day'}</h2>
          </div>
          <Link to={`${isVipMode ? '/vip' : ''}/shop`} className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${isVipMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'} text-white transition-all shadow-md hover:shadow-lg`}>
            Explore All
          </Link>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-3xl p-4 shadow-sm border border-gray-50">
                <div className="bg-gray-100 aspect-[4/5] rounded-2xl mb-4"></div>
                <div className="h-4 bg-gray-100 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-100 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {products.map(product => (
              <Link key={product.id} to={`${isVipMode ? '/vip' : ''}/product/${product.id}`} className="group bg-white rounded-[2rem] p-3 shadow-sm hover:shadow-xl transition-all border border-gray-100 flex flex-col h-full relative overflow-hidden">
                <div className="relative aspect-[3/4] mb-4 overflow-hidden rounded-[1.5rem] bg-gray-50 flex-shrink-0">
                  <img 
                    src={product.images[0] || 'https://picsum.photos/seed/product/400/400'} 
                    alt={product.title}
                    className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleWishlist(product.id);
                    }}
                    className="absolute top-3 right-3 p-2.5 bg-white/80 backdrop-blur-md rounded-full shadow-lg hover:bg-white transition-all z-10 group/heart hover:scale-105"
                  >
                    <Heart className={`w-5 h-5 ${wishlist.includes(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-600 group-hover/heart:text-red-500'} transition-colors`} />
                  </button>
                  
                  {product.discountPrice && (
                    <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg uppercase tracking-widest">
                      {Math.round(((product.price - product.discountPrice) / product.price) * 100)}% OFF
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col flex-grow px-2 pb-2">
                  <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${isVipMode ? 'text-purple-400' : 'text-blue-400'}`}>{product.category || 'Fashion'}</p>
                  <h3 className="font-bold text-gray-900 text-sm md:text-base line-clamp-2 mb-3 leading-tight group-hover:text-blue-600 transition-colors">{product.title}</h3>
                  
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex flex-col">
                      {product.discountPrice && (
                        <span className="text-[10px] text-gray-400 line-through font-medium">₹{product.price}</span>
                      )}
                      <span className={`font-black text-lg ${isVipMode ? 'text-purple-700' : 'text-gray-900'}`}>
                        ₹{product.discountPrice || product.price}
                      </span>
                    </div>
                    <div className={`w-10 h-10 rounded-2xl ${isVipMode ? 'bg-purple-600' : 'bg-gray-900'} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <Sparkles className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
            <p className="text-gray-400 font-bold">No {isVipMode ? 'VIP ' : ''}products found.</p>
          </div>
        )}
      </section>

      {/* Trending */}
      <section>
        <div className="flex items-center space-x-3 mb-8">
          <div className={`w-10 h-10 rounded-xl ${isVipMode ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'} flex items-center justify-center`}>
            <TrendingUp className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Trending {isVipMode ? 'Bulk' : 'Now'}</h2>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-3xl p-4 shadow-sm border border-gray-50">
                <div className="bg-gray-100 aspect-[4/5] rounded-2xl mb-4"></div>
                <div className="h-4 bg-gray-100 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-100 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : trendingProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {trendingProducts.map(product => (
              <Link key={product.id} to={`${isVipMode ? '/vip' : ''}/product/${product.id}`} className="group bg-white rounded-[2rem] p-3 shadow-sm hover:shadow-xl transition-all border border-gray-100 flex flex-col h-full relative overflow-hidden">
                <div className="relative aspect-[3/4] mb-4 overflow-hidden rounded-[1.5rem] bg-gray-50 flex-shrink-0">
                  <img 
                    src={product.images[0] || 'https://picsum.photos/seed/product/400/400'} 
                    alt={product.title}
                    className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleWishlist(product.id);
                    }}
                    className="absolute top-3 right-3 p-2.5 bg-white/80 backdrop-blur-md rounded-full shadow-lg hover:bg-white transition-all z-10 group/heart hover:scale-105"
                  >
                    <Heart className={`w-5 h-5 ${wishlist.includes(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-600 group-hover/heart:text-red-500'} transition-colors`} />
                  </button>
                  
                  <div className="absolute top-3 left-3 bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg uppercase tracking-widest flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1" /> TRENDING
                  </div>
                </div>
                
                <div className="flex flex-col flex-grow px-2 pb-2">
                  <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${isVipMode ? 'text-purple-400' : 'text-blue-400'}`}>{product.category || 'Fashion'}</p>
                  <h3 className="font-bold text-gray-900 text-sm md:text-base line-clamp-2 mb-3 leading-tight group-hover:text-blue-600 transition-colors">{product.title}</h3>
                  
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex flex-col">
                      {product.discountPrice && (
                        <span className="text-[10px] text-gray-400 line-through font-medium">₹{product.price}</span>
                      )}
                      <span className={`font-black text-lg ${isVipMode ? 'text-purple-700' : 'text-gray-900'}`}>
                        ₹{product.discountPrice || product.price}
                      </span>
                    </div>
                    <div className={`w-10 h-10 rounded-2xl ${isVipMode ? 'bg-purple-600' : 'bg-gray-900'} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <Sparkles className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
            <p className="text-gray-400 font-bold">No trending products yet.</p>
          </div>
        )}
      </section>
    </div>
  );
}
