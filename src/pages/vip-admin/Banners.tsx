import { useState, useEffect, FormEvent } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { Plus, Trash2, Image as ImageIcon, Upload, Crown, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from '../../components/ConfirmModal';

interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  isActive: boolean;
}

export default function VipAdminBanners() {
  const navigate = useNavigate();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  
  const [newBanner, setNewBanner] = useState({
    title: '',
    imageUrl: '',
    isActive: true
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
        const MAX_WIDTH = 1200;
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
        setNewBanner({...newBanner, imageUrl: dataUrl});
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const fetchBanners = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'vip_banners'));
      const fetchedBanners = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Banner[];
      setBanners(fetchedBanners);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'vip_banners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleAddBanner = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'vip_banners'), {
        title: newBanner.title,
        imageUrl: newBanner.imageUrl,
        isActive: newBanner.isActive
      });
      setIsAdding(false);
      setNewBanner({ title: '', imageUrl: '', isActive: true });
      fetchBanners();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'vip_banners');
    }
  };

  const handleDelete = async () => {
    if (deletingId) {
      try {
        await deleteDoc(doc(db, 'vip_banners', deletingId));
        fetchBanners();
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `vip_banners/${deletingId}`);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'vip_banners', id), { isActive: !currentStatus });
      fetchBanners();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `vip_banners/${id}`);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]">Loading VIP banners...</div>;

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
          <h1 className="text-2xl font-bold text-gray-900">VIP Banners Management</h1>
          <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold flex items-center">
            <Crown className="w-3 h-3 mr-1" />
            Bulk Store
          </span>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add VIP Banner
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
          <h2 className="text-xl font-bold mb-4 text-purple-900">Add New VIP Banner</h2>
          <form onSubmit={handleAddBanner} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input required type="text" value={newBanner.title} onChange={e => setNewBanner({...newBanner, title: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image URL or Upload</label>
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <input 
                    required 
                    type="text" 
                    value={newBanner.imageUrl.startsWith('data:image') ? 'Uploaded Image' : newBanner.imageUrl} 
                    onChange={e => setNewBanner({...newBanner, imageUrl: e.target.value})} 
                    className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500" 
                    placeholder="Image URL or upload file..." 
                    readOnly={newBanner.imageUrl.startsWith('data:image')}
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
                {newBanner.imageUrl && (
                  <div className="w-48 h-24 bg-gray-100 rounded-md overflow-hidden border border-gray-200">
                    <img src={newBanner.imageUrl} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center">
              <input type="checkbox" id="isActive" checked={newBanner.isActive} onChange={e => setNewBanner({...newBanner, isActive: e.target.checked})} className="mr-2 text-purple-600 focus:ring-purple-500" />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active</label>
            </div>
            <div className="flex justify-end space-x-4 pt-4">
              <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">Save VIP Banner</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-purple-50 border-b border-purple-100">
              <th className="p-4 font-semibold text-purple-900">Banner</th>
              <th className="p-4 font-semibold text-purple-900">Status</th>
              <th className="p-4 font-semibold text-purple-900 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {banners.map(banner => (
              <tr key={banner.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="p-4 flex items-center space-x-4">
                  <div className="w-32 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                    {banner.imageUrl ? (
                      <img src={banner.imageUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <ImageIcon className="w-6 h-6 m-5 text-gray-400" />
                    )}
                  </div>
                  <span className="font-medium text-gray-900">{banner.title}</span>
                </td>
                <td className="p-4">
                  <button 
                    onClick={() => toggleStatus(banner.id, banner.isActive)}
                    className={`px-3 py-1 rounded-full text-xs font-bold ${banner.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                  >
                    {banner.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="p-4 text-right">
                  <button onClick={() => setDeletingId(banner.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {banners.length === 0 && (
              <tr>
                <td colSpan={3} className="p-8 text-center text-gray-500">No VIP banners found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <ConfirmModal
        isOpen={!!deletingId}
        title="Delete VIP Banner"
        message="Are you sure you want to delete this VIP banner? This action cannot be undone."
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
