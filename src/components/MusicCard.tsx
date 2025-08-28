
import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music, Plus } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { hasUserPurchasedVerse } from "@/services/purchaseService";
import { useState, useEffect } from "react";
import { DEFAULT_VERSE_IMAGE } from '@/constants/images';

interface MusicCardProps {
  id?: number | string;
  title: string;
  artist: string;
  image?: string;
  category: string;
  price?: number;
  classificacoes?: string[] | null;
}

const MusicCard = ({ id, title, artist, image, category, price, classificacoes }: MusicCardProps) => {
  const { addToCart, items } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isPurchased, setIsPurchased] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(true);
  const [forceUpdate, setForceUpdate] = useState(0);
  const verseId = id ? String(id) : `${title}-${artist}`.toLowerCase().replace(/\s+/g, '-');
  
  // Verificar se o item está no carrinho
  const isInCart = items.some(item => item.id === verseId);

  // Escutar eventos de carrinho limpo para forçar re-renderização
  useEffect(() => {
    const handleCartCleared = () => {
      console.log('🔄 [MusicCard] Carrinho limpo detectado, forçando re-renderização');
      setForceUpdate(prev => prev + 1);
    };

    window.addEventListener('cart-cleared', handleCartCleared);
    return () => window.removeEventListener('cart-cleared', handleCartCleared);
  }, []);
  
  useEffect(() => {
    const checkIfPurchased = async () => {
      // Se usuário não está logado, não precisa verificar compra
      if (!user) {
        setIsPurchased(false);
        setCheckingPurchase(false);
        return;
      }
      
      // Se não tem ID válido, não precisa verificar
      if (!id || typeof id !== 'number') {
        setIsPurchased(false);
        setCheckingPurchase(false);
        return;
      }
      
      try {
        setCheckingPurchase(true);
        const purchased = await hasUserPurchasedVerse(user.id, id);
        setIsPurchased(purchased);
      } catch (error) {
        console.error('Erro ao verificar compra do verso:', id, error);
        setIsPurchased(false);
      } finally {
        setCheckingPurchase(false);
      }
    };
    
    checkIfPurchased();
  }, [user, id]);

  const handleAddToCart = () => {
    // Validar se o título é válido (sem fallbacks)
    const validTitle = (title || '').trim();
    if (!validTitle) {
      console.error('Item sem título válido, não pode ser adicionado ao carrinho');
      return;
    }
    
    // Verificar se já está no carrinho
    if (isInCart) {
      console.log('Item já está no carrinho, ignorando:', verseId);
      return;
    }
    
    console.log('Adicionando ao carrinho via MusicCard:', { verseId, title, artist });
    addToCart({
      id: verseId,
      title: validTitle,
      artist: artist || '',
      category: classificacoes && classificacoes.length > 0 ? classificacoes.join(', ') : category,
      image: getValidImage(image),
      price
    });
  };

  // Função para formatar preço em reais brasileiros
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Verificar se a imagem é válida
  const getValidImage = (img?: string | null) => {
    console.log('🖼️ Verificando imagem para o verso:', { id, title, image: img });
    
    if (!img || img.trim() === '' || img === 'null') {
      console.log('❌ Imagem inválida ou vazia, usando genérica');
      return DEFAULT_VERSE_IMAGE;
    }
    
    // Se a imagem contém o path do bucket capas ou é do Supabase, usar ela
    if (img.includes('/capas/') || img.includes('supabase.co') || img.includes('hlrcvvaneofcpncbqjyg')) {
      console.log('✅ Imagem válida do Supabase:', img);
      return img;
    }
    
    // Se for uma URL externa válida, usar ela
    if (img.startsWith('http')) {
      console.log('✅ URL externa válida:', img);
      return img;
    }
    
    console.log('⚠️ Imagem não reconhecida, usando genérica:', img);
    return DEFAULT_VERSE_IMAGE;
  };

  const validImage = getValidImage(image);
  
  return (
    <Card className="card-elegant group overflow-hidden">
      {/* Layout horizontal - imagem pequena à esquerda */}
      <div className="flex p-4">
        {/* Coluna da imagem e valor */}
        <div className="flex flex-col items-center mr-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 mb-2">
            <img
              src={validImage}
              alt={title}
              className="w-full h-full object-cover"
              onError={(e) => {
                console.log('❌ Erro ao carregar imagem, usando fallback');
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = DEFAULT_VERSE_IMAGE;
              }}
              onLoad={() => {
                console.log('✅ Imagem carregada com sucesso:', validImage);
              }}
            />
          </div>
          {/* Valor formatado em reais brasileiros */}
          {price !== undefined && price > 0 ? (
            <span className="text-sm font-semibold text-gray-900">
              {formatPrice(price)}
            </span>
          ) : (
            <span className="text-sm font-semibold text-gray-600">Gratuito</span>
          )}
        </div>
        
        {/* Conteúdo principal */}
        <div className="flex-1 min-w-0">
          {/* Título e Musical */}
          <Link to={`/preview/${id}`} className="block">
            <h3 className="font-bold text-gray-900 text-base sm:text-lg hover:text-primary transition-colors mb-1">
              {title}
            </h3>
          </Link>
          <p className="text-sm text-gray-600 mb-2 line-clamp-1">
            {artist || 'Artista não informado'}
          </p>
          
          {/* Tags de classificação dinâmicas */}
          {classificacoes && classificacoes.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {classificacoes.map((classificacao, index) => (
                <span 
                  key={index}
                  className="inline-block px-2 py-1 text-xs font-medium text-primary bg-primary/10 rounded-full"
                >
                  {classificacao}
                </span>
              ))}
            </div>
          )}
          
          {/* Botões condicionais baseados no status de compra */}
          {checkingPurchase ? (
            <Button 
              disabled
              variant="ghost"
              size="sm"
              className="w-full opacity-50"
            >
              Verificando...
            </Button>
          ) : isPurchased ? (
            <Button 
              onClick={() => navigate(`/preview/${id}`)}
              variant="secondary"
              size="sm"
              className="w-full"
            >
              Ver detalhes
            </Button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                onClick={() => navigate(`/preview/${id}`)}
                variant="outline"
                size="sm"
                className="w-full sm:flex-1"
              >
                Detalhes
              </Button>
              <Button 
                onClick={handleAddToCart}
                disabled={isInCart}
                variant={isInCart ? "success" : "default"}
                size="sm"
                className="w-full sm:flex-1"
                key={`add-cart-${verseId}-${forceUpdate}-${isInCart}`}
              >
                {isInCart ? (
                  <>✓ No carrinho</>
                ) : (
                  <>
                    <Plus className="w-3 h-3 mr-1" />
                    Adicionar
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default MusicCard;
