import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { useStore } from '../../store/useStore';
import { ArrowLeft, Tags, ChevronRight } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  image: string;
}

export default function Categories() {
  const { isVipMode } = useStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      const prefix = isVipMode ? 'vip_' : '';
      try {
        const snapshot = await getDocs(collection(db, `${prefix}categories`));
        setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Category[]);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `${prefix}categories`);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [isVipMode]);

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-4">
        <Link 
          to={isVipMode ? '/vip' : '/'} 
          className={`p-2 rounded-full ${isVipMode ? 'hover:bg-purple-100 text-purple-600' : 'hover:bg-blue-100 text-blue-600'} transition-colors`}
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            {isVipMode ? 'VIP Bulk ' : ''}Categories
          </h1>
          <p className="text-gray-500 text-sm">Explore our collections</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse bg-white rounded-2xl h-48 shadow-sm"></div>
          ))}
        </div>
      ) : categories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map(category => (
            <Link 
              key={category.id} 
              to={`${isVipMode ? '/vip' : ''}/category/${category.name}`}
              className="group relative h-48 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all"
            >
              <img 
                src={category.image || 'https://picsum.photos/seed/category/800/400'} 
                alt={category.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-wider">{category.name}</h3>
                    <p className="text-white/60 text-xs font-bold uppercase tracking-widest mt-1">Shop Now</p>
                  </div>
                  <div className={`w-10 h-10 rounded-full bg-white text-gray-900 flex items-center justify-center group-hover:translate-x-2 transition-transform`}>
                    <ChevronRight className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <p className="text-gray-500 text-lg">No categories found.</p>
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
