
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Smartphone, 
  Plus, 
  QrCode, 
  Wifi, 
  WifiOff, 
  Loader2,
  AlertCircle,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

interface WhatsAppSession {
  id: string;
  sessionName: string;
  phoneNumber?: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  qrCode?: string;
  createdAt: string;
  updatedAt: string;
}

export default function SessionsPage() {
  const { data: session } = useSession() || {};
  const [sessions, setSessions] = useState<WhatsAppSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [selectedSession, setSelectedSession] = useState<WhatsAppSession | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [qrPolling, setQrPolling] = useState<string | null>(null);

  const fetchSessions = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      }
      console.log('[Auto-Refresh] Fetching WhatsApp sessions...');
      const response = await fetch('/api/whatsapp/session');
      const data = await response.json();

      if (response.ok) {
        console.log('[Auto-Refresh] Got', data.sessions?.length || 0, 'sessions');
        setSessions(data.sessions || []);
      } else {
        if (showLoading) {
          toast.error(data.error || 'Falha ao buscar sessões');
        }
      }
    } catch (error) {
      console.error('[Auto-Refresh] Error fetching sessions:', error);
      if (showLoading) {
        toast.error('Falha ao carregar sessões');
      }
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, []);

  const createSession = async () => {
    if (!newSessionName.trim()) {
      toast.error('Nome da sessão é obrigatório');
      return;
    }

    // Check if we already have 3 sessions
    if (sessions.length >= 3) {
      toast.error('Máximo de 3 sessões do WhatsApp permitidas por workspace');
      return;
    }

    try {
      setIsCreating(true);
      const response = await fetch('/api/whatsapp/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionName: newSessionName })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Sessão do WhatsApp criada com sucesso!');
        setNewSessionName('');
        setIsDialogOpen(false);
        await fetchSessions();
        
        // Start polling for QR code if session is connecting
        if (data.status === 'connecting') {
          startQrPolling(data.sessionId);
        }
      } else {
        toast.error(data.error || 'Falha ao criar sessão');
      }
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Falha ao criar sessão');
    } finally {
      setIsCreating(false);
    }
  };

  const disconnectSession = async (sessionId: string, sessionName: string) => {
    if (!confirm(`Tem certeza que deseja desconectar "${sessionName}"?`)) {
      return;
    }

    try {
      toast.loading('Desconectando...', { id: 'disconnect' });
      const response = await fetch('/api/whatsapp/session', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Sessão desconectada com sucesso', { id: 'disconnect' });
        await fetchSessions();
      } else {
        toast.error(data.error || 'Falha ao desconectar sessão', { id: 'disconnect' });
      }
    } catch (error) {
      console.error('Error disconnecting session:', error);
      toast.error('Falha ao desconectar sessão', { id: 'disconnect' });
    }
  };

  const deleteSessionPermanently = async (sessionId: string, sessionName: string) => {
    if (!confirm(`ATENÇÃO: Tem certeza que deseja EXCLUIR permanentemente "${sessionName}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      toast.loading('Excluindo...', { id: 'delete' });
      const response = await fetch(`/api/whatsapp/session/${sessionId}/delete`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Sessão excluída com sucesso', { id: 'delete' });
        await fetchSessions();
      } else {
        toast.error(data.error || 'Falha ao excluir sessão', { id: 'delete' });
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Falha ao excluir sessão', { id: 'delete' });
    }
  };

  const reconnectSession = async (sessionId: string) => {
    try {
      toast.loading('Iniciando reconexão...', { id: 'reconnect' });
      
      const response = await fetch(`/api/whatsapp/session/${sessionId}/reconnect`, {
        method: 'POST'
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Reconexão iniciada! Aguarde o QR code...', { id: 'reconnect' });
        
        // Refresh sessions to get updated status
        await fetchSessions();
        
        // Start polling for QR code
        startQrPolling(sessionId);
      } else {
        toast.error(data.error || 'Falha ao reconectar sessão', { id: 'reconnect' });
      }
    } catch (error) {
      console.error('Error reconnecting session:', error);
      toast.error('Falha ao reconectar sessão', { id: 'reconnect' });
    }
  };

  const startQrPolling = (sessionId: string) => {
    setQrPolling(sessionId);
    
    const pollQr = async () => {
      try {
        const response = await fetch(`/api/whatsapp/qr?sessionId=${sessionId}`);
        const data = await response.json();

        if (response.ok) {
          // Update the session with latest status and QR code
          setSessions(prev => prev.map(s => 
            s.id === sessionId 
              ? { ...s, status: data.status, qrCode: data.qrCode, phoneNumber: data.phoneNumber }
              : s
          ));

          // If connected, stop polling
          if (data.status === 'connected') {
            setQrPolling(null);
            toast.success('WhatsApp conectado com sucesso!');
            return;
          }

          // If error or disconnected, stop polling
          if (data.status === 'error' || data.status === 'disconnected') {
            setQrPolling(null);
            return;
          }

          // Continue polling if still connecting
          if (data.status === 'connecting') {
            setTimeout(pollQr, 2000);
          }
        }
      } catch (error) {
        console.error('Error polling QR code:', error);
        setQrPolling(null);
      }
    };

    // Start polling immediately
    pollQr();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'connecting':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <Wifi className="h-4 w-4" />;
      case 'connecting':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <WifiOff className="h-4 w-4" />;
    }
  };

  // Initial fetch
  useEffect(() => {
    if (session?.user?.workspaceId) {
      fetchSessions(true);
    }
  }, [session, fetchSessions]);

  // Auto-refresh sessions every 5 seconds to update status
  useEffect(() => {
    if (!session?.user?.workspaceId) {
      console.log('[Auto-Refresh] No workspace, no sessions refresh');
      return;
    }

    console.log('[Auto-Refresh] Starting sessions auto-refresh...');
    
    const sessionsInterval = setInterval(() => {
      console.log('[Auto-Refresh] Refreshing sessions status...');
      fetchSessions(false); // false = não mostra loading spinner
    }, 1000); // 1 segundo

    return () => {
      console.log('[Auto-Refresh] Clearing sessions interval');
      clearInterval(sessionsInterval);
    };
  }, [session?.user?.workspaceId, fetchSessions]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      setQrPolling(null);
    };
  }, []);

  if (!session?.user?.workspaceId) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <Smartphone className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Workspace Não Encontrado</h2>
            <p className="text-gray-600">
              Você precisa estar atribuído a um workspace para gerenciar sessões do WhatsApp.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sessões do WhatsApp</h1>
          <p className="text-gray-600">
            Gerencie suas conexões do WhatsApp. Máximo de 3 sessões por workspace.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => fetchSessions(true)}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={sessions.length >= 3}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Sessão
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Sessão do WhatsApp</DialogTitle>
                <DialogDescription>
                  Dê um nome à sua sessão do WhatsApp para identificá-la facilmente.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="sessionName">Nome da Sessão</Label>
                  <Input
                    id="sessionName"
                    placeholder="e.g., Main Account, Support Line"
                    value={newSessionName}
                    onChange={(e) => setNewSessionName(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={createSession} 
                  disabled={isCreating}
                  className="w-full"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando Sessão...
                    </>
                  ) : (
                    'Criar Sessão'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Session Limit Alert */}
      {sessions.length >= 3 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Você atingiu o máximo de 3 sessões do WhatsApp por workspace. 
            Desconectar a session to add a new one.
          </AlertDescription>
        </Alert>
      )}

      {/* Sessions Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-32 bg-gray-300 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Smartphone className="h-16 w-16 mx-auto text-gray-400 mb-6" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhuma Sessão do WhatsApp</h3>
            <p className="text-gray-600 mb-6">
              Conecte sua conta do WhatsApp para começar a capturar mensagens e gerenciar conversas.
            </p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Crie Sua Primeira Sessão
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Sessão do WhatsApp</DialogTitle>
                  <DialogDescription>
                    Dê um nome à sua sessão do WhatsApp para identificá-la facilmente.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="sessionName">Nome da Sessão</Label>
                    <Input
                      id="sessionName"
                      placeholder="e.g., Main Account, Support Line"
                      value={newSessionName}
                      onChange={(e) => setNewSessionName(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={createSession} 
                    disabled={isCreating}
                    className="w-full"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Criando Sessão...
                      </>
                    ) : (
                      'Criar Sessão'
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((sessionItem) => (
            <Card key={sessionItem.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{sessionItem.sessionName}</CardTitle>
                  <Badge className={getStatusColor(sessionItem.status)}>
                    {getStatusIcon(sessionItem.status)}
                    <span className="ml-1 capitalize">{sessionItem.status}</span>
                  </Badge>
                </div>
                <CardDescription>
                  {sessionItem.phoneNumber ? (
                    <span>Conectado: {sessionItem.phoneNumber}</span>
                  ) : (
                    <span>Não conectado</span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* QR Code Display */}
                {sessionItem.status === 'connecting' && (
                  <div className="space-y-4">
                    {sessionItem.qrCode ? (
                      <div className="text-center">
                        <div className="relative aspect-square bg-white p-4 rounded-lg border">
                          <Image
                            src={sessionItem.qrCode}
                            alt="WhatsApp QR Code"
                            fill
                            className="object-contain"
                          />
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          Escaneie este QR code com o WhatsApp no seu telefone
                        </p>
                        {qrPolling === sessionItem.id && (
                          <div className="flex items-center justify-center mt-2">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            <span className="text-sm text-gray-600">Aguardando conexão...</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <QrCode className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">Gerando QR code...</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Connected State */}
                {sessionItem.status === 'connected' && (
                  <div className="text-center py-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Wifi className="h-8 w-8 text-green-600" />
                    </div>
                    <p className="font-medium text-green-800">Conectado com Sucesso!</p>
                    <p className="text-sm text-gray-600">Mensagens estão sendo capturadas</p>
                  </div>
                )}

                {/* Error State */}
                {sessionItem.status === 'error' && (
                  <div className="text-center py-4">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="h-8 w-8 text-red-600" />
                    </div>
                    <p className="font-medium text-red-800">Falha na Conexão</p>
                    <p className="text-sm text-gray-600">Por favor, tente conectar novamente</p>
                  </div>
                )}

                {/* Desconectado State */}
                {sessionItem.status === 'disconnected' && (
                  <div className="text-center py-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <WifiOff className="h-8 w-8 text-gray-600" />
                    </div>
                    <p className="font-medium text-gray-800">Desconectado</p>
                    <p className="text-sm text-gray-600">Clique em reconectar para começar novamente</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-2 mt-4">
                  {sessionItem.status === 'disconnected' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => reconnectSession(sessionItem.id)}
                      className="flex-1"
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Reconectar
                    </Button>
                  )}
                  
                  {(sessionItem.status === 'connected' || sessionItem.status === 'connecting') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => disconnectSession(sessionItem.id, sessionItem.sessionName)}
                      className="flex-1"
                    >
                      <WifiOff className="h-4 w-4 mr-1" />
                      Desconectar
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteSessionPermanently(sessionItem.id, sessionItem.sessionName)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Session Info */}
                <div className="text-xs text-gray-500 mt-4 pt-4 border-t">
                  <p>Criado: {new Date(sessionItem.createdAt).toLocaleDateString()}</p>
                  <p>Atualizado: {new Date(sessionItem.updatedAt).toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
