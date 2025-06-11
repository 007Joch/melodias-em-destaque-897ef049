import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getVerses, deleteVerse } from '@/services/versesService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Plus, Search, Music, Eye, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Verse {
  id: number;
  titulo_pt_br: string;
  titulo_original: string;
  musical: string;
  estilo: string[];
  dificuldade: number;
  valor: number;
  url_imagem: string;
  status: string;
  criada_em: string;
  atualizada_em: string;
}

const ManageVerses = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [musicalFilter, setMusicalFilter] = useState('all');
  const [styleFilter, setStyleFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');

  useEffect(() => {
    loadVerses();
  }, []);

  const loadVerses = async () => {
    try {
      setLoading(true);
      setError(null);
      const versesData = await getVerses(searchTerm, musicalFilter, styleFilter, difficultyFilter);
      setVerses(versesData);
    } catch (error: any) {
      console.error('Erro ao carregar versos:', error);
      setError(error.message || 'Erro ao carregar versos');
      toast.error('Erro ao carregar versos: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este verso? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      await deleteVerse(id);
      toast.success('Verso excluído com sucesso');
      loadVerses();
    } catch (error: any) {
      console.error('Erro ao excluir verso:', error);
      toast.error('Erro ao excluir verso: ' + error.message);
    }
  };

  const filteredVerses = verses.filter(verse => {
    const matchesSearch = verse.titulo_pt_br?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         verse.titulo_original?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         verse.musical?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMusical = musicalFilter === 'all' || verse.musical === musicalFilter;
    const matchesStyle = styleFilter === 'all' || verse.estilo?.includes(styleFilter);
    const matchesDifficulty = difficultyFilter === 'all' || verse.dificuldade?.toString() === difficultyFilter;

    return matchesSearch && matchesMusical && matchesStyle && matchesDifficulty;
  });

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Music className="w-8 h-8" />
            Gerenciar Versos
          </h1>
          <p className="text-gray-600 mt-1">
            Total de versos: {verses.length}
          </p>
        </div>
        <Button onClick={loadVerses} variant="outline">
          Atualizar Lista
        </Button>
      </div>

      {error && (
        <Alert className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar por título, musical..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Input
            placeholder="Filtrar por musical..."
            value={musicalFilter}
            onChange={(e) => setMusicalFilter(e.target.value)}
            className="pl-10"
          />
          <Input
            placeholder="Filtrar por estilo..."
            value={styleFilter}
            onChange={(e) => setStyleFilter(e.target.value)}
            className="pl-10"
          />
          <Input
            placeholder="Filtrar por dificuldade..."
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="pl-10"
          />
      </div>

      <div className="grid gap-4">
        {filteredVerses.map((verseData) => (
          <Card key={verseData.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{verseData.titulo_pt_br}</h3>
                    <Badge variant="secondary">{verseData.musical}</Badge>
                  </div>
                  <p className="text-gray-600 mb-1">{verseData.titulo_original}</p>
                  <div className="text-sm text-gray-500 mt-2">
                    <p>Cadastrado em: {new Date(verseData.criada_em).toLocaleDateString('pt-BR')}</p>
                    <p>Atualizado em: {new Date(verseData.atualizada_em).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/edit-verse/${verseData.id}`)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(verseData.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredVerses.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Music className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum verso encontrado</h3>
            <p className="text-gray-600">
              {searchTerm || musicalFilter !== 'all'
                ? 'Tente ajustar os filtros de busca.'
                : 'Não há versos cadastrados no sistema.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ManageVerses;
