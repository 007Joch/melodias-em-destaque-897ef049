
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { getRecentVerses } from "@/services/versesService";
import { useNavigate } from "react-router-dom";
import { generateSlug } from "@/services/versesService";

const FeaturedCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [recentVerses, setRecentVerses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecentVerses = async () => {
      try {
        setLoading(true);
        const verses = await getRecentVerses(3);
        setRecentVerses(verses);
      } catch (error) {
        console.error('Erro ao carregar versos recentes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentVerses();
  }, []);

  const handleAddToCart = (verse: any) => {
    addToCart({
      id: `${verse.title}-${verse.artist}`.toLowerCase().replace(/\s+/g, '-'),
      title: verse.title,
      artist: verse.artist,
      category: verse.category,
      image: verse.image,
      price: verse.price
    });
  };

  const handleViewVerse = (verse: any) => {
    const slug = generateSlug(verse.title);
    navigate(`/verso/${slug}`);
  };

  // Se ainda estiver carregando, mostrar skeleton
  if (loading) {
    return (
      <section className="py-8 sm:py-12 bg-gradient-to-r from-primary/5 to-purple-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Adicionados Recentemente</h2>
            <p className="text-sm sm:text-base text-gray-600">Descubra os versos mais recentes do nosso catálogo</p>
          </div>
          <div className="animate-pulse">
            <div className="h-64 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </section>
    );
  }

  // Se não houver versos, mostrar mensagem
  if (recentVerses.length === 0) {
    return (
      <section className="py-8 sm:py-12 bg-gradient-to-r from-primary/5 to-purple-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Adicionados Recentemente</h2>
            <p className="text-sm sm:text-base text-gray-600">Nenhum verso encontrado no momento</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 sm:py-12 bg-gradient-to-r from-primary/5 to-purple-50">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Adicionados Recentemente</h2>
          <p className="text-sm sm:text-base text-gray-600">Descubra os versos mais recentes do nosso catálogo</p>
        </div>

        <div className="relative overflow-hidden">
          <div 
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {recentVerses.map((verse) => (
              <div key={verse.id} className="w-full flex-shrink-0 px-2 sm:px-4">
                <Card className="group relative overflow-hidden rounded-xl sm:rounded-2xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover-scale">
                  <div className="aspect-[16/9] bg-gradient-to-br from-primary/20 to-purple-100 p-4 sm:p-8">
                    <div className="flex flex-row items-center justify-between h-full gap-4">
                      {/* Imagem sempre à esquerda */}
                      <div className="flex-shrink-0">
                        <img
                          src={verse.image}
                          alt={verse.title}
                          className="w-24 h-24 sm:w-32 sm:h-32 md:w-48 md:h-48 lg:w-64 lg:h-64 object-cover rounded-xl sm:rounded-2xl shadow-lg"
                        />
                      </div>
                      
                      {/* Conteúdo sempre à direita */}
                      <div className="flex-1 text-left">
                        <span className="inline-block px-2 sm:px-3 py-1 text-xs font-medium text-primary bg-white/90 rounded-full mb-2 sm:mb-4">
                          {verse.category}
                        </span>
                        <h3 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">{verse.title}</h3>
                        <p className="text-sm sm:text-lg md:text-xl text-gray-600 mb-3 sm:mb-6">{verse.artist}</p>
                        <div className="flex flex-col gap-2 sm:gap-4">
                          <Button 
                            onClick={() => handleViewVerse(verse)}
                            className="bg-primary hover:bg-primary/90 rounded-full text-xs sm:text-sm"
                          >
                            Ver Letra
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => handleAddToCart(verse)}
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
            {recentVerses.map((_, index) => (
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
