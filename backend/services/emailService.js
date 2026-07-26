const nodemailer = require('nodemailer');

// ─── Transporter ──────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-IN', {
    day:   'numeric',
    month: 'long',
    year:  'numeric',
  });

const formatTime = (date) =>
  new Date(date).toLocaleString('en-IN', {
    day:    'numeric',
    month:  'long',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  });

const daysBetween = (date) =>
  Math.ceil((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));

const DASHBOARD = () => process.env.DASHBOARD_URL || 'https://your-app.vercel.app';

// ─── Send helper ──────────────────────────────────────────────────────────────
const send = async ({ to, subject, text }) => {
  try {
    await transporter.sendMail({
      from: `"Namhya Tasks" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });
  } catch (err) {
    console.error(`❌ Email failed (${subject}):`, err.message);
    // Non-fatal — don't throw, let the API response succeed
  }
};

// ─── Trigger 1: Task Assignment → employee ────────────────────────────────────
const sendTaskAssignment = async (employee, task) => {
  await send({
    to:      employee.email,
    subject: `New task assigned to you — ${task.title}`,
    text: `Hi ${employee.name},

${task.createdByName || 'Your manager'} has assigned you a new task.

Task: ${task.title}
Description: ${task.description || 'N/A'}
Deadline: ${formatDate(task.deadline)}
Priority: ${task.priority}

Open the dashboard to view and update your task:
${DASHBOARD()}`,
  });
};

// ─── Trigger 2: Task Completion → founder ─────────────────────────────────────
const sendTaskCompletion = async (founder, task, employee) => {
  await send({
    to:      founder.email,
    subject: `✅ Task completed — ${task.title}`,
    text: `Hi,

${employee.name} has marked a task as Done.

Task: ${task.title}
Completed at: ${formatTime(new Date())}

View it on the dashboard: ${DASHBOARD()}`,
  });
};

// ─── Trigger 3: Deadline Reminder (24h) → employee ───────────────────────────
const sendDeadlineReminder = async (employee, task) => {
  await send({
    to:      employee.email,
    subject: `⏰ Task due tomorrow — ${task.title}`,
    text: `Hi ${employee.name},

This is a reminder that the following task is due tomorrow.

Task: ${task.title}
Deadline: ${formatDate(task.deadline)}
Current Status: ${task.status}

Please update your progress on the dashboard:
${DASHBOARD()}`,
  });
};

// ─── Trigger 4: Overdue Digest → founder ─────────────────────────────────────
const sendOverdueDigest = async (founder, overdueTasks) => {
  const taskLines = overdueTasks
    .map((t) => {
      const employeeName = t.assignedTo?.name || 'Unknown';
      const daysOver = daysBetween(t.deadline);
      return `${t.title} — ${employeeName} — ${daysOver} day${daysOver !== 1 ? 's' : ''} overdue`;
    })
    .join('\n');

  await send({
    to:      founder.email,
    subject: `🔴 Overdue Tasks — ${formatDate(new Date())}`,
    text: `Hi,

The following tasks are overdue as of today.

${taskLines}

Review and follow up on the dashboard:
${DASHBOARD()}`,
  });
};

// ─── Trigger 5: Announcement → employees ──────────────────────────────────────
const sendAnnouncementEmail = async (employee, announcement) => {
  await send({
    to:      employee.email,
    subject: `📢 New Announcement: ${announcement.title}`,
    text: `Hi ${employee.name},

A new announcement has been posted by the founder:

${announcement.title}
${'-'.repeat(announcement.title.length)}

${announcement.body}

View it on the dashboard:
${DASHBOARD()}`,
  });
};

// ─── Trigger 6: Overdue Notice → employee ─────────────────────────────────────
const sendOverdueNotice = async (employee, task) => {
  await send({
    to:      employee.email,
    subject: `⚠️ URGENT: Task Overdue — ${task.title}`,
    text: `Hi ${employee.name},

This is an automated notice that your task is now OVERDUE.

Task: ${task.title}
Deadline was: ${formatDate(task.deadline)}
Current Status: ${task.status}

Please complete this task immediately and update the dashboard:
${DASHBOARD()}`,
  });
};

module.exports = {
  sendTaskAssignment,
  sendTaskCompletion,
  sendDeadlineReminder,
  sendOverdueDigest,
  sendAnnouncementEmail,
  sendOverdueNotice,
};
