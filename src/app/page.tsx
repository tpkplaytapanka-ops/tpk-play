'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Play, Tv, Radio, Music, ChevronRight, Zap, Smartphone, Eye, Headphones, LayoutGrid } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ChannelConfig {
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

const iconMap: Record<string, React.ElementType> = {
  main: Zap,
  tv1: Tv,
  tv2: Tv,
  tv3: Tv,
  tv4: Tv,
  radio: Radio,
  radio2: Radio,
  radio3: Radio,
  music: Music,
  music2: Headphones,
}

const colorMap: Record<string, { gradient: string; bg: string; text: string }> = {
  main: { gradient: 'from-red-600 to-red-800', bg: 'bg-red-600/20', text: 'text-red-500' },
  tv1: { gradient: 'from-emerald-600 to-emerald-800', bg: 'bg-emerald-600/20', text: 'text-emerald-500' },
  tv2: { gradient: 'from-blue-600 to-blue-800', bg: 'bg-blue-600/20', text: 'text-blue-500' },
  tv3: { gradient: 'from-amber-600 to-amber-800', bg: 'bg-amber-600/20', text: 'text-amber-500' },
  tv4: { gradient: 'from-cyan-600 to-cyan-800', bg: 'bg-cyan-600/20', text: 'text-cyan-500' },
  radio: { gradient: 'from-purple-600 to-purple-800', bg: 'bg-purple-600/20', text: 'text-purple-500' },
  radio2: { gradient: 'from-indigo-600 to-indigo-800', bg: 'bg-indigo-600/20', text: 'text-indigo-500' },
  radio3: { gradient: 'from-yellow-600 to-yellow-800', bg: 'bg-yellow-600/20', text: 'text-yellow-500' },
  music: { gradient: 'from-orange-600 to-orange-800', bg: 'bg-orange-600/20', text: 'text-orange-500' },
  music2: { gradient: 'from-pink-600 to-pink-800', bg: 'bg-pink-600/20', text: 'text-pink-500' },
}

const hrefMap: Record<string, string> = {
  main: '/tv/canal-en-vivo',
  tv1: '/tv/canal-1',
  tv2: '/tv/canal-2',
  tv3: '/tv/canal-3',
  tv4: '/tv/canal-4',
  radio: '/radio',
  radio2: '/radio',
  radio3: '/radio',
  music: '/musica',
  music2: '/musica',
}

export default function HomePage() {
  const [channels, setChannels] = useState<ChannelConfig[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const res = await fetch('/api/broadcast')
        if (res.ok) {
          const data = await res.json()
          setChannels(data)
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
  }, [])

  const activeCount = channels.filter(c => c.isActive).length
  const tvChannels = channels.filter(c => c.category === 'tv')
  const radioChannels = channels.filter(c => c.category === 'radio')
  const musicChannels = channels.filter(c => c.category === 'music')

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-red-950/30 via-zinc-950 to-zinc-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(220,38,38,0.15),transparent_50%)]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-600/10 border border-red-600/20 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
              </span>
              <span className="text-red-400 text-sm font-medium">{activeCount} CANALES EN VIVO</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black tracking-tight">
              <span className="text-white">TPK</span>{' '}
              <span className="text-red-500">PLAY</span>
            </h1>

            <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto">
              Tu plataforma de streaming y entretenimiento. TV en vivo, radio, musica y transmision desde tu celular, directo desde Colombia.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/tv">
                <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white text-lg px-8 gap-2 h-14">
                  <LayoutGrid className="w-5 h-5" />
                  Guia de Canales
                </Button>
              </Link>
              <Link href="/tv/canal-en-vivo">
                <Button size="lg" variant="outline" className="border-zinc-700 text-white hover:bg-zinc-800 text-lg px-8 gap-2 h-14">
                  <Play className="w-5 h-5 fill-white" />
                  Canal en Vivo
                </Button>
              </Link>
              <Link href="/radio">
                <Button size="lg" variant="outline" className="border-zinc-700 text-white hover:bg-zinc-800 text-lg px-8 gap-2 h-14">
                  <Radio className="w-5 h-5" />
                  Radio
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* TV Channels */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Tv className="w-6 h-6 text-emerald-500" />
            <h2 className="text-2xl md:text-3xl font-bold text-white">Television en Vivo</h2>
          </div>
          <Link href="/tv">
            <Button variant="ghost" className="text-zinc-400 hover:text-white gap-1">
              Ver todos <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-zinc-900/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tvChannels.map((channel) => {
              const Icon = iconMap[channel.channel] || Tv
              const colors = colorMap[channel.channel] || colorMap.main
              const href = hrefMap[channel.channel] || `/tv/canal-en-vivo`

              return (
                <Link key={channel.channel} href={href}>
                  <Card className="group bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 transition-all duration-300 cursor-pointer overflow-hidden">
                    <CardContent className="p-0">
                      <div className={`h-2 bg-gradient-to-r ${colors.gradient}`} />
                      <div className="p-6">
                        <div className="flex items-start justify-between">
                          <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center`}>
                            {channel.sourceType === 'phone' ? (
                              <Smartphone className={`w-6 h-6 ${colors.text}`} />
                            ) : (
                              <Icon className={`w-6 h-6 ${colors.text}`} />
                            )}
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
                        <div className="mt-4">
                          <h3 className="text-lg font-bold text-white group-hover:text-red-400 transition-colors">
                            {channel.displayName || channel.channel}
                          </h3>
                          <p className="text-sm text-zinc-500 mt-1">{channel.description || 'Canal de television'}</p>
                        </div>
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
      </section>

      {/* Radio & Music Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Radio className="w-6 h-6 text-purple-500" />
            <h2 className="text-2xl md:text-3xl font-bold text-white">Radio y Musica</h2>
          </div>
          <Link href="/radio">
            <Button variant="ghost" className="text-zinc-400 hover:text-white gap-1">
              Ver todos <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-zinc-900/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...radioChannels, ...musicChannels].map((channel) => {
              const Icon = iconMap[channel.channel] || Radio
              const colors = colorMap[channel.channel] || colorMap.radio
              const href = hrefMap[channel.channel] || '/radio'

              return (
                <Link key={channel.channel} href={href}>
                  <Card className="group bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 transition-all duration-300 cursor-pointer overflow-hidden">
                    <CardContent className="p-0">
                      <div className={`h-1.5 bg-gradient-to-r ${colors.gradient}`} />
                      <div className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 ${colors.bg} rounded-xl flex items-center justify-center`}>
                            <Icon className={`w-5 h-5 ${colors.text}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-white group-hover:text-red-400 transition-colors truncate">
                              {channel.displayName || channel.channel}
                            </h3>
                            <p className="text-xs text-zinc-500 truncate">{channel.description || 'Radio'}</p>
                          </div>
                          {channel.isActive && (
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* Quick Broadcast Link */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">
        <Card className="bg-gradient-to-r from-red-950/30 to-zinc-900 border-red-900/30">
          <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-600/20 rounded-xl flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Transmite desde tu Telefono</h3>
                <p className="text-zinc-400 text-sm">Usa la camara de tu celular para ir en vivo al Canal Principal</p>
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

      {/* About Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <Card className="bg-gradient-to-br from-zinc-900 to-zinc-900/50 border-zinc-800">
          <CardContent className="p-8 md:p-12">
            <div className="max-w-2xl">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Entretenimiento sin limites
              </h2>
              <p className="text-zinc-400 text-lg leading-relaxed">
                TPK PLAY te lleva lo mejor de la television colombiana, radio y musica en vivo.
                Disfruta de Senal Colombia, Canal Institucional, Citytv, Blue Radio, Caracol Radio, W Radio,
                La Kalle, Los 40 y transmiti desde tu telefono, todo desde una sola plataforma.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm text-zinc-300">
                  <Zap className="w-4 h-4 text-red-500" />
                  Stream en vivo 24/7
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-300">
                  <Tv className="w-4 h-4 text-red-500" />
                  Canales colombianos
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-300">
                  <Radio className="w-4 h-4 text-red-500" />
                  Radio en tiempo real
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-300">
                  <Smartphone className="w-4 h-4 text-red-500" />
                  Transmite desde tu celular
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <Footer />
    </div>
  )
}
