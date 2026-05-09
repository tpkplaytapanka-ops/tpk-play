'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AudioPlayer from '@/components/player/AudioPlayer'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Music, RefreshCw } from 'lucide-react'

interface BroadcastConfig {
  id: string
  channel: string
  sourceType: string
  sourceUrl: string | null
  isActive: boolean
  displayName: string | null
}

export default function MusicaPage() {
  const [config, setConfig] = useState<BroadcastConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const prevSourceRef = useRef<string | null>(null)

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/broadcast/music')
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

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl md:text-3xl font-bold text-white">La Kalle</h1>
            {config?.isActive && (
              <Badge className="bg-orange-600 hover:bg-orange-700">EN VIVO</Badge>
            )}
          </div>
          <p className="text-zinc-400">Música en vivo desde Colombia</p>
        </div>

        {loading ? (
          <div className="w-full bg-zinc-900 rounded-xl p-12 flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-zinc-600 animate-spin" />
          </div>
        ) : config?.isActive && config.sourceUrl ? (
          <div className="space-y-4">
            <AudioPlayer
              sourceUrl={config.sourceUrl}
              displayName={config.displayName}
            />
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Music className="w-5 h-5 text-orange-500" />
                  <div>
                    <h3 className="text-white font-medium">{config.displayName || 'La Kalle'}</h3>
                    <p className="text-zinc-500 text-sm">Música en vivo</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="w-full bg-zinc-900 rounded-xl p-12 flex flex-col items-center justify-center gap-4">
            <Music className="w-16 h-16 text-zinc-600" />
            <h2 className="text-xl font-bold text-zinc-400">Música no disponible</h2>
            <p className="text-zinc-500">La señal de música no está disponible en este momento.</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
