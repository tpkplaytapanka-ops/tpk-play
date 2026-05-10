'use client'

import { useState, useRef, useCallback } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { WHIPClient } from '@/lib/whip-client'
import {
  Camera, CameraOff, AlertTriangle, Smartphone, Video, VideoOff,
  Send, SwitchCamera, Mic, MicOff, Wifi, WifiOff, Radio
} from 'lucide-react'

type StreamStep = 'idle' | 'preview' | 'ready' | 'connecting' | 'streaming'

export default function StreamBroadcastPage() {
  const [step, setStep] = useState<StreamStep>('idle')
  const [isIOS, setIsIOS] = useState(false)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  const [muted, setMuted] = useState(false)
  const [viewers, setViewers] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [connectionState, setConnectionState] = useState<string>('disconnected')
  const [mediaServerAvailable, setMediaServerAvailable] = useState(true)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const whipRef = useRef<WHIPClient | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Detect iOS
  useState(() => {
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent
      const isIOSSafari = /iPad|iPhone|iPod/.test(ua) && /Safari/.test(ua) && !/CriOS|FxiOS/.test(ua)
      setIsIOS(isIOSSafari)
    }
  })

  // Check if MediaMTX WHIP endpoint is reachable
  const checkMediaServer = useCallback(async () => {
    try {
      // Try OPTIONS request to WHIP endpoint
      const res = await fetch('/whip/main', { method: 'OPTIONS' })
      setMediaServerAvailable(res.ok || res.status === 405) // 405 = Method Not Allowed but server exists
    } catch {
      setMediaServerAvailable(false)
    }
  }, [])

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: true,
      })

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setStep('preview')
      toast.success('Camara iniciada correctamente')

      // Check media server availability
      await checkMediaServer()
    } catch (err) {
      const error = err as DOMException
      if (error.name === 'NotAllowedError') {
        toast.error('Permiso de camara denegado. Permite el acceso en configuracion del navegador.')
      } else if (error.name === 'NotFoundError') {
        toast.error('No se encontro una camara disponible.')
      } else {
        toast.error('Error al acceder a la camara: ' + error.message)
      }
    }
  }, [facingMode, checkMediaServer])

  const flipCamera = useCallback(async () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user'
    setFacingMode(newMode)

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: newMode, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
        }
        // If we're streaming, update the peer connection tracks
        if (whipRef.current && step === 'streaming') {
          const senders = (whipRef.current as any).pc?.getSenders()
          if (senders) {
            stream.getTracks().forEach((track) => {
              const sender = senders.find((s: RTCRtpSender) => s.track?.kind === track.kind)
              if (sender) {
                sender.replaceTrack(track)
              }
            })
          }
        }
        toast.info(newMode === 'user' ? 'Camara frontal' : 'Camara trasera')
      } catch {
        toast.error('No se pudo cambiar la camara')
      }
    }
  }, [facingMode, step])

  const toggleMute = useCallback(() => {
    setMuted(prev => {
      const newMuted = !prev
      if (streamRef.current) {
        streamRef.current.getAudioTracks().forEach(track => {
          track.enabled = !newMuted
        })
      }
      toast.info(newMuted ? 'Microfono silenciado' : 'Microfono activado')
      return newMuted
    })
  }, [])

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setStep('idle')
    toast.info('Camara detenida')
  }, [])

  const startStreaming = useCallback(async () => {
    if (!streamRef.current) {
      toast.error('No hay camara activa')
      return
    }

    setStep('connecting')
    setConnectionState('connecting')

    try {
      // Create WHIP client with connection state monitoring
      const whip = new WHIPClient({
        onConnectionStateChange: (state) => {
          setConnectionState(state)
          if (state === 'failed' || state === 'disconnected') {
            toast.error('Conexion perdida. Intentando reconectar...')
          }
        },
      })
      whipRef.current = whip

      // Publish stream via WHIP to MediaMTX
      const whipEndpoint = '/whip/main'

      try {
        await whip.publish(streamRef.current, whipEndpoint)
      } catch (whipError) {
        // If WHIP fails, try fallback mode (no media server)
        console.warn('WHIP publish failed, falling back to notification-only mode:', whipError)
        setMediaServerAvailable(false)
      }

      // Determine the HLS URL for viewers
      const hlsUrl = mediaServerAvailable
        ? `${window.location.origin}/hls/main/index.m3u8`
        : null

      // Notify server that stream is active
      const res = await fetch('/api/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'main',
          sourceType: 'phone',
          sourceUrl: hlsUrl || 'phone://live',
          isActive: true,
          displayName: 'Transmision desde Telefono',
        }),
      })

      if (res.ok) {
        setStep('streaming')
        setViewers(0)
        setElapsed(0)

        // Start timer
        timerRef.current = setInterval(() => {
          setElapsed(prev => prev + 1)
        }, 1000)

        if (mediaServerAvailable) {
          toast.success('Transmision iniciada! Los espectadores pueden verte en el Canal en Vivo.')
        } else {
          toast.warning('Transmision iniciada en modo limitado. El servidor de medios no esta disponible.')
        }
      } else {
        setStep('ready')
        toast.error('Error al iniciar la transmision en el servidor')
      }
    } catch {
      setStep('ready')
      toast.error('Error al iniciar la transmision. Verifica tu conexion.')
    }
  }, [mediaServerAvailable])

  const stopStreaming = useCallback(async () => {
    // Stop WHIP client
    if (whipRef.current) {
      await whipRef.current.stop()
      whipRef.current = null
    }

    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    // Notify server that stream is inactive
    try {
      await fetch('/api/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'main',
          sourceType: 'phone',
          sourceUrl: null,
          isActive: false,
          displayName: 'Canal Principal',
        }),
      })
    } catch {
      // ignore
    }

    setStep('preview')
    setViewers(0)
    setElapsed(0)
    setConnectionState('disconnected')
    toast.info('Transmision detenida')
  }, [])

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl md:text-3xl font-bold text-white">Transmitir desde Telefono</h1>
            {step === 'streaming' && (
              <Badge className="bg-red-600 animate-pulse">EN VIVO</Badge>
            )}
          </div>
          <p className="text-zinc-400">Usa la camara de tu dispositivo para transmitir en vivo al Canal Principal</p>
        </div>

        {/* iOS Warning */}
        {isIOS && (
          <Card className="bg-yellow-900/20 border-yellow-600/30 mb-4">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-yellow-200 font-medium">Dispositivo iOS detectado</p>
                <p className="text-yellow-400/80 text-sm mt-1">
                  Safari en iOS tiene restricciones con la transmision en vivo. Para mejor experiencia,
                  usa un navegador alternativo o Android.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Media Server Status */}
        {step !== 'idle' && !mediaServerAvailable && (
          <Card className="bg-orange-900/20 border-orange-600/30 mb-4">
            <CardContent className="p-4 flex items-start gap-3">
              <WifiOff className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-orange-200 font-medium">Servidor de medios no disponible</p>
                <p className="text-orange-400/80 text-sm mt-1">
                  El servidor de streaming (MediaMTX) no esta configurado. La transmision funcionara en modo
                  limitado. Contacta al administrador para configurar el servidor de medios.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Connection Quality Indicator */}
        {step === 'streaming' && (
          <Card className="bg-zinc-900/50 border-zinc-800 mb-4">
            <CardContent className="p-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {connectionState === 'connected' ? (
                    <><Wifi className="w-4 h-4 text-green-500" /><span className="text-green-400">Conectado</span></>
                  ) : connectionState === 'connecting' ? (
                    <><Wifi className="w-4 h-4 text-yellow-500 animate-pulse" /><span className="text-yellow-400">Conectando...</span></>
                  ) : (
                    <><WifiOff className="w-4 h-4 text-red-500" /><span className="text-red-400">Desconectado</span></>
                  )}
                </div>
                <div className="flex items-center gap-3 text-zinc-500">
                  <span>{facingMode === 'user' ? 'Frontal' : 'Trasera'}</span>
                  <span>{muted ? 'Sin audio' : 'Con audio'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Camera Preview */}
        <Card className="bg-zinc-900 border-zinc-800 mb-4 overflow-hidden">
          <CardContent className="p-0">
            <div className="relative aspect-video bg-black overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {step === 'idle' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <Camera className="w-16 h-16 text-zinc-600" />
                  <p className="text-zinc-500">Presiona &quot;Iniciar Camara&quot; para comenzar</p>
                </div>
              )}
              {step === 'connecting' && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-4">
                  <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-white text-lg font-medium">Conectando al servidor...</p>
                  <p className="text-zinc-400 text-sm">Estableciendo conexion WebRTC</p>
                </div>
              )}
              {step === 'streaming' && (
                <>
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-red-600 animate-pulse flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                      EN VIVO
                    </Badge>
                  </div>
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    <Badge variant="outline" className="border-zinc-600 text-zinc-300 bg-black/50">
                      {formatTime(elapsed)}
                    </Badge>
                  </div>
                  <div className="absolute bottom-4 left-4 flex items-center gap-3">
                    <Badge variant="outline" className="border-zinc-600 text-zinc-300 bg-black/50">
                      <Wifi className="w-3 h-3 mr-1" /> {connectionState === 'connected' ? 'OK' : '...'}
                    </Badge>
                  </div>
                </>
              )}
              {muted && step !== 'idle' && (
                <div className="absolute bottom-4 right-4">
                  <Badge className="bg-red-900/80 text-red-300">
                    <MicOff className="w-3 h-3 mr-1" /> Sin audio
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Camera Controls (visible when camera is on) */}
        {step !== 'idle' && (
          <div className="flex items-center justify-center gap-3 mb-4">
            <Button onClick={flipCamera} variant="outline" size="sm" className="border-zinc-700 text-zinc-300 gap-2">
              <SwitchCamera className="w-4 h-4" />
              Voltear
            </Button>
            <Button onClick={toggleMute} variant="outline" size="sm" className={`gap-2 ${muted ? 'border-red-700 text-red-400' : 'border-zinc-700 text-zinc-300'}`}>
              {muted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              {muted ? 'Activar Mic' : 'Silenciar Mic'}
            </Button>
          </div>
        )}

        {/* Step Controls */}
        <div className="space-y-3">
          {/* Step 1: Start Camera */}
          <Card className={`bg-zinc-900 border-zinc-800 transition-opacity ${step !== 'idle' ? 'opacity-50' : ''}`}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${step === 'idle' ? 'bg-red-600/20' : 'bg-zinc-700/30'}`}>
                  <Camera className={`w-5 h-5 ${step === 'idle' ? 'text-red-500' : 'text-zinc-500'}`} />
                </div>
                <div>
                  <p className="text-white font-medium">1. Iniciar Camara</p>
                  <p className="text-zinc-500 text-sm">Permite acceso a camara y microfono</p>
                </div>
              </div>
              {step === 'idle' ? (
                <Button onClick={startCamera} className="bg-red-600 hover:bg-red-700 text-white gap-2">
                  <Camera className="w-4 h-4" />
                  Iniciar
                </Button>
              ) : (
                <Button onClick={stopCamera} variant="outline" className="border-zinc-700 text-zinc-400 gap-2">
                  <CameraOff className="w-4 h-4" />
                  Detener
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Verify Preview */}
          <Card className={`bg-zinc-900 border-zinc-800 transition-opacity ${step !== 'preview' ? 'opacity-50' : ''}`}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${step === 'preview' ? 'bg-orange-600/20' : 'bg-zinc-700/30'}`}>
                  <Video className={`w-5 h-5 ${step === 'preview' ? 'text-orange-500' : 'text-zinc-500'}`} />
                </div>
                <div>
                  <p className="text-white font-medium">2. Verificar Vista Previa</p>
                  <p className="text-zinc-500 text-sm">Confirma que imagen y audio son correctos</p>
                </div>
              </div>
              {step === 'preview' && (
                <Button onClick={() => setStep('ready')} className="bg-orange-600 hover:bg-orange-700 text-white gap-2">
                  <Smartphone className="w-4 h-4" />
                  Verificar
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Step 3: Go Live */}
          <Card className={`bg-zinc-900 border-zinc-800 transition-opacity ${!['ready', 'streaming', 'connecting'].includes(step) ? 'opacity-50' : ''}`}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${['ready', 'streaming', 'connecting'].includes(step) ? 'bg-green-600/20' : 'bg-zinc-700/30'}`}>
                  <Send className={`w-5 h-5 ${['ready', 'streaming', 'connecting'].includes(step) ? 'text-green-500' : 'text-zinc-500'}`} />
                </div>
                <div>
                  <p className="text-white font-medium">3. Transmitir en Vivo</p>
                  <p className="text-zinc-500 text-sm">
                    {step === 'connecting'
                      ? 'Conectando al servidor...'
                      : step === 'streaming'
                        ? `En vivo - ${formatTime(elapsed)}`
                        : 'Comienza a transmitir al Canal Principal'}
                  </p>
                </div>
              </div>
              {step === 'ready' && (
                <Button onClick={startStreaming} className="bg-green-600 hover:bg-green-700 text-white gap-2">
                  <Video className="w-4 h-4" />
                  Ir en Vivo!
                </Button>
              )}
              {step === 'connecting' && (
                <Button disabled className="bg-yellow-600 text-white gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Conectando
                </Button>
              )}
              {step === 'streaming' && (
                <Button onClick={stopStreaming} variant="destructive" className="gap-2">
                  <VideoOff className="w-4 h-4" />
                  Detener
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Streaming Info */}
        <Card className="bg-zinc-900/50 border-zinc-800 mt-4">
          <CardContent className="p-4">
            <h3 className="text-white font-medium mb-2">Informacion</h3>
            <ul className="text-zinc-400 text-sm space-y-1.5">
              <li>La camara no se activa automaticamente por privacidad</li>
              <li>Al transmitir, se activa automaticamente el Canal en Vivo</li>
              <li>Puedes voltear la camara (frontal/trasera) en cualquier momento</li>
              <li>Se recomienda usar Wi-Fi para una transmision estable</li>
              <li>La calidad depende de tu conexion a internet</li>
              <li>Al detener, el canal vuelve a mostrar &quot;Sin senal&quot;</li>
              <li>La transmision usa WebRTC para baja latencia</li>
            </ul>
          </CardContent>
        </Card>

        {/* Technical Details (collapsible-style) */}
        <Card className="bg-zinc-900/30 border-zinc-800 mt-4">
          <CardContent className="p-4">
            <h3 className="text-zinc-400 font-medium mb-2 text-sm">Detalles tecnicos</h3>
            <div className="grid grid-cols-2 gap-2 text-xs text-zinc-500">
              <div>Protocolo: WebRTC/WHIP</div>
              <div>Resolucion: 720p</div>
              <div>Servidor: MediaMTX</div>
              <div>Salida: HLS (.m3u8)</div>
              <div>Estado: {connectionState}</div>
              <div>Media Server: {mediaServerAvailable ? 'Disponible' : 'No disponible'}</div>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  )
}
