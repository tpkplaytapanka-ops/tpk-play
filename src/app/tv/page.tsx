'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import VideoPlayer from '@/components/player/VideoPlayer'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tv, Radio, Play, Smartphone, ChevronRight, RefreshCw, WifiOff } from 'lucide-react'

interface BroadcastConfig {
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

const categoryLabels: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  tv: { label: 'Television en Vivo', icon: Tv, color: 'text-emerald-500' },
  radio: { label: 'Radio en Vivo', icon: Radio, color: 'text-purple-500' },
  music: { label: 'Musica en Vivo', icon: Radio, color: 'text-orange-500' },
}

export default function TVGuidePage() {
  const [channels, setChannels] = useState<BroadcastConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedChannel, setSelectedChannel] = useState<BroadcastConfig | null>(null)
  const [activeTab, setActiveTab] = useState<string>('all')

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const res = await fetch('/api/broadcast')
        if (res.ok) {
          const data = await res.json()
          setChannels(data)
          // Auto-select first active TV channel
          const firstActive = data.find((c: BroadcastConfig) => c.isActive && c.category === 'tv')
          if (firstActive && !selectedChannel) {
            setSelectedChannel(firstActive)
          }
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetchChannels()
    const interval = setInterval(fetchChannels, 30000)
    return () => clearInterval(interval)
  }, [selectedChannel])

  const filteredChannels = activeTab === 'all'
    ? channels
    : channels.filter(c => c.category === activeTab)

  const tvChannels = channels.filter(c => c.category === 'tv')
  const radioChannels = channels.filter(c => c.category === 'radio')
  const musicChannels = channels.filter(c => c.category === 'music')

  const getChannelHref = (channel: string) => {
    const map: Record<string, string> = {
      main: '/tv/canal-en-vivo',
      tv1: '/tv/canal-1',
      tv2: '/tv/canal-2',
      tv3: '/tv/canal-3',
      tv4: '/tv/canal-4',
      radio: '/radio',
      radio2: '/radio/caracol',
      radio3: '/radio/wradio',
      music: '/musica',
      music2: '/musica/los40',
    }
    return map[channel] || `/tv/canal-en-vivo`
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl md:text-3xl font-bold text-white">Guia de Canales</h1>
            <Badge variant="outline" className="border-red-600/50 text-red-400">
              {channels.filter(c => c.isActive).length} EN VIVO
            </Badge>
          </div>
          <p className="text-zinc-400">Todos los canales de television, radio y musica en un solo lugar</p>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          <Button
            onClick={() => setActiveTab('all')}
            variant={activeTab === 'all' ? 'default' : 'outline'}
            size="sm"
            className={activeTab === 'all' ? 'bg-red-600 hover:bg-red-700' : 'border-zinc-700 text-zinc-400'}
          >
            Todos ({channels.length})
          </Button>
          <Button
            onClick={() => setActiveTab('tv')}
            variant={activeTab === 'tv' ? 'default' : 'outline'}
            size="sm"
            className={activeTab === 'tv' ? 'bg-emerald-600 hover:bg-emerald-700' : 'border-zinc-700 text-zinc-400'}
          >
            <Tv className="w-4 h-4 mr-1" /> TV ({tvChannels.length})
          </Button>
          <Button
            onClick={() => setActiveTab('radio')}
            variant={activeTab === 'radio' ? 'default' : 'outline'}
            size="sm"
            className={activeTab === 'radio' ? 'bg-purple-600 hover:bg-purple-700' : 'border-zinc-700 text-zinc-400'}
          >
            <Radio className="w-4 h-4 mr-1" /> Radio ({radioChannels.length})
          </Button>
          <Button
            onClick={() => setActiveTab('music')}
            variant={activeTab === 'music' ? 'default' : 'outline'}
            size="sm"
            className={activeTab === 'music' ? 'bg-orange-600 hover:bg-orange-700' : 'border-zinc-700 text-zinc-400'}
          >
            <Radio className="w-4 h-4 mr-1" /> Musica ({musicChannels.length})
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-48 bg-zinc-900/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredChannels.map((channel) => {
              const catInfo = categoryLabels[channel.category] || categoryLabels.tv
              const Icon = channel.sourceType === 'phone' ? Smartphone : catInfo.icon
              const href = getChannelHref(channel.channel)

              return (
                <Link key={channel.channel} href={href}>
                  <Card className="group bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 transition-all duration-300 cursor-pointer overflow-hidden h-full">
                    <CardContent className="p-0">
                      {/* Top color bar */}
                      <div className={`h-1.5 ${
                        channel.category === 'tv' ? 'bg-gradient-to-r from-emerald-600 to-emerald-800' :
                        channel.category === 'radio' ? 'bg-gradient-to-r from-purple-600 to-purple-800' :
                        'bg-gradient-to-r from-orange-600 to-orange-800'
                      }`} />

                      <div className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            channel.category === 'tv' ? 'bg-emerald-600/20' :
                            channel.category === 'radio' ? 'bg-purple-600/20' :
                            'bg-orange-600/20'
                          }`}>
                            <Icon className={`w-5 h-5 ${catInfo.color}`} />
                          </div>
                          {channel.isActive ? (
                            <span className="flex items-center gap-1.5 text-xs font-medium text-red-400 bg-red-600/10 px-2 py-1 rounded-full">
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                              </span>
                              EN VIVO
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-zinc-600 bg-zinc-800 px-2 py-1 rounded-full">
                              OFFLINE
                            </span>
                          )}
                        </div>

                        <h3 className="text-lg font-bold text-white group-hover:text-red-400 transition-colors">
                          {channel.displayName || channel.channel}
                        </h3>
                        <p className="text-sm text-zinc-500 mt-1 line-clamp-2">
                          {channel.description || `${channel.category === 'tv' ? 'Canal de television' : channel.category === 'radio' ? 'Estacion de radio' : 'Musica en vivo'}`}
                        </p>

                        <div className="mt-4 flex items-center justify-between">
                          <Badge variant="outline" className="border-zinc-700 text-zinc-500 text-xs">
                            {channel.sourceType === 'phone' ? 'Telefono' : channel.sourceType.toUpperCase()}
                          </Badge>
                          <div className="flex items-center text-sm text-zinc-400 group-hover:text-red-400 transition-colors">
                            <span>{channel.isActive ? 'Ver ahora' : 'Ver canal'}</span>
                            <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}

        {/* Quick Broadcast Link */}
        <section className="mt-8">
          <Card className="bg-gradient-to-r from-red-950/30 to-zinc-900 border-red-900/30">
            <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-600/20 rounded-xl flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Transmite desde tu Telefono</h3>
                  <p className="text-zinc-400 text-sm">Usa la camara de tu celular para ir en vivo</p>
                </div>
              </div>
              <Link href="/stream/broadcast">
                <Button className="bg-red-600 hover:bg-red-700 text-white gap-2 whitespace-nowrap">
                  <Smartphone className="w-4 h-4" />
                  Ir en Vivo
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  )
}
