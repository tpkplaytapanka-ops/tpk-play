'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import AudioPlayer from '@/components/player/AudioPlayer'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Radio, RefreshCw, Headphones, ChevronRight, Volume2 } from 'lucide-react'

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

const stationColors: Record<string, { bg: string; text: string; gradient: string }> = {
  radio: { bg: 'bg-purple-600/20', text: 'text-purple-500', gradient: 'from-purple-600 to-purple-800' },
  radio2: { bg: 'bg-blue-600/20', text: 'text-blue-500', gradient: 'from-blue-600 to-blue-800' },
  radio3: { bg: 'bg-amber-600/20', text: 'text-amber-500', gradient: 'from-amber-600 to-amber-800' },
  music: { bg: 'bg-orange-600/20', text: 'text-orange-500', gradient: 'from-orange-600 to-orange-800' },
  music2: { bg: 'bg-pink-600/20', text: 'text-pink-500', gradient: 'from-pink-600 to-pink-800' },
}

export default function RadioPage() {
  const [channels, setChannels] = useState<BroadcastConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStation, setSelectedStation] = useState<BroadcastConfig | null>(null)
  const prevSourceRef = useRef<string | null>(null)

  const fetchChannels = useCallback(async () => {
    try {
      const res = await fetch('/api/broadcast')
      if (res.ok) {
        const data = await res.json()
        const radioAndMusic = data.filter((c: BroadcastConfig) => c.category === 'radio' || c.category === 'music')
        setChannels(radioAndMusic)
        // Auto-select first active station
        if (!selectedStation) {
          const firstActive = radioAndMusic.find((c: BroadcastConfig) => c.isActive)
          if (firstActive) {
            setSelectedStation(firstActive)
          } else if (radioAndMusic.length > 0) {
            setSelectedStation(radioAndMusic[0])
          }
        }
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [selectedStation])

  useEffect(() => {
    fetchChannels()
    const interval = setInterval(fetchChannels, 30000)
    return () => clearInterval(interval)
  }, [fetchChannels])

  const handleSelectStation = (station: BroadcastConfig) => {
    if (prevSourceRef.current !== station.sourceUrl) {
      setSelectedStation(station)
      prevSourceRef.current = station.sourceUrl
    }
  }

  const radioStations = channels.filter(c => c.category === 'radio')
  const musicStations = channels.filter(c => c.category === 'music')

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl md:text-3xl font-bold text-white">Radio y Musica</h1>
            <Badge variant="outline" className="border-purple-600/50 text-purple-400">
              {channels.filter(c => c.isActive).length} EN VIVO
            </Badge>
          </div>
          <p className="text-zinc-400">Estaciones de radio y musica en vivo desde Colombia</p>
        </div>

        {loading ? (
          <div className="w-full bg-zinc-900 rounded-xl p-12 flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-zinc-600 animate-spin" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Active Player */}
            {selectedStation && selectedStation.isActive && selectedStation.sourceUrl && (
              <div className="space-y-4">
                <AudioPlayer
                  sourceUrl={selectedStation.sourceUrl}
                  displayName={selectedStation.displayName}
                />
                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stationColors[selectedStation.channel]?.bg || 'bg-purple-600/20'}`}>
                        <Volume2 className={`w-5 h-5 ${stationColors[selectedStation.channel]?.text || 'text-purple-500'}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-medium">{selectedStation.displayName}</h3>
                        <p className="text-zinc-500 text-sm">{selectedStation.description || 'En vivo'}</p>
                      </div>
                      {selectedStation.isActive && (
                        <Badge className="bg-purple-600 animate-pulse">EN VIVO</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Radio Stations Section */}
            {radioStations.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Radio className="w-5 h-5 text-purple-500" />
                  Estaciones de Radio
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {radioStations.map((station) => {
                    const colors = stationColors[station.channel] || stationColors.radio
                    const isSelected = selectedStation?.channel === station.channel

                    return (
                      <Card
                        key={station.channel}
                        className={`cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? 'bg-zinc-800 border-purple-600/50 ring-1 ring-purple-600/30'
                            : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                        }`}
                        onClick={() => handleSelectStation(station)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors.bg}`}>
                              <Radio className={`w-6 h-6 ${colors.text} ${station.isActive && isSelected ? 'animate-pulse' : ''}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-white font-medium truncate">{station.displayName}</h3>
                              <p className="text-zinc-500 text-sm truncate">{station.description || 'Radio en vivo'}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              {station.isActive ? (
                                <Badge className="bg-purple-600/80 text-xs">EN VIVO</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">OFFLINE</Badge>
                              )}
                              {isSelected && (
                                <Volume2 className="w-4 h-4 text-purple-400" />
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Music Stations Section */}
            {musicStations.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Headphones className="w-5 h-5 text-orange-500" />
                  Musica en Vivo
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {musicStations.map((station) => {
                    const colors = stationColors[station.channel] || stationColors.music
                    const isSelected = selectedStation?.channel === station.channel

                    return (
                      <Card
                        key={station.channel}
                        className={`cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? 'bg-zinc-800 border-orange-600/50 ring-1 ring-orange-600/30'
                            : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                        }`}
                        onClick={() => handleSelectStation(station)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors.bg}`}>
                              <Headphones className={`w-6 h-6 ${colors.text} ${station.isActive && isSelected ? 'animate-pulse' : ''}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-white font-medium truncate">{station.displayName}</h3>
                              <p className="text-zinc-500 text-sm truncate">{station.description || 'Musica en vivo'}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              {station.isActive ? (
                                <Badge className="bg-orange-600/80 text-xs">EN VIVO</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">OFFLINE</Badge>
                              )}
                              {isSelected && (
                                <Volume2 className="w-4 h-4 text-orange-400" />
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </section>
            )}

            {/* No stations available */}
            {channels.length === 0 && (
              <div className="w-full bg-zinc-900 rounded-xl p-12 flex flex-col items-center justify-center gap-4">
                <Radio className="w-16 h-16 text-zinc-600" />
                <h2 className="text-xl font-bold text-zinc-400">No hay estaciones disponibles</h2>
                <p className="text-zinc-500">No se encontraron estaciones de radio o musica.</p>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
