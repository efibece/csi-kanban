
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Search, 
  Phone, 
  MessageSquare,
  Calendar,
  User,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface Contact {
  id: string;
  phoneNumber: string;
  name?: string;
  profilePicUrl?: string;
  createdAt: string;
  updatedAt: string;
  conversations: Array<{
    id: string;
    lastMessageAt?: string;
    unreadCount: number;
    _count: {
      messages: number;
    };
  }>;
}

export default function ContactsPage() {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredContacts = useMemo(() => {
    if (!searchTerm) return contacts;
    
    return contacts.filter(contact =>
      contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phoneNumber.includes(searchTerm)
    );
  }, [contacts, searchTerm]);

  const fetchContacts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/conversations');
      const data = await response.json();

      if (response.ok) {
        // Extract unique contacts from conversations
        const uniqueContacts = new Map();
        
        data.conversations?.forEach((conv: any) => {
          if (!uniqueContacts.has(conv.contact.id)) {
            uniqueContacts.set(conv.contact.id, {
              ...conv.contact,
              conversations: [conv]
            });
          } else {
            const existing = uniqueContacts.get(conv.contact.id);
            existing.conversations.push(conv);
          }
        });

        setContacts(Array.from(uniqueContacts.values()));
      } else {
        toast.error(data.error || 'Falha ao buscar contatos');
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error('Falha ao carregar contatos');
    } finally {
      setIsLoading(false);
    }
  };

  const getTotalMessages = (contact: Contact) => {
    return contact.conversations?.reduce((total, conv) => total + (conv._count?.messages || 0), 0) || 0;
  };

  const getTotalUnreadMessages = (contact: Contact) => {
    return contact.conversations?.reduce((total, conv) => total + (conv.unreadCount || 0), 0) || 0;
  };

  const getLastActivity = (contact: Contact) => {
    const lastMessages = contact.conversations
      ?.map(conv => conv.lastMessageAt)
      .filter(Boolean)
      .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime());
    
    return lastMessages?.[0] || null;
  };

  useEffect(() => {
    if (session?.user?.workspaceId) {
      fetchContacts();
    }
  }, [session]);

  if (!session?.user?.workspaceId) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Workspace Não Encontrado</h2>
            <p className="text-gray-600">
              Você precisa estar atribuído a um workspace para ver os contatos.
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
          <h1 className="text-3xl font-bold text-gray-900">Contatos</h1>
          <p className="text-gray-600">
            Gerencie seus contatos do WhatsApp e visualize o histórico de conversas.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchContacts}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar contatos por nome ou número de telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total de Contatos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contacts.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Conversas Ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {contacts.reduce((total, contact) => total + contact.conversations.length, 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Mensagens Não Lidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {contacts.reduce((total, contact) => total + getTotalUnreadMessages(contact), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contacts List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Contatos ({filteredContacts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center space-x-4 p-4">
                    <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-300 rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-gray-300 rounded w-1/4"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-300 rounded w-16"></div>
                      <div className="h-3 bg-gray-300 rounded w-12"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'Nenhum contato encontrado' : 'Nenhum contato ainda'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm 
                  ? `Nenhum contato corresponde a "${searchTerm}"`
                  : "Conecte uma conta do WhatsApp para começar a capturar contatos das conversas"
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredContacts.map((contact) => {
                const totalMessages = getTotalMessages(contact);
                const unreadMessages = getTotalUnreadMessages(contact);
                const lastActivity = getLastActivity(contact);

                return (
                  <div key={contact.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {contact.name || 'Contato Desconhecido'}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              {contact.phoneNumber}
                            </div>
                            {lastActivity && (
                              <div className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                Último acesso {new Date(lastActivity).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-900">{totalMessages}</div>
                          <div className="text-xs text-gray-500">Mensagens</div>
                        </div>
                        
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-900">
                            {contact.conversations.length}
                          </div>
                          <div className="text-xs text-gray-500">Conversas</div>
                        </div>
                        
                        {unreadMessages > 0 && (
                          <Badge className="bg-green-600 text-white">
                            {unreadMessages} não lidas
                          </Badge>
                        )}
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => router.push(`/dashboard/conversations?contact=${contact.phoneNumber}`)}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Ver Conversa
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

