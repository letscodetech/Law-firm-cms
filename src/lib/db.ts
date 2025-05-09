import { PrismaClient } from "../../prisma/prisma/generated/client";
const db = new PrismaClient();

export { db };
