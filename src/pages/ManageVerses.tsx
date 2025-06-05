import React, { useState } from 'react';
import { Search, Filter, Plus, Edit, Trash2, Eye, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Link } from 'react-router-dom';
import { CartProvider } from '@/hooks/useCart';

interface Verse {
  id: string;
  title: string;
  artist: string;
  category: string;
  views: number;
  image?: string;
  createdAt: string;
  status: 'active' | 'inactive';
}

const ManageVerses = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('title');

  // Dados mockados - serão substituídos por dados reais do Supabase
  const mockVerses: Verse[] = [
    {
      id: '1',
      title: 'Verso Inspirador 1',
      artist: 'Artista Gospel',
      category: 'Gospel',
      views: 1250,
      image: '/placeholder.svg',
      createdAt: '2024-01-15',
      status: 'active'
    },
    {
      id: '2',
      title: 'Melodia Celestial',
      artist: 'Coral Divino',
      category: 'Louvor',
      views: 890,
      createdAt: '2024-01-10',
      status: 'active'
    },
    {
      id: '3',
      title: 'Hino de Gratidão',
      artist: 'Ministério Adoração',
      category: 'Adoração',
      views: 2100,
      createdAt: '2024-01-08',
      status: 'inactive'
    },
    {
      id: '4',
      title: 'Canção da Esperança',
      artist: 'Banda Fé',
      category: 'Gospel',
      views: 1750,
      createdAt: '2024-01-05',
      status: 'active'
    },
    {
      id: '5',
      title: 'Salmo Moderno',
      artist: 'Grupo Harmonia',
      category: 'Contemporâneo',
      views: 950,
      createdAt: '2024-01-03',
      status: 'active'
    }
  ];

  const categories = ['Gospel', 'Louvor', 'Adoração', 'Contemporâneo'];

  // Filtrar versos baseado na busca e filtros
  const filteredVerses = mockVerses.filter(verse => {
    const matchesSearch = verse.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         verse.artist.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || verse.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || verse.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Ordenar versos
  const sortedVerses = [...filteredVerses].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title);
      case 'artist':
        return a.artist.localeCompare(b.artist);
      case 'views':
        return b.views - a.views;
      case 'date':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      default:
        return 0;
    }
  });

  const handleEdit = (id: string) => {
    console.log('Editar verso:', id);
    // Implementar lógica de edição
  };

  const handleDelete = (id: string) => {
    console.log('Excluir verso:', id);
    // Implementar lógica de exclusão
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
                  <SelectItem value="title">Título</SelectItem>
                  <SelectItem value="artist">Artista</SelectItem>
                  <SelectItem value="views">Visualizações</SelectItem>
                  <SelectItem value="date">Data de criação</SelectItem>
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
                  <p className="text-2xl font-bold text-gray-900">{mockVerses.length}</p>
                </div>
                <Music className="w-8 h-8 text-primary" />
              </div>
            </Card>
            <Card className="p-6 border-0 shadow-sm bg-gradient-to-br from-green-50 to-emerald-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Versos Ativos</p>
                  <p className="text-2xl font-bold text-gray-900">{mockVerses.filter(v => v.status === 'active').length}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{mockVerses.reduce((acc, v) => acc + v.views, 0).toLocaleString()}</p>
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
                  Mostrando {sortedVerses.length} de {mockVerses.length} versos
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
                          {verse.image ? (
                            <img src={verse.image} alt={verse.title} className="w-full h-full object-cover" />
                          ) : (
                            <Music className="w-6 h-6 text-primary/60" />
                          )}
                        </div>

                        {/* Informações do Verso */}
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{verse.title}</h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              verse.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {verse.status === 'active' ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{verse.artist}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span className="px-2 py-1 bg-primary/10 text-primary rounded-full">{verse.category}</span>
                            <span>{verse.views.toLocaleString()} visualizações</span>
                            <span>Criado em {new Date(verse.createdAt).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex items-center space-x-2">
                        <Link to={`/verse/${verse.id}`}>
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
                          onClick={() => handleDelete(verse.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </main>

        <Footer />
      </div>
    </CartProvider>
  );
};

export default ManageVerses;