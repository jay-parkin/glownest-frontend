import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

import "../styles/ProductItem.css";
import "../styles/WishList.css";

import AnimatedLoader from "./Loaders/AnimatedLoader";
import { useCart } from "../contexts/CartContext";

export default function WishList() {
  const { addToCart } = useCart();

  const [wishlistItems, setWishlistItems] = useState([]);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);
  const [pendingRemovals, setPendingRemovals] = useState(() => new Set());
  const [pendingCartAdditions, setPendingCartAdditions] = useState(
    () => new Set()
  );

  const [productCatalog, setProductCatalog] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [isRecommendationsLoading, setIsRecommendationsLoading] =
    useState(false);

  const apiBase = import.meta.env
    .VITE_SERVER_URL;
  const currentJsonWebToken = localStorage.getItem("jwt");

  const notifyWishlistCleared = () => toast.success("Wishlist cleared!");
  const notifyRemoved = (productName) =>
    toast.success(`${productName} removed from wishlist`);
  const notifyCartAddition = (productName) =>
    toast.success(`${productName} added to cart!`);
  const notifyError = (message) =>
    toast.error(message || "Something went wrong");

  // Load wishlist as full product objects  
  useEffect(() => {
    let ignore = false;
    async function loadWishlist() {
      if (!currentJsonWebToken) return;
      try {
        setIsWishlistLoading(true);
        const response = await fetch(
          `${apiBase}/wishlist`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${currentJsonWebToken}`,
            },
          }
        );
        if (!response.ok) throw new Error("Failed to load wishlist");
        const products = await response.json();
        if (!ignore) setWishlistItems(Array.isArray(products) ? products : []);
      } catch (error) {
        if (!ignore) notifyError(error.message);
      } finally {
        if (!ignore) setIsWishlistLoading(false);
      }
    }
    loadWishlist();
    return () => {
      ignore = true;
    };
  }, [apiBase, currentJsonWebToken]);

  // Load full catalog to recommend from
  useEffect(() => {
    let ignore = false;
    async function loadProductCatalog() {
      try {
        setIsRecommendationsLoading(true);
        const response = await fetch(
          `${apiBase}/products`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${currentJsonWebToken}`,
            },
          }
        );
        if (!response.ok) throw new Error("Failed to load products");
        const data = await response.json();
        if (!ignore) setProductCatalog(Array.isArray(data) ? data : []);
      } catch (error) {
        if (!ignore) notifyError(error.message);
      } finally {
        if (!ignore) setIsRecommendationsLoading(false);
      }
    }
    if (currentJsonWebToken) loadProductCatalog();
    return () => {
      ignore = true;
    };
  }, [apiBase, currentJsonWebToken]);

  // Build recommendations when wishlist or catalog changes
  useEffect(() => {
    if (!productCatalog.length) {
      setRecommendations([]);
      return;
    }

    const wishlistIdentifiers = new Set(
      wishlistItems.map((product) => product._id || product.id)
    );

    // Build a set of stop words for tokenization
    // These are common words that we want to ignore
    const stopWords = new Set([
      "the",
      "a",
      "an",
      "of",
      "for",
      "and",
      "or",
      "to",
      "with",
      "by",
      "on",
      "in",
    ]);
    const tokenize = (string = "") =>
      (string || "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((word) => word && !stopWords.has(word));

    const wishlistTokens = wishlistItems.flatMap((product) =>
      tokenize(product.productName)
    );
    const wishlistTokenFrequency = wishlistTokens.reduce((map, token) => {
      map[token] = (map[token] || 0) + 1;
      return map;
    }, {});

    // price band use median price in wishlist to guide similarity
    const prices = wishlistItems
      .map((product) => Number(product.price) || 0)
      .filter((number) => number > 0);
    const medianPrice =
      prices.sort((a, b) => a - b)[Math.floor(prices.length / 2)] || 0;

    const calculateScore = (product) => {
      // Exclude products already in wishlist
      if (wishlistIdentifiers.has(product._id || product.id)) return -Infinity;

      let score = 0;

      // Brand match has the biggest boost
      // If the product brand matches any in the wishlist, boost the score
      if (
        wishlistItems.some(
          (wishlistProduct) =>
            wishlistProduct.brand &&
            product.brand &&
            wishlistProduct.brand === product.brand
        )
      ) {
        score += 5;
      }

      /*
        This is a simple condition to recommend products that are
        within a reasonable price range of the wishlist items.
      */
      const price = Number(product.price) || 0;
      if (medianPrice > 0 && price > 0) {
        const relativeDifference = Math.abs(price - medianPrice) / medianPrice;
        if (relativeDifference <= 0.1) score += 3;
        else if (relativeDifference <= 0.2) score += 2;
        else if (relativeDifference <= 0.35) score += 1;
      }

      // Count how many tokens from the product name appear in the wishlist
      const tokens = tokenize(product.productName);
      let overlap = 0;
      for (const token of tokens) {
        if (wishlistTokenFrequency[token]) overlap += 1;
      }
      
      score += Math.min(overlap, 3);

      // Availability slight boost
      if (product.isAvailable) score += 0.5;

      return score;
    };

    const rankedProducts = [...productCatalog].sort(
      (a, b) => calculateScore(b) - calculateScore(a)
    );
    const topProducts = rankedProducts
      .filter((product) => calculateScore(product) > -Infinity)
      .slice(0, 4);

    setRecommendations(
      wishlistItems.length ? topProducts : productCatalog.slice(0, 4)
    );
  }, [wishlistItems, productCatalog]);

  const removeOne = async (identifier, productName = "") => {
    if (!currentJsonWebToken) {
      notifyError("Please sign in to manage your wishlist");
      return;
    }
    if (pendingRemovals.has(identifier)) return;
    setPendingRemovals((previous) => new Set(previous).add(identifier));
    try {
      const response = await fetch(
        `${apiBase}/wishlist/${identifier}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentJsonWebToken}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to remove item");
      setWishlistItems((previous) =>
        previous.filter((product) => (product._id || product.id) !== identifier)
      );
      notifyRemoved(productName);
    } catch (error) {
      notifyError(error.message);
    } finally {
      setPendingRemovals((previous) => {
        const next = new Set(previous);
        next.delete(identifier);
        return next;
      });
    }
  };

  const clearAll = async () => {
    if (!currentJsonWebToken) {
      notifyError("Please sign in to manage your wishlist");
      return;
    }
    try {
      await fetch(`${apiBase}/wishlist`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentJsonWebToken}`,
        },
      });
      setWishlistItems([]);
      notifyWishlistCleared();
    } catch (error) {
      notifyError(error.message);
    }
  };

  const handleAddToCart = async (product) => {
    if (!product?.isAvailable) return;
    if (!currentJsonWebToken) {
      notifyError("Please sign in to add items to your cart");
      return;
    }
    const identifier = product._id || product.id;
    if (pendingCartAdditions.has(identifier)) return;

    setPendingCartAdditions((previous) => new Set(previous).add(identifier));
    try {
      await addToCart(product);
      notifyCartAddition(product.productName);
    } catch (error) {
      notifyError(error?.message || "Failed to add to cart");
    } finally {
      setPendingCartAdditions((previous) => {
        const next = new Set(previous);
        next.delete(identifier);
        return next;
      });
    }
  };

  const moveAllToCart = async () => {
    for (const product of wishlistItems) {
      try {
        await addToCart(product);
      } catch {}
    }
    toast.success("All items added to cart!");
  };

  if (isWishlistLoading) {
    return (
      <div className="container wishlist-page">
        <Toaster
          position="bottom-center"
          toastOptions={{ duration: 2000, style: { boxShadow: "none" } }}
        />
        <h3>Your Wishlist</h3>
        <AnimatedLoader />
      </div>
    );
  }

  return (
    <>
      <Toaster
        position="bottom-center"
        toastOptions={{ duration: 2000, style: { boxShadow: "none" } }}
      />

      <div className="container wishlist-page">
        <h3>
          Your Wishlist ({wishlistItems.length} item
          {wishlistItems.length !== 1 ? "s" : ""})
        </h3>

        {wishlistItems.length === 0 ? (
          <div>
            <p>Your wishlist is empty.</p>
          </div>
        ) : (
          <>
            <div className="products-grid">
              {wishlistItems.map((product) => {
                const identifier = product._id || product.id;
                const isBusyRemoving = pendingRemovals.has(identifier);
                const isAddingToCart = pendingCartAdditions.has(identifier);

                return (
                  <article key={identifier} className="product-item">
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
                        disabled={!product.isAvailable || isAddingToCart}
                        onClick={() => handleAddToCart(product)}
                      >
                        {product.isAvailable
                          ? isAddingToCart
                            ? "Adding…"
                            : "Add to Cart"
                          : "Unavailable"}
                      </button>

                      <button
                        className="add-to-wishlist-btn active"
                        aria-pressed={true}
                        aria-label="Remove from wishlist"
                        disabled={isBusyRemoving}
                        onClick={() =>
                          removeOne(identifier, product.productName)
                        }
                        title="Remove from wishlist"
                      >
                        <i className="bi bi-heart-fill" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="wishlist-actions">
              <button
                className="btn btn-outline-primary"
                onClick={moveAllToCart}
              >
                Move All to Cart
              </button>
              <button className="btn btn-link text-danger" onClick={clearAll}>
                Clear Wishlist
              </button>
            </div>
          </>
        )}

        {/* Recommendations */}
        <h4 className="mt-5">You Might Also Like</h4>
        {isRecommendationsLoading ? (
          <AnimatedLoader />
        ) : recommendations.length === 0 ? (
          <p>No recommendations yet.</p>
        ) : (
          <div className="products-grid">
            {recommendations.map((product) => {
              const identifier = product._id || product.id;
              const isAddingToCart = pendingCartAdditions.has(identifier);
              return (
                <article key={identifier} className="product-item">
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
                      disabled={!product.isAvailable || isAddingToCart}
                      onClick={() => handleAddToCart(product)}
                    >
                      {product.isAvailable
                        ? isAddingToCart
                          ? "Adding…"
                          : "Add to Cart"
                        : "Unavailable"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
