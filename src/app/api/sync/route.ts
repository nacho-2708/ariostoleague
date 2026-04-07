import { NextRequest, NextResponse } from 'next/server'
import { getGameInfo } from '@/lib/fpl-api'
import { syncGW as doSyncGW, syncAllGWs as doSyncAllGWs } from '@/lib/fpl-sync'

// Protección básica con secret — configurar SYNC_SECRET en .env.local
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.SYNC_SECRET
  if (!secret) return false
  const provided = req.nextUrl.searchParams.get('secret')
    ?? req.headers.get('x-sync-secret')
  return provided === secret
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))

  // Acepta el secret en el body, query param, o header
  const secret = process.env.SYNC_SECRET
  const provided = body.secret
    ?? req.nextUrl.searchParams.get('secret')
    ?? req.headers.get('x-sync-secret')

  if (!secret || provided !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { gw, all, season = '2025/26' } = body

  try {
    if (all) {
      // Sincronizar todas las GWs hasta la actual
      const gameInfo = await getGameInfo()
      const upTo = gameInfo.currentGwFinished ? gameInfo.currentGw : gameInfo.currentGw - 1
      if (upTo < 1) {
        return NextResponse.json({ message: 'Ninguna GW finalizada aún' })
      }
      const results = await doSyncAllGWs(upTo, season)
      const total = results.reduce((s, r) => s + r.playersUpserted, 0)
      const errors = results.filter((r) => r.error)
      return NextResponse.json({ ok: true, gwsSynced: upTo, playersUpserted: total, errors })
    }

    if (gw) {
      const results = await doSyncGW(Number(gw), season)
      const total = results.reduce((s, r) => s + r.playersUpserted, 0)
      return NextResponse.json({ ok: true, gw, playersUpserted: total, results })
    }

    // Sin parámetros: sincronizar la última GW finalizada
    const gameInfo = await getGameInfo()
    const targetGW = gameInfo.currentGwFinished ? gameInfo.currentGw : gameInfo.currentGw - 1
    if (targetGW < 1) {
      return NextResponse.json({ message: 'Ninguna GW finalizada aún' })
    }
    const results = await doSyncGW(targetGW, season)
    const total = results.reduce((s, r) => s + r.playersUpserted, 0)
    return NextResponse.json({ ok: true, gw: targetGW, playersUpserted: total, results })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // GET: solo muestra el estado actual (qué GW está disponible)
  const gameInfo = await getGameInfo()
  return NextResponse.json({
    currentGw: gameInfo.currentGw,
    currentGwFinished: gameInfo.currentGwFinished,
    nextGw: gameInfo.nextGw,
    tip: 'POST /api/sync con { "all": true } para sincronizar todo, o { "gw": 31 } para una jornada específica',
  })
}
