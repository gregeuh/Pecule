# Pécule Lottie illustrations

`app/animations/confirmation.json` is an original vector animation authored for
Pécule: a drawn check and three Atelier accents. No marketplace animation or
third-party illustration was copied. It plays once (0.8 seconds), without audio.

Renderer: official LottieFiles `@lottiefiles/dotlottie-web` 0.81.0, MIT license
(copied alongside the binary as DOTLOTTIE-LICENSE).
Source: https://github.com/LottieFiles/dotlottie-web
The matching `dist/dotlottie-player.wasm` is self-hosted here, versioned in its
filename. When upgrading the package, replace the binary and update its URL in
app/confirmation-art.tsx. No LottieFiles account, CDN, or telemetry is involved.

The static SVG check is immediate and remains on reduced motion, forced colors,
or renderer/network failure. Runtime palette follows the notification text color;
apricot and lavender accents are decorative, never financial status indicators.
