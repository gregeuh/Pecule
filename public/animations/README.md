# Pécule — les petits pas

Original Pécule vector scenes in `app/animations/*.json`; no marketplace artwork
was copied. The wallet, engraved piece and restrained Atelier colors are shared
across operation, recurrence, import, savings, milestone and preferences scenes.
One shot, 1.3–2 seconds; no audio, no loop, no delay to saving or dismissing.

Source: `scripts/generate-signature-animations.py`. Regenerate from the project
root using `python scripts/generate-signature-animations.py`. Assets are committed;
Python is not required to build or use the app. Colors follow the accepted Atelier
palette (evergreen #235746, mint #a4d9be, apricot #f5c39e, lavender #e2d6f5) with
local edge/highlight shades. The identity colors intentionally stay the same on
the light and dark notification surfaces; text follows the runtime theme tokens.

Renderer: official LottieFiles `@lottiefiles/dotlottie-web` 0.81.0, MIT license
(copied alongside the binary as DOTLOTTIE-LICENSE).
Source: https://github.com/LottieFiles/dotlottie-web
The matching `dist/dotlottie-player.wasm` is self-hosted here, versioned in its
filename. When upgrading the package, replace the binary and update its URL in
app/confirmation-art.tsx. No LottieFiles account, CDN, or telemetry is involved.

A static, action-specific Lucide symbol is immediate and remains on reduced
motion, forced colors, or renderer/network failure. Only confirmed saves start
a success scene; an import is never presented as actual bank synchronization,
and the savings scene never claims to have initiated a bank transfer.
