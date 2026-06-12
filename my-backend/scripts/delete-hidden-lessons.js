const mongoose = require('mongoose');
const path = require('path');

// Load models
const models = require(path.resolve(__dirname, '../src/models'));
const {
  ListeningLesson,
  TranscriptLine,
  ListeningSession,
  VocabularyCard,
} = models;

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:admin123@ac-zuur87m-shard-00-00.sro5fph.mongodb.net:27017,ac-zuur87m-shard-00-01.sro5fph.mongodb.net:27017,ac-zuur87m-shard-00-02.sro5fph.mongodb.net:27017/vietvibe_db?ssl=true&authSource=admin&replicaSet=atlas-viiwpr-shard-0&retryWrites=true&w=majority&appName=Cluster0';

// IDs of lessons to delete
const LESSON_IDS_TO_DELETE = [
  '6a24f39ce1403da9dc6773ec', // Bài 3: Gọi món phở
  '6a24f39ce1403da9dc6773eb', // Bài 4: Xin hóa đơn
  '6a24f3cb501e422b48a9cfb7', // Bài 24: Đổi vé xe
  '6a24f3c7501e422b48a9cfa2', // Bài 14: Gửi bưu phẩm
];

async function deleteHiddenLessons() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✓ Connected to MongoDB\n');

    let totalDeleted = {
      lessons: 0,
      transcripts: 0,
      sessions: 0,
    };

    for (const lessonId of LESSON_IDS_TO_DELETE) {
      try {
        const lesson = await ListeningLesson.findById(lessonId).lean();
        if (!lesson) {
          console.log(`⚠️  Lesson ${lessonId} not found, skipping...`);
          continue;
        }

        console.log(`Deleting: ${lesson.title_vi} (${lesson.title_ja})`);
        console.log(`  ID: ${lessonId}\n`);

        // Delete related data
        const transcriptCount = await TranscriptLine.deleteMany({
          lesson_id: lessonId,
        });
        const sessionCount = await ListeningSession.deleteMany({
          lesson_id: lessonId,
        });

        // Delete the lesson itself
        await ListeningLesson.findByIdAndDelete(lessonId);

        totalDeleted.lessons += 1;
        totalDeleted.transcripts += transcriptCount.deletedCount || 0;
        totalDeleted.sessions += sessionCount.deletedCount || 0;

        console.log(
          `  ✓ Deleted: 1 lesson, ${transcriptCount.deletedCount || 0} transcript lines, ${sessionCount.deletedCount || 0} sessions\n`,
        );
      } catch (err) {
        console.error(`✗ Error deleting lesson ${lessonId}:`, err.message);
      }
    }

    console.log('=== DELETION SUMMARY ===');
    console.log(`✓ Lessons deleted: ${totalDeleted.lessons}`);
    console.log(`✓ Transcript lines deleted: ${totalDeleted.transcripts}`);
    console.log(`✓ Listening sessions deleted: ${totalDeleted.sessions}`);
    console.log('\n✓ All hidden lessons have been successfully deleted!');

  } catch (error) {
    console.error('❌ Connection error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

deleteHiddenLessons();
