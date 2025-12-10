'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Plus,
  MessageSquare,
  StickyNote,
  User,
  Phone,
  DollarSign,
  Calendar,
  Send,
  TrendingUp,
  TrendingDown,
  Clock,
  UserPlus,
  X,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
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
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckSquare } from 'lucide-react';

interface Contact {
  id: string;
  name: string | null;
  phoneNumber: string;
}

interface DealContact {
  id: string;
  contact: Contact;
}

interface Deal {
  id: string;
  title: string;
  description: string | null;
  value: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    name: string | null;
    email: string;
  };
  dealContacts: DealContact[];
  notes: Note[];
}

interface Note {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface TimelineItem {
  type: 'note' | 'message' | 'activity';
  id: string;
  timestamp: string;
  createdAt: string;
  content?: string;
  author?: {
    id: string;
    name: string | null;
    email: string;
  };
  contact?: {
    id: string;
    name: string | null;
    phoneNumber: string;
  };
  fromMe?: boolean;
  textContent?: string | null;
  hasMedia?: boolean;
  mediaType?: string | null;
  mediaCaption?: string | null;
  // Activity fields
  subject?: string;
  completed?: boolean;
  dueDate?: string | null;
  notes?: string | null;
  createdBy?: {
    id: string;
    name: string | null;
    email: string;
  };
  updatedAt?: string;
  // Deal info for activities
  deal?: {
    id: string;
    title: string;
    status: string;
  };
}

export default function DealDetailPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const params = useParams();
  const dealId = params?.id as string;

  const [deal, setDeal] = useState<Deal | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [activities, setActivities] = useState<TimelineItem[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddContactDialogOpen, setIsAddContactDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [selectedContactId, setSelectedContactId] = useState('');
  const [expandedMessages, setExpandedMessages] = useState<Record<string, boolean>>({});
  
  // Activity edit states
  const [isEditActivityDialogOpen, setIsEditActivityDialogOpen] = useState(false);
  const [isEditActivityCalendarOpen, setIsEditActivityCalendarOpen] = useState(false);
  const [isEditingActivity, setIsEditingActivity] = useState(false);
  const [editingActivity, setEditingActivity] = useState<TimelineItem | null>(null);
  const [editActivityFormData, setEditActivityFormData] = useState<{
    subject: string;
    dueDate: Date | undefined;
    notes: string;
    time: string;
  }>({
    subject: '',
    dueDate: undefined,
    notes: '',
    time: '09:00',
  });

  const timelineEndRef = useRef<HTMLDivElement>(null);

  // Form state for editing
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    value: '',
    status: 'open',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated' && dealId) {
      loadDeal();
      loadTimeline();
      loadActivities();
      loadContacts();
    }
  }, [status, router, dealId]);

  const loadDeal = async () => {
    try {
      const response = await fetch(`/api/deals/${dealId}`);
      if (response.ok) {
        const data = await response.json();
        setDeal(data.deal);
        setFormData({
          title: data.deal.title,
          description: data.deal.description || '',
          value: data.deal.value?.toString() || '',
          status: data.deal.status,
        });
      } else if (response.status === 404) {
        toast.error('Negócio não encontrado');
        router.push('/dashboard/negocios');
      } else {
        toast.error('Erro ao carregar negócio');
      }
    } catch (error) {
      console.error('Erro ao carregar negócio:', error);
      toast.error('Erro ao carregar negócio');
    }
  };

  const loadTimeline = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/deals/${dealId}/timeline`);
      if (response.ok) {
        const data = await response.json();
        setTimeline(data.timeline);
      } else {
        toast.error('Erro ao carregar timeline');
      }
    } catch (error) {
      console.error('Erro ao carregar timeline:', error);
      toast.error('Erro ao carregar timeline');
    } finally {
      setLoading(false);
    }
  };

  const loadActivities = async () => {
    try {
      const response = await fetch(`/api/deals/${dealId}/activities`);
      if (response.ok) {
        const data = await response.json();
        // Map activities to timeline format
        const mappedActivities = data.activities.map((activity: any) => ({
          id: activity.id,
          type: 'activity',
          subject: activity.subject,
          completed: activity.completed,
          dueDate: activity.dueDate,
          notes: activity.notes,
          createdBy: activity.createdBy,
          timestamp: activity.dueDate || activity.createdAt,
        }));
        setActivities(mappedActivities);
      } else {
        toast.error('Erro ao carregar atividades');
      }
    } catch (error) {
      console.error('Erro ao carregar atividades:', error);
      toast.error('Erro ao carregar atividades');
    }
  };

  const loadContacts = async () => {
    try {
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        const contactsList = data.conversations.map((conv: any) => conv.contact);
        setContacts(contactsList);
      }
    } catch (error) {
      console.error('Erro ao carregar contatos:', error);
    }
  };

  const handleUpdateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/deals/${dealId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Negócio atualizado com sucesso!');
        setIsEditDialogOpen(false);
        loadDeal();
        loadTimeline();
        loadActivities();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao atualizar negócio');
      }
    } catch (error) {
      console.error('Erro ao atualizar negócio:', error);
      toast.error('Erro ao atualizar negócio');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDeal = async () => {
    try {
      const response = await fetch(`/api/deals/${dealId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Negócio excluído com sucesso!');
        router.push('/dashboard/negocios');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao excluir negócio');
      }
    } catch (error) {
      console.error('Erro ao excluir negócio:', error);
      toast.error('Erro ao excluir negócio');
    }
  };

  const handleAddNote = async () => {
    if (!noteContent.trim()) {
      toast.error('Digite o conteúdo da nota');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/deals/${dealId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: noteContent }),
      });

      if (response.ok) {
        toast.success('Nota adicionada com sucesso!');
        setNoteContent('');
        loadDeal();
        loadTimeline();
        loadActivities();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao adicionar nota');
      }
    } catch (error) {
      console.error('Erro ao adicionar nota:', error);
      toast.error('Erro ao adicionar nota');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddContact = async () => {
    if (!selectedContactId) {
      toast.error('Selecione um contato');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/deals/${dealId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId: selectedContactId }),
      });

      if (response.ok) {
        toast.success('Contato vinculado com sucesso!');
        setIsAddContactDialogOpen(false);
        setSelectedContactId('');
        loadDeal();
        loadTimeline();
        loadActivities();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao vincular contato');
      }
    } catch (error) {
      console.error('Erro ao vincular contato:', error);
      toast.error('Erro ao vincular contato');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveContact = async (contactId: string) => {
    try {
      const response = await fetch(
        `/api/deals/${dealId}/contacts?contactId=${contactId}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        toast.success('Contato removido com sucesso!');
        loadDeal();
        loadTimeline();
        loadActivities();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao remover contato');
      }
    } catch (error) {
      console.error('Erro ao remover contato:', error);
      toast.error('Erro ao remover contato');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: any; icon: any }> = {
      open: {
        label: 'Aberto',
        variant: 'default',
        icon: <Clock className="h-3 w-3" />,
      },
      won: {
        label: 'Ganho',
        variant: 'default',
        icon: <TrendingUp className="h-3 w-3" />,
      },
      lost: {
        label: 'Perdido',
        variant: 'destructive',
        icon: <TrendingDown className="h-3 w-3" />,
      },
    };

    const config = statusConfig[status] || statusConfig.open;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const openEditActivityDialog = (activity: TimelineItem) => {
    if (activity.type !== 'activity') return;
    
    setEditingActivity(activity);
    
    // Parse date and time from dueDate
    let dateValue: Date | undefined = undefined;
    let timeValue = '09:00';
    
    if (activity.dueDate) {
      const date = new Date(activity.dueDate);
      dateValue = date;
      timeValue = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    
    setEditActivityFormData({
      subject: activity.subject || '',
      dueDate: dateValue,
      notes: activity.notes || '',
      time: timeValue,
    });
    setIsEditActivityDialogOpen(true);
  };

  const updateActivity = async () => {
    if (!editingActivity?.id || !editActivityFormData.subject) {
      toast.error('Assunto é obrigatório');
      return;
    }

    try {
      setIsEditingActivity(true);
      
      // Combinar data e hora
      let dueDateValue: Date | undefined = undefined;
      if (editActivityFormData.dueDate && editActivityFormData.time) {
        const [hours, minutes] = editActivityFormData.time.split(':');
        dueDateValue = new Date(editActivityFormData.dueDate);
        dueDateValue.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      } else if (editActivityFormData.dueDate) {
        dueDateValue = editActivityFormData.dueDate;
      }
      
      // Preparar dados para envio
      const dataToSend = {
        subject: editActivityFormData.subject,
        dueDate: dueDateValue ? dueDateValue.toISOString() : undefined,
        notes: editActivityFormData.notes || undefined,
      };
      
      const response = await fetch(`/api/activities/${editingActivity.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Atividade atualizada com sucesso!');
        setIsEditActivityDialogOpen(false);
        setEditingActivity(null);
        loadTimeline();
        loadActivities();
      } else {
        toast.error(data.error || 'Falha ao atualizar atividade');
      }
    } catch (error) {
      console.error('Error updating activity:', error);
      toast.error('Falha ao atualizar atividade');
    } finally {
      setIsEditingActivity(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const timeStr = date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    if (isToday) {
      return timeStr;
    } else if (isYesterday) {
      return `Ontem ${timeStr}`;
    } else {
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const getInitials = (name: string | null, email?: string) => {
    if (name) {
      const parts = name.split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const availableContacts = contacts.filter(
    (contact) =>
      !deal?.dealContacts.some((dc) => dc.contact.id === contact.id)
  );

  if (status === 'loading' || loading || !deal) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{deal.title}</h1>
            {getStatusBadge(deal.status)}
          </div>
          <p className="text-muted-foreground">
            Criado em {new Date(deal.createdAt).toLocaleDateString('pt-BR')}
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <form onSubmit={handleUpdateDeal}>
                <DialogHeader>
                  <DialogTitle>Editar Negócio</DialogTitle>
                  <DialogDescription>
                    Atualize as informações do negócio
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-title">Título *</Label>
                    <Input
                      id="edit-title"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-description">Descrição</Label>
                    <Textarea
                      id="edit-description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      rows={3}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-value">Valor (R$)</Label>
                    <Input
                      id="edit-value"
                      type="number"
                      step="0.01"
                      value={formData.value}
                      onChange={(e) =>
                        setFormData({ ...formData, value: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) =>
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Aberto</SelectItem>
                        <SelectItem value="won">Ganho</SelectItem>
                        <SelectItem value="lost">Perdido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir este negócio? Esta ação não pode ser
                  desfeita. Todas as notas vinculadas também serão excluídas.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteDeal}>
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Deal Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Negócio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {deal.description && (
                <div>
                  <p className="text-sm font-medium mb-1">Descrição</p>
                  <p className="text-muted-foreground">{deal.description}</p>
                </div>
              )}
              {deal.value && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <span className="text-2xl font-bold text-green-600">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(deal.value)}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                Responsável: {deal.owner.name || deal.owner.email}
              </div>
            </CardContent>
          </Card>

          {/* Add Note */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <StickyNote className="h-5 w-5" />
                Adicionar Nota
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Textarea
                  placeholder="Digite sua nota aqui..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  rows={3}
                  className="flex-1"
                />
              </div>
              <div className="flex justify-end mt-2">
                <Button
                  onClick={handleAddNote}
                  disabled={isSubmitting || !noteContent.trim()}
                  size="sm"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Adicionar Nota
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Timeline e Atividades */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico</CardTitle>
              <CardDescription>
                Acompanhe atividades, notas e mensagens
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="timeline" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="timeline" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Timeline Completa
                  </TabsTrigger>
                  <TabsTrigger value="activities" className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4" />
                    Atividades
                  </TabsTrigger>
                </TabsList>

                {/* Tab: Timeline Completa */}
                <TabsContent value="timeline" className="mt-6">
                  {timeline.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Nenhuma atividade ainda</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {timeline.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {item.type === 'note' ? (
                            <StickyNote className="h-5 w-5" />
                          ) : item.type === 'activity' ? (
                            <Clock className="h-5 w-5" />
                          ) : (
                            <MessageSquare className="h-5 w-5" />
                          )}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">
                            {item.type === 'note'
                              ? item.author?.name || item.author?.email
                              : item.type === 'activity'
                              ? item.createdBy?.name || item.createdBy?.email
                              : item.fromMe
                              ? 'Você'
                              : item.contact?.name || item.contact?.phoneNumber}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(item.timestamp)}
                          </span>
                        </div>
                        <Card className="bg-muted/50">
                          <CardContent className="p-3">
                            {item.type === 'note' ? (
                              <p className="text-sm whitespace-pre-wrap">{item.content}</p>
                            ) : item.type === 'activity' ? (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => openEditActivityDialog(item)}
                                    className={`text-sm font-medium text-left hover:underline ${item.completed ? 'line-through text-muted-foreground' : 'text-blue-600 hover:text-blue-700'}`}
                                  >
                                    {item.subject}
                                  </button>
                                  {item.completed ? (
                                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                      Concluída
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                                      Pendente
                                    </Badge>
                                  )}
                                </div>
                                {item.dueDate && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Calendar className="h-3 w-3" />
                                    Vencimento: {formatDate(item.dueDate)}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {item.textContent && (
                                  <p className="text-sm whitespace-pre-wrap">
                                    {item.textContent}
                                  </p>
                                )}
                                {item.hasMedia && (
                                  <div className="text-xs text-muted-foreground">
                                    📎 {item.mediaType}
                                    {item.mediaCaption && (
                                      <span> - {item.mediaCaption}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                      ))}
                      <div ref={timelineEndRef} />
                    </div>
                  )}
                </TabsContent>

                {/* Tab: Atividades */}
                <TabsContent value="activities" className="mt-6">
                  {activities.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Nenhuma atividade cadastrada</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activities.map((item) => (
                        <div key={item.id} className="flex gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              <Clock className="h-5 w-5" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">
                                {item.createdBy?.name || item.createdBy?.email}
                              </p>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(item.timestamp)}
                              </span>
                            </div>
                            <Card className="bg-muted/50">
                              <CardContent className="p-3">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => openEditActivityDialog(item)}
                                      className={`text-sm font-medium text-left hover:underline ${item.completed ? 'line-through text-muted-foreground' : 'text-blue-600 hover:text-blue-700'}`}
                                    >
                                      {item.subject}
                                    </button>
                                    {item.completed ? (
                                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                        Concluída
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                                        Pendente
                                      </Badge>
                                    )}
                                  </div>
                                  {item.dueDate && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                      <Calendar className="h-3 w-3" />
                                      Vencimento: {formatDate(item.dueDate)}
                                    </div>
                                  )}
                                  {item.notes && (
                                    <p className="text-sm text-muted-foreground mt-2">
                                      {item.notes}
                                    </p>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Contacts */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contatos
                </CardTitle>
                <Dialog
                  open={isAddContactDialogOpen}
                  onOpenChange={setIsAddContactDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adicionar Contato</DialogTitle>
                      <DialogDescription>
                        Vincule um contato existente a este negócio
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="contact-select">Selecione o Contato</Label>
                        <Select
                          value={selectedContactId}
                          onValueChange={setSelectedContactId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Escolha um contato" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableContacts.length === 0 ? (
                              <div className="p-2 text-sm text-muted-foreground">
                                Nenhum contato disponível
                              </div>
                            ) : (
                              availableContacts.map((contact) => (
                                <SelectItem key={contact.id} value={contact.id}>
                                  {contact.name || contact.phoneNumber}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAddContactDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleAddContact}
                        disabled={isSubmitting || !selectedContactId}
                      >
                        {isSubmitting ? 'Adicionando...' : 'Adicionar'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {deal.dealContacts.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Phone className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum contato vinculado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {deal.dealContacts.map((dc) => (
                    <div
                      key={dc.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {getInitials(dc.contact.name, dc.contact.phoneNumber)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">
                            {dc.contact.name || 'Sem nome'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {dc.contact.phoneNumber}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleRemoveContact(dc.contact.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Activity Dialog */}
      <Dialog open={isEditActivityDialogOpen} onOpenChange={setIsEditActivityDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Atividade</DialogTitle>
            <DialogDescription>
              Atualize as informações da atividade
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-activity-subject">Assunto *</Label>
              <Input
                id="edit-activity-subject"
                placeholder="Ex: Ligar para o cliente"
                value={editActivityFormData.subject}
                onChange={(e) => setEditActivityFormData({ ...editActivityFormData, subject: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data de Vencimento</Label>
                <Popover open={isEditActivityCalendarOpen} onOpenChange={setIsEditActivityCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {editActivityFormData.dueDate ? (
                        format(editActivityFormData.dueDate, "PPP", { locale: ptBR })
                      ) : (
                        <span>Selecione uma data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={editActivityFormData.dueDate}
                      onSelect={(date) => {
                        setEditActivityFormData({ ...editActivityFormData, dueDate: date });
                        setIsEditActivityCalendarOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-activity-time">Horário</Label>
                <Input
                  id="edit-activity-time"
                  type="time"
                  value={editActivityFormData.time}
                  onChange={(e) => setEditActivityFormData({ ...editActivityFormData, time: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-activity-notes">Observações</Label>
              <Textarea
                id="edit-activity-notes"
                placeholder="Adicione observações sobre esta atividade..."
                rows={4}
                value={editActivityFormData.notes}
                onChange={(e) => setEditActivityFormData({ ...editActivityFormData, notes: e.target.value })}
              />
            </div>
            <Button 
              onClick={updateActivity} 
              disabled={isEditingActivity}
              className="w-full"
            >
              {isEditingActivity ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
