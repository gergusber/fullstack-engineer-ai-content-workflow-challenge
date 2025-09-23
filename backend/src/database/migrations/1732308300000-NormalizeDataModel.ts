import { MigrationInterface, QueryRunner } from "typeorm";

export class NormalizeDataModel1732308300000 implements MigrationInterface {
    name = 'NormalizeDataModel1732308300000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create draft_status_enum
        await queryRunner.query(`CREATE TYPE "public"."draft_status_enum" AS ENUM('candidate', 'selected', 'discarded')`);

        // Update review_state_enum to remove unnecessary states (strict lifecycle)
        await queryRunner.query(`ALTER TYPE "public"."review_state_enum" RENAME TO "review_state_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."review_state_enum" AS ENUM('draft', 'ai_suggested', 'pending_review', 'reviewed', 'approved', 'rejected')`);

        // Update review_action_enum to simplify actions
        await queryRunner.query(`ALTER TYPE "public"."review_action_enum" RENAME TO "review_action_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."review_action_enum" AS ENUM('approve', 'reject', 'edit')`);

        // Update content_pieces table (remove old states)
        await queryRunner.query(`UPDATE "content_pieces" SET "review_state" = 'rejected' WHERE "review_state" IN ('needs_revision', 'published')`);

        // Drop default constraint temporarily
        await queryRunner.query(`ALTER TABLE "content_pieces" ALTER COLUMN "review_state" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "content_pieces" ALTER COLUMN "review_state" TYPE "public"."review_state_enum" USING "review_state"::"text"::"public"."review_state_enum"`);
        // Re-add default constraint
        await queryRunner.query(`ALTER TABLE "content_pieces" ALTER COLUMN "review_state" SET DEFAULT 'draft'`);

        // Update reviews table
        await queryRunner.query(`UPDATE "reviews" SET "action" = 'reject' WHERE "action" IN ('request_revision', 'escalate')`);
        await queryRunner.query(`UPDATE "reviews" SET "previous_state" = 'rejected' WHERE "previous_state" IN ('needs_revision', 'published')`);
        await queryRunner.query(`UPDATE "reviews" SET "new_state" = 'rejected' WHERE "new_state" IN ('needs_revision', 'published')`);

        await queryRunner.query(`ALTER TABLE "reviews" ALTER COLUMN "action" TYPE "public"."review_action_enum" USING "action"::"text"::"public"."review_action_enum"`);
        await queryRunner.query(`ALTER TABLE "reviews" ALTER COLUMN "previous_state" TYPE "public"."review_state_enum" USING "previous_state"::"text"::"public"."review_state_enum"`);
        await queryRunner.query(`ALTER TABLE "reviews" ALTER COLUMN "new_state" TYPE "public"."review_state_enum" USING "new_state"::"text"::"public"."review_state_enum"`);

        // Remove campaignId from reviews table
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT IF EXISTS "FK_reviews_campaign"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP COLUMN IF EXISTS "campaign_id"`);

        // Normalize AI drafts structure
        // First, migrate existing data to new generatedContent structure
        await queryRunner.query(`
            UPDATE "ai_drafts"
            SET "generated_content" = jsonb_build_object(
                'title', COALESCE("generated_title", ''),
                'description', COALESCE("generated_desc", '')
            )
            WHERE "generated_content" IS NULL
        `);

        // Add status column to ai_drafts
        await queryRunner.query(`ALTER TABLE "ai_drafts" ADD "status" "public"."draft_status_enum" DEFAULT 'candidate'`);

        // Rename and normalize metrics columns
        await queryRunner.query(`ALTER TABLE "ai_drafts" RENAME COLUMN "response_time" TO "response_time_ms"`);
        await queryRunner.query(`ALTER TABLE "ai_drafts" RENAME COLUMN "cost" TO "cost_usd"`);
        await queryRunner.query(`ALTER TABLE "ai_drafts" ALTER COLUMN "cost_usd" TYPE DECIMAL(10,6)`);

        // Drop old columns from ai_drafts (after data migration)
        await queryRunner.query(`ALTER TABLE "ai_drafts" DROP COLUMN IF EXISTS "generated_title"`);
        await queryRunner.query(`ALTER TABLE "ai_drafts" DROP COLUMN IF EXISTS "generated_desc"`);

        // Drop old enum types
        await queryRunner.query(`DROP TYPE "public"."review_state_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."review_action_enum_old"`);

        // Add indexes for performance
        await queryRunner.query(`CREATE INDEX "IDX_ai_drafts_status" ON "ai_drafts" ("status")`);
        await queryRunner.query(`CREATE INDEX "IDX_ai_drafts_content_piece_status" ON "ai_drafts" ("content_piece_id", "status")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop new indexes
        await queryRunner.query(`DROP INDEX "IDX_ai_drafts_content_piece_status"`);
        await queryRunner.query(`DROP INDEX "IDX_ai_drafts_status"`);

        // Re-add old columns to ai_drafts
        await queryRunner.query(`ALTER TABLE "ai_drafts" ADD "generated_title" text`);
        await queryRunner.query(`ALTER TABLE "ai_drafts" ADD "generated_desc" text`);

        // Migrate data back
        await queryRunner.query(`
            UPDATE "ai_drafts"
            SET
                "generated_title" = "generated_content"->>'title',
                "generated_desc" = "generated_content"->>'description'
        `);

        // Revert metrics columns
        await queryRunner.query(`ALTER TABLE "ai_drafts" ALTER COLUMN "cost_usd" TYPE DOUBLE PRECISION`);
        await queryRunner.query(`ALTER TABLE "ai_drafts" RENAME COLUMN "cost_usd" TO "cost"`);
        await queryRunner.query(`ALTER TABLE "ai_drafts" RENAME COLUMN "response_time_ms" TO "response_time"`);

        // Drop status column
        await queryRunner.query(`ALTER TABLE "ai_drafts" DROP COLUMN "status"`);

        // Re-add campaignId to reviews
        await queryRunner.query(`ALTER TABLE "reviews" ADD "campaign_id" uuid`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_reviews_campaign" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE`);

        // Revert enums
        await queryRunner.query(`CREATE TYPE "public"."review_action_enum_new" AS ENUM('approve', 'reject', 'request_revision', 'edit', 'escalate')`);
        await queryRunner.query(`CREATE TYPE "public"."review_state_enum_new" AS ENUM('draft', 'ai_suggested', 'pending_review', 'reviewed', 'approved', 'rejected', 'needs_revision', 'published')`);

        await queryRunner.query(`ALTER TABLE "reviews" ALTER COLUMN "action" TYPE "public"."review_action_enum_new" USING "action"::"text"::"public"."review_action_enum_new"`);
        await queryRunner.query(`ALTER TABLE "reviews" ALTER COLUMN "previous_state" TYPE "public"."review_state_enum_new" USING "previous_state"::"text"::"public"."review_state_enum_new"`);
        await queryRunner.query(`ALTER TABLE "reviews" ALTER COLUMN "new_state" TYPE "public"."review_state_enum_new" USING "new_state"::"text"::"public"."review_state_enum_new"`);
        await queryRunner.query(`ALTER TABLE "content_pieces" ALTER COLUMN "review_state" TYPE "public"."review_state_enum_new" USING "review_state"::"text"::"public"."review_state_enum_new"`);

        await queryRunner.query(`DROP TYPE "public"."review_action_enum"`);
        await queryRunner.query(`DROP TYPE "public"."review_state_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."review_action_enum_new" RENAME TO "review_action_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."review_state_enum_new" RENAME TO "review_state_enum"`);

        // Drop draft_status_enum
        await queryRunner.query(`DROP TYPE "public"."draft_status_enum"`);
    }
}