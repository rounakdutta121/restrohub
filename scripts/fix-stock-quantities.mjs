import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Manual repair for known corrupted rows (units were already cleaned to "kg")
const repairs = [
  { name: "flour", quantity: 1.5, reorderLevel: 5.2 },
  { name: "tea", quantity: 10.205, reorderLevel: 10 },
];

const stock = await prisma.ingredientStock.findMany({ include: { ingredient: true } });

for (const row of stock) {
  const repair = repairs.find((r) => r.name === row.ingredient.name);
  if (!repair) continue;

  await prisma.ingredientStock.update({
    where: { id: row.id },
    data: {
      quantity: repair.quantity,
      reorderLevel: repair.reorderLevel,
    },
  });
  console.log(
    `Repaired "${row.ingredient.name}": qty → ${repair.quantity}, reorder → ${repair.reorderLevel} ${row.ingredient.unit}`
  );
}

const after = await prisma.ingredientStock.findMany({ include: { ingredient: true } });
console.log("AFTER:", JSON.stringify(after, null, 2));

await prisma.$disconnect();
