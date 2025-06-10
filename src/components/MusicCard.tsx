
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music, Plus, Eye } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { Link } from "react-router-dom";
import { generateSlug } from "@/services/versesService";

interface MusicCardProps {
  id?: number | string;
  title: string;
  artist: string;
  image?: string;
  category: string;
  views?: number;
  price?: number;
  classificacoes?: string[] | null;
}

const MusicCard = ({ id, title, artist, image, category, views, price, classificacoes }: MusicCardProps) => {
  const { addToCart } = useCart();
  const verseId = id ? String(id) : `${title}-${artist}`.toLowerCase().replace(/\s+/g, '-');

  const handleAddToCart = () => {
    addToCart({
      id: verseId,
      title,
      artist,
      category,
      image,
      price: price || 0
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
  const getValidImage = () => {
    console.log('🖼️ Verificando imagem para o verso:', { id, title, image });
    
    if (!image || image.trim() === '' || image === 'null') {
      console.log('❌ Imagem inválida ou vazia, usando genérica');
      return '/musical-generic.svg';
    }
    
    // Se a imagem contém o path do bucket capas ou é do Supabase, usar ela
    if (image.includes('/capas/') || image.includes('supabase.co') || image.includes('hlrcvvaneofcpncbqjyg')) {
      console.log('✅ Imagem válida do Supabase:', image);
      return image;
    }
    
    // Se for uma URL externa válida, usar ela
    if (image.startsWith('http')) {
      console.log('✅ URL externa válida:', image);
      return image;
    }
    
    console.log('⚠️ Imagem não reconhecida, usando genérica:', image);
    return '/musical-generic.svg';
  };

  const validImage = getValidImage();
  
  return (
    <Card className="group overflow-hidden rounded-xl border-0 shadow-sm hover:shadow-lg transition-all duration-300 bg-white">
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
                target.src = '/musical-generic.svg';
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
          <Link to={`/${generateSlug(title || '')}`} className="block">
            <h3 className="font-bold text-gray-900 text-base sm:text-lg hover:text-primary transition-colors mb-1">
              {title || 'Título não informado'}
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
          
          {/* Botão ocupando toda a largura */}
          <Button 
            onClick={handleAddToCart}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-full py-2 text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default MusicCard;
