import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

console.log(
  await prisma.location.findMany({
    take: 10,
  })
);
