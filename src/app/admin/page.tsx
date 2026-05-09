'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Lock, LogOut, LayoutDashboard, Radio, Ticket, Settings, Play } from 'lucide-react'
import DashboardTab from '@/components/admin/DashboardTab'
import BroadcastTab from '@/components/admin/BroadcastTab'
import RaffleTab from '@/components/admin/RaffleTab'
import SettingsTab from '@/components/admin/SettingsTab'

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<{ id: string; email: string; name: string | null } | null>(null)
  const [needsSetup, setNeedsSetup] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')

  // Check for existing token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('tpk_admin_token')
    const savedUser = localStorage.getItem('tpk_admin_user')
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }
  }, [])

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error('Email y contraseña son requeridos')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (res.ok) {
        const data = await res.json()
        setToken(data.token)
        setUser(data.user)
        localStorage.setItem('tpk_admin_token', data.token)
        localStorage.setItem('tpk_admin_user', JSON.stringify(data.user))
        toast.success('Inicio de sesión exitoso')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Credenciales inválidas')
        // Check if no admin exists
        if (data.error?.includes('existe') || res.status === 401) {
          checkSetup()
        }
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleSetup = async () => {
    if (!email || !password) {
      toast.error('Email y contraseña son requeridos')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      })
      if (res.ok) {
        const data = await res.json()
        setToken(data.token)
        setUser(data.user)
        localStorage.setItem('tpk_admin_token', data.token)
        localStorage.setItem('tpk_admin_user', JSON.stringify(data.user))
        toast.success('¡Administrador creado exitosamente!')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error al crear administrador')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const checkSetup = useCallback(async () => {
    try {
      // Try setup endpoint to check if admin exists
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@test.com', password: 'testtest' }),
      })
      if (res.status === 403) {
        // Admin already exists
        setNeedsSetup(false)
      } else if (res.status === 400 || res.status === 200) {
        // No admin yet, show setup
        setNeedsSetup(true)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    checkSetup()
  }, [checkSetup])

  const handleLogout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('tpk_admin_token')
    localStorage.removeItem('tpk_admin_user')
    toast.info('Sesión cerrada')
  }

  // Login / Setup Screen
  if (!token) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Play className="w-8 h-8 text-white fill-white" />
            </div>
            <h1 className="text-3xl font-black text-white">
              TPK <span className="text-red-500">PLAY</span>
            </h1>
            <p className="text-zinc-400 mt-2">
              {needsSetup ? 'Configuración Inicial' : 'Panel de Administración'}
            </p>
          </div>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Lock className="w-5 h-5" />
                {needsSetup ? 'Crear Administrador' : 'Iniciar Sesión'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {needsSetup && (
                <div className="space-y-2">
                  <Label className="text-zinc-300">Nombre</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre"
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-zinc-300">Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@tpkplay.com"
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Contraseña</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={needsSetup ? 'Mínimo 8 caracteres' : '••••••••'}
                  className="bg-zinc-800 border-zinc-700 text-white"
                  onKeyDown={(e) => e.key === 'Enter' && (needsSetup ? handleSetup() : handleLogin())}
                />
              </div>
              <Button
                onClick={needsSetup ? handleSetup : handleLogin}
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white gap-2"
              >
                <Lock className="w-4 h-4" />
                {loading ? 'Cargando...' : needsSetup ? 'Crear Administrador' : 'Iniciar Sesión'}
              </Button>

              {!needsSetup && (
                <Button
                  onClick={checkSetup}
                  variant="ghost"
                  className="w-full text-zinc-400 hover:text-white"
                >
                  ¿Primera vez? Configurar administrador
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-red-600 rounded-lg flex items-center justify-center">
                <Play className="w-5 h-5 text-white fill-white" />
              </div>
              <div>
                <span className="text-xl font-black text-white">
                  TPK <span className="text-red-500">PLAY</span>
                </span>
                <span className="text-zinc-500 text-sm ml-2">Admin</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-zinc-400 text-sm hidden sm:block">
                {user?.email}
              </span>
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="text-zinc-400 hover:text-white gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:block">Salir</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-zinc-900 border border-zinc-800 mb-6 w-full sm:w-auto">
            <TabsTrigger value="dashboard" className="gap-2 data-[state=active]:bg-red-600 data-[state=active]:text-white">
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Panel</span>
            </TabsTrigger>
            <TabsTrigger value="broadcast" className="gap-2 data-[state=active]:bg-red-600 data-[state=active]:text-white">
              <Radio className="w-4 h-4" />
              <span className="hidden sm:inline">Transmisión</span>
            </TabsTrigger>
            <TabsTrigger value="raffle" className="gap-2 data-[state=active]:bg-red-600 data-[state=active]:text-white">
              <Ticket className="w-4 h-4" />
              <span className="hidden sm:inline">Rifas</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2 data-[state=active]:bg-red-600 data-[state=active]:text-white">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Config</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <DashboardTab />
          </TabsContent>
          <TabsContent value="broadcast">
            <BroadcastTab token={token} />
          </TabsContent>
          <TabsContent value="raffle">
            <RaffleTab token={token} />
          </TabsContent>
          <TabsContent value="settings">
            <SettingsTab token={token} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
