import { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { User, Mail, ShieldCheck, LogOut, Heart, ShoppingBag, Settings, MapPin, ChevronRight, ArrowLeft, X, Plus, Trash2, Loader2, CheckCircle2 } from 'lucide-react';
import { logout, db, handleFirestoreError, OperationType } from '../../firebase';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';

export default function Profile() {
  const { user, userRole, isVipMode, wishlist } = useStore();
  const navigate = useNavigate();

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isShippingAddressesOpen, setIsShippingAddressesOpen] = useState(false);
  const [newName, setNewName] = useState(user?.displayName || '');
  const [addresses, setAddresses] = useState<string[]>([]);
  const [newAddress, setNewAddress] = useState('');
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    orderUpdates: true
  });
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setAddresses(data.addresses || []);
          setPreferences(data.preferences || {
            emailNotifications: true,
            orderUpdates: true
          });
          setNewName(data.name || user.displayName || '');
        } else {
          // Initialize user doc if it doesn't exist
          await setDoc(userRef, {
            uid: user.uid,
            name: user.displayName || 'User',
            email: user.email,
            role: userRole || 'user',
            addresses: [],
            preferences: {
              emailNotifications: true,
              orderUpdates: true
            },
            createdAt: new Date().toISOString()
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      }
    };

    fetchUserData();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">Please login to view profile</h2>
        <button 
          onClick={() => navigate(isVipMode ? '/vip' : '/')} 
          className={`px-8 py-3 rounded-xl font-bold text-white ${isVipMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'} transition-colors shadow-md`}
        >
          Go Home
        </button>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    navigate(isVipMode ? '/vip' : '/');
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { name: newName });
      setIsEditProfileOpen(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAddAddress = async () => {
    if (!user || !newAddress.trim()) return;
    setSaving(true);
    try {
      const updatedAddresses = [...addresses, newAddress.trim()];
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { addresses: updatedAddresses });
      setAddresses(updatedAddresses);
      setNewAddress('');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveAddress = async (index: number) => {
    if (!user) return;
    try {
      const updatedAddresses = addresses.filter((_, i) => i !== index);
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { addresses: updatedAddresses });
      setAddresses(updatedAddresses);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleTogglePreference = async (key: 'emailNotifications' | 'orderUpdates') => {
    if (!user) return;
    try {
      const updatedPreferences = { ...preferences, [key]: !preferences[key] };
      setPreferences(updatedPreferences);
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { preferences: updatedPreferences });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <button 
        onClick={() => navigate(isVipMode ? '/vip' : '/')}
        className={`flex items-center space-x-2 font-bold transition-colors group ${isVipMode ? 'text-purple-600 hover:text-purple-700' : 'text-blue-600 hover:text-blue-700'}`}
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span>Back to Store</span>
      </button>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">My {isVipMode ? 'VIP ' : ''}Account</h1>
        <button 
          onClick={handleLogout}
          className="flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-bold transition-colors text-sm"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-2 space-y-8">
          <div className={`bg-white rounded-3xl shadow-sm border ${isVipMode ? 'border-purple-100' : 'border-gray-100'} overflow-hidden`}>
            <div className={`bg-gradient-to-br ${isVipMode ? 'from-purple-600 via-indigo-700 to-purple-900' : 'from-blue-600 via-indigo-700 to-blue-900'} h-40 relative`}>
              <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            </div>
            <div className="px-8 pb-8 relative flex flex-col items-center text-center">
              <div className="absolute -top-16 w-32 h-32 bg-white rounded-full p-2 shadow-2xl">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || 'User'} 
                    className="w-full h-full rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className={`w-full h-full ${isVipMode ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'} rounded-full flex items-center justify-center text-5xl font-black uppercase shadow-inner`}>
                    {user.displayName?.charAt(0) || 'U'}
                  </div>
                )}
              </div>
              
              <div className="mt-20 w-full">
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div>
                    <h2 className="text-3xl font-black text-gray-900 mb-1">{newName || user.displayName}</h2>
                    <div className="flex items-center justify-center text-gray-500 font-medium">
                      <Mail className="w-4 h-4 mr-2 text-blue-500" />
                      {user.email}
                    </div>
                  </div>
                  <div className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${isVipMode ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'} border ${isVipMode ? 'border-purple-200' : 'border-blue-200'}`}>
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    {userRole}
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-100 pt-8 mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  onClick={() => setIsEditProfileOpen(true)}
                  className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-all group"
                >
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-xl ${isVipMode ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'} flex items-center justify-center mr-4`}>
                      <User className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-gray-700">Edit Profile</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500" />
                </button>
                <button 
                  onClick={() => setIsShippingAddressesOpen(true)}
                  className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-all group"
                >
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-xl ${isVipMode ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'} flex items-center justify-center mr-4`}>
                      <MapPin className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-gray-700">Shipping Addresses</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500" />
                </button>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => navigate(isVipMode ? '/vip/orders' : '/orders')}
              className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-left group"
            >
              <div className={`w-12 h-12 rounded-2xl ${isVipMode ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-gray-900">My Orders</h3>
              <p className="text-sm text-gray-500">Track and manage your orders</p>
            </button>
            <button 
              onClick={() => navigate(isVipMode ? '/vip/wishlist' : '/wishlist')}
              className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all text-left group"
            >
              <div className={`w-12 h-12 rounded-2xl ${isVipMode ? 'bg-pink-100 text-pink-600' : 'bg-red-100 text-red-600'} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-gray-900">Wishlist</h3>
              <p className="text-sm text-gray-500">{wishlist.length} items saved</p>
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {userRole === 'admin' && (
            <div className={`p-6 rounded-3xl ${isVipMode ? 'bg-purple-900 text-white' : 'bg-gray-900 text-white'} shadow-xl relative overflow-hidden`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <h3 className="text-xl font-black mb-2 flex items-center">
                <ShieldCheck className="w-5 h-5 mr-2 text-yellow-400" />
                Admin Access
              </h3>
              <p className="text-sm opacity-70 mb-6">You have administrative privileges to manage the store.</p>
              <button 
                onClick={() => navigate(isVipMode ? '/vip-admin' : '/admin')}
                className={`w-full py-3 rounded-xl font-black text-sm uppercase tracking-widest ${isVipMode ? 'bg-purple-500 hover:bg-purple-400' : 'bg-blue-600 hover:bg-blue-500'} transition-colors`}
              >
                Open Admin Panel
              </button>
            </div>
          )}

          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center">
              <Settings className="w-5 h-5 mr-2 text-gray-400" />
              Preferences
            </h3>
            <div className="space-y-2">
              <div 
                onClick={() => handleTogglePreference('emailNotifications')}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <span className="text-sm font-bold text-gray-700">Email Notifications</span>
                <div className={`w-10 h-5 rounded-full transition-colors ${preferences.emailNotifications ? (isVipMode ? 'bg-purple-600' : 'bg-blue-600') : 'bg-gray-200'} relative`}>
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${preferences.emailNotifications ? 'right-1' : 'left-1'}`}></div>
                </div>
              </div>
              <div 
                onClick={() => handleTogglePreference('orderUpdates')}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <span className="text-sm font-bold text-gray-700">Order Updates</span>
                <div className={`w-10 h-5 rounded-full transition-colors ${preferences.orderUpdates ? (isVipMode ? 'bg-purple-600' : 'bg-blue-600') : 'bg-gray-200'} relative`}>
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${preferences.orderUpdates ? 'right-1' : 'left-1'}`}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-black text-gray-900">Edit Profile</h3>
              <button onClick={() => setIsEditProfileOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Display Name</label>
                <input 
                  type="text" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="Enter your name"
                />
              </div>
              <button 
                onClick={handleUpdateProfile}
                disabled={saving}
                className={`w-full py-4 rounded-xl font-black text-white ${isVipMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'} transition-all shadow-lg flex items-center justify-center`}
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shipping Addresses Modal */}
      {isShippingAddressesOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-black text-gray-900">Shipping Addresses</h3>
              <button onClick={() => setIsShippingAddressesOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                {addresses.map((addr, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100">
                    <div className="flex items-start">
                      <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                      <span className="text-sm font-medium text-gray-700">{addr}</span>
                    </div>
                    <button 
                      onClick={() => handleRemoveAddress(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {addresses.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <MapPin className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No addresses saved yet.</p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-100">
                <label className="block text-sm font-bold text-gray-700 mb-2">Add New Address</label>
                <div className="flex space-x-2">
                  <input 
                    type="text" 
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="Enter full address"
                  />
                  <button 
                    onClick={handleAddAddress}
                    disabled={saving || !newAddress.trim()}
                    className={`p-3 rounded-xl text-white ${isVipMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'} transition-all disabled:opacity-50`}
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-6 h-6" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center space-x-2 z-50 animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-bold">Profile updated successfully!</span>
        </div>
      )}
    </div>
  );
}
