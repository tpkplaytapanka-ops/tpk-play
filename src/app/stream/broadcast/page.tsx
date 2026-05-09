'use client'

import { useState, useRef } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Camera, CameraOff, AlertTriangle, Smartphone, Video, VideoOff, Send } from 'lucide-react'

export default function StreamBroadcastPage() {
  const [step, setStep] = useState<'idle' | 'preview' | 'ready'>('idle')
  const [streaming, setStreaming] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Detect iOS Safari
  useState(() => {
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent
      const isIOSSafari = /iPad|iPhone|iPod/.test(ua) && /Safari/.test(ua) && !/CriOS|FxiOS/.test(ua)
      setIsIOS(isIOSSafari)
    }
  })

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
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
      toast.success('Cámara iniciada correctamente')
    } catch (err) {
      const error = err as DOMException
      if (error.name === 'NotAllowedError') {
        toast.error('Permiso de cámara denegado. Por favor permite el acceso en la configuración del navegador.')
      } else if (error.name === 'NotFoundError') {
        toast.error('No se encontró una cámara disponible en este dispositivo.')
      } else {
        toast.error('Error al acceder a la cámara: ' + error.message)
      }
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setStep('idle')
    setStreaming(false)
    toast.info('Cámara detenida')
  }

  const startStreaming = () => {
    setStreaming(true)
    toast.success('¡Transmisión iniciada! Configura el tipo de fuente como "Teléfono" en el panel de administración.')
  }

  const stopStreaming = () => {
    setStreaming(false)
    toast.info('Transmisión detenida')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Transmitir desde Teléfono</h1>
          <p className="text-zinc-400">Usa la cámara de tu dispositivo para transmitir en vivo</p>
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
                  usa un navegador alternativo o considera transmitir desde un dispositivo Android.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Camera Preview */}
        <Card className="bg-zinc-900 border-zinc-800 mb-4">
          <CardContent className="p-0">
            <div className="relative aspect-video bg-black rounded-t-xl overflow-hidden">
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
              {streaming && (
                <div className="absolute top-4 left-4">
                  <Badge className="bg-red-600 animate-pulse flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    EN VIVO
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Controls - Step by step */}
        <div className="space-y-3">
          {/* Step 1: Start Camera */}
          <Card className={`bg-zinc-900 border-zinc-800 ${step !== 'idle' ? 'opacity-60' : ''}`}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${step === 'idle' ? 'bg-red-600/20' : 'bg-zinc-700/30'}`}>
                  <Camera className={`w-5 h-5 ${step === 'idle' ? 'text-red-500' : 'text-zinc-500'}`} />
                </div>
                <div>
                  <p className="text-white font-medium">1. Iniciar Cámara</p>
                  <p className="text-zinc-500 text-sm">Permite acceso a la cámara y micrófono</p>
                </div>
              </div>
              {step === 'idle' ? (
                <Button onClick={startCamera} className="bg-red-600 hover:bg-red-700 text-white gap-2">
                  <Camera className="w-4 h-4" />
                  Iniciar Cámara
                </Button>
              ) : (
                <Button onClick={stopCamera} variant="outline" className="border-zinc-700 text-zinc-400 gap-2">
                  <CameraOff className="w-4 h-4" />
                  Detener
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Preview */}
          <Card className={`bg-zinc-900 border-zinc-800 ${step !== 'preview' ? 'opacity-60' : ''}`}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${step === 'preview' ? 'bg-orange-600/20' : 'bg-zinc-700/30'}`}>
                  <Video className={`w-5 h-5 ${step === 'preview' ? 'text-orange-500' : 'text-zinc-500'}`} />
                </div>
                <div>
                  <p className="text-white font-medium">2. Vista Previa</p>
                  <p className="text-zinc-500 text-sm">Verifica que la imagen y el audio sean correctos</p>
                </div>
              </div>
              {step === 'preview' && (
                <Button onClick={() => setStep('ready')} className="bg-orange-600 hover:bg-orange-700 text-white gap-2">
                  <Smartphone className="w-4 h-4" />
                  Verificar y Continuar
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Step 3: Start Streaming */}
          <Card className={`bg-zinc-900 border-zinc-800 ${step !== 'ready' ? 'opacity-60' : ''}`}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${step === 'ready' ? 'bg-green-600/20' : 'bg-zinc-700/30'}`}>
                  <Send className={`w-5 h-5 ${step === 'ready' ? 'text-green-500' : 'text-zinc-500'}`} />
                </div>
                <div>
                  <p className="text-white font-medium">3. Iniciar Transmisión</p>
                  <p className="text-zinc-500 text-sm">Comienza a transmitir en vivo al canal principal</p>
                </div>
              </div>
              {step === 'ready' && !streaming && (
                <Button onClick={startStreaming} className="bg-green-600 hover:bg-green-700 text-white gap-2">
                  <Video className="w-4 h-4" />
                  Transmitir
                </Button>
              )}
              {streaming && (
                <Button onClick={stopStreaming} variant="destructive" className="gap-2">
                  <VideoOff className="w-4 h-4" />
                  Detener Transmisión
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Info */}
        <Card className="bg-zinc-900/50 border-zinc-800 mt-4">
          <CardContent className="p-4">
            <h3 className="text-white font-medium mb-2">Información importante</h3>
            <ul className="text-zinc-400 text-sm space-y-1.5">
              <li>• La cámara no se activa automáticamente por razones de privacidad</li>
              <li>• Para conectar la transmisión, configura &quot;Teléfono&quot; como fuente en el panel de administración</li>
              <li>• Se recomienda usar Wi-Fi para una transmisión estable</li>
              <li>• La calidad depende de tu conexión a internet</li>
            </ul>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  )
}
