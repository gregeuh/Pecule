/** Exact critically damped motion; values are presentation only, never budget data. */
export function springStep(position: number, velocity: number, target: number, elapsed: number, frequency = 20) {
  const dt = Math.max(0, Math.min(elapsed, .05));
  const offset = position - target, impulse = velocity + frequency * offset, decay = Math.exp(-frequency * dt);
  return { position: target + (offset + impulse * dt) * decay, velocity: (velocity - frequency * impulse * dt) * decay };
}
