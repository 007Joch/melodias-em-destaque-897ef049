import React, { useState, useEffect } from 'react';
import { Search, Filter, Edit, Trash2, Eye, User, Shield, UserCheck, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CartProvider } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

type UserProfile = {
  id: string;
  name: string | null;
  cpf: string | null;
  telefone: string | null;
  endereco: any;
  role: string | null;
  created_at: string;
  updated_at: string;
  email?: string;
};

const ManageUsers = () => {
  const { user, profile, loading } = useAuth();

  // Aguardar carregamento antes de verificar permissões
  if (loading) {
    return (
      <CartProvider>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <p className="text-gray-600">Carregando...</p>
            </div>
          </div>
          <Footer />
        </div>
      </CartProvider>
    );
  }

  // Verificar se o usuário é admin
  if (!user || !profile || profile.role !== 'admin') {
    return (
      <CartProvider>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
              <p className="text-gray-600 mb-6">Você não tem permissão para acessar esta página.</p>
              <Button onClick={() => window.history.back()} className="bg-primary hover:bg-primary/90">
                Voltar
              </Button>
            </div>
          </div>
          <Footer />
        </div>
      </CartProvider>
    );
  }

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newRole, setNewRole] = useState('');

  // Carregar usuários
  useEffect(() => {
    // Se chegou aqui, é admin - pode carregar os usuários
    fetchUsers();
  }, [profile]);

  // Função para carregar usuários
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      
      console.log('Iniciando busca de usuários...');
      
      // Buscar perfis com JOIN para incluir email da tabela auth.users
      console.log('Buscando usuários com email...');
      let { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          cpf,
          telefone,
          endereco,
          role,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false });

      console.log('Perfis encontrados:', profiles?.length || 0, profiles);
      
      if (profilesError) {
        console.error('Erro ao buscar perfis:', profilesError);
        toast.error('Erro ao carregar usuários');
        return;
      }
      
      // Buscar emails dos usuários da tabela auth.users
      const { data: authUsers, error: authError } = await supabase
        .from('auth.users')
        .select('id, email');
        
      console.log('Emails encontrados:', authUsers?.length || 0, authUsers);
      
      if (authError) {
        console.error('Erro ao buscar emails:', authError);
      }

      // Combinar dados dos perfis com emails
      const usersData = (profiles || []).map(profile => {
        const authUser = authUsers?.find(user => user.id === profile.id);
        return {
          ...profile,
          email: authUser?.email || 'Email não encontrado'
        };
      });

      console.log('Usuários mapeados com email:', usersData.length, usersData);

      setUsers(usersData);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar usuários
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.cpf || '').includes(searchTerm);
    
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    
    return matchesSearch && matchesRole;
  });

  const handleView = (user: UserProfile) => {
    setSelectedUser(user);
    setViewDialogOpen(true);
  };

  const handleEdit = (user: UserProfile) => {
    setSelectedUser(user);
    setNewRole(user.role || 'cliente');
    setEditDialogOpen(true);
  };

  const handleDelete = (user: UserProfile) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;
    
    setIsDeleting(true);
    try {
      // Deletar perfil (o usuário auth será mantido por questões de segurança)
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', selectedUser.id);

      if (profileError) {
        throw profileError;
      }

      setUsers(users.filter(u => u.id !== selectedUser.id));
      toast.success('Usuário removido do sistema com sucesso');
      setDeleteDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      toast.error('Erro ao excluir usuário');
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmEdit = async () => {
    if (!selectedUser) return;
    
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', selectedUser.id);

      if (error) {
        throw error;
      }

      setUsers(users.map(u => 
        u.id === selectedUser.id 
          ? { ...u, role: newRole }
          : u
      ));
      
      toast.success('Privilégios atualizados com sucesso');
      setEditDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      toast.error('Erro ao atualizar privilégios');
    } finally {
      setIsUpdating(false);
    }
  };

  const getRoleBadge = (role: string | null) => {
    switch (role) {
      case 'admin':
        return <Badge variant="destructive" className="bg-red-500"><Shield className="w-3 h-3 mr-1" />Admin</Badge>;
      case 'membro':
        return <Badge variant="secondary" className="bg-blue-500 text-white"><UserCheck className="w-3 h-3 mr-1" />Membro</Badge>;
      case 'cliente':
        return <Badge variant="outline"><User className="w-3 h-3 mr-1" />Cliente</Badge>;
      default:
        return <Badge variant="outline">Não definido</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAddress = (endereco: any) => {
    if (!endereco) return 'Não informado';
    
    try {
      const addr = typeof endereco === 'string' ? JSON.parse(endereco) : endereco;
      return `${addr.rua || ''}, ${addr.numero || ''} - ${addr.bairro || ''}, ${addr.cidade || ''} - ${addr.estado || ''}`;
    } catch {
      return 'Endereço inválido';
    }
  };

  // Remover verificação de role para permitir visualização durante testes
  console.log('Profile atual:', profile);
  console.log('Usuários no estado:', users);
  console.log('Usuários filtrados:', filteredUsers);

  return (
    <CartProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Cabeçalho */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Gerenciamento de Usuários</h1>
              <p className="text-gray-600">Gerencie usuários, privilégios e permissões do sistema</p>
            </div>

            {/* Filtros */}
            <Card className="p-6 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Buscar por nome, email ou CPF..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="w-48">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Filtrar por privilégio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os privilégios</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="membro">Membro</SelectItem>
                      <SelectItem value="cliente">Cliente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            {/* Tabela de Usuários */}
            <Card>
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Usuários Cadastrados</h2>
                  <Badge variant="outline" className="text-sm">
                    {filteredUsers.length} usuário(s)
                  </Badge>
                </div>

                {isLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>CPF</TableHead>
                          <TableHead>Telefone</TableHead>
                          <TableHead>Privilégio</TableHead>
                          <TableHead>Cadastrado em</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">
                              {user.name || 'Nome não informado'}
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{user.cpf || 'Não informado'}</TableCell>
                            <TableCell>{user.telefone || 'Não informado'}</TableCell>
                            <TableCell>{getRoleBadge(user.role)}</TableCell>
                            <TableCell>{formatDate(user.created_at)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleView(user)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(user)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                {user.id !== profile?.id && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(user)}
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    
                    {filteredUsers.length === 0 && (
                      <div className="text-center py-12">
                        <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Nenhum usuário encontrado</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </main>

        <Footer />

        {/* Dialog de Visualização */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Usuário</DialogTitle>
              <DialogDescription>
                Informações completas do usuário selecionado
              </DialogDescription>
            </DialogHeader>
            
            {selectedUser && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Nome</label>
                    <p className="text-gray-900">{selectedUser.name || 'Não informado'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-gray-900">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">CPF</label>
                    <p className="text-gray-900">{selectedUser.cpf || 'Não informado'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Telefone</label>
                    <p className="text-gray-900">{selectedUser.telefone || 'Não informado'}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-500">Endereço</label>
                    <p className="text-gray-900">{formatAddress(selectedUser.endereco)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Privilégio</label>
                    <div className="mt-1">{getRoleBadge(selectedUser.role)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Cadastrado em</label>
                    <p className="text-gray-900">{formatDate(selectedUser.created_at)}</p>
                  </div>
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Edição */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Privilégios</DialogTitle>
              <DialogDescription>
                Altere o nível de privilégio do usuário {selectedUser?.name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Nível de Privilégio
                </label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um privilégio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cliente">Cliente</SelectItem>
                    <SelectItem value="membro">Membro</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={confirmEdit} disabled={isUpdating}>
                {isUpdating ? 'Atualizando...' : 'Salvar Alterações'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Exclusão */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                Confirmar Exclusão
              </DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir o usuário <strong>{selectedUser?.name}</strong>?
                Esta ação não pode ser desfeita e todos os dados do usuário serão permanentemente removidos.
              </DialogDescription>
            </DialogHeader>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Excluindo...' : 'Excluir Usuário'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </CartProvider>
  );
};

export default ManageUsers;