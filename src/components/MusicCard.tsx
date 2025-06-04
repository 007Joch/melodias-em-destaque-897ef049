
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music, Plus } from "lucide-react";
import { useCart } from "@/hooks/useCart";

interface MusicCardProps {
  title: string;
  artist: string;
  image?: string;
  category: string;
  views?: number;
}

const MusicCard = ({ title, artist, image, category, views }: MusicCardProps) => {
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart({
      id: `${title}-${artist}`.toLowerCase().replace(/\s+/g, '-'),
      title,
      artist,
      category,
      image
    });
  };

  return (
    <Card className="group overflow-hidden rounded-xl border-0 shadow-sm hover:shadow-lg transition-all duration-300 hover-scale bg-white">
      <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
        {image ? (
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-purple-100">
            <Music className="w-8 h-8 sm:w-12 sm:h-12 text-primary/60" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
        <Button
          size="sm"
          className="absolute top-2 sm:top-3 right-2 sm:right-3 rounded-full bg-white/90 text-gray-900 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 h-8 w-8 sm:h-auto sm:w-auto p-2 sm:px-3"
        >
          <span className="hidden sm:inline">Ver</span>
          <span className="sm:hidden">👁</span>
        </Button>
      </div>
      
      <div className="p-3 sm:p-4">
        <span className="inline-block px-2 py-1 text-xs font-medium text-primary bg-primary/10 rounded-full mb-2">
          {category}
        </span>
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1 text-sm sm:text-base">{title}</h3>
        <p className="text-xs sm:text-sm text-gray-600 mb-2">{artist}</p>
        {views && (
          <p className="text-xs text-gray-500 mb-3">{views.toLocaleString()} visualizações</p>
        )}
        
        <Button 
          onClick={handleAddToCart}
          className="w-full bg-primary hover:bg-primary/90 rounded-full transition-all duration-200 text-sm py-2"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar
        </Button>
      </div>
    </Card>
  );
};

export default MusicCard;
