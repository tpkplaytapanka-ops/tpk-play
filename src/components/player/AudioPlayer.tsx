'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Hls from 'hls.js'
import { Radio, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AudioPlayerProps {
  sourceUrl: string | null
  displayName?: string | null
}

export default function AudioPlayer({ sourceUrl, displayName }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [needsUserAction, setNeedsUserAction] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const destroyPlayer = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.removeAttribute('src')
      audioRef.current.load()
    }
    setIsPlaying(false)
  }, [])

  const handlePlay = useCallback(() => {
    if (!sourceUrl || !audioRef.current) return

    destroyPlayer()
    setError(null)
    setNeedsUserAction(false)

    if (sourceUrl.endsWith('.m3u8')) {
      if (Hls.isSupported()) {
        const hls = new Hls({ enableWorker: true })
        hlsRef.current = hls
        hls.loadSource(sourceUrl)
        hls.attachMedia(audioRef.current)
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          audioRef.current?.play().then(() => setIsPlaying(true)).catch(() => {})
        })
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            setError('Error en la reproducción del audio')
            destroyPlayer()
          }
        })
      } else if (audioRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        audioRef.current.src = sourceUrl
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {})
      }
    } else {
      audioRef.current.src = sourceUrl
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {})
    }
  }, [sourceUrl, destroyPlayer])

  useEffect(() => {
    return () => {
      destroyPlayer()
    }
  }, [destroyPlayer])

  if (!sourceUrl) {
    return (
      <div className="w-full bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-lg p-8 flex flex-col items-center gap-4">
        <div className="w-20 h-20 bg-zinc-700/30 rounded-full flex items-center justify-center">
          <Radio className="w-10 h-10 text-zinc-500" />
        </div>
        <p className="text-zinc-400 text-lg">Sin señal disponible</p>
      </div>
    )
  }

  return (
    <div className="w-full bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-lg p-6 md:p-8 flex flex-col items-center gap-6">
      <div className={`w-24 h-24 rounded-full flex items-center justify-center ${isPlaying ? 'bg-red-600/30 animate-pulse' : 'bg-zinc-700/30'}`}>
        <Radio className={`w-12 h-12 ${isPlaying ? 'text-red-500' : 'text-zinc-400'}`} />
      </div>
      <h3 className="text-white text-xl md:text-2xl font-bold text-center">{displayName || 'Radio en Vivo'}</h3>

      <audio ref={audioRef} className="hidden" onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} />

      {needsUserAction ? (
        <Button
          onClick={handlePlay}
          size="lg"
          className="bg-red-600 hover:bg-red-700 text-white text-lg px-8 py-6 gap-2"
        >
          <Play className="w-5 h-5" />
          Escuchar {displayName || 'Radio'}
        </Button>
      ) : (
        <div className="flex items-center gap-4">
          <Button
            onClick={() => {
              if (audioRef.current?.paused) {
                audioRef.current.play().catch(() => {})
              } else {
                audioRef.current?.pause()
              }
            }}
            variant="outline"
            className="border-zinc-600 text-white hover:bg-zinc-700"
          >
            {isPlaying ? 'Pausar' : 'Reproducir'}
          </Button>
          <Button
            onClick={() => {
              destroyPlayer()
              setNeedsUserAction(true)
            }}
            variant="ghost"
            className="text-zinc-400 hover:text-white"
          >
            Detener
          </Button>
        </div>
      )}

      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}
    </div>
  )
}
