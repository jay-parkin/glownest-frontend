import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const apiBase = import.meta.env.VITE_SERVER_URL;
  const jwt = localStorage.getItem("jwt");

  const [cart, setCart] = useState([]);

  const authHeaders = useMemo(
    () => ({
      "Content-Type": "application/json",
      ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
    }),
    [jwt]
  );

  const normalize = (items = []) =>
    items.map((i) => ({
      productId: i.productId._id || i.productId,
      productName: i.productId.productName,
      price: i.productId.price,
      imageUrl: i.productId.imageUrl,
      quantity: i.quantity,
    }));

  // keep navbar badge in sync
  const emitCartUpdated = useCallback((items) => {
    const total = items.reduce((sum, it) => sum + (it.quantity || 1), 0);
    window.dispatchEvent(new CustomEvent("cart:updated", { detail: { total } }));
  }, []);

  // initial load from server
  useEffect(() => {
    let ignore = false;
    (async () => {
      if (!jwt) {
        setCart([]);
        emitCartUpdated([]);
        return;
      }
      try {
        const res = await fetch(`${apiBase}/me/cart`, { headers: authHeaders });
        if (!res.ok) throw new Error("Failed to load cart");
        const server = await res.json();
        const items = normalize(server);
        if (!ignore) {
          setCart(items);
          emitCartUpdated(items);
        }
      } catch {
        if (!ignore) {
          setCart([]);
          emitCartUpdated([]);
        }
      }
    })();
    return () => { ignore = true; };
  }, [apiBase, authHeaders, emitCartUpdated, jwt]);

  // add item
  const addToCart = useCallback(async (product) => {
    if (!jwt) return;

    const res = await fetch(`${apiBase}/me/cart/items`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ productId: product._id, quantity: 1 }),
    });
    if (!res.ok) throw new Error("Failed to add to cart");
    
    const server = await res.json();
    const items = normalize(server);
    setCart(items);
    emitCartUpdated(items);
  }, [apiBase, authHeaders, emitCartUpdated, jwt]);

  // update quantity
  const setQuantity = useCallback(async (productId, quantity) => {
    const res = await fetch(`${apiBase}/me/cart/items/${productId}`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({ quantity }),
    });
    if (!res.ok) throw new Error("Failed to update quantity");
    const server = await res.json();
    const items = normalize(server);
    setCart(items);
    emitCartUpdated(items);
  }, [apiBase, authHeaders, emitCartUpdated]);

  // remove item
  const removeFromCart = useCallback(async (productId) => {
    const res = await fetch(`${apiBase}/me/cart/items/${productId}`, {
      method: "DELETE",
      headers: authHeaders,
    });
    if (!res.ok) throw new Error("Failed to remove item");
    const server = await res.json();
    const items = normalize(server);
    setCart(items);
    emitCartUpdated(items);
  }, [apiBase, authHeaders, emitCartUpdated]);

  // clear cart
  const clearCart = useCallback(async () => {
    const res = await fetch(`${apiBase}/me/cart`, {
      method: "PUT",
      headers: authHeaders,
      body: JSON.stringify([]),
    });
    if (!res.ok) throw new Error("Failed to clear cart");
    setCart([]);
    emitCartUpdated([]);
  }, [apiBase, authHeaders, emitCartUpdated]);

  const value = useMemo(
    () => ({ cart, addToCart, setQuantity, removeFromCart, clearCart }),
    [cart, addToCart, setQuantity, removeFromCart, clearCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
