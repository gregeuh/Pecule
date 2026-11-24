/** Animate a visual surface independently from the live, final-size form.
 * Only transforms change geometry; fields and text never scale or reflow per frame.
 * The temporary layer has no content, focus target or financial information.
 */
export function morphModalSurface(
  panel: HTMLElement,
  from: DOMRect,
  to: DOMRect,
  options: KeyframeAnimationOptions,
  source?: HTMLElement | null,
) {
  if (!panel.parentElement || !from.width || !from.height || !to.width || !to.height) return null;
  const style = getComputedStyle(panel),
    originStyle = source ? getComputedStyle(source) : style;
  const surface = document.createElement("div");
  surface.className = "modal-morph-surface";
  surface.setAttribute("aria-hidden", "true");
  surface.inert = true;
  Object.assign(surface.style, {
    position: "fixed",
    left: `${to.left}px`,
    top: `${to.top}px`,
    width: `${to.width}px`,
    height: `${to.height}px`,
    background: style.backgroundColor,
    borderRadius: style.borderRadius,
    boxShadow: style.boxShadow,
    transformOrigin: "0 0",
    pointerEvents: "none",
  });
  panel.before(surface);
  const animation = surface.animate(
    [
      {
        transform: `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width}, ${from.height / to.height})`,
        backgroundColor: originStyle.backgroundColor,
        borderRadius: originStyle.borderRadius,
      },
      { transform: "none", backgroundColor: style.backgroundColor, borderRadius: style.borderRadius },
    ],
    { ...options, fill: "both" },
  );
  void animation.finished.catch(() => {}).then(() => surface.remove());
  return animation;
}
