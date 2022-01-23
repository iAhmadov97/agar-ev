export const NumberFormator = (num: number) => {
  if (num >= 1e9) {
    let h = (num / 1e9).toFixed(1).replace(/\.0$/, "");
    if (h.length >= 2) h = h.charAt(0) + h.slice(-(h.length - 1));
    return h + "G";
  }
  if (num >= 1e6) {
    let h = (num / 1e6).toFixed(1).replace(/\.0$/, "");
    if (h.length >= 2) h = h.charAt(0) + h.slice(-(h.length - 1));
    return h + "M";
  }
  if (num >= 1e3) {
    let h = (num / 1e3).toFixed(1).replace(/\.0$/, "");
    if (h.length >= 2) h = h.charAt(0) + h.slice(-(h.length - 1));
    return h + "K";
  }
  return num;
};
