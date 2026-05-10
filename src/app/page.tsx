'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Play, Tv, Radio, Music, ChevronRight, Zap, Smartphone, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ChannelConfig {
  channel: string
  sourceType: string
  sourceUrl: string | null
  isActive: boolean
  displayName: string | null
}

const iconMap: Record<string, React.ElementType> = {
  main: Zap,
  tv1: Tv,
  tv2: Tv,
  radio: Radio,
  music: Music,
}

const colorMap: Record<string, { gradient: string; bg: string; text: string }> = {
  main: { gradient: 'from-red-600 to-red-800', bg: 'bg-red-600/20', text: 'text-red-500' },
  tv1: { gradient: 'from-emerald-600 to-emerald-800', bg: 'bg-emerald-600/20', text: 'text-emerald-500' },
  tv2: { gradient: 'from-blue-600 to-blue-800', bg: 'bg-blue-600/20', text: 'text-blue-500' },
  radio: { gradient: 'from-purple-600 to-purple-800', bg: 'bg-purple-600/20', text: 'text-purple-500' },
  music: { gradient: 'from-orange-600 to-orange-800', bg: 'bg-orange-600/20', text: 'text-orange-500' },
}

const hrefMap: Record<string, string> = {
  main: '/tv/canal-en-vivo',
  tv1: '/tv/canal-1',
  tv2: '/tv/canal-2',
  radio: '/radio',
  music: '/musica',
}

const descriptionMap: Record<string, string> = {
  main: 'Transmisión principal en directo',
  tv1: 'Canal público nacional',
  tv2: 'Canal de televisión bogotano',
  radio: 'Radio en vivo',
  music: 'Música en vivo',
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
              Tu plataforma de streaming y entretenimiento. TV en vivo, radio, música y mucho más, directo desde Colombia.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/tv/canal-en-vivo">
                <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white text-lg px-8 gap-2 h-14">
                  <Play className="w-5 h-5 fill-white" />
                  Ver Canal en Vivo
                </Button>
              </Link>
              <Link href="/radio">
                <Button size="lg" variant="outline" className="border-zinc-700 text-white hover:bg-zinc-800 text-lg px-8 gap-2 h-14">
                  <Radio className="w-5 h-5" />
                  Escuchar Radio
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Channels Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white">Canales en Vivo</h2>
          <span className="text-sm text-zinc-500">{activeCount} de {channels.length} activos</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-zinc-900/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {channels.map((channel) => {
              const Icon = iconMap[channel.channel] || Tv
              const colors = colorMap[channel.channel] || colorMap.main
              const href = hrefMap[channel.channel] || `/tv/canal-en-vivo`
              const description = descriptionMap[channel.channel] || channel.displayName || ''

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
                          <p className="text-sm text-zinc-500 mt-1">{description}</p>
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="border-zinc-700 text-zinc-500 text-xs">
                              {channel.sourceType === 'phone' ? '📱 Teléfono' : channel.sourceType.toUpperCase()}
                            </Badge>
                          </div>
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

      {/* Quick Broadcast Link */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">
        <Card className="bg-gradient-to-r from-red-950/30 to-zinc-900 border-red-900/30">
          <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-600/20 rounded-xl flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Transmite desde tu Teléfono</h3>
                <p className="text-zinc-400 text-sm">Usa la cámara de tu celular para ir en vivo al Canal Principal</p>
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

      {/* Mobile Quick Access */}
      <section className="md:hidden max-w-7xl mx-auto px-4 pb-8">
        <h3 className="text-lg font-bold text-white mb-4">Acceso Rápido</h3>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {channels.map((ch) => {
            const Icon = iconMap[ch.channel] || Tv
            const colors = colorMap[ch.channel] || colorMap.main
            const href = hrefMap[ch.channel] || `/tv/canal-en-vivo`
            return (
              <Link key={ch.channel} href={href}>
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-zinc-900 border border-zinc-800 whitespace-nowrap">
                  <Icon className={`w-4 h-4 ${colors.text}`} />
                  <span className="text-sm text-zinc-300">{ch.displayName || ch.channel}</span>
                  {ch.isActive && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* About Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <Card className="bg-gradient-to-br from-zinc-900 to-zinc-900/50 border-zinc-800">
          <CardContent className="p-8 md:p-12">
            <div className="max-w-2xl">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Entretenimiento sin límites
              </h2>
              <p className="text-zinc-400 text-lg leading-relaxed">
                TPK PLAY te lleva lo mejor de la televisión colombiana, radio y música en vivo.
                Disfruta de Señal Colombia, Citytv, Blue Radio, La Kalle y transmití desde tu teléfono, todo desde una sola plataforma.
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
