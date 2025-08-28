import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getUserPurchases } from '@/services/purchaseService';
import { getVersesByIds, Verse } from '@/services/versesService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// import { Separator } from '@/components/ui/separator';
import { Link } from 'react-router-dom';
import { Music, Calendar, User, ArrowLeft, Package, Heart } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

const MyOrders = () => {
  const { user } = useAuth();
  const [purchasedVerses, setPurchasedVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPurchasedVerses = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Buscar IDs dos versos comprados pelo usuário
        const purchasedVerseIds = await getUserPurchases(user.id);
        
        if (purchasedVerseIds.length === 0) {
          setPurchasedVerses([]);
          setLoading(false);
          return;
        }

        // Buscar detalhes dos versos
        const verses = await getVersesByIds(purchasedVerseIds);
        
        // Criar um Set para evitar duplicatas
        const uniqueVerses = new Map<number, Verse>();
        
        // Adicionar versos principais
        verses.forEach(verse => {
          uniqueVerses.set(verse.id, verse);
        });
        
        // Adicionar versões irmãs
        for (const verse of verses) {
          if (verse.versoes_irmas && verse.versoes_irmas.length > 0) {
            try {
              const siblingVerses = await getVersesByIds(verse.versoes_irmas);
              siblingVerses.forEach(siblingVerse => {
                uniqueVerses.set(siblingVerse.id, siblingVerse);
              });
            } catch (error) {
              console.error('Erro ao buscar versões irmãs:', error);
            }
          }
        }
        
        // Converter Map para array e ordenar por data de criação (mais recente primeiro)
        const allVerses = Array.from(uniqueVerses.values())
          .sort((a, b) => new Date(b.criada_em || 0).getTime() - new Date(a.criada_em || 0).getTime());
        
        setPurchasedVerses(allVerses);
      } catch (error) {
        console.error('Erro ao buscar versos comprados:', error);
        setError('Erro ao carregar seus pedidos. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchPurchasedVerses();
  }, [user]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getMusicalIcon = (musical: string) => {
    const musicalLower = musical.toLowerCase();
    if (musicalLower.includes('hamilton')) return '/hamilton.svg';
    if (musicalLower.includes('hakuna matata') || musicalLower.includes('rei leão')) return '/hakuna-matata.svg';
    if (musicalLower.includes('les misérables') || musicalLower.includes('miseráveis')) return '/les-miserables.svg';
    return '/musical-generic.svg';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <User className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
            <p className="text-gray-600 mb-4">Você precisa estar logado para ver seus pedidos.</p>
            <Link to="/login">
              <Button className="w-full">
                Fazer Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="rounded-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </Link>
          </div>
          
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-8 h-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Meus Pedidos
            </h1>
          </div>
          
          <p className="text-gray-600 text-lg">
            Aqui estão todos os versos que você adquiriu, incluindo versões irmãs
          </p>
        </div>

        {/* Error State */}
        {error && (
          <Card className="mb-8 border-red-200 bg-red-50">
            <CardContent className="p-6">
              <p className="text-red-600">{error}</p>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline" 
                className="mt-4"
              >
                Tentar Novamente
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!error && purchasedVerses.length === 0 && (
          <Card className="w-full max-w-2xl mx-auto">
            <CardContent className="p-12 text-center">
              <Package className="w-20 h-20 mx-auto mb-6 text-gray-300" />
              <h2 className="text-2xl font-semibold mb-4 text-gray-700">
                Nenhum pedido encontrado
              </h2>
              <p className="text-gray-500 mb-6 text-lg">
                Você ainda não adquiriu nenhum verso. Explore nossa coleção e encontre suas músicas favoritas!
              </p>
              <Link to="/music">
                <Button size="lg" className="px-8">
                  <Music className="w-5 h-5 mr-2" />
                  Explorar Músicas
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Verses Grid */}
        {!error && purchasedVerses.length > 0 && (
          <>
            <div className="mb-6">
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {purchasedVerses.length} {purchasedVerses.length === 1 ? 'verso disponível' : 'versos disponíveis'}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {purchasedVerses.map((verse) => (
                <Card key={verse.id} className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md hover:shadow-xl hover:-translate-y-1">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <img 
                          src={getMusicalIcon(verse.musical)} 
                          alt={verse.musical}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                        <div>
                          <CardTitle className="text-lg font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                            {verse.titulo_pt_br}
                          </CardTitle>
                          <p className="text-sm text-gray-500 mt-1">
                            {verse.musical}
                          </p>
                        </div>
                      </div>
                      <Heart className="w-5 h-5 text-red-500 fill-current" />
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {verse.titulo_original && verse.titulo_original !== verse.titulo_pt_br && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            Título Original:
                          </p>
                          <p className="text-sm text-gray-600">
                            {verse.titulo_original}
                          </p>
                        </div>
                      )}
                      
                      <div className="h-px bg-gray-200 w-full" />
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Adquirido em {formatDate(verse.criada_em || new Date().toISOString())}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <Link to={`/verse/${verse.id}`} className="flex-1">
                          <Button variant="default" size="sm" className="w-full">
                            <Music className="w-4 h-4 mr-2" />
                            Ver Detalhes
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MyOrders;