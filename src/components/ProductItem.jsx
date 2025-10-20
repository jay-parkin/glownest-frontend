import React, { useEffect, useState } from "react";
import "../styles/ProductItem.css";

import toast, { Toaster } from "react-hot-toast";

import ErrorMessage from "./ErrorMessage";
import AnimatedLoader from "./Loaders/AnimatedLoader";

import { useCart } from "../contexts/CartContext";

export default function ProductsGrid({
  products: incomingProducts,
  loading: incomingLoading = false,
  error: incomingError = "",
}) {
  const { addToCart } = useCart();
  const [products, setProducts] = useState(incomingProducts || []);
  const [loading, setLoading] = useState(incomingLoading || !incomingProducts);
  const [error, setError] = useState(incomingError || "");

  const currentJwt = localStorage.getItem("jwt");
  const apiBase = import.meta.env.VITE_SERVER_URL;

  const [wishlistIds, setWishlistIds] = useState(() => new Set());
  const [pending, setPending] = useState(() => new Set());

  const [adding, setAdding] = useState(() => new Set());

  const notifyCart = (productName) =>
    toast.success(`${productName} Added to Cart!`);
  const notifyWishlist = (productName, action) =>
    toast.success(`${productName} ${action} to Wishlist!`);
  const notifyError = (m) => toast.error(m || "Something went wrong");

  useEffect(() => {
    if (incomingProducts) {
      setProducts(incomingProducts);
      setLoading(incomingLoading);
      setError(incomingError);
      return;
    }

    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");
        const url = `${import.meta.env.VITE_SERVER_URL}/products`;
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentJwt}`,
          },
        });
        if (!response.ok) throw new Error(`Error: ${response.statusText}`);
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [incomingProducts, incomingLoading, incomingError, currentJwt]);

  // Load current wishlist
  useEffect(() => {
    let ignore = false;
    async function fetchWishlist() {
      try {
        const res = await fetch(`${apiBase}/wishlist`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentJwt}`,
          },
        });
        if (!res.ok) throw new Error("Failed to load wishlist");
        const items = await res.json();
        if (ignore) return;
        const ids = new Set(items.map((p) => p._id || p.id));
        setWishlistIds(ids);
      } catch (e) {}
    }
    if (currentJwt) fetchWishlist();
    return () => {
      ignore = true;
    };
  }, [apiBase, currentJwt]);

  const isInWishlist = (productId) => wishlistIds.has(productId);

  const toggleWishlist = async (product) => {
    const productId = product._id;
    const productName = product.productName;

    if (!currentJwt) {
      notifyError("Please sign in to use wishlist");
      return;
    }
    if (pending.has(productId)) return;

    const next = new Set(wishlistIds);
    const removing = next.has(productId);
    if (removing) next.delete(productId);
    else next.add(productId);

    setPending((p) => new Set([...p, productId]));
    setWishlistIds(next);

    try {
      const method = removing ? "DELETE" : "POST";
      const res = await fetch(`${apiBase}/wishlist/${productId}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentJwt}`,
        },
      });
      if (!res.ok) throw new Error("Request failed");

      removing
        ? notifyWishlist(productName, "removed")
        : notifyWishlist(productName, "added");
    } catch (e) {
      setWishlistIds((prev) => {
        const reverted = new Set(prev);
        if (removing) reverted.add(productId);
        else reverted.delete(productId);
        return reverted;
      });
      notifyError(e.message);
    } finally {
      setPending((p) => {
        const cp = new Set(p);
        cp.delete(productId);
        return cp;
      });
    }
  };

  const handleAddToCart = async (product) => {
    if (!product?.isAvailable) return;

    if (!currentJwt) {
      notifyError("Please sign in to add items to your cart");
      return;
    }

    const id = product._id;
    if (adding.has(id)) return;

    setAdding((prev) => new Set(prev).add(id));
    try {
      await addToCart(product);
      notifyCart(product.productName);
    } catch (e) {
      notifyError(e?.message || "Failed to add to cart");
    } finally {
      setAdding((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  if (loading) {
    // Show a loading state while fetching data
    return (
      <div>
        <AnimatedLoader />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <>
      <Toaster
        position="bottom-center"
        toastOptions={{ duration: 2000, style: { boxShadow: "none" } }}
      />

      <div className="products-grid">
        {products.map((product) => {
          const inWish = isInWishlist(product._id);
          const isBusy = pending.has(product._id);

          return (
            <article key={product._id} className="product-item">
              <span
                className={`product-stock-label ${
                  product.isAvailable ? "in-stock" : "out-of-stock"
                }`}
              >
                {product.isAvailable ? "In Stock" : "Out of Stock"}
              </span>

              <img
                className="product-item-image"
                src={product.imageUrl}
                alt={product.productName}
              />
              <h3 className="product-item-name">{product.productName}</h3>
              <p className="product-item-brand">{product.brand}</p>
              <p className="product-item-price">${product.price}</p>
              <div className="product-btns">
                <button
                  className="add-to-cart-btn"
                  disabled={!product.isAvailable}
                  onClick={() => {
                    handleAddToCart(product);
                    // notifyCart(product.productName);
                  }}
                >
                  {product.isAvailable ? "Add to Cart" : "Unavailable"}
                </button>
                <button
                  className={`add-to-wishlist-btn ${inWish ? "active" : ""}`}
                  aria-pressed={inWish}
                  aria-label={
                    inWish ? "Remove from wishlist" : "Add to wishlist"
                  }
                  disabled={isBusy}
                  onClick={() => toggleWishlist(product)}
                  title={inWish ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <i className={inWish ? "bi bi-heart-fill" : "bi bi-heart"} />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
