import { NextRequest, NextResponse } from 'next/server';
import { applyAlertAction } from '@/lib/alertState';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = String(body?.id || '').trim();
    const action = String(body?.action || '').trim();
    const note = typeof body?.note === 'string' ? body.note.trim() : undefined;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    if (action !== 'ack' && action !== 'snooze') {
      return NextResponse.json({ error: 'action must be ack or snooze' }, { status: 400 });
    }

    const minutes = action === 'ack'
      ? 120
      : Number.isFinite(Number(body?.minutes))
        ? Number(body.minutes)
        : 24 * 60;

    const applied = applyAlertAction(id, action, minutes, note);

    return NextResponse.json({
      ok: true,
      data: applied,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'unknown_error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
