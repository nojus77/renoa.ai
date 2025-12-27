/**
 * Schema Refactor Migration Script
 *
 * 1. Converts estimatedDuration (hours) to durationMinutes
 * 2. Renames internal_notes column to job_instructions
 * 3. Parses worker notes from job_instructions and moves to field_notes
 * 4. Creates field_notes column
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Pattern to match worker notes: [MM/DD/YYYY, HH:MM AM/PM] Author Name: content
const WORKER_NOTE_PATTERN = /^\[(\d{1,2}\/\d{1,2}\/\d{4},?\s*\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?)\]\s*([^:]+):\s*([\s\S]+)/i;

interface ParsedNote {
  timestamp: string;
  author: string;
  content: string;
}

function parseWorkerNotes(text: string): { workerNotes: ParsedNote[]; jobInstructions: string } {
  if (!text) return { workerNotes: [], jobInstructions: '' };

  const blocks = text.split('\n\n').filter(Boolean);
  const workerNotes: ParsedNote[] = [];
  const instructionBlocks: string[] = [];

  for (const block of blocks) {
    const trimmed = block.trim();

    // Skip metadata blocks like "[Created by Name]"
    if (trimmed.match(/^\[Created by [^\]]+\]$/)) {
      continue;
    }

    const match = trimmed.match(WORKER_NOTE_PATTERN);
    if (match) {
      // This is a worker note
      workerNotes.push({
        timestamp: match[1],
        author: match[2].trim(),
        content: match[3].trim(),
      });
    } else if (trimmed) {
      // This is job instructions - also strip "[Created by Name]" prefix if present
      const cleaned = trimmed.replace(/^\[Created by [^\]]+\]\s*/, '');
      if (cleaned) {
        instructionBlocks.push(cleaned);
      }
    }
  }

  return {
    workerNotes,
    jobInstructions: instructionBlocks.join('\n\n'),
  };
}

async function migrate() {
  console.log('Starting schema refactor migration...\n');

  // Step 1: Add new columns using raw SQL
  console.log('Step 1: Adding new columns...');
  try {
    // Add duration_minutes column
    await prisma.$executeRaw`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS duration_minutes INTEGER`;
    console.log('  ✓ Added duration_minutes column');

    // Add field_notes column
    await prisma.$executeRaw`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS field_notes TEXT`;
    console.log('  ✓ Added field_notes column');

    // Add job_instructions column (we'll copy from internal_notes)
    await prisma.$executeRaw`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS job_instructions TEXT`;
    console.log('  ✓ Added job_instructions column');
  } catch (err) {
    console.log('  (columns may already exist, continuing...)');
  }

  // Step 2: Convert estimatedDuration to durationMinutes
  console.log('\nStep 2: Converting estimatedDuration to durationMinutes...');
  const result = await prisma.$executeRaw`
    UPDATE jobs
    SET duration_minutes = ROUND(estimated_duration * 60)::INTEGER
    WHERE estimated_duration IS NOT NULL
    AND duration_minutes IS NULL
  `;
  console.log(`  ✓ Converted ${result} jobs`);

  // Step 3: Copy internal_notes to job_instructions (temporary)
  console.log('\nStep 3: Copying internal_notes to job_instructions...');
  await prisma.$executeRaw`
    UPDATE jobs
    SET job_instructions = internal_notes
    WHERE internal_notes IS NOT NULL
    AND job_instructions IS NULL
  `;
  console.log('  ✓ Copied');

  // Step 4: Parse notes and separate worker notes from job instructions
  console.log('\nStep 4: Parsing and separating worker notes...');

  // Get all jobs with internal_notes
  const jobsWithNotes = await prisma.$queryRaw<Array<{ id: string; internal_notes: string | null }>>`
    SELECT id, internal_notes FROM jobs WHERE internal_notes IS NOT NULL
  `;

  let processedCount = 0;
  let workerNotesCount = 0;

  for (const job of jobsWithNotes) {
    if (!job.internal_notes) continue;

    const { workerNotes, jobInstructions } = parseWorkerNotes(job.internal_notes);

    // Build field notes from worker notes
    let fieldNotes = '';
    if (workerNotes.length > 0) {
      fieldNotes = workerNotes
        .map(n => `[${n.timestamp}] ${n.author}: ${n.content}`)
        .join('\n\n');
      workerNotesCount += workerNotes.length;
    }

    // Update the job
    await prisma.$executeRaw`
      UPDATE jobs
      SET job_instructions = ${jobInstructions || null},
          field_notes = ${fieldNotes || null}
      WHERE id = ${job.id}
    `;

    processedCount++;
    if (processedCount % 100 === 0) {
      console.log(`  Processed ${processedCount} jobs...`);
    }
  }

  console.log(`  ✓ Processed ${processedCount} jobs, extracted ${workerNotesCount} worker notes`);

  // Step 5: Drop old columns (optional - keeping for safety)
  console.log('\nStep 5: Cleaning up old columns...');
  try {
    await prisma.$executeRaw`ALTER TABLE jobs DROP COLUMN IF EXISTS estimated_duration`;
    console.log('  ✓ Dropped estimated_duration column');
    await prisma.$executeRaw`ALTER TABLE jobs DROP COLUMN IF EXISTS internal_notes`;
    console.log('  ✓ Dropped internal_notes column');
  } catch (err) {
    console.log('  (could not drop columns, may require manual cleanup)');
  }

  // Step 6: Verification
  console.log('\nStep 6: Verification...');

  const stats = await prisma.$queryRaw<[{
    total: bigint;
    with_duration: bigint;
    with_actual: bigint;
    with_instructions: bigint;
    with_field_notes: bigint;
  }]>`
    SELECT
      COUNT(*) as total,
      COUNT(duration_minutes) as with_duration,
      COUNT(actual_duration_minutes) as with_actual,
      COUNT(job_instructions) as with_instructions,
      COUNT(field_notes) as with_field_notes
    FROM jobs
  `;

  const s = stats[0];
  console.log(`  Total jobs: ${s.total}`);
  console.log(`  With durationMinutes: ${s.with_duration}`);
  console.log(`  With actualDurationMinutes: ${s.with_actual}`);
  console.log(`  With jobInstructions: ${s.with_instructions}`);
  console.log(`  With fieldNotes: ${s.with_field_notes}`);

  console.log('\n✅ Migration complete!');
}

migrate()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
