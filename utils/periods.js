import { format, parse } from "https://deno.land/std@0.139.0/datetime/mod.ts";

export function getDate(time) {
  return format(new Date(time), "yyyy-MM-dd");
}

export function isPeriodOverlap(x, y) {
  return (new Date(x.start).getTime() < new Date(y.end).getTime() &&
    new Date(x.end).getTime() > new Date(y.start).getTime());
}
