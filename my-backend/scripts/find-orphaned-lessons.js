const mongoose = require('mongoose');
const path = require('path');

// Load models
const models = require(path.resolve(__dirname, '../src/models'));
const {
  Place,
  Situation,
  LearningUnit,
  ListeningLesson,
  TranscriptLine,
  ListeningSession,
} = models;

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:admin123@ac-zuur87m-shard-00-00.sro5fph.mongodb.net:27017,ac-zuur87m-shard-00-01.sro5fph.mongodb.net:27017,ac-zuur87m-shard-00-02.sro5fph.mongodb.net:27017/vietvibe_db?ssl=true&authSource=admin&replicaSet=atlas-viiwpr-shard-0&retryWrites=true&w=majority&appName=Cluster0';

async function findOrphanedLessons() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✓ Connected to MongoDB\n');

    // Find all listening lessons
    const allLessons = await ListeningLesson.find().lean();
    console.log(`Total listening lessons in DB: ${allLessons.length}\n`);

    // Find all learning units
    const allUnits = await LearningUnit.find().lean();
    const unitIds = new Set(allUnits.map(u => String(u._id)));

    // Find orphaned lessons (lessons whose parent LearningUnit doesn't exist)
    const orphanedLessons = [];
    for (const lesson of allLessons) {
      const unitId = String(lesson.learning_unit_id);
      if (!unitIds.has(unitId)) {
        orphanedLessons.push(lesson);
      }
    }

    console.log(`Orphaned lessons found: ${orphanedLessons.length}\n`);

    if (orphanedLessons.length > 0) {
      console.log('=== ORPHANED LESSONS ===');
      orphanedLessons.forEach((lesson, idx) => {
        console.log(`${idx + 1}. ID: ${lesson._id}`);
        console.log(`   Title (VI): ${lesson.title_vi}`);
        console.log(`   Title (JA): ${lesson.title_ja}`);
        console.log(`   Learning Unit ID: ${lesson.learning_unit_id}`);
        console.log(`   Created: ${lesson.created_at}\n`);
      });

      // Show deletion command
      const lessonIds = orphanedLessons.map(l => `'${l._id}'`).join(', ');
      console.log('=== TO DELETE THESE ORPHANED LESSONS ===');
      console.log(`Run: node scripts/delete-orphaned-lessons.js`);
    }

    // Also check for orphaned learning units
    const allSituations = await Situation.find().lean();
    const situationIds = new Set(allSituations.map(s => String(s._id)));

    const orphanedUnits = [];
    for (const unit of allUnits) {
      const sitId = String(unit.situation_id);
      if (!situationIds.has(sitId)) {
        orphanedUnits.push(unit);
      }
    }

    console.log(`\nOrphaned learning units found: ${orphanedUnits.length}`);
    if (orphanedUnits.length > 0) {
      console.log('\n=== ORPHANED LEARNING UNITS ===');
      orphanedUnits.forEach((unit, idx) => {
        console.log(`${idx + 1}. ID: ${unit._id}`);
        console.log(`   Name (VI): ${unit.name_vi}`);
        console.log(`   Name (JA): ${unit.name_ja}`);
        console.log(`   Situation ID: ${unit.situation_id}`);
        console.log(`   Created: ${unit.created_at}\n`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

findOrphanedLessons();
