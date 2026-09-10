import { NextRequest, NextResponse } from 'next/server';
import { savePrediction } from '../../../lib/db';

const BASE = 'https://fifa-ai-trainer.lovable.app/api/public/predict';

type MatchInput = { id?: string; home: string; away: string; league?: string };

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const matches: MatchInput[] = Array.isArray(body.matches) ? body.matches.slice(0, 100) : [];
    if (!matches.length) {
      return NextResponse.json({ ok: false, error: 'matches requis' }, { status: 400 });
    }

    const response = await fetch(BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matches }),
      cache: 'no-store',
    });

    const data = await response.json();
    if (!response.ok) throw new Error(JSON.stringify(data));

    const predictions = Array.isArray(data.predictions) ? data.predictions : [];

    for (let i = 0; i < predictions.length; i++) {
      const item = predictions[i];
      const prediction = item?.prediction || item;
      const source = matches[i] || matches.find(m => m.id === item?.id) || matches[0];
      const result = prediction?.result || {};
      const pick = result?.pick || prediction?.pick || 'UNKNOWN';
      const confidence = Number(result?.confidence ?? prediction?.confidence ?? 0);
      const probability = confidence <= 1 ? confidence * 100 : confidence;
      const matchId = String(item?.id || source.id || `${source.home}-${source.away}`);

      await savePrediction({
        id: `${matchId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        matchId,
        home: prediction?.match?.home || source.home || '',
        away: prediction?.match?.away || source.away || '',
        league: prediction?.match?.league || source.league || '',
        market: '1X2',
        pick,
        probability,
        payload: prediction,
      });
    }

    return NextResponse.json({ ok: true, ...data });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Erreur du moteur de prédiction' },
      { status: 502 },
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const home = searchParams.get('home');
  const away = searchParams.get('away');
  const league = searchParams.get('league') || '';

  if (!home || !away) {
    return NextResponse.json({ ok: false, error: 'home et away requis' }, { status: 400 });
  }

  try {
    const url = new URL(BASE);
    url.searchParams.set('home', home);
    url.searchParams.set('away', away);
    url.searchParams.set('league', league);
    const response = await fetch(url.toString(), { cache: 'no-store' });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || 'Erreur API' }, { status: 502 });
  }
}
