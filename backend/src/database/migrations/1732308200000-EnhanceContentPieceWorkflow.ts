import { MigrationInterface, QueryRunner } from "typeorm";

export class EnhanceContentPieceWorkflow1732308200000 implements MigrationInterface {
    name = 'EnhanceContentPieceWorkflow1732308200000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Update existing data: rename ai_generated to draft BEFORE changing enum
        await queryRunner.query(`UPDATE "content_pieces" SET "review_state" = 'draft' WHERE "review_state" = 'ai_generated'`);
        await queryRunner.query(`UPDATE "reviews" SET "previous_state" = 'draft' WHERE "previous_state" = 'ai_generated'`);
        await queryRunner.query(`UPDATE "reviews" SET "new_state" = 'draft' WHERE "new_state" = 'ai_generated'`);

        // Drop the default constraint temporarily
        await queryRunner.query(`ALTER TABLE "content_pieces" ALTER COLUMN "review_state" DROP DEFAULT`);

        // Update the review_state_enum to include new states
        await queryRunner.query(`ALTER TYPE "public"."review_state_enum" RENAME TO "review_state_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."review_state_enum" AS ENUM('draft', 'ai_suggested', 'pending_review', 'reviewed', 'approved', 'rejected', 'needs_revision', 'published')`);

        // Update content_pieces table
        await queryRunner.query(`ALTER TABLE "content_pieces" ALTER COLUMN "review_state" TYPE "public"."review_state_enum" USING "review_state"::"text"::"public"."review_state_enum"`);

        // Update reviews table columns that use the same enum
        await queryRunner.query(`ALTER TABLE "reviews" ALTER COLUMN "previous_state" TYPE "public"."review_state_enum" USING "previous_state"::"text"::"public"."review_state_enum"`);
        await queryRunner.query(`ALTER TABLE "reviews" ALTER COLUMN "new_state" TYPE "public"."review_state_enum" USING "new_state"::"text"::"public"."review_state_enum"`);

        // Re-add the default constraint
        await queryRunner.query(`ALTER TABLE "content_pieces" ALTER COLUMN "review_state" SET DEFAULT 'draft'`);

        await queryRunner.query(`DROP TYPE "public"."review_state_enum_old"`);

        // Add new columns
        await queryRunner.query(`ALTER TABLE "content_pieces" ADD "translation_of" uuid`);
        await queryRunner.query(`ALTER TABLE "content_pieces" ADD "final_text" text`);
        await queryRunner.query(`ALTER TABLE "content_pieces" ADD "version_history" jsonb`);

        // Add foreign key constraint for translation_of
        await queryRunner.query(`ALTER TABLE "content_pieces" ADD CONSTRAINT "FK_content_pieces_translation_of" FOREIGN KEY ("translation_of") REFERENCES "content_pieces"("id") ON DELETE SET NULL`);

        // Add indexes for better query performance
        await queryRunner.query(`CREATE INDEX "IDX_content_pieces_translation_of" ON "content_pieces" ("translation_of")`);
        await queryRunner.query(`CREATE INDEX "IDX_content_pieces_source_target_language" ON "content_pieces" ("source_language", "target_language")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX "IDX_content_pieces_source_target_language"`);
        await queryRunner.query(`DROP INDEX "IDX_content_pieces_translation_of"`);

        // Drop foreign key constraint
        await queryRunner.query(`ALTER TABLE "content_pieces" DROP CONSTRAINT "FK_content_pieces_translation_of"`);

        // Drop new columns
        await queryRunner.query(`ALTER TABLE "content_pieces" DROP COLUMN "version_history"`);
        await queryRunner.query(`ALTER TABLE "content_pieces" DROP COLUMN "final_text"`);
        await queryRunner.query(`ALTER TABLE "content_pieces" DROP COLUMN "translation_of"`);

        // Revert enum changes
        await queryRunner.query(`UPDATE "content_pieces" SET "review_state" = 'ai_generated' WHERE "review_state" = 'ai_suggested'`);
        await queryRunner.query(`ALTER TYPE "public"."review_state_enum" RENAME TO "review_state_enum_new"`);
        await queryRunner.query(`CREATE TYPE "public"."review_state_enum" AS ENUM('draft', 'ai_generated', 'pending_review', 'under_review', 'needs_revision', 'approved', 'rejected', 'published')`);
        await queryRunner.query(`ALTER TABLE "content_pieces" ALTER COLUMN "review_state" TYPE "public"."review_state_enum" USING "review_state"::"text"::"public"."review_state_enum"`);
        await queryRunner.query(`DROP TYPE "public"."review_state_enum_new"`);
    }
}