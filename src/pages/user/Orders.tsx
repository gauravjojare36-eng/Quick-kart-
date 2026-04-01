import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { useStore } from '../../store/useStore';
import { Package, Clock, CheckCircle2, XCircle, ArrowLeft, RotateCcw, AlertCircle, X, Loader2 } from 'lucide-react';
import { format, differenceInHours } from 'date-fns';

import { useNavigate } from 'react-router-dom';

interface Order {
  id: string;
  items: any[];
  totalAmount: number;
  status: string;
  createdAt: string;
  deliveredAt?: string;
}

export default function Orders() {
  const { user, isVipMode } = useStore();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [returnConfirmOrder, setReturnConfirmOrder] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [processingReturn, setProcessingReturn] = useState(false);
  const [returnSuccess, setReturnSuccess] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      const collectionName = isVipMode ? 'vip_orders' : 'orders';
      try {
        const q = query(
          collection(db, collectionName),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const fetchedOrders = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Order[];
        setOrders(fetchedOrders);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, collectionName);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, isVipMode]);

  if (!user) return <div className="text-center py-20">Please login to view {isVipMode ? 'VIP ' : ''}orders.</div>;
  if (loading) return <div className="text-center py-20">Loading {isVipMode ? 'VIP ' : ''}orders...</div>;

  if (orders.length === 0) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <Package className={`w-24 h-24 ${isVipMode ? 'text-purple-300' : 'text-gray-300'} mb-6`} />
        <h2 className="text-3xl font-bold text-gray-900 mb-4">No {isVipMode ? 'VIP ' : ''}Orders Yet</h2>
        <p className="text-lg text-gray-500 mb-8">Looks like you haven't placed any {isVipMode ? 'bulk ' : ''}orders yet.</p>
        <a href={isVipMode ? '/vip' : '/'} className={`${isVipMode ? 'bg-purple-600' : 'bg-blue-600'} text-white px-8 py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-colors shadow-md`}>
          Start Shopping
        </a>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending': return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'Processing': return <Package className="w-5 h-5 text-purple-500" />;
      case 'Shipped': return <Package className="w-5 h-5 text-blue-500" />;
      case 'Delivered': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'Cancelled': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'Return Requested': return <RotateCcw className="w-5 h-5 text-orange-500" />;
      case 'Returned': return <RotateCcw className="w-5 h-5 text-gray-500" />;
      case 'Return Rejected': return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
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

  const handleReturnRequest = async (orderId: string) => {
    if (!returnReason.trim()) return;
    setProcessingReturn(true);
    const collectionName = isVipMode ? 'vip_orders' : 'orders';
    try {
      await updateDoc(doc(db, collectionName, orderId), {
        status: 'Return Requested',
        returnRequestedAt: new Date().toISOString(),
        returnReason: returnReason.trim()
      });
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: 'Return Requested' } : o));
      setReturnConfirmOrder(null);
      setReturnReason('');
      setReturnSuccess(true);
      setTimeout(() => setReturnSuccess(false), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${collectionName}/${orderId}`);
    } finally {
      setProcessingReturn(false);
    }
  };

  const canRequestReturn = (order: Order) => {
    if (order.status !== 'Delivered' || !order.deliveredAt) return false;
    const deliveredDate = new Date(order.deliveredAt);
    const hoursSinceDelivery = differenceInHours(new Date(), deliveredDate);
    return hoursSinceDelivery <= 48; // 2 days = 48 hours
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <button 
        onClick={() => navigate(isVipMode ? '/vip/profile' : '/profile')}
        className={`flex items-center space-x-2 ${isVipMode ? 'text-purple-600 hover:text-purple-700' : 'text-blue-600 hover:text-blue-700'} font-bold transition-colors group`}
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span>Back to Profile</span>
      </button>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">My {isVipMode ? 'VIP ' : ''}Orders</h1>
        {isVipMode && (
          <span className="bg-purple-100 text-purple-700 px-4 py-2 rounded-full font-bold text-sm">
            Bulk Orders Only
          </span>
        )}
      </div>
      
      <div className="space-y-6">
        {orders.map(order => (
          <div key={order.id} className={`bg-white rounded-2xl shadow-sm border ${isVipMode ? 'border-purple-100' : 'border-gray-100'} overflow-hidden`}>
            <div className={`${isVipMode ? 'bg-purple-50' : 'bg-gray-50'} px-6 py-4 border-b ${isVipMode ? 'border-purple-100' : 'border-gray-100'} flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
              <div className="flex flex-col">
                <span className="text-sm text-gray-500 uppercase tracking-wider font-semibold mb-1">Order Placed</span>
                <span className="text-gray-900 font-medium">{format(new Date(order.createdAt), 'MMM dd, yyyy')}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-gray-500 uppercase tracking-wider font-semibold mb-1">Total</span>
                <span className="text-gray-900 font-bold">₹{order.totalAmount}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-gray-500 uppercase tracking-wider font-semibold mb-1">Order #</span>
                <span className="text-gray-900 font-mono text-sm">{order.id}</span>
              </div>
            </div>
            
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(order.status)}
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                
                {canRequestReturn(order) && (
                  <button
                    onClick={() => setReturnConfirmOrder(order.id)}
                    className="flex items-center space-x-2 text-orange-600 hover:text-orange-700 font-bold text-sm bg-orange-50 px-4 py-2 rounded-xl transition-colors border border-orange-100"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Request Return</span>
                  </button>
                )}
              </div>
              
              <div className="space-y-4">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                        {item.image ? (
                          <img src={item.image} alt={item.title || 'Product'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <Package className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 line-clamp-1">{item.title || `Product ID: ${item.productId}`}</h4>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="font-bold text-gray-900">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Return Confirmation Modal */}
      {returnConfirmOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <RotateCcw className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Request Return?</h3>
              <p className="text-gray-500 mb-4 text-sm">
                Please provide a reason for returning this order. Our team will review your request.
              </p>
              <textarea
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="Reason for return (e.g., Wrong size, Damaged product...)"
                className="w-full p-3 border border-gray-200 rounded-xl mb-6 focus:ring-2 focus:ring-orange-500 outline-none min-h-[100px] text-sm"
                required
              />
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setReturnConfirmOrder(null);
                    setReturnReason('');
                  }}
                  disabled={processingReturn}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleReturnRequest(returnConfirmOrder)}
                  disabled={processingReturn || !returnReason.trim()}
                  className={`flex-1 px-4 py-3 ${isVipMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-orange-500 hover:bg-orange-600'} text-white font-bold rounded-xl transition-colors shadow-md disabled:opacity-50 flex items-center justify-center`}
                >
                  {processingReturn ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Confirm Return'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {returnSuccess && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center space-x-2 z-50 animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-bold">Return request submitted successfully!</span>
        </div>
      )}
    </div>
  );
}
