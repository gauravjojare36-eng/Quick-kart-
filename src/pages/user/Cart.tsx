import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { Trash2, Plus, Minus, ArrowRight, ShoppingCart, ShieldCheck, Ticket, X, ArrowLeft } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase';

export default function Cart() {
  const { cart, vipCart, isVipMode, removeFromCart, updateCartQuantity, appliedCoupon, setAppliedCoupon } = useStore();
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const currentCart = isVipMode ? vipCart : cart;
  const subtotal = currentCart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const gstAmount = subtotal * 0.05;
  const deliveryCharges = 50;
  const discountAmount = appliedCoupon ? (subtotal * appliedCoupon.discountPercentage) / 100 : 0;
  const finalAmount = subtotal + gstAmount + deliveryCharges - discountAmount;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    
    setIsApplyingCoupon(true);
    setCouponError('');
    
    try {
      const q = query(collection(db, 'coupons'), where('code', '==', couponCode.toUpperCase()));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setCouponError('Invalid coupon code');
        return;
      }

      const couponData = snapshot.docs[0].data();
      
      // Check expiry
      if (new Date(couponData.expiryDate) < new Date()) {
        setCouponError('This coupon has expired');
        return;
      }

      setAppliedCoupon({
        code: couponData.code,
        discountPercentage: couponData.discountPercentage
      });
      setCouponCode('');
    } catch (error) {
      setCouponError('Error applying coupon');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
  };

  if (currentCart.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="w-48 h-48 bg-gray-100 rounded-full flex items-center justify-center mb-8">
          <ShoppingCart className={`w-24 h-24 ${isVipMode ? 'text-purple-400' : 'text-gray-400'}`} />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Your {isVipMode ? 'VIP ' : ''}cart is empty!</h2>
        <p className="text-gray-500 mb-8 text-lg">Explore our wide selection and find something you like.</p>
        <Link to={isVipMode ? '/vip' : '/'} className={`${isVipMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'} text-white px-8 py-4 rounded-xl font-bold text-lg transition-colors shadow-md`}>
          Shop Now
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button 
        onClick={() => navigate(-1)}
        className={`flex items-center space-x-2 ${isVipMode ? 'text-purple-600 hover:text-purple-700' : 'text-blue-600 hover:text-blue-700'} font-bold transition-colors group`}
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span>Continue Shopping</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Cart Items */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">My {isVipMode ? 'VIP ' : ''}Cart ({currentCart.length})</h2>
          {isVipMode && (
            <span className="text-purple-600 font-bold text-sm bg-purple-50 px-3 py-1 rounded-full border border-purple-100">
              Bulk Order Mode
            </span>
          )}
        </div>

        {currentCart.map(item => (
          <div key={item.productId} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col sm:flex-row gap-6">
            <div className="w-32 h-32 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
              <img src={item.image} alt={item.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            
            <div className="flex-1 flex flex-col">
              <div className="flex flex-col sm:flex-row justify-between items-start mb-2">
                <Link to={isVipMode ? `/vip/product/${item.productId}` : `/product/${item.productId}`} className={`text-lg font-semibold text-gray-900 hover:${isVipMode ? 'text-purple-600' : 'text-blue-600'} line-clamp-2 mb-2 sm:mb-0`}>
                  {item.title}
                </Link>
                <span className="text-xl font-bold text-gray-900 sm:ml-4">₹{item.price * item.quantity}</span>
              </div>
              
              <div className="text-gray-500 text-sm mb-4">
                Unit Price: ₹{item.price}
              </div>

              <div className="mt-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-4">
                    <button 
                      onClick={() => updateCartQuantity(item.productId, Math.max(isVipMode ? 10 : 1, item.quantity - 1), isVipMode)}
                      className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-gray-600 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-bold text-lg w-8 text-center">{item.quantity}</span>
                    <button 
                      onClick={() => updateCartQuantity(item.productId, item.quantity + 1, isVipMode)}
                      className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-gray-600 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {isVipMode && item.quantity < 10 && (
                    <p className="text-red-500 text-xs font-medium">Minimum 10 items required</p>
                  )}
                </div>
                
                <button 
                  onClick={() => removeFromCart(item.productId, isVipMode)}
                  className="flex items-center text-red-500 hover:text-red-700 font-medium transition-colors px-4 py-2 rounded-lg hover:bg-red-50 w-full sm:w-auto justify-center sm:justify-start"
                >
                  <Trash2 className="w-5 h-5 mr-2" />
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Order Summary */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
          <h3 className="text-xl font-bold text-gray-900 mb-6 uppercase tracking-wide border-b border-gray-100 pb-4">Price Details</h3>
          
          <div className="space-y-4 mb-6">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal ({currentCart.reduce((a, b) => a + b.quantity, 0)} items)</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-gray-600">
              <span>GST (5%)</span>
              <span>₹{gstAmount.toFixed(2)}</span>
            </div>
            
            {/* Coupon Section */}
            <div className="border-t border-b border-gray-100 py-4 my-4">
              {!appliedCoupon ? (
                <div>
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="Enter coupon code"
                        className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${isVipMode ? 'purple' : 'blue'}-500 focus:border-transparent uppercase`}
                      />
                    </div>
                    <button
                      onClick={handleApplyCoupon}
                      disabled={isApplyingCoupon || !couponCode.trim()}
                      className={`px-4 py-2 ${isVipMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-900 hover:bg-gray-800'} text-white rounded-lg font-medium disabled:opacity-50 transition-colors`}
                    >
                      {isApplyingCoupon ? 'Applying...' : 'Apply'}
                    </button>
                  </div>
                  {couponError && <p className="text-red-500 text-sm mt-2">{couponError}</p>}
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex justify-between items-center">
                  <div className="flex items-center text-green-700">
                    <Ticket className="w-5 h-5 mr-2" />
                    <span className="font-bold">{appliedCoupon.code}</span>
                    <span className="ml-2 text-sm">({appliedCoupon.discountPercentage}% OFF)</span>
                  </div>
                  <button onClick={handleRemoveCoupon} className="text-gray-500 hover:text-red-500 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {appliedCoupon && (
              <div className="flex justify-between text-green-600 font-medium">
                <span>Discount ({appliedCoupon.code})</span>
                <span>-₹{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>Delivery Charges</span>
              <span className="text-gray-900 font-medium">₹{deliveryCharges.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="border-t border-dashed border-gray-300 pt-4 mb-8">
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold text-gray-900">Total Amount</span>
              <span className="text-2xl font-extrabold text-gray-900">₹{finalAmount.toFixed(2)}</span>
            </div>
            {appliedCoupon && (
              <div className="text-green-600 text-sm font-medium mt-2 text-right">
                You will save ₹{discountAmount.toFixed(2)} on this order
              </div>
            )}
          </div>
          
          <button 
            onClick={() => navigate(isVipMode ? '/vip/checkout' : '/checkout')}
            disabled={isVipMode && currentCart.some(item => item.quantity < 10)}
            className={`w-full ${isVipMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-orange-500 hover:bg-orange-600'} text-white py-4 rounded-xl font-bold text-lg transition-colors shadow-md flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Proceed to Checkout
            <ArrowRight className="w-5 h-5 ml-2" />
          </button>
          
          <div className="mt-6 flex items-center justify-center space-x-2 text-sm text-gray-500">
            <ShieldCheck className="w-5 h-5 text-green-600" />
            <span>Safe and Secure Payments. Easy returns.</span>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
