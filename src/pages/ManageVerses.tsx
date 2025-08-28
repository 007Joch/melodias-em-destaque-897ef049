import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Edit, Trash2, Music, AlertTriangle, CheckSquare, Square, User, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '@/hooks/useAuth';
import { getVersesPaginated, deleteVerse, deleteMultipleVerses, deleteAllVerses, getCategories, generateSlug, getAllVerses } from '../services/versesService';
import { Database } from '../integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { CartProvider } from '@/hooks/useCart';

// Função para obter categoria da classificação vocal
const getCategoryFromVerse = (verse: any): string => {
  // Usa apenas a classificacao_vocal_alt, sem fallbacks
  if (verse.classificacao_vocal_alt && Array.isArray(verse.classificacao_vocal_alt) && verse.classificacao_vocal_alt.length > 0) {
    return verse.classificacao_vocal_alt.join(', ');
  }
  
  // Retorna vazio se não houver classificação
  return '';
};

// Interface específica para Verse com tipos mais flexíveis
interface Verse {
  id: number;
  titulo_original: string;
  titulo_pt_br: string;
  musical: string;
  estilo: string[] | null;
  status: string | null;
  visualizacoes: number | null;
  criada_em: string | null;
  url_imagem: string | null;
  ano_gravacao: number | null;
  atualizada_em: string | null;
  audio_instrumental: string[] | null;
  [key: string]: any; // Para permitir propriedades adicionais
}

const ManageVerses: React.FC = () => {
  // Hooks devem estar no topo, antes de qualquer return condicional
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Estados do componente
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('titulo_pt_br');
  const [filterType, setFilterType] = useState('titulo'); // 'titulo', 'musical', 'data'
  const [musicalGroups, setMusicalGroups] = useState<{[key: string]: Verse[]}>({});
  const [verses, setVerses] = useState<Verse[]>([]);
  const [allVerses, setAllVerses] = useState<Verse[]>([]); // Todos os versos para filtros
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalVerses, setTotalVerses] = useState(0);
  const [totalActiveVerses, setTotalActiveVerses] = useState(0);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [verseToDelete, setVerseToDelete] = useState<Verse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedVerses, setSelectedVerses] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const ITEMS_PER_PAGE = 50;

  const loadAllVerses = async () => {
    try {
      const allVersesData = await getAllVerses();
      setAllVerses(allVersesData);
      setTotalVerses(allVersesData.length);
      setTotalActiveVerses(allVersesData.filter(verse => verse.status === 'active').length);
    } catch (error) {
      console.error('Erro ao carregar todos os versos:', error);
    }
  };

  const loadVerses = async (page = 1, append = false) => {
    try {
      if (page === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const result = await getVersesPaginated(page, 50);
      
      if (append) {
        setVerses(prev => [...prev, ...result.data]);
      } else {
        setVerses(result.data);
      }
      
      setHasMoreData(result.hasMore);
      setCurrentPage(page);
    } catch (error) {
      console.error('Erro ao carregar versos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar versos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const [versesResult, categoriesData] = await Promise.all([
          getVersesPaginated(1, ITEMS_PER_PAGE),
          getCategories()
        ]);
        setVerses(versesResult.data);
        setTotalVerses(versesResult.total);
        setHasMoreData(versesResult.hasMore);
        setCurrentPage(1);
        setCategories(categoriesData);
        
        // Carregar todos os versos para estatísticas
        await loadAllVerses();
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Função para agrupar versos por musical
  const groupVersesByMusical = (versesToGroup: Verse[]) => {
    const grouped = versesToGroup.reduce((acc, verse) => {
      const musical = verse.musical || 'Sem Musical';
      if (!acc[musical]) {
        acc[musical] = [];
      }
      acc[musical].push(verse);
      return acc;
    }, {} as {[key: string]: Verse[]});
    
    // Ordenar versos dentro de cada grupo alfabeticamente
    Object.keys(grouped).forEach(musical => {
      grouped[musical].sort((a, b) => 
        (a.titulo_original || 'Dados inconsistentes').localeCompare(b.titulo_original || 'Dados inconsistentes')
      );
    });
    
    return grouped;
  };

  // Filtrar versos baseado no tipo de filtro usando TODOS os versos
  const getFilteredVerses = () => {
    let filtered = allVerses.filter(verse => {
      const matchesCategory = selectedCategory === 'all' || (verse.estilo && verse.estilo.includes(selectedCategory));
      const matchesStatus = selectedStatus === 'all' || 
                           (selectedStatus === 'active' && verse.status === 'active') ||
                           (selectedStatus === 'inactive' && verse.status !== 'active');
      
      let matchesSearch = true;
       if (searchTerm.trim()) {
         if (filterType === 'titulo') {
           // Buscar apenas por titulo_original
           matchesSearch = (verse.titulo_original || '').toLowerCase().includes(searchTerm.toLowerCase());
         } else if (filterType === 'musical') {
           // Buscar apenas por musical
           matchesSearch = (verse.musical || '').toLowerCase().includes(searchTerm.toLowerCase());
         } else if (filterType === 'data') {
           // Para filtro de data, buscar por título original como fallback
           matchesSearch = (verse.titulo_original || '').toLowerCase().includes(searchTerm.toLowerCase());
         }
       }
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
    
    return filtered;
  };

  // Obter versos filtrados
  const filteredVerses = getFilteredVerses();

  // Ordenar ou agrupar baseado no tipo de filtro
  const getDisplayData = () => {
    if (filterType === 'musical') {
      // Agrupar por musical e ordenar musicais alfabeticamente
      const grouped = groupVersesByMusical(filteredVerses);
      const sortedMusicals = Object.keys(grouped).sort((a, b) => 
        a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })
      );
      return { type: 'grouped', data: grouped, musicals: sortedMusicals };
    } else {
      // Ordenar lista simples
      const sorted = [...filteredVerses].sort((a, b) => {
        switch (sortBy) {
          case 'titulo_pt_br':
            return (a.titulo_pt_br || 'Dados inconsistentes').localeCompare(b.titulo_pt_br || 'Dados inconsistentes');
          case 'musical':
            return (a.musical || 'Dados inconsistentes').localeCompare(b.musical || 'Dados inconsistentes');
          case 'criada_em':
            return new Date(b.criada_em || 0).getTime() - new Date(a.criada_em || 0).getTime();
          default:
            return (a.titulo_original || 'Dados inconsistentes').localeCompare(b.titulo_original || 'Dados inconsistentes');
        }
      });
      return { type: 'list', data: sorted };
    }
  };

  const displayData = getDisplayData();

  const handleEdit = (id: number) => {
    navigate(`/edit-verse/${id}`);
  };

  const handleView = (id: number) => {
    navigate(`/verse/${id}`);
  };

  const handleTitleClick = (id: number) => {
    navigate(`/edit-verse/${id}`);
  };

  const handleDelete = (verse: Verse) => {
    setVerseToDelete(verse);
    setDeleteDialogOpen(true);
  };

  const handleLoadMore = async () => {
    if (isLoadingMore) return;
    
    try {
      setIsLoadingMore(true);
      const nextPage = currentPage + 1;
      console.log(`Carregando página ${nextPage}...`);
      
      setCurrentPage(nextPage);
    } catch (err) {
      console.error('Erro ao carregar mais versos:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const confirmDelete = async () => {
    if (!verseToDelete) return;

    try {
      setIsDeleting(true);
      const success = await deleteVerse(verseToDelete.id);
      
      if (success) {
        // Atualizar a lista de versos removendo o verso deletado
        setVerses(prev => prev.filter(v => v.id !== verseToDelete.id));
        setTotalVerses(prev => prev - 1);
        toast({
          title: "Sucesso",
          description: "Verso excluído com sucesso!"
        });
      } else {
        toast({
          title: "Erro",
          description: "Erro ao excluir verso. Tente novamente.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Erro ao excluir verso:', error);
      if (error.message?.includes('Usuário não autenticado')) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado para excluir versos.",
          variant: "destructive"
        });
      } else if (error.message?.includes('Permissão negada') || error.message?.includes('admin')) {
        toast({
          title: "Erro",
          description: "Apenas administradores podem excluir versos.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Erro",
          description: "Erro ao excluir verso. Tente novamente.",
          variant: "destructive"
        });
      }
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setVerseToDelete(null);
    }
  };

  // Funções de seleção múltipla
  const handleSelectVerse = (verseId: number) => {
    const newSelected = new Set(selectedVerses);
    if (newSelected.has(verseId)) {
      newSelected.delete(verseId);
    } else {
      newSelected.add(verseId);
    }
    setSelectedVerses(newSelected);
    setSelectAll(newSelected.size === verses.length);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedVerses(new Set());
      setSelectAll(false);
    } else {
      const allIds = new Set(verses.map(v => v.id));
      setSelectedVerses(allIds);
      setSelectAll(true);
    }
  };

  const handleBulkDelete = () => {
    if (selectedVerses.size === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um verso para deletar.",
        variant: "destructive"
      });
      return;
    }
    setBulkDeleteDialogOpen(true);
  };

  const confirmBulkDelete = async () => {
    try {
      setIsBulkDeleting(true);
      const idsToDelete = Array.from(selectedVerses);
      const success = await deleteMultipleVerses(idsToDelete);
      
      if (success) {
        setVerses(prev => prev.filter(v => !selectedVerses.has(v.id)));
        setTotalVerses(prev => prev - selectedVerses.size);
        setSelectedVerses(new Set());
        setSelectAll(false);
        toast({
          title: "Sucesso",
          description: `${idsToDelete.length} versos excluídos com sucesso!`
        });
      } else {
        toast({
          title: "Erro",
          description: "Erro ao excluir versos selecionados. Tente novamente.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Erro ao excluir versos:', error);
      if (error.message?.includes('Usuário não autenticado')) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado para excluir versos.",
          variant: "destructive"
        });
      } else if (error.message?.includes('Permissão negada') || error.message?.includes('admin')) {
        toast({
          title: "Erro",
          description: "Apenas administradores podem excluir versos.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Erro",
          description: "Erro ao excluir versos selecionados. Tente novamente.",
          variant: "destructive"
        });
      }
    } finally {
      setIsBulkDeleting(false);
      setBulkDeleteDialogOpen(false);
    }
  };

  const handleDeleteAll = () => {
    setDeleteAllDialogOpen(true);
  };

  const confirmDeleteAll = async () => {
    try {
      setIsBulkDeleting(true);
      const success = await deleteAllVerses();
      
      if (success) {
        setVerses([]);
        setTotalVerses(0);
        setSelectedVerses(new Set());
        setSelectAll(false);
        setHasMoreData(false);
        setCurrentPage(1);
        toast({
          title: "Sucesso",
          description: "Todos os versos foram excluídos com sucesso!"
        });
      } else {
        toast({
          title: "Erro",
          description: "Erro ao excluir todos os versos. Tente novamente.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Erro ao excluir todos os versos:', error);
      if (error.message?.includes('Usuário não autenticado')) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado para excluir versos.",
          variant: "destructive"
        });
      } else if (error.message?.includes('Permissão negada') || error.message?.includes('admin')) {
        toast({
          title: "Erro",
          description: "Apenas administradores podem excluir versos.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Erro",
          description: "Erro ao excluir todos os versos. Tente novamente.",
          variant: "destructive"
        });
      }
    } finally {
      setIsBulkDeleting(false);
      setDeleteAllDialogOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
          <Header />
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <p className="text-gray-600">Carregando...</p>
            </div>
          </div>
          <Footer />
        </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
          <Header />
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center min-h-[400px]">
              <Card className="w-full max-w-md mx-4">
                <CardContent className="p-8 text-center">
                  <User className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
                  <p className="text-gray-600 mb-4">Você precisa estar logado para acessar esta página.</p>
                  <Link to="/login">
                    <Button className="w-full">
                      Fazer Login
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
          <Footer />
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="container mx-auto px-4 sm:px-6 py-8">
          {/* Cabeçalho da Página */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Gerenciar Versões</h1>
              <p className="text-gray-600">Gerencie todas as suas versões musicais</p>
            </div>
            <Link to="/create-verse">
              <Button className="mt-4 sm:mt-0 bg-primary hover:bg-primary/90 rounded-full">
                <Plus className="w-4 h-4 mr-2" />
                Nova Versão
              </Button>
            </Link>
          </div>

          {/* Ações em Massa */}
          {selectedVerses.size > 0 && (
            <Card className="p-4 mb-6 border-0 shadow-sm bg-blue-50">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-blue-700">
                    {selectedVerses.size} versão(ões) selecionada(s)
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedVerses(new Set());
                      setSelectAll(false);
                    }}
                    className="text-blue-600 border-blue-300 hover:bg-blue-100"
                  >
                    Limpar seleção
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    disabled={isBulkDeleting}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Deletar Selecionados
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Botões de Ação Global */}
          <Card className="p-4 mb-6 border-0 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="border-gray-300"
                >
                  {selectAll ? (
                    <CheckSquare className="w-4 h-4 mr-2" />
                  ) : (
                    <Square className="w-4 h-4 mr-2" />
                  )}
                  {selectAll ? 'Desmarcar Todos' : 'Selecionar Todos'}
                </Button>
                <span className="text-sm text-gray-600">
                  Total: {totalVerses} versões
                </span>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteAll}
                disabled={isBulkDeleting || verses.length === 0}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Deletar Todos os Versos
              </Button>
            </div>
          </Card>

          {/* Filtros e Busca */}
          <Card className="p-6 mb-8 border-0 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Campo de Busca */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder={filterType === 'titulo' ? 'Buscar por título original...' : filterType === 'musical' ? 'Buscar por musical...' : 'Buscar versões...'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 rounded-full border-gray-300 focus:border-primary"
                  />
                </div>
              </div>

              {/* Filtro por Categoria */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="rounded-full border-gray-300">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Filtro por Status */}
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="rounded-full border-gray-300">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>

              {/* Ordenação */}
              <Select value={filterType} onValueChange={(value) => {
                  setFilterType(value);
                  setSearchTerm(''); // Limpar busca ao trocar filtro
                  if (value === 'titulo') {
                    setSortBy('titulo_pt_br');
                  } else if (value === 'musical') {
                    setSortBy('musical');
                  } else if (value === 'data') {
                    setSortBy('criada_em');
                  }
                }}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="titulo">Título</SelectItem>
                    <SelectItem value="musical">Musical</SelectItem>
                    <SelectItem value="data">Data de criação</SelectItem>
                  </SelectContent>
                </Select>
            </div>
          </Card>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <Card className="p-6 border-0 shadow-sm bg-gradient-to-br from-primary/10 to-purple-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Versões</p>
                  <p className="text-2xl font-bold text-gray-900">{totalVerses}</p>
                </div>
                <Music className="w-8 h-8 text-primary" />
              </div>
            </Card>
            <Card className="p-6 border-0 shadow-sm bg-gradient-to-br from-green-50 to-emerald-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Versões Ativas</p>
                  <p className="text-2xl font-bold text-gray-900">{totalActiveVerses}</p>
                </div>
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
            </Card>

          </div>

          {/* Lista de Versos */}
          <Card className="border-0 shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Versões ({filteredVerses.length})
                </h2>
                <div className="text-sm text-gray-500">
                  Mostrando {filteredVerses.length} de {totalVerses} versões
                </div>
              </div>

              {filteredVerses.length === 0 ? (
                <div className="text-center py-12">
                  <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhuma versão encontrada</p>
                  <p className="text-sm text-gray-400 mt-1">Tente ajustar os filtros de busca</p>
                </div>
              ) : displayData.type === 'grouped' ? (
                // Exibição agrupada por musical
                displayData.musicals?.map((musical) => (
                  <div key={musical} className="space-y-3 mb-6">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border-l-4 border-blue-500">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{musical}</h3>
                      <p className="text-sm text-gray-600">{displayData.data[musical].length} versão(ões)</p>
                    </div>
                    
                    <div className="ml-4 space-y-3">
                      {(displayData.data[musical] as Verse[]).map((verse) => (
                        <div key={verse.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                          <div className="flex items-center space-x-4">
                            {/* Checkbox de Seleção */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSelectVerse(verse.id)}
                              className="p-1 h-auto hover:bg-transparent"
                            >
                              {selectedVerses.has(verse.id) ? (
                                <CheckSquare className="w-5 h-5 text-blue-600" />
                              ) : (
                                <Square className="w-5 h-5 text-gray-400 hover:text-blue-600" />
                              )}
                            </Button>
                            {/* Imagem do Verso */}
                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-primary/10 to-purple-100 flex items-center justify-center">
                              {verse.url_imagem ? (
                                <img src={verse.url_imagem} alt={verse.titulo_pt_br} className="w-full h-full object-cover" />
                              ) : (
                                <Music className="w-6 h-6 text-primary/60" />
                              )}
                            </div>

                            {/* Informações do Verso */}
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 
                                  className="font-medium text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                                  onClick={() => handleTitleClick(verse.id)}
                                >
                                  {verse.titulo_original || 'Dados inconsistentes'}
                                </h4>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  verse.status === 'active' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {verse.status === 'active' ? 'Ativo' : 'Inativo'}
                                </span>
                              </div>
                              <div className="flex items-center flex-wrap gap-2 text-xs text-gray-500">
                                {verse.classificacao_vocal_alt && Array.isArray(verse.classificacao_vocal_alt) && verse.classificacao_vocal_alt.length > 0 ? (
                                  verse.classificacao_vocal_alt.map((classificacao, index) => (
                                    <span key={index} className="px-2 py-1 bg-primary/10 text-primary rounded-full">
                                      {classificacao}
                                    </span>
                                  ))
                                ) : (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-full">Sem classificação</span>
                                )}
                                <span className="text-gray-400">•</span>
                                <span>Criado em {verse.criada_em ? new Date(verse.criada_em).toLocaleDateString('pt-BR') : 'Data não disponível'}</span>
                              </div>
                            </div>
                          </div>

                          {/* Ações */}
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="rounded-full hover:bg-green-50 hover:border-green-300 text-green-600"
                              onClick={() => handleView(verse.id)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="rounded-full hover:bg-blue-50 hover:border-blue-300"
                              onClick={() => handleEdit(verse.id)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="rounded-full hover:bg-red-50 hover:border-red-300 text-red-600"
                              onClick={() => handleDelete(verse)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                // Exibição em lista simples
                <div className="space-y-4">
                  {(displayData.data as Verse[]).slice(0, currentPage * ITEMS_PER_PAGE).map((verse) => (
                    <div key={verse.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-4">
                        {/* Checkbox de Seleção */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSelectVerse(verse.id)}
                          className="p-1 h-auto hover:bg-transparent"
                        >
                          {selectedVerses.has(verse.id) ? (
                            <CheckSquare className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400 hover:text-blue-600" />
                          )}
                        </Button>
                        {/* Imagem do Verso */}
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-primary/10 to-purple-100 flex items-center justify-center">
                          {verse.url_imagem ? (
                            <img src={verse.url_imagem} alt={verse.titulo_pt_br} className="w-full h-full object-cover" />
                          ) : (
                            <Music className="w-6 h-6 text-primary/60" />
                          )}
                        </div>

                        {/* Informações do Verso */}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 
                              className="font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                              onClick={() => handleTitleClick(verse.id)}
                            >
                              {verse.titulo_original || 'Dados inconsistentes'}
                            </h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              verse.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {verse.status === 'active' ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{verse.musical || 'Dados inconsistentes'}</p>
                          <div className="flex items-center flex-wrap gap-2 text-xs text-gray-500">
                            {verse.classificacao_vocal_alt && Array.isArray(verse.classificacao_vocal_alt) && verse.classificacao_vocal_alt.length > 0 ? (
                              verse.classificacao_vocal_alt.map((classificacao, index) => (
                                <span key={index} className="px-2 py-1 bg-primary/10 text-primary rounded-full">
                                  {classificacao}
                                </span>
                              ))
                            ) : (
                              <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-full">Sem classificação</span>
                            )}
                            <span className="text-gray-400">•</span>
                            <span>Criado em {verse.criada_em ? new Date(verse.criada_em).toLocaleDateString('pt-BR') : 'Data não disponível'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="rounded-full hover:bg-green-50 hover:border-green-300 text-green-600"
                          onClick={() => handleView(verse.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="rounded-full hover:bg-blue-50 hover:border-blue-300"
                          onClick={() => handleEdit(verse.id)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="rounded-full hover:bg-red-50 hover:border-red-300 text-red-600"
                          onClick={() => handleDelete(verse)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {displayData.type === 'list' && filteredVerses.length > (displayData.data as Verse[]).slice(0, currentPage * ITEMS_PER_PAGE).length && (
              <div className="flex flex-col items-center mt-8 space-y-2">
                <p className="text-sm text-gray-600">
                  Exibindo {Math.min((displayData.data as Verse[]).slice(0, currentPage * ITEMS_PER_PAGE).length, filteredVerses.length)} de {filteredVerses.length} versos
                </p>
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isLoadingMore ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Carregando...</span>
                    </>
                  ) : (
                    <span>Carregar Mais</span>
                  )}
                </button>
              </div>
            )}
          </Card>
        </main>

        <Footer />
        
        {/* Diálogo de Confirmação de Exclusão */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span>Confirmar Exclusão</span>
              </DialogTitle>
              <DialogDescription className="text-left">
                Tem certeza que deseja excluir a versão <strong>"{verseToDelete?.titulo_pt_br}"</strong>?
                <br /><br />
                Esta ação não pode ser desfeita. A versão será marcada como inativa e não aparecerá mais na aplicação.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={isDeleting}
                className="rounded-full"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="rounded-full"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Diálogo de Confirmação de Exclusão em Massa */}
        <Dialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span>Confirmar Exclusão em Massa</span>
              </DialogTitle>
              <DialogDescription className="text-left">
                Tem certeza que deseja excluir <strong>{selectedVerses.size} versão(ões)</strong> selecionada(s)?
                <br /><br />
                Esta ação não pode ser desfeita. As versões serão permanentemente removidas do banco de dados.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setBulkDeleteDialogOpen(false)}
                disabled={isBulkDeleting}
                className="rounded-full"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={confirmBulkDelete}
                disabled={isBulkDeleting}
                className="rounded-full"
              >
                {isBulkDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir {selectedVerses.size} Versão(ões)
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Diálogo de Confirmação de Exclusão de Todos os Versos */}
        <Dialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <span>Confirmar Exclusão de Todas as Versões</span>
              </DialogTitle>
              <DialogDescription className="text-left">
                <strong>ATENÇÃO:</strong> Tem certeza que deseja excluir <strong>TODAS as {totalVerses} versões</strong> do banco de dados?
                <br /><br />
                Esta ação é <strong>IRREVERSÍVEL</strong> e removerá permanentemente todas as versões, incluindo suas imagens, áudios e dados associados.
                <br /><br />
                Digite <strong>"CONFIRMAR"</strong> para prosseguir:
              </DialogDescription>
            </DialogHeader>
            <div className="px-6 pb-4">
              <input
                type="text"
                placeholder="Digite CONFIRMAR"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                onChange={(e) => {
                  const confirmButton = document.getElementById('confirm-delete-all') as HTMLButtonElement;
                  if (confirmButton) {
                    confirmButton.disabled = e.target.value !== 'CONFIRMAR' || isBulkDeleting;
                  }
                }}
              />
            </div>
            <DialogFooter className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setDeleteAllDialogOpen(false)}
                disabled={isBulkDeleting}
                className="rounded-full"
              >
                Cancelar
              </Button>
              <Button
                id="confirm-delete-all"
                variant="destructive"
                onClick={confirmDeleteAll}
                disabled={true}
                className="rounded-full"
              >
                {isBulkDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Excluindo Todos...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir Todos os Versos
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  );
};

export default ManageVerses;