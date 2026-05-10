'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Hls from 'hls.js'
import { Play, Radio } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface VideoPlayerProps {
  sourceType: string
  sourceUrl: string | null
  displayName?: string | null
  autoPlay?: boolean
}

export default function VideoPlayer({
  sourceType,
  sourceUrl,
  displayName,
  autoPlay = false,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const prevSourceRef = useRef<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [needsUserAction, setNeedsUserAction] = useState(!autoPlay)

  const destroyPlayer = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.removeAttribute('src')
      videoRef.current.load()
    }
    setIsPlaying(false)
  }, [])

  const initPlayer = useCallback(
    (url: string) => {
      if (!videoRef.current) return
      destroyPlayer()
      setError(null)

      // Don't reinitialize if source hasn't changed
      if (prevSourceRef.current === url && isPlaying) return

      prevSourceRef.current = url

      if (sourceType === 'hls' || sourceType === 'audio' || url.endsWith('.m3u8')) {
        if (Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
          })
          hlsRef.current = hls
          hls.loadSource(url)
          hls.attachMedia(videoRef.current)
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            if (!needsUserAction) {
              videoRef.current?.play().catch(() => {
                setNeedsUserAction(true)
              })
            }
          })
          hls.on(Hls.Events.ERROR, (_event, data) => {
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  hls.startLoad()
                  break
                case Hls.ErrorTypes.MEDIA_ERROR:
                  hls.recoverMediaError()
                  break
                default:
                  setError('Error fatal en la reproducción')
                  destroyPlayer()
                  break
              }
            }
          })
        } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
          // Native HLS support (Safari)
          videoRef.current.src = url
          if (!needsUserAction) {
            videoRef.current.play().catch(() => {
              setNeedsUserAction(true)
            })
          }
        } else {
          setError('HLS no soportado en este navegador')
        }
      } else {
        // Direct URL playback
        videoRef.current.src = url
        if (!needsUserAction) {
          videoRef.current.play().catch(() => {
            setNeedsUserAction(true)
          })
        }
      }
    },
    [sourceType, destroyPlayer, needsUserAction, isPlaying]
  )

  const handlePlay = useCallback(() => {
    if (sourceUrl) {
      setNeedsUserAction(false)
      initPlayer(sourceUrl)
      setTimeout(() => {
        videoRef.current?.play().then(() => setIsPlaying(true)).catch(() => {})
      }, 100)
    }
  }, [sourceUrl, initPlayer])

  // Auto-init when URL changes and not needing user action
  useEffect(() => {
    if (sourceUrl && !needsUserAction && sourceUrl !== prevSourceRef.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- initPlayer manages external Hls.js state
      initPlayer(sourceUrl)
    }
  }, [sourceUrl, needsUserAction, initPlayer])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      destroyPlayer()
    }
  }, [destroyPlayer])

  // YouTube embed
  if (sourceType === 'youtube' && sourceUrl) {
    const videoId = extractYouTubeId(sourceUrl)
    if (!videoId) {
      return <div className="text-red-400 p-4">URL de YouTube inválida</div>
    }
    return (
      <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
          className="w-full h-full"
          allow="autoplay; encrypted-media"
          allowFullScreen
          title={displayName || 'YouTube Player'}
        />
      </div>
    )
  }

  // Facebook embed
  if (sourceType === 'facebook' && sourceUrl) {
    return (
      <div className="w-full aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
        <iframe
          src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(sourceUrl)}&autoplay=true&mute=0`}
          className="w-full h-full"
          allow="autoplay; encrypted-media"
          allowFullScreen
          title={displayName || 'Facebook Player'}
        />
      </div>
    )
  }

  // Twitch embed
  if (sourceType === 'twitch' && sourceUrl) {
    const channel = extractTwitchChannel(sourceUrl)
    return (
      <div className="w-full aspect-video bg-black rounded-lg overflow-hidden">
        <iframe
          src={`https://player.twitch.tv/?channel=${channel}&parent=${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}`}
          className="w-full h-full"
          allowFullScreen
          title={displayName || 'Twitch Player'}
        />
      </div>
    )
  }

  // Instagram embed (validated)
  if (sourceType === 'instagram' && sourceUrl) {
    if (!isValidEmbedUrl(sourceUrl, 'instagram')) {
      return <div className="text-red-400 p-4">URL de Instagram inválida</div>
    }
    return (
      <div className="w-full aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
        <iframe
          src={sourceUrl}
          className="w-full h-full"
          allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-presentation"
          title={displayName || 'Instagram Player'}
        />
      </div>
    )
  }

  // Phone source - no player needed, just status
  if (sourceType === 'phone') {
    return (
      <div className="w-full aspect-video bg-zinc-900 rounded-lg flex flex-col items-center justify-center gap-4">
        <Radio className="w-16 h-16 text-red-500 animate-pulse" />
        <p className="text-white text-lg font-semibold">Transmisión desde Teléfono</p>
        <p className="text-zinc-400 text-sm">Esperando señal de transmisión...</p>
      </div>
    )
  }

  // HLS / URL / Audio - native video player
  if (!sourceUrl) {
    return (
      <div className="w-full aspect-video bg-zinc-900 rounded-lg flex flex-col items-center justify-center gap-4">
        <Radio className="w-16 h-16 text-zinc-600" />
        <p className="text-zinc-400 text-lg">Sin señal disponible</p>
      </div>
    )
  }

  const isAudio = sourceType === 'audio'

  return (
    <div className="w-full">
      {isAudio ? (
        <div className="w-full bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-lg p-8 flex flex-col items-center gap-6">
          <div className="w-24 h-24 bg-red-600/20 rounded-full flex items-center justify-center">
            <Radio className="w-12 h-12 text-red-500" />
          </div>
          <h3 className="text-white text-xl font-bold">{displayName || 'Radio en Vivo'}</h3>
          <audio
            ref={videoRef as unknown as React.RefObject<HTMLAudioElement>}
            className="w-full"
            controls
          />
        </div>
      ) : (
        <div className="w-full aspect-video bg-black rounded-lg overflow-hidden relative">
          <video
            ref={videoRef}
            className="w-full h-full"
            playsInline
            controls
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
          {needsUserAction && !isPlaying && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-4">
              <Play className="w-16 h-16 text-red-500" />
              <Button
                onClick={handlePlay}
                size="lg"
                className="bg-red-600 hover:bg-red-700 text-white text-lg px-8 py-6"
              >
                Ver {displayName || 'Transmisión'}
              </Button>
            </div>
          )}
        </div>
      )}
      {error && (
        <div className="mt-2 p-3 bg-red-900/50 border border-red-700 rounded text-red-300 text-sm">
          {error}
        </div>
      )}
    </div>
  )
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

function extractTwitchChannel(url: string): string {
  try {
    const u = new URL(url)
    return u.pathname.split('/').filter(Boolean).pop() || ''
  } catch {
    return url
  }
}

function isValidEmbedUrl(url: string, platform: string): boolean {
  try {
    const parsed = new URL(url)
    const allowedDomains: Record<string, string[]> = {
      youtube: ['youtube.com', 'www.youtube.com', 'youtu.be'],
      facebook: ['facebook.com', 'www.facebook.com', 'web.facebook.com'],
      instagram: ['instagram.com', 'www.instagram.com'],
      twitch: ['twitch.tv', 'www.twitch.tv', 'player.twitch.tv'],
    }
    const domains = allowedDomains[platform]
    if (!domains) return false
    return domains.some(d => parsed.hostname === d || parsed.hostname.endsWith('.' + d))
  } catch {
    return false
  }
}
