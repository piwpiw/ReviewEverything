import { NextResponse } from 'next/server';
import { getQualitySnapshot } from '@/lib/adminOps';
import { isAlertSuppressed } from '@/lib/alertState';

export async function GET() {
  try {
    const snapshot = await getQualitySnapshot();
    const activeAlerts = snapshot.alerts.filter((a) => !isAlertSuppressed(a.id));

    const status = activeAlerts.some((a) => a.level === 'critical')
      ? 'critical'
      : activeAlerts.some((a) => a.level === 'warn')
        ? 'warn'
        : 'ok';

    return NextResponse.json({
      status,
      measured_at: snapshot.measuredAt,
      window_hours: snapshot.windowHours,
      metrics: snapshot.metrics,
      thresholds: snapshot.thresholds,
      alerts_count: activeAlerts.length,
      suppressed_count: snapshot.alerts.length - activeAlerts.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'unknown_error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
