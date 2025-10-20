import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

export default function SearchResultsPage() {
  const [urlSearchParameters] = useSearchParams();
  const query = urlSearchParameters.get("query") || "";

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const currentJwt = localStorage.getItem("jwt");

  useEffect(() => {
    if (!query) return;

    let shouldIgnore = false;
    async function fetchProducts() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const url = `${
          import.meta.env.VITE_SERVER_URL
        }/products/search?query=${encodeURIComponent(query)}`;
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentJwt}`,
          },
        });

        if (!response.ok) throw new Error(`Error: ${response.statusText}`);

        const json = await response.json();
        if (!shouldIgnore) setProducts(json);
      } catch (error) {
        if (!shouldIgnore)
          setErrorMessage(error.message || "Failed to load products.");
      } finally {
        if (!shouldIgnore) setIsLoading(false);
      }
    }

    fetchProducts();
    return () => {
      shouldIgnore = true;
    };
  }, [query, currentJwt]);

  if (isLoading && products.length === 0) return <div>Loading products…</div>;
  if (errorMessage && products.length === 0)
    return <div>Failed to load products: {errorMessage}</div>;

  return (
    <main>
      <header>
        <h2 className="section-title">Results for “{query}”</h2>
      </header>
      {isLoading && <div>Refreshing…</div>}

      <div className="products-grid">
        {products.map((product) => (
          <article key={product._id} className="product-item">
            <img
              className="product-item-image"
              src={product.imageUrl}
              alt={product.productName}
            />
            <h3 className="product-item-name">{product.productName}</h3>
            <p className="product-item-brand">{product.brand}</p>
            <p className="product-item-price">${product.price}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
