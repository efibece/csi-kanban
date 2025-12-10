
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Users, 
  Smartphone, 
  TrendingUp,
  Plus,
  RefreshCw,
  Activity
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface DashboardStats {
  totalConversations: number;
  totalContacts: number;
  activeSessions: number;
  recentMessages: number;
}

interface RecentConversation {
  id: string;
  contact: {
    name: string;
    phoneNumber: string;
  };
  lastMessage: {
    textContent: string;
    timestamp: string;
    fromMe: boolean;
  };
  unreadCount: number;
}

export default function DashboardPage() {
  const { data: session } = useSession() || {};
  const [stats, setStats] = useState<DashboardStats>({
    totalConversations: 0,
    totalContacts: 0,
    activeSessions: 0,
    recentMessages: 0
  });
  const [recentConversations, setRecentConversations] = useState<RecentConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      // Fetch conversations for stats and recent activity
      const [conversationsResponse, sessionsResponse] = await Promise.all([
        fetch('/api/conversations?limit=5'),
        fetch('/api/whatsapp/session')
      ]);

      const conversationsData = await conversationsResponse.json();
      const sessionsData = await sessionsResponse.json();

      if (conversationsResponse.ok) {
        const conversations = conversationsData.conversations || [];
        const uniqueContacts = new Set(conversations.map((conv: any) => conv.contact.phoneNumber));
        
        setStats({
          totalConversations: conversationsData.pagination?.total || 0,
          totalContacts: uniqueContacts.size,
          activeSessions: sessionsData.sessions?.filter((s: any) => s.status === 'connected').length || 0,
          recentMessages: conversations.reduce((acc: number, conv: any) => acc + conv._count.messages, 0)
        });

        setRecentConversations(conversations.slice(0, 5));
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Falha ao carregar dados do painel');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.workspaceId) {
      fetchDashboardData();
    }
  }, [session]);

  if (!session?.user?.workspaceId) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <MessageSquare className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Workspace Não Encontrado</h2>
            <p className="text-gray-600 mb-6">
              Parece que você não tem um workspace atribuído. Entre em contato com o administrador.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Painel</h1>
          <p className="text-gray-600">
            Bem-vindo de volta, {session.user?.name}. Veja o que está acontecendo com seu CSI Kanban.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={fetchDashboardData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Link href="/dashboard/sessions">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Conectar WhatsApp
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total de Conversas
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalConversations}</div>
            <p className="text-xs text-gray-600">
              Conversas ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total de Contatos
            </CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalContacts}</div>
            <p className="text-xs text-gray-600">
              Contatos únicos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Sessões Ativas
            </CardTitle>
            <Smartphone className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSessions}</div>
            <p className="text-xs text-gray-600">
              Contas WhatsApp conectadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total de Mensagens
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentMessages}</div>
            <p className="text-xs text-gray-600">
              Mensagens rastreadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Conversas Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentConversations.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">Nenhuma conversa ainda</p>
                <p className="text-sm text-gray-500">
                  Conecte uma conta do WhatsApp para começar a capturar conversas
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentConversations.map((conversation) => (
                  <div key={conversation.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900">
                          {conversation.contact.name || conversation.contact.phoneNumber}
                        </p>
                        <div className="flex items-center space-x-2">
                          {conversation.unreadCount > 0 && (
                            <Badge variant="default" className="bg-green-600">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500">
                            {new Date(conversation.lastMessage?.timestamp || '').toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.lastMessage?.fromMe ? 'Você: ' : ''}
                        {conversation.lastMessage?.textContent || 'Sem conteúdo de mensagem'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {conversation.contact.phoneNumber}
                      </p>
                    </div>
                  </div>
                ))}
                <div className="pt-4">
                  <Link href="/dashboard/conversations">
                    <Button variant="outline" className="w-full">
                      Ver Todas as Conversas
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Smartphone className="h-5 w-5 mr-2" />
              Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Link href="/dashboard/sessions">
                <Button className="w-full justify-start" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Conectar Nova Conta WhatsApp
                </Button>
              </Link>
              <Link href="/dashboard/conversations">
                <Button className="w-full justify-start" variant="outline">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Ver Todas as Conversas
                </Button>
              </Link>
              <Link href="/dashboard/contacts">
                <Button className="w-full justify-start" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Gerenciar Contatos
                </Button>
              </Link>
              <Link href="/dashboard/settings">
                <Button className="w-full justify-start" variant="outline">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Exportar Dados
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

