const Appointment = require("../models/Appointment");
const Message = require("../models/Message");
const User = require("../models/User");

/**
 * Combines appointment date with startTime string (HH:mm) into a full Date.
 */
function getAppointmentDateTime(appointment) {
  const date = new Date(appointment.date);
  if (appointment.startTime) {
    const [hours, minutes] = appointment.startTime.split(":").map(Number);
    date.setHours(hours, minutes, 0, 0);
  }
  return date;
}

/**
 * Find appointments needing reminders (24h or 1h before).
 * Creates in-app Message records with type "reminder".
 */
async function sendAppointmentReminders() {
  const now = new Date();

  // 24h window: appointments between 23.5h and 24.5h from now
  const h24Start = new Date(now.getTime() + 23.5 * 60 * 60 * 1000);
  const h24End = new Date(now.getTime() + 24.5 * 60 * 60 * 1000);

  // 1h window: appointments between 0.5h and 1.5h from now
  const h1Start = new Date(now.getTime() + 0.5 * 60 * 60 * 1000);
  const h1End = new Date(now.getTime() + 1.5 * 60 * 60 * 1000);

  // Broad date filter (today and tomorrow) to narrow DB query
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const dayAfterTomorrow = new Date(todayStart);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

  const upcomingAppointments = await Appointment.find({
    date: { $gte: todayStart, $lte: dayAfterTomorrow },
    status: { $in: ["scheduled", "confirmed"] },
    remindersSent: { $lt: 2 },
  })
    .populate("patient", "firstName lastName")
    .populate("doctor", "firstName lastName specialization");

  // Find admin user for system messages
  let systemUser = await User.findOne({ role: "admin" }).select("_id");

  let sentCount = 0;

  for (const appointment of upcomingAppointments) {
    const aptDateTime = getAppointmentDateTime(appointment);

    let reminderType = null;
    if (appointment.remindersSent === 0 && aptDateTime >= h24Start && aptDateTime <= h24End) {
      reminderType = "24h";
    } else if (appointment.remindersSent === 1 && aptDateTime >= h1Start && aptDateTime <= h1End) {
      reminderType = "1h";
    }

    if (!reminderType) continue;

    try {
      const sender = systemUser ? systemUser._id : appointment.doctor._id;
      const timeLabel = reminderType === "24h" ? "sutra" : "za sat vremena";
      const dateStr = new Date(appointment.date).toLocaleDateString("sr-RS");
      const doctorName = `${appointment.doctor.firstName} ${appointment.doctor.lastName}`;

      await Message.create({
        sender,
        recipient: appointment.patient._id,
        subject: `Podsetnik: Pregled ${timeLabel}`,
        content: `Postovani ${appointment.patient.firstName}, podsecamo Vas da imate zakazan pregled ${timeLabel} (${dateStr}) u ${appointment.startTime} kod ${doctorName}.`,
        type: "reminder",
        priority: reminderType === "1h" ? "high" : "normal",
        relatedTo: {
          type: "appointment",
          id: appointment._id,
        },
      });

      appointment.remindersSent += 1;
      appointment.lastReminderSent = now;
      await appointment.save();

      sentCount++;
      console.log(`  Reminder (${reminderType}) sent for appointment ${appointment._id}`);
    } catch (error) {
      console.error(`  Failed to send reminder for appointment ${appointment._id}:`, error.message);
    }
  }

  return sentCount;
}

/**
 * Generate next occurrence for completed recurring appointments.
 */
async function generateRecurringAppointments() {
  const completedRecurring = await Appointment.find({
    isRecurring: true,
    status: "completed",
    recurringPattern: { $exists: true, $ne: null },
    recurringEndDate: { $gte: new Date() },
  });

  let created = 0;

  for (const appointment of completedRecurring) {
    try {
      // Check if next occurrence already exists
      const existingNext = await Appointment.findOne({
        parentAppointment: appointment._id,
        status: { $in: ["scheduled", "confirmed"] },
      });

      if (existingNext) continue;

      const nextDate = calculateNextDate(appointment.date, appointment.recurringPattern);
      if (nextDate > appointment.recurringEndDate) continue;

      const newAppointment = new Appointment({
        patient: appointment.patient,
        doctor: appointment.doctor,
        appointmentType: appointment.appointmentType,
        appointmentCategory: appointment.appointmentCategory,
        date: nextDate,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        duration: appointment.duration,
        status: "scheduled",
        reason: appointment.reason,
        notes: `Ponavljajuci pregled (${appointment.recurringPattern})`,
        isRecurring: true,
        recurringPattern: appointment.recurringPattern,
        recurringEndDate: appointment.recurringEndDate,
        parentAppointment: appointment._id,
      });

      await newAppointment.save();
      created++;
      console.log(`  Created recurring appointment ${newAppointment._id} from ${appointment._id}`);
    } catch (error) {
      console.error(`  Failed to generate recurring from ${appointment._id}:`, error.message);
    }
  }

  return created;
}

function calculateNextDate(currentDate, pattern) {
  const date = new Date(currentDate);
  switch (pattern) {
    case "weekly":
      date.setDate(date.getDate() + 7);
      break;
    case "biweekly":
      date.setDate(date.getDate() + 14);
      break;
    case "monthly":
      date.setMonth(date.getMonth() + 1);
      break;
    case "quarterly":
      date.setMonth(date.getMonth() + 3);
      break;
  }
  return date;
}

module.exports = {
  sendAppointmentReminders,
  generateRecurringAppointments,
};
