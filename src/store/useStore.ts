import { create } from 'zustand';
import { User } from 'firebase/auth';

interface CartItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
}

interface AppState {
  user: User | null;
  userRole: 'user' | 'admin' | null;
  isAuthReady: boolean;
  cart: CartItem[];
  vipCart: CartItem[];
  wishlist: string[];
  isVipMode: boolean;
  setUser: (user: User | null, role?: 'user' | 'admin' | null) => void;
  setAuthReady: (ready: boolean) => void;
  setVipMode: (isVip: boolean) => void;
  addToCart: (item: CartItem, isVip?: boolean) => void;
  removeFromCart: (productId: string, isVip?: boolean) => void;
  updateCartQuantity: (productId: string, quantity: number, isVip?: boolean) => void;
  clearCart: (isVip?: boolean) => void;
  toggleWishlist: (productId: string) => void;
  appliedCoupon: { code: string; discountPercentage: number } | null;
  setAppliedCoupon: (coupon: { code: string; discountPercentage: number } | null) => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  userRole: null,
  isAuthReady: false,
  cart: [],
  vipCart: [],
  wishlist: [],
  isVipMode: false,
  appliedCoupon: null,
  setAppliedCoupon: (coupon) => set({ appliedCoupon: coupon }),
  setUser: (user, role = null) => set({ user, userRole: role }),
  setAuthReady: (ready) => set({ isAuthReady: ready }),
  setVipMode: (isVip) => set({ isVipMode: isVip }),
  addToCart: (item, isVip = false) => set((state) => {
    const cartKey = isVip ? 'vipCart' : 'cart';
    const currentCart = state[cartKey];
    const existing = currentCart.find(i => i.productId === item.productId);
    
    if (existing) {
      return {
        [cartKey]: currentCart.map(i => i.productId === item.productId ? { ...i, quantity: i.quantity + item.quantity } : i)
      };
    }
    return { [cartKey]: [...currentCart, item] };
  }),
  removeFromCart: (productId, isVip = false) => set((state) => {
    const cartKey = isVip ? 'vipCart' : 'cart';
    return { [cartKey]: state[cartKey].filter(i => i.productId !== productId) };
  }),
  updateCartQuantity: (productId, quantity, isVip = false) => set((state) => {
    const cartKey = isVip ? 'vipCart' : 'cart';
    return { [cartKey]: state[cartKey].map(i => i.productId === productId ? { ...i, quantity } : i) };
  }),
  clearCart: (isVip = false) => set({ [isVip ? 'vipCart' : 'cart']: [] }),
  toggleWishlist: (productId) => set((state) => {
    if (state.wishlist.includes(productId)) {
      return { wishlist: state.wishlist.filter(id => id !== productId) };
    }
    return { wishlist: [...state.wishlist, productId] };
  })
}));
