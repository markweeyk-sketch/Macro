// @macro/core — food database and nutrition helpers

export const FOODS = [
  { id: 'f1',  name: 'Greek yogurt',         brand: 'Fage 2%',          per100: { kcal: 76,  p: 10,  c: 4,    f: 2.4 },
    units: [{ label: '1 cup (170g)', g: 170 }, { label: '½ cup (85g)', g: 85 }, { label: '1 oz', g: 28.35 }], emoji: '🥛' },
  { id: 'f2',  name: 'Banana',               brand: 'Medium',           per100: { kcal: 89,  p: 1.1, c: 22.8, f: 0.3 },
    units: [{ label: '1 medium (118g)', g: 118 }, { label: '1 small (101g)', g: 101 }, { label: '1 large (136g)', g: 136 }], emoji: '🍌' },
  { id: 'f3',  name: 'Oatmeal',              brand: 'Quaker rolled',    per100: { kcal: 71,  p: 2.5, c: 12,   f: 1.5 },
    units: [{ label: '1 cup cooked (234g)', g: 234 }, { label: '½ cup cooked (117g)', g: 117 }, { label: '½ cup dry (40g)', g: 40 }], emoji: '🥣' },
  { id: 'f4',  name: 'Chicken breast',       brand: 'Grilled',          per100: { kcal: 165, p: 31,  c: 0,    f: 3.6 },
    units: [{ label: '4 oz (113g)', g: 113 }, { label: '6 oz (170g)', g: 170 }, { label: '1 breast (174g)', g: 174 }], emoji: '🍗' },
  { id: 'f5',  name: 'Brown rice',           brand: 'Cooked',           per100: { kcal: 112, p: 2.6, c: 23.5, f: 0.9 },
    units: [{ label: '1 cup (195g)', g: 195 }, { label: '½ cup (98g)', g: 98 }], emoji: '🍚' },
  { id: 'f6',  name: 'Avocado',              brand: 'Hass',             per100: { kcal: 160, p: 2,   c: 8.5,  f: 14.7 },
    units: [{ label: '½ medium (100g)', g: 100 }, { label: '1 medium (200g)', g: 200 }, { label: '¼ medium (50g)', g: 50 }], emoji: '🥑' },
  { id: 'f7',  name: 'Almond butter',        brand: "Justin's",         per100: { kcal: 614, p: 21,  c: 19,   f: 56 },
    units: [{ label: '2 tbsp (32g)', g: 32 }, { label: '1 tbsp (16g)', g: 16 }], emoji: '🥜' },
  { id: 'f8',  name: 'Eggs',                 brand: 'Large, scrambled', per100: { kcal: 155, p: 13,  c: 1.1,  f: 11 },
    units: [{ label: '2 eggs (100g)', g: 100 }, { label: '1 egg (50g)', g: 50 }, { label: '3 eggs (150g)', g: 150 }], emoji: '🥚' },
  { id: 'f9',  name: 'Whey protein shake',   brand: 'Optimum',          per100: { kcal: 387, p: 77,  c: 9.7,  f: 3.2 },
    units: [{ label: '1 scoop (31g)', g: 31 }, { label: '2 scoops (62g)', g: 62 }], emoji: '🥤' },
  { id: 'f10', name: 'Sweet potato',         brand: 'Roasted',          per100: { kcal: 90,  p: 2,   c: 21,   f: 0.1 },
    units: [{ label: '1 medium (200g)', g: 200 }, { label: '1 small (130g)', g: 130 }, { label: '1 cup cubed (200g)', g: 200 }], emoji: '🍠' },
  { id: 'f11', name: 'Salmon fillet',        brand: 'Atlantic, baked',  per100: { kcal: 206, p: 22,  c: 0,    f: 12.4 },
    units: [{ label: '4 oz (113g)', g: 113 }, { label: '6 oz (170g)', g: 170 }, { label: '1 fillet (140g)', g: 140 }], emoji: '🐟' },
  { id: 'f12', name: 'Mixed greens salad',   brand: 'Spring mix',       per100: { kcal: 17,  p: 1.4, c: 3.3,  f: 0.2 },
    units: [{ label: '2 cups (118g)', g: 118 }, { label: '1 cup (59g)', g: 59 }], emoji: '🥗' },
  { id: 'f13', name: 'Olive oil',            brand: 'Extra virgin',     per100: { kcal: 884, p: 0,   c: 0,    f: 100 },
    units: [{ label: '1 tbsp (13.5g)', g: 13.5 }, { label: '1 tsp (4.5g)', g: 4.5 }], emoji: '🫒' },
  { id: 'f14', name: 'Almonds',              brand: 'Raw',              per100: { kcal: 579, p: 21,  c: 22,   f: 50 },
    units: [{ label: '¼ cup (36g)', g: 36 }, { label: '1 oz (28g)', g: 28 }, { label: '10 almonds (12g)', g: 12 }], emoji: '🌰' },
  { id: 'f15', name: 'Blueberries',          brand: 'Fresh',            per100: { kcal: 57,  p: 0.7, c: 14.5, f: 0.3 },
    units: [{ label: '1 cup (148g)', g: 148 }, { label: '½ cup (74g)', g: 74 }], emoji: '🫐' },
  { id: 'f16', name: 'Coffee with milk',     brand: 'Whole milk',       per100: { kcal: 17,  p: 0.9, c: 1.4,  f: 0.9 },
    units: [{ label: '12 oz (355g)', g: 355 }, { label: '8 oz (237g)', g: 237 }, { label: '16 oz (473g)', g: 473 }], emoji: '☕' },
  { id: 'f17', name: 'Cottage cheese',       brand: 'Low-fat',          per100: { kcal: 81,  p: 11,  c: 4.3,  f: 2.3 },
    units: [{ label: '½ cup (113g)', g: 113 }, { label: '1 cup (226g)', g: 226 }], emoji: '🧀' },
  { id: 'f18', name: 'Whole wheat toast',    brand: "Dave's",           per100: { kcal: 244, p: 12,  c: 50,   f: 3 },
    units: [{ label: '1 slice (45g)', g: 45 }, { label: '2 slices (90g)', g: 90 }], emoji: '🍞' },
];

export const FREQUENT_IDS = ['f4', 'f5', 'f1', 'f2', 'f9', 'f6', 'f3', 'f15'];

export const SEEDED_RECIPE_IDS = new Set(['r1', 'r2', 'r3', 'r4']);

export function nutritionFor(food, grams) {
  const r = grams / 100;
  return {
    kcal: food.per100.kcal * r,
    p:    food.per100.p    * r,
    c:    food.per100.c    * r,
    f:    food.per100.f    * r,
  };
}

export function calcGoal({ sex, age, heightCm, currentKg, targetKg, activity, mode, rate }) {
  const bmr = sex === 'male'
    ? 10 * currentKg + 6.25 * heightCm - 5 * age + 5
    : 10 * currentKg + 6.25 * heightCm - 5 * age - 161;
  const multipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, 'very-active': 1.9 };
  const tdee = bmr * (multipliers[activity] ?? 1.55);
  const effectiveRate = mode !== 'maintain' && rate ? rate : 0.5;
  const rateKcal = Math.round(effectiveRate * 7700 / 7);
  const offset = mode === 'lose' ? -rateKcal : mode === 'gain' ? rateKcal : 0;
  const kcal = Math.max(1200, Math.round(tdee + offset));
  const protein = Math.round((kcal * 0.30) / 4);
  const carbs   = Math.round((kcal * 0.40) / 4);
  const fat     = Math.round((kcal * 0.30) / 9);
  return {
    mode, rate: effectiveRate, kcal, protein, carbs, fat,
    weightKg: mode === 'maintain' ? currentKg : (targetKg || currentKg),
    startKg: currentKg, currentKg,
  };
}
