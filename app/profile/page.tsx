

'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import Header from '@/components/header'
import { 
  User, 
  Mail, 
  Shield, 
  ShieldCheck
} from 'lucide-react'

export default function ProfilePage() {
  const { data: session, status } = useSession() || {}

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-csi-blue"></div>
      </div>
    )
  }

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      
      {/* Welcome Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto max-w-7xl px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Bem-vindo ao CSI Kanban! 👋
            </h1>
          </div>
        </div>
      </div>

      <main className="container mx-auto max-w-2xl px-4 py-8">
        <div className="flex justify-center">
          {/* Profile Information */}
          <Card className="shadow-lg w-full max-w-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Seu Perfil</CardTitle>
              <CardDescription>Informações da sua conta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <User className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Nome</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {session?.user?.name || 'Usuário'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-sm font-medium text-gray-700">E-mail</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {session?.user?.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                {session?.user?.isSupervisor ? (
                  <ShieldCheck className="w-5 h-5 text-green-600" />
                ) : (
                  <Shield className="w-5 h-5 text-blue-600" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-700">Perfil</p>
                  <div className="flex items-center gap-2">
                    <Badge 
                      className={session?.user?.isSupervisor ? 
                        'bg-green-100 text-green-800' : 
                        'bg-blue-100 text-blue-800'
                      }
                    >
                      {session?.user?.isSupervisor ? 'Supervisor' : 'Regulador'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
