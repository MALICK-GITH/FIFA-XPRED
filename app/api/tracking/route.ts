import {NextRequest,NextResponse} from 'next/server';
import {listPredictions,settlePredictions} from '../../../lib/db';
export async function GET(){const rows=await listPredictions();const won=rows.filter((x:any)=>x.status==='WON').length;const settled=rows.filter((x:any)=>x.status==='WON'||x.status==='LOST').length;return NextResponse.json({ok:true,predictions:rows,rate:settled?Math.round(won/settled*1000)/10:0})}
export async function POST(req:NextRequest){const body=await req.json();await settlePredictions(body.matches||[]);return GET()}
