// Tomato paste whose substitutes keep its liquid in a braise or soup: passata and fresh
// tomatoes bring their own, so the pot needs less water; ketchup is diluted like paste.
const tomatoWater = { passata: -100, tomato: -150, ketchup: 0 };

export function tomatoesKeepingLiquid(tomato) {
  const paste = tomato();
  return {
    ...paste,
    alternatives: paste.alternatives.map((a) => ({ ...a, waterDelta: tomatoWater[a.id] })),
  };
}
