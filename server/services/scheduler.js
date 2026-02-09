const cron = require("node-cron");
const { sendAppointmentReminders, generateRecurringAppointments } = require("./reminderService");

let reminderJob = null;
let recurringJob = null;

function startScheduler() {
  console.log("📅 Starting scheduler service...");

  // Run reminder check every 15 minutes
  reminderJob = cron.schedule("*/15 * * * *", async () => {
    console.log(`[${new Date().toISOString()}] Running appointment reminders check...`);
    try {
      const count = await sendAppointmentReminders();
      if (count > 0) {
        console.log(`  Sent ${count} reminder(s)`);
      }
    } catch (error) {
      console.error("  Reminder job error:", error.message);
    }
  });

  // Run recurring appointment generator daily at 2:00 AM
  recurringJob = cron.schedule("0 2 * * *", async () => {
    console.log(`[${new Date().toISOString()}] Running recurring appointments generator...`);
    try {
      const count = await generateRecurringAppointments();
      if (count > 0) {
        console.log(`  Created ${count} recurring appointment(s)`);
      }
    } catch (error) {
      console.error("  Recurring appointments job error:", error.message);
    }
  });

  console.log("  Reminders: every 15 minutes");
  console.log("  Recurring appointments: daily at 2:00 AM");
}

function stopScheduler() {
  if (reminderJob) {
    reminderJob.stop();
    reminderJob = null;
  }
  if (recurringJob) {
    recurringJob.stop();
    recurringJob = null;
  }
  console.log("Scheduler stopped");
}

module.exports = { startScheduler, stopScheduler };
