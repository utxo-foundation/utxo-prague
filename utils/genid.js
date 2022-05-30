export function genId(used) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  //const numbers = "";

  let output = null;
  for (const n of chars) {
    for (const ch of chars) {
      output = `${n}${ch}`;
      if (used.includes(output)) {
        continue;
      }
      return output;
    }
  }
  return false;
}
