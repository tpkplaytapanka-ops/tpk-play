'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, Tv, Radio, Music, Play, Smartphone, LayoutGrid } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  const navLinks = [
    { href: '/tv', label: 'Guia TV', icon: LayoutGrid },
    { href: '/tv/canal-en-vivo', label: 'En Vivo', icon: Play },
    { href: '/radio', label: 'Radio', icon: Radio },
    { href: '/musica', label: 'Musica', icon: Music },
    { href: '/stream/broadcast', label: 'Transmitir', icon: Smartphone },
  ]

  return (
    <nav className="sticky top-0 z-50 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-red-600 rounded-lg flex items-center justify-center group-hover:bg-red-500 transition-colors">
              <Play className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="text-xl font-black text-white tracking-tight">
              TPK <span className="text-red-500">PLAY</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden text-zinc-300 hover:text-white"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden border-t border-zinc-800 bg-zinc-950">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-3 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <link.icon className="w-5 h-5" />
                {link.label}
              </Link>
            ))}
            <div className="border-t border-zinc-800 mt-2 pt-2">
              <Link
                href="/tv/canal-1"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors text-sm"
              >
                <Tv className="w-4 h-4" />
                Senal Colombia
              </Link>
              <Link
                href="/tv/canal-2"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors text-sm"
              >
                <Tv className="w-4 h-4" />
                Citytv
              </Link>
              <Link
                href="/tv/canal-3"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors text-sm"
              >
                <Tv className="w-4 h-4" />
                Canal Institucional
              </Link>
              <Link
                href="/tv/canal-5"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors text-sm"
              >
                <Tv className="w-4 h-4" />
                Teleantioquia
              </Link>
              <Link
                href="/tv/canal-6"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors text-sm"
              >
                <Tv className="w-4 h-4" />
                Canal Trece
              </Link>
              <Link
                href="/tv/canal-7"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors text-sm"
              >
                <Tv className="w-4 h-4" />
                Noticias Caracol
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
