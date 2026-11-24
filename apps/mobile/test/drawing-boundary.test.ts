/**
 * [BL-467 point 2] A drawing that throws leaves the plain screen working: the boundary draws nothing for it and
 * still draws everything else. React's own contract is followed here (render, on a throw take getDerivedStateFromError,
 * render again), since the repo has no DOM renderer.
 */
import { describe, expect, it } from 'vitest';
import { DrawingBoundary } from '../src/components/resilience/drawing-boundary';

/** One pass of React's error-boundary contract for a class boundary whose child is `draw`. */
function run(draw: () => unknown): unknown {
  const make = () => {
    try {
      return new DrawingBoundary({ children: draw() as never });
    } catch {
      return null; // the child threw while drawing
    }
  };
  const b = make();
  if (b) return b.render();
  const failed = new DrawingBoundary({ children: null });
  failed.state = { ...failed.state, ...DrawingBoundary.getDerivedStateFromError() };
  return failed.render();
}

describe('[BL-467] DrawingBoundary', () => {
  it('shows the drawing when it draws', () => {
    expect(run(() => 'drawing')).toBe('drawing');
  });

  it('draws nothing, and does not throw, when the drawing throws', () => {
    expect(run(() => { throw new Error('react-native-svg is missing'); })).toBeNull();
  });

  it('stays on nothing once failed, even if the drawing would work again', () => {
    const b = new DrawingBoundary({ children: 'drawing' });
    b.state = { ...DrawingBoundary.getDerivedStateFromError() };
    expect(b.render()).toBeNull();
  });
});
