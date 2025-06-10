
import React, { useState, useEffect } from 'react';
import { Search, Filter, Edit, Trash2, Eye, User, Shield, UserCheck, AlertTriangle, Mail, MailCheck, Clock } from 'lucide-react';
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

type AllUsersRecord = {
  id: string;
  email: string;
  email_confirmed_at: string | null;
  created_at: string;
  updated_at: string;
  last_sign_in_at: string | null;
  raw_user_meta_data: any;
  profile_name: string | null;
  profile_role: string | null;
  profile_cpf: string | null;
  profile_telefone: string | null;
  profile_endereco: any;
  profile_created_at: string | null;
};

const ManageUsers = () => {
  const { user, profile, loading } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [users, setUsers] = useState<AllUsersRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AllUsersRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newRole, setNewRole] = useState('');

  console.log('🔍 ManageUsers - Estado atual:', {
    loading,
    user: user?.email,
    profile: profile?.role,
    hasUser: !!user,
    hasProfile: !!profile,
    usersCount: users.length
  });

  // Função para carregar todos os usuários
  const fetchAllUsers = async () => {
    try {
      setIsLoading(true);
      
      console.log('Iniciando busca de todos os usuários...');
      
      // Chamar a função RPC para buscar todos os usuários
      const { data: allUsers, error } = await supabase
        .rpc('get_all_users');

      if (error) {
        console.error('Erro ao buscar usuários:', error);
        toast.error('Erro ao carregar usuários: ' + error.message);
        return;
      }

      console.log('Usuários encontrados:', allUsers?.length || 0, allUsers);
      setUsers(allUsers || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar usuários apenas uma vez quando o componente monta
  useEffect(() => {
    if (user && profile && profile.role === 'admin') {
      fetchAllUsers();
    }
  }, [user, profile]);

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

  // Filtrar usuários
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.profile_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.profile_cpf || '').includes(searchTerm);
    
    const matchesRole = selectedRole === 'all' || user.profile_role === selectedRole;
    
    let matchesStatus = true;
    if (selectedStatus === 'confirmed') {
      matchesStatus = !!user.email_confirmed_at;
    } else if (selectedStatus === 'unconfirmed') {
      matchesStatus = !user.email_confirmed_at;
    } else if (selectedStatus === 'with_profile') {
      matchesStatus = !!user.profile_name;
    } else if (selectedStatus === 'without_profile') {
      matchesStatus = !user.profile_name;
    }
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleView = (user: AllUsersRecord) => {
    setSelectedUser(user);
    setViewDialogOpen(true);
  };

  const handleEdit = (user: AllUsersRecord) => {
    setSelectedUser(user);
    setNewRole(user.profile_role || 'cliente');
    setEditDialogOpen(true);
  };

  const handleDelete = (user: AllUsersRecord) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;
    
    setIsDeleting(true);
    try {
      // Deletar perfil se existir
      if (selectedUser.profile_name) {
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', selectedUser.id);

        if (profileError) {
          console.error('Erro ao deletar perfil:', profileError);
          toast.error('Erro ao deletar perfil: ' + profileError.message);
          return;
        }
      }

      // Atualizar lista local
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
      // Se não tem perfil, criar um
      if (!selectedUser.profile_name) {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: selectedUser.id,
            name: selectedUser.raw_user_meta_data?.name || 'Usuário',
            role: newRole
          });

        if (insertError) {
          throw insertError;
        }
      } else {
        // Atualizar perfil existente
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ role: newRole })
          .eq('id', selectedUser.id);

        if (updateError) {
          throw updateError;
        }
      }

      // Atualizar estado local
      setUsers(users.map(u => 
        u.id === selectedUser.id 
          ? { ...u, profile_role: newRole, profile_name: u.profile_name || 'Usuário' }
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
        return <Badge variant="outline" className="bg-gray-100">Sem perfil</Badge>;
    }
  };

  const getStatusBadge = (emailConfirmedAt: string | null, lastSignInAt: string | null) => {
    if (emailConfirmedAt) {
      if (lastSignInAt) {
        return <Badge variant="secondary" className="bg-green-500 text-white"><MailCheck className="w-3 h-3 mr-1" />Ativo</Badge>;
      } else {
        return <Badge variant="outline" className="bg-yellow-500 text-white"><Mail className="w-3 h-3 mr-1" />Confirmado</Badge>;
      }
    } else {
      return <Badge variant="outline" className="bg-orange-500 text-white"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
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

  return (
    <CartProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Cabeçalho */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Gerenciamento de Usuários</h1>
              <p className="text-gray-600">Gerencie todos os usuários, privilégios e permissões do sistema</p>
              <p className="text-sm text-gray-500 mt-2">Total de usuários: {users.length}</p>
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

                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-48">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Filtrar por status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="confirmed">Email confirmado</SelectItem>
                      <SelectItem value="unconfirmed">Email pendente</SelectItem>
                      <SelectItem value="with_profile">Com perfil</SelectItem>
                      <SelectItem value="without_profile">Sem perfil</SelectItem>
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
                    {filteredUsers.length} usuário(s) filtrado(s)
                  </Badge>
                </div>

                {isLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="ml-3 text-gray-600">Carregando usuários...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome/Email</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Privilégio</TableHead>
                          <TableHead>Último acesso</TableHead>
                          <TableHead>Cadastrado em</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {user.profile_name || 'Nome não informado'}
                                </span>
                                <span className="text-sm text-gray-500">{user.email}</span>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(user.email_confirmed_at, user.last_sign_in_at)}</TableCell>
                            <TableCell>{getRoleBadge(user.profile_role)}</TableCell>
                            <TableCell>{formatDate(user.last_sign_in_at)}</TableCell>
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
                    
                    {filteredUsers.length === 0 && !isLoading && (
                      <div className="text-center py-12">
                        <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Nenhum usuário encontrado</p>
                        <p className="text-sm text-gray-400 mt-1">
                          {users.length === 0 ? 'Não há usuários cadastrados' : 'Tente ajustar os filtros de busca'}
                        </p>
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
                    <p className="text-gray-900">{selectedUser.profile_name || 'Não informado'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-gray-900">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status do Email</label>
                    <div className="mt-1">{getStatusBadge(selectedUser.email_confirmed_at, selectedUser.last_sign_in_at)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Privilégio</label>
                    <div className="mt-1">{getRoleBadge(selectedUser.profile_role)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">CPF</label>
                    <p className="text-gray-900">{selectedUser.profile_cpf || 'Não informado'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Telefone</label>
                    <p className="text-gray-900">{selectedUser.profile_telefone || 'Não informado'}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-500">Endereço</label>
                    <p className="text-gray-900">{formatAddress(selectedUser.profile_endereco)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Cadastrado em</label>
                    <p className="text-gray-900">{formatDate(selectedUser.created_at)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Último acesso</label>
                    <p className="text-gray-900">{formatDate(selectedUser.last_sign_in_at)}</p>
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
                Altere o nível de privilégio do usuário {selectedUser?.profile_name || selectedUser?.email}
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
                Tem certeza que deseja excluir o usuário <strong>{selectedUser?.profile_name || selectedUser?.email}</strong>?
                Esta ação removerá o perfil do usuário do sistema.
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
