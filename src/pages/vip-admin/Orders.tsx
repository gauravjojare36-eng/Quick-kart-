import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, orderBy, query } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { format } from 'date-fns';
import { Package, Clock, CheckCircle2, XCircle, Crown, Eye, X, User, Phone, MapPin, ArrowLeft } from 'lucide-react';

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
  isVipOrder?: boolean;
  deliveredAt?: string;
  returnRequestedAt?: string;
}

export default function VipAdminOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
    try {
      const q = query(collection(db, 'vip_orders'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const fetchedOrders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      setOrders(fetchedOrders);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'vip_orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const orderRef = doc(db, 'vip_orders', orderId);
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'Delivered') {
        updateData.deliveredAt = new Date().toISOString();
      }
      
      await updateDoc(orderRef, updateData);
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, ...updateData } : null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `vip_orders/${orderId}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Processing': return 'bg-purple-100 text-purple-800';
      case 'Shipped': return 'bg-blue-100 text-blue-800';
      case 'Delivered': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      case 'Return Requested': return 'bg-orange-100 text-orange-800';
      case 'Returned': return 'bg-gray-100 text-gray-800';
      case 'Return Rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]">Loading VIP orders...</div>;

  return (
    <div className="space-y-6">
      <button 
        onClick={() => navigate('/vip-admin')}
        className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 font-bold transition-colors group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span>Back to Dashboard</span>
      </button>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">VIP Bulk Orders Management</h1>
        <div className="flex items-center bg-purple-100 text-purple-700 px-4 py-2 rounded-full font-bold text-sm">
          <Crown className="w-4 h-4 mr-2" />
          Bulk Orders
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-purple-50 border-b border-purple-100">
              <th className="p-4 font-semibold text-purple-900">Order ID</th>
              <th className="p-4 font-semibold text-purple-900">Date</th>
              <th className="p-4 font-semibold text-purple-900">Customer</th>
              <th className="p-4 font-semibold text-purple-900">Items</th>
              <th className="p-4 font-semibold text-purple-900">Total</th>
              <th className="p-4 font-semibold text-purple-900">Status</th>
              <th className="p-4 font-semibold text-purple-900 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="p-4 font-mono text-sm text-gray-600">{order.id.slice(0, 8)}...</td>
                <td className="p-4 text-gray-600">{format(new Date(order.createdAt), 'MMM dd, yyyy')}</td>
                <td className="p-4">
                  <div className="flex flex-col">
                    <span className="text-gray-900 font-medium">{order.customerName || 'N/A'}</span>
                    <span className="text-xs text-gray-500">{order.phoneNumber || 'No Phone'}</span>
                  </div>
                </td>
                <td className="p-4 text-gray-600">
                  {order.items.reduce((acc, item) => acc + item.quantity, 0)} units
                </td>
                <td className="p-4 font-bold text-gray-900">₹{order.totalAmount}</td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  <button 
                    onClick={() => setSelectedOrder(order)}
                    className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    className="p-2 border border-gray-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Return Requested">Return Requested</option>
                    <option value="Returned">Returned</option>
                    <option value="Return Rejected">Return Rejected</option>
                  </select>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">No VIP orders found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-purple-100 flex justify-between items-center bg-purple-50">
              <div>
                <h2 className="text-xl font-bold text-purple-900">VIP Order Details</h2>
                <p className="text-sm text-purple-500 font-mono">#{selectedOrder.id}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-purple-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-purple-500" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-8">
              {/* Return Reason Section */}
              {selectedOrder.status === 'Return Requested' && selectedOrder.returnReason && (
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                  <h3 className="text-sm font-bold text-purple-800 uppercase tracking-wider mb-2">Reason for Return</h3>
                  <p className="text-gray-700 font-medium italic">"{selectedOrder.returnReason}"</p>
                </div>
              )}

              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Customer Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center text-gray-700">
                      <User className="w-4 h-4 mr-3 text-purple-400" />
                      <span className="font-medium">{selectedOrder.customerName || 'N/A'}</span>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <Phone className="w-4 h-4 mr-3 text-purple-400" />
                      <span>{selectedOrder.phoneNumber || 'N/A'}</span>
                    </div>
                    <div className="flex items-start text-gray-700">
                      <MapPin className="w-4 h-4 mr-3 mt-1 text-purple-400 flex-shrink-0" />
                      <div>
                        <p>{selectedOrder.fullAddress || selectedOrder.shippingAddress}</p>
                        <p className="text-sm text-gray-500 mt-1">ZIP: {selectedOrder.zipCode || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Order Status</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Current Status:</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(selectedOrder.status)}`}>
                        {selectedOrder.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-gray-700">
                      <span className="text-gray-500">Payment:</span>
                      <span className="font-bold">{selectedOrder.paymentMethod}</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-700">
                      <span className="text-gray-500">Placed On:</span>
                      <span>{format(new Date(selectedOrder.createdAt), 'MMM dd, yyyy HH:mm')}</span>
                    </div>
                    {selectedOrder.deliveredAt && (
                      <div className="flex items-center justify-between text-gray-700">
                        <span className="text-gray-500">Delivered On:</span>
                        <span>{format(new Date(selectedOrder.deliveredAt), 'MMM dd, yyyy HH:mm')}</span>
                      </div>
                    )}
                    {selectedOrder.returnRequestedAt && (
                      <div className="flex items-center justify-between text-gray-700">
                        <span className="text-gray-500">Return Requested:</span>
                        <span>{format(new Date(selectedOrder.returnRequestedAt), 'MMM dd, yyyy HH:mm')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Order Items</h3>
                <div className="border border-purple-50 rounded-xl overflow-hidden">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex items-center p-4 border-b border-purple-50 last:border-0 bg-purple-50/10">
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

              {/* Total */}
              <div className="flex justify-between items-center p-4 bg-purple-900 text-white rounded-xl">
                <span className="text-lg font-bold">Total Amount</span>
                <span className="text-2xl font-black">₹{selectedOrder.totalAmount}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
