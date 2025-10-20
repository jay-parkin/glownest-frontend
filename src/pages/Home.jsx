import "../styles/HomePage.css";
import ProductItem from "../components/ProductItem";
import BannerCarousel from "../components/BannerCarousel.jsx";
import Navbar from "../components/Navbar.jsx";

const Home = () => {
  return (
    <div className="home-container">
      <section className="home-slider-container">
        <BannerCarousel intervalMs={5000} showButtons />
      </section>

      <section>
        <h3 className="section-title">New Arrivals</h3>
        <div className="home-product-grid">
          <ProductItem />
        </div>
      </section>
    </div>
  );
};

export default Home;
