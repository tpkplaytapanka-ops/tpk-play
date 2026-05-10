'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Radio, Tv, Music, Users, Wifi, WifiOff } from 'lucide-react'

interface BroadcastConfig {
  id: string
  channel: string
  sourceType: string
  sourceUrl: string | null
  isActive: boolean
  displayName: string | null
}

export default function DashboardTab() {
  const [configs, setConfigs] = useState<BroadcastConfig[]>([])
  const [loading, setLoading] = useState(true)

  const fetchConfigs = useCallback(async () => {
    try {
      const res = await fetch('/api/broadcast')
      if (res.ok) {
        const data = await res.json()
        setConfigs(data)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConfigs()
    const interval = setInterval(fetchConfigs, 30000)
    return () => clearInterval(interval)
  }, [fetchConfigs])

  const channelIcon = (channel: string) => {
    switch (channel) {
      case 'main': return <Radio className="w-5 h-5" />
      case 'tv1': return <Tv className="w-5 h-5" />
      case 'tv2': return <Tv className="w-5 h-5" />
      case 'radio': return <Radio className="w-5 h-5" />
      case 'music': return <Music className="w-5 h-5" />
      default: return <Radio className="w-5 h-5" />
    }
  }

  const activeCount = configs.filter(c => c.isActive).length

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="bg-zinc-900 border-zinc-800 animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-zinc-800 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-600/20 rounded-xl flex items-center justify-center">
              <Wifi className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{activeCount}</p>
              <p className="text-sm text-zinc-400">Canales Activos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-red-600/20 rounded-xl flex items-center justify-center">
              <WifiOff className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{configs.length - activeCount}</p>
              <p className="text-sm text-zinc-400">Canales Inactivos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center">
              <Tv className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{configs.filter(c => c.sourceType === 'hls' || c.sourceType === 'url').length}</p>
              <p className="text-sm text-zinc-400">Transmisiones HLS</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-600/20 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">0</p>
              <p className="text-sm text-zinc-400">Espectadores</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Channel Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {configs.map((config) => (
          <Card key={config.id} className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.isActive ? 'bg-red-600/20 text-red-500' : 'bg-zinc-700/30 text-zinc-500'}`}>
                    {channelIcon(config.channel)}
                  </div>
                  <div>
                    <CardTitle className="text-white text-base">
                      {config.displayName || config.channel}
                    </CardTitle>
                    <p className="text-xs text-zinc-500 uppercase">{config.channel}</p>
                  </div>
                </div>
                <Badge variant={config.isActive ? 'default' : 'secondary'} className={config.isActive ? 'bg-green-600 hover:bg-green-700' : ''}>
                  {config.isActive ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Tipo:</span>
                  <span className="text-zinc-200 uppercase font-medium">{config.sourceType}</span>
                </div>
                {config.sourceUrl && (
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">URL:</span>
                    <span className="text-zinc-300 truncate max-w-[180px]" title={config.sourceUrl}>
                      {config.sourceUrl.substring(0, 30)}...
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
