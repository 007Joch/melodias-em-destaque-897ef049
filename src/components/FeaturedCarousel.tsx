
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Plus } from "lucide-react";
import { useCart } from "@/hooks/useCart";

const FeaturedCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { addToCart } = useCart();

  const featuredItems = [
    {
      id: 1,
      title: "Bohemian Rhapsody",
      artist: "Queen",
      image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
      category: "Clássico Rock"
    },
    {
      id: 2,
      title: "Imagine",
      artist: "John Lennon",
      image: "https://images.unsplash.com/photo-1415886541506-6efc5e4b1786?w=400&h=400&fit=crop",
      category: "Folk Rock"
    },
    {
      id: 3,
      title: "Hotel California",
      artist: "Eagles",
      image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop",
      category: "Rock"
    }
  ];

  const handleAddToCart = (item: typeof featuredItems[0]) => {
    addToCart({
      id: `${item.title}-${item.artist}`.toLowerCase().replace(/\s+/g, '-'),
      title: item.title,
      artist: item.artist,
      category: item.category,
      image: item.image
    });
  };

  return (
    <section className="py-8 sm:py-12 bg-gradient-to-r from-primary/5 to-purple-50">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Músicas em Destaque</h2>
          <p className="text-sm sm:text-base text-gray-600">Descubra as letras mais populares e versões especiais</p>
        </div>

        <div className="relative overflow-hidden">
          <div 
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {featuredItems.map((item) => (
              <div key={item.id} className="w-full flex-shrink-0 px-2 sm:px-4">
                <Card className="group relative overflow-hidden rounded-xl sm:rounded-2xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover-scale">
                  <div className="aspect-[16/9] bg-gradient-to-br from-primary/20 to-purple-100 p-4 sm:p-8">
                    <div className="flex flex-row items-center justify-between h-full gap-4">
                      {/* Imagem sempre à esquerda */}
                      <div className="flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-24 h-24 sm:w-32 sm:h-32 md:w-48 md:h-48 lg:w-64 lg:h-64 object-cover rounded-xl sm:rounded-2xl shadow-lg"
                        />
                      </div>
                      
                      {/* Conteúdo sempre à direita */}
                      <div className="flex-1 text-left">
                        <span className="inline-block px-2 sm:px-3 py-1 text-xs font-medium text-primary bg-white/90 rounded-full mb-2 sm:mb-4">
                          {item.category}
                        </span>
                        <h3 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">{item.title}</h3>
                        <p className="text-sm sm:text-lg md:text-xl text-gray-600 mb-3 sm:mb-6">{item.artist}</p>
                        <div className="flex flex-col gap-2 sm:gap-4">
                          <Button className="bg-primary hover:bg-primary/90 rounded-full text-xs sm:text-sm">
                            Ver Letra
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => handleAddToCart(item)}
                            className="rounded-full bg-white/90 hover:bg-white border-primary/20 text-xs sm:text-sm"
                          >
                            <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                            Adicionar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>

          {/* Indicadores */}
          <div className="flex justify-center mt-4 sm:mt-6 space-x-2">
            {featuredItems.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-200 ${
                  currentSlide === index ? 'bg-primary' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedCarousel;
