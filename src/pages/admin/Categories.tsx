import { useState, useEffect, FormEvent } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { Plus, Trash2, Image as ImageIcon, Upload, ArrowLeft } from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal';

import { useNavigate } from 'react-router-dom';

interface Category {
  id: string;
  name: string;
  image: string;
}

export default function AdminCategories() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  
  const [newCategory, setNewCategory] = useState({
    name: '',
    image: ''
  });

  const handleFileUpload = (file: File) => {
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
        
        // Compress to JPEG with 0.8 quality
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setNewCategory({...newCategory, image: dataUrl});
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const fetchCategories = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'categories'));
      const fetchedCategories = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Category[];
      setCategories(fetchedCategories);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategory = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'categories'), {
        name: newCategory.name,
        image: newCategory.image
      });
      setIsAdding(false);
      setNewCategory({ name: '', image: '' });
      fetchCategories();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'categories');
    }
  };

  const handleDelete = async () => {
    if (deletingId) {
      try {
        await deleteDoc(doc(db, 'categories', deletingId));
        fetchCategories();
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `categories/${deletingId}`);
      } finally {
        setDeletingId(null);
      }
    }
  };

  if (loading) return <div>Loading categories...</div>;

  return (
    <div className="space-y-6">
      <button 
        onClick={() => navigate('/admin')}
        className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-bold transition-colors group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span>Back to Dashboard</span>
      </button>

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Categories Management</h1>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Category
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
          <h2 className="text-xl font-bold mb-4">Add New Category</h2>
          <form onSubmit={handleAddCategory} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input required type="text" value={newCategory.name} onChange={e => setNewCategory({...newCategory, name: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image URL or Upload</label>
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <input 
                    type="text" 
                    value={newCategory.image.startsWith('data:image') ? 'Uploaded Image' : newCategory.image} 
                    onChange={e => setNewCategory({...newCategory, image: e.target.value})} 
                    className="flex-1 p-2 border border-gray-300 rounded-md" 
                    placeholder="Image URL or upload file..." 
                    readOnly={newCategory.image.startsWith('data:image')}
                  />
                  <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 p-2 rounded-md border border-gray-300 flex items-center justify-center transition-colors" title="Upload Image">
                    <Upload className="w-5 h-5 text-gray-600" />
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileUpload(e.target.files[0]);
                        }
                      }} 
                    />
                  </label>
                </div>
                {newCategory.image && (
                  <div className="w-24 h-24 bg-gray-100 rounded-md overflow-hidden border border-gray-200">
                    <img src={newCategory.image} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-4 pt-4">
              <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Save Category</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="p-4 font-semibold text-gray-600">Category</th>
              <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(category => (
              <tr key={category.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="p-4 flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                    {category.image ? (
                      <img src={category.image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <ImageIcon className="w-6 h-6 m-3 text-gray-400" />
                    )}
                  </div>
                  <span className="font-medium text-gray-900">{category.name}</span>
                </td>
                <td className="p-4 text-right">
                  <button onClick={() => setDeletingId(category.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={2} className="p-8 text-center text-gray-500">No categories found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <ConfirmModal
        isOpen={!!deletingId}
        title="Delete Category"
        message="Are you sure you want to delete this category? This action cannot be undone."
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
