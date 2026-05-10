'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Save, Power, PowerOff, Eye, Plus, Trash2 } from 'lucide-react'

interface BroadcastConfig {
  id: string
  channel: string
  sourceType: string
  sourceUrl: string | null
  isActive: boolean
  displayName: string | null
  category: string
  description: string | null
  thumbnailUrl: string | null
  sortOrder: number
}

const SOURCE_TYPES = [
  { value: 'phone', label: 'Telefono' },
  { value: 'url', label: 'URL Directa' },
  { value: 'hls', label: 'HLS (.m3u8)' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'twitch', label: 'Twitch' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'audio', label: 'Audio' },
]

const CATEGORIES = [
  { value: 'tv', label: 'Television' },
  { value: 'radio', label: 'Radio' },
  { value: 'music', label: 'Musica' },
]

interface Props {
  token: string
}

export default function BroadcastTab({ token }: Props) {
  const [configs, setConfigs] = useState<BroadcastConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [showNewChannel, setShowNewChannel] = useState(false)
  const [newChannel, setNewChannel] = useState({ channel: '', displayName: '', sourceType: 'hls', sourceUrl: '', category: 'tv', description: '' })
  const [editValues, setEditValues] = useState<Record<string, { sourceType: string; sourceUrl: string; displayName: string; isActive: boolean; category: string; description: string; thumbnailUrl: string; sortOrder: number }>>({})

  const fetchConfigs = useCallback(async () => {
    try {
      const res = await fetch('/api/broadcast')
      if (res.ok) {
        const data = await res.json()
        setConfigs(data)
        const vals: Record<string, any> = {}
        data.forEach((c: BroadcastConfig) => {
          vals[c.channel] = {
            sourceType: c.sourceType,
            sourceUrl: c.sourceUrl || '',
            displayName: c.displayName || '',
            isActive: c.isActive,
            category: c.category || 'tv',
            description: c.description || '',
            thumbnailUrl: c.thumbnailUrl || '',
            sortOrder: c.sortOrder || 0,
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
          category: vals.category,
          description: vals.description || null,
          thumbnailUrl: vals.thumbnailUrl || null,
          sortOrder: vals.sortOrder,
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
      toast.error('Error de conexion')
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

  const handleCreateChannel = async () => {
    if (!newChannel.channel || !newChannel.displayName) {
      toast.error('El ID del canal y el nombre son requeridos')
      return
    }

    setSaving('new')
    try {
      const res = await fetch('/api/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          channel: newChannel.channel,
          sourceType: newChannel.sourceType,
          sourceUrl: newChannel.sourceUrl || null,
          displayName: newChannel.displayName,
          category: newChannel.category,
          description: newChannel.description || null,
          isActive: false,
        }),
      })

      if (res.ok) {
        toast.success(`Canal ${newChannel.channel} creado`)
        setShowNewChannel(false)
        setNewChannel({ channel: '', displayName: '', sourceType: 'hls', sourceUrl: '', category: 'tv', description: '' })
        await fetchConfigs()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error al crear canal')
      }
    } catch {
      toast.error('Error de conexion')
    } finally {
      setSaving(null)
    }
  }

  const handleDeleteChannel = async (channel: string) => {
    if (!confirm(`Eliminar canal ${channel}?`)) return

    try {
      const res = await fetch(`/api/broadcast?channel=${channel}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        toast.success(`Canal ${channel} eliminado`)
        await fetchConfigs()
      } else {
        toast.error('Error al eliminar canal')
      }
    } catch {
      toast.error('Error de conexion')
    }
  }

  const updateEditValue = (channel: string, field: string, value: string | boolean | number) => {
    setEditValues(prev => ({
      ...prev,
      [channel]: { ...prev[channel], [field]: value },
    }))
  }

  // Group channels by category
  const tvConfigs = configs.filter(c => c.category === 'tv')
  const radioConfigs = configs.filter(c => c.category === 'radio')
  const musicConfigs = configs.filter(c => c.category === 'music')

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

  const renderChannelCard = (config: BroadcastConfig) => {
    const vals = editValues[config.channel]
    if (!vals) return null

    return (
      <Card key={config.channel} className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-lg">{config.displayName || config.channel}</CardTitle>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="border-zinc-700 text-zinc-500 text-xs">
                {config.channel}
              </Badge>
              <Badge variant={vals.isActive ? 'default' : 'secondary'} className={vals.isActive ? 'bg-green-600' : ''}>
                {vals.isActive ? 'Activo' : 'Inactivo'}
              </Badge>
              <div className="flex items-center gap-2">
                <Switch
                  checked={vals.isActive}
                  onCheckedChange={(checked) => handleToggle(config.channel, checked)}
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
                onValueChange={(v) => updateEditValue(config.channel, 'sourceType', v)}
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
              <Label className="text-zinc-300">Categoria</Label>
              <Select
                value={vals.category}
                onValueChange={(v) => updateEditValue(config.channel, 'category', v)}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Nombre Visible</Label>
              <Input
                value={vals.displayName}
                onChange={(e) => updateEditValue(config.channel, 'displayName', e.target.value)}
                placeholder="Nombre del canal"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Orden</Label>
              <Input
                type="number"
                value={vals.sortOrder}
                onChange={(e) => updateEditValue(config.channel, 'sortOrder', parseInt(e.target.value) || 0)}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">Descripcion</Label>
            <Textarea
              value={vals.description}
              onChange={(e) => updateEditValue(config.channel, 'description', e.target.value)}
              placeholder="Descripcion del canal"
              className="bg-zinc-800 border-zinc-700 text-white min-h-[60px]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">URL de Fuente</Label>
            <div className="flex gap-2">
              <Input
                value={vals.sourceUrl}
                onChange={(e) => updateEditValue(config.channel, 'sourceUrl', e.target.value)}
                placeholder={
                  vals.sourceType === 'phone' ? 'Transmision desde telefono (no requiere URL)' :
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

          <div className="flex justify-between">
            <Button
              onClick={() => handleDeleteChannel(config.channel)}
              variant="ghost"
              size="sm"
              className="text-red-400 hover:text-red-300 hover:bg-red-900/20 gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Eliminar
            </Button>
            <Button
              onClick={() => handleSave(config.channel)}
              disabled={saving === config.channel}
              className="bg-red-600 hover:bg-red-700 text-white gap-2"
            >
              <Save className="w-4 h-4" />
              {saving === config.channel ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Add New Channel Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => setShowNewChannel(!showNewChannel)}
          variant="outline"
          className="border-zinc-700 text-zinc-300 gap-2"
        >
          <Plus className="w-4 h-4" />
          Agregar Canal
        </Button>
      </div>

      {/* New Channel Form */}
      {showNewChannel && (
        <Card className="bg-zinc-900 border-green-600/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">Nuevo Canal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">ID del Canal (unico)</Label>
                <Input
                  value={newChannel.channel}
                  onChange={(e) => setNewChannel(prev => ({ ...prev, channel: e.target.value.replace(/[^a-z0-9]/g, '') }))}
                  placeholder="ej: tv5, radio4"
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Nombre Visible</Label>
                <Input
                  value={newChannel.displayName}
                  onChange={(e) => setNewChannel(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="Nombre del canal"
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">Tipo de Fuente</Label>
                <Select
                  value={newChannel.sourceType}
                  onValueChange={(v) => setNewChannel(prev => ({ ...prev, sourceType: v }))}
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
                <Label className="text-zinc-300">Categoria</Label>
                <Select
                  value={newChannel.category}
                  onValueChange={(v) => setNewChannel(prev => ({ ...prev, category: v }))}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">URL de Fuente</Label>
                <Input
                  value={newChannel.sourceUrl}
                  onChange={(e) => setNewChannel(prev => ({ ...prev, sourceUrl: e.target.value }))}
                  placeholder="URL del stream"
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Descripcion</Label>
              <Input
                value={newChannel.description}
                onChange={(e) => setNewChannel(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descripcion del canal"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => setShowNewChannel(false)}
                variant="ghost"
                className="text-zinc-400"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateChannel}
                disabled={saving === 'new'}
                className="bg-green-600 hover:bg-green-700 text-white gap-2"
              >
                <Plus className="w-4 h-4" />
                {saving === 'new' ? 'Creando...' : 'Crear Canal'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TV Channels */}
      {tvConfigs.length > 0 && (
        <div>
          <h3 className="text-white font-semibold text-lg mb-3">Television ({tvConfigs.length})</h3>
          <div className="space-y-4">
            {tvConfigs.map(renderChannelCard)}
          </div>
        </div>
      )}

      {/* Radio Channels */}
      {radioConfigs.length > 0 && (
        <div>
          <h3 className="text-white font-semibold text-lg mb-3">Radio ({radioConfigs.length})</h3>
          <div className="space-y-4">
            {radioConfigs.map(renderChannelCard)}
          </div>
        </div>
      )}

      {/* Music Channels */}
      {musicConfigs.length > 0 && (
        <div>
          <h3 className="text-white font-semibold text-lg mb-3">Musica ({musicConfigs.length})</h3>
          <div className="space-y-4">
            {musicConfigs.map(renderChannelCard)}
          </div>
        </div>
      )}
    </div>
  )
}
