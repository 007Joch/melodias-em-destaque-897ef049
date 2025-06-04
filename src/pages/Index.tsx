
import Header from "@/components/Header";
import FeaturedCarousel from "@/components/FeaturedCarousel";
import FilterBar from "@/components/FilterBar";
import MusicGrid from "@/components/MusicGrid";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <FeaturedCarousel />
        <div className="container mx-auto px-6">
          <FilterBar />
          <MusicGrid />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
