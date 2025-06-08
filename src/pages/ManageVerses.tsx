import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Edit, Trash2, Eye, Music, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Link, useNavigate } from 'react-router-dom';
import { CartProvider } from '@/hooks/useCart';
import { useAppCache } from '@/hooks/useAppCache';
import { getVersesPaginated, deleteVerse, getCategories, generateSlug } from '../services/versesService';
import { Database } from '../integrations/supabase/types';
import { toast } from '@/components/ui/sonner';

type Verse = Database['public']['Tables']['versoes']['Row'];

const ManageVerses = () => {
  const navigate = useNavigate();
  const { clearCache, invalidateQueries } = useAppCache();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('titulo_pt_br');
  const [verses, setVerses] = useState<Verse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalVerses, setTotalVerses] = useState(0);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [verseToDelete, setVerseToDelete] = useState<Verse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const ITEMS_PER_PAGE = 50;

  useEffect(() => {
    const fetchInitialData = async () => {
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
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Filtrar versos baseado na busca e filtros
  const filteredVerses = verses.filter(verse => {
    const matchesSearch = (verse.titulo_original || 'Dados inconsistentes').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (verse.musical || 'Dados inconsistentes').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || (verse.estilo && verse.estilo.includes(selectedCategory));
    const matchesStatus = selectedStatus === 'all' || verse.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Ordenar versos
  const sortedVerses = [...filteredVerses].sort((a, b) => {
    switch (sortBy) {
      case 'titulo_pt_br':
        return (a.titulo_original || 'Dados inconsistentes').localeCompare(b.titulo_original || 'Dados inconsistentes');
      case 'musical':
        return (a.musical || 'Dados inconsistentes').localeCompare(b.musical || 'Dados inconsistentes');
      case 'visualizacoes':
        return (b.visualizacoes || 0) - (a.visualizacoes || 0);
      case 'criada_em':
        return new Date(b.criada_em || 0).getTime() - new Date(a.criada_em || 0).getTime();
      default:
        return 0;
    }
  });

  const handleEdit = (id: number) => {
    // Limpa cache antes de navegar para evitar problemas
    clearCache(['verses', 'categories']);
    navigate(`/edit-verse/${id}`);
  };

  const handleDelete = (verse: Verse) => {
    setVerseToDelete(verse);
    setDeleteDialogOpen(true);
  };

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMoreData) return;
    
    try {
      setIsLoadingMore(true);
      const nextPage = currentPage + 1;
      console.log(`Carregando página ${nextPage}...`);
      
      const result = await getVersesPaginated(nextPage, ITEMS_PER_PAGE);
      console.log(`Novos versos carregados: ${result.data.length}`);
      
      setVerses(prev => [...prev, ...result.data]);
      setHasMoreData(result.hasMore);
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
        toast.success('Verso excluído com sucesso!');
      } else {
        toast.error('Erro ao excluir verso. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao excluir verso:', error);
      toast.error('Erro ao excluir verso. Tente novamente.');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setVerseToDelete(null);
    }
  };

  return (
    <CartProvider>
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="container mx-auto px-4 sm:px-6 py-8">
          {/* Cabeçalho da Página */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Gerenciar Versos</h1>
              <p className="text-gray-600">Gerencie todos os seus versos musicais</p>
            </div>
            <Link to="/create-verse">
              <Button className="mt-4 sm:mt-0 bg-primary hover:bg-primary/90 rounded-full">
                <Plus className="w-4 h-4 mr-2" />
                Novo Verso
              </Button>
            </Link>
          </div>

          {/* Filtros e Busca */}
          <Card className="p-6 mb-8 border-0 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Campo de Busca */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por título ou artista..."
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
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="rounded-full border-gray-300">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="titulo_pt_br">Título</SelectItem>
                  <SelectItem value="musical">Musical</SelectItem>
                  <SelectItem value="visualizacoes">Visualizações</SelectItem>
                  <SelectItem value="criada_em">Data de criação</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <Card className="p-6 border-0 shadow-sm bg-gradient-to-br from-primary/10 to-purple-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Versos</p>
                  <p className="text-2xl font-bold text-gray-900">{verses.length}</p>
                </div>
                <Music className="w-8 h-8 text-primary" />
              </div>
            </Card>
            <Card className="p-6 border-0 shadow-sm bg-gradient-to-br from-green-50 to-emerald-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Versos Ativos</p>
                  <p className="text-2xl font-bold text-gray-900">{verses.filter(v => v.status === 'active').length}</p>
                </div>
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
            </Card>
            <Card className="p-6 border-0 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Visualizações</p>
                  <p className="text-2xl font-bold text-gray-900">{verses.reduce((acc, v) => acc + (v.visualizacoes || 0), 0).toLocaleString()}</p>
                </div>
                <Eye className="w-8 h-8 text-blue-500" />
              </div>
            </Card>
          </div>

          {/* Lista de Versos */}
          <Card className="border-0 shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Versos ({sortedVerses.length})
                </h2>
                <div className="text-sm text-gray-500">
                  Mostrando {sortedVerses.length} de {totalVerses} versos
                </div>
              </div>

              {sortedVerses.length === 0 ? (
                <div className="text-center py-12">
                  <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum verso encontrado</p>
                  <p className="text-sm text-gray-400 mt-1">Tente ajustar os filtros de busca</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedVerses.map((verse) => (
                    <div key={verse.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-4">
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
                            <h3 className="font-semibold text-gray-900">{verse.titulo_original || 'Dados inconsistentes'}</h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              verse.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {verse.status === 'active' ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{verse.musical || 'Dados inconsistentes'}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span className="px-2 py-1 bg-primary/10 text-primary rounded-full">{verse.estilo?.[0] || 'Sem categoria'}</span>
                            <span>{(verse.visualizacoes || 0).toLocaleString()} visualizações</span>
                            <span>Criado em {verse.criada_em ? new Date(verse.criada_em).toLocaleDateString('pt-BR') : 'Data não disponível'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex items-center space-x-2">
                        <Link to={`/${generateSlug(verse.titulo_pt_br || '')}`}>
                          <Button variant="outline" size="sm" className="rounded-full">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
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
            
            {hasMoreData && (
              <div className="flex flex-col items-center mt-8 space-y-2">
                <p className="text-sm text-gray-600">
                  Exibindo {verses.length} de {totalVerses} versos
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
                Tem certeza que deseja excluir o verso <strong>"{verseToDelete?.titulo_pt_br}"</strong>?
                <br /><br />
                Esta ação não pode ser desfeita. O verso será marcado como inativo e não aparecerá mais na aplicação.
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
      </div>
    </CartProvider>
  );
};

export default ManageVerses;