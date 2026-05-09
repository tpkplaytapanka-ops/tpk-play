'use client'

import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Play, Tv, Radio, Music, ChevronRight, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const channels = [
  {
    href: '/tv/canal-en-vivo',
    title: 'Canal en Vivo',
    description: 'Transmisión principal en directo',
    icon: Zap,
    color: 'from-red-600 to-red-800',
    iconBg: 'bg-red-600/20',
    iconColor: 'text-red-500',
    live: true,
  },
  {
    href: '/tv/canal-1',
    title: 'Señal Colombia',
    description: 'Canal público nacional',
    icon: Tv,
    color: 'from-emerald-600 to-emerald-800',
    iconBg: 'bg-emerald-600/20',
    iconColor: 'text-emerald-500',
    live: true,
  },
  {
    href: '/tv/canal-2',
    title: 'Citytv',
    description: 'Canal de televisión bogotano',
    icon: Tv,
    color: 'from-blue-600 to-blue-800',
    iconBg: 'bg-blue-600/20',
    iconColor: 'text-blue-500',
    live: true,
  },
  {
    href: '/radio',
    title: 'Blue Radio',
    description: 'Radio en vivo',
    icon: Radio,
    color: 'from-purple-600 to-purple-800',
    iconBg: 'bg-purple-600/20',
    iconColor: 'text-purple-500',
    live: true,
  },
  {
    href: '/musica',
    title: 'La Kalle',
    description: 'Música en vivo',
    icon: Music,
    color: 'from-orange-600 to-orange-800',
    iconBg: 'bg-orange-600/20',
    iconColor: 'text-orange-500',
    live: true,
  },
]

export default function HomePage() {
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
              <span className="text-red-400 text-sm font-medium">EN VIVO</span>
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
          <h2 className="text-2xl md:text-3xl font-bold text-white">Canales</h2>
          <span className="text-sm text-zinc-500">{channels.length} canales disponibles</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {channels.map((channel) => (
            <Link key={channel.href} href={channel.href}>
              <Card className="group bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 transition-all duration-300 cursor-pointer overflow-hidden">
                <CardContent className="p-0">
                  <div className={`h-2 bg-gradient-to-r ${channel.color}`} />
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className={`w-12 h-12 ${channel.iconBg} rounded-xl flex items-center justify-center`}>
                        <channel.icon className={`w-6 h-6 ${channel.iconColor}`} />
                      </div>
                      {channel.live && (
                        <span className="flex items-center gap-1.5 text-xs font-medium text-red-400 bg-red-600/10 px-2 py-1 rounded-full">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                          </span>
                          EN VIVO
                        </span>
                      )}
                    </div>
                    <div className="mt-4">
                      <h3 className="text-lg font-bold text-white group-hover:text-red-400 transition-colors">
                        {channel.title}
                      </h3>
                      <p className="text-sm text-zinc-500 mt-1">{channel.description}</p>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-zinc-400 group-hover:text-red-400 transition-colors">
                      <span>Ver ahora</span>
                      <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Quick Access Mobile */}
      <section className="md:hidden max-w-7xl mx-auto px-4 pb-8">
        <h3 className="text-lg font-bold text-white mb-4">Acceso Rápido</h3>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {channels.map((ch) => (
            <Link key={ch.href} href={ch.href}>
              <div className={`flex items-center gap-2 px-4 py-2.5 rounded-full bg-zinc-900 border border-zinc-800 whitespace-nowrap`}>
                <ch.icon className={`w-4 h-4 ${ch.iconColor}`} />
                <span className="text-sm text-zinc-300">{ch.title}</span>
              </div>
            </Link>
          ))}
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
                Disfruta de Señal Colombia, Citytv, Blue Radio, La Kalle y mucho más, todo desde una sola plataforma.
              </p>
              <div className="mt-6 flex flex-wrap gap-4">
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
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <Footer />
    </div>
  )
}
