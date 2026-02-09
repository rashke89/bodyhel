require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Import models
const User = require("../server/models/User");
const Appointment = require("../server/models/Appointment");
const EHR = require("../server/models/EHR");
const Prescription = require("../server/models/Prescription");
const LabResult = require("../server/models/LabResult");
const Message = require("../server/models/Message");

// Load .env file if it exists
require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
});
require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env.local"),
});

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/bodyhel";

// Sample data
const sampleUsers = [
  // Admin
  {
    email: "admin@bodyhel.com",
    password: "Admin123!",
    firstName: "Admin",
    lastName: "Korisnik",
    role: "admin",
    phone: "+381601234567",
    isActive: true,
  },
  // Doctors
  {
    email: "dr.petrovic@bodyhel.com",
    password: "Doctor123!",
    firstName: "Marko",
    lastName: "Petrović",
    role: "doctor",
    phone: "+381601111111",
    specialization: "Kardiologija",
    licenseNumber: "DOC-001",
    department: "Kardiologija",
    isActive: true,
  },
  {
    email: "dr.jovanovic@bodyhel.com",
    password: "Doctor123!",
    firstName: "Ana",
    lastName: "Jovanović",
    role: "doctor",
    phone: "+381602222222",
    specialization: "Pedijatrija",
    licenseNumber: "DOC-002",
    department: "Pedijatrija",
    isActive: true,
  },
  {
    email: "dr.nikolic@bodyhel.com",
    password: "Doctor123!",
    firstName: "Stefan",
    lastName: "Nikolić",
    role: "doctor",
    phone: "+381603333333",
    specialization: "Interna medicina",
    licenseNumber: "DOC-003",
    department: "Interna medicina",
    isActive: true,
  },
  // Nurses
  {
    email: "sestra.maric@bodyhel.com",
    password: "Nurse123!",
    firstName: "Jelena",
    lastName: "Marić",
    role: "nurse",
    phone: "+381604444444",
    specialization: "Opšta sestra",
    licenseNumber: "NUR-001",
    department: "Opšta medicina",
    isActive: true,
  },
  // Receptionist
  {
    email: "recepcionar@bodyhel.com",
    password: "Recep123!",
    firstName: "Milan",
    lastName: "Stojanović",
    role: "receptionist",
    phone: "+381605555555",
    isActive: true,
  },
  // Patients
  {
    email: "pacijent1@bodyhel.com",
    password: "Patient123!",
    firstName: "Petar",
    lastName: "Marković",
    role: "patient",
    phone: "+381606666666",
    dateOfBirth: new Date("1985-05-15"),
    gender: "male",
    bloodType: "A+",
    address: {
      street: "Kneza Miloša 15",
      city: "Beograd",
      postalCode: "11000",
      country: "Srbija",
    },
    emergencyContact: {
      name: "Marija Marković",
      phone: "+381607777777",
      relationship: "Supruga",
    },
    insuranceNumber: "INS-001",
    isActive: true,
  },
  {
    email: "pacijent2@bodyhel.com",
    password: "Patient123!",
    firstName: "Jovana",
    lastName: "Đorđević",
    role: "patient",
    phone: "+381608888888",
    dateOfBirth: new Date("1990-08-22"),
    gender: "female",
    bloodType: "B+",
    address: {
      street: "Nemanjina 25",
      city: "Beograd",
      postalCode: "11000",
      country: "Srbija",
    },
    emergencyContact: {
      name: "Marko Đorđević",
      phone: "+381609999999",
      relationship: "Otac",
    },
    insuranceNumber: "INS-002",
    isActive: true,
  },
  {
    email: "pacijent3@bodyhel.com",
    password: "Patient123!",
    firstName: "Nikola",
    lastName: "Stojanović",
    role: "patient",
    phone: "+381601010101",
    dateOfBirth: new Date("1978-12-10"),
    gender: "male",
    bloodType: "O+",
    address: {
      street: "Bulevar kralja Aleksandra 50",
      city: "Beograd",
      postalCode: "11000",
      country: "Srbija",
    },
    emergencyContact: {
      name: "Snežana Stojanović",
      phone: "+381601111111",
      relationship: "Supruga",
    },
    insuranceNumber: "INS-003",
    isActive: true,
  },
];

async function seedDatabase() {
  try {
    console.log("🔌 Povezivanje sa MongoDB...");
    console.log(`   URI: ${MONGODB_URI.replace(/\/\/.*@/, "//***:***@")}`); // Hide credentials

    // Add connection options
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    });

    console.log("✅ Povezan sa MongoDB");

    // Clear existing data
    console.log("🗑️  Brisanje postojećih podataka...");
    await User.deleteMany({});
    await Appointment.deleteMany({});
    await EHR.deleteMany({});
    await Prescription.deleteMany({});
    await LabResult.deleteMany({});
    await Message.deleteMany({});
    console.log("✅ Podaci obrisani");

    // Create users
    console.log("👥 Kreiranje korisnika...");
    const createdUsers = [];
    for (const userData of sampleUsers) {
      const user = new User(userData);
      await user.save();
      // Generate patient ID if patient (after save to ensure _id exists)
      if (user.role === "patient" && !user.patientId) {
        user.generatePatientId();
        await user.save();
      }
      createdUsers.push(user);
      console.log(
        `   ✓ Kreiran ${user.role}: ${user.email}${
          user.patientId ? ` (${user.patientId})` : ""
        }`
      );
    }
    console.log(`✅ Kreirano ${createdUsers.length} korisnika`);

    // Find users by role
    const admin = createdUsers.find((u) => u.role === "admin");
    const doctors = createdUsers.filter((u) => u.role === "doctor");
    const nurses = createdUsers.filter((u) => u.role === "nurse");
    const patients = createdUsers.filter((u) => u.role === "patient");
    const receptionist = createdUsers.find((u) => u.role === "receptionist");

    // Create EHR for patients
    console.log("📋 Kreiranje EHR zapisa...");
    for (const patient of patients) {
      const ehr = new EHR({
        patient: patient._id,
        createdBy: admin._id,
        diagnoses: [
          {
            code: "I10",
            description: "Essential (primary) hypertension",
            doctor: doctors[0]._id,
            date: new Date("2024-01-15"),
            isPrimary: true,
            status: "active",
          },
        ],
        medicalAlerts: [
          {
            type: "allergy",
            severity: "high",
            description: "Alergija na penicilin",
            active: true,
            addedBy: doctors[0]._id,
            dateAdded: new Date("2024-01-10"),
          },
        ],
        vitalSigns: [
          {
            date: new Date(),
            bloodPressure: { systolic: 130, diastolic: 85 },
            heartRate: 72,
            temperature: 36.6,
            weight: 75,
            height: 175,
            bmi: 24.5,
            measuredBy: nurses[0]._id,
          },
        ],
        medicalHistory: {
          pastIllnesses: ["Hipertenzija", "Dijabetes tip 2"],
          surgeries: [
            {
              name: "Apendektomija",
              date: new Date("2010-05-20"),
              hospital: "Klinički centar Srbije",
            },
          ],
          familyHistory: ["Hipertenzija u porodici", "Dijabetes u porodici"],
          socialHistory: {
            smoking: { status: "Ne puši", details: "" },
            alcohol: { status: "Povremeno", details: "1-2 čaše vina nedeljno" },
            exercise: "Umerena aktivnost 2-3 puta nedeljno",
          },
        },
      });
      await ehr.save();
      console.log(
        `   ✓ EHR kreiran za ${patient.firstName} ${patient.lastName}`
      );
    }
    console.log("✅ EHR zapisi kreirani");

    // Create appointments
    console.log("📅 Kreiranje pregleda...");
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const appointments = [
      {
        patient: patients[0]._id,
        doctor: doctors[0]._id,
        appointmentType: "consultation",
        appointmentCategory: "ambulatory",
        date: tomorrow,
        startTime: "09:00",
        endTime: "09:30",
        duration: 30,
        status: "scheduled",
        reason: "Kontrola krvnog pritiska",
      },
      {
        patient: patients[1]._id,
        doctor: doctors[1]._id,
        appointmentType: "checkup",
        appointmentCategory: "ambulatory",
        date: tomorrow,
        startTime: "10:00",
        endTime: "10:30",
        duration: 30,
        status: "scheduled",
        reason: "Redovni pregled",
      },
      {
        patient: patients[0]._id,
        doctor: doctors[0]._id,
        appointmentType: "telemedicine",
        appointmentCategory: "ambulatory",
        date: nextWeek,
        startTime: "14:00",
        endTime: "14:30",
        duration: 30,
        status: "scheduled",
        reason: "Online konsultacija",
      },
      {
        patient: patients[2]._id,
        doctor: doctors[2]._id,
        appointmentType: "consultation",
        appointmentCategory: "ambulatory",
        date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        startTime: "11:00",
        endTime: "11:30",
        duration: 30,
        status: "completed",
        reason: "Pregled",
      },
    ];

    const createdAppointments = [];
    for (const aptData of appointments) {
      const appointment = new Appointment(aptData);
      await appointment.save();
      createdAppointments.push(appointment);
      console.log(
        `   ✓ Pregled kreiran za ${aptData.date.toLocaleDateString()}`
      );
    }
    console.log(`✅ Kreirano ${createdAppointments.length} pregleda`);

    // Create prescriptions
    console.log("💊 Kreiranje recepta...");
    const prescriptions = [
      {
        patient: patients[0]._id,
        doctor: doctors[0]._id,
        appointment: createdAppointments[3]._id,
        diagnosis: {
          code: "I10",
          description: "Essential (primary) hypertension",
        },
        medications: [
          {
            name: "Lisinopril",
            genericName: "Lisinopril",
            dosage: { amount: "10", unit: "mg" },
            frequency: "1x daily",
            duration: "30 days",
            instructions: "Uzimatii ujutru, posle jela",
            quantity: 30,
            substitutionsAllowed: false,
          },
        ],
        issueDate: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
        status: "active",
        notes: "Kontrola za 30 dana",
      },
      {
        patient: patients[1]._id,
        doctor: doctors[1]._id,
        medications: [
          {
            name: "Paracetamol",
            genericName: "Paracetamol",
            dosage: { amount: "500", unit: "mg" },
            frequency: "2x daily",
            duration: "7 days",
            instructions: "Uzimatii posle jela",
            quantity: 14,
            substitutionsAllowed: true,
          },
        ],
        issueDate: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000),
        status: "active",
      },
    ];

    for (const prescData of prescriptions) {
      const prescription = new Prescription(prescData);
      prescription.ePrescriptionId = `EP${Date.now()}${Math.floor(
        Math.random() * 1000
      )}`;
      await prescription.save();
      console.log(`   ✓ Recept kreiran za ${prescData.medications[0].name}`);
    }
    console.log("✅ Recepti kreirani");

    // Create lab results
    console.log("🔬 Kreiranje lab rezultata...");
    const labResults = [
      {
        patient: patients[0]._id,
        orderNumber: `LAB${Date.now()}001`,
        orderedBy: doctors[0]._id,
        appointment: createdAppointments[3]._id,
        testType: "blood",
        testName: "Kompletna krvna slika",
        orderedDate: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000),
        collectedDate: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
        resultDate: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),
        status: "completed",
        results: [
          {
            parameter: "Hemoglobin",
            value: 145,
            unit: "g/L",
            referenceRange: "130-175",
            flag: "normal",
          },
          {
            parameter: "Eritrociti",
            value: 4.8,
            unit: "x10^12/L",
            referenceRange: "4.5-5.5",
            flag: "normal",
          },
          {
            parameter: "Leukociti",
            value: 7.2,
            unit: "x10^9/L",
            referenceRange: "4.0-10.0",
            flag: "normal",
          },
        ],
        findings: "Svi parametri su u referentnim vrednostima",
        interpretation: "Normalna krvna slika",
        reviewedBy: doctors[0]._id,
        reviewedAt: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        patient: patients[1]._id,
        orderNumber: `LAB${Date.now()}002`,
        orderedBy: doctors[1]._id,
        testType: "blood",
        testName: "Glukoza u krvi",
        orderedDate: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),
        status: "ordered",
      },
    ];

    for (const labData of labResults) {
      const labResult = new LabResult(labData);
      await labResult.save();
      console.log(`   ✓ Lab rezultat kreiran: ${labData.testName}`);
    }
    console.log("✅ Lab rezultati kreirani");

    // Create messages
    console.log("💬 Kreiranje poruka...");
    const messages = [
      {
        sender: doctors[0]._id,
        recipient: patients[0]._id,
        subject: "Rezultati pregleda",
        content:
          "Poštovani, rezultati vašeg pregleda su dobri. Molimo vas da nastavite sa terapijom kako je propisano.",
        type: "message",
        priority: "normal",
        read: false,
      },
      {
        sender: doctors[1]._id,
        recipient: patients[1]._id,
        subject: "Podsetnik za pregled",
        content:
          "Podsećamo vas da imate zakazan pregled sutra u 10:00. Molimo vas da dođete 10 minuta ranije.",
        type: "reminder",
        priority: "normal",
        read: false,
      },
      {
        sender: patients[0]._id,
        recipient: doctors[0]._id,
        subject: "Pitanje o terapiji",
        content:
          "Poštovani doktore, imam pitanje vezano za propisanu terapiju. Da li mogu da uzimam lek sa hranom?",
        type: "message",
        priority: "normal",
        read: true,
        readAt: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
    ];

    for (const msgData of messages) {
      const message = new Message(msgData);
      await message.save();
      console.log(`   ✓ Poruka kreirana: ${msgData.subject}`);
    }
    console.log("✅ Poruke kreirane");

    console.log("\n🎉 Seed proces završen uspešno!");
    console.log("\n📊 Statistika:");
    console.log(`   - Korisnici: ${createdUsers.length}`);
    console.log(`   - EHR zapisi: ${patients.length}`);
    console.log(`   - Pregledi: ${createdAppointments.length}`);
    console.log(`   - Recepti: ${prescriptions.length}`);
    console.log(`   - Lab rezultati: ${labResults.length}`);
    console.log(`   - Poruke: ${messages.length}`);

    console.log("\n🔑 Test nalozí:");
    console.log("   Admin: admin@bodyhel.com / Admin123!");
    console.log("   Doktor: dr.petrovic@bodyhel.com / Doctor123!");
    console.log("   Pacijent: pacijent1@bodyhel.com / Patient123!");

    await mongoose.connection.close();
    console.log("\n✅ Konekcija zatvorena");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Greška pri seed procesu:");
    console.error(`   ${error.message}\n`);

    if (
      error.name === "MongooseServerSelectionError" ||
      error.message.includes("ECONNREFUSED")
    ) {
      console.error("⚠️  MongoDB nije dostupan!");
      console.error("\n📝 Rešenja:");
      console.error("   1. Proverite da li je MongoDB server pokrenut:");
      console.error("      - Lokalno: mongod (ili proverite MongoDB service)");
      console.error("      - macOS: brew services start mongodb-community");
      console.error("      - Windows: Proverite MongoDB service u Services");
      console.error("      - Linux: sudo systemctl start mongod");
      console.error("\n   2. Ili koristite MongoDB Atlas (cloud):");
      console.error("      - Postavite MONGODB_URI u .env fajlu:");
      console.error(
        "      MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bodyhel"
      );
      console.error(
        "\n   3. Proverite da li je MONGODB_URI ispravno postavljen u .env fajlu\n"
      );
    }

    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

// Run seed
seedDatabase();
