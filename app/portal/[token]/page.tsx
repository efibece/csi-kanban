
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Upload, 
  FileCheck, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Shield,
  User,
  FileText,
  Camera,
  X
} from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

interface ClaimData {
  id: string
  number: string
  type: string
  classification: string
  insured: {
    name: string
  }
  documents: Array<{
    id: string
    item: string
    status: 'PENDENTE' | 'RECEBIDO'
    note?: string
  }>
}

interface UploadingFile {
  item: string
  file: File
  progress: number
  status: 'uploading' | 'success' | 'error'
}

export default function PortalPage({ params }: { params: { token: string } }) {
  const [claimData, setClaimData] = useState<ClaimData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [dragOver, setDragOver] = useState(false)

  const fetchClaimData = async () => {
    try {
      const response = await fetch(`/api/portal/${params.token}`)
      if (response.ok) {
        const data = await response.json()
        setClaimData(data)
      } else if (response.status === 404) {
        setError('Link inválido ou expirado')
      } else {
        setError('Erro ao carregar dados do sinistro')
      }
    } catch (error) {
      console.error('Error fetching claim data:', error)
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClaimData()
  }, [params.token])

  const getDocumentIcon = (item: string) => {
    switch (item) {
      case 'CNH':
        return <User className="w-5 h-5" />
      case 'DOC_VEICULO':
        return <FileText className="w-5 h-5" />
      case 'BO':
        return <Camera className="w-5 h-5" />
      default:
        return <FileCheck className="w-5 h-5" />
    }
  }

  const getDocumentLabel = (item: string) => {
    switch (item) {
      case 'CNH':
        return 'CNH (Carteira de Habilitação)'
      case 'DOC_VEICULO':
        return 'Documento do Veículo'
      case 'BO':
        return 'BO (Boletim de Ocorrência)'
      default:
        return item
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

  const handleFileSelect = (item: string, files: FileList) => {
    const file = files[0]
    if (!file) return

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      toast.error('Arquivo muito grande. Limite de 10MB.')
      return
    }

    // Check file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não suportado. Use imagens, PDF ou documentos Word.')
      return
    }

    uploadFile(item, file)
  }

  const uploadFile = async (item: string, file: File) => {
    const uploadingFile: UploadingFile = {
      item,
      file,
      progress: 0,
      status: 'uploading'
    }

    setUploadingFiles(prev => [...prev, uploadingFile])

    try {
      const formData = new FormData()
      formData.append('item', item)
      formData.append('file', file)

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadingFiles(prev => 
          prev.map(f => 
            f.item === item && f.file === file
              ? { ...f, progress: Math.min(f.progress + Math.random() * 30, 90) }
              : f
          )
        )
      }, 500)

      const response = await fetch(`/api/portal/${params.token}/upload`, {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)

      if (response.ok) {
        const result = await response.json()
        
        setUploadingFiles(prev => 
          prev.map(f => 
            f.item === item && f.file === file
              ? { ...f, progress: 100, status: 'success' }
              : f
          )
        )

        toast.success(`${getDocumentLabel(item)} enviado com sucesso!`)
        
        // Remove from uploading list after animation
        setTimeout(() => {
          setUploadingFiles(prev => prev.filter(f => !(f.item === item && f.file === file)))
        }, 2000)

        // Refresh claim data
        await fetchClaimData()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao enviar arquivo')
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      setUploadingFiles(prev => 
        prev.map(f => 
          f.item === item && f.file === file
            ? { ...f, status: 'error' }
            : f
        )
      )
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar arquivo')
    }
  }

  const handleDrop = useCallback((e: React.DragEvent, item: string) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(item, files)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-csi-blue"></div>
      </div>
    )
  }

  if (error || !claimData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-xl text-red-600">Erro de Acesso</CardTitle>
            <CardDescription>
              {error || 'Não foi possível carregar os dados do sinistro'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Verifique se o link está correto ou entre em contato com a regulação.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const completedDocs = claimData.documents.filter(doc => doc.status === 'RECEBIDO').length
  const totalDocs = claimData.documents.length
  const progressPercentage = totalDocs > 0 ? (completedDocs / totalDocs) * 100 : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto max-w-4xl px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-csi-blue rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">CSI</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-csi-blue-dark">Portal do Segurado</h1>
              <p className="text-sm text-gray-600">
                Envio de documentos para regulação de sinistros
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-8">
        <div className="space-y-8">
          {/* Claim Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Sinistro {claimData.number}</CardTitle>
                  <CardDescription>
                    <span className="flex items-center gap-2 mt-1">
                      <User className="w-4 h-4" />
                      {claimData.insured.name}
                    </span>
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getClassificationColor(claimData.classification)}>
                    {claimData.classification}
                  </Badge>
                  <Badge variant="outline">
                    {claimData.type}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Progresso dos Documentos
                    </span>
                    <span className="text-sm text-gray-600">
                      {completedDocs} de {totalDocs} enviados
                    </span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>
                
                {progressPercentage === 100 && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 text-green-800 rounded-lg">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">
                      Todos os documentos foram enviados! Aguarde o retorno da regulação.
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Upload Files */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Documentos Necessários
              </CardTitle>
              <CardDescription>
                Clique ou arraste os arquivos para enviar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {claimData.documents.map((doc) => (
                  <motion.div
                    key={doc.id}
                    layout
                    className={`border-2 border-dashed rounded-lg p-6 transition-all ${
                      doc.status === 'RECEBIDO'
                        ? 'border-green-300 bg-green-50'
                        : dragOver
                        ? 'border-csi-blue bg-blue-50'
                        : 'border-gray-300 hover:border-csi-blue hover:bg-blue-50'
                    }`}
                    onDrop={(e) => handleDrop(e, doc.item)}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${
                          doc.status === 'RECEBIDO' 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {doc.status === 'RECEBIDO' ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            getDocumentIcon(doc.item)
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {getDocumentLabel(doc.item)}
                          </h3>
                          {doc.note && (
                            <p className="text-sm text-gray-600">{doc.note}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {doc.status === 'RECEBIDO' ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Recebido
                          </Badge>
                        ) : (
                          <>
                            <Badge variant="outline" className="text-orange-600 border-orange-300">
                              <Clock className="w-3 h-3 mr-1" />
                              Pendente
                            </Badge>
                            <input
                              type="file"
                              id={`file-${doc.item}`}
                              className="hidden"
                              accept="image/*,.pdf,.doc,.docx"
                              onChange={(e) => e.target.files && handleFileSelect(doc.item, e.target.files)}
                            />
                            <Button
                              size="sm"
                              onClick={() => document.getElementById(`file-${doc.item}`)?.click()}
                              className="bg-csi-blue hover:bg-csi-blue-dark"
                            >
                              <Upload className="w-3 h-3 mr-1" />
                              Enviar
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Uploading Files */}
          <AnimatePresence>
            {uploadingFiles.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Enviando Arquivos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {uploadingFiles.map((uploadingFile, index) => (
                        <motion.div
                          key={`${uploadingFile.item}-${index}`}
                          layout
                          className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                        >
                          <div className={`p-2 rounded ${
                            uploadingFile.status === 'success'
                              ? 'bg-green-100 text-green-600'
                              : uploadingFile.status === 'error'
                              ? 'bg-red-100 text-red-600'
                              : 'bg-blue-100 text-blue-600'
                          }`}>
                            {uploadingFile.status === 'success' ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : uploadingFile.status === 'error' ? (
                              <X className="w-4 h-4" />
                            ) : (
                              <Upload className="w-4 h-4" />
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {getDocumentLabel(uploadingFile.item)}
                            </p>
                            <p className="text-xs text-gray-600">
                              {uploadingFile.file.name} ({Math.round(uploadingFile.file.size / 1024)}KB)
                            </p>
                            
                            {uploadingFile.status === 'uploading' && (
                              <Progress value={uploadingFile.progress} className="h-1 mt-2" />
                            )}
                          </div>
                          
                          <div className="text-sm">
                            {uploadingFile.status === 'success' ? (
                              <span className="text-green-600 font-medium">Sucesso!</span>
                            ) : uploadingFile.status === 'error' ? (
                              <span className="text-red-600 font-medium">Erro</span>
                            ) : (
                              <span className="text-blue-600">{Math.round(uploadingFile.progress)}%</span>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Privacy Notice */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Política de Privacidade</p>
                  <p>
                    Os arquivos enviados serão utilizados exclusivamente para a regulação do seu sinistro 
                    e serão tratados com total confidencialidade conforme a LGPD.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
