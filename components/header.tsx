
'use client'

import { signOut, useSession } from 'next-auth/react'
import { Building2, LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import Link from 'next/link'

export default function Header() {
  const { data: session } = useSession()

  const handleLogout = async () => {
    // Use the current origin to ensure correct URL
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : 'https://csi-kanban-system.onrender.com'
    
    await signOut({ 
      callbackUrl: `${baseUrl}/login`,
      redirect: true 
    })
  }

  const getUserInitials = (email: string) => {
    return email.split('@')[0].slice(0, 2).toUpperCase()
  }

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
      <div className="container mx-auto max-w-7xl px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-csi-blue rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-csi-blue-dark">CSI Kanban</h1>
              <p className="text-sm text-gray-600">Regulação de sinistros</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <nav className="flex gap-4">
              <a 
                href="/board" 
                className="text-csi-blue hover:text-csi-blue-dark font-medium transition-colors"
              >
                Board (Em construção)
              </a>
            </nav>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-csi-blue text-white">
                      {session?.user?.email ? getUserInitials(session.user.email) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <Link href="/profile">
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <p className="text-sm font-medium leading-none">
                        {session?.user?.name || 'Usuário'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {session?.user?.email}
                      </p>
                    </div>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
