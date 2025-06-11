import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Search, Users, Shield, User } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ManageUsers = () => {
  const { user, profile } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [editingUser, setEditingUser] = useState<any>(null);
  const [newRole, setNewRole] = useState('');

  useEffect(() => {
    if (profile?.role === 'admin') {
      loadUsers();
    }
  }, [profile]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Carregando usuários...');
      
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error('Erro ao buscar usuários de auth:', authError);
        throw authError;
      }

      console.log('Usuários de auth encontrados:', authUsers?.users?.length || 0);

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) {
        console.error('Erro ao buscar profiles:', profilesError);
        throw profilesError;
      }

      console.log('Profiles encontrados:', profiles?.length || 0);

      const combinedUsers = authUsers.users.map(authUser => {
        const userProfile = profiles?.find(p => p.id === authUser.id);
        return {
          id: authUser.id,
          email: authUser.email,
          name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || 'Nome não informado',
          role: userProfile?.role || 'user',
          created_at: authUser.created_at,
          last_sign_in_at: authUser.last_sign_in_at,
          confirmed_at: authUser.confirmed_at,
          phone: authUser.phone || userProfile?.telefone,
          cpf: userProfile?.cpf
        };
      });

      console.log('Usuários combinados:', combinedUsers);
      setUsers(combinedUsers);
    } catch (error: any) {
      console.error('Erro ao carregar usuários:', error);
      setError(error.message || 'Erro ao carregar usuários');
      toast.error('Erro ao carregar usuários: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      
      if (error) {
        throw error;
      }

      toast.success('Usuário excluído com sucesso');
      loadUsers();
    } catch (error: any) {
      console.error('Erro ao excluir usuário:', error);
      toast.error('Erro ao excluir usuário: ' + error.message);
    }
  };

  const handleUpdateRole = async () => {
    if (!editingUser || !newRole) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: editingUser.id,
          role: newRole,
          name: editingUser.name,
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      toast.success('Privilégios atualizados com sucesso');
      setEditingUser(null);
      setNewRole('');
      loadUsers();
    } catch (error: any) {
      console.error('Erro ao atualizar privilégios:', error);
      toast.error('Erro ao atualizar privilégios: ' + error.message);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'moderator': return 'secondary';
      default: return 'outline';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="w-3 h-3" />;
      case 'moderator': return <Edit className="w-3 h-3" />;
      default: return <User className="w-3 h-3" />;
    }
  };

  if (profile?.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>
            Você não tem permissão para acessar esta página.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
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
            <Users className="w-8 h-8" />
            Gerenciar Usuários
          </h1>
          <p className="text-gray-600 mt-1">
            Total de usuários: {users.length}
          </p>
        </div>
        <Button onClick={loadUsers} variant="outline">
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
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filtrar por papel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os papéis</SelectItem>
            <SelectItem value="user">Usuário</SelectItem>
            <SelectItem value="moderator">Moderador</SelectItem>
            <SelectItem value="admin">Administrador</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filteredUsers.map((userData) => (
          <Card key={userData.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{userData.name}</h3>
                    <Badge variant={getRoleBadgeColor(userData.role)} className="flex items-center gap-1">
                      {getRoleIcon(userData.role)}
                      {userData.role}
                    </Badge>
                  </div>
                  <p className="text-gray-600 mb-1">{userData.email}</p>
                  {userData.phone && (
                    <p className="text-gray-600 mb-1">Telefone: {userData.phone}</p>
                  )}
                  {userData.cpf && (
                    <p className="text-gray-600 mb-1">CPF: {userData.cpf}</p>
                  )}
                  <div className="text-sm text-gray-500 mt-2">
                    <p>Cadastrado em: {new Date(userData.created_at).toLocaleDateString('pt-BR')}</p>
                    {userData.last_sign_in_at && (
                      <p>Último acesso: {new Date(userData.last_sign_in_at).toLocaleDateString('pt-BR')}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingUser(userData);
                          setNewRole(userData.role);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Editar Privilégios</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Usuário</label>
                          <p className="text-sm text-gray-600">{editingUser?.name} ({editingUser?.email})</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Papel</label>
                          <Select value={newRole} onValueChange={setNewRole}>
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">Usuário</SelectItem>
                              <SelectItem value="moderator">Moderador</SelectItem>
                              <SelectItem value="admin">Administrador</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button onClick={handleUpdateRole} className="w-full">
                          Salvar Alterações
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  {userData.id !== user?.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteUser(userData.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum usuário encontrado</h3>
            <p className="text-gray-600">
              {searchTerm || roleFilter !== 'all' 
                ? 'Tente ajustar os filtros de busca.' 
                : 'Não há usuários cadastrados no sistema.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ManageUsers;
