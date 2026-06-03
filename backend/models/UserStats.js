import mongoose from 'mongoose';
import ActivityLog from './ActivityLog.js';
import DiaryEntry from './DiaryEntry.js';
import DiagnosticResult from './DiagnosticResult.js';

const userStatsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  
  
  breathingSessions: {
    count: { type: Number, default: 0 },
    totalMinutes: { type: Number, default: 0 },
    lastSession: { type: Date }
  },
  
  diagnosticsTaken: {
    count: { type: Number, default: 0 },
    lastScore: { type: Number },
    lastDate: { type: Date }
  },
  
  materialsViewed: {
    count: { type: Number, default: 0 },
    materials: [{
      materialId: { type: String, ref: 'Material' },
      viewCount: { type: Number, default: 0 },
      lastViewed: { type: Date, default: Date.now },
      totalTime: { type: Number, default: 0 } 
    }]
  },
  
  
  totalSessions: { type: Number, default: 0 },
  totalMinutes: { type: Number, default: 0 },
  lastActiveDate: { type: Date }
}, {
  timestamps: true
});


userStatsSchema.methods.recordBreathingSession = async function(minutes) {
  this.breathingSessions.count += 1;
  this.breathingSessions.totalMinutes += minutes;
  this.breathingSessions.lastSession = new Date();
  this.totalSessions += 1;
  this.totalMinutes += minutes;
  this.lastActiveDate = new Date();
  
  await ActivityLog.create({
    userId: this.userId,
    type: 'breathing',
    name: 'Дихальна практика',
    change: 2 
  });

  return this.save();
};

userStatsSchema.methods.recordDiagnostic = async function(score, answers) {
  this.diagnosticsTaken.count += 1;
  this.diagnosticsTaken.lastScore = score;
  this.diagnosticsTaken.lastDate = new Date();
  
  let resilienceChange = 0;
  if (score >= 60) resilienceChange = 2;
  else if (score <= 40) resilienceChange = -2;

  
  const formattedAnswers = Array.isArray(answers)
    ? answers.map(ans => typeof ans === 'number' ? { value: ans } : ans)
    : [];

  await DiagnosticResult.create({
    userId: this.userId,
    score,
    answers: formattedAnswers
  });

  
  await ActivityLog.create({
    userId: this.userId,
    type: 'diagnostic',
    name: 'Діагностика стану',
    change: 0,
    metadata: { score }
  });
  
  this.lastActiveDate = new Date();
  return this.save();
};

userStatsSchema.methods.addDiaryEntry = async function(mood, content, tags = []) {
  
  await DiaryEntry.create({
    userId: this.userId,
    mood,
    content,
    tags,
    wordCount: content.split(' ').filter(word => word.length > 0).length
  });

  
  await ActivityLog.create({
    userId: this.userId,
    type: 'diary',
    name: 'Запис у щоденнику',
    change: 1 
  });

  this.lastActiveDate = new Date();
  return this.save();
};

userStatsSchema.methods.recordMaterialView = async function(materialId, minutes = 0) {
  const existingMaterial = this.materialsViewed.materials.find(
    m => m.materialId.toString() === materialId.toString()
  );
  
  if (existingMaterial) {
    existingMaterial.viewCount += 1;
    existingMaterial.lastViewed = new Date();
    existingMaterial.totalTime += minutes;
  } else {
    this.materialsViewed.materials.push({
      materialId,
      viewCount: 1,
      lastViewed: new Date(),
      totalTime: minutes
    });
  }
  
  this.materialsViewed.count += 1;
  this.lastActiveDate = new Date();

  await ActivityLog.create({
    userId: this.userId,
    type: 'material_view',
    name: 'Перегляд матеріалу',
    metadata: { materialId }
  });

  return this.save();
};

userStatsSchema.methods.updateLastActive = function() {
  this.lastActiveDate = new Date();
  return this.save();
};

export default mongoose.model('UserStats', userStatsSchema);
