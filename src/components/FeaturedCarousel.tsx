
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const FeaturedCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

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

  return (
    <section className="py-12 bg-gradient-to-r from-primary/5 to-purple-50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Músicas em Destaque</h2>
          <p className="text-gray-600">Descubra as letras mais populares e versões especiais</p>
        </div>

        <div className="relative overflow-hidden">
          <div 
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {featuredItems.map((item) => (
              <div key={item.id} className="w-full flex-shrink-0 px-4">
                <Card className="group relative overflow-hidden rounded-2xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover-scale">
                  <div className="aspect-[16/9] bg-gradient-to-br from-primary/20 to-purple-100 p-8">
                    <div className="flex items-center justify-between h-full">
                      <div className="flex-1">
                        <span className="inline-block px-3 py-1 text-xs font-medium text-primary bg-white/90 rounded-full mb-4">
                          {item.category}
                        </span>
                        <h3 className="text-4xl font-bold text-gray-900 mb-2">{item.title}</h3>
                        <p className="text-xl text-gray-600 mb-6">{item.artist}</p>
                        <Button className="bg-primary hover:bg-primary/90 rounded-full">
                          Ver Letra
                        </Button>
                      </div>
                      <div className="flex-shrink-0 ml-8">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-64 h-64 object-cover rounded-2xl shadow-lg"
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>

          {/* Indicadores */}
          <div className="flex justify-center mt-6 space-x-2">
            {featuredItems.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
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
