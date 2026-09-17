const fs = require("fs/promises");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const seedPath = path.join(__dirname, "seed-foods.json");
  const raw = await fs.readFile(seedPath, "utf8");
  const foods = JSON.parse(raw);

  await prisma.food.deleteMany();

  for (const food of foods) {
    await prisma.food.create({
      data: {
        id: food.id,
        name: food.name,
        category: food.category,
        description: food.description,
        calories: food.calories,
        tags: food.tags,
        apiKey: food.apiKey,
        createdAt: new Date(food.createdAt),
        updatedAt: new Date(food.updatedAt),
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
