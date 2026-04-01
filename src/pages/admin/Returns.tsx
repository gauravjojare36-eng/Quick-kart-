import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, orderBy, query, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { format } from 'date-fns';
import { Package, Clock, CheckCircle2, XCircle, Eye, X, Phone, MapPin, User, ArrowLeft, RotateCcw, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Order {
  id: string;
  userId: string;
  customerName?: string;
  phoneNumber?: string;
  fullAddress?: string;
  zipCode?: string;
  items: any[];
  totalAmount: number;
  status: string;
  shippingAddress: string;
  paymentMethod: string;
  createdAt: string;
  deliveredAt?: string;
  returnRequestedAt?: string;
  returnReason?: string;
}

export default function AdminReturns() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchReturns = async () => {
    try {
      const q = query(
        collection(db, 'orders'), 
        where('status', 'in', ['Return Requested', 'Returned', 'Return Rejected']),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const fetchedOrders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      setOrders(fetchedOrders);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status: newStatus });
      fetchReturns();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Return Requested': return 'bg-orange-100 text-orange-800';
      case 'Returned': return 'bg-gray-100 text-gray-800';
      case 'Return Rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="p-8 text-center">Loading return requests...</div>;

  return (
    <div className="space-y-6">
      <button 
        onClick={() => navigate('/admin')}
        className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-bold transition-colors group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span>Back to Dashboard</span>
      </button>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Return Requests</h1>
        <div className="bg-orange-100 text-orange-700 px-4 py-2 rounded-full font-bold text-sm flex items-center">
          <RotateCcw className="w-4 h-4 mr-2" />
          {orders.length} Pending Returns
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="p-4 font-semibold text-gray-600">Order ID</th>
              <th className="p-4 font-semibold text-gray-600">Request Date</th>
              <th className="p-4 font-semibold text-gray-600">Customer</th>
              <th className="p-4 font-semibold text-gray-600">Reason</th>
              <th className="p-4 font-semibold text-gray-600">Status</th>
              <th className="p-4 font-semibold text-gray-600 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="p-4 font-mono text-sm text-gray-600">{order.id.slice(0, 8)}...</td>
                <td className="p-4 text-gray-600">
                  {order.returnRequestedAt ? format(new Date(order.returnRequestedAt), 'MMM dd, yyyy') : 'N/A'}
                </td>
                <td className="p-4">
                  <div className="flex flex-col">
                    <span className="text-gray-900 font-medium">{order.customerName || 'N/A'}</span>
                    <span className="text-xs text-gray-500">{order.phoneNumber || 'No Phone'}</span>
                  </div>
                </td>
                <td className="p-4">
                  <p className="text-sm text-gray-600 line-clamp-1 max-w-[200px]" title={order.returnReason}>
                    {order.returnReason || 'No reason provided'}
                  </p>
                </td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  <button 
                    onClick={() => setSelectedOrder(order)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    className="p-2 border border-gray-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Return Requested">Return Requested</option>
                    <option value="Returned">Returned</option>
                    <option value="Return Rejected">Return Rejected</option>
                  </select>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">No return requests found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Return Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-orange-50">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <RotateCcw className="w-5 h-5 mr-2 text-orange-600" />
                  Return Request Details
                </h2>
                <p className="text-sm text-gray-500 font-mono">#{selectedOrder.id}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-orange-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-8">
              {/* Return Reason Section */}
              <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                <h3 className="text-sm font-bold text-orange-800 uppercase tracking-wider mb-2">Reason for Return</h3>
                <p className="text-gray-700 font-medium italic">"{selectedOrder.returnReason || 'No reason provided'}"</p>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Customer Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center text-gray-700">
                      <User className="w-4 h-4 mr-3 text-gray-400" />
                      <span className="font-medium">{selectedOrder.customerName || 'N/A'}</span>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <Phone className="w-4 h-4 mr-3 text-gray-400" />
                      <span>{selectedOrder.phoneNumber || 'N/A'}</span>
                    </div>
                    <div className="flex items-start text-gray-700">
                      <MapPin className="w-4 h-4 mr-3 mt-1 text-gray-400 flex-shrink-0" />
                      <div>
                        <p>{selectedOrder.fullAddress || selectedOrder.shippingAddress}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Return Status</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Current Status:</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(selectedOrder.status)}`}>
                        {selectedOrder.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-gray-700">
                      <span className="text-gray-500">Placed On:</span>
                      <span>{format(new Date(selectedOrder.createdAt), 'MMM dd, yyyy')}</span>
                    </div>
                    {selectedOrder.deliveredAt && (
                      <div className="flex items-center justify-between text-gray-700">
                        <span className="text-gray-500">Delivered On:</span>
                        <span>{format(new Date(selectedOrder.deliveredAt), 'MMM dd, yyyy')}</span>
                      </div>
                    )}
                    {selectedOrder.returnRequestedAt && (
                      <div className="flex items-center justify-between text-gray-700">
                        <span className="text-gray-500">Requested On:</span>
                        <span>{format(new Date(selectedOrder.returnRequestedAt), 'MMM dd, yyyy HH:mm')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Returning Items</h3>
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex items-center p-4 border-b border-gray-50 last:border-0 bg-gray-50/30">
                      <img src={item.image} alt="" className="w-12 h-12 rounded-lg object-cover mr-4" referrerPolicy="no-referrer" />
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 line-clamp-1">{item.title}</p>
                        <p className="text-sm text-gray-500">₹{item.price} x {item.quantity}</p>
                      </div>
                      <p className="font-bold text-gray-900">₹{item.price * item.quantity}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => handleStatusChange(selectedOrder.id, 'Returned')}
                  className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-colors shadow-md"
                >
                  Approve Return
                </button>
                <button
                  onClick={() => handleStatusChange(selectedOrder.id, 'Return Rejected')}
                  className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-colors shadow-md"
                >
                  Reject Return
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
