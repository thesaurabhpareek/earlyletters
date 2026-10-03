export default {
  bottomThin: { seed: 10, rings: [{ R: 23, wmin: 3, wmax: 14, thin: 90 }, { R: 41, wmin: 3, wmax: 16, thin: 90 }] },
  drift: { cx: 52, seed: 10, rings: [{ R: 23, wmin: 3, wmax: 14, thin: 90 + 25 }, { R: 41, wmin: 3, wmax: 16, thin: 90 - 25 }] },
  driftL: { cx: 48, seed: 10, rings: [{ R: 23, wmin: 3, wmax: 14, thin: 90 - 25 }, { R: 41, wmin: 3, wmax: 16, thin: 90 + 25 }] },
  same: { cx: 46, seed: 10, rings: [{ R: 23, wmin: 3, wmax: 14, thin: 90 + 20 }, { R: 41, wmin: 3, wmax: 16, thin: 90 + 20 }] },
};
