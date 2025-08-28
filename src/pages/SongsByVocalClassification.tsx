import React, { useState, useEffect } from 'react';
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
  titulo_alt: string | null;
  titulo_pt_br: string;
  musical: string;
  url_imagem: string | null;
  classificacao_vocal_alt: string[];
  display_title: string;
}

interface VocalClassificationGroup {
  category: string;
  subcategories: {
    name: string;
    verses: VerseItem[];
    isExpanded: boolean;
  }[];
  isExpanded: boolean;
}

const SongsByVocalClassification = () => {
  const [verses, setVerses] = useState<VerseItem[]>([]);
  const [vocalGroups, setVocalGroups] = useState<VocalClassificationGroup[]>([]);
  const [filteredVocalGroups, setFilteredVocalGroups] = useState<VocalClassificationGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>('solo-feminino');

  // Filtros de classificação vocal principais
  const vocalClassificationFilters = [
    { value: 'solo-feminino', label: 'Solo Feminino' },
    { value: 'solo-masculino', label: 'Solo Masculino' },
    { value: 'dueto', label: 'Dueto' },
    { value: 'trio', label: 'Trio' },
    { value: 'quarteto', label: 'Quarteto' },
    { value: 'quinteto', label: 'Quinteto' },
    { value: 'sexteto', label: 'Sexteto' },
    { value: 'coro', label: 'Coro' }
  ];

  // Função para normalizar classificação vocal
  const normalizeClassification = (classification: string): string => {
    return classification.toLowerCase().trim();
  };

  // Função para determinar a categoria principal de uma classificação
  const getCategoryFromClassification = (classification: string): { category: string; subcategory: string } => {
    const normalized = normalizeClassification(classification);
    
    // Para Solo Feminino e Solo Masculino, usar a classificação exata como subcategoria
    if (normalized.includes('solo') && normalized.includes('feminino')) {
      return { category: 'Solo Feminino', subcategory: classification };
    }
    if (normalized.includes('solo') && normalized.includes('masculino')) {
      return { category: 'Solo Masculino', subcategory: classification };
    }
    
    // Para outras categorias, usar a classificação original como subcategoria
    // e determinar a categoria principal baseada na palavra-chave
    if (normalized.includes('dueto')) {
      return { category: 'Dueto', subcategory: classification };
    }
    if (normalized.includes('trio')) {
      return { category: 'Trio', subcategory: classification };
    }
    if (normalized.includes('quarteto')) {
      return { category: 'Quarteto', subcategory: classification };
    }
    if (normalized.includes('quinteto')) {
      return { category: 'Quinteto', subcategory: classification };
    }
    if (normalized.includes('sexteto')) {
      return { category: 'Sexteto', subcategory: classification };
    }
    if (normalized.includes('coro')) {
      return { category: 'Coro', subcategory: classification };
    }
    
    return { category: 'Outros', subcategory: classification };
  };

  // Função para buscar todos os versos e agrupar por classificação vocal
  const fetchVerses = async () => {
    try {
      setIsLoading(true);

      const pageSize = 1000;
      let offset = 0;
      let allData: any[] = [];

      while (true) {
        const { data, error } = await supabase
          .from('versoes')
          .select('id, titulo_original, titulo_alt, titulo_pt_br, musical, url_imagem, classificacao_vocal_alt')
          .eq('status', 'active')
          .order('titulo_pt_br', { ascending: true })
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
        setVocalGroups([]);
        setFilteredVocalGroups([]);
        return;
      }

      // Debug: Log dos dados retornados
      console.log('Dados retornados do Supabase:', allData.slice(0, 5));
      console.log('Total de registros:', allData.length);

      // Processar dados para incluir titulo_original e titulo_alt
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
            classificacao_vocal_alt: verse.classificacao_vocal_alt || [],
            display_title: verse.titulo_original
          });
        }

        // Adicionar entrada separada para titulo_alt se existir e for diferente do titulo_original
        if (verse.titulo_alt && verse.titulo_alt !== verse.titulo_original) {
          processedVerses.push({
            id: verse.id,
            titulo_original: verse.titulo_original,
            titulo_alt: verse.titulo_alt,
            titulo_pt_br: verse.titulo_pt_br,
            musical: verse.musical,
            url_imagem: verse.url_imagem,
            classificacao_vocal_alt: verse.classificacao_vocal_alt || [],
            display_title: verse.titulo_alt
          });
        }
      });

      setVerses(processedVerses);
      
      // Criar agrupamentos por classificação vocal
      const groupedByCategory: Record<string, Record<string, VerseItem[]>> = {};
      
      processedVerses.forEach(verse => {
        if (!verse.classificacao_vocal_alt || verse.classificacao_vocal_alt.length === 0) {
          return;
        }
        
        console.log('Processando classificações para:', verse.display_title, verse.classificacao_vocal_alt);
        
        // Verificar se tem solo feminino/masculino e coro para criar subcategorias correlacionadas
        const hasSoloFeminino = verse.classificacao_vocal_alt.some(c => 
          normalizeClassification(c).includes('solo') && normalizeClassification(c).includes('feminino')
        );
        const hasSoloMasculino = verse.classificacao_vocal_alt.some(c => 
          normalizeClassification(c).includes('solo') && normalizeClassification(c).includes('masculino')
        );
        const hasCoro = verse.classificacao_vocal_alt.some(c => 
          normalizeClassification(c).includes('coro')
        );
        
        verse.classificacao_vocal_alt.forEach(classification => {
          const { category, subcategory } = getCategoryFromClassification(classification);
          
          console.log('Classificação:', classification, '-> Categoria:', category, '-> Subcategoria:', subcategory);
          
          // Adicionar na categoria/subcategoria principal
          if (!groupedByCategory[category]) {
            groupedByCategory[category] = {};
          }
          
          if (!groupedByCategory[category][subcategory]) {
            groupedByCategory[category][subcategory] = [];
          }
          
          // Evitar duplicatas
          const exists = groupedByCategory[category][subcategory].some(
            existingVerse => existingVerse.id === verse.id && existingVerse.display_title === verse.display_title
          );
          
          if (!exists) {
            groupedByCategory[category][subcategory].push(verse);
          }
        });
        
        // Adicionar em subcategorias correlacionadas para Solo Feminino/Masculino
        if (hasSoloFeminino && hasCoro) {
          // Adicionar em "Solo feminino com coro"
          if (!groupedByCategory['Solo Feminino']) {
            groupedByCategory['Solo Feminino'] = {};
          }
          if (!groupedByCategory['Solo Feminino']['Solo feminino com coro']) {
            groupedByCategory['Solo Feminino']['Solo feminino com coro'] = [];
          }
          
          const existsComCoro = groupedByCategory['Solo Feminino']['Solo feminino com coro'].some(
            existingVerse => existingVerse.id === verse.id && existingVerse.display_title === verse.display_title
          );
          
          if (!existsComCoro) {
            groupedByCategory['Solo Feminino']['Solo feminino com coro'].push(verse);
          }
        }
        
        if (hasSoloMasculino && hasCoro) {
          // Adicionar em "Solo masculino com coro"
          if (!groupedByCategory['Solo Masculino']) {
            groupedByCategory['Solo Masculino'] = {};
          }
          if (!groupedByCategory['Solo Masculino']['Solo masculino com coro']) {
            groupedByCategory['Solo Masculino']['Solo masculino com coro'] = [];
          }
          
          const existsComCoro = groupedByCategory['Solo Masculino']['Solo masculino com coro'].some(
            existingVerse => existingVerse.id === verse.id && existingVerse.display_title === verse.display_title
          );
          
          if (!existsComCoro) {
            groupedByCategory['Solo Masculino']['Solo masculino com coro'].push(verse);
          }
        }
        
        // Adicionar subcategorias "sem coro" para solos que não têm coro
        if (hasSoloFeminino && !hasCoro) {
          if (!groupedByCategory['Solo Feminino']) {
            groupedByCategory['Solo Feminino'] = {};
          }
          if (!groupedByCategory['Solo Feminino']['Solo feminino sem coro']) {
            groupedByCategory['Solo Feminino']['Solo feminino sem coro'] = [];
          }
          
          const existsSemCoro = groupedByCategory['Solo Feminino']['Solo feminino sem coro'].some(
            existingVerse => existingVerse.id === verse.id && existingVerse.display_title === verse.display_title
          );
          
          if (!existsSemCoro) {
            groupedByCategory['Solo Feminino']['Solo feminino sem coro'].push(verse);
          }
        }
        
        if (hasSoloMasculino && !hasCoro) {
          if (!groupedByCategory['Solo Masculino']) {
            groupedByCategory['Solo Masculino'] = {};
          }
          if (!groupedByCategory['Solo Masculino']['Solo masculino sem coro']) {
            groupedByCategory['Solo Masculino']['Solo masculino sem coro'] = [];
          }
          
          const existsSemCoro = groupedByCategory['Solo Masculino']['Solo masculino sem coro'].some(
            existingVerse => existingVerse.id === verse.id && existingVerse.display_title === verse.display_title
          );
          
          if (!existsSemCoro) {
            groupedByCategory['Solo Masculino']['Solo masculino sem coro'].push(verse);
          }
        }
      });
      
      // Remover categorias vazias
      Object.keys(groupedByCategory).forEach(category => {
        const hasVerses = Object.values(groupedByCategory[category]).some(verses => verses.length > 0);
        if (!hasVerses) {
          delete groupedByCategory[category];
        }
      });
      
      // Converter para array de grupos
      const vocalGroupsArray: VocalClassificationGroup[] = Object.entries(groupedByCategory)
        .map(([category, subcategories]) => ({
          category,
          subcategories: Object.entries(subcategories)
            .map(([name, verses]) => ({
              name,
              verses: verses.sort((a, b) => {
                const titleA = String(a.display_title || '').trim();
                const titleB = String(b.display_title || '').trim();
                return titleA.localeCompare(titleB, 'pt-BR', { sensitivity: 'base' });
              }),
              // Versões sempre fechadas por padrão - usuário precisa clicar na subcategoria para ver
              isExpanded: false
            }))
            .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })),
          // Categorias expandidas por padrão para todas exceto Solo Feminino e Solo Masculino
          isExpanded: category !== 'Solo Feminino' && category !== 'Solo Masculino'
        }))
        .sort((a, b) => {
          // Ordenar categorias na ordem dos filtros
          const orderMap: Record<string, number> = {
            'Solo Feminino': 1,
            'Solo Masculino': 2,
            'Dueto': 3,
            'Trio': 4,
            'Quarteto': 5,
            'Quinteto': 6,
            'Sexteto': 7,
            'Coro': 8,
            'Outros': 9
          };
          
          const orderA = orderMap[a.category] || 999;
          const orderB = orderMap[b.category] || 999;
          
          return orderA - orderB;
        });

      // Debug: Log das categorias criadas
      console.log('Categorias criadas:', vocalGroupsArray.map(g => g.category));
      console.log('Grupos completos:', vocalGroupsArray);

      setVocalGroups(vocalGroupsArray);
      
      // Aplicar filtro inicial
      applyFilter('all', vocalGroupsArray);
    } catch (error) {
      console.error('Erro ao buscar versos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Função auxiliar para aplicar filtro
  const applyFilter = (filterValue: string, groupsToFilter: VocalClassificationGroup[] = vocalGroups) => {
    console.log('Aplicando filtro:', filterValue);
    console.log('Grupos disponíveis:', groupsToFilter.map(g => g.category));
    
    if (groupsToFilter.length === 0) return;
    
    // Mapear filtros para categorias correspondentes
    const getCategoryForFilter = (filter: string): string => {
      switch (filter) {
        case 'solo-feminino':
          return 'Solo Feminino';
        case 'solo-masculino':
          return 'Solo Masculino';
        case 'dueto':
          return 'Dueto';
        case 'trio':
          return 'Trio';
        case 'quarteto':
          return 'Quarteto';
        case 'quinteto':
          return 'Quinteto';
        case 'sexteto':
          return 'Sexteto';
        case 'coro':
          return 'Coro';
        default:
          return 'Outros';
      }
    };
    
    const targetCategory = getCategoryForFilter(filterValue);
    console.log('Categoria alvo:', targetCategory);
    
    // Filtrar por categoria específica
    const filtered = groupsToFilter
      .filter(group => group.category === targetCategory)
      .map(group => ({
        ...group,
        // Categorias expandidas por padrão para todas exceto Solo Feminino e Solo Masculino
        isExpanded: group.category !== 'Solo Feminino' && group.category !== 'Solo Masculino',
        subcategories: group.subcategories.map(subcat => ({
          ...subcat,
          // Versões sempre fechadas por padrão - usuário precisa clicar na subcategoria para ver
          isExpanded: false
        }))
      }));
    
    console.log('Grupos filtrados:', filtered);
    setFilteredVocalGroups(filtered);
  };

  const toggleCategoryExpansion = (categoryIndex: number) => {
    setFilteredVocalGroups(prev => 
      prev.map((group, index) => 
        index === categoryIndex 
          ? { ...group, isExpanded: !group.isExpanded }
          : group
      )
    );
  };

  const toggleSubcategoryExpansion = (categoryIndex: number, subcategoryIndex: number) => {
    setFilteredVocalGroups(prev => 
      prev.map((group, catIndex) => 
        catIndex === categoryIndex 
          ? {
              ...group,
              subcategories: group.subcategories.map((subcat, subIndex) => 
                subIndex === subcategoryIndex 
                  ? { ...subcat, isExpanded: !subcat.isExpanded }
                  : subcat
              )
            }
          : group
      )
    );
  };

  // useEffect para buscar versos quando o componente for montado
  useEffect(() => {
    fetchVerses();
  }, []);

  // useEffect para aplicar filtro inicial quando os grupos forem carregados
  useEffect(() => {
    if (vocalGroups.length > 0) {
      applyFilter(selectedFilter, vocalGroups);
    }
  }, [vocalGroups, selectedFilter]);

  // Função para filtrar grupos
  const filterGroups = (filterValue: string) => {
    setSelectedFilter(filterValue);
    applyFilter(filterValue, vocalGroups);
  };

  // Função para obter o nome da categoria em português
  const getCategoryDisplayName = (category: string): string => {
    const categoryMap: Record<string, string> = {
      'Solo Feminino': 'Solo Feminino',
      'Solo Masculino': 'Solo Masculino',
      'dueto': 'Dueto',
      'trio': 'Trio',
      'quarteto': 'Quarteto',
      'quinteto': 'Quinteto',
      'sexteto': 'Sexteto',
      'coro': 'Coro',
      'outros': 'Outros'
    };
    
    return categoryMap[category] || category;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-center text-gray-800 mb-6">
                Canções por Classificação Vocal
              </CardTitle>
              
              {/* Filtros de classificação vocal */}
              <div className="flex flex-wrap gap-2 justify-center mb-6">
                {vocalClassificationFilters.map((filter) => (
                  <Button
                    key={filter.value}
                    variant={selectedFilter === filter.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => filterGroups(filter.value)}
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
                  {filteredVocalGroups.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <p>Nenhuma canção encontrada para este filtro.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {filteredVocalGroups.map((group, categoryIndex) => (
                        <div key={group.category} className="border rounded-lg overflow-hidden">
                          {/* Cabeçalho da categoria */}
                          <button
                            onClick={() => toggleCategoryExpansion(categoryIndex)}
                            className="w-full flex items-center justify-between p-4 bg-gray-100 hover:bg-gray-200 transition-colors"
                          >
                            <h2 className="text-xl font-bold text-gray-800">
                              {getCategoryDisplayName(group.category)} ({group.subcategories.reduce((total, subcat) => total + subcat.verses.length, 0)})
                            </h2>
                            {group.isExpanded ? (
                              <ChevronUp className="h-5 w-5" />
                            ) : (
                              <ChevronDown className="h-5 w-5" />
                            )}
                          </button>
                          
                          {/* Subcategorias - Para Solo Feminino/Masculino, sempre mostrar subcategorias mesmo quando fechado */}
                          {(group.isExpanded || (group.category === 'Solo Feminino' || group.category === 'Solo Masculino')) && (
                            <div className="bg-white">
                              {group.subcategories.map((subcategory, subcategoryIndex) => {
                                // Verificar se categoria e subcategoria são iguais (duplicação) - APENAS para Solo Feminino/Masculino
                                // Mas não suprimir subcategorias 'com coro' e 'sem coro'
                                const isDuplicateCategory = (group.category === 'Solo Feminino' || group.category === 'Solo Masculino') && 
                                                           normalizeClassification(subcategory.name) === normalizeClassification(group.category) &&
                                                           !subcategory.name.includes('com coro') && !subcategory.name.includes('sem coro');
                                
                                // Para Solo Feminino/Masculino fechados, só mostrar subcategorias especiais (com coro/sem coro)
                                const isSoloCategory = group.category === 'Solo Feminino' || group.category === 'Solo Masculino';
                                const isSpecialSubcategory = subcategory.name.includes('com coro') || subcategory.name.includes('sem coro');
                                
                                if (isSoloCategory && !group.isExpanded && !isSpecialSubcategory) {
                                  return null; // Não renderizar subcategorias normais quando categoria está fechada
                                }
                                
                                if (isDuplicateCategory) {
                                  // Renderizar diretamente as versões sem subcategoria
                                  return (
                                    <div key={subcategory.name} className="p-4 space-y-2">
                                      {subcategory.verses.map((verse, verseIndex) => (
                                        <Link 
                                          key={`${verse.id}-${verseIndex}`}
                                          to={`/verse/${verse.id}`} 
                                          className="block w-full"
                                        >
                                          <div className="flex items-center gap-4 p-3 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer hover:bg-gray-50">
                                            {/* Thumbnail */}
                                            <div className="flex-shrink-0">
                                              <img
                                                src={verse.url_imagem || DEFAULT_VERSE_IMAGE}
                                                alt={verse.display_title}
                                                className="w-12 h-12 object-cover rounded-md"
                                                onError={(e) => {
                                                  const target = e.target as HTMLImageElement;
                                                  target.src = DEFAULT_VERSE_IMAGE;
                                                }}
                                              />
                                            </div>
                                            
                                            {/* Informações da canção */}
                                            <div className="flex-grow">
                                              <h4 className="font-semibold text-gray-800">
                                                {verse.display_title} - {verse.musical}
                                              </h4>
                                            </div>
                                          </div>
                                        </Link>
                                      ))}
                                    </div>
                                  );
                                }
                                
                                // Renderização normal para outras categorias
                                return (
                                  <div key={subcategory.name} className="border-t">
                                    {/* Cabeçalho da subcategoria */}
                                    <button
                                      onClick={() => toggleSubcategoryExpansion(categoryIndex, subcategoryIndex)}
                                      className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                                    >
                                      <h3 className="text-lg font-semibold text-gray-700">
                                        {subcategory.name} ({subcategory.verses.length})
                                      </h3>
                                      {subcategory.isExpanded ? (
                                        <ChevronUp className="h-4 w-4" />
                                      ) : (
                                        <ChevronDown className="h-4 w-4" />
                                      )}
                                    </button>
                                    
                                    {/* Lista de canções */}
                                    {subcategory.isExpanded && (
                                      <div className="p-4 space-y-2">
                                        {subcategory.verses.map((verse, verseIndex) => (
                                          <Link 
                                            key={`${verse.id}-${verseIndex}`}
                                            to={`/verse/${verse.id}`} 
                                            className="block w-full"
                                          >
                                            <div className="flex items-center gap-4 p-3 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer hover:bg-gray-50">
                                              {/* Thumbnail */}
                                              <div className="flex-shrink-0">
                                                <img
                                                  src={verse.url_imagem || DEFAULT_VERSE_IMAGE}
                                                  alt={verse.display_title}
                                                  className="w-12 h-12 object-cover rounded-md"
                                                  onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.src = DEFAULT_VERSE_IMAGE;
                                                  }}
                                                />
                                              </div>
                                              
                                              {/* Informações da canção */}
                                              <div className="flex-grow">
                                                <h4 className="font-semibold text-gray-800">
                                                  {verse.display_title} - {verse.musical}
                                                </h4>
                                              </div>
                                            </div>
                                          </Link>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  

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

export default SongsByVocalClassification;