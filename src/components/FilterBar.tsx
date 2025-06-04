
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { List } from "lucide-react";

const FilterBar = () => {
  const categories = [
    "Todas as Categorias",
    "Rock",
    "Pop",
    "MPB",
    "Sertanejo",
    "Hip Hop",
    "Folk",
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
    <div className="flex flex-wrap items-center justify-between gap-4 py-6 border-b border-gray-100">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <List className="w-5 h-5 text-gray-500" />
          <span className="font-medium text-gray-900">Filtros:</span>
        </div>
        
        <Select defaultValue="all">
          <SelectTrigger className="w-48 bg-gray-50 border-0 rounded-full">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category.toLowerCase().replace(/\s+/g, '-')}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select defaultValue="popular">
          <SelectTrigger className="w-48 bg-gray-50 border-0 rounded-full">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option} value={option.toLowerCase().replace(/\s+/g, '-')}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" className="rounded-full">
          Limpar Filtros
        </Button>
      </div>
    </div>
  );
};

export default FilterBar;
