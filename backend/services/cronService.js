const cron = require('node-cron');
const Task = require('../models/Task');
const User = require('../models/User');
const { sendDeadlineReminder, sendOverdueDigest } = require('./emailService');

const startCronJobs = () => {
  // ─── 8 AM IST (02:30 UTC) — 24hr deadline reminders to employees ──────────
  cron.schedule('30 2 * * *', async () => {
    try {
      console.log('⏰ Running deadline reminder cron...');

      const now   = new Date();
      const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const tasks = await Task.find({
        deadline: { $gte: now, $lte: in24h },
        status:   { $ne: 'Done' },
      }).populate('assignedTo', 'name email');

      for (const task of tasks) {
        if (task.assignedTo) {
          await sendDeadlineReminder(task.assignedTo, task);
        }
      }

      console.log(`  → Sent ${tasks.length} deadline reminder(s)`);
    } catch (err) {
      console.error('Deadline reminder cron error:', err.message);
    }
  });

  // ─── 9 AM IST (03:30 UTC) — overdue digest to founder ─────────────────────
  cron.schedule('30 3 * * *', async () => {
    try {
      console.log('⏰ Running overdue digest cron...');

      const overdueTasks = await Task.find({
        deadline: { $lt: new Date() },
        status:   { $ne: 'Done' },
      }).populate('assignedTo', 'name email');

      if (overdueTasks.length === 0) {
        console.log('  → No overdue tasks — skipping digest');
        return;
      }

      const founder = await User.findOne({ email: process.env.FOUNDER_EMAIL });
      if (!founder) {
        console.error('  → Founder account not found — cannot send digest');
        return;
      }

      await sendOverdueDigest(founder, overdueTasks);
      console.log(`  → Sent overdue digest (${overdueTasks.length} task(s))`);
    } catch (err) {
      console.error('Overdue digest cron error:', err.message);
    }
  });

  console.log('⏰ Cron jobs registered');
};

module.exports = { startCronJobs };
