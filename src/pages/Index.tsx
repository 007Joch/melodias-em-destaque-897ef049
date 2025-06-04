
import Header from "@/components/Header";
import FeaturedCarousel from "@/components/FeaturedCarousel";
import FilterBar from "@/components/FilterBar";
import MusicGrid from "@/components/MusicGrid";
import Footer from "@/components/Footer";
import { CartProvider } from "@/hooks/useCart";

const Index = () => {
  return (
    <CartProvider>
      <div className="min-h-screen bg-white">
        <Header />
        <main>
          <FeaturedCarousel />
          <div className="container mx-auto px-4 sm:px-6">
            <FilterBar />
            <MusicGrid />
          </div>
        </main>
        <Footer />
      </div>
    </CartProvider>
  );
};

export default Index;
