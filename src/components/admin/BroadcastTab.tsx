'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Save, Power, PowerOff, Eye } from 'lucide-react'

interface BroadcastConfig {
  id: string
  channel: string
  sourceType: string
  sourceUrl: string | null
  isActive: boolean
  displayName: string | null
}

const SOURCE_TYPES = [
  { value: 'phone', label: '📱 Teléfono' },
  { value: 'url', label: '🔗 URL Directa' },
  { value: 'hls', label: '📺 HLS (.m3u8)' },
  { value: 'youtube', label: '▶️ YouTube' },
  { value: 'facebook', label: '📘 Facebook' },
  { value: 'twitch', label: '🎮 Twitch' },
  { value: 'instagram', label: '📸 Instagram' },
  { value: 'audio', label: '🎵 Audio' },
]

const CHANNELS = [
  { value: 'main', label: 'Canal Principal (En Vivo)', defaultType: 'url' },
  { value: 'tv1', label: 'TV1 (Señal Colombia)', defaultType: 'hls' },
  { value: 'tv2', label: 'TV2 (Citytv)', defaultType: 'hls' },
  { value: 'radio', label: 'Radio (Blue Radio)', defaultType: 'audio' },
  { value: 'music', label: 'Música (La Kalle)', defaultType: 'audio' },
]

interface Props {
  token: string
}

export default function BroadcastTab({ token }: Props) {
  const [configs, setConfigs] = useState<BroadcastConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Record<string, { sourceType: string; sourceUrl: string; displayName: string; isActive: boolean }>>({})

  const fetchConfigs = useCallback(async () => {
    try {
      const res = await fetch('/api/broadcast')
      if (res.ok) {
        const data = await res.json()
        setConfigs(data)
        const vals: Record<string, { sourceType: string; sourceUrl: string; displayName: string; isActive: boolean }> = {}
        data.forEach((c: BroadcastConfig) => {
          vals[c.channel] = {
            sourceType: c.sourceType,
            sourceUrl: c.sourceUrl || '',
            displayName: c.displayName || '',
            isActive: c.isActive,
          }
        })
        setEditValues(vals)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConfigs()
  }, [fetchConfigs])

  const handleSave = async (channel: string) => {
    setSaving(channel)
    const vals = editValues[channel]
    if (!vals) return

    try {
      const res = await fetch('/api/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          channel,
          sourceType: vals.sourceType,
          sourceUrl: vals.sourceUrl || null,
          displayName: vals.displayName || null,
          isActive: vals.isActive,
        }),
      })

      if (res.ok) {
        toast.success(`Canal ${channel} actualizado`)
        await fetchConfigs()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error al guardar')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSaving(null)
    }
  }

  const handleToggle = async (channel: string, isActive: boolean) => {
    const vals = editValues[channel]
    if (!vals) return

    setEditValues(prev => ({
      ...prev,
      [channel]: { ...prev[channel], isActive },
    }))

    try {
      const res = await fetch('/api/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          channel,
          isActive,
        }),
      })

      if (res.ok) {
        toast.success(isActive ? `Canal ${channel} activado` : `Canal ${channel} desactivado`)
        await fetchConfigs()
      }
    } catch {
      toast.error('Error al cambiar estado')
    }
  }

  const updateEditValue = (channel: string, field: string, value: string | boolean) => {
    setEditValues(prev => ({
      ...prev,
      [channel]: { ...prev[channel], [field]: value },
    }))
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="bg-zinc-900 border-zinc-800 animate-pulse">
            <CardContent className="p-6">
              <div className="h-32 bg-zinc-800 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {CHANNELS.map(ch => {
        const config = configs.find(c => c.channel === ch.value)
        const vals = editValues[ch.value]
        if (!vals) return null

        return (
          <Card key={ch.value} className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-lg">{ch.label}</CardTitle>
                <div className="flex items-center gap-3">
                  <Badge variant={vals.isActive ? 'default' : 'secondary'} className={vals.isActive ? 'bg-green-600' : ''}>
                    {vals.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={vals.isActive}
                      onCheckedChange={(checked) => handleToggle(ch.value, checked)}
                    />
                    {vals.isActive ? (
                      <Power className="w-4 h-4 text-green-500" />
                    ) : (
                      <PowerOff className="w-4 h-4 text-zinc-500" />
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Tipo de Fuente</Label>
                  <Select
                    value={vals.sourceType}
                    onValueChange={(v) => updateEditValue(ch.value, 'sourceType', v)}
                  >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SOURCE_TYPES.map(st => (
                        <SelectItem key={st.value} value={st.value}>
                          {st.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-300">Nombre Visible</Label>
                  <Input
                    value={vals.displayName}
                    onChange={(e) => updateEditValue(ch.value, 'displayName', e.target.value)}
                    placeholder="Nombre del canal"
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">URL de Fuente</Label>
                <div className="flex gap-2">
                  <Input
                    value={vals.sourceUrl}
                    onChange={(e) => updateEditValue(ch.value, 'sourceUrl', e.target.value)}
                    placeholder={
                      vals.sourceType === 'phone' ? 'Transmisión desde teléfono (no requiere URL)' :
                      vals.sourceType === 'youtube' ? 'https://www.youtube.com/watch?v=...' :
                      vals.sourceType === 'facebook' ? 'https://www.facebook.com/.../video' :
                      vals.sourceType === 'twitch' ? 'https://www.twitch.tv/canal' :
                      'URL del stream'
                    }
                    className="bg-zinc-800 border-zinc-700 text-white"
                    disabled={vals.sourceType === 'phone'}
                  />
                  {vals.sourceUrl && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-zinc-400 hover:text-white shrink-0"
                      onClick={() => window.open(vals.sourceUrl, '_blank')}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => handleSave(ch.value)}
                  disabled={saving === ch.value}
                  className="bg-red-600 hover:bg-red-700 text-white gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving === ch.value ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>

              {/* Preview of current config */}
              {config && (
                <div className="mt-2 pt-3 border-t border-zinc-800">
                  <p className="text-xs text-zinc-500 mb-1">Configuración actual guardada:</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-xs">
                      {config.sourceType}
                    </Badge>
                    {config.sourceUrl && (
                      <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-xs truncate max-w-[200px]">
                        {config.sourceUrl}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
