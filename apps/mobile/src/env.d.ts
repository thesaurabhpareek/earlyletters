/// <reference types="expo/types" />

export {};

// Side-effect stylesheet imports (Uniwind entry, src/global.css).
declare module '*.css';

// whisper.rn ships TypeScript source (resolved via the "react-native"
// export condition) that uses the Node-style `global` alias.
declare global {
  var global: typeof globalThis;
}
