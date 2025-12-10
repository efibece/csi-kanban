
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Users, Smartphone, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (status === 'authenticated') {
    return null; // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <MessageSquare className="h-16 w-16 text-green-600 mr-4" />
            <h1 className="text-5xl font-bold text-gray-900">
              <span className="text-green-600">CSI Kanban</span>
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Transforme seu WhatsApp em uma poderosa ferramenta de gestão de vendas e relacionamento
          </p>
          <div className="mt-8 space-x-4">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-green-600 hover:bg-green-700">
                Começar Agora
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button size="lg" variant="outline">
                Entrar
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <MessageSquare className="h-12 w-12 mx-auto text-green-600 mb-4" />
              <CardTitle>Gestão de Mensagens</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Capture e organize todas as suas conversas do WhatsApp em um só lugar
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="h-12 w-12 mx-auto text-blue-600 mb-4" />
              <CardTitle>Organização de Contatos</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Gerencie todos os seus contatos com histórico detalhado de conversas
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Smartphone className="h-12 w-12 mx-auto text-purple-600 mb-4" />
              <CardTitle>Múltiplas Sessões</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Conecte até 3 contas do WhatsApp simultaneamente
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <BarChart3 className="h-12 w-12 mx-auto text-orange-600 mb-4" />
              <CardTitle>Análise e Exportação</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Exporte conversas e acompanhe padrões de comunicação
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
