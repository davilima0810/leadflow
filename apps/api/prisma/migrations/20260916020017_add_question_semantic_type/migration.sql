-- CreateEnum
CREATE TYPE "QuestionSemanticType" AS ENUM ('NONE', 'CONTACT_NAME', 'CONTACT_PHONE', 'CONTACT_EMAIL');

-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "semantic_type" "QuestionSemanticType" NOT NULL DEFAULT 'NONE';
