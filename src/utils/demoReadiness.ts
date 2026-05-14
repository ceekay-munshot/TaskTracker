/** Client Demo Readiness Mode — checklist roll-up. */
import type { DemoReadinessItem, DemoReadinessResult } from '@/types';

/** Default checklist seeded for every new dashboard / agent / workflow. */
export const DEFAULT_READINESS_LABELS: string[] = [
  'UI complete',
  'Data connected / mock marked',
  'Exports working',
  'Agent integration done / not required',
  'Bugs fixed',
  'Vipul approved',
  'Chiraag reviewed',
  'Client feedback handled',
  'PPT / Excel tested',
];

export function computeDemoReadiness(
  items: DemoReadinessItem[],
): DemoReadinessResult {
  const total = items.length;
  const applicable = items.filter((i) => i.status !== 'Not Required').length;
  const done = items.filter((i) => i.status === 'Done').length;
  const percent = applicable === 0 ? 0 : Math.round((done / applicable) * 100);

  let badge: DemoReadinessResult['badge'] = 'Not Ready';
  if (applicable > 0 && percent >= 100) badge = 'Demo Ready';
  else if (percent >= 60) badge = 'Almost Ready';

  return { done, applicable, total, percent, badge };
}
