import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorTranslationArchitecture1760649624000 implements MigrationInterface {
    name = 'RefactorTranslationArchitecture1760649624000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // ========================================
        // STEP 1: Create Backup Tables
        // ========================================
        console.log('Creating backup tables...');

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS content_pieces_translation_backup AS
            SELECT * FROM content_pieces WHERE translation_of IS NOT NULL
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS translations_backup AS
            SELECT * FROM translations
        `);

        console.log('Backup tables created successfully');

        // ========================================
        // STEP 2: Migrate Translated Content Pieces to Translation Records
        // ========================================
        console.log('Migrating translated content pieces to translation records...');

        // Create translation records from content pieces that are translations
        // Only create if a translation record doesn't already exist
        await queryRunner.query(`
            INSERT INTO translations (
                content_piece_id,
                source_language,
                target_language,
                translated_title,
                translated_desc,
                translated_content,
                model_used,
                quality_score,
                is_human_reviewed,
                translation_context,
                created_at,
                updated_at
            )
            SELECT
                cp.translation_of as content_piece_id,  -- Point to ORIGINAL content
                cp.source_language,
                cp.target_language,
                cp.title as translated_title,
                cp.description as translated_desc,
                jsonb_build_object(
                    'title', cp.title,
                    'description', cp.description,
                    'body', COALESCE(cp.final_text, '')
                ) as translated_content,
                COALESCE((cp.content_metadata->>'aiModel')::text, 'claude') as model_used,
                COALESCE((cp.content_metadata->>'translationQuality')::float, 0.8) as quality_score,
                CASE
                    WHEN cp.review_state = 'approved' THEN true
                    ELSE false
                END as is_human_reviewed,
                COALESCE((cp.content_metadata->>'translationType')::text, 'standard') as translation_context,
                cp.created_at,
                cp.updated_at
            FROM content_pieces cp
            WHERE cp.translation_of IS NOT NULL
              AND NOT EXISTS (
                SELECT 1 FROM translations t
                WHERE t.content_piece_id = cp.translation_of
                  AND t.target_language = cp.target_language
              )
        `);

        console.log('Translation records created from content pieces');

        // ========================================
        // STEP 3: Migrate Related Data
        // ========================================
        console.log('Migrating related data (AI drafts, reviews, analytics)...');

        // Migrate AI drafts to point to original content piece
        await queryRunner.query(`
            UPDATE ai_drafts
            SET content_piece_id = cp.translation_of
            FROM content_pieces cp
            WHERE ai_drafts.content_piece_id = cp.id
              AND cp.translation_of IS NOT NULL
        `);

        // Migrate reviews to point to original content piece
        await queryRunner.query(`
            UPDATE reviews
            SET content_piece_id = cp.translation_of
            FROM content_pieces cp
            WHERE reviews.content_piece_id = cp.id
              AND cp.translation_of IS NOT NULL
        `);

        // Migrate content analytics to point to original content piece
        await queryRunner.query(`
            UPDATE content_analytics
            SET content_piece_id = cp.translation_of
            FROM content_pieces cp
            WHERE content_analytics.content_piece_id = cp.id
              AND cp.translation_of IS NOT NULL
        `);

        // Migrate content versions to point to original content piece
        await queryRunner.query(`
            UPDATE content_versions
            SET content_piece_id = cp.translation_of
            FROM content_pieces cp
            WHERE content_versions.content_piece_id = cp.id
              AND cp.translation_of IS NOT NULL
        `);

        console.log('Related data migrated successfully');

        // ========================================
        // STEP 4: Delete Translated Content Pieces
        // ========================================
        console.log('Deleting translated content pieces...');

        const deleteResult = await queryRunner.query(`
            DELETE FROM content_pieces WHERE translation_of IS NOT NULL
        `);

        console.log(`Deleted ${deleteResult[1]} translated content pieces`);

        // ========================================
        // STEP 5: Remove translationOf Column and Index
        // ========================================
        console.log('Removing translationOf column and index...');

        // Drop the index first
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_content_pieces_translation_of"`);

        // Drop the column
        await queryRunner.query(`ALTER TABLE "content_pieces" DROP COLUMN IF EXISTS "translation_of"`);

        console.log('Translation architecture refactor completed successfully!');

        // ========================================
        // STEP 6: Add Performance Indexes
        // ========================================
        console.log('Adding performance indexes for translations...');

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_translations_content_piece_target_lang"
            ON "translations" ("content_piece_id", "target_language")
        `);

        console.log('Migration completed!');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        console.log('Rolling back translation architecture refactor...');

        // ========================================
        // STEP 1: Re-add translationOf Column
        // ========================================
        console.log('Re-adding translationOf column...');

        await queryRunner.query(`
            ALTER TABLE "content_pieces" ADD "translation_of" uuid
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_content_pieces_translation_of" ON "content_pieces" ("translation_of")
        `);

        // ========================================
        // STEP 2: Restore Content Pieces from Translations
        // ========================================
        console.log('Restoring content pieces from translation records...');

        // Recreate content pieces from translation records
        await queryRunner.query(`
            INSERT INTO content_pieces (
                campaign_id,
                title,
                description,
                content_type,
                target_language,
                source_language,
                review_state,
                priority,
                final_text,
                translation_of,
                content_metadata,
                created_at,
                updated_at
            )
            SELECT
                cp.campaign_id,
                t.translated_title as title,
                t.translated_desc as description,
                cp.content_type,
                t.target_language,
                t.source_language,
                CASE
                    WHEN t.is_human_reviewed THEN 'approved'::"review_state_enum"
                    ELSE 'pending_review'::"review_state_enum"
                END as review_state,
                cp.priority,
                t.translated_content->>'body' as final_text,
                t.content_piece_id as translation_of,
                jsonb_build_object(
                    'translationQuality', t.quality_score,
                    'aiModel', t.model_used,
                    'translationType', t.translation_context
                ) as content_metadata,
                t.created_at,
                t.updated_at
            FROM translations t
            INNER JOIN content_pieces cp ON cp.id = t.content_piece_id
            WHERE NOT EXISTS (
                SELECT 1 FROM content_pieces_translation_backup cb
                WHERE cb.translation_of = t.content_piece_id
                  AND cb.target_language = t.target_language
            )
        `);

        console.log('Content pieces restored from translations');

        // ========================================
        // STEP 3: Restore from Backup if Available
        // ========================================
        console.log('Restoring additional data from backup...');

        // Restore any content pieces that were in backup but not recreated
        await queryRunner.query(`
            INSERT INTO content_pieces
            SELECT * FROM content_pieces_translation_backup
            WHERE id NOT IN (SELECT id FROM content_pieces)
            ON CONFLICT (id) DO NOTHING
        `);

        // ========================================
        // STEP 4: Clean Up
        // ========================================
        console.log('Cleaning up backup tables...');

        await queryRunner.query(`DROP TABLE IF EXISTS content_pieces_translation_backup`);
        await queryRunner.query(`DROP TABLE IF EXISTS translations_backup`);

        // Drop the new index
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_translations_content_piece_target_lang"`);

        console.log('Rollback completed!');
    }
}
