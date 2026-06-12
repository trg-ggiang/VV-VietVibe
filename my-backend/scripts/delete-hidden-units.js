const mongoose = require('mongoose');
const path = require('path');

// Load models
const models = require(path.resolve(__dirname, '../src/models'));
const {
  LearningUnit,
  ListeningLesson,
  TranscriptLine,
  ListeningSession,
  UserProgress,
  VocabularyCard,
} = models;

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:admin123@ac-zuur87m-shard-00-00.sro5fph.mongodb.net:27017,ac-zuur87m-shard-00-01.sro5fph.mongodb.net:27017,ac-zuur87m-shard-00-02.sro5fph.mongodb.net:27017/vietvibe_db?ssl=true&authSource=admin&replicaSet=atlas-viiwpr-shard-0&retryWrites=true&w=majority&appName=Cluster0';

// IDs of learning units to delete (the second units in each situation)
const LEARNING_UNIT_IDS_TO_DELETE = [
  '6a24553c74fbc13125000522', // Bài 3: Gọi món phở (Trung cấp)
  '6a24553c74fbc13125000521', // Bài 4: Xin hóa đơn (Trung cao cấp)
  '6a24553e74fbc1312500052e', // Bài 24: Đổi vé xe (Trung cao cấp)
  '6a24553d74fbc13125000528', // Bài 14: Gửi bưu phẩm (Trung cao cấp)
];

async function deleteLearningUnits() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✓ Connected to MongoDB\n');

    let totalDeleted = {
      units: 0,
      lessons: 0,
      transcripts: 0,
      sessions: 0,
      progress: 0,
      vocabs: 0,
    };

    for (const unitId of LEARNING_UNIT_IDS_TO_DELETE) {
      try {
        const unit = await LearningUnit.findById(unitId).lean();
        if (!unit) {
          console.log(`⚠️  Learning Unit ${unitId} not found, skipping...`);
          continue;
        }

        console.log(`Deleting Learning Unit: ${unit.title_vi} (${unit.title_ja})`);
        console.log(`  ID: ${unitId}\n`);

        // Find and delete all lessons for this unit
        const lessons = await ListeningLesson.find({
          learning_unit_id: unitId,
        });
        const lessonIds = lessons.map((l) => l._id);

        // Delete transcript lines
        const transcriptCount = await TranscriptLine.deleteMany({
          lesson_id: { $in: lessonIds },
        });

        // Delete listening sessions
        const sessionCount = await ListeningSession.deleteMany({
          lesson_id: { $in: lessonIds },
        });

        // Delete listening lessons
        const lessonCount = await ListeningLesson.deleteMany({
          learning_unit_id: unitId,
        });

        // Delete user progress
        const progressCount = await UserProgress.deleteMany({
          learning_unit_id: unitId,
        });

        // Delete vocabulary cards
        const vocabCount = await VocabularyCard.deleteMany({
          learning_unit_id: unitId,
        });

        // Delete the learning unit itself
        await LearningUnit.findByIdAndDelete(unitId);

        totalDeleted.units += 1;
        totalDeleted.lessons += lessonCount.deletedCount || 0;
        totalDeleted.transcripts += transcriptCount.deletedCount || 0;
        totalDeleted.sessions += sessionCount.deletedCount || 0;
        totalDeleted.progress += progressCount.deletedCount || 0;
        totalDeleted.vocabs += vocabCount.deletedCount || 0;

        console.log(
          `  ✓ Deleted: 1 unit, ${lessonCount.deletedCount || 0} lessons, ${transcriptCount.deletedCount || 0} transcripts, ${sessionCount.deletedCount || 0} sessions, ${progressCount.deletedCount || 0} progress, ${vocabCount.deletedCount || 0} vocab cards\n`,
        );
      } catch (err) {
        console.error(
          `✗ Error deleting learning unit ${unitId}:`,
          err.message,
        );
      }
    }

    console.log('=== DELETION SUMMARY ===');
    console.log(`✓ Learning Units deleted: ${totalDeleted.units}`);
    console.log(`✓ Lessons deleted: ${totalDeleted.lessons}`);
    console.log(`✓ Transcript lines deleted: ${totalDeleted.transcripts}`);
    console.log(`✓ Listening sessions deleted: ${totalDeleted.sessions}`);
    console.log(`✓ User progress deleted: ${totalDeleted.progress}`);
    console.log(`✓ Vocabulary cards deleted: ${totalDeleted.vocabs}`);
    console.log(
      '\n✓ All hidden learning units have been successfully deleted from the screen!',
    );
  } catch (error) {
    console.error('❌ Connection error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

deleteLearningUnits();
