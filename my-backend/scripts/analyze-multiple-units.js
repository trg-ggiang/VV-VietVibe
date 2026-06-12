const mongoose = require('mongoose');
const path = require('path');

// Load models
const models = require(path.resolve(__dirname, '../src/models'));
const {
  Place,
  Situation,
  LearningUnit,
  ListeningLesson,
} = models;

const MONGO_URI = process.env.MONGO_URI || 'mongodb://admin:admin123@ac-zuur87m-shard-00-00.sro5fph.mongodb.net:27017,ac-zuur87m-shard-00-01.sro5fph.mongodb.net:27017,ac-zuur87m-shard-00-02.sro5fph.mongodb.net:27017/vietvibe_db?ssl=true&authSource=admin&replicaSet=atlas-viiwpr-shard-0&retryWrites=true&w=majority&appName=Cluster0';

async function analyzeMultipleUnits() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✓ Connected to MongoDB\n');

    // Find all situations with their learning units
    const situations = await Situation.find().lean();
    
    console.log(`Total situations: ${situations.length}\n`);
    console.log('=== ANALYSIS OF SITUATIONS WITH MULTIPLE LEARNING UNITS ===\n');

    let situationsWithMultipleUnits = [];
    
    for (const situation of situations) {
      const units = await LearningUnit.find({ 
        situation_id: situation._id 
      }).populate('level_id').lean();

      if (units.length > 1) {
        situationsWithMultipleUnits.push({
          situation: situation,
          units: units,
          count: units.length
        });
      }
    }

    if (situationsWithMultipleUnits.length > 0) {
      console.log(`Found ${situationsWithMultipleUnits.length} situations with multiple learning units\n`);
      
      for (const item of situationsWithMultipleUnits) {
        const place = await Place.findById(item.situation.place_id).lean();
        console.log(`\nPlace: ${place.name_vi} (${place.name_ja})`);
        console.log(`Situation: ${item.situation.title_vi} (${item.situation.title_ja})`);
        console.log(`Learning Units (${item.count}):`);
        
        for (const unit of item.units) {
          const lesson = await ListeningLesson.findOne({ 
            learning_unit_id: unit._id 
          }).lean();
          
          const levelName = unit.level_id?.name_vi || unit.level_id?.code || 'N/A';
          console.log(`  - ID: ${unit._id}`);
          console.log(`    Title: ${unit.title_vi} (${unit.title_ja})`);
          console.log(`    Level: ${levelName}`);
          console.log(`    Has Lesson: ${lesson ? 'Yes' : 'No'}`);
          if (lesson) {
            console.log(`    Lesson: ${lesson.title_vi}`);
          }
          console.log();
        }
      }
      
      console.log('\n=== ADMIN VIEW ONLY SHOWS THE FIRST UNIT ===');
      console.log('These extra units are visible in the learner view but not in admin!\n');
      
      let totalExtraUnits = 0;
      for (const item of situationsWithMultipleUnits) {
        const extraCount = item.units.length - 1;
        totalExtraUnits += extraCount;
        
        // Get all units except the first one
        const extraUnits = item.units.slice(1);
        for (const unit of extraUnits) {
          const lesson = await ListeningLesson.findOne({ 
            learning_unit_id: unit._id 
          }).lean();
          
          if (lesson) {
            console.log(`DELETE: ${lesson._id} - ${lesson.title_vi}`);
            console.log(`  Parent Learning Unit: ${unit._id}`);
            console.log(`  Parent Situation: ${item.situation._id}`);
            console.log();
          }
        }
      }
      
      console.log(`\nTotal extra learning units (not shown in admin): ${totalExtraUnits}`);
      
    } else {
      console.log('✓ All situations have exactly one learning unit. No extras found.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

analyzeMultipleUnits();
