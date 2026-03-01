-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_userId_fkey";

-- DropTable
DROP TABLE "Task";

-- DropEnum
DROP TYPE "TaskCategory";
