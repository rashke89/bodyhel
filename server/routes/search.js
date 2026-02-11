const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const User = require("../models/User");
const Appointment = require("../models/Appointment");
const Message = require("../models/Message");
const LabResult = require("../models/LabResult");
const Prescription = require("../models/Prescription");

// All search routes require authentication
router.use(authenticate);

// Global search endpoint
router.get("/", async (req, res) => {
  try {
    const { q, limit = 5 } = req.query;

    if (!q || !q.trim()) {
      return res
        .status(400)
        .json({ error: "Search query (q) is required" });
    }

    const query = q.trim();
    const regex = new RegExp(query, "i");
    const maxPerGroup = parseInt(limit, 10) || 5;

    const role = req.user.role;
    const results = {};

    if (role === "doctor" || role === "nurse") {
      // Patients
      const patients = await User.find({
        role: "patient",
        $or: [
          { firstName: regex },
          { lastName: regex },
          { email: regex },
          { patientId: regex },
        ],
      })
        .limit(maxPerGroup)
        .select("firstName lastName email patientId");

      results.patients = patients.map((p) => ({
        id: p._id,
        type: "patient",
        title: `${p.firstName} ${p.lastName}`,
        subtitle: p.patientId || p.email,
        href: `/dashboard/doctor/patients/${p._id}`,
      }));

      // Appointments (filter by doctor and reason, then in-memory filter by patient name)
      const doctorAppointments = await Appointment.find({
        doctor: req.user._id,
      })
        .populate("patient", "firstName lastName patientId")
        .sort({ date: -1 })
        .limit(50);

      const filteredAppointments = doctorAppointments
        .filter((apt) => {
          const reasonMatch = apt.reason && regex.test(apt.reason);
          const patientName = `${apt.patient?.firstName || ""} ${
            apt.patient?.lastName || ""
          }`;
          const patientId = apt.patient?.patientId || "";
          const patientMatch =
            regex.test(patientName) || regex.test(patientId);
          return reasonMatch || patientMatch;
        })
        .slice(0, maxPerGroup);

      results.appointments = filteredAppointments.map((apt) => ({
        id: apt._id,
        type: "appointment",
        title: `${apt.patient?.firstName || ""} ${
          apt.patient?.lastName || ""
        } - ${apt.startTime} ${apt.date.toLocaleDateString("sr-RS")}`,
        subtitle: apt.reason || apt.appointmentType,
        href: "/dashboard/doctor/appointments",
      }));

      // Messages
      const messages = await Message.find({
        $and: [
          { $or: [{ sender: req.user._id }, { recipient: req.user._id }] },
          { $or: [{ subject: regex }, { content: regex }] },
        ],
      })
        .populate("sender", "firstName lastName role")
        .populate("recipient", "firstName lastName role")
        .sort({ createdAt: -1 })
        .limit(maxPerGroup);

      results.messages = messages.map((m) => ({
        id: m._id,
        type: "message",
        title:
          m.subject ||
          `Poruka sa ${m.sender.firstName} ${m.sender.lastName}`,
        subtitle: m.content?.slice(0, 80) || "",
        href: "/dashboard/doctor/messages",
      }));
    } else if (role === "patient") {
      // Doctor names and reasons in appointments
      const patientAppointments = await Appointment.find({
        patient: req.user._id,
      })
        .populate("doctor", "firstName lastName specialization")
        .sort({ date: -1 })
        .limit(50);

      const filteredAppointments = patientAppointments
        .filter((apt) => {
          const doctorName = `${apt.doctor?.firstName || ""} ${
            apt.doctor?.lastName || ""
          }`;
          const specialization = apt.doctor?.specialization || "";
          const reason = apt.reason || "";
          return (
            regex.test(doctorName) ||
            regex.test(specialization) ||
            regex.test(reason)
          );
        })
        .slice(0, maxPerGroup);

      results.appointments = filteredAppointments.map((apt) => ({
        id: apt._id,
        type: "appointment",
        title: `${apt.doctor?.firstName || ""} ${
          apt.doctor?.lastName || ""
        } - ${apt.startTime} ${apt.date.toLocaleDateString("sr-RS")}`,
        subtitle: apt.reason || apt.appointmentType,
        href: "/dashboard/patient/appointments",
      }));

      // Messages (inbox)
      const messages = await Message.find({
        recipient: req.user._id,
        $or: [{ subject: regex }, { content: regex }],
      })
        .populate("sender", "firstName lastName role")
        .sort({ createdAt: -1 })
        .limit(maxPerGroup);

      results.messages = messages.map((m) => ({
        id: m._id,
        type: "message",
        title:
          m.subject ||
          `Poruka od ${m.sender.firstName} ${m.sender.lastName}`,
        subtitle: m.content?.slice(0, 80) || "",
        href: "/dashboard/patient/messages",
      }));

      // Lab results
      const labResults = await LabResult.find({
        patient: req.user._id,
        $or: [{ testName: regex }, { testType: regex }],
      })
        .sort({ orderedDate: -1 })
        .limit(maxPerGroup);

      results.labResults = labResults.map((lr) => ({
        id: lr._id,
        type: "lab-result",
        title: lr.testName,
        subtitle: lr.testType,
        href: "/dashboard/patient/lab-results",
      }));

      // Prescriptions
      const prescriptions = await Prescription.find({
        patient: req.user._id,
        $or: [{ "medications.name": regex }, { notes: regex }],
      })
        .sort({ issueDate: -1 })
        .limit(maxPerGroup);

      results.prescriptions = prescriptions.map((p) => ({
        id: p._id,
        type: "prescription",
        title: `Recept - ${p.issueDate.toLocaleDateString("sr-RS")}`,
        subtitle: p.notes || "",
        href: "/dashboard/patient/prescriptions",
      }));
    } else if (role === "admin" || role === "receptionist") {
      // Users
      const users = await User.find({
        $or: [
          { firstName: regex },
          { lastName: regex },
          { email: regex },
          { patientId: regex },
        ],
      })
        .limit(maxPerGroup)
        .select("firstName lastName email role patientId");

      results.users = users.map((u) => ({
        id: u._id,
        type: "user",
        title: `${u.firstName} ${u.lastName}`,
        subtitle: `${u.role} • ${u.patientId || u.email}`,
        href: "/dashboard/admin/users",
      }));

      // Appointments (by patient/doctor name or reason)
      const appointments = await Appointment.find({})
        .populate("patient", "firstName lastName patientId")
        .populate("doctor", "firstName lastName specialization")
        .sort({ date: -1 })
        .limit(50);

      const filteredAppointments = appointments
        .filter((apt) => {
          const doctorName = `${apt.doctor?.firstName || ""} ${
            apt.doctor?.lastName || ""
          }`;
          const patientName = `${apt.patient?.firstName || ""} ${
            apt.patient?.lastName || ""
          }`;
          const reason = apt.reason || "";
          const specialization = apt.doctor?.specialization || "";
          return (
            regex.test(doctorName) ||
            regex.test(patientName) ||
            regex.test(reason) ||
            regex.test(specialization)
          );
        })
        .slice(0, maxPerGroup);

      results.appointments = filteredAppointments.map((apt) => ({
        id: apt._id,
        type: "appointment",
        title: `${apt.patient?.firstName || ""} ${
          apt.patient?.lastName || ""
        } ↔ ${apt.doctor?.firstName || ""} ${
          apt.doctor?.lastName || ""
        }`,
        subtitle: `${apt.reason || apt.appointmentType} • ${apt.startTime} ${apt.date.toLocaleDateString("sr-RS")}`,
        href: "/dashboard/admin/appointments",
      }));
    }

    res.json({ query, results });
  } catch (error) {
    console.error("Global search error:", error);
    res.status(500).json({ error: "Search failed" });
  }
});

module.exports = router;

