import { NextResponse } from 'next/server';
import { getQualitySnapshot } from '@/lib/adminOps';
import { getSuppressionSnapshot, isAlertSuppressed } from '@/lib/alertState';

export async function GET() {
  try {
    const snapshot = await getQualitySnapshot();
    const activeAlerts = snapshot.alerts.filter((a) => !isAlertSuppressed(a.id));
    const critical = activeAlerts.filter((a) => a.level === 'critical').length;
    const warn = activeAlerts.filter((a) => a.level === 'warn').length;

    return NextResponse.json({
      status: activeAlerts.some((a) => a.level === 'critical')
        ? 'critical'
        : activeAlerts.some((a) => a.level === 'warn')
          ? 'warn'
          : 'ok',
      measured_at: snapshot.measuredAt,
      summary: {
        total: activeAlerts.length,
        critical,
        warn,
      },
      suppressed: getSuppressionSnapshot(),
      data: activeAlerts,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'unknown_error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
