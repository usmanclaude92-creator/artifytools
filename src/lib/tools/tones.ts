import type { CategoryId } from "./types";

export type Tone = "blue" | "violet" | "green" | "pink" | "amber";

/** Colour accent for each category's icon tiles (matches the approved design). */
export const categoryTones: Record<CategoryId, Tone> = {
  text: "blue",
  calculators: "green",
  developer: "violet",
  productivity: "amber",
  time: "pink",
  security: "green",
  images: "pink",
  pdf: "blue",
  ai: "violet",
};
