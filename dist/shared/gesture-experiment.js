/* Optional device-diagnosis path. The default journey keeps native scrolling. */
(() => {
  'use strict';
  if (new URL(location.href).searchParams.get('input') !== 'gesture') return;
  const root = document.documentElement;
  const plane = document.querySelector('#travel-input');
  const journey = document.querySelector('#journey');
  if (!plane || !journey || !('PointerEvent' in window) || typeof plane.setPointerCapture !== 'function' || !CSS.supports('touch-action', 'pinch-zoom')) return;

  const contacts = new Set();
  let gesture = null, touchCount = 0, blockedSequence = false;
  let moves = 0, lastCancellation = '', captureFailed = false;
  const scale = () => window.visualViewport?.scale || 1;
  const enabled = () => !captureFailed && root.classList.contains('portal-mode') && !document.hidden && scale() <= 1.01;
  const passiveCapture = { passive: true, capture: true };

  function cancel(reason) {
    const previous = gesture;
    gesture = null;
    lastCancellation = reason;
    if (previous && plane.hasPointerCapture?.(previous.id)) {
      try { plane.releasePointerCapture(previous.id); } catch (_) { /* Already canceled by the browser. */ }
    }
  }
  function updateTouchAction() {
    // Zoomed pages must regain ordinary one-finger browser panning.
    plane.style.touchAction = enabled() ? 'pinch-zoom' : 'auto';
    root.dataset.inputMode = enabled() ? 'gesture' : 'native';
  }
  function reset(reason) {
    cancel(reason);
    contacts.clear();
    touchCount = 0;
    blockedSequence = false;
    updateTouchAction();
  }
  document.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'touch') { cancel('other pointer'); return; }
    contacts.add(event.pointerId);
    if (contacts.size > 1 || touchCount > 1) {
      blockedSequence = true;
      cancel('multiple contacts');
      return;
    }
    if (!event.isPrimary || blockedSequence || event.target !== plane || !enabled()) {
      cancel('native target or mode');
      return;
    }
    gesture = { id: event.pointerId, y: event.clientY };
    try { plane.setPointerCapture(event.pointerId); } catch (_) { captureFailed = true; cancel('capture unavailable'); updateTouchAction(); }
  }, passiveCapture);
  document.addEventListener('pointermove', event => {
    if (!gesture || event.pointerId !== gesture.id) return;
    if (!enabled() || blockedSequence || contacts.size !== 1 || touchCount > 1) {
      cancel('native gesture takeover');
      return;
    }
    const delta = gesture.y - event.clientY;
    gesture.y = event.clientY;
    const maximum = Math.max(0, journey.scrollHeight - journey.clientHeight);
    journey.scrollTop = Math.max(0, Math.min(maximum, journey.scrollTop + delta));
    moves++;
  }, passiveCapture);
  function endPointer(event) {
    contacts.delete(event.pointerId);
    if (gesture?.id === event.pointerId) cancel(event.type);
    if (!contacts.size && !touchCount) blockedSequence = false;
  }
  document.addEventListener('pointerup', endPointer, passiveCapture);
  document.addEventListener('pointercancel', endPointer, passiveCapture);
  plane.addEventListener('lostpointercapture', event => {
    if (gesture?.id === event.pointerId) cancel('lost capture');
  }, { passive: true });
  document.addEventListener('touchstart', event => {
    touchCount = event.touches.length;
    if (touchCount > 1) { blockedSequence = true; cancel('browser pinch'); }
  }, passiveCapture);
  function endTouch(event) {
    touchCount = event.touches.length;
    if (event.type === 'touchcancel') cancel('touch canceled');
    if (!touchCount) { cancel('touch sequence ended'); contacts.clear(); blockedSequence = false; }
  }
  document.addEventListener('touchend', endTouch, passiveCapture);
  document.addEventListener('touchcancel', endTouch, passiveCapture);
  document.addEventListener('wheel', () => cancel('wheel'), passiveCapture);
  document.addEventListener('keydown', () => cancel('keyboard'), passiveCapture);
  document.addEventListener('click', () => cancel('control'), passiveCapture);
  window.addEventListener('resize', () => { cancel('resize'); updateTouchAction(); }, { passive: true });
  window.visualViewport?.addEventListener('resize', () => { cancel('visual viewport'); updateTouchAction(); }, { passive: true });
  window.addEventListener('pagehide', () => reset('page hidden'), { passive: true });
  document.addEventListener('visibilitychange', () => reset('visibility changed'));
  new MutationObserver(() => { cancel('mode changed'); updateTouchAction(); })
    .observe(root, { attributes: true, attributeFilter: ['class'] });
  updateTouchAction();
  window.realmInputDiagnostics = () => ({
    experimental: true, mode: root.dataset.inputMode, active: !!gesture,
    contacts: contacts.size, touchCount, blockedSequence, moves,
    scale: scale(), lastCancellation, momentum: false
  });
})();
