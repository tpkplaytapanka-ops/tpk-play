'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'
import { Plus, Trash2, Shuffle, Gift, Ticket } from 'lucide-react'

interface RaffleCode {
  id: string
  code: string
  prize: string
  isRedeemed: boolean
  redeemedBy: string | null
  redeemedAt: string | null
  createdAt: string
  expiresAt: string | null
}

interface Props {
  token: string
}

export default function RaffleTab({ token }: Props) {
  const [codes, setCodes] = useState<RaffleCode[]>([])
  const [loading, setLoading] = useState(true)
  const [newCode, setNewCode] = useState('')
  const [newPrize, setNewPrize] = useState('')
  const [bulkCount, setBulkCount] = useState('5')
  const [bulkPrize, setBulkPrize] = useState('')
  const [creating, setCreating] = useState(false)
  const [drawing, setDrawing] = useState(false)
  const [winners, setWinners] = useState<RaffleCode[]>([])

  const fetchCodes = useCallback(async () => {
    try {
      const res = await fetch('/api/codes', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setCodes(data)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchCodes()
  }, [fetchCodes])

  const handleCreateSingle = async () => {
    if (!newCode || !newPrize) {
      toast.error('Código y premio son requeridos')
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: newCode, prize: newPrize }),
      })
      if (res.ok) {
        toast.success(`Código ${newCode} creado`)
        setNewCode('')
        setNewPrize('')
        await fetchCodes()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error al crear código')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setCreating(false)
    }
  }

  const handleCreateBulk = async () => {
    const count = parseInt(bulkCount)
    if (!count || count < 1 || !bulkPrize) {
      toast.error('Cantidad y premio son requeridos')
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ count, prize: bulkPrize }),
      })
      if (res.ok) {
        const data = await res.json()
        toast.success(`${data.created} códigos creados`)
        setBulkPrize('')
        await fetchCodes()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error al crear códigos')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/codes?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        toast.success('Código eliminado')
        await fetchCodes()
      }
    } catch {
      toast.error('Error al eliminar')
    }
  }

  const handleDraw = async () => {
    setDrawing(true)
    setWinners([])
    try {
      const res = await fetch('/api/codes/draw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ count: 1 }),
      })
      if (res.ok) {
        const data = await res.json()
        setWinners(data.winners)
        toast.success('¡Sorteo realizado!')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error al sortear')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setDrawing(false)
    }
  }

  const redeemedCount = codes.filter(c => c.isRedeemed).length
  const availableCount = codes.filter(c => !c.isRedeemed).length

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-600/20 rounded-xl flex items-center justify-center">
              <Ticket className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{codes.length}</p>
              <p className="text-sm text-zinc-400">Total Códigos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-600/20 rounded-xl flex items-center justify-center">
              <Gift className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{availableCount}</p>
              <p className="text-sm text-zinc-400">Disponibles</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-zinc-600/20 rounded-xl flex items-center justify-center">
              <Ticket className="w-6 h-6 text-zinc-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{redeemedCount}</p>
              <p className="text-sm text-zinc-400">Canjeados</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Codes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Single */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white text-base">Crear Código Individual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label className="text-zinc-300">Código</Label>
              <Input
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                placeholder="TPK-XXXXXX"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Premio</Label>
              <Input
                value={newPrize}
                onChange={(e) => setNewPrize(e.target.value)}
                placeholder="Descripción del premio"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <Button
              onClick={handleCreateSingle}
              disabled={creating}
              className="bg-red-600 hover:bg-red-700 text-white w-full gap-2"
            >
              <Plus className="w-4 h-4" />
              Crear Código
            </Button>
          </CardContent>
        </Card>

        {/* Bulk */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white text-base">Crear Códigos Masivos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label className="text-zinc-300">Cantidad (máx. 100)</Label>
              <Input
                type="number"
                value={bulkCount}
                onChange={(e) => setBulkCount(e.target.value)}
                min="1"
                max="100"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Premio</Label>
              <Input
                value={bulkPrize}
                onChange={(e) => setBulkPrize(e.target.value)}
                placeholder="Descripción del premio"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <Button
              onClick={handleCreateBulk}
              disabled={creating}
              className="bg-orange-600 hover:bg-orange-700 text-white w-full gap-2"
            >
              <Plus className="w-4 h-4" />
              Crear {bulkCount} Códigos
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Draw */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-base">Sorteo Aleatorio</CardTitle>
            <Button
              onClick={handleDraw}
              disabled={drawing || availableCount === 0}
              className="bg-yellow-600 hover:bg-yellow-700 text-white gap-2"
            >
              <Shuffle className="w-4 h-4" />
              {drawing ? 'Sorteando...' : 'Realizar Sorteo'}
            </Button>
          </div>
        </CardHeader>
        {winners.length > 0 && (
          <CardContent>
            <div className="space-y-2">
              {winners.map((w) => (
                <div key={w.id} className="flex items-center gap-3 p-3 bg-yellow-600/10 border border-yellow-600/30 rounded-lg">
                  <Gift className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="text-white font-medium">{w.code}</p>
                    <p className="text-yellow-400 text-sm">{w.prize}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Codes List */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white text-base">Lista de Códigos</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-zinc-800 rounded animate-pulse" />
              ))}
            </div>
          ) : codes.length === 0 ? (
            <p className="text-zinc-500 text-center py-8">No hay códigos creados</p>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800">
                    <TableHead className="text-zinc-400">Código</TableHead>
                    <TableHead className="text-zinc-400">Premio</TableHead>
                    <TableHead className="text-zinc-400">Estado</TableHead>
                    <TableHead className="text-zinc-400">Canjeado por</TableHead>
                    <TableHead className="text-zinc-400 text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {codes.map((code) => (
                    <TableRow key={code.id} className="border-zinc-800">
                      <TableCell className="text-white font-mono font-medium">{code.code}</TableCell>
                      <TableCell className="text-zinc-300">{code.prize}</TableCell>
                      <TableCell>
                        <Badge variant={code.isRedeemed ? 'secondary' : 'default'} className={code.isRedeemed ? '' : 'bg-green-600'}>
                          {code.isRedeemed ? 'Canjeado' : 'Disponible'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-zinc-400 text-sm">{code.redeemedBy || '—'}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(code.id)}
                          className="text-zinc-500 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
