import Link from 'next/link'
import { Play, Heart } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-zinc-950 border-t border-zinc-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <Play className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="text-lg font-black text-white tracking-tight">
              TPK <span className="text-red-500">PLAY</span>
            </span>
          </Link>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm text-zinc-400">
            <Link href="/tv/canal-en-vivo" className="hover:text-white transition-colors">
              En Vivo
            </Link>
            <Link href="/tv/canal-1" className="hover:text-white transition-colors">
              TV
            </Link>
            <Link href="/radio" className="hover:text-white transition-colors">
              Radio
            </Link>
            <Link href="/musica" className="hover:text-white transition-colors">
              Música
            </Link>
          </div>

          {/* Copyright */}
          <div className="flex items-center gap-1 text-sm text-zinc-500">
            <span>Hecho con</span>
            <Heart className="w-4 h-4 text-red-500 fill-red-500" />
            <span>en Colombia</span>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-zinc-800 text-center text-xs text-zinc-600">
          © {new Date().getFullYear()} TPK PLAY — Tapán Kat PK. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  )
}
