

'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  MessageSquare, 
  Phone,
  Clock,
  User,
  Filter,
  Download,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Contact {
  id: string;
  name: string;
  phoneNumber: string;
  profilePicUrl?: string;
}

interface Message {
  id: string;
  textContent: string;
  hasMedia: boolean;
  mediaType?: string;
  mediaCaption?: string;
  mediaFileName?: string;
  timestamp: string;
  fromMe: boolean;
  status?: string;
}

interface Conversation {
  id: string;
  contact: Contact;
  lastMessageAt: string;
  unreadCount: number;
  mensagens: Message[];
  _count: {
    mensagens: number;
  };
}

interface ConversationDetails extends Conversation {
  mensagens: Message[];
}

export default function ConversationsPage() {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationDetails | null>(null);
  const [conversationMessages, setConversationMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Ref for auto-scrolling to bottom of messages
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const filteredConversations = useMemo(() => {
    if (!searchTerm) return conversations;
    
    return conversations.filter(conv =>
      conv.contact?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.contact?.phoneNumber?.includes(searchTerm) ||
      conv.mensagens?.[0]?.textContent?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [conversations, searchTerm]);

  const fetchConversations = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      }
      console.log('[Auto-Refresh] Fetching conversations list...');
      const response = await fetch('/api/conversations?limit=50');
      const data = await response.json();

      if (response.ok) {
        console.log('[Auto-Refresh] Got', data.conversations?.length || 0, 'conversations');
        setConversations(data.conversations || []);
      } else {
        if (showLoading) {
          toast.error(data.error || 'Falha ao buscar conversas');
        }
      }
    } catch (error) {
      console.error('[Auto-Refresh] Error fetching conversations:', error);
      if (showLoading) {
        toast.error('Falha ao carregar conversas');
      }
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, []);

  const fetchConversationMessages = async (conversationId: string) => {
    try {
      setIsLoadingMessages(true);
      const response = await fetch(`/api/conversations/${conversationId}/mensagens`);
      const data = await response.json();

      if (response.ok) {
        setSelectedConversation(data.conversation);
        setConversationMessages(data.mensagens || []);
      } else {
        toast.error(data.error || 'Falha ao buscar mensagens');
      }
    } catch (error) {
      console.error('Error fetching mensagens:', error);
      toast.error('Falha ao carregar mensagens');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const refreshMessages = useCallback(async () => {
    if (!selectedConversation) {
      console.log('[Auto-Refresh] No conversation selected, skipping...');
      return;
    }
    
    console.log('[Auto-Refresh] Refreshing messages for conversation:', selectedConversation.id);
    
    try {
      setIsRefreshing(true);
      const response = await fetch(`/api/conversations/${selectedConversation.id}/mensagens`);
      const data = await response.json();

      if (response.ok) {
        console.log('[Auto-Refresh] Got', data.mensagens?.length || 0, 'messages');
        setConversationMessages(data.mensagens || []);
        // Update the selected conversation
        setSelectedConversation(data.conversation);
        // Update conversation in list
        setConversations(prev => prev.map(conv => 
          conv.id === data.conversation.id ? data.conversation : conv
        ));
      }
    } catch (error) {
      console.error('[Auto-Refresh] Error refreshing messages:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedConversation]);

  const exportConversation = async (conversationId: string) => {
    try {
      const response = await fetch('/api/conversations/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, format: 'txt' })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `conversation_${conversationId}_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Conversa exportada com sucesso!');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Falha ao exportar conversa');
      }
    } catch (error) {
      console.error('Error exporting conversation:', error);
      toast.error('Falha ao exportar conversa');
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60);
    
    if (diffInMinutes < 60) {
      return `${Math.floor(diffInMinutes)}m atrás`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h atrás`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversationMessages]);

  // Initial fetch
  useEffect(() => {
    if (session?.user?.workspaceId) {
      fetchConversations(true);
    }
  }, [session, fetchConversations]);

  // Auto-refresh conversations list every 5 seconds to catch new contacts
  useEffect(() => {
    if (!session?.user?.workspaceId) {
      console.log('[Auto-Refresh] No workspace, no conversations refresh');
      return;
    }

    console.log('[Auto-Refresh] Starting conversations list auto-refresh...');
    
    const conversationsInterval = setInterval(() => {
      console.log('[Auto-Refresh] Refreshing conversations list...');
      fetchConversations(false); // false = não mostra loading spinner
    }, 5000); // 5 segundos

    return () => {
      console.log('[Auto-Refresh] Clearing conversations list interval');
      clearInterval(conversationsInterval);
    };
  }, [session?.user?.workspaceId, fetchConversations]);

  // Auto-refresh messages every 5 seconds if conversation is selected
  useEffect(() => {
    if (!selectedConversation) {
      console.log('[Auto-Refresh] No conversation selected, no interval created');
      return;
    }

    console.log('[Auto-Refresh] Starting auto-refresh interval for conversation:', selectedConversation.id);
    
    const messagesInterval = setInterval(() => {
      console.log('[Auto-Refresh] Interval triggered, calling refreshMessages...');
      refreshMessages();
    }, 5000); // 5 segundos

    return () => {
      console.log('[Auto-Refresh] Clearing messages interval');
      clearInterval(messagesInterval);
    };
  }, [selectedConversation?.id, refreshMessages]);

  if (!session?.user?.workspaceId) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <MessageSquare className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Workspace Não Encontrado</h2>
            <p className="text-gray-600">
              Você precisa estar atribuído a um workspace para ver as conversas.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex h-[calc(100vh-200px)] bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Conversations List */}
        <div className={`${selectedConversation ? 'hidden lg:block' : 'block'} w-full lg:w-1/3 border-r border-gray-200 flex flex-col`}>
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Conversas</h1>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar conversas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="flex items-center space-x-3 p-3">
                      <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma Conversa</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm 
                    ? `Nenhuma conversa encontrada com "${searchTerm}"`
                    : "Conecte uma conta do WhatsApp para começar a capturar conversas"
                  }
                </p>
                {!searchTerm && (
                  <Button onClick={() => router.push('/dashboard/sessions')}>
                    Conectar WhatsApp
                  </Button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => fetchConversationMessages(conversation.id)}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedConversation?.id === conversation.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-gray-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {conversation.contact?.name || 'Contato Desconhecido'}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <Badge className="bg-green-600 text-white">
                              {conversation.unreadCount} não lida{conversation.unreadCount > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <Phone className="h-3 w-3" />
                          <span>{conversation.contact?.phoneNumber}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Interface */}
        <div className={`${selectedConversation ? 'block' : 'hidden lg:block'} flex-1 flex flex-col`}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedConversation(null)}
                      className="lg:hidden"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-gray-900">
                        {selectedConversation.contact?.name || 'Contato Desconhecido'}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {selectedConversation.contact?.phoneNumber}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={refreshMessages}
                      disabled={isRefreshing}
                    >
                      <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                      Atualizar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportConversation(selectedConversation.id)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Exportar
                    </Button>
                  </div>
                </div>
              </div>

              {/* Messages - with scroll */}
              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 bg-gray-50 scroll-smooth"
                style={{ maxHeight: 'calc(100vh - 400px)' }}
              >
                {isLoadingMessages ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                          <div className="max-w-xs bg-gray-300 rounded-lg p-3 h-12"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : conversationMessages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">Sem mensagens nesta conversa ainda</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {conversationMessages.map((mensagem) => (
                      <div
                        key={mensagem.id}
                        className={`flex ${mensagem.fromMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-xs lg:max-w-md ${
                          mensagem.fromMe 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-white text-gray-900 border border-gray-200'
                        } rounded-lg p-3 shadow-sm`}>
                          {mensagem.hasMedia && (
                            <div className={`text-xs mb-2 ${
                              mensagem.fromMe ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              📎 {mensagem.mediaType === 'document' && mensagem.mediaFileName 
                                ? mensagem.mediaFileName 
                                : `${mensagem.mediaType?.toUpperCase()} mensagem`}
                              {mensagem.mediaCaption && (
                                <div className="mt-1 text-sm">{mensagem.mediaCaption}</div>
                              )}
                            </div>
                          )}
                          {mensagem.textContent && (
                            <p className="text-sm whitespace-pre-wrap">{mensagem.textContent}</p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <span className={`text-xs ${
                              mensagem.fromMe ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {new Date(mensagem.timestamp).toLocaleTimeString()}
                            </span>
                            {mensagem.fromMe && mensagem.status && (
                              <span className="text-xs text-blue-100 capitalize">
                                {mensagem.status}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {/* Invisible element to scroll to */}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>


            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-white p-8">
              <div className="text-center max-w-md">
                <MessageSquare className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Selecione uma Conversa</h3>
                <p className="text-gray-600 mb-3 leading-relaxed">
                  Escolha uma conversa da lista para visualizar as mensagens
                </p>
                <p className="text-sm text-gray-500 leading-relaxed">
                  As mensagens são atualizadas automaticamente a cada 5 segundos
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
