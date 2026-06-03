import express from 'express';
import UserStats from '../models/UserStats.js';
import User from '../models/User.js';
import DiaryEntry from '../models/DiaryEntry.js';
import ActivityLog from '../models/ActivityLog.js';
import DiagnosticResult from '../models/DiagnosticResult.js';
import auth from '../middleware/auth.js';
import { calculateResilienceChange } from '../utils/resilienceLogic.js';

const router = express.Router();

router.get('/user/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    let userStats = await UserStats.findOne({ userId });
    
    if (!userStats) {
      userStats = new UserStats({ userId });
      await userStats.save();
    }

    // Also fetch recent activity logs
    const recentActivity = await ActivityLog.find({ userId })
      .sort({ createdAt: -1 })
      .limit(20);
    
    const statsObj = userStats.toObject();
    if (user && user.stats) {
      statsObj.resilience = user.stats.resilience;
      statsObj.streak = user.stats.streak;
      statsObj.resilienceMultiplier = user.stats.resilienceMultiplier || 1.0;
    }

    // Include history from User model + activity logs
    statsObj.history = user?.history || [];
    statsObj.activities = recentActivity.map(log => ({
      name: log.name || 'Активність',
      type: log.type,
      change: log.change || 0,
      date: log.createdAt,
    }));

    // Build resilience history for chart from activity logs
    const resilienceHistory = [];
    let runningResilience = user?.stats?.resilience || 50;
    const reversedLogs = [...recentActivity]; // newest first
    for (const log of reversedLogs) {
      resilienceHistory.push({ 
        date: log.createdAt, 
        value: Math.max(0, Math.min(100, Math.round(runningResilience))) 
      });
      runningResilience -= (log.change || 0);
    }
    resilienceHistory.reverse();
    if (resilienceHistory.length === 0) {
      resilienceHistory.push({ 
        date: new Date(), 
        value: Math.max(0, Math.min(100, Math.round(runningResilience))) 
      });
    }
    statsObj.resilience = { current: user?.stats?.resilience || 50, history: resilienceHistory };
    
    res.json(statsObj);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});

router.post('/breathing/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { minutes } = req.body;
    
    let userStats = await UserStats.findOne({ userId });
    if (!userStats) userStats = new UserStats({ userId });
    
    await userStats.recordBreathingSession(minutes);
    
    
    await User.findByIdAndUpdate(userId, { 'stats.lastActiveDate': new Date() });
    
    res.json({ success: true, message: 'Breathing session recorded' });
  } catch (error) {
    console.error('Error recording breathing session:', error);
    res.status(500).json({ error: 'Failed to record breathing session' });
  }
});

router.post('/diagnostic/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { answers } = req.body;
    
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: 'Answers are required and must be an array' });
    }

    const score = Math.round(answers.reduce((a, b) => a + b, 0) / answers.length);
    
    let userStats = await UserStats.findOne({ userId });
    if (!userStats) userStats = new UserStats({ userId });
    
    await userStats.recordDiagnostic(score, answers);

    
    const user = await User.findById(userId);
    let multiplier = 1.0;
    if (user) {
      if (score < 50) {
        multiplier = Number((0.1 + (score / 50) * 0.4).toFixed(2));
      } else {
        multiplier = Number((1.1 + ((score - 50) / 50) * 0.4).toFixed(2));
      }
      user.stats.resilienceMultiplier = multiplier;
      user.stats.lastActiveDate = new Date();
      await user.save();
      
      const io = req.app.get('io');
      if (io) {
          io.to(userId).emit('resilienceUpdate', { 
            resilience: user.stats.resilience, 
            resilienceMultiplier: multiplier 
          });
      }
    }
    
    res.json({ success: true, score, multiplier, message: 'Diagnostic results recorded' });
  } catch (error) {
    console.error('Error recording diagnostic:', error);
    res.status(500).json({ error: 'Failed to record diagnostic' });
  }
});

router.get('/diary/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, page = 1 } = req.query;
    
    const entries = await DiaryEntry.find({ userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await DiaryEntry.countDocuments({ userId });
    
    res.json({ entries, total });
  } catch (error) {
    console.error('Error fetching diary entries:', error);
    res.status(500).json({ error: 'Failed to fetch diary entries' });
  }
});

router.post('/diary/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { mood, content, tags = [] } = req.body;
    
    let userStats = await UserStats.findOne({ userId });
    if (!userStats) userStats = new UserStats({ userId });
    
    await userStats.addDiaryEntry(mood, content, tags);
    
    res.json({ success: true, message: 'Diary entry added' });
  } catch (error) {
    console.error('Error adding diary entry:', error);
    res.status(500).json({ error: 'Failed to add diary entry' });
  }
});

router.delete('/diary/:userId/:entryId', auth, async (req, res) => {
  try {
    const { userId, entryId } = req.params;
    
    
    const entry = await DiaryEntry.findOne({ _id: entryId, userId });
    if (!entry) {
      return res.status(404).json({ error: 'Diary entry not found or unauthorized' });
    }
    
    await DiaryEntry.findByIdAndDelete(entryId);
    
    res.json({ success: true, message: 'Diary entry deleted' });
  } catch (error) {
    console.error('Error deleting diary entry:', error);
    res.status(500).json({ error: 'Failed to delete diary entry' });
  }
});

router.get('/dashboard/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    let userStats = await UserStats.findOne({ userId });
    
    if (!userStats) {
      userStats = new UserStats({ userId });
      await userStats.save();
    }
    
    
    const resilienceHistory = await ActivityLog.find({ userId, type: 'diagnostic' })
      .sort({ createdAt: -1 })
      .limit(7);

    const diaryCount = await DiaryEntry.countDocuments({ userId });
    
    const dashboardData = {
      totalSessions: userStats.totalSessions,
      totalMinutes: userStats.totalMinutes,
      streak: user?.stats?.streak || 0,
      currentResilience: user?.stats?.resilience || 50,
      resilienceMultiplier: user?.stats?.resilienceMultiplier || 1.0,
      breathingSessions: userStats.breathingSessions.count,
      diagnosticsTaken: userStats.diagnosticsTaken.count,
      materialsViewed: userStats.materialsViewed.count,
      diaryEntries: diaryCount,
      lastDiagnosticScore: userStats.diagnosticsTaken.lastScore,
      resilienceHistory: resilienceHistory.map(log => ({
        value: log.metadata?.score || 50,
        date: log.createdAt
      })).reverse(),
      recentActivity: {
        lastBreathing: userStats.breathingSessions.lastSession,
        lastDiagnostic: userStats.diagnosticsTaken.lastDate,
        lastDiaryEntry: (await DiaryEntry.findOne({ userId }).sort({ createdAt: -1 }))?.createdAt
      }
    };
    
    res.json(dashboardData);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

router.post('/resilience/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { type, name, metadata = {} } = req.body;
    
		const user = await User.findById(userId);
		if (!user) return res.status(404).json({ error: "User not found" });

		let currentRes = Number(user.stats.resilience);
		if (isNaN(currentRes)) currentRes = 50;

		const calculatedChange = calculateResilienceChange(type, { ...metadata, currentResilience: currentRes });

		const multiplier = user.stats.resilienceMultiplier || 1.0;
		let finalChange = calculatedChange * multiplier;
		if (calculatedChange < 0) {
			finalChange = Math.min(-1, Math.round(finalChange));
		} else if (calculatedChange > 0) {
			finalChange = Math.max(1, Math.round(finalChange));
		} else {
			finalChange = 0;
		}

		const newResilience = Math.max(
			0,
			Math.min(100, Math.round(currentRes + finalChange)),
		);
		user.stats.resilience = newResilience;
		user.stats.lastActiveDate = new Date();

		if (!metadata.hidden) {
			user.history.unshift({
				date: new Date(),
				activityType: type,
				activityName: name || type,
				change: finalChange,
				newScore: newResilience,
			});
		}

        await user.save();
        const newLog = await ActivityLog.create({
            userId,
            type,
            name,
            change: finalChange
        });

        const io = req.app.get('io');
        if (io) {
            io.to(userId).emit('resilienceUpdate', { resilience: user.stats.resilience });
        }

    res.json({ 
      success: true, 
      currentResilience: user.stats.resilience,
      log: newLog
    });
  } catch (error) {
    console.error('Error updating resilience:', error);
    res.status(500).json({ error: 'Failed to update resilience' });
  }
});


router.post('/material-view/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { materialId, minutes, materialType } = req.body;
    
    let userStats = await UserStats.findOne({ userId });
    if (!userStats) userStats = new UserStats({ userId });
    
    await userStats.recordMaterialView(materialId, minutes);
    
    // Also update User resilience
    const user = await User.findById(userId);
    if (user) {
      const resilienceChange = materialType === 'video' ? 3 : 2;
      let currentRes = Number(user.stats.resilience);
      if (isNaN(currentRes)) currentRes = 50;
      const newResilience = Math.max(0, Math.min(100, currentRes + resilienceChange));
      user.stats.resilience = newResilience;
      user.stats.lastActiveDate = new Date();
      user.history.unshift({
        activityType: 'material_view',
        activityName: 'Перегляд матеріалу',
        change: resilienceChange,
        newScore: newResilience,
        date: new Date()
      });
      await user.save();

      const io = req.app.get('io');
      if (io) {
        io.to(userId).emit('resilienceUpdate', { resilience: newResilience });
      }
    }
    
    res.json({ success: true, message: 'Material view recorded' });
  } catch (error) {
    console.error('Error recording material view:', error);
    res.status(500).json({ error: 'Failed to record material view' });
  }
});

// DELETE /api/stats/personal-data/:userId - Cascade deletion of all user records
router.delete('/personal-data/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Security check: ensure user is deleting their own data
    if (req.user.id !== userId) {
      return res.status(403).json({ error: 'Access denied: unauthorized data deletion' });
    }

    // Cascade delete user history and records from collections
    await DiaryEntry.deleteMany({ userId });
    await DiagnosticResult.deleteMany({ userId });
    await ActivityLog.deleteMany({ userId });

    // Reset stats in UserStats
    await UserStats.findOneAndUpdate(
      { userId },
      {
        breathingSessions: { count: 0, totalMinutes: 0, lastSession: null },
        diagnosticsTaken: { count: 0, lastScore: null, lastDate: null },
        materialsViewed: { count: 0, materials: [] },
        totalSessions: 0,
        totalMinutes: 0,
        lastActiveDate: null
      },
      { new: true, upsert: true }
    );

    // Reset User details
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.diagnostic = { answers: [], completedAt: null };
    user.stats = {
      resilience: 50,
      resilienceMultiplier: 1.0,
      stabilityDays: 0,
      streak: 0,
      longestStreak: 0,
      lastActiveDate: null
    };
    user.badges = [];
    user.completedScenarios = [];
    user.completedMaterials = [];
    user.unlockedScenarios = [];
    user.history = [];

    await user.save();

    res.json({ success: true, message: 'Каскадне видалення даних завершено. Історія активності повністю очищена.' });
  } catch (error) {
    console.error('Error during cascade deletion:', error);
    res.status(500).json({ error: 'Не вдалося виконати каскадне видалення даних' });
  }
});

export default router;
