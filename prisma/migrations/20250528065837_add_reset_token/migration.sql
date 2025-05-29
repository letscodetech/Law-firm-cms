/*
  Warnings:

  - You are about to drop the `AccountResetToken` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AccountResetToken" DROP CONSTRAINT "AccountResetToken_userId_fkey";

-- DropTable
DROP TABLE "AccountResetToken";

-- CreateTable
CREATE TABLE "account_reset_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "account_reset_tokens_token_key" ON "account_reset_tokens"("token");

-- AddForeignKey
ALTER TABLE "account_reset_tokens" ADD CONSTRAINT "account_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
