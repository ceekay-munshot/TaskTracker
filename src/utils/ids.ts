/** Collision-resistant id generator for client-side entities. */
export function uid(prefix = 'id'): string {
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 9);
  return `${prefix}_${time}${rand}`;
}
