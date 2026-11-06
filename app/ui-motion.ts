/** CSS owns motion timing for both declarative and interruptible animations. */
export function motionSettings(element: Element) {
  const style = getComputedStyle(element);
  const duration = (name: string, fallback: number) => parseFloat(style.getPropertyValue(name)) || fallback;
  return {
    release: duration("--motion-release", 260),
    walletEnter: duration("--motion-wallet-in", 520),
    walletExit: duration("--motion-wallet-out", 320),
    state: duration("--motion-state", 240),
    feedback: duration("--motion-feedback", 160),
    enter: duration("--motion-panel-in", 380),
    exit: duration("--motion-panel-out", 240),
    layout: duration("--motion-layout", 320),
    disclosureExit: duration("--motion-disclosure-out", 220),
    ease: style.getPropertyValue("--motion-settle").trim() || "cubic-bezier(.22,1,.36,1)",
    exitEase: style.getPropertyValue("--motion-exit").trim() || "cubic-bezier(.4,0,.2,1)",
  };
}
