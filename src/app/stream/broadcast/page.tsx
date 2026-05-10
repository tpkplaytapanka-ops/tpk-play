'use client'

import { useState, useRef, useCallback } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Camera, CameraOff, AlertTriangle, Smartphone, Video, VideoOff, Send, Settings, SwitchCamera, Mic, MicOff } from 'lucide-react'

type StreamStep = 'idle' | 'preview' | 'ready' | 'streaming'

export default function StreamBroadcastPage() {
  const [step, setStep] = useState<StreamStep>('idle')
  const [isIOS, setIsIOS] = useState(false)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  const [muted, setMuted] = useState(false)
  const [streamKey, setStreamKey] = useState('')
  const [viewers, setViewers] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Detect iOS
  useState(() => {
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent
      const isIOSSafari = /iPad|iPhone|iPod/.test(ua) && /Safari/.test(ua) && !/CriOS|FxiOS/.test(ua)
      setIsIOS(isIOSSafari)
    }
  })

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: !muted,
      })

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setStep('preview')
      toast.success('Cámara iniciada correctamente')
    } catch (err) {
      const error = err as DOMException
      if (error.name === 'NotAllowedError') {
        toast.error('Permiso de cámara denegado. Permite el acceso en configuración del navegador.')
      } else if (error.name === 'NotFoundError') {
        toast.error('No se encontró una cámara disponible.')
      } else {
        toast.error('Error al acceder a la cámara: ' + error.message)
      }
    }
  }, [facingMode, muted])

  const flipCamera = useCallback(async () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user'
    setFacingMode(newMode)

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: newMode, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: !muted,
        })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
        }
        toast.info(newMode === 'user' ? 'Cámara frontal' : 'Cámara trasera')
      } catch {
        toast.error('No se pudo cambiar la cámara')
      }
    }
  }, [facingMode, muted])

  const toggleMute = useCallback(() => {
    setMuted(prev => {
      const newMuted = !prev
      if (streamRef.current) {
        streamRef.current.getAudioTracks().forEach(track => {
          track.enabled = !newMuted
        })
      }
      toast.info(newMuted ? 'Micrófono silenciado' : 'Micrófono activado')
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
    toast.info('Cámara detenida')
  }, [])

  const startStreaming = useCallback(async () => {
    if (!streamRef.current) {
      toast.error('No hay cámara activa')
      return
    }

    try {
      // Create MediaRecorder to capture stream as webm chunks
      const mimeTypes = [
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=vp9,opus',
        'video/webm',
        'video/mp4',
      ]
      const mimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || ''

      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: mimeType || undefined,
        videoBitsPerSecond: 2500000,
      })

      const chunks: Blob[] = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }

      mediaRecorder.start(1000) // Send data every second
      mediaRecorderRef.current = mediaRecorder

      // Notify server that stream is active
      const res = await fetch('/api/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'main',
          sourceType: 'phone',
          sourceUrl: 'phone://live',
          isActive: true,
          displayName: 'Transmisión desde Teléfono',
        }),
      })

      if (res.ok) {
        setStep('streaming')
        setStreamKey('tpk-' + Date.now().toString(36))
        setViewers(0)
        setElapsed(0)

        // Start timer
        timerRef.current = setInterval(() => {
          setElapsed(prev => prev + 1)
        }, 1000)

        toast.success('¡Transmisión iniciada! Los espectadores pueden verte en el Canal en Vivo.')
      } else {
        toast.error('Error al iniciar la transmisión en el servidor')
      }
    } catch {
      toast.error('Error al iniciar la transmisión')
    }
  }, [])

  const stopStreaming = useCallback(async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current = null
    }

    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
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
    setStreamKey('')
    setViewers(0)
    setElapsed(0)
    toast.info('Transmisión detenida')
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
            <h1 className="text-2xl md:text-3xl font-bold text-white">Transmitir desde Teléfono</h1>
            {step === 'streaming' && (
              <Badge className="bg-red-600 animate-pulse">EN VIVO</Badge>
            )}
          </div>
          <p className="text-zinc-400">Usa la cámara de tu dispositivo para transmitir en vivo al Canal Principal</p>
        </div>

        {/* iOS Warning */}
        {isIOS && (
          <Card className="bg-yellow-900/20 border-yellow-600/30 mb-4">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-yellow-200 font-medium">Dispositivo iOS detectado</p>
                <p className="text-yellow-400/80 text-sm mt-1">
                  Safari en iOS tiene restricciones con la transmisión en vivo. Para mejor experiencia,
                  usa un navegador alternativo o Android.
                </p>
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
                  <p className="text-zinc-500">Presiona &quot;Iniciar Cámara&quot; para comenzar</p>
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
                      👁 {viewers}
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
                  <p className="text-white font-medium">1. Iniciar Cámara</p>
                  <p className="text-zinc-500 text-sm">Permite acceso a cámara y micrófono</p>
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
          <Card className={`bg-zinc-900 border-zinc-800 transition-opacity ${step !== 'ready' && step !== 'streaming' ? 'opacity-50' : ''}`}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${step === 'ready' || step === 'streaming' ? 'bg-green-600/20' : 'bg-zinc-700/30'}`}>
                  <Send className={`w-5 h-5 ${step === 'ready' || step === 'streaming' ? 'text-green-500' : 'text-zinc-500'}`} />
                </div>
                <div>
                  <p className="text-white font-medium">3. Transmitir en Vivo</p>
                  <p className="text-zinc-500 text-sm">
                    {step === 'streaming'
                      ? `En vivo — ${formatTime(elapsed)}`
                      : 'Comienza a transmitir al Canal Principal'}
                  </p>
                </div>
              </div>
              {step === 'ready' && (
                <Button onClick={startStreaming} className="bg-green-600 hover:bg-green-700 text-white gap-2">
                  <Video className="w-4 h-4" />
                  ¡Ir en Vivo!
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
            <h3 className="text-white font-medium mb-2">Información</h3>
            <ul className="text-zinc-400 text-sm space-y-1.5">
              <li>• La cámara no se activa automáticamente por privacidad</li>
              <li>• Al transmitir, se activa automáticamente el Canal en Vivo</li>
              <li>• Puedes voltear la cámara (frontal/trasera) en cualquier momento</li>
              <li>• Se recomienda usar Wi-Fi para una transmisión estable</li>
              <li>• La calidad depende de tu conexión a internet</li>
              <li>• Al detener, el canal vuelve a mostrar &quot;Sin señal&quot;</li>
            </ul>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  )
}
