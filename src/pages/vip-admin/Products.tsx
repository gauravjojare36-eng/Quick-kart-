import { useState, useEffect, FormEvent } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { Plus, Trash2, Edit, Image as ImageIcon, Upload, Crown, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from '../../components/ConfirmModal';

interface Product {
  id: string;
  title: string;
  price: number;
  stock: number;
  category: string;
  images: string[];
  isTrending?: boolean;
}

export default function VipAdminProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    discountPrice: '',
    stock: '',
    category: '',
    images: [''],
    isTrending: false
  });

  const handleAddImageField = () => {
    setFormData({ ...formData, images: [...formData.images, ''] });
  };

  const handleImageChange = (index: number, value: string) => {
    const updatedImages = [...formData.images];
    updatedImages[index] = value;
    setFormData({ ...formData, images: updatedImages });
  };

  const handleRemoveImageField = (index: number) => {
    const updatedImages = formData.images.filter((_, i) => i !== index);
    setFormData({ ...formData, images: updatedImages });
  };

  const handleFileUpload = (index: number, file: File) => {
    if (!file.type.startsWith('image/')) {
      setAlertMessage('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        handleImageChange(index, dataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const fetchProducts = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'vip_products'));
      const fetchedProducts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      setProducts(fetchedProducts);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'vip_products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const productData = {
        title: formData.title,
        description: formData.description,
        price: Number(formData.price),
        discountPrice: formData.discountPrice ? Number(formData.discountPrice) : null,
        stock: Number(formData.stock),
        category: formData.category,
        images: formData.images.map(s => s.trim()).filter(Boolean),
        isTrending: formData.isTrending,
        rating: 0,
        reviewsCount: 0,
        tags: [],
        isVip: true,
        minQuantity: 10,
        updatedAt: new Date().toISOString()
      };

      if (editingProduct) {
        await updateDoc(doc(db, 'vip_products', editingProduct.id), productData);
      } else {
        await addDoc(collection(db, 'vip_products'), {
          ...productData,
          createdAt: new Date().toISOString()
        });
      }

      setIsAdding(false);
      setEditingProduct(null);
      setFormData({ title: '', description: '', price: '', discountPrice: '', stock: '', category: '', images: [''], isTrending: false });
      fetchProducts();
    } catch (error) {
      handleFirestoreError(error, editingProduct ? OperationType.UPDATE : OperationType.CREATE, 'vip_products');
    }
  };

  const handleDelete = async () => {
    if (deletingId) {
      try {
        await deleteDoc(doc(db, 'vip_products', deletingId));
        fetchProducts();
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `vip_products/${deletingId}`);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      description: product.description,
      price: product.price.toString(),
      discountPrice: product.discountPrice?.toString() || '',
      stock: product.stock.toString(),
      category: product.category,
      images: product.images.length > 0 ? product.images : [''],
      isTrending: product.isTrending || false
    });
    setIsAdding(true);
  };

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]">Loading VIP products...</div>;

  return (
    <div className="space-y-6">
      <button 
        onClick={() => navigate('/vip-admin')}
        className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 font-bold transition-colors group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span>Back to VIP Dashboard</span>
      </button>

      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <h1 className="text-2xl font-bold text-gray-900">VIP Bulk Products</h1>
          <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold flex items-center">
            <Crown className="w-3 h-3 mr-1" />
            Min 10 Qty
          </span>
        </div>
        <button 
          onClick={() => {
            setIsAdding(!isAdding);
            setEditingProduct(null);
            setFormData({ title: '', description: '', price: '', discountPrice: '', stock: '', category: '', images: [''], isTrending: false });
          }}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Bulk Product
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
          <h2 className="text-xl font-bold mb-4 text-purple-900">{editingProduct ? 'Edit Bulk Product' : 'Add New Bulk Product'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bulk Price (₹)</label>
                  <input required type="number" min="0" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Price (₹)</label>
                  <input type="number" min="0" step="0.01" value={formData.discountPrice} onChange={e => setFormData({...formData, discountPrice: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500" />
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Available Stock</label>
                  <input required type="number" min="0" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input required type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500" />
                </div>
              </div>
              <div className="flex items-center space-x-2 py-2">
                <input 
                  type="checkbox" 
                  id="isTrending" 
                  checked={formData.isTrending} 
                  onChange={e => setFormData({...formData, isTrending: e.target.checked})}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <label htmlFor="isTrending" className="text-sm font-medium text-gray-700">Mark as Trending Now</label>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Images</label>
                {formData.images.map((img, index) => (
                  <div key={index} className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 flex items-center space-x-2">
                        <input
                          type="text"
                          value={img.startsWith('data:image') ? 'Uploaded Image' : img}
                          onChange={(e) => handleImageChange(index, e.target.value)}
                          placeholder="Image URL or upload file..."
                          className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                          required={index === 0 && !img}
                          readOnly={img.startsWith('data:image')}
                        />
                        <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 p-2 rounded-md border border-gray-300 flex items-center justify-center transition-colors" title="Upload Image">
                          <Upload className="w-5 h-5 text-gray-600" />
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleFileUpload(index, e.target.files[0]);
                              }
                            }} 
                          />
                        </label>
                      </div>
                      {formData.images.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveImageField(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-md"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                    {img && (
                      <div className="w-24 h-24 bg-gray-100 rounded-md overflow-hidden border border-gray-200">
                        <img src={img} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddImageField}
                  className="text-sm text-purple-600 font-medium hover:underline flex items-center mt-2"
                >
                  <Plus className="w-4 h-4 mr-1" /> Add another image
                </button>
              </div>
              <div className="flex justify-end space-x-4 pt-4">
                <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
                  {editingProduct ? 'Update Bulk Product' : 'Save Bulk Product'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-purple-50 border-b border-purple-100">
              <th className="p-4 font-semibold text-purple-900">Product</th>
              <th className="p-4 font-semibold text-purple-900">Category</th>
              <th className="p-4 font-semibold text-purple-900">Bulk Price</th>
              <th className="p-4 font-semibold text-purple-900">Stock</th>
              <th className="p-4 font-semibold text-purple-900">Trending</th>
              <th className="p-4 font-semibold text-purple-900 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="p-4 flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <ImageIcon className="w-6 h-6 m-3 text-gray-400" />
                    )}
                  </div>
                  <span className="font-medium text-gray-900 line-clamp-1">{product.title}</span>
                </td>
                <td className="p-4 text-gray-600">{product.category}</td>
                <td className="p-4 font-bold text-gray-900">₹{product.price}</td>
                <td className="p-4 text-gray-600">{product.stock}</td>
                <td className="p-4">
                  {product.isTrending && (
                    <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-[10px] font-bold uppercase">Trending</span>
                  )}
                </td>
                <td className="p-4 text-right space-x-2">
                  <button onClick={() => handleEdit(product)} className="p-2 text-purple-600 hover:bg-purple-50 rounded-md transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeletingId(product.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">No bulk products found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <ConfirmModal
        isOpen={!!deletingId}
        title="Delete Bulk Product"
        message="Are you sure you want to delete this bulk product? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />
      <ConfirmModal
        isOpen={!!alertMessage}
        title="Alert"
        message={alertMessage || ''}
        onConfirm={() => setAlertMessage(null)}
        onCancel={() => setAlertMessage(null)}
      />
    </div>
  );
}
