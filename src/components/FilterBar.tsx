
import React from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { List, Filter } from "lucide-react";

interface FilterBarProps {
  onCategoryChange?: (category: string) => void;
  onStyleChange?: (style: string) => void;
  onSortChange?: (sort: string) => void;
  onClearFilters?: () => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  onCategoryChange,
  onStyleChange,
  onSortChange,
  onClearFilters
}) => {
  const categories = [
    "Todas as Categorias",
    "Rock",
    "Pop",
    "MPB",
    "Sertanejo",
    "Hip Hop",
    "Folk",
    "Eletrônica",
    "Drama Musical",
    "Animação",
    "Teatro Musical"
  ];

  const styles = [
    "Todos os Estilos",
    "Clássico",
    "Contemporâneo",
    "Rock",
    "Pop",
    "Jazz",
    "Folk",
    "Hip Hop",
    "R&B",
    "Country",
    "Eletrônica"
  ];

  const sortOptions = [
    "Mais Populares",
    "Mais Recentes",
    "A-Z",
    "Z-A",
    "Por Artista"
  ];

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 sm:py-6 border-b border-gray-100">
      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
        <div className="flex items-center space-x-2">
          <List className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
          <span className="font-medium text-gray-900 text-sm sm:text-base">Filtros:</span>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
          <Select defaultValue="all" onValueChange={onCategoryChange}>
            <SelectTrigger className="w-full sm:w-48 bg-gray-50 border-0 rounded-full text-sm">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent className="z-50">
              {categories.map((category) => (
                <SelectItem key={category} value={category.toLowerCase().replace(/\s+/g, '-')}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select defaultValue="all-styles" onValueChange={onStyleChange}>
            <SelectTrigger className="w-full sm:w-48 bg-gray-50 border-0 rounded-full text-sm">
              <SelectValue placeholder="Estilo" />
            </SelectTrigger>
            <SelectContent className="z-50">
              {styles.map((style) => (
                <SelectItem key={style} value={style.toLowerCase().replace(/\s+/g, '-')}>
                  {style}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select defaultValue="popular" onValueChange={onSortChange}>
            <SelectTrigger className="w-full sm:w-48 bg-gray-50 border-0 rounded-full text-sm">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent className="z-50">
              {sortOptions.map((option) => (
                <SelectItem key={option} value={option.toLowerCase().replace(/\s+/g, '-')}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
        <Button variant="outline" size="sm" className="rounded-full text-sm" onClick={onClearFilters}>
          <Filter className="w-4 h-4 mr-1 sm:hidden" />
          Limpar Filtros
        </Button>
      </div>
    </div>
  );
};

export default FilterBar;
