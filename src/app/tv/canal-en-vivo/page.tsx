'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import VideoPlayer from '@/components/player/VideoPlayer'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Radio, WifiOff, RefreshCw, Eye, Share2, Volume2, Smartphone } from 'lucide-react'

interface BroadcastConfig {
  channel: string
  sourceType: string
  sourceUrl: string | null
  isActive: boolean
  displayName: string | null
}

export default function CanalEnVivoPage() {
  const [config, setConfig] = useState<BroadcastConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewers, setViewers] = useState(0)
  const prevSourceRef = useRef<string | null>(null)

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/broadcast/main')
      if (res.ok) {
        const data = await res.json()
        if (prevSourceRef.current !== data.sourceUrl) {
          setConfig(data)
          prevSourceRef.current = data.sourceUrl
        } else {
          setConfig(data)
        }
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConfig()
    const interval = setInterval(fetchConfig, 15000)
    return () => clearInterval(interval)
  }, [fetchConfig])

  // Simulate viewer count based on stream activity
  useEffect(() => {
    if (config?.isActive) {
      setViewers(Math.floor(Math.random() * 50) + 10)
    } else {
      setViewers(0)
    }
  }, [config?.isActive])

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: 'TPK PLAY - Canal en Vivo', url })
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url)
    }
  }

  // Phone stream with actual HLS URL from MediaMTX
  const isPhoneStreamWithHLS = config?.sourceType === 'phone' && config?.isActive && config.sourceUrl?.endsWith('.m3u8')
  // Phone stream without HLS (no media server)
  const isPhoneStreamNoHLS = config?.sourceType === 'phone' && config?.isActive && (!config.sourceUrl || !config.sourceUrl.endsWith('.m3u8'))

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl md:text-3xl font-bold text-white">Canal en Vivo</h1>
            {config?.isActive && (
              <Badge className="bg-red-600 hover:bg-red-700 animate-pulse">
                EN VIVO
              </Badge>
            )}
          </div>
          <p className="text-zinc-400">Transmision principal de TPK PLAY</p>
        </div>

        {loading ? (
          <div className="w-full aspect-video bg-zinc-900 rounded-xl animate-pulse flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-zinc-600 animate-spin" />
          </div>
        ) : config?.isActive && (config.sourceUrl || isPhoneStreamNoHLS) ? (
          <div className="space-y-4">
            {/* Player */}
            {isPhoneStreamNoHLS ? (
              /* Phone stream without media server - show placeholder */
              <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative aspect-video bg-gradient-to-br from-zinc-900 via-red-950/20 to-zinc-900 flex flex-col items-center justify-center gap-4">
                    <div className="relative">
                      <div className="w-24 h-24 bg-red-600/20 rounded-full flex items-center justify-center">
                        <Smartphone className="w-12 h-12 text-red-500 animate-pulse" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center animate-pulse">
                        <span className="text-white text-[8px] font-bold">LIVE</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <h2 className="text-white text-xl font-bold">Transmision desde Telefono</h2>
                      <p className="text-zinc-400 mt-1">En vivo ahora</p>
                    </div>
                    <Badge className="bg-red-600 animate-pulse mt-2">
                      <Eye className="w-3 h-3 mr-1" /> {viewers} viendo
                    </Badge>
                    <p className="text-zinc-600 text-xs mt-2">El servidor de medios no esta configurado para reproduccion</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* Regular stream or phone stream with HLS - use VideoPlayer */
              <VideoPlayer
                sourceType={config.sourceType}
                sourceUrl={config.sourceUrl}
                displayName={config.displayName}
              />
            )}

            {/* Stream Info Bar */}
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-600/20 rounded-xl flex items-center justify-center">
                      {config.sourceType === 'phone' ? (
                        <Smartphone className="w-5 h-5 text-red-500" />
                      ) : (
                        <Radio className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-white font-medium">{config.displayName || 'Canal Principal'}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-zinc-500 text-sm">Fuente: {config.sourceType === 'phone' ? 'Telefono' : config.sourceType.toUpperCase()}</p>
                        {config.isActive && (
                          <span className="flex items-center gap-1 text-xs text-green-400">
                            <Volume2 className="w-3 h-3" /> Activo
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {config.isActive && (
                      <Badge variant="outline" className="border-zinc-700 text-zinc-400 gap-1">
                        <Eye className="w-3 h-3" /> {viewers}
                      </Badge>
                    )}
                    <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                      {config.sourceType === 'phone' ? 'TELEFONO' : config.sourceType.toUpperCase()}
                    </Badge>
                    <Button onClick={handleShare} variant="ghost" size="sm" className="text-zinc-400 hover:text-white gap-1">
                      <Share2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Compartir</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="w-full aspect-video bg-zinc-900 rounded-xl flex flex-col items-center justify-center gap-4">
            <WifiOff className="w-16 h-16 text-zinc-600" />
            <h2 className="text-xl font-bold text-zinc-400">Sin transmision activa</h2>
            <p className="text-zinc-500 text-center max-w-md">
              El canal principal no esta transmitiendo en este momento.
              Vuelve pronto o revisa los otros canales disponibles.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <a href="/tv">
                <Button variant="outline" className="border-zinc-700 text-zinc-300">
                  Ver Guia de TV
                </Button>
              </a>
              <a href="/radio">
                <Button variant="outline" className="border-zinc-700 text-zinc-300">
                  Escuchar Radio
                </Button>
              </a>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
