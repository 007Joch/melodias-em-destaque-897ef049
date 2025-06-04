
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music } from "lucide-react";

interface MusicCardProps {
  title: string;
  artist: string;
  image?: string;
  category: string;
  views?: number;
}

const MusicCard = ({ title, artist, image, category, views }: MusicCardProps) => {
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
            <Music className="w-12 h-12 text-primary/60" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
        <Button
          size="sm"
          className="absolute top-3 right-3 rounded-full bg-white/90 text-gray-900 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        >
          Ver
        </Button>
      </div>
      
      <div className="p-4">
        <span className="inline-block px-2 py-1 text-xs font-medium text-primary bg-primary/10 rounded-full mb-2">
          {category}
        </span>
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{title}</h3>
        <p className="text-sm text-gray-600 mb-2">{artist}</p>
        {views && (
          <p className="text-xs text-gray-500">{views.toLocaleString()} visualizações</p>
        )}
      </div>
    </Card>
  );
};

export default MusicCard;
