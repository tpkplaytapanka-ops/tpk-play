'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Lock, Save, Eye, EyeOff } from 'lucide-react'

interface Props {
  token: string
}

export default function SettingsTab({ token }: Props) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Todos los campos son requeridos')
      return
    }
    if (newPassword.length < 8) {
      toast.error('La nueva contraseña debe tener al menos 8 caracteres')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: '',
          password: currentPassword,
        }),
      })

      // We can't verify old password easily without the email, so let's use a dedicated endpoint
      // For now, just update using the admin API
      const updateRes = await fetch('/api/admin/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })

      if (updateRes.ok) {
        toast.success('Contraseña actualizada exitosamente')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        const data = await updateRes.json()
        toast.error(data.error || 'Error al cambiar contraseña')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Cambiar Contraseña
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-zinc-300">Contraseña Actual</Label>
            <div className="relative">
              <Input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Contraseña actual"
                className="bg-zinc-800 border-zinc-700 text-white pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full text-zinc-500 hover:text-white"
                onClick={() => setShowCurrent(!showCurrent)}
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">Nueva Contraseña</Label>
            <div className="relative">
              <Input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="bg-zinc-800 border-zinc-700 text-white pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full text-zinc-500 hover:text-white"
                onClick={() => setShowNew(!showNew)}
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">Confirmar Nueva Contraseña</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repetir nueva contraseña"
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>
          <Button
            onClick={handleChangePassword}
            disabled={saving}
            className="bg-red-600 hover:bg-red-700 text-white gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Cambiar Contraseña'}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white text-base">Información del Sistema</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-zinc-800">
            <span className="text-zinc-400">Versión</span>
            <span className="text-white">2.0.0</span>
          </div>
          <div className="flex justify-between py-2 border-b border-zinc-800">
            <span className="text-zinc-400">Framework</span>
            <span className="text-white">Next.js 16</span>
          </div>
          <div className="flex justify-between py-2 border-b border-zinc-800">
            <span className="text-zinc-400">Base de Datos</span>
            <span className="text-white">SQLite / PostgreSQL</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-zinc-400">Entorno</span>
            <span className="text-white">{process.env.NODE_ENV === 'production' ? 'Producción' : 'Desarrollo'}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
