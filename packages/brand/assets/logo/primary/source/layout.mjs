// Placement of the pair in the 1024 app-icon tile, and tile SVGs for sketches and proofs.
import { bbox, transform, areaCentroid, toD } from './g2.mjs';

export const TILE = {
  top: '#9A613C', bottom: '#7F4F30', mark: '#FBF8F3',        // default (color-type "Leather T")
  darkTop: '#2C2926', darkBottom: '#1F1B18', darkMark: '#D9A47E',
  tintMark: '#FFFFFF', tintBg: '#000000',
};

/**
 * Scale the pair so its bbox height is `box` x 1024, then move it so its MASS centre sits at
 * (512 + mx, 512 + my). The defaults put the mass a touch above-right of where Y had it: a bottom-heavy
 * mark looks centred when its mass sits slightly below the geometric centre (identity critic: ~505, 525).
 */
export function place(shapes, { box = 0.56, mx = -4, my = 14 } = {}) {
  const b = bbox(shapes), s = (box * 1024) / b.h;
  const scaled = shapes.map((sh) => transform(sh, { s }));
  const m = areaCentroid(scaled);
  const tx = 512 + mx - m.cx, ty = 512 + my - m.cy;
  const placed = scaled.map((sh) => transform(sh, { tx, ty }));
  return { shapes: placed, d: toD(placed), box: bbox(placed), mass: areaCentroid(placed), s };
}

export function tileSvg(pl, px, { mode = 'default', radius = 0 } = {}) {
  const T = TILE;
  const [top, bot, fg] = mode === 'dark' ? [T.darkTop, T.darkBottom, T.darkMark] : mode === 'tinted' ? [T.tintBg, T.tintBg, '#E6E6E6'] : mode === 'paper' ? ['#FBF8F3', '#FBF8F3', '#7F4F30'] : [T.top, T.bottom, T.mark];
  const id = 'g' + Math.random().toString(36).slice(2, 8);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 1024 1024"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bot}"/></linearGradient></defs><rect width="1024" height="1024" rx="${1024 * radius}" fill="url(#${id})"/><path fill="${fg}" d="${pl.d}"/></svg>`;
}
