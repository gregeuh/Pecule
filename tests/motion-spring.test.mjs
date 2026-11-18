import test from 'node:test';
import assert from 'node:assert/strict';
import { springStep } from '../lib/motion-spring.ts';

test('damped motion converges without overshooting at 30, 60 and 120 Hz', () => {
  for (const hz of [30, 60, 120]) for (const [from, target] of [[52, 320], [320, 52]]) {
    let state = { position: from, velocity: 0 }, prior = from;
    for (let i = 0; i < hz; i++) {
      state = springStep(state.position, state.velocity, target, 1 / hz);
      assert(state.position >= Math.min(from, target) && state.position <= Math.max(from, target));
      assert(target > from ? state.position >= prior : state.position <= prior);
      prior = state.position;
    }
    assert(Math.abs(state.position - target) < .01);
  }
});
test('exact integration is independent of frame partition and keeps velocity on reversal', () => {
  const full = springStep(52, 0, 320, .032);
  const half = springStep(52, 0, 320, .016), split = springStep(half.position, half.velocity, 320, .016);
  assert(Math.abs(full.position - split.position) < 1e-9);
  assert(Math.abs(full.velocity - split.velocity) < 1e-9);
  const reverse = springStep(full.position, full.velocity, 52, .001);
  assert(reverse.position > full.position, 'Inertia is preserved before the new target reverses movement');
  assert(reverse.velocity < full.velocity && reverse.velocity > 0);
});
test('background-size time gaps are bounded and a resting value remains stable', () => {
  assert.deepEqual(springStep(52, 0, 320, 10), springStep(52, 0, 320, .05));
  assert.deepEqual(springStep(320, 0, 320, .016), { position: 320, velocity: 0 });
  assert.deepEqual(springStep(52, 0, 320, -.2), { position: 52, velocity: 0 });
});
