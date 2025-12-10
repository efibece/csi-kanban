

'use client';

import { useSession, signOut } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  User, 
  Shield, 
  Database,
  Download,
  Trash2,
  LogOut,
  Building2,
  Plus,
  Edit,
  Users as UsersIcon,
  Mail,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  _count?: {
    users: number;
    whatsappSessions: number;
  };
  owner?: {
    name: string | null;
    email: string | null;
  };
}

interface Member {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  createdAt: string;
}

export default function SettingsPage() {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [workspaces, setWorkspaces] = useState<{
    owned: Workspace[];
    member: Workspace[];
  }>({ owned: [], member: [] });
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  
  // Estados para dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  
  // Estados para formulários
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [editWorkspaceName, setEditWorkspaceName] = useState('');
  const [editWorkspaceId, setEditWorkspaceId] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  
  const defaultTab = searchParams?.get('tab') || 'profile';

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  useEffect(() => {
    loadWorkspaces();
  }, []);

  useEffect(() => {
    if (selectedWorkspace) {
      loadMembers(selectedWorkspace);
    }
  }, [selectedWorkspace]);

  const loadWorkspaces = async () => {
    try {
      const response = await fetch('/api/workspaces');
      if (!response.ok) throw new Error('Erro ao carregar workspaces');
      
      const data = await response.json();
      setWorkspaces({
        owned: data.ownedWorkspaces || [],
        member: data.memberWorkspaces || [],
      });
      
      // Selecionar o primeiro workspace owned por padrão
      if (data.ownedWorkspaces?.length > 0) {
        setSelectedWorkspace(data.ownedWorkspaces[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar workspaces:', error);
      toast.error('Erro ao carregar workspaces');
    }
  };

  const loadMembers = async (workspaceId: string) => {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/members`);
      if (!response.ok) throw new Error('Erro ao carregar membros');
      
      const data = await response.json();
      setMembers(data.members || []);
      setOwnerId(data.owner?.id || null);
    } catch (error) {
      console.error('Erro ao carregar membros:', error);
      toast.error('Erro ao carregar membros');
    }
  };

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) {
      toast.error('Nome do workspace é obrigatório');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newWorkspaceName.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar workspace');
      }

      toast.success('Workspace criado com sucesso!');
      setNewWorkspaceName('');
      setCreateDialogOpen(false);
      loadWorkspaces();
    } catch (error: any) {
      console.error('Erro ao criar workspace:', error);
      toast.error(error.message || 'Erro ao criar workspace');
    } finally {
      setLoading(false);
    }
  };

  const handleEditWorkspace = async () => {
    if (!editWorkspaceName.trim()) {
      toast.error('Nome do workspace é obrigatório');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/workspaces/${editWorkspaceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editWorkspaceName.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao atualizar workspace');
      }

      toast.success('Workspace atualizado com sucesso!');
      setEditDialogOpen(false);
      loadWorkspaces();
    } catch (error: any) {
      console.error('Erro ao atualizar workspace:', error);
      toast.error(error.message || 'Erro ao atualizar workspace');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWorkspace = async (workspaceId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao deletar workspace');
      }

      toast.success('Workspace deletado com sucesso!');
      loadWorkspaces();
      if (selectedWorkspace === workspaceId) {
        setSelectedWorkspace(null);
      }
    } catch (error: any) {
      console.error('Erro ao deletar workspace:', error);
      toast.error(error.message || 'Erro ao deletar workspace');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) {
      toast.error('Email é obrigatório');
      return;
    }

    if (!selectedWorkspace) {
      toast.error('Selecione um workspace primeiro');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/workspaces/${selectedWorkspace}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao convidar membro');
      }

      toast.success('Membro adicionado com sucesso!');
      setInviteEmail('');
      setInviteDialogOpen(false);
      loadMembers(selectedWorkspace);
    } catch (error: any) {
      console.error('Erro ao convidar membro:', error);
      toast.error(error.message || 'Erro ao convidar membro');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedWorkspace) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/workspaces/${selectedWorkspace}/members/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao remover membro');
      }

      toast.success('Membro removido com sucesso!');
      loadMembers(selectedWorkspace);
    } catch (error: any) {
      console.error('Erro ao remover membro:', error);
      toast.error(error.message || 'Erro ao remover membro');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/');
  };

  const handleExportAllData = async () => {
    try {
      toast.info('A funcionalidade de exportação de dados seria implementada aqui');
    } catch (error) {
      toast.error('Falha ao exportar dados');
    }
  };

  const handleClearAllConversations = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/conversations/clear', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao limpar conversas');
      }

      const data = await response.json();
      toast.success(
        `${data.stats.conversationsDeleted} conversas, ${data.stats.messagesDeleted} mensagens e ${data.stats.contactsDeleted} contatos foram deletados com sucesso!`
      );
    } catch (error: any) {
      console.error('Erro ao limpar conversas:', error);
      toast.error(error.message || 'Erro ao limpar conversas');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!session?.user) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <Settings className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
            <p className="text-gray-600">Você precisa estar logado para ver as configurações.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentWorkspace = workspaces.owned.find(w => w.id === selectedWorkspace) || 
                          workspaces.member.find(w => w.id === selectedWorkspace);
  const isOwner = currentWorkspace?.ownerId === session.user.id;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-600">
          Gerencie as configurações da sua conta, workspaces e preferências.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" onClick={() => setActiveTab('profile')}>
            <User className="h-4 w-4 mr-2" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="workspaces" onClick={() => setActiveTab('workspaces')}>
            <Building2 className="h-4 w-4 mr-2" />
            Workspaces
          </TabsTrigger>
          <TabsTrigger value="data" onClick={() => setActiveTab('data')}>
            <Database className="h-4 w-4 mr-2" />
            Dados
          </TabsTrigger>
          <TabsTrigger value="whatsapp" onClick={() => setActiveTab('whatsapp')}>
            <Settings className="h-4 w-4 mr-2" />
            WhatsApp
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Perfil do Usuário
              </CardTitle>
              <CardDescription>
                Informações da sua conta e detalhes da função.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <label className="text-sm font-medium text-gray-600">Nome</label>
                  <p className="text-gray-900">{session.user.name || 'Não informado'}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-gray-900">{session.user.email}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <label className="text-sm font-medium text-gray-600">Função</label>
                  <div className="mt-1">
                    <Badge className={getRoleBadgeColor(session.user.role)}>
                      <Shield className="h-3 w-3 mr-1" />
                      {session.user.role?.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Ações da Conta</CardTitle>
              <CardDescription>
                Ações que afetam o acesso à sua conta.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between py-3">
                <div>
                  <h3 className="font-medium text-gray-900">Sair</h3>
                  <p className="text-sm text-gray-600">
                    Saia da sua conta neste dispositivo
                  </p>
                </div>
                <Button variant="outline" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workspaces Tab */}
        <TabsContent value="workspaces" className="space-y-6">
          {/* Criar Novo Workspace */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Building2 className="h-5 w-5 mr-2" />
                    Meus Workspaces
                  </CardTitle>
                  <CardDescription>
                    Crie e gerencie seus workspaces
                  </CardDescription>
                </div>
                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Workspace
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Criar Novo Workspace</DialogTitle>
                      <DialogDescription>
                        Dê um nome ao seu novo workspace
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="workspace-name">Nome do Workspace</Label>
                        <Input
                          id="workspace-name"
                          placeholder="Ex: Minha Empresa"
                          value={newWorkspaceName}
                          onChange={(e) => setNewWorkspaceName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleCreateWorkspace();
                            }
                          }}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setCreateDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleCreateWorkspace}
                        disabled={loading || !newWorkspaceName.trim()}
                      >
                        Criar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {workspaces.owned.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Você ainda não possui nenhum workspace</p>
                  <p className="text-sm">Clique em "Criar Workspace" para começar</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {workspaces.owned.map((workspace) => (
                    <div
                      key={workspace.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:border-primary transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{workspace.name}</h3>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm text-gray-600">
                            <UsersIcon className="h-3 w-3 inline mr-1" />
                            {workspace._count?.users || 0} membros
                          </span>
                          <span className="text-sm text-gray-600">
                            {workspace._count?.whatsappSessions || 0} sessões
                          </span>
                          <Badge className="bg-purple-100 text-purple-800">
                            Proprietário
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedWorkspace(workspace.id);
                          }}
                        >
                          <UsersIcon className="h-4 w-4 mr-1" />
                          Membros
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditWorkspaceId(workspace.id);
                            setEditWorkspaceName(workspace.name);
                            setEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. Isso irá deletar permanentemente
                                o workspace e todos os seus dados associados.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteWorkspace(workspace.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Deletar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Workspaces Compartilhados */}
          {workspaces.member.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UsersIcon className="h-5 w-5 mr-2" />
                  Workspaces Compartilhados
                </CardTitle>
                <CardDescription>
                  Workspaces onde você é membro
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {workspaces.member.map((workspace) => (
                    <div
                      key={workspace.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{workspace.name}</h3>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm text-gray-600">
                            Proprietário: {workspace.owner?.name || workspace.owner?.email}
                          </span>
                          <span className="text-sm text-gray-600">
                            <UsersIcon className="h-3 w-3 inline mr-1" />
                            {workspace._count?.users || 0} membros
                          </span>
                        </div>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">
                        Membro
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Gerenciar Membros */}
          {selectedWorkspace && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <UsersIcon className="h-5 w-5 mr-2" />
                      Gerenciar Membros
                    </CardTitle>
                    <CardDescription>
                      {currentWorkspace?.name}
                    </CardDescription>
                  </div>
                  {isOwner && (
                    <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Mail className="h-4 w-4 mr-2" />
                          Convidar Membro
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Convidar Membro</DialogTitle>
                          <DialogDescription>
                            Digite o email do usuário que deseja convidar
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="invite-email">Email</Label>
                            <Input
                              id="invite-email"
                              type="email"
                              placeholder="usuario@exemplo.com"
                              value={inviteEmail}
                              onChange={(e) => setInviteEmail(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleInviteMember();
                                }
                              }}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setInviteDialogOpen(false)}
                          >
                            Cancelar
                          </Button>
                          <Button
                            onClick={handleInviteMember}
                            disabled={loading || !inviteEmail.trim()}
                          >
                            Convidar
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {member.name || 'Sem nome'}
                          </p>
                          <p className="text-sm text-gray-600">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getRoleBadgeColor(member.role)}>
                          {member.id === ownerId ? 'Proprietário' : member.role}
                        </Badge>
                        {isOwner && member.id !== ownerId && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <X className="h-4 w-4 text-red-600" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remover membro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja remover {member.name || member.email} do workspace?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRemoveMember(member.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Remover
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Data Tab */}
        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Gerenciamento de Dados
              </CardTitle>
              <CardDescription>
                Exporte seus dados ou gerencie os dados da sua conta.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <h3 className="font-medium text-gray-900">Exportar Todos os Dados</h3>
                  <p className="text-sm text-gray-600">
                    Baixe todas as suas conversas e dados de contato
                  </p>
                </div>
                <Button variant="outline" onClick={handleExportAllData}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </div>
              
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <h3 className="font-medium text-gray-900">Armazenamento de Dados</h3>
                  <p className="text-sm text-gray-600">
                    Todo o conteúdo das mensagens é criptografado em repouso para segurança
                  </p>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Criptografado
                </Badge>
              </div>

              <div className="flex items-center justify-between py-3 border-t border-red-200 pt-4 mt-4">
                <div>
                  <h3 className="font-medium text-red-900">Limpar Todas as Conversas</h3>
                  <p className="text-sm text-red-600">
                    Remove permanentemente todas as conversas, mensagens e contatos do banco de dados
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Limpar Tudo
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-red-600">
                        Tem certeza absoluta?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação NÃO pode ser desfeita. Isso irá deletar permanentemente TODAS as conversas,
                        mensagens e contatos do seu workspace. Você não poderá recuperar esses dados.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleClearAllConversations}
                        className="bg-red-600 hover:bg-red-700"
                        disabled={loading}
                      >
                        {loading ? 'Limpando...' : 'Sim, Deletar Tudo'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* WhatsApp Tab */}
        <TabsContent value="whatsapp" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Integração WhatsApp
              </CardTitle>
              <CardDescription>
                Informações sobre sua integração do WhatsApp CRM.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">3</div>
                  <div className="text-sm text-gray-600">Máximo de Sessões</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">✓</div>
                  <div className="text-sm text-gray-600">Criptografia de Mensagens</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">∞</div>
                  <div className="text-sm text-gray-600">Armazenamento de Mensagens</div>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Notas Importantes:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Arquivos de mídia não são armazenados, apenas metadados são capturados</li>
                  <li>• Todas as mensagens de texto são criptografadas para sua privacidade</li>
                  <li>• Você pode conectar até 3 contas do WhatsApp simultaneamente</li>
                  <li>• Legendas de mensagens de mídia são salvas como texto</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Workspace Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Workspace</DialogTitle>
            <DialogDescription>
              Altere o nome do workspace
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-workspace-name">Nome do Workspace</Label>
              <Input
                id="edit-workspace-name"
                value={editWorkspaceName}
                onChange={(e) => setEditWorkspaceName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleEditWorkspace();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleEditWorkspace}
              disabled={loading || !editWorkspaceName.trim()}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Footer Info */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <div className="text-center text-sm text-gray-600">
            <p>WhatsApp Mini CRM - Gerenciamento seguro de conversas</p>
            <p className="mt-1">Construído pensando em segurança e privacidade</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

