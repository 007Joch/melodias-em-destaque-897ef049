
import React, { useState, useEffect } from 'react';
<<<<<<< HEAD
import { Search, Filter, Plus, Edit, Trash2, Eye, User, AlertTriangle, Mail, CheckCircle, XCircle, Clock, Phone, MapPin, Calendar, Shield } from 'lucide-react';
=======
import { Search, Filter, Edit, Trash2, Eye, User, Shield, UserCheck, AlertTriangle, Mail, MailCheck, Clock } from 'lucide-react';
>>>>>>> 8733462462df6921ef74eed03e02dac34e58901f
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { CartProvider } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { updateUserRole, updateUserEmail, updateUserPassword } from '../services/versesService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

<<<<<<< HEAD
type User = {
  id: string;
  name: string | null;
  role: string | null;
  created_at: string;
  updated_at: string;
  cpf: string | null;
  telefone: string | null;
  endereco: any;
  // Dados do auth.users que vamos buscar separadamente
  email?: string;
  email_confirmed_at?: string | null;
  last_sign_in_at?: string | null;
  raw_user_meta_data?: any;
=======
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
>>>>>>> 8733462462df6921ef74eed03e02dac34e58901f
};

const ManageUsers = () => {
  const navigate = useNavigate();
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

  // Debug: Log do estado atual
  console.log('🔍 ManageUsers - Estado atual:', {
    loading,
    user: user?.email,
    profile: profile?.role,
    hasUser: !!user,
    hasProfile: !!profile
  });

  // Aguardar carregamento antes de verificar permissões
  if (loading) {
    console.log('⏳ ManageUsers - Aguardando carregamento...');
    return (
      <CartProvider>
        <div className="min-h-screen bg-gray-50">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <p className="text-gray-600">Carregando...</p>
            </div>
          </div>
        </div>
      </CartProvider>
    );
  }

  // Verificar se o usuário é admin
  const isAdmin = user && profile && profile.role === 'admin';
  console.log('🔐 ManageUsers - Verificação de admin:', {
    isAdmin,
    userExists: !!user,
    profileExists: !!profile,
    role: profile?.role
  });

  if (!isAdmin) {
    console.log('❌ ManageUsers - Acesso negado');
    return (
      <CartProvider>
        <div className="min-h-screen bg-gray-50">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
              <p className="text-gray-600 mb-6">Você não tem permissão para acessar esta página.</p>
              <p className="text-sm text-gray-500 mb-4">
                Debug: User: {user?.email || 'Nenhum'} | Profile: {profile?.role || 'Nenhum'}
              </p>
              <Button onClick={() => navigate('/')} className="bg-primary hover:bg-primary/90">
                Voltar ao Início
              </Button>
            </div>
          </div>
        </div>
      </CartProvider>
    );
  }

<<<<<<< HEAD
  console.log('✅ ManageUsers - Acesso autorizado para admin');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estados para modais
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Estados para edição
  const [editForm, setEditForm] = useState({
    role: '',
    email: '',
    password: ''
=======
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
>>>>>>> 8733462462df6921ef74eed03e02dac34e58901f
  });
  const [isUpdating, setIsUpdating] = useState(false);

<<<<<<< HEAD
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        console.log('🔍 Buscando usuários...');
        
        // Buscar perfis usando a RPC
        const { data: profilesData, error: profilesError } = await supabase
          .rpc('get_all_profiles_admin');

        if (profilesError) {
          console.error('❌ Erro ao buscar perfis:', profilesError);
          toast.error('Erro ao carregar usuários: ' + profilesError.message);
          return;
        }

        console.log('✅ Perfis encontrados:', profilesData?.length || 0);
        
        // Buscar dados de autenticação para cada usuário
        const usersWithAuthData = await Promise.all(
          (profilesData || []).map(async (profile: any) => {
            try {
              // Tentar buscar dados do auth.users (só funciona se o usuário atual for admin)
              const { data: authData } = await supabase.auth.admin.getUserById(profile.id);
              
              return {
                ...profile,
                email: authData?.user?.email || 'Email não disponível',
                email_confirmed_at: authData?.user?.email_confirmed_at || null,
                last_sign_in_at: authData?.user?.last_sign_in_at || null,
                raw_user_meta_data: authData?.user?.raw_user_meta_data || {}
              };
            } catch (authError) {
              console.warn('⚠️ Não foi possível buscar dados de auth para usuário:', profile.id);
              return {
                ...profile,
                email: 'Email não disponível',
                email_confirmed_at: null,
                last_sign_in_at: null,
                raw_user_meta_data: {}
              };
            }
          })
        );

        setUsers(usersWithAuthData);
        console.log('✅ Usuários carregados com sucesso:', usersWithAuthData.length);
        
      } catch (error) {
        console.error('❌ Erro geral ao carregar usuários:', error);
        toast.error('Erro ao carregar usuários');
      } finally {
        setIsLoading(false);
=======
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
>>>>>>> 8733462462df6921ef74eed03e02dac34e58901f
      }
    };

<<<<<<< HEAD
    fetchUsers();
  }, []);

  // Função para abrir modal de detalhes
  const handleViewDetails = (user: User) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
=======
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
>>>>>>> 8733462462df6921ef74eed03e02dac34e58901f
  };

  // Função para abrir modal de edição
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      role: user.role || '',
      email: user.email || '',
      password: ''
    });
    setShowEditModal(true);
  };

  // Função para atualizar usuário
  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
<<<<<<< HEAD
      setIsUpdating(true);
=======
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
>>>>>>> 8733462462df6921ef74eed03e02dac34e58901f
      
      // Atualizar role se mudou
      if (editForm.role !== selectedUser.role) {
        await updateUserRole(selectedUser.id, editForm.role);
        toast.success('Privilégios atualizados com sucesso!');
      }
      
      // Atualizar email se mudou
      if (editForm.email !== selectedUser.email) {
        await updateUserEmail(selectedUser.id, editForm.email);
        toast.success('Email atualizado com sucesso!');
      }
      
      // Atualizar senha se fornecida
      if (editForm.password.trim()) {
        await updateUserPassword(selectedUser.id, editForm.password);
        toast.success('Senha atualizada com sucesso!');
      }
      
      // Recarregar lista de usuários
      const { data: profilesData, error: profilesError } = await supabase
        .rpc('get_all_profiles_admin');

      if (!profilesError && profilesData) {
        const usersWithAuthData = await Promise.all(
          profilesData.map(async (profile: any) => {
            try {
              const { data: authData } = await supabase.auth.admin.getUserById(profile.id);
              return {
                ...profile,
                email: authData?.user?.email || 'Email não disponível',
                email_confirmed_at: authData?.user?.email_confirmed_at || null,
                last_sign_in_at: authData?.user?.last_sign_in_at || null,
                raw_user_meta_data: authData?.user?.raw_user_meta_data || {}
              };
            } catch {
              return {
                ...profile,
                email: 'Email não disponível',
                email_confirmed_at: null,
                last_sign_in_at: null,
                raw_user_meta_data: {}
              };
            }
          })
        );
        setUsers(usersWithAuthData);
      }
      
      // Fechar modal
      setShowEditModal(false);
      setSelectedUser(null);
      
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      toast.error('Erro ao atualizar usuário. Tente novamente.');
    } finally {
      setIsUpdating(false);
    }
  };

<<<<<<< HEAD
  // Função para formatar endereço
=======
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

>>>>>>> 8733462462df6921ef74eed03e02dac34e58901f
  const formatAddress = (endereco: any) => {
    if (!endereco) return 'Não informado';
    
    try {
      const addr = typeof endereco === 'string' ? JSON.parse(endereco) : endereco;
      const parts = [];
      if (addr.rua) parts.push(addr.rua);
      if (addr.numero) parts.push(addr.numero);
      if (addr.bairro) parts.push(addr.bairro);
      if (addr.cidade) parts.push(addr.cidade);
      if (addr.estado) parts.push(addr.estado);
      if (addr.cep) parts.push(`CEP: ${addr.cep}`);
      return parts.length > 0 ? parts.join(', ') : 'Endereço incompleto';
    } catch {
      return 'Endereço inválido';
    }
  };

<<<<<<< HEAD
  // Filtrar usuários baseado na busca e filtros
  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || 
                         (selectedStatus === 'confirmed' && user.email_confirmed_at) ||
                         (selectedStatus === 'unconfirmed' && !user.email_confirmed_at);
    
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  // Ordenar usuários
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    switch (sortBy) {
      case 'email':
        return (a.email || '').localeCompare(b.email || '');
      case 'name':
        return (a.name || '').localeCompare(b.name || '');
      case 'role':
        return (a.role || '').localeCompare(b.role || '');
      case 'created_at':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'last_sign_in':
        const aLastSignIn = a.last_sign_in_at ? new Date(a.last_sign_in_at).getTime() : 0;
        const bLastSignIn = b.last_sign_in_at ? new Date(b.last_sign_in_at).getTime() : 0;
        return bLastSignIn - aLastSignIn;
      default:
        return 0;
    }
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getStatusIcon = (user: User) => {
    if (user.email_confirmed_at) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getStatusText = (user: User) => {
    if (user.email_confirmed_at) {
      return 'Confirmado';
    }
    return 'Não confirmado';
  };

  const getRoleColor = (role: string | null) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'user':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <CartProvider>
        <div className="min-h-screen bg-gray-50">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <p className="text-gray-600">Carregando usuários...</p>
            </div>
          </div>
        </div>
      </CartProvider>
    );
  }

=======
>>>>>>> 8733462462df6921ef74eed03e02dac34e58901f
  return (
    <CartProvider>
      <div className="min-h-screen bg-gray-50">
        
<<<<<<< HEAD
        <main className="container mx-auto px-4 sm:px-6 py-6">
          {/* Cabeçalho */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Gerenciar Usuários</h1>
                <p className="text-gray-600 mt-1">
                  Total de {users.length} usuários cadastrados
                </p>
              </div>
            </div>
=======
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
>>>>>>> 8733462462df6921ef74eed03e02dac34e58901f
          </div>

          {/* Filtros */}
          <Card className="p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Busca */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por email ou nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status */}
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="confirmed">Confirmados</SelectItem>
                  <SelectItem value="unconfirmed">Não confirmados</SelectItem>
                </SelectContent>
              </Select>

              {/* Role */}
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as funções</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">Usuário</SelectItem>
                </SelectContent>
              </Select>

              {/* Ordenação */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Data de criação</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="name">Nome</SelectItem>
                  <SelectItem value="role">Função</SelectItem>
                  <SelectItem value="last_sign_in">Último acesso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Lista de usuários */}
          <div className="space-y-4">
            {sortedUsers.length === 0 ? (
              <Card className="p-8 text-center">
                <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum usuário encontrado</h3>
                <p className="text-gray-600">Tente ajustar os filtros de busca.</p>
              </Card>
            ) : (
              sortedUsers.map((user) => (
                <Card key={user.id} className="p-6 hover:shadow-md transition-shadow">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(user)}
                          <h3 className="text-lg font-semibold text-gray-900">
                          {user.name || 'Nome não informado'}
                          </h3>
                        </div>
                        {user.role && (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                            {user.role === 'admin' ? 'Admin' : user.role === 'cliente' ? 'Cliente' : 'Membro'}
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          <span className="truncate">{user.email || 'Email não disponível'}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>Criado: {formatDate(user.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(user)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver detalhes
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditUser(user)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Estatísticas */}
          <Card className="p-6 mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Estatísticas</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{users.length}</div>
                <div className="text-sm text-gray-600">Total de usuários</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {users.filter(u => u.email_confirmed_at).length}
                </div>
                <div className="text-sm text-gray-600">Emails confirmados</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {users.filter(u => !u.email_confirmed_at).length}
                </div>
                <div className="text-sm text-gray-600">Emails não confirmados</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {users.filter(u => u.role === 'admin').length}
                </div>
                <div className="text-sm text-gray-600">Administradores</div>
              </div>
            </div>
          </Card>
        </main>
        
        {/* Modal de Detalhes do Usuário */}
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Detalhes do Usuário
              </DialogTitle>
              <DialogDescription>
                Informações completas do usuário selecionado
              </DialogDescription>
            </DialogHeader>
            
            {selectedUser && (
              <div className="space-y-6">
                {/* Informações Básicas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Nome</Label>
                    <p className="text-sm text-gray-900">{selectedUser.name || 'Não informado'}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Email</Label>
                    <p className="text-sm text-gray-900">{selectedUser.email}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Função</Label>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(selectedUser.role)}`}>
                      {selectedUser.role === 'admin' ? 'Admin' : selectedUser.role === 'cliente' ? 'Cliente' : 'Membro'}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Status do Email</Label>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(selectedUser)}
                      <span className="text-sm">{getStatusText(selectedUser)}</span>
                    </div>
                  </div>
                </div>
                
                {/* Informações de Contato */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Informações de Contato
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">CPF</Label>
                      <p className="text-sm text-gray-900">{selectedUser.cpf || 'Não informado'}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Telefone</Label>
                      <p className="text-sm text-gray-900">{selectedUser.telefone || 'Não informado'}</p>
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Endereço
                      </Label>
                      <p className="text-sm text-gray-900">{formatAddress(selectedUser.endereco)}</p>
                    </div>
                  </div>
                </div>
                
                {/* Informações do Sistema */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Informações do Sistema
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Data de Cadastro</Label>
                      <p className="text-sm text-gray-900">{formatDate(selectedUser.created_at)}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Última Atualização</Label>
                      <p className="text-sm text-gray-900">{formatDate(selectedUser.updated_at)}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Último Login</Label>
                      <p className="text-sm text-gray-900">{formatDate(selectedUser.last_sign_in_at)}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">ID do Usuário</Label>
                      <p className="text-xs text-gray-600 font-mono">{selectedUser.id}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        
        {/* Modal de Edição do Usuário */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Editar Usuário
              </DialogTitle>
              <DialogDescription>
                Altere os privilégios, email ou senha do usuário
              </DialogDescription>
            </DialogHeader>
            
            {selectedUser && (
              <div className="space-y-4">
<<<<<<< HEAD
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Nome do Usuário</Label>
                  <p className="text-sm text-gray-600">{selectedUser.name || 'Não informado'}</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-sm font-medium">Função/Privilégios</Label>
                  <Select value={editForm.role} onValueChange={(value) => setEditForm({...editForm, role: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a função" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="cliente">Cliente</SelectItem>
                      <SelectItem value="membro">Membro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    placeholder="Digite o novo email"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Nova Senha (opcional)</Label>
                  <Input
                    id="password"
                    type="password"
                    value={editForm.password}
                    onChange={(e) => setEditForm({...editForm, password: e.target.value})}
                    placeholder="Digite a nova senha (deixe vazio para não alterar)"
                  />
                  <p className="text-xs text-gray-500">Deixe em branco se não quiser alterar a senha</p>
=======
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
>>>>>>> 8733462462df6921ef74eed03e02dac34e58901f
                </div>
              </div>
            )}
            
            <DialogFooter>
<<<<<<< HEAD
              <Button
                variant="outline"
                onClick={() => setShowEditModal(false)}
                disabled={isUpdating}
=======
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
>>>>>>> 8733462462df6921ef74eed03e02dac34e58901f
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpdateUser}
                disabled={isUpdating}
                className="bg-primary hover:bg-primary/90"
              >
                {isUpdating ? 'Atualizando...' : 'Salvar Alterações'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </CartProvider>
  );
};

export default ManageUsers;
