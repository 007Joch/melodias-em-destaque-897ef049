
import React from "react";
import Header from "@/components/Header";
import FeaturedCarousel from "@/components/FeaturedCarousel";
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
          <MusicGrid />
        </main>
        <Footer />
      </div>
    </CartProvider>
  );
};

export default Index;
