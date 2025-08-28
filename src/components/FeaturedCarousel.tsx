
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { getRecentVerses } from "@/services/versesService";
import { useNavigate } from "react-router-dom";
// Removido: import { generateSlug } from "@/services/versesService";
import { useAuth } from "@/hooks/useAuth";
import { hasUserPurchasedVerse } from "@/services/purchaseService";
import { DEFAULT_VERSE_IMAGE } from '@/constants/images';

const FeaturedCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [recentVerses, setRecentVerses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasedVerses, setPurchasedVerses] = useState<Set<number>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const { addToCart, items } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchRecentVerses = async () => {
      try {
        setLoading(true);
        const verses = await getRecentVerses(3);
        
        // Mapear os dados dos versos para incluir as propriedades necessárias
        const mappedVerses = verses.map(verse => ({
          ...verse,
          title: verse.titulo_original || verse.titulo_pt_br || 'Dados inconsistentes',
          artist: verse.musical || 'Dados inconsistentes',
          image: verse.url_imagem || DEFAULT_VERSE_IMAGE,
          category: verse.classificacao_vocal_alt && verse.classificacao_vocal_alt.length > 0 
            ? verse.classificacao_vocal_alt.join(', ') 
            : ''
        }));
        setRecentVerses(mappedVerses);
        
        // Verificar versos adquiridos pelo usuário (apenas se logado)
        if (user) {
          const purchased = new Set<number>();
          for (const verse of mappedVerses) {
            try {
              const hasPurchased = await hasUserPurchasedVerse(user.id, verse.id);
              if (hasPurchased) {
                purchased.add(verse.id);
              }
            } catch (error) {
              console.error('Erro ao verificar compra do verso:', verse.id, error);
            }
          }
          setPurchasedVerses(purchased);
        }
      } catch (error) {
        console.error('Erro ao carregar versos recentes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentVerses();
  }, [user]);

  // Prevenir comportamento padrão de arrastar em imagens
  useEffect(() => {
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
    };

    const carousel = carouselRef.current;
    if (carousel) {
      const images = carousel.querySelectorAll('img');
      images.forEach(img => {
        img.addEventListener('dragstart', handleDragStart);
      });

      return () => {
        images.forEach(img => {
          img.removeEventListener('dragstart', handleDragStart);
        });
      };
    }
  }, [recentVerses]);

  // Funções de navegação
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % recentVerses.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + recentVerses.length) % recentVerses.length);
  };

  // Funções de arrastar
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setStartX(clientX);
    setCurrentX(clientX);
    setDragOffset(0);
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setCurrentX(clientX);
    const offset = clientX - startX;
    setDragOffset(offset);
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    const threshold = 50; // Mínimo de pixels para trocar slide
    
    if (dragOffset > threshold) {
      prevSlide();
    } else if (dragOffset < -threshold) {
      nextSlide();
    }
    
    setDragOffset(0);
  };

  const handleAddToCart = (verse: any) => {
    // Validar se o verso tem título válido usando apenas titulo_original
    const title = (verse.titulo_original || '').trim();
    if (!title) {
      console.error('Verso sem título_original válido, não pode ser adicionado ao carrinho');
      return;
    }
    
    // Verificar se já está no carrinho
    const verseId = String(verse.id);
    const isInCart = items.some(item => item.id === verseId);
    if (isInCart) {
      console.log('Item já está no carrinho, ignorando:', verseId);
      return;
    }
    
    console.log('Adicionando ao carrinho via FeaturedCarousel:', verse);
    addToCart({
      id: verseId,
      title: title,
      artist: verse.musical || '',
      category: verse.classificacao_vocal_alt && verse.classificacao_vocal_alt.length > 0 ? verse.classificacao_vocal_alt.join(', ') : 'Musical',
      image: verse.url_imagem,
      price: verse.valor || 0
    });
  };

  const handleViewVerse = (verse: any) => {
    navigate(`/preview/${verse.id}`);
  };

  const handleScrollToCatalog = () => {
    // Rolar para a seção "Explorar Músicas" na homepage
    // Procurar pelo título específico da seção
    const explorarMusicasHeading = document.querySelector('h2');
    if (explorarMusicasHeading && explorarMusicasHeading.textContent?.includes('Explorar Músicas')) {
      explorarMusicasHeading.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      // Fallback: procurar pela seção que contém o grid de cards
      const gridSection = document.querySelector('.grid.grid-cols-1');
      if (gridSection) {
        gridSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // Se ainda estiver carregando, mostrar skeleton
  if (loading) {
    return (
      <section className="py-4 md:py-6 bg-gradient-to-r from-primary/5 to-purple-50">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-3 md:mb-4">
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-2">Adicionados recentemente</h2>
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
      <section className="py-4 md:py-6 bg-gradient-to-r from-primary/5 to-purple-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-3 md:mb-4">
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-2">Adicionados recentemente</h2>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-4 md:py-6 bg-gradient-to-r from-primary/5 to-purple-50">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-3 md:mb-4">
            <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-2">Adicionados recentemente</h2>
          </div>

        <div className="relative overflow-hidden">
          {/* Botões de navegação */}
          {recentVerses.length > 1 && (
            <>
              <Button
                variant="outline"
                size="icon"
                onClick={prevSlide}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white border-primary/20 shadow-lg rounded-full w-10 h-10 md:w-12 md:h-12"
              >
                <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={nextSlide}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white border-primary/20 shadow-lg rounded-full w-10 h-10 md:w-12 md:h-12"
              >
                <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
            </>
          )}
          
          <div 
            ref={carouselRef}
            className="flex transition-transform duration-500 ease-in-out cursor-grab active:cursor-grabbing"
            style={{ 
              transform: `translateX(calc(-${currentSlide * 100}% + ${isDragging ? dragOffset : 0}px))`,
              userSelect: 'none'
            }}
            onMouseDown={handleDragStart}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onTouchStart={handleDragStart}
            onTouchMove={handleDragMove}
            onTouchEnd={handleDragEnd}
          >
            {recentVerses.map((verse) => (
              <div key={verse.id} className="w-full flex-shrink-0 px-2 sm:px-4">
                <Card className="group relative overflow-hidden rounded-xl sm:rounded-2xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover-scale">
                  <div className="aspect-[16/9] bg-gradient-to-br from-primary/20 to-purple-100 p-3 md:p-6">
                    <div className="flex flex-row items-center justify-between h-full gap-4">
                      {/* Imagem sempre à esquerda */}
                      <div className="flex-shrink-0">
                        <img
                          src={verse.image}
                          alt={verse.title}
                          className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 object-cover rounded-lg md:rounded-xl shadow-lg"
                        />
                      </div>
                      
                      {/* Conteúdo sempre à direita */}
                      <div className="flex-1 text-left">
                        <span className="inline-block px-2 sm:px-3 py-1 text-xs font-medium text-primary bg-white/90 rounded-full mb-2 sm:mb-4">
                          {verse.category}
                        </span>
                        <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mb-1">{verse.title}</h3>
                        <p className="text-xs sm:text-sm md:text-base text-gray-600 mb-2 md:mb-4">{verse.artist}</p>
                        <div className="flex flex-col gap-2 sm:gap-4">
                          <Button 
                            onClick={() => handleViewVerse(verse)}
                            className="rounded-full bg-primary hover:bg-primary/90 text-white text-xs sm:text-sm"
                          >
                            Ver detalhes
                          </Button>
                          {purchasedVerses.has(verse.id) ? (
                            <Button 
                              onClick={handleScrollToCatalog}
                              variant="outline"
                              className="rounded-full bg-white/90 hover:bg-white border-primary/20 text-xs sm:text-sm"
                            >
                              Confira mais
                            </Button>
                          ) : (() => {
                            const verseId = String(verse.id);
                            const isInCart = items.some(item => item.id === verseId);
                            return (
                              <Button 
                                variant="outline" 
                                onClick={() => handleAddToCart(verse)}
                                disabled={isInCart}
                                className={`rounded-full text-xs sm:text-sm ${
                                  isInCart 
                                    ? 'bg-green-100 hover:bg-green-200 text-green-800 border-green-200' 
                                    : 'bg-white/90 hover:bg-white border-primary/20'
                                }`}
                              >
                                {isInCart ? (
                                  <>✓ No carrinho</>
                                ) : (
                                  <>
                                    <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                                    Adicionar ao carrinho
                                  </>
                                )}
                              </Button>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>

          {/* Indicadores modernos */}
          {recentVerses.length > 1 && (
            <div className="flex justify-center mt-4 sm:mt-6 space-x-2">
              {recentVerses.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`transition-all duration-300 rounded-full hover:scale-110 ${
                    currentSlide === index 
                      ? 'w-6 h-2 sm:w-8 sm:h-3 bg-primary shadow-md' 
                      : 'w-2 h-2 sm:w-3 sm:h-3 bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Ir para slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCarousel;
