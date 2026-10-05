import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { api } from "../api/client";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

const toItems = (data) =>
  Array.isArray(data) ? data : data?.cart || data?.items || [];

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      setItems(toItems(await api("/cart")));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const mutate = async (path, options) => {
    await api(path, options);
    await refreshCart();
  };

  const addToCart = (id, quantity = 1) =>
    mutate(`/cart/${id}`, { method: "POST", body: { quantity } });
  const updateQuantity = (id, quantity) =>
    mutate(`/cart/${id}`, { method: "PUT", body: { quantity } });
  const removeFromCart = (id) => mutate(`/cart/${id}`, { method: "DELETE" });
  const clearCart = () => mutate("/cart", { method: "DELETE" });

  const count = items.reduce((sum, i) => sum + (i.quantity || 0), 0);
  const total = items.reduce(
    (sum, i) => sum + (i.product?.price || 0) * (i.quantity || 0),
    0,
  );

  return (
    <CartContext.Provider
      value={{
        items,
        loading,
        count,
        total,
        refreshCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
