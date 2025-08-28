import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { DEFAULT_VERSE_IMAGE } from '@/constants/images';

interface VerseItem {
  id: number;
  titulo_original: string | null;
  titulo_alt: string[] | null;
  titulo_pt_br: string;
  musical: string;
  musical_alt: string[] | null;
  url_imagem: string | null;
  display_title: string;
  display_musical: string;
}

interface MusicalGroup {
  musical: string;
  verses: VerseItem[];
  isExpanded: boolean;
}

const SongsByMusical = () => {
  const [verses, setVerses] = useState<VerseItem[]>([]);
  const [musicalGroups, setMusicalGroups] = useState<MusicalGroup[]>([]);
  const [filteredMusicalGroups, setFilteredMusicalGroups] = useState<MusicalGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const GROUPS_PER_PAGE = 50;
  // âncora para início da lista, usada na rolagem suave
  const listStartRef = useRef<HTMLDivElement | null>(null);

  // Função de rolagem suave com offset do header sticky
  const scrollToListStart = () => {
    const el = listStartRef.current;
    if (!el) return;

    const header = (document.querySelector('header.sticky') as HTMLElement | null) || (document.querySelector('header') as HTMLElement | null);
    const headerHeight = header ? header.getBoundingClientRect().height : 0;
    const gap = 8; // folga adicional para evitar sobreposição

    const targetTop = window.scrollY + el.getBoundingClientRect().top - (headerHeight + gap);
    window.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
  };

  // Handlers de paginação com agendamento da rolagem após atualização do estado
  const handlePrevPage = () => {
    const totalPages = Math.ceil(filteredMusicalGroups.length / GROUPS_PER_PAGE) || 1;
    setCurrentPage((p) => Math.max(1, p - 1));
    setTimeout(() => scrollToListStart(), 0);
  };

  const handleNextPage = () => {
    const totalPages = Math.ceil(filteredMusicalGroups.length / GROUPS_PER_PAGE) || 1;
    setCurrentPage((p) => Math.min(totalPages, p + 1));
    setTimeout(() => scrollToListStart(), 0);
  };

  // Filtros alfabéticos para musicais
  const musicalFilters = [
    { value: 'all', label: 'Todos' },
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

  // Função para buscar todos os versos e agrupar por musical
  const fetchVerses = async () => {
    try {
      setIsLoading(true);
      
      // Paginação de busca por lotes para contornar limite de 1000
      const pageSize = 1000;
      let from = 0;
      let allData: any[] = [];

      while (true) {
        const to = from + pageSize - 1;
        const { data, error } = await supabase
          .from('versoes')
          .select('id, titulo_original, titulo_alt, titulo_pt_br, musical, musical_alt, url_imagem, status')
          .order('musical', { ascending: true })
          .order('id', { ascending: true })
          .range(from, to);

        if (error) {
          console.error('Erro ao buscar versos (página):', error);
          break;
        }

        if (data && data.length > 0) {
          allData = allData.concat(data);
        }

        if (!data || data.length < pageSize) {
          break;
        }

        from += pageSize;
      }

      if (!allData || allData.length === 0) {
        setVerses([]);
        setMusicalGroups([]);
        setFilteredMusicalGroups([]);
        return;
      }

      // Processar dados para incluir musicais principais e alternativos
      const processedVerses: VerseItem[] = [];
      
      // Função util para normalizar 'musical_alt' que pode vir como array ou string
      const normalizeAltMusicals = (input: string[] | string | null | undefined): string[] => {
        if (!input) return [];
        if (Array.isArray(input)) return input.map((s) => String(s).trim()).filter((s) => s.length > 0);
        const trimmed = String(input).trim();
        if (trimmed === '') return [];
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            return parsed.map((s) => String(s).trim()).filter((s) => s.length > 0);
          }
        } catch {}
        return trimmed.split(/[;,|]/).map((s) => s.trim()).filter((s) => s.length > 0);
      };
      
      allData.forEach(verse => {
        // Adicionar entrada para o musical principal
        processedVerses.push({
          id: verse.id,
          titulo_original: verse.titulo_original,
          titulo_alt: verse.titulo_alt,
          titulo_pt_br: verse.titulo_pt_br,
          musical: verse.musical,
          musical_alt: verse.musical_alt,
          url_imagem: verse.url_imagem,
          display_title: verse.titulo_original || verse.titulo_pt_br,
          display_musical: verse.musical
        });
        
        // Adicionar entradas separadas para cada musical alternativo (normalizado)
        const altList = normalizeAltMusicals(verse.musical_alt);
        if (altList.length > 0) {
          altList.forEach((altMusical) => {
            const alt = String(altMusical).trim();
            if (alt && alt !== verse.musical) {
              processedVerses.push({
                id: verse.id,
                titulo_original: verse.titulo_original,
                titulo_alt: verse.titulo_alt,
                titulo_pt_br: verse.titulo_pt_br,
                musical: verse.musical,
                musical_alt: verse.musical_alt,
                url_imagem: verse.url_imagem,
                display_title: verse.titulo_original || verse.titulo_pt_br,
                display_musical: alt
              });
            }
          });
        }
      });

      console.log('🔍 Total de registros processados:', processedVerses.length);
      console.log('🔍 Registros de teste processados:', processedVerses.filter(item => 
        item.display_title?.toLowerCase().includes('teste') ||
        item.display_musical?.toLowerCase().includes('teste') ||
        item.display_musical?.toLowerCase().includes('kkk') ||
        item.display_musical?.toLowerCase().includes('m teste')
      ));
      
      setVerses(processedVerses);
      
      // Agrupar por musical
      const grouped = processedVerses.reduce((acc, verse) => {
        const key = verse.display_musical;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(verse);
        return acc;
      }, {} as Record<string, VerseItem[]>);

      // Converter para array e ordenar
      const musicalGroupsArray: MusicalGroup[] = Object.entries(grouped)
        .map(([musical, verses]) => ({
          musical,
          verses: verses.sort((a, b) => a.display_title.localeCompare(b.display_title, 'pt-BR', { sensitivity: 'base' })),
          isExpanded: false
        }))
        .sort((a, b) => a.musical.localeCompare(b.musical, 'pt-BR', { sensitivity: 'base' }));
      
      console.log('🔧 Grupos criados:', musicalGroupsArray.length);
      console.log('🔧 Existe grupo "kkk teste"?', musicalGroupsArray.some(g => g.musical.toLowerCase().includes('kkk teste')));
      console.log('🔧 Existe grupo "m teste"?', musicalGroupsArray.some(g => g.musical.toLowerCase().includes('m teste')));

      setMusicalGroups(musicalGroupsArray);
      
      // Aplicar filtro inicial baseado no estado atual
      applyFilter(selectedFilter, musicalGroupsArray);
    } catch (error) {
      console.error('Erro ao buscar versos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Função auxiliar para aplicar filtro
  const applyFilter = (filterValue: string, groupsToFilter: MusicalGroup[] = musicalGroups) => {
    if (groupsToFilter.length === 0) return;
    
    console.log('🎯 Aplicando filtro:', filterValue, '| grupos base:', groupsToFilter.length);

    if (filterValue === 'all') {
      // Ordenar alfabeticamente quando mostrar todos
      const sortedGroups = [...groupsToFilter].sort((a, b) => {
        return a.musical.localeCompare(b.musical, 'pt-BR', { sensitivity: 'base' });
      });
      console.log('🎯 Resultado filtro all -> total:', sortedGroups.length, '| inclui kkk teste?', sortedGroups.some(g => g.musical.toLowerCase().includes('kkk teste')), '| inclui m teste?', sortedGroups.some(g => g.musical.toLowerCase().includes('m teste')));
      setCurrentPage(1);
      setFilteredMusicalGroups(sortedGroups);
      return;
    }

    // Função auxiliar para obter a primeira palavra válida após números
    const getFirstValidWordAfterNumber = (str: string) => {
      const numberMatch = str.match(/^\d+\s*[-–—:]*\s*(.+)/);
      if (numberMatch) {
        const afterNumber = numberMatch[1].trim();
        const cleanAfterNumber = afterNumber.replace(/^(nd|th|st|rd)\s+/i, '');
        const words = cleanAfterNumber.split(/\s+/);
        const firstValidWord = words.find(word => word && !/^(nd|th|st|rd)$/i.test(word));
        return firstValidWord || '';
      }
      return '';
    };

    const filtered = groupsToFilter.filter(group => {
      const musical = String(group.musical || '').trim();
      
      switch (filterValue) {
        case 'num123':
          return /^[\[(#\d]/.test(musical);
        
        case 'artigo-a':
          return /^A\s+/.test(musical);
        
        case 'the':
          return /^The\s+/i.test(musical);
        
        default:
          // Para letras A-Z
          const letter = filterValue.toLowerCase();
          
          // 1. Verifica se começa nativamente com a letra
          if (musical.toLowerCase().startsWith(letter)) {
            return true;
          }
          
          // 2. Verifica se começa com a letra após artigos comuns (The/An/A e O/Os/A/As/Um/Uma/Uns/Umas)
          const afterArticle = musical.replace(/^(The|An|A|O|Os|As|Um|Uma|Uns|Umas)\s+/i, '');
          if (afterArticle.toLowerCase().startsWith(letter)) {
            return true;
          }
          
          // 3. Verifica se começa com a letra após caracteres especiais e/ou números (e depois remover artigos)
          const cleanedStart = musical.replace(/^[^a-zA-Z0-9]+/, '');
          const firstWordAfterNumber = getFirstValidWordAfterNumber(cleanedStart);
          const afterSpecialOrNumber = (firstWordAfterNumber || cleanedStart).replace(/^(The|An|A|O|Os|As|Um|Uma|Uns|Umas)\s+/i, '');
          if (afterSpecialOrNumber.toLowerCase().startsWith(letter)) {
            return true;
          }
          
          return false;
      }
    });

    // Ordenar resultados filtrados com prioridade para títulos que começam nativamente com a letra filtrada
    if (filterValue !== 'num123' && filterValue !== 'artigo-a' && filterValue !== 'the') {
      const letter = filterValue.toLowerCase();
      filtered.sort((a, b) => {
        const musicalA = String(a.musical || '').trim();
        const musicalB = String(b.musical || '').trim();
        
        const aStartsNatively = musicalA.toLowerCase().startsWith(letter);
        const bStartsNatively = musicalB.toLowerCase().startsWith(letter);
        
        if (aStartsNatively && !bStartsNatively) return -1;
        if (!aStartsNatively && bStartsNatively) return 1;
        
        return musicalA.localeCompare(musicalB, 'pt-BR', { sensitivity: 'base' });
      });
    }

    console.log(`🎯 Resultado filtro ${filterValue} -> total:`, filtered.length, '| inclui kkk teste?', filtered.some(g => g.musical.toLowerCase().includes('kkk teste')), '| inclui m teste?', filtered.some(g => g.musical.toLowerCase().includes('m teste')));

    setCurrentPage(1);
    setFilteredMusicalGroups(filtered);
  };

  useEffect(() => {
    fetchVerses();
  }, []);

  const filterVerses = (filterValue: string) => {
    setSelectedFilter(filterValue);
    applyFilter(filterValue);
  };

  const toggleMusicalExpansion = (musicalKey: string) => {
    setFilteredMusicalGroups(prev => 
      prev.map((group) => 
        group.musical === musicalKey
          ? { ...group, isExpanded: !group.isExpanded }
          : group
      )
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Canções por Musical</h1>
        </div>
    
        {/* Filtros alfabéticos */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {musicalFilters.map((filter) => (
              <Button
                key={filter.value}
                variant={selectedFilter === filter.value ? "default" : "outline"}
                size="sm"
                onClick={() => filterVerses(filter.value)}
                className="text-sm"
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>
    
        {/* Conteúdo */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : filteredMusicalGroups.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Nenhum musical encontrado para esta categoria.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {(() => {
              const totalPages = Math.ceil(filteredMusicalGroups.length / GROUPS_PER_PAGE) || 1;
              const startIndex = (currentPage - 1) * GROUPS_PER_PAGE;
              const currentGroups = filteredMusicalGroups.slice(startIndex, startIndex + GROUPS_PER_PAGE);
              return (
                <>
                  {/* âncora para início da lista de cards (musicais) */}
                  <div ref={listStartRef} />

                  {currentGroups.map((group) => (
                    <Card key={group.musical} className="overflow-hidden">
                      <CardHeader 
                        className="cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => toggleMusicalExpansion(group.musical)}
                      >
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-xl font-semibold text-gray-900">
                            {group.musical}
                          </CardTitle>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">
                              {group.verses.length} {group.verses.length === 1 ? 'versão' : 'versões'}
                            </span>
                            {group.isExpanded ? (
                              <ChevronUp className="h-5 w-5 text-gray-400" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      {group.isExpanded && (
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            {group.verses.map((verse) => (
                              <Link
                                key={`${verse.id}-${verse.display_musical}-${verse.display_title}`}
                                to={`/verse/${verse.id}`}
                                className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer block"
                              >
                                <img
                                  src={verse.url_imagem || DEFAULT_VERSE_IMAGE}
                                  alt={verse.display_title}
                                  className="w-12 h-12 object-cover rounded-md"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = DEFAULT_VERSE_IMAGE;
                                  }}
                                />
                                <div className="flex-1">
                                  <p className="text-gray-900 font-medium">
                                    {verse.display_title} - {verse.display_musical}
                                  </p>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-600">Página {currentPage} de {totalPages}</span>
                    <div className="space-x-2">
                      <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={currentPage === 1}>Anterior</Button>
                      <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage === totalPages}>Próxima</Button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default SongsByMusical;