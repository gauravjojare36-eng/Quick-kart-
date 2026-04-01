import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { useStore } from '../../store/useStore';
import { CheckCircle2, MapPin, CreditCard, ArrowLeft } from 'lucide-react';

export default function Checkout() {
  const { cart, vipCart, isVipMode, user, clearCart, appliedCoupon, setAppliedCoupon } = useStore();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState(user?.displayName || '');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const currentCart = isVipMode ? vipCart : cart;
  const subtotal = currentCart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const gstAmount = subtotal * 0.05;
  const deliveryCharges = 50;
  const discountAmount = appliedCoupon ? (subtotal * appliedCoupon.discountPercentage) / 100 : 0;
  const finalAmount = subtotal + gstAmount + deliveryCharges - discountAmount;

  if (!user) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">Please login to continue</h2>
        <button 
          onClick={() => navigate(isVipMode ? '/vip' : '/')} 
          className={`${isVipMode ? 'text-purple-600' : 'text-blue-600'} hover:underline font-medium`}
        >
          Go Home
        </button>
      </div>
    );
  }

  if (currentCart.length === 0 && !success) {
    navigate(isVipMode ? '/vip/cart' : '/cart');
    return null;
  }

  const handlePlaceOrder = async (e: FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phoneNumber.trim() || !address.trim() || !zipCode.trim()) return;

    if (!showReview) {
      setShowReview(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (isVipMode && currentCart.some(item => item.quantity < 10)) {
      alert('Some items in your cart do not meet the minimum bulk order quantity of 10.');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        userId: user.uid,
        customerName: fullName,
        phoneNumber: phoneNumber,
        fullAddress: address,
        zipCode: zipCode,
        items: currentCart.map(item => ({
          productId: item.productId,
          title: item.title,
          image: item.image,
          quantity: item.quantity,
          price: item.price
        })),
        totalAmount: finalAmount,
        subtotal: subtotal,
        gstAmount: gstAmount,
        deliveryCharges: deliveryCharges,
        discountAmount,
        couponCode: appliedCoupon?.code || null,
        status: 'Pending',
        shippingAddress: address,
        paymentMethod: 'COD',
        isVipOrder: isVipMode,
        createdAt: new Date().toISOString()
      };

      const collectionName = isVipMode ? 'vip_orders' : 'orders';
      await addDoc(collection(db, collectionName), orderData);
      clearCart(isVipMode);
      setAppliedCoupon(null);
      setSuccess(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, isVipMode ? 'vip_orders' : 'orders');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <CheckCircle2 className={`w-24 h-24 ${isVipMode ? 'text-purple-500' : 'text-green-500'} mb-6`} />
        <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Order Placed Successfully!</h2>
        <p className="text-xl text-gray-600 mb-8">Thank you for shopping with STAYRAW{isVipMode ? ' VIP' : ''}. Your order will be delivered soon.</p>
        <button 
          onClick={() => navigate(isVipMode ? '/vip/profile' : '/orders')}
          className={`${isVipMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'} text-white px-8 py-4 rounded-xl font-bold text-lg transition-colors shadow-md`}
        >
          View My Orders
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button 
        onClick={() => navigate(-1)}
        className={`flex items-center space-x-2 ${isVipMode ? 'text-purple-600 hover:text-purple-700' : 'text-blue-600 hover:text-blue-700'} font-bold transition-colors group`}
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span>Back to Cart</span>
      </button>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        {showReview ? 'Review Your Order' : `Checkout ${isVipMode ? '(VIP Bulk Store)' : ''}`}
      </h1>
      
      <form onSubmit={handlePlaceOrder} className="space-y-8">
        {showReview ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h2 className="text-xl font-bold text-gray-900">Delivery Details</h2>
              <button 
                type="button" 
                onClick={() => setShowReview(false)}
                className={`${isVipMode ? 'text-purple-600' : 'text-blue-600'} font-bold text-sm hover:underline`}
              >
                Edit
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wider font-bold mb-1">Full Name</p>
                <p className="text-gray-900 font-medium">{fullName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wider font-bold mb-1">Phone Number</p>
                <p className="text-gray-900 font-medium">{phoneNumber}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500 uppercase tracking-wider font-bold mb-1">Full Address</p>
                <p className="text-gray-900 font-medium">{address}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wider font-bold mb-1">Zip Code</p>
                <p className="text-gray-900 font-medium">{zipCode}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className={`w-8 h-8 ${isVipMode ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'} rounded-full flex items-center justify-center font-bold`}>1</div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-gray-400" />
                Delivery Details
              </h2>
            </div>
            
            <div className="ml-11 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className={`w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-${isVipMode ? 'purple' : 'blue'}-500 focus:border-transparent`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Enter your phone number"
                    className={`w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-${isVipMode ? 'purple' : 'blue'}-500 focus:border-transparent`}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Full Address</label>
                <textarea
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your full delivery address including street, city, state"
                  className={`w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-${isVipMode ? 'purple' : 'blue'}-500 focus:border-transparent min-h-[100px] resize-none`}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Zip Code</label>
                <input
                  type="text"
                  required
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  placeholder="Enter zip code"
                  className={`w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-${isVipMode ? 'purple' : 'blue'}-500 focus:border-transparent`}
                />
              </div>
            </div>
          </div>
        )}

        {/* Payment Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className={`w-8 h-8 ${isVipMode ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'} rounded-full flex items-center justify-center font-bold`}>2</div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <CreditCard className="w-5 h-5 mr-2 text-gray-400" />
              Payment Options
            </h2>
          </div>
          
          <div className="ml-11 space-y-4">
            <label className={`flex items-center space-x-4 p-4 border-2 ${isVipMode ? 'border-purple-600 bg-purple-50' : 'border-blue-600 bg-blue-50'} rounded-xl cursor-pointer`}>
              <input type="radio" name="payment" value="COD" checked readOnly className={`w-5 h-5 ${isVipMode ? 'text-purple-600 focus:ring-purple-500' : 'text-blue-600 focus:ring-blue-500'}`} />
              <div className="flex flex-col">
                <span className="font-bold text-gray-900">Cash on Delivery (COD)</span>
                <span className="text-sm text-gray-500">Pay when your order arrives</span>
              </div>
            </label>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          <div className="flex justify-between items-center border-b border-gray-100 pb-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900">Order Summary</h2>
            <span className="text-gray-500">{currentCart.length} Items</span>
          </div>
          
          <div className="space-y-4 mb-8">
            {currentCart.map(item => (
              <div key={item.productId} className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <span className="text-gray-500">{item.quantity}x</span>
                  <span className="font-medium text-gray-900 line-clamp-1 max-w-[120px] sm:max-w-[200px] md:max-w-xs">{item.title}</span>
                </div>
                <span className="font-bold text-gray-900">₹{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            
            <div className="border-t border-gray-100 pt-4 mt-4">
              <div className="flex justify-between items-center text-gray-600 mb-2">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-gray-600 mb-2">
                <span>GST (5%)</span>
                <span>₹{gstAmount.toFixed(2)}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between items-center text-green-600 font-medium mb-2">
                  <span>Discount ({appliedCoupon.code})</span>
                  <span>-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-gray-600">
                <span>Delivery Charges</span>
                <span>₹{deliveryCharges.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div className="border-t border-dashed border-gray-300 pt-6 flex justify-between items-center">
            <span className="text-2xl font-bold text-gray-900">Total Payable</span>
            <span className={`text-3xl font-extrabold ${isVipMode ? 'text-purple-600' : 'text-orange-600'}`}>₹{finalAmount.toFixed(2)}</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !address.trim() || (isVipMode && currentCart.some(item => item.quantity < 10))}
          className={`w-full ${isVipMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-orange-500 hover:bg-orange-600'} text-white py-5 rounded-xl font-bold text-xl transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
        >
          {loading ? 'Processing...' : `Place Order - ₹${finalAmount.toFixed(2)}`}
        </button>
      </form>
    </div>
  );
}
