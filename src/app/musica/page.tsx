'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AudioPlayer from '@/components/player/AudioPlayer'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Music, RefreshCw, Headphones, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface BroadcastConfig {
  channel: string
  sourceType: string
  sourceUrl: string | null
  isActive: boolean
  displayName: string | null
  category: string
  description: string | null
}

export default function MusicaPage() {
  const [config, setConfig] = useState<BroadcastConfig | null>(null)
  const [musicChannels, setMusicChannels] = useState<BroadcastConfig[]>([])
  const [loading, setLoading] = useState(true)
  const prevSourceRef = useRef<string | null>(null)

  const fetchConfig = useCallback(async () => {
    try {
      // Fetch main music channel
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
      // Fetch all music channels
      const allRes = await fetch('/api/broadcast')
      if (allRes.ok) {
        const allData = await allRes.json()
        setMusicChannels(allData.filter((c: BroadcastConfig) => c.category === 'music'))
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
            <h1 className="text-2xl md:text-3xl font-bold text-white">{config?.displayName || 'La Kalle'}</h1>
            {config?.isActive && (
              <Badge className="bg-orange-600 hover:bg-orange-700">EN VIVO</Badge>
            )}
          </div>
          <p className="text-zinc-400">{config?.description || 'Musica en vivo desde Colombia'}</p>
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
                  <div className="w-10 h-10 bg-orange-600/20 rounded-xl flex items-center justify-center">
                    <Music className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-medium">{config.displayName || 'La Kalle'}</h3>
                    <p className="text-zinc-500 text-sm">{config.description || 'Musica en vivo'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* More music stations */}
            {musicChannels.length > 1 && (
              <section className="mt-6">
                <h2 className="text-lg font-bold text-white mb-3">Mas Estaciones de Musica</h2>
                <div className="space-y-2">
                  {musicChannels.filter(c => c.channel !== 'music').map((station) => (
                    <Link key={station.channel} href={`/musica/${station.channel}`}>
                      <Card className="bg-zinc-900/30 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-orange-600/20 rounded-lg flex items-center justify-center">
                                <Headphones className="w-4 h-4 text-orange-500" />
                              </div>
                              <div>
                                <h4 className="text-white text-sm font-medium">{station.displayName}</h4>
                                <p className="text-zinc-500 text-xs">{station.description || 'Musica'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {station.isActive ? (
                                <Badge className="bg-orange-600/80 text-xs">EN VIVO</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">OFFLINE</Badge>
                              )}
                              <ChevronRight className="w-4 h-4 text-zinc-500" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className="w-full bg-zinc-900 rounded-xl p-12 flex flex-col items-center justify-center gap-4">
            <Music className="w-16 h-16 text-zinc-600" />
            <h2 className="text-xl font-bold text-zinc-400">Musica no disponible</h2>
            <p className="text-zinc-500">La senal de musica no esta disponible en este momento.</p>
            <Link href="/radio">
              <Button variant="outline" className="border-zinc-700 text-zinc-300 mt-2">
                Ver Todas las Estaciones
              </Button>
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
