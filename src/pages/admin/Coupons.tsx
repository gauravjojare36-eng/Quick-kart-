import { useState, useEffect, FormEvent } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { Plus, Trash2, Ticket, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from '../../components/ConfirmModal';

interface Coupon {
  id: string;
  code: string;
  discountPercentage: number;
  expiryDate: string;
}

export default function AdminCoupons() {
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discountPercentage: '',
    expiryDate: ''
  });

  const fetchCoupons = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'coupons'));
      const fetchedCoupons = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Coupon[];
      setCoupons(fetchedCoupons);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleAddCoupon = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'coupons'), {
        code: newCoupon.code.toUpperCase(),
        discountPercentage: Number(newCoupon.discountPercentage),
        expiryDate: new Date(newCoupon.expiryDate).toISOString()
      });
      setIsAdding(false);
      setNewCoupon({ code: '', discountPercentage: '', expiryDate: '' });
      fetchCoupons();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'coupons');
    }
  };

  const handleDelete = async () => {
    if (deletingId) {
      try {
        await deleteDoc(doc(db, 'coupons', deletingId));
        fetchCoupons();
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `coupons/${deletingId}`);
      } finally {
        setDeletingId(null);
      }
    }
  };

  if (loading) return <div>Loading coupons...</div>;

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
        <h1 className="text-2xl font-bold text-gray-900">Coupons Management</h1>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Coupon
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
          <h2 className="text-xl font-bold mb-4">Add New Coupon</h2>
          <form onSubmit={handleAddCoupon} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code</label>
                <input required type="text" value={newCoupon.code} onChange={e => setNewCoupon({...newCoupon, code: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md uppercase" placeholder="SUMMER50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
                <input required type="number" min="1" max="100" value={newCoupon.discountPercentage} onChange={e => setNewCoupon({...newCoupon, discountPercentage: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                <input required type="date" value={newCoupon.expiryDate} onChange={e => setNewCoupon({...newCoupon, expiryDate: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md" />
              </div>
            </div>
            <div className="flex justify-end space-x-4 pt-4">
              <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Save Coupon</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="p-4 font-semibold text-gray-600">Code</th>
              <th className="p-4 font-semibold text-gray-600">Discount</th>
              <th className="p-4 font-semibold text-gray-600">Expiry Date</th>
              <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map(coupon => (
              <tr key={coupon.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="p-4 flex items-center space-x-3">
                  <Ticket className="w-5 h-5 text-orange-500" />
                  <span className="font-bold text-gray-900 uppercase tracking-wider">{coupon.code}</span>
                </td>
                <td className="p-4 font-bold text-green-600">{coupon.discountPercentage}% OFF</td>
                <td className="p-4 text-gray-600">{format(new Date(coupon.expiryDate), 'MMM dd, yyyy')}</td>
                <td className="p-4 text-right">
                  <button onClick={() => setDeletingId(coupon.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {coupons.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">No coupons found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <ConfirmModal
        isOpen={!!deletingId}
        title="Delete Coupon"
        message="Are you sure you want to delete this coupon? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
