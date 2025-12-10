'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  DollarSign,
  GripVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface KanbanColumn {
  id: string;
  name: string;
  color: string;
  position: number;
  isDefault: boolean;
  _count?: {
    deals: number;
  };
}

interface Deal {
  id: string;
  title: string;
  description: string | null;
  value: number | null;
  status: string;
  kanbanColumnId: string | null;
  owner: {
    name: string | null;
    email: string;
  };
}

const DEFAULT_COLORS = [
  { name: 'Amarelo', value: '#FCD34D' },
  { name: 'Verde', value: '#4ADE80' },
  { name: 'Vermelho', value: '#F87171' },
  { name: 'Laranja', value: '#FB923C' },
  { name: 'Azul', value: '#60A5FA' },
  { name: 'Roxo', value: '#A78BFA' },
  { name: 'Rosa', value: '#F472B6' },
  { name: 'Cinza', value: '#9CA3AF' },
];

export default function KanbanPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();

  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Dialog states
  const [isAddColumnDialogOpen, setIsAddColumnDialogOpen] = useState(false);
  const [isEditColumnDialogOpen, setIsEditColumnDialogOpen] = useState(false);
  const [isDeleteColumnDialogOpen, setIsDeleteColumnDialogOpen] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<KanbanColumn | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [columnForm, setColumnForm] = useState({
    name: '',
    color: DEFAULT_COLORS[0].value,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      loadColumns();
      loadDeals();
    }
  }, [status, router]);

  const loadColumns = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/kanban/columns');
      if (response.ok) {
        const data = await response.json();
        setColumns(data.columns);
      } else {
        toast.error('Erro ao carregar colunas');
      }
    } catch (error) {
      console.error('Erro ao carregar colunas:', error);
      toast.error('Erro ao carregar colunas');
    } finally {
      setLoading(false);
    }
  };

  const loadDeals = async () => {
    try {
      const response = await fetch('/api/deals');
      if (response.ok) {
        const data = await response.json();
        setDeals(data.deals);
      } else {
        toast.error('Erro ao carregar negócios');
      }
    } catch (error) {
      console.error('Erro ao carregar negócios:', error);
      toast.error('Erro ao carregar negócios');
    }
  };

  const handleAddColumn = async () => {
    try {
      setIsSubmitting(true);

      if (!columnForm.name.trim()) {
        toast.error('Nome da coluna é obrigatório');
        return;
      }

      const response = await fetch('/api/kanban/columns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(columnForm),
      });

      if (response.ok) {
        toast.success('Coluna criada com sucesso!');
        setIsAddColumnDialogOpen(false);
        setColumnForm({ name: '', color: DEFAULT_COLORS[0].value });
        loadColumns();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao criar coluna');
      }
    } catch (error) {
      console.error('Erro ao criar coluna:', error);
      toast.error('Erro ao criar coluna');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditColumn = async () => {
    if (!selectedColumn) return;

    try {
      setIsSubmitting(true);

      if (!columnForm.name.trim()) {
        toast.error('Nome da coluna é obrigatório');
        return;
      }

      const response = await fetch(`/api/kanban/columns/${selectedColumn.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(columnForm),
      });

      if (response.ok) {
        toast.success('Coluna atualizada com sucesso!');
        setIsEditColumnDialogOpen(false);
        setSelectedColumn(null);
        setColumnForm({ name: '', color: DEFAULT_COLORS[0].value });
        loadColumns();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao atualizar coluna');
      }
    } catch (error) {
      console.error('Erro ao atualizar coluna:', error);
      toast.error('Erro ao atualizar coluna');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteColumn = async () => {
    if (!selectedColumn) return;

    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/kanban/columns/${selectedColumn.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Coluna excluída com sucesso!');
        setIsDeleteColumnDialogOpen(false);
        setSelectedColumn(null);
        loadColumns();
        loadDeals();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao excluir coluna');
      }
    } catch (error) {
      console.error('Erro ao excluir coluna:', error);
      toast.error('Erro ao excluir coluna');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const dealId = active.id as string;
    const newColumnId = over.id as string;

    // Optimistic update
    setDeals((prevDeals) =>
      prevDeals.map((deal) =>
        deal.id === dealId
          ? { ...deal, kanbanColumnId: newColumnId }
          : deal
      )
    );

    try {
      const response = await fetch(`/api/deals/${dealId}/move`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kanbanColumnId: newColumnId }),
      });

      if (!response.ok) {
        // Revert on error
        loadDeals();
        toast.error('Erro ao mover negócio');
      } else {
        toast.success('Negócio movido com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao mover negócio:', error);
      loadDeals();
      toast.error('Erro ao mover negócio');
    }
  };

  const openEditDialog = (column: KanbanColumn) => {
    setSelectedColumn(column);
    setColumnForm({ name: column.name, color: column.color });
    setIsEditColumnDialogOpen(true);
  };

  const openDeleteDialog = (column: KanbanColumn) => {
    setSelectedColumn(column);
    setIsDeleteColumnDialogOpen(true);
  };

  const getColumnDeals = (columnId: string) => {
    return deals.filter((deal) => deal.kanbanColumnId === columnId);
  };

  const activeDeal = activeId ? deals.find((d) => d.id === activeId) : null;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col p-8 overflow-hidden">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quadro Kanban</h1>
          <p className="text-muted-foreground">
            Gerencie seus negócios visualmente
          </p>
        </div>
        <Button
          onClick={() => {
            setColumnForm({ name: '', color: DEFAULT_COLORS[0].value });
            setIsAddColumnDialogOpen(true);
          }}
          disabled={columns.length >= 8}
        >
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Coluna {columns.length >= 8 && '(Máx. 8)'}
        </Button>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto overflow-y-hidden pb-6">
          <div className="flex gap-4 h-full min-w-max">
            {columns.map((column) => {
              const columnDeals = getColumnDeals(column.id);
              return (
                <DroppableColumn
                  key={column.id}
                  column={column}
                  deals={columnDeals}
                  onEdit={openEditDialog}
                  onDelete={openDeleteDialog}
                />
              );
            })}
          </div>
        </div>

        <DragOverlay>
          {activeDeal ? (
            <DealCardOverlay deal={activeDeal} />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Add Column Dialog */}
      <Dialog open={isAddColumnDialogOpen} onOpenChange={setIsAddColumnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Nova Coluna</DialogTitle>
            <DialogDescription>
              Crie uma nova coluna para organizar seus negócios.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Coluna</Label>
              <Input
                id="name"
                placeholder="Ex: Coluna 1, Prospecção, Negociação..."
                value={columnForm.name}
                onChange={(e) =>
                  setColumnForm({ ...columnForm, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Cor da Coluna</Label>
              <div className="grid grid-cols-4 gap-2">
                {DEFAULT_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={`h-12 rounded-md border-2 flex items-center justify-center transition-all ${
                      columnForm.color === color.value
                        ? 'border-primary scale-105'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() =>
                      setColumnForm({ ...columnForm, color: color.value })
                    }
                  >
                    {columnForm.color === color.value && (
                      <span className="text-white font-bold text-xl">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddColumnDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleAddColumn} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Coluna'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Column Dialog */}
      <Dialog open={isEditColumnDialogOpen} onOpenChange={setIsEditColumnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Coluna</DialogTitle>
            <DialogDescription>
              Atualize o nome e a cor da coluna.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome da Coluna</Label>
              <Input
                id="edit-name"
                placeholder="Nome da coluna"
                value={columnForm.name}
                onChange={(e) =>
                  setColumnForm({ ...columnForm, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Cor da Coluna</Label>
              <div className="grid grid-cols-4 gap-2">
                {DEFAULT_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={`h-12 rounded-md border-2 flex items-center justify-center transition-all ${
                      columnForm.color === color.value
                        ? 'border-primary scale-105'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() =>
                      setColumnForm({ ...columnForm, color: color.value })
                    }
                  >
                    {columnForm.color === color.value && (
                      <span className="text-white font-bold text-xl">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditColumnDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleEditColumn} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Column Dialog */}
      <AlertDialog
        open={isDeleteColumnDialogOpen}
        onOpenChange={setIsDeleteColumnDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Coluna</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a coluna &quot;{selectedColumn?.name}&quot;?
              Esta ação não pode ser desfeita.
              {selectedColumn?._count?.deals !== undefined &&
                selectedColumn._count.deals > 0 && (
                  <span className="block mt-2 text-destructive font-semibold">
                    Esta coluna possui {selectedColumn._count.deals} negócio(s).
                    Mova-os para outra coluna antes de excluir.
                  </span>
                )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteColumn}
              disabled={isSubmitting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Droppable Column Component
function DroppableColumn({
  column,
  deals,
  onEdit,
  onDelete,
}: {
  column: KanbanColumn;
  deals: Deal[];
  onEdit: (column: KanbanColumn) => void;
  onDelete: (column: KanbanColumn) => void;
}) {
  const { useDroppable } = require('@dnd-kit/core');
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`w-80 flex-shrink-0 flex flex-col transition-all ${
        isOver ? 'ring-2 ring-primary' : ''
      }`}
    >
      <Card className="h-full flex flex-col">
        <CardHeader
          className="pb-3"
          style={{
            backgroundColor: column.color + '20',
            borderBottom: `3px solid ${column.color}`,
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: column.color }}
              />
              <CardTitle className="text-lg">{column.name}</CardTitle>
              <Badge variant="secondary">{deals.length}</Badge>
              {column.isDefault && (
                <Badge variant="outline" className="text-xs">
                  Padrão
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onEdit(column)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              {!column.isDefault && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onDelete(column)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto pt-4 space-y-3">
          {deals.map((deal) => (
            <DroppableDealCard
              key={deal.id}
              deal={deal}
              columnColor={column.color}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// Droppable Deal Card Component
function DroppableDealCard({
  deal,
  columnColor,
}: {
  deal: Deal;
  columnColor: string;
}) {
  const { useDraggable, useDroppable } = require('@dnd-kit/core');
  const router = useRouter();

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: deal.id,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      className={`cursor-move ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <Card
        className="hover:shadow-md transition-shadow border-l-4"
        style={{ borderLeftColor: columnColor }}
        onClick={() => router.push(`/dashboard/negocios/${deal.id}`)}
      >
        <CardContent className="p-4">
          <div {...listeners} className="flex items-start gap-2 mb-2">
            <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <h4 className="font-semibold text-sm line-clamp-2 flex-1">
              {deal.title}
            </h4>
          </div>
          {deal.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {deal.description}
            </p>
          )}
          {deal.value && (
            <div className="flex items-center gap-1 text-sm font-medium text-green-600">
              <DollarSign className="h-4 w-4" />
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(deal.value)}
            </div>
          )}
          <div className="mt-2 text-xs text-muted-foreground">
            {deal.owner.name || deal.owner.email}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Deal Card Overlay for Drag
function DealCardOverlay({ deal }: { deal: Deal }) {
  return (
    <Card className="w-80 shadow-xl border-2 border-primary">
      <CardContent className="p-4">
        <div className="flex items-start gap-2 mb-2">
          <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <h4 className="font-semibold text-sm line-clamp-2 flex-1">
            {deal.title}
          </h4>
        </div>
        {deal.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {deal.description}
          </p>
        )}
        {deal.value && (
          <div className="flex items-center gap-1 text-sm font-medium text-green-600">
            <DollarSign className="h-4 w-4" />
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(deal.value)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
