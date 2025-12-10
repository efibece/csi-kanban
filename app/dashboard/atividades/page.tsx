
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Loader2,
  CheckCircle2,
  Circle,
  Calendar,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Deal {
  id: string;
  title: string;
  status: string;
}

interface Activity {
  id: string;
  subject: string;
  completed: boolean;
  dueDate: string | null;
  notes: string | null;
  createdAt: string;
  deal: {
    id: string;
    title: string;
    status: string;
  };
  createdBy: {
    id: string;
    name: string | null;
    email: string;
  };
}

type DateFilter = 'all' | 'today' | 'tomorrow' | 'week' | 'custom';

export default function AtividadesPage() {
  const { data: session } = useSession() || {};
  const [activities, setActivities] = useState<Activity[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Edit state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isEditCalendarOpen, setIsEditCalendarOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  // Filter state
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [customDateRange, setCustomDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [isDateRangeOpen, setIsDateRangeOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState<{
    subject: string;
    dealId: string;
    dueDate: Date | undefined;
    notes: string;
  }>({
    subject: '',
    dealId: '',
    dueDate: undefined,
    notes: '',
  });

  // Edit form state
  const [editFormData, setEditFormData] = useState<{
    subject: string;
    dealId: string;
    dueDate: Date | undefined;
    notes: string;
    time: string;
  }>({
    subject: '',
    dealId: '',
    dueDate: undefined,
    notes: '',
    time: '09:00',
  });

  const fetchActivities = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/activities');
      const data = await response.json();

      if (response.ok) {
        setActivities(data.activities || []);
      } else {
        toast.error(data.error || 'Falha ao buscar atividades');
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast.error('Falha ao carregar atividades');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDeals = async () => {
    try {
      const response = await fetch('/api/deals');
      const data = await response.json();

      if (response.ok) {
        setDeals(data.deals || []);
      }
    } catch (error) {
      console.error('Error fetching deals:', error);
    }
  };

  const createActivity = async () => {
    if (!formData.subject || !formData.dealId) {
      toast.error('Assunto e negócio são obrigatórios');
      return;
    }

    try {
      setIsCreating(true);
      
      // Preparar dados para envio
      const dataToSend = {
        subject: formData.subject,
        dealId: formData.dealId,
        dueDate: formData.dueDate ? formData.dueDate.toISOString() : undefined,
        notes: formData.notes || undefined,
      };
      
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Atividade criada com sucesso!');
        setFormData({ subject: '', dealId: '', dueDate: undefined, notes: '' });
        setIsDialogOpen(false);
        await fetchActivities();
      } else {
        toast.error(data.error || 'Falha ao criar atividade');
      }
    } catch (error) {
      console.error('Error creating activity:', error);
      toast.error('Falha ao criar atividade');
    } finally {
      setIsCreating(false);
    }
  };

  const toggleCompleted = async (activityId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/activities/${activityId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !currentStatus }),
      });

      if (response.ok) {
        toast.success(!currentStatus ? 'Atividade concluída!' : 'Atividade reaberta');
        await fetchActivities();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Falha ao atualizar atividade');
      }
    } catch (error) {
      console.error('Error toggling activity:', error);
      toast.error('Falha ao atualizar atividade');
    }
  };

  const deleteActivity = async (activityId: string, subject: string) => {
    if (!confirm(`Tem certeza que deseja excluir a atividade "${subject}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/activities/${activityId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Atividade excluída com sucesso');
        await fetchActivities();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Falha ao excluir atividade');
      }
    } catch (error) {
      console.error('Error deleting activity:', error);
      toast.error('Falha ao excluir atividade');
    }
  };

  const openEditDialog = (activity: Activity) => {
    setEditingActivity(activity);
    
    // Parse date and time from dueDate
    let dateValue: Date | undefined = undefined;
    let timeValue = '09:00';
    
    if (activity.dueDate) {
      const date = new Date(activity.dueDate);
      dateValue = date;
      timeValue = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    
    setEditFormData({
      subject: activity.subject,
      dealId: activity.deal.id,
      dueDate: dateValue,
      notes: activity.notes || '',
      time: timeValue,
    });
    setIsEditDialogOpen(true);
  };

  const updateActivity = async () => {
    if (!editingActivity || !editFormData.subject || !editFormData.dealId) {
      toast.error('Assunto e negócio são obrigatórios');
      return;
    }

    try {
      setIsEditing(true);
      
      // Combinar data e hora
      let dueDateValue: Date | undefined = undefined;
      if (editFormData.dueDate && editFormData.time) {
        const [hours, minutes] = editFormData.time.split(':');
        dueDateValue = new Date(editFormData.dueDate);
        dueDateValue.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      } else if (editFormData.dueDate) {
        dueDateValue = editFormData.dueDate;
      }
      
      // Preparar dados para envio
      const dataToSend = {
        subject: editFormData.subject,
        dealId: editFormData.dealId,
        dueDate: dueDateValue ? dueDateValue.toISOString() : undefined,
        notes: editFormData.notes || undefined,
      };
      
      const response = await fetch(`/api/activities/${editingActivity.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Atividade atualizada com sucesso!');
        setIsEditDialogOpen(false);
        setEditingActivity(null);
        await fetchActivities();
      } else {
        toast.error(data.error || 'Falha ao atualizar atividade');
      }
    } catch (error) {
      console.error('Error updating activity:', error);
      toast.error('Falha ao atualizar atividade');
    } finally {
      setIsEditing(false);
    }
  };

  useEffect(() => {
    if (session?.user?.workspaceId) {
      fetchActivities();
      fetchDeals();
    }
  }, [session]);

  if (!session?.user?.workspaceId) {
    return (
      <div className="max-w-7xl mx-auto">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Workspace Não Encontrado</h2>
            <p className="text-gray-600">
              Você precisa estar atribuído a um workspace para gerenciar atividades.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completedCount = activities.filter(a => a.completed).length;
  const pendingCount = activities.filter(a => !a.completed).length;
  const overdueCount = activities.filter(a => 
    !a.completed && a.dueDate && new Date(a.dueDate) < new Date()
  ).length;

  // Filter activities by date
  const filteredActivities = activities.filter(activity => {
    // Se o filtro for 'all', mostra todas as atividades
    if (dateFilter === 'all') return true;
    
    // Para outros filtros, precisa ter data
    if (!activity.dueDate) return false;
    
    const activityDate = new Date(activity.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (dateFilter) {
      case 'today': {
        const activityDay = new Date(activityDate);
        activityDay.setHours(0, 0, 0, 0);
        return activityDay.getTime() === today.getTime();
      }
      case 'tomorrow': {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const activityDay = new Date(activityDate);
        activityDay.setHours(0, 0, 0, 0);
        return activityDay.getTime() === tomorrow.getTime();
      }
      case 'week': {
        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() + 7);
        const activityDay = new Date(activityDate);
        activityDay.setHours(0, 0, 0, 0);
        return activityDay >= today && activityDay <= weekEnd;
      }
      case 'custom': {
        if (!customDateRange.from || !customDateRange.to) return true;
        const from = new Date(customDateRange.from);
        from.setHours(0, 0, 0, 0);
        const to = new Date(customDateRange.to);
        to.setHours(23, 59, 59, 999);
        const activityDay = new Date(activityDate);
        return activityDay >= from && activityDay <= to;
      }
      default:
        return true;
    }
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Atividades</h1>
          <p className="text-gray-600">
            Gerencie as atividades dos seus negócios
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={fetchActivities}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Atividade
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Atividade</DialogTitle>
                <DialogDescription>
                  Adicione uma nova atividade para um negócio
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Assunto *</Label>
                  <Input
                    id="subject"
                    placeholder="Ex: Ligar para cliente, Enviar proposta..."
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dealId">Negócio *</Label>
                  <Select
                    value={formData.dealId}
                    onValueChange={(value) => setFormData({ ...formData, dealId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um negócio" />
                    </SelectTrigger>
                    <SelectContent>
                      {deals.map((deal) => (
                        <SelectItem key={deal.id} value={deal.id}>
                          {deal.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Data de Vencimento</Label>
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {formData.dueDate ? (
                          format(formData.dueDate, "PPP", { locale: ptBR })
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={formData.dueDate}
                        onSelect={(date) => {
                          setFormData({ ...formData, dueDate: date });
                          setIsCalendarOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <Button 
                  onClick={createActivity} 
                  disabled={isCreating}
                  className="w-full"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    'Criar Atividade'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit Activity Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Editar Atividade</DialogTitle>
                <DialogDescription>
                  Atualize as informações da atividade
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-subject">Assunto *</Label>
                  <Input
                    id="edit-subject"
                    placeholder="Ex: Ligar para o cliente"
                    value={editFormData.subject}
                    onChange={(e) => setEditFormData({ ...editFormData, subject: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-dealId">Negócio *</Label>
                  <Select
                    value={editFormData.dealId}
                    onValueChange={(value) => setEditFormData({ ...editFormData, dealId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um negócio" />
                    </SelectTrigger>
                    <SelectContent>
                      {deals.map((deal) => (
                        <SelectItem key={deal.id} value={deal.id}>
                          {deal.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data de Vencimento</Label>
                    <Popover open={isEditCalendarOpen} onOpenChange={setIsEditCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {editFormData.dueDate ? (
                            format(editFormData.dueDate, "PPP", { locale: ptBR })
                          ) : (
                            <span>Selecione uma data</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={editFormData.dueDate}
                          onSelect={(date) => {
                            setEditFormData({ ...editFormData, dueDate: date });
                            setIsEditCalendarOpen(false);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-time">Horário</Label>
                    <Input
                      id="edit-time"
                      type="time"
                      value={editFormData.time}
                      onChange={(e) => setEditFormData({ ...editFormData, time: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-notes">Observações</Label>
                  <Textarea
                    id="edit-notes"
                    placeholder="Adicione observações sobre esta atividade..."
                    rows={4}
                    value={editFormData.notes}
                    onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  />
                </div>
                <Button 
                  onClick={updateActivity} 
                  disabled={isEditing}
                  className="w-full"
                >
                  {isEditing ? (
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
      </div>

      {/* Date Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtrar por Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={dateFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setDateFilter('all');
                setCustomDateRange({ from: undefined, to: undefined });
              }}
            >
              Todas
            </Button>
            <Button
              variant={dateFilter === 'today' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setDateFilter('today');
                setCustomDateRange({ from: undefined, to: undefined });
              }}
            >
              Hoje
            </Button>
            <Button
              variant={dateFilter === 'tomorrow' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setDateFilter('tomorrow');
                setCustomDateRange({ from: undefined, to: undefined });
              }}
            >
              Amanhã
            </Button>
            <Button
              variant={dateFilter === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setDateFilter('week');
                setCustomDateRange({ from: undefined, to: undefined });
              }}
            >
              Essa Semana
            </Button>
            <Popover open={isDateRangeOpen} onOpenChange={setIsDateRangeOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant={dateFilter === 'custom' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDateFilter('custom')}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {customDateRange.from && customDateRange.to ? (
                    <>
                      {format(customDateRange.from, 'dd/MM', { locale: ptBR })} -{' '}
                      {format(customDateRange.to, 'dd/MM', { locale: ptBR })}
                    </>
                  ) : (
                    'Selecionar Período'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-3 space-y-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Data Inicial</Label>
                    <CalendarComponent
                      mode="single"
                      selected={customDateRange.from}
                      onSelect={(date) => {
                        setCustomDateRange({ ...customDateRange, from: date });
                        if (date && customDateRange.to) {
                          setDateFilter('custom');
                        }
                      }}
                    />
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Data Final</Label>
                    <CalendarComponent
                      mode="single"
                      selected={customDateRange.to}
                      onSelect={(date) => {
                        setCustomDateRange({ ...customDateRange, to: date });
                        if (customDateRange.from && date) {
                          setDateFilter('custom');
                          setIsDateRangeOpen(false);
                        }
                      }}
                      disabled={(date) => {
                        if (!customDateRange.from) return false;
                        return date < customDateRange.from;
                      }}
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Circle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">
              Atividades não concluídas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
            <p className="text-xs text-muted-foreground">
              Atividades finalizadas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atrasadas</CardTitle>
            <Calendar className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overdueCount}</div>
            <p className="text-xs text-muted-foreground">
              Atividades vencidas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Activities Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Atividades</CardTitle>
          <CardDescription>
            Todas as atividades cadastradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {activities.length === 0 ? 'Nenhuma Atividade' : 'Nenhuma Atividade no Período'}
              </h3>
              <p className="text-gray-600 mb-6">
                {activities.length === 0 
                  ? 'Crie sua primeira atividade para começar'
                  : 'Não há atividades no período selecionado'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Status</TableHead>
                    <TableHead>Assunto</TableHead>
                    <TableHead>Negócio</TableHead>
                    <TableHead>Data de Vencimento</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActivities.map((activity) => {
                    const isOverdue = activity.dueDate && 
                      new Date(activity.dueDate) < new Date() && 
                      !activity.completed;
                    
                    return (
                      <TableRow key={activity.id}>
                        <TableCell>
                          <button
                            onClick={() => toggleCompleted(activity.id, activity.completed)}
                            className="focus:outline-none"
                          >
                            {activity.completed ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : (
                              <Circle className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                            )}
                          </button>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <button
                              onClick={() => openEditDialog(activity)}
                              className={`font-medium text-left hover:underline ${activity.completed ? 'line-through text-gray-500' : 'text-blue-600 hover:text-blue-700'}`}
                            >
                              {activity.subject}
                            </button>
                            <span className="text-xs text-gray-500">
                              Criado por {activity.createdBy.name || activity.createdBy.email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span>{activity.deal.title}</span>
                            <Badge variant="outline" className="text-xs">
                              {activity.deal.status === 'open' ? 'Aberto' : 
                               activity.deal.status === 'won' ? 'Ganho' : 'Perdido'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {activity.dueDate ? (
                            <div className="flex items-center space-x-2">
                              <Calendar className={`h-4 w-4 ${isOverdue ? 'text-red-600' : 'text-gray-400'}`} />
                              <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                                {format(new Date(activity.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
                              </span>
                              {isOverdue && (
                                <Badge variant="destructive" className="text-xs">
                                  Atrasada
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteActivity(activity.id, activity.subject)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
