import { NextRequest, NextResponse } from 'next/server'
import { getGameInfo } from '@/lib/fpl-api'
import {
  syncGWChecked as doSyncGWChecked,
  syncAllGWs as doSyncAllGWs,
  getSeasonMeta,
  backfillFixtures,
  backfillTeamSeasons,
  finalizeSeason,
} from '@/lib/fpl-sync'
import { resolveUpTo, summarizeReports, type GWSyncReport } from '@/lib/fpl-sync-guards'

// Traduce los reportes por GW a una respuesta HTTP: ok:false + 422 si alguna GW
// quedó incompleta (en vez del viejo ok:true + 200 a ciegas).
function buildSyncResponse(reports: GWSyncReport[]) {
  const summary = summarizeReports(reports)
  return NextResponse.json(
    {
      ok: summary.ok,
      gwsSynced: reports.map((r) => r.gw),
      totalSavedRows: summary.totalSavedRows,
      incompleteGws: summary.incompleteGws,
      reports,
    },
    { status: summary.status },
  )
}

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

  const { gw, all, season = '2025/26', action, championAlias } = body

  try {
    if (action === 'finalize-season') {
      if (!championAlias) {
        return NextResponse.json({ error: 'championAlias requerido' }, { status: 400 })
      }
      const fixturesResult = await backfillFixtures(season)
      const teamSeasonsResult = await backfillTeamSeasons(season)
      const finalizeResult = await finalizeSeason(season, championAlias)
      return NextResponse.json({ ok: true, ...fixturesResult, ...teamSeasonsResult, ...finalizeResult })
    }

    if (all) {
      // Temporada en curso → hasta la última GW finalizada (en vivo). Temporada
      // terminada → rango fijo 1..38 (no dependemos de getGameInfo, que tras la
      // rotación devolvería una GW baja de la temporada siguiente).
      const meta = await getSeasonMeta(season)
      const live = meta.isCurrent
        ? await getGameInfo()
        : { currentGw: 0, currentGwFinished: false }
      const upTo = resolveUpTo(meta.isCurrent, live)
      if (upTo < 1) {
        return NextResponse.json({ message: 'Ninguna GW finalizada aún' })
      }
      const reports = await doSyncAllGWs(upTo, season)
      return buildSyncResponse(reports)
    }

    if (gw) {
      const report = await doSyncGWChecked(Number(gw), season)
      return buildSyncResponse([report])
    }

    // Sin parámetros: sincronizar la última GW finalizada
    const gameInfo = await getGameInfo()
    const targetGW = gameInfo.currentGwFinished ? gameInfo.currentGw : gameInfo.currentGw - 1
    if (targetGW < 1) {
      return NextResponse.json({ message: 'Ninguna GW finalizada aún' })
    }
    const report = await doSyncGWChecked(targetGW, season)
    return buildSyncResponse([report])

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
