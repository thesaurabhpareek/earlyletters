/**
 * Bundled textures. Metro resolves each require() as an image asset; each is drawn at an explicit
 * size in points (the grain at tile / scale), so one file serves every screen density. Kept out of
 * src/tokens.ts so Node, tests and the web build can import tokens without loading binary files.
 *
 * grain: the light-scheme lamp's film grain (tokens.atmosphere.grain; made by src/build-grain.ts).
 */
declare const require: (path: string) => number;

export const grainTexture: number = require('./grain.png');
