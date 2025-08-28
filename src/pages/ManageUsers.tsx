import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Edit, Trash2, Eye, User, AlertTriangle, Mail, CheckCircle, XCircle, Clock, Phone, MapPin, Calendar, Shield, Pause, Play, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '@/hooks/useAuth';
import { updateUserRole, updateUserEmail, updateUserPassword, updateUserAccountStatus, deleteUser, updateUserMembership } from '../services/versesService';
import { supabase, supabaseAdmin } from '../integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { CartProvider } from '@/hooks/useCart';

// Utilitários locais para lidar com inputs datetime-local
function toLocalInput(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    // Ajusta para o timezone local e corta para precisão de minutos
    const pad = (n: number) => String(n).padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const min = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  } catch {
    return '';
  }
}

function toISO(localDateTime: string): string | null {
  if (!localDateTime) return null;
  try {
    // O input datetime-local não possui timezone; interpretamos como horário local
    const d = new Date(localDateTime);
    return d.toISOString();
  } catch {
    return null;
  }
}

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
  account_status?: string;
  failed_login_attempts?: number;
  blocked_until?: string | null;
  blocked_reason?: string | null;
  // Campos de membresia
  membership_started_at?: string | null;
  membership_expires_at?: string | null;
  membership_lifetime?: boolean | null;
};

export default function ManageUsers() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Estados do componente - DEVEM estar no topo, antes de qualquer return
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
    password: '',
    membershipStartedAt: '',
    membershipExpiresAt: '',
    membershipLifetime: false,
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isBulkDeleteMode, setIsBulkDeleteMode] = useState(false);

  console.log('✅ ManageUsers - Acesso autorizado para admin');

  useEffect(() => {
    const fetchUsers = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        console.log('🔍 Buscando usuários...');
        
        // Buscar usuários com dados de autenticação usando a função RPC segura
        const { data: usersData, error: usersError } = await supabase
          .rpc('get_all_users');

        if (usersError) {
          console.error('❌ Erro ao buscar usuários:', usersError);
          toast.error('Erro ao carregar usuários: ' + usersError.message);
          return;
        }

        console.log('✅ Usuários encontrados:', usersData?.length || 0);
        
        // Mapear os dados para o formato esperado
        const formattedUsers = (usersData || []).map((user: any) => ({
          id: user.id,
          name: user.profile_name,
          role: user.profile_role,
          created_at: user.created_at,
          updated_at: user.updated_at,
          cpf: user.profile_cpf,
          telefone: user.profile_telefone,
          endereco: user.profile_endereco,
          email: user.email || 'Email não disponível',
          email_confirmed_at: user.email_confirmed_at,
          last_sign_in_at: user.last_sign_in_at,
          raw_user_meta_data: {},
          account_status: user.account_status || 'active',
          failed_login_attempts: user.failed_login_attempts || 0,
          blocked_until: user.blocked_until,
          blocked_reason: user.blocked_reason,
          membership_started_at: user.membership_started_at || null,
          membership_expires_at: user.membership_expires_at || null,
          membership_lifetime: user.membership_lifetime ?? false,
        }));

        setUsers(formattedUsers);
         console.log('✅ Usuários carregados com sucesso:', formattedUsers.length);
        
      } catch (error) {
        console.error('❌ Erro geral ao carregar usuários:', error);
        toast.error('Erro ao carregar usuários');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Função para abrir modal de detalhes
  const handleViewDetails = (user: User) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  // Função para abrir modal de edição
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      role: user.role || '',
      email: user.email || '',
      password: '',
      membershipStartedAt: toLocalInput(user.membership_started_at || null),
      membershipExpiresAt: toLocalInput(user.membership_expires_at || null),
      membershipLifetime: !!user.membership_lifetime,
    });
    setShowEditModal(true);
  };

  // Função para atualizar usuário
  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      setIsUpdating(true);

      // Validação condicional da membresia
      if (editForm.role === 'membro' && !editForm.membershipLifetime) {
        if (!editForm.membershipStartedAt || !editForm.membershipExpiresAt) {
          toast.error('Preencha as datas de início e expiração do acesso ou marque como vitalício.');
          setIsUpdating(false);
          return;
        }
      }
      
      // Atualizar role se mudou
      if (editForm.role !== selectedUser.role) {
        const result = await updateUserRole(selectedUser.id, editForm.role);
        console.log('✅ Resultado da atualização de role:', result);
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

      // Atualizar membresia quando role for membro
      if (editForm.role === 'membro') {
        const startedAt = editForm.membershipLifetime ? null : toISO(editForm.membershipStartedAt);
        const expiresAt = editForm.membershipLifetime ? null : toISO(editForm.membershipExpiresAt);
        await updateUserMembership(selectedUser.id, startedAt, expiresAt, editForm.membershipLifetime);
        toast.success('Acesso atualizado com sucesso!');
      }
      
      // Recarregar a lista de usuários usando a função RPC segura
      const { data: updatedUsersData, error: reloadError } = await supabase
        .rpc('get_all_users');

      if (reloadError) {
        console.error('❌ Erro ao recarregar usuários:', reloadError);
        toast.error('Erro ao recarregar usuários');
        return;
      }

      // Mapear os dados para o formato esperado
      const updatedFormattedUsers = (updatedUsersData || []).map((user: any) => ({
        id: user.id,
        name: user.profile_name,
        role: user.profile_role,
        created_at: user.created_at,
        updated_at: user.updated_at,
        cpf: user.profile_cpf,
        telefone: user.profile_telefone,
        endereco: user.profile_endereco,
        email: user.email || 'Email não disponível',
        email_confirmed_at: user.email_confirmed_at,
        last_sign_in_at: user.last_sign_in_at,
        raw_user_meta_data: {},
        account_status: user.account_status || 'active',
        failed_login_attempts: user.failed_login_attempts || 0,
        blocked_until: user.blocked_until,
        blocked_reason: user.blocked_reason,
        membership_started_at: user.membership_started_at || null,
        membership_expires_at: user.membership_expires_at || null,
        membership_lifetime: user.membership_lifetime ?? false,
      }));

      setUsers(updatedFormattedUsers);
      
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

  const handleToggleAccountStatus = async (user: User) => {
    try {
      const newStatus = user.account_status === 'active' ? 'inactive' : 'active';
      
      await updateUserAccountStatus(user.id, newStatus);
      toast.success(`Conta ${newStatus === 'active' ? 'ativada' : 'desativada'} com sucesso!`);
      
      // Recarregar usuários
      const { data: updatedUsersData, error: reloadError } = await supabase
        .rpc('get_all_users');

      if (reloadError) {
        console.error('❌ Erro ao recarregar usuários:', reloadError);
        toast.error('Erro ao recarregar usuários');
        return;
      }

      const updatedFormattedUsers = (updatedUsersData || []).map((user: any) => ({
        id: user.id,
        name: user.profile_name,
        role: user.profile_role,
        created_at: user.created_at,
        updated_at: user.updated_at,
        cpf: user.profile_cpf,
        telefone: user.profile_telefone,
        endereco: user.profile_endereco,
        email: user.email || 'Email não disponível',
        email_confirmed_at: user.email_confirmed_at,
        last_sign_in_at: user.last_sign_in_at,
        raw_user_meta_data: {},
        account_status: user.account_status || 'active',
        failed_login_attempts: user.failed_login_attempts || 0,
        blocked_until: user.blocked_until,
        blocked_reason: user.blocked_reason,
        membership_started_at: user.membership_started_at || null,
        membership_expires_at: user.membership_expires_at || null,
        membership_lifetime: user.membership_lifetime ?? false,
      }));

      setUsers(updatedFormattedUsers);
    } catch (error) {
      console.error('Erro ao alterar status da conta:', error);
      toast.error('Erro ao alterar status da conta');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser(userId);
      toast.success('Usuário deletado com sucesso!');
      
      // Recarregar usuários após atualização
      const { data: updatedUsersData, error: reloadError } = await supabase
        .rpc('get_all_users');

      if (reloadError) {
        console.error('❌ Erro ao recarregar usuários:', reloadError);
        toast.error('Erro ao recarregar usuários');
        return;
      }

      const updatedFormattedUsers = (updatedUsersData || []).map((user: any) => ({
        id: user.id,
        name: user.profile_name,
        role: user.profile_role,
        created_at: user.created_at,
        updated_at: user.updated_at,
        cpf: user.profile_cpf,
        telefone: user.profile_telefone,
        endereco: user.profile_endereco,
        email: user.email || 'Email não disponível',
        email_confirmed_at: user.email_confirmed_at,
        last_sign_in_at: user.last_sign_in_at,
        raw_user_meta_data: {},
        account_status: user.account_status || 'active',
        failed_login_attempts: user.failed_login_attempts || 0,
        blocked_until: user.blocked_until,
        blocked_reason: user.blocked_reason,
        membership_started_at: user.membership_started_at || null,
        membership_expires_at: user.membership_expires_at || null,
        membership_lifetime: user.membership_lifetime ?? false,
      }));

      setUsers(updatedFormattedUsers);
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      toast.error('Erro ao deletar usuário');
    }
  };

  const handleBulkDelete = async () => {
    try {
      for (const userId of selectedUsers) {
        try {
          await deleteUser(userId);
        } catch (error) {
          console.error('Erro ao deletar usuário:', userId, error);
        }
      }

      toast.success(`${selectedUsers.length} usuário(s) deletado(s) com sucesso!`);
      setSelectedUsers([]);
      setIsBulkDeleteMode(false);
      
      // Recarregar usuários
      const { data: updatedUsersData, error: reloadError } = await supabase
        .rpc('get_all_users');

      if (reloadError) {
        console.error('❌ Erro ao recarregar usuários:', reloadError);
        toast.error('Erro ao recarregar usuários');
        return;
      }

      const updatedFormattedUsers = (updatedUsersData || []).map((user: any) => ({
        id: user.id,
        name: user.profile_name,
        role: user.profile_role,
        created_at: user.created_at,
        updated_at: user.updated_at,
        cpf: user.profile_cpf,
        telefone: user.profile_telefone,
        endereco: user.profile_endereco,
        email: user.email || 'Email não disponível',
        email_confirmed_at: user.email_confirmed_at,
        last_sign_in_at: user.last_sign_in_at,
        raw_user_meta_data: {},
        account_status: user.account_status || 'active',
        failed_login_attempts: user.failed_login_attempts || 0,
        blocked_until: user.blocked_until,
        blocked_reason: user.blocked_reason,
        membership_started_at: user.membership_started_at || null,
        membership_expires_at: user.membership_expires_at || null,
        membership_lifetime: user.membership_lifetime ?? false,
      }));

      setUsers(updatedFormattedUsers);
    } catch (error) {
      console.error('Erro ao deletar usuários:', error);
      toast.error('Erro ao deletar usuários');
    }
  };

  const confirmDelete = (user: User) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const confirmBulkDelete = () => {
    if (selectedUsers.length === 0) {
      toast.error('Selecione pelo menos um usuário para deletar');
      return;
    }
    setIsDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (userToDelete) {
      await handleDeleteUser(userToDelete.id);
      setUserToDelete(null);
    } else if (selectedUsers.length > 0) {
      await handleBulkDelete();
    }
    setIsDeleteModalOpen(false);
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
     if (selectedUsers.length === filteredAndSortedUsers.length) {
       setSelectedUsers([]);
     } else {
       setSelectedUsers(filteredAndSortedUsers.map(user => user.id));
     }
   };

  // Função para formatar endereço
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
    } catch (e) {
      console.error('Erro ao formatar endereço:', e);
      return 'Endereço inválido';
    }
  };

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
  const filteredAndSortedUsers = [...filteredUsers].sort((a, b) => {
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

  // Função para obter ícone e texto do status
  const getStatusInfo = (user: User) => {
    if (!user.email_confirmed_at) {
      return {
        icon: <AlertTriangle className="w-4 h-4" />,
        text: 'Não confirmado',
        color: 'text-yellow-600 bg-yellow-100'
      };
    }
    
    if (user.last_sign_in_at) {
      return {
        icon: <CheckCircle className="w-4 h-4" />,
        text: 'Ativo',
        color: 'text-green-600 bg-green-100'
      };
    }
    
    return {
      icon: <Clock className="w-4 h-4" />,
      text: 'Inativo',
      color: 'text-gray-600 bg-gray-100'
    };
  };

  // Função para obter status da conta
  const getAccountStatusInfo = (user: User) => {
    const now = new Date();
    const blockedUntil = user.blocked_until ? new Date(user.blocked_until) : null;
    
    // Verificar se está bloqueado temporariamente
    if (blockedUntil && now < blockedUntil) {
      return {
        icon: <AlertTriangle className="w-4 h-4" />,
        text: 'Bloqueado temp.',
        color: 'text-red-600 bg-red-100'
      };
    }
    
    // Verificar status da conta
    switch (user.account_status) {
      case 'blocked':
        return {
          icon: <AlertTriangle className="w-4 h-4" />,
          text: 'Bloqueado',
          color: 'text-red-600 bg-red-100'
        };
      case 'inactive':
        return {
          icon: <Clock className="w-4 h-4" />,
          text: 'Inativo',
          color: 'text-orange-600 bg-orange-100'
        };
      default:
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          text: 'Ativo',
          color: 'text-green-600 bg-green-100'
        };
    }
  };

  // Função para obter status detalhado da conta para o modal
  const getDetailedAccountStatus = (user: User) => {
    const now = new Date();
    const blockedUntil = user.blocked_until ? new Date(user.blocked_until) : null;
    
    // Verificar se está bloqueado temporariamente por tentativas de login
    if (blockedUntil && now < blockedUntil) {
      return {
        icon: <AlertTriangle className="w-4 h-4" />,
        text: 'Inativo pelo usuário',
        description: 'Conta bloqueada temporariamente por tentativas de login incorretas',
        color: 'text-red-600 bg-red-100'
      };
    }
    
    // Verificar status da conta
    switch (user.account_status) {
      case 'blocked':
        return {
          icon: <XCircle className="w-4 h-4" />,
          text: 'Inativo pelo administrador',
          description: 'Conta bloqueada por um administrador do sistema',
          color: 'text-red-600 bg-red-100'
        };
      case 'inactive':
        return {
          icon: <Pause className="w-4 h-4" />,
          text: 'Inativo pelo administrador',
          description: 'Conta desativada por um administrador do sistema',
          color: 'text-orange-600 bg-orange-100'
        };
      case 'active':
      default:
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          text: 'Ativo',
          description: 'Conta ativa e funcionando normalmente',
          color: 'text-green-600 bg-green-100'
        };
    }
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
      case 'membro':
        return 'bg-blue-100 text-blue-800';
      case 'cliente':
        return 'bg-green-100 text-green-800';
      case 'user':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
          <Header />
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <p className="text-gray-600">Carregando usuários...</p>
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
    <CartProvider>
      <div className="min-h-screen bg-gray-50">
          <Header />
        
        <main className="container mx-auto px-4 sm:px-6 py-6">
          {/* Cabeçalho */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Gerenciar Usuários</h1>
                <p className="text-gray-600 mt-1">
                  Total de {users.length} usuários cadastrados
                  {selectedUsers.length > 0 && (
                    <span className="ml-2 text-blue-600 font-medium">
                      ({selectedUsers.length} selecionados)
                    </span>
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                {!isBulkDeleteMode ? (
                  <Button
                    variant="outline"
                    onClick={() => setIsBulkDeleteMode(true)}
                    className="flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Seleção múltipla
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsBulkDeleteMode(false);
                        setSelectedUsers([]);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={confirmBulkDelete}
                      disabled={selectedUsers.length === 0}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Excluir selecionados ({selectedUsers.length})
                    </Button>
                  </>
                )}
              </div>
            </div>
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
                  <SelectItem value="membro">Membro</SelectItem>
                  <SelectItem value="cliente">Cliente</SelectItem>
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
            {filteredAndSortedUsers.length === 0 ? (
              <Card className="p-8 text-center">
                <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum usuário encontrado</h3>
                <p className="text-gray-600">Tente ajustar os filtros de busca.</p>
              </Card>
            ) : (
              filteredAndSortedUsers.map((user) => {
                const accountStatusInfo = getAccountStatusInfo(user);
                
                return (
                  <Card key={user.id} className={`p-6 hover:shadow-md transition-shadow ${
                    selectedUsers.includes(user.id) ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                  }`}>
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        {/* Checkbox para seleção múltipla */}
                        {isBulkDeleteMode && (
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => toggleUserSelection(user.id)}
                            className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        )}
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {user.name || 'Nome não informado'}
                              </h3>
                            </div>
                            {user.role && (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                                {user.role === 'admin' ? 'Admin' : user.role === 'cliente' ? 'Cliente' : 'Membro'}
                              </span>
                            )}
                            {/* Status da conta ao lado do privilégio */}
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${accountStatusInfo.color}`}>
                              {accountStatusInfo.icon}
                              <span>{accountStatusInfo.text}</span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4" />
                              <span className="truncate">{user.email || 'Email não disponível'}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>Criado: {formatDate(user.created_at)}</span>
                              {user.role === 'membro' && !user.membership_lifetime && user.membership_expires_at && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                  <Clock className="w-3 h-3" />
                                  Expira: {formatDate(user.membership_expires_at)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Botões de ação */}
                      {!isBulkDeleteMode && (
                        <div className="flex items-center gap-2">
                          {/* Botão de ativar/desativar conta */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleAccountStatus(user)}
                            className={`flex items-center gap-1 ${
                              user.account_status === 'active' 
                                ? 'text-orange-600 hover:text-orange-700' 
                                : 'text-green-600 hover:text-green-700'
                            }`}
                            title={user.account_status === 'active' ? 'Desativar conta' : 'Ativar conta'}
                          >
                            {user.account_status === 'active' ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </Button>
                          
                          {/* Botão Histórico */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/historico/${user.id}`)}
                          >
                            <Clock className="w-4 h-4 mr-1" />
                            Histórico
                          </Button>
                          
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
                      )}
                    </div>
                  </Card>
                );
              })
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
        
        <Footer />
        
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
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-sm font-medium text-gray-700">Status da Conta</Label>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getDetailedAccountStatus(selectedUser).color}`}>
                          {getDetailedAccountStatus(selectedUser).icon}
                          {getDetailedAccountStatus(selectedUser).text}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">{getDetailedAccountStatus(selectedUser).description}</p>
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

                {editForm.role === 'membro' && (
                  <div className="space-y-3 border rounded-md p-3 bg-gray-50">
                    <Label className="text-sm font-medium">Acesso</Label>

                    <div className="flex items-center gap-2">
                      <input
                        id="membership_lifetime"
                        type="checkbox"
                        checked={editForm.membershipLifetime}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setEditForm({
                            ...editForm,
                            membershipLifetime: checked,
                            membershipStartedAt: checked ? '' : editForm.membershipStartedAt,
                            membershipExpiresAt: checked ? '' : editForm.membershipExpiresAt,
                          });
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                      />
                      <Label htmlFor="membership_lifetime" className="text-sm">Acesso Vitalício</Label>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="membership_started_at" className="text-sm">Início do acesso</Label>
                        <Input
                          id="membership_started_at"
                          type="datetime-local"
                          value={editForm.membershipStartedAt}
                          onChange={(e) => setEditForm({...editForm, membershipStartedAt: e.target.value})}
                          disabled={editForm.membershipLifetime}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="membership_expires_at" className="text-sm">Expiração do acesso</Label>
                        <Input
                          id="membership_expires_at"
                          type="datetime-local"
                          value={editForm.membershipExpiresAt}
                          onChange={(e) => setEditForm({...editForm, membershipExpiresAt: e.target.value})}
                          disabled={editForm.membershipLifetime}
                        />
                      </div>
                      <p className="text-xs text-gray-500">Se "Acesso Vitalício" estiver ativo, as datas serão ignoradas.</p>
                    </div>
                  </div>
                )}
                
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
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowEditModal(false)}
                disabled={isUpdating}
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
        
        {/* Modal de Confirmação de Exclusão */}
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                Confirmar Exclusão
              </DialogTitle>
              <DialogDescription>
                {userToDelete ? (
                  <span>
                    Tem certeza que deseja excluir o usuário <strong>{userToDelete.name || userToDelete.email}</strong>?
                    <br /><br />
                    <span className="text-red-600 font-medium">
                      Esta ação é irreversível e removerá permanentemente o usuário do sistema.
                    </span>
                  </span>
                ) : (
                  <span>
                    Tem certeza que deseja excluir <strong>{selectedUsers.length} usuário(s)</strong> selecionado(s)?
                    <br /><br />
                    <span className="text-red-600 font-medium">
                      Esta ação é irreversível e removerá permanentemente os usuários do sistema.
                    </span>
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setUserToDelete(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={executeDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir {userToDelete ? 'Usuário' : `${selectedUsers.length} Usuário(s)`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </CartProvider>
  );
}