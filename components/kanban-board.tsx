
'use client'

import { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Plus, 
  Clock, 
  FileCheck, 
  User, 
  Phone, 
  Mail,
  MessageCircle,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Save,
  X
} from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

interface Claim {
  id: string
  number: string
  type: string
  classification: 'VERDE' | 'AMARELO' | 'VERMELHO'
  column: string
  createdAt: string
  updatedAt: string
  portalToken: string
  insured: {
    id: string
    name: string
    phone: string
    email: string
    taxId?: string
  }
  documents: Array<{
    id: string
    item: string
    status: 'PENDENTE' | 'RECEBIDO'
  }>
  events: Array<{
    id: string
    channel: string
    direction: string
    template?: string
    content: string
    createdAt: string
  }>
}

interface ColumnCounts {
  NOVOS: number
  A_CONTACTAR: number
  AGUARDANDO: number
  CONCLUIDO: number
}

const COLUMNS = [
  { id: 'NOVOS', title: 'Novos', color: 'bg-blue-50 border-blue-200' },
  { id: 'A_CONTACTAR', title: 'A Contactar', color: 'bg-yellow-50 border-yellow-200' },
  { id: 'AGUARDANDO', title: 'Aguardando Resposta', color: 'bg-orange-50 border-orange-200' },
  { id: 'CONCLUIDO', title: 'Concluído', color: 'bg-green-50 border-green-200' },
]

export default function KanbanBoard() {
  const [claims, setClaims] = useState<Claim[]>([])
  const [counts, setCounts] = useState<ColumnCounts>({
    NOVOS: 0,
    A_CONTACTAR: 0,
    AGUARDANDO: 0,
    CONCLUIDO: 0
  })
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null)
  const [creating, setCreating] = useState(false)
  
  // Form state for new claim
  const [formData, setFormData] = useState({
    number: '',
    classification: '' as 'VERDE' | 'AMARELO' | 'VERMELHO' | '',
    insuredName: '',
    insuredPhone: '',
    insuredEmail: '',
    insuredTaxId: ''
  })

  const resetForm = () => {
    setFormData({
      number: '',
      classification: '',
      insuredName: '',
      insuredPhone: '',
      insuredEmail: '',
      insuredTaxId: ''
    })
  }

  const handleClaimClick = (claim: Claim, e: React.MouseEvent) => {
    // Don't open details if clicking on drag handle
    e.stopPropagation()
    setSelectedClaim(claim)
    setShowDetailsDialog(true)
  }

  const handleSendWhatsApp = async (claim: Claim) => {
    try {
      // WhatsApp template
      const portalUrl = `${window.location.origin}/portal/${claim.portalToken}`
      const message = `Olá ${claim.insured.name}! 👋

Seu sinistro ${claim.number} foi registrado com sucesso.

Para acompanhar o andamento e enviar documentos, acesse: ${portalUrl}

📋 Documentos necessários:
• CNH (Carteira de Habilitação)  
• Documento do Veículo
• Boletim de Ocorrência

Qualquer dúvida, responda esta mensagem.

CSI Seguros`

      // Format phone number for WhatsApp (remove spaces, dashes, parentheses)
      const cleanPhone = claim.insured.phone.replace(/[\s\-\(\)]/g, '')
      
      // Encode message for URL
      const encodedMessage = encodeURIComponent(message)
      
      // Create WhatsApp Web URL
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`
      
      console.log('Opening WhatsApp Web:', {
        phone: cleanPhone,
        url: whatsappUrl
      })
      
      // Open WhatsApp Web in new tab
      window.open(whatsappUrl, '_blank')
      
      // Register the event in the system
      const response = await fetch('/api/communication/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          claimId: claim.id,
          channel: 'WHATSAPP'
        }),
      })

      if (response.ok) {
        toast.success('Redirecionado para WhatsApp Web!')
        // Refresh claim data to show new event
        await fetchClaims()
      }
      
    } catch (error) {
      console.error('Error opening WhatsApp:', error)
      toast.error('Erro ao abrir WhatsApp')
    }
  }

  const handleSendEmail = async (claim: Claim) => {
    try {
      // Email template
      const portalUrl = `${window.location.origin}/portal/${claim.portalToken}`
      const subject = `Sinistro ${claim.number} - Documentos Pendentes`
      const body = `Prezado(a) ${claim.insured.name},

Informamos que seu sinistro ${claim.number} está aguardando a documentação necessária.

Acesse o portal do segurado para enviar os documentos:
${portalUrl}

Documentos pendentes serão listados no portal.

Atenciosamente,
CSI Seguros`

      // Create mailto URL
      const emailUrl = `mailto:${claim.insured.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
      
      console.log('Opening email client:', {
        email: claim.insured.email,
        subject,
        url: emailUrl
      })
      
      // Open email client
      window.location.href = emailUrl
      
      // Register the event in the system
      const response = await fetch('/api/communication/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          claimId: claim.id,
          channel: 'EMAIL'
        }),
      })

      if (response.ok) {
        toast.success('Cliente de e-mail aberto!')
        // Refresh claim data to show new event
        await fetchClaims()
      }
      
    } catch (error) {
      console.error('Error opening email:', error)
      toast.error('Erro ao abrir e-mail')
    }
  }

  const fetchClaims = async () => {
    try {
      const response = await fetch('/api/claims')
      if (response.ok) {
        const data = await response.json()
        setClaims(data)
        
        // Calculate counts
        const newCounts: ColumnCounts = {
          NOVOS: 0,
          A_CONTACTAR: 0,
          AGUARDANDO: 0,
          CONCLUIDO: 0
        }
        
        data.forEach((claim: Claim) => {
          if (claim.column in newCounts) {
            newCounts[claim.column as keyof ColumnCounts]++
          }
        })
        
        setCounts(newCounts)
      }
    } catch (error) {
      console.error('Error fetching claims:', error)
      toast.error('Erro ao carregar sinistros')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClaims()
  }, [])

  const handleCreateClaim = async () => {
    if (!formData.number || !formData.classification || !formData.insuredName || !formData.insuredPhone || !formData.insuredEmail) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    setCreating(true)

    try {
      const response = await fetch('/api/claims', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          number: formData.number,
          type: 'AUTO_SIMPLES',
          classification: formData.classification,
          insuredData: {
            name: formData.insuredName,
            phone: formData.insuredPhone,
            email: formData.insuredEmail,
            taxId: formData.insuredTaxId || null,
          }
        }),
      })

      if (response.ok) {
        toast.success('Sinistro criado com sucesso!')
        setShowCreateDialog(false)
        resetForm()
        await fetchClaims() // Refresh the board
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao criar sinistro')
      }
    } catch (error) {
      console.error('Error creating claim:', error)
      toast.error('Erro ao criar sinistro')
    } finally {
      setCreating(false)
    }
  }

  const generateClaimNumber = () => {
    const year = new Date().getFullYear()
    const randomNum = Math.floor(Math.random() * 9000) + 1000
    return `SIN${year}${randomNum}`
  }

  const handleDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result

    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return
    }

    const newColumn = destination.droppableId

    try {
      const response = await fetch(`/api/claims/${draggableId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ column: newColumn }),
      })

      if (response.status === 409) {
        toast.error('Limite de WIP atingido na coluna Aguardando Resposta')
        return
      }

      if (response.ok) {
        // Update local state
        setClaims(prevClaims => 
          prevClaims.map(claim => 
            claim.id === draggableId 
              ? { ...claim, column: newColumn }
              : claim
          )
        )
        
        // Update counts
        setCounts(prevCounts => ({
          ...prevCounts,
          [source.droppableId]: Math.max(0, prevCounts[source.droppableId as keyof ColumnCounts] - 1),
          [newColumn]: prevCounts[newColumn as keyof ColumnCounts] + 1,
        }))
        
        toast.success('Sinistro movido com sucesso')
      } else {
        toast.error('Erro ao mover sinistro')
      }
    } catch (error) {
      console.error('Error moving claim:', error)
      toast.error('Erro ao mover sinistro')
    }
  }

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'VERDE':
        return 'classification-verde'
      case 'AMARELO':
        return 'classification-amarelo'
      case 'VERMELHO':
        return 'classification-vermelho'
      default:
        return 'bg-gray-500 text-white'
    }
  }



  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-csi-blue"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="flex gap-4 items-center">
          {/* Filters removed - keeping just the view clean */}
        </div>
        
        <Button
          onClick={() => {
            setFormData(prev => ({ ...prev, number: generateClaimNumber() }))
            setShowCreateDialog(true)
          }}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Sinistro
        </Button>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {COLUMNS.map((column) => (
            <div key={column.id} className="space-y-4">
              <Card className={`${column.color} border-2`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-800">
                      {column.title}
                    </CardTitle>
                    <motion.div
                      key={counts[column.id as keyof ColumnCounts]}
                      className="count-animation bg-white rounded-full px-3 py-1 text-sm font-bold text-csi-blue-dark shadow"
                    >
                      {counts[column.id as keyof ColumnCounts]}
                    </motion.div>
                  </div>
                </CardHeader>
              </Card>

              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`space-y-3 min-h-[200px] p-2 rounded-lg transition-colors ${
                      snapshot.isDraggingOver ? 'bg-blue-50' : 'bg-transparent'
                    }`}
                  >
                    <AnimatePresence>
                      {claims
                        .filter(claim => claim.column === column.id)
                        .map((claim, index) => (
                          <Draggable
                            key={claim.id}
                            draggableId={claim.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`kanban-card cursor-pointer ${
                                  snapshot.isDragging ? 'shadow-xl scale-105' : ''
                                }`}
                                onClick={(e) => handleClaimClick(claim, e)}
                              >
                                <CardContent className="p-0">
                                  <div className="space-y-3">
                                    {/* Header */}
                                    <div className="flex items-start justify-between">
                                      <div>
                                        <h3 className="font-semibold text-gray-900">
                                          {claim.number}
                                        </h3>
                                        <p className="text-sm text-gray-600 flex items-center gap-1">
                                          <User className="w-3 h-3" />
                                          {claim.insured.name}
                                        </p>
                                      </div>
                                      <Badge className={`${getClassificationColor(claim.classification)} text-xs`}>
                                        {claim.classification}
                                      </Badge>
                                    </div>

                                    {/* Badges */}
                                    <div className="flex flex-wrap gap-1">
                                      <Badge variant="outline" className="text-xs">
                                        {claim.type}
                                      </Badge>
                                    </div>

                                    {/* Documents Status */}
                                    <div className="flex items-center justify-between w-full">
                                      <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <FileCheck className="w-3 h-3" />
                                        {claim.documents.filter(d => d.status === 'RECEBIDO').length}/
                                        {claim.documents.length} docs
                                      </div>
                                      
                                      {/* Communication indicators */}
                                      <div className="flex items-center gap-1">
                                        {claim.events?.some(e => e.channel === 'WHATSAPP' && e.direction === 'OUTBOUND') && (
                                          <div title="WhatsApp enviado">
                                            <MessageCircle className="w-3 h-3 text-green-600" />
                                          </div>
                                        )}
                                        {claim.events?.some(e => e.channel === 'EMAIL' && e.direction === 'OUTBOUND') && (
                                          <div title="E-mail enviado">
                                            <Mail className="w-3 h-3 text-blue-600" />
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </div>
                            )}
                          </Draggable>
                        ))}
                    </AnimatePresence>
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* Create Claim Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false)
          resetForm()
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Criar Novo Sinistro</DialogTitle>
            <DialogDescription>
              Preencha os dados do sinistro e do segurado
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Claim Data */}
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900">Dados do Sinistro</h4>
              
              <div className="space-y-2">
                <Label htmlFor="number">Número do Sinistro*</Label>
                <Input
                  id="number"
                  value={formData.number}
                  onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
                  placeholder="Ex: SIN2025001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="classification">Classificação*</Label>
                <Select 
                  value={formData.classification} 
                  onValueChange={(value: 'VERDE' | 'AMARELO' | 'VERMELHO') => 
                    setFormData(prev => ({ ...prev, classification: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a classificação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VERDE">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        Verde - Rotineiro
                      </div>
                    </SelectItem>
                    <SelectItem value="AMARELO">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        Amarelo - Atenção
                      </div>
                    </SelectItem>
                    <SelectItem value="VERMELHO">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        Vermelho - Urgente
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Insured Data */}
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900">Dados do Segurado</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="insuredName">Nome Completo*</Label>
                  <Input
                    id="insuredName"
                    value={formData.insuredName}
                    onChange={(e) => setFormData(prev => ({ ...prev, insuredName: e.target.value }))}
                    placeholder="Ex: João Silva Santos"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="insuredPhone">Telefone*</Label>
                  <Input
                    id="insuredPhone"
                    value={formData.insuredPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, insuredPhone: e.target.value }))}
                    placeholder="Ex: 5511987654321"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="insuredEmail">E-mail*</Label>
                <Input
                  id="insuredEmail"
                  type="email"
                  value={formData.insuredEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, insuredEmail: e.target.value }))}
                  placeholder="Ex: joao.silva@email.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="insuredTaxId">CPF/CNPJ (opcional)</Label>
                <Input
                  id="insuredTaxId"
                  value={formData.insuredTaxId}
                  onChange={(e) => setFormData(prev => ({ ...prev, insuredTaxId: e.target.value }))}
                  placeholder="Ex: 123.456.789-01"
                />
              </div>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                📋 <strong>Checklist padrão será criado:</strong> CNH, Documento do Veículo, BO (se houver)
              </p>
              <p className="text-sm text-blue-600 mt-1">
                🔗 Portal do segurado será gerado automaticamente
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false)
                resetForm()
              }}
              disabled={creating}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button
              onClick={handleCreateClaim}
              disabled={creating}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {creating ? 'Criando...' : 'Criar Sinistro'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Claim Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Sinistro</DialogTitle>
            <DialogDescription>
              Informações completas do sinistro {selectedClaim?.number}
            </DialogDescription>
          </DialogHeader>
          
          {selectedClaim && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Número</Label>
                  <p className="font-mono text-lg">{selectedClaim.number}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Tipo</Label>
                  <Badge variant="outline" className="mt-1">
                    {selectedClaim.type}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Classificação</Label>
                  <Badge className={`mt-1 ${getClassificationColor(selectedClaim.classification)}`}>
                    {selectedClaim.classification}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Status</Label>
                  <Badge variant="outline" className="mt-1">
                    {selectedClaim.column.replace('_', ' ')}
                  </Badge>
                </div>
              </div>

              {/* Insured Info */}
              <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Dados do Segurado
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Nome</Label>
                    <p className="font-medium">{selectedClaim.insured.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Email</Label>
                    <p className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {selectedClaim.insured.email}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Telefone</Label>
                    <p className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {selectedClaim.insured.phone}
                    </p>
                  </div>
                  {selectedClaim.insured.taxId && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">CPF/CNPJ</Label>
                      <p className="font-mono">{selectedClaim.insured.taxId}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Documents */}
              <div className="space-y-4 p-4 bg-orange-50 rounded-lg">
                <h4 className="font-semibold text-orange-900 flex items-center gap-2">
                  <FileCheck className="w-4 h-4" />
                  Documentos ({selectedClaim.documents.filter(d => d.status === 'RECEBIDO').length}/{selectedClaim.documents.length})
                </h4>
                <div className="grid gap-2">
                  {selectedClaim.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-white rounded border">
                      <div className="flex items-center gap-2">
                        {doc.status === 'RECEBIDO' ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Clock className="w-4 h-4 text-yellow-600" />
                        )}
                        <span className="font-medium">{doc.item.replace('_', ' ')}</span>
                      </div>
                      <Badge 
                        variant={doc.status === 'RECEBIDO' ? 'default' : 'secondary'}
                        className={doc.status === 'RECEBIDO' ? 'bg-green-100 text-green-800' : ''}
                      >
                        {doc.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-4 p-4 bg-purple-50 rounded-lg">
                <h4 className="font-semibold text-purple-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Histórico
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-white rounded border">
                    <span className="text-sm">Sinistro criado</span>
                    <span className="text-xs text-gray-500">
                      {new Date(selectedClaim.createdAt).toLocaleDateString('pt-BR')} às{' '}
                      {new Date(selectedClaim.createdAt).toLocaleTimeString('pt-BR')}
                    </span>
                  </div>
                  {selectedClaim.events && selectedClaim.events.length > 0 && (
                    selectedClaim.events.map((event, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white rounded border">
                        <div className="flex items-center gap-2">
                          {event.channel === 'WHATSAPP' ? (
                            <MessageCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <Mail className="w-4 h-4 text-blue-600" />
                          )}
                          <div>
                            <span className="text-sm font-medium">
                              {event.channel} {event.direction === 'OUTBOUND' ? 'enviado' : 'recebido'}
                            </span>
                            {event.template && (
                              <p className="text-xs text-gray-500">{event.template}</p>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(event.createdAt).toLocaleDateString('pt-BR')} às{' '}
                          {new Date(event.createdAt).toLocaleTimeString('pt-BR')}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Communication */}
              <div className="space-y-4 p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-900 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Comunicação
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => handleSendWhatsApp(selectedClaim)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    WhatsApp Web
                  </Button>
                  <Button
                    onClick={() => handleSendEmail(selectedClaim)}
                    variant="outline"
                    className="border-blue-200 hover:bg-blue-50"
                    size="sm"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Abrir E-mail
                  </Button>
                </div>
                <p className="text-xs text-green-700 mt-2">
                  💡 Clique para abrir WhatsApp Web ou cliente de e-mail com a mensagem pronta
                </p>
              </div>

              {/* Portal Token */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Token do Portal</Label>
                    <p className="font-mono text-sm text-gray-800">{selectedClaim.portalToken}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/portal/${selectedClaim.portalToken}`)
                      toast.success('Link do portal copiado!')
                    }}
                  >
                    Copiar Link
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDetailsDialog(false)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
