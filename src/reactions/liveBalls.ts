/** Μία παρατήρηση ορατότητας και έως οκτώ κινούμενες φιγούρες ανά σελίδα. */
export function createLiveBalls() {
  const balls = new Map<HTMLElement, { visible: boolean; active: boolean; notify: (active: boolean) => void }>();
  let observer: IntersectionObserver | undefined;
  let reduced = false;
  const refresh = () => {
    let count = 0;
    for (const [element, ball] of balls) {
      const active = ball.visible && count++ < 8;
      element.dataset.motion = reduced ? 'reduced' : 'full';
      if (active !== ball.active) { ball.active = active; ball.notify(active); }
      if (!active || reduced) {
        element.style.setProperty('--cb-look-x', '0px');
        element.style.setProperty('--cb-look-y', '0px');
      }
    }
  };
  return {
    registerBall(element: HTMLElement, notify: (active: boolean) => void) {
      if (!observer && typeof IntersectionObserver !== 'undefined') {
        observer = new IntersectionObserver((entries) => {
          for (const entry of entries) {
            const ball = balls.get(entry.target as HTMLElement);
            if (ball) ball.visible = entry.isIntersecting;
          }
          refresh();
        });
      }
      balls.set(element, { visible: !observer, active: false, notify });
      observer?.observe(element);
      refresh();
      return () => {
        observer?.unobserve(element); balls.delete(element); refresh();
        if (!balls.size) { observer?.disconnect(); observer = undefined; }
      };
    },
    setReducedMotion(value: boolean) { reduced = value; refresh(); },
    moveEyes(x: number, y: number) {
      if (reduced) return;
      // Όλες οι αναγνώσεις γεωμετρίας προηγούνται των εγγραφών CSS.
      const positions = [...balls].filter(([, ball]) => ball.active).map(([element]) => {
        const box = element.getBoundingClientRect();
        const dx = x - box.x - box.width / 2;
        const dy = y - box.y - box.height / 2;
        const scale = 3 / Math.max(60, Math.hypot(dx, dy));
        return { element, dx: dx * scale, dy: dy * scale };
      });
      for (const { element, dx, dy } of positions) {
        element.style.setProperty('--cb-look-x', `${dx.toFixed(2)}px`);
        element.style.setProperty('--cb-look-y', `${dy.toFixed(2)}px`);
      }
    },
  };
}
