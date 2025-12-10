
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, Plus } from 'lucide-react';
import { toast } from 'sonner';

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

export function WorkspaceSelector() {
  const router = useRouter();
  const { data: session, update } = useSession() || {};
  const [workspaces, setWorkspaces] = useState<{
    owned: Workspace[];
    member: Workspace[];
  }>({ owned: [], member: [] });
  const [currentWorkspace, setCurrentWorkspace] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkspaces();
  }, [session?.user?.workspaceId]);

  const loadWorkspaces = async () => {
    try {
      const response = await fetch('/api/workspaces');
      if (!response.ok) throw new Error('Erro ao carregar workspaces');
      
      const data = await response.json();
      setWorkspaces({
        owned: data.ownedWorkspaces || [],
        member: data.memberWorkspaces || [],
      });
      
      if (session?.user?.workspaceId) {
        setCurrentWorkspace(session.user.workspaceId);
      } else if (data.ownedWorkspaces?.length > 0) {
        setCurrentWorkspace(data.ownedWorkspaces[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar workspaces:', error);
      toast.error('Erro ao carregar workspaces');
    } finally {
      setLoading(false);
    }
  };

  const handleWorkspaceChange = async (workspaceId: string) => {
    if (workspaceId === 'create-new') {
      router.push('/dashboard/settings?tab=workspaces');
      return;
    }

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/switch`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Erro ao trocar workspace');

      setCurrentWorkspace(workspaceId);
      toast.success('Workspace alterado com sucesso');
      
      // Atualizar sessão
      await update();
      
      // Recarregar página para atualizar dados
      router.refresh();
    } catch (error) {
      console.error('Erro ao trocar workspace:', error);
      toast.error('Erro ao trocar workspace');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <Building2 className="h-4 w-4 animate-pulse" />
        <span>Carregando...</span>
      </div>
    );
  }

  const allWorkspaces = [...workspaces.owned, ...workspaces.member];

  if (allWorkspaces.length === 0) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <Building2 className="h-4 w-4" />
        <span>Sem workspace</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <Building2 className="h-4 w-4 text-gray-500" />
      <Select value={currentWorkspace || undefined} onValueChange={handleWorkspaceChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Selecione um workspace" />
        </SelectTrigger>
        <SelectContent>
          {workspaces.owned.length > 0 && (
            <>
              <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">
                Meus Workspaces
              </div>
              {workspaces.owned.map((workspace) => (
                <SelectItem key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </SelectItem>
              ))}
            </>
          )}
          
          {workspaces.member.length > 0 && (
            <>
              <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">
                Workspaces Compartilhados
              </div>
              {workspaces.member.map((workspace) => (
                <SelectItem key={workspace.id} value={workspace.id}>
                  {workspace.name}
                  {workspace.owner && (
                    <span className="text-xs text-gray-500 ml-2">
                      ({workspace.owner.name || workspace.owner.email})
                    </span>
                  )}
                </SelectItem>
              ))}
            </>
          )}
          
          <div className="border-t my-1" />
          <SelectItem value="create-new">
            <div className="flex items-center text-primary">
              <Plus className="h-4 w-4 mr-2" />
              Criar Novo Workspace
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
