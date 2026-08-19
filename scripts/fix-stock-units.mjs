import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function normalizeUnit(unit) {
  const trimmed = unit.trim().toLowerCase();
  const match = trimmed.match(/^[\d.]+(.+)$/);
  if (match) return match[1].trim() || "kg";
  return trimmed || "kg";
}

function repairQuantityFromUnit(quantity, unit) {
  const match = unit.trim().match(/^([\d.]+)\s*([a-z]+)$/i);
  if (!match || match[1].includes(".")) return quantity;
  const combined = parseFloat(`${quantity}.${match[1]}`);
  return Number.isFinite(combined) ? combined : quantity;
}

function repairReorderLevel(reorderLevel, unit) {
  const match = unit.trim().match(/^([\d.]+)\s*([a-z]+)$/i);
  if (!match || match[1].includes(".")) return reorderLevel;
  const prefix = match[1];
  const str = String(reorderLevel);
  if (str.startsWith(prefix) && str.length > prefix.length) {
    const candidate = parseFloat(`${prefix}.${str.slice(prefix.length)}`);
    if (Number.isFinite(candidate) && candidate < reorderLevel) return candidate;
  }
  return reorderLevel;
}

const ingredients = await prisma.ingredient.findMany();

for (const ing of ingredients) {
  const cleanUnit = normalizeUnit(ing.unit);
  if (cleanUnit !== ing.unit) {
    await prisma.ingredient.update({ where: { id: ing.id }, data: { unit: cleanUnit } });
    console.log(`Fixed ingredient "${ing.name}": unit "${ing.unit}" → "${cleanUnit}"`);
  }
}

const stock = await prisma.ingredientStock.findMany({ include: { ingredient: true } });

for (const row of stock) {
  const unit = row.ingredient.unit;
  const hasCorrupt = /^[\d.]+[a-z]/i.test(unit.trim());
  if (!hasCorrupt) continue;

  const quantity = repairQuantityFromUnit(row.quantity, unit);
  const reorderLevel = repairReorderLevel(row.reorderLevel, unit);

  await prisma.ingredientStock.update({
    where: { id: row.id },
    data: { quantity, reorderLevel },
  });
  console.log(
    `Fixed stock "${row.ingredient.name}": qty ${row.quantity}→${quantity}, reorder ${row.reorderLevel}→${reorderLevel}`
  );
}

const after = await prisma.ingredientStock.findMany({ include: { ingredient: true } });
console.log("AFTER:", JSON.stringify(after, null, 2));

await prisma.$disconnect();
