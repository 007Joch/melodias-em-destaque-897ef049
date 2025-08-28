import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { DEFAULT_VERSE_IMAGE } from '@/constants/images';

interface VerseItem {
  id: number;
  titulo_original: string | null;
  titulo_alt: string[] | null;
  titulo_pt_br: string;
  musical: string;
  url_imagem: string | null;
  display_title: string;
}

const SongsByTitle = () => {
  const [verses, setVerses] = useState<VerseItem[]>([]);
  const [filteredVerses, setFilteredVerses] = useState<VerseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const ITEMS_PER_PAGE = 50;
  const [currentPage, setCurrentPage] = useState(1);
  const listStartRef = useRef<HTMLDivElement | null>(null);
  // Função de rolagem suave para o início da lista
  const scrollToListStart = () => {
    listStartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Filtros alfabéticos
  const titleFilters = [
    { value: 'all', label: 'Todas as Categorias' },
    { value: 'num123', label: '[(#123' },
    { value: 'artigo-a', label: 'Artigo A' },
    { value: 'a', label: 'A' },
    { value: 'b', label: 'B' },
    { value: 'c', label: 'C' },
    { value: 'd', label: 'D' },
    { value: 'e', label: 'E' },
    { value: 'f', label: 'F' },
    { value: 'g', label: 'G' },
    { value: 'h', label: 'H' },
    { value: 'i', label: 'I' },
    { value: 'j', label: 'J' },
    { value: 'k', label: 'K' },
    { value: 'l', label: 'L' },
    { value: 'm', label: 'M' },
    { value: 'n', label: 'N' },
    { value: 'o', label: 'O' },
    { value: 'p', label: 'P' },
    { value: 'q', label: 'Q' },
    { value: 'r', label: 'R' },
    { value: 's', label: 'S' },
    { value: 't', label: 'T' },
    { value: 'the', label: 'The' },
    { value: 'u', label: 'U' },
    { value: 'v', label: 'V' },
    { value: 'w', label: 'W' },
    { value: 'x', label: 'X' },
    { value: 'y', label: 'Y' },
    { value: 'z', label: 'Z' }
  ];

  // Função para buscar todos os versos
  const fetchVerses = async () => {
    try {
      setIsLoading(true);

      const pageSize = 1000;
      let offset = 0;
      let allData: any[] = [];

      while (true) {
        const { data, error } = await supabase
          .from('versoes')
          .select('id, titulo_original, titulo_alt, titulo_pt_br, musical, url_imagem')
          .eq('status', 'active')
          .order('titulo_original', { ascending: true })
          .range(offset, offset + pageSize - 1);

        if (error) {
          console.error('Erro ao buscar versos:', error);
          break;
        }

        if (!data || data.length === 0) {
          break;
        }

        allData = allData.concat(data);

        if (data.length < pageSize) {
          break;
        }

        offset += pageSize;
      }

      if (!allData || allData.length === 0) {
        setVerses([]);
        setFilteredVerses([]);
        return;
      }

      // Processar dados para incluir titulo_original e todos os titulo_alt
      const processedVerses: VerseItem[] = [];

      allData.forEach((verse: any) => {
        // Adicionar entrada para titulo_original se existir
        if (verse.titulo_original) {
          processedVerses.push({
            id: verse.id,
            titulo_original: verse.titulo_original,
            titulo_alt: verse.titulo_alt,
            titulo_pt_br: verse.titulo_pt_br,
            musical: verse.musical,
            url_imagem: verse.url_imagem,
            display_title: verse.titulo_original
          });
        }

        // Adicionar entrada separada para cada titulo_alt se existir
        if (verse.titulo_alt && Array.isArray(verse.titulo_alt)) {
          verse.titulo_alt.forEach((altTitle: string) => {
            // Só adicionar se for diferente do titulo_original
            if (altTitle && altTitle.trim() !== '' && altTitle !== verse.titulo_original) {
              processedVerses.push({
                id: verse.id,
                titulo_original: verse.titulo_original,
                titulo_alt: verse.titulo_alt,
                titulo_pt_br: verse.titulo_pt_br,
                musical: verse.musical,
                url_imagem: verse.url_imagem,
                display_title: altTitle
              });
            }
          });
        }
      });

      // Ordenar por display_title (titulo_original ou titulo_alt)
      processedVerses.sort((a, b) => {
        const titleA = String(a.display_title || '').trim();
        const titleB = String(b.display_title || '').trim();
        return titleA.localeCompare(titleB, 'pt-BR', { sensitivity: 'base' });
      });

      setVerses(processedVerses);

      // Aplicar filtro inicial baseado no estado atual
      applyFilter(selectedFilter, processedVerses);
    } catch (error) {
      console.error('Erro ao buscar versos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Função auxiliar para aplicar filtro (usada tanto na inicialização quanto nos cliques)
  const applyFilter = (filterValue: string, versesToFilter: VerseItem[] = verses) => {
    if (versesToFilter.length === 0) return;
    
    if (filterValue === 'all') {
      // Ordenar alfabeticamente quando mostrar todos
      const sortedVerses = [...versesToFilter].sort((a, b) => {
        const titleA = String(a.display_title || '').trim();
        const titleB = String(b.display_title || '').trim();
        return titleA.localeCompare(titleB, 'pt-BR', { sensitivity: 'base' });
      });
      setFilteredVerses(sortedVerses);
      return;
    }

    // Função auxiliar para obter a primeira palavra válida após números
    const getFirstValidWordAfterNumber = (str: string) => {
      const numberMatch = str.match(/^\d+\s*[-–—]?\s*(.+)/);
      if (numberMatch) {
        const afterNumber = numberMatch[1].trim();
        const cleanAfterNumber = afterNumber.replace(/^(nd|th|st|rd)\s+/i, '');
        const words = cleanAfterNumber.split(/\s+/);
        const firstValidWord = words.find(word => word && !/^(nd|th|st|rd)$/i.test(word));
        return firstValidWord || '';
      }
      return '';
    };

    const filtered = versesToFilter.filter(verse => {
      const title = String(verse.display_title || '').trim();
      
      if (!title) return false;
      
      switch (filterValue) {
        case 'num123':
          // Títulos que começam com números OU caracteres especiais
          return /^[0-9]/.test(title) || /^[^a-zA-Z]/.test(title);
          
        case 'artigo-a':
          // SOMENTE títulos que começam exatamente com "A "
          return title.toLowerCase().startsWith('a ');
          
        case 'the':
          // SOMENTE títulos que começam exatamente com "The "
          return title.toLowerCase().startsWith('the ');
          
        default:
          // Filtros por letras (A-Z)
          if (filterValue.length === 1 && /[A-Z]/i.test(filterValue)) {
            const letter = filterValue.toUpperCase();
            
            // Primeiro: títulos que começam nativamente com a letra
            const startsWithLetter = title.toUpperCase().startsWith(letter);
            
            // Segundo: títulos que começam com a letra após remoção de artigos
            let startsWithLetterAfterNormalization = false;
            if (title.match(/^(The|A)\s+(.+)/i)) {
              const withoutArticle = title.replace(/^(The|A)\s+/i, '');
              startsWithLetterAfterNormalization = withoutArticle.toUpperCase().startsWith(letter);
            }
            
            // Terceiro: títulos que começam com caracteres especiais
            let startsWithLetterAfterSpecialChars = false;
            const specialCharsMatch = title.match(/^[^a-zA-Z0-9]+(.+)/);
            if (specialCharsMatch) {
              const withoutSpecialChars = specialCharsMatch[1];
              startsWithLetterAfterSpecialChars = withoutSpecialChars.toUpperCase().startsWith(letter);
            }
            
            // Quarto: títulos que começam com números
            let startsWithLetterAfterNumber = false;
            if (/^[0-9]/.test(title)) {
              const firstValidWord = getFirstValidWordAfterNumber(title);
              startsWithLetterAfterNumber = firstValidWord.toUpperCase().startsWith(letter);
            }
            
            return startsWithLetter || startsWithLetterAfterNormalization || startsWithLetterAfterSpecialChars || startsWithLetterAfterNumber;
          }
          
          return false;
      }
    });
    
    // Ordenar o resultado filtrado com prioridade
    const sortedFiltered = filtered.sort((a, b) => {
      const titleA = String(a.display_title || '').trim();
      const titleB = String(b.display_title || '').trim();
      
      // Se for filtro de letra, priorizar títulos que começam nativamente
      if (filterValue.length === 1 && /[A-Z]/i.test(filterValue)) {
        const letter = filterValue.toUpperCase();
        const startsWithLetterA = titleA.toUpperCase().startsWith(letter);
        const startsWithLetterB = titleB.toUpperCase().startsWith(letter);
        
        if (startsWithLetterA && !startsWithLetterB) return -1;
        if (!startsWithLetterA && startsWithLetterB) return 1;
      }
      
      return titleA.localeCompare(titleB, 'pt-BR', { sensitivity: 'base' });
    });
    
    setFilteredVerses(sortedFiltered);
  };

  // useEffect para buscar versos quando o componente for montado
  useEffect(() => {
    fetchVerses();
  }, []);

  // Função para filtrar versos por categoria
  const filterVerses = (filterValue: string) => {
    setSelectedFilter(filterValue);
    setCurrentPage(1); // Resetar para a página 1 ao trocar o filtro
    applyFilter(filterValue);
  };

  // Paginação de exibição
  const totalItems = filteredVerses.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
  const currentPageItems = filteredVerses.slice(startIndex, endIndex);
  const handlePrevPage = () => {
    setCurrentPage((p) => {
      const newPage = Math.max(1, p - 1);
      setTimeout(() => scrollToListStart(), 0);
      return newPage;
    });
  };
  const handleNextPage = () => {
    setCurrentPage((p) => {
      const newPage = Math.min(totalPages, p + 1);
      setTimeout(() => scrollToListStart(), 0);
      return newPage;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-center text-gray-800 mb-6">
                Canções por Título
              </CardTitle>
              
              {/* Filtros alfabéticos */}
              <div className="flex flex-wrap gap-2 justify-center mb-6">
                {titleFilters.map((filter) => (
                  <Button
                    key={filter.value}
                    variant={selectedFilter === filter.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => filterVerses(filter.value)}
                    className="text-xs px-3 py-1"
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </CardHeader>
            
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2 text-gray-600">Carregando canções...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredVerses.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <p>Nenhuma canção encontrada para este filtro.</p>
                    </div>
                  ) : (
                    <div>
                      <div ref={listStartRef} className="h-0" aria-hidden />
                      <div className="grid gap-4">
                        {currentPageItems.map((verse, index) => (
                          <Link 
                            key={`${verse.id}-${index}`}
                            to={`/verse/${verse.id}`} 
                            className="block w-full"
                          >
                            <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer hover:bg-gray-50">
                              {/* Thumbnail */}
                              <div className="flex-shrink-0">
                                <img
                                  src={verse.url_imagem || DEFAULT_VERSE_IMAGE}
                                  alt={verse.display_title}
                                  className="w-16 h-16 object-cover rounded-md"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = DEFAULT_VERSE_IMAGE;
                                  }}
                                />
                              </div>
                              
                              {/* Informações da canção */}
                              <div className="flex-grow">
                                <h3 className="font-bold text-lg text-gray-800">
                                  {verse.display_title} - {verse.musical}
                                </h3>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>

                      {/* Controles de paginação */}
                      <div className="flex items-center justify-center gap-4 mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handlePrevPage}
                          disabled={currentPage <= 1}
                        >
                          Anterior
                        </Button>
                        <span className="text-sm text-gray-600">
                          Página {totalItems === 0 ? 0 : currentPage} de {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleNextPage}
                          disabled={currentPage >= totalPages}
                        >
                          Próxima
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Contador de resultados */}
                  <div className="text-center mt-6 text-sm text-gray-500">
                    {filteredVerses.length > 0 && (
                      <p>
                        Exibindo {filteredVerses.length} canção{filteredVerses.length !== 1 ? 'ões' : ''}
                        {selectedFilter !== 'all' && (
                          <span> para o filtro "{titleFilters.find(f => f.value === selectedFilter)?.label}"</span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default SongsByTitle;