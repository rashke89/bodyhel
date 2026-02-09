# BodyHel - Digitalno zdravstvo na dohvat ruke

Kompletan zdravstveni informacioni sistem za upravljanje zdravstvenim ustanovama, pacijentima i digitalnim zdravstvenim uslugama.

## 📋 Opis projekta

BodyHel je modularni zdravstveni informacioni sistem koji objedinjuje sve aspekte digitalnog zdravstva:

- **Zakazivanje pregleda** - Upravljanje terminima sa grafičkim prikazom, automatsko pomeranje termina
- **Elektronski zdravstveni karton (EHR)** - Čuvanje dijagnoza (ICD-10), recepta, laboratorijskih rezultata, dokumenta
- **Ambulantni i stacionarni pregledi** - Specijalistički pregledi i vođenje stacionarnog lečenja
- **Telemedicina** - Video/audio konsultacije, snimci sesija, vitalni podaci
- **Pacijent-portal** - Siguran portal za pristup dokumentima, zakazivanje, poruke
- **Administracija i izveštavanje** - Upravljanje korisnicima, role, statistika, izveštaji
- **Integracije** - Povezivanje sa RFZO, IZJZS, LIS/RIS sistemima

## 🛠️ Tehnologije

### Backend
- **Node.js** - Runtime environment
- **Express.js 4** - Web framework za REST API
- **MongoDB** - NoSQL baza podataka
- **Mongoose** - ODM za MongoDB
- **Socket.io** - Real-time komunikacija za telemedicinu
- **JWT** - Autentifikacija i autorizacija
- **bcryptjs** - Hashovanje passworda

### Frontend
- **Next.js 14** - React framework sa SSR/SSG
- **React** - UI biblioteka
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework

### DevOps
- **GitHub Actions** - CI/CD pipeline
- **Docker** (priprema) - Containerization

## 🚀 Početak rada

### Preduslovi

- Node.js 18.0.0 ili noviji
- npm 9.0.0 ili noviji
- MongoDB (lokalno ili MongoDB Atlas)

### Instalacija

1. **Klonirajte repozitorijum**

```bash
git clone <repository-url>
cd bodyhel
```

2. **Instalirajte dependencije**

```bash
npm install
```

3. **Konfigurišite environment varijable**

Kreirajte `.env.local` fajl u root direktorijumu:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/bodyhel
# Ili koristite MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bodyhel

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# External Service Integrations (opciono)
RFZO_API_URL=
RFZO_API_KEY=
IZJZS_API_URL=
IZJZS_API_KEY=
LIS_API_URL=
LIS_API_KEY=
RIS_API_URL=
RIS_API_KEY=
```

4. **Pokrenite MongoDB**

Lokalno:
```bash
mongod
```

Ili koristite MongoDB Atlas (cloud).

5. **Pokrenite development server**

Terminal 1 - Next.js frontend:
```bash
npm run dev
```

Terminal 2 - Express backend:
```bash
npm run server:dev
```

Aplikacija će biti dostupna na:
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:3001](http://localhost:3001)

### Produkcioni build

```bash
# Build Next.js aplikacije
npm run build

# Pokreni produkcioni server
npm start

# Pokreni samo backend
npm run server
```

## 📁 Struktura projekta

```
bodyhel/
├── app/                          # Next.js App Router
│   ├── api/                     # Next.js API rute
│   │   └── contact/
│   ├── globals.css              # Globalni stilovi
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Landing stranica
├── components/                  # React komponente
│   ├── Hero.tsx
│   ├── Features.tsx
│   ├── Benefits.tsx
│   ├── Demo.tsx
│   ├── Pricing.tsx
│   ├── FAQ.tsx
│   ├── Contact.tsx
│   └── Footer.tsx
├── server/                      # Express backend
│   ├── models/                  # Mongoose modeli
│   │   ├── User.js
│   │   ├── Appointment.js
│   │   ├── EHR.js
│   │   ├── Prescription.js
│   │   ├── LabResult.js
│   │   ├── TelemedicineSession.js
│   │   ├── Message.js
│   │   └── AuditLog.js
│   ├── routes/                  # API rute
│   │   ├── auth.js
│   │   ├── appointments.js
│   │   ├── ehr.js
│   │   ├── prescriptions.js
│   │   ├── labResults.js
│   │   ├── telemedicine.js
│   │   ├── messages.js
│   │   ├── patient-portal.js
│   │   ├── admin.js
│   │   ├── reports.js
│   │   └── integrations.js
│   ├── middleware/              # Express middleware
│   │   ├── auth.js              # JWT & RBAC
│   │   ├── audit.js             # Audit logging
│   │   ├── validation.js        # Request validation
│   │   └── upload.js            # File upload
│   ├── integrations/            # Integracije sa spoljnim servisima
│   │   └── externalServices.js  # RFZO, IZJZS, LIS/RIS
│   ├── config/                  # Konfiguracija
│   │   └── database.js          # MongoDB connection
│   ├── utils/                   # Utility funkcije
│   │   └── jwt.js               # JWT helpers
│   └── index.js                 # Server entry point
├── lib/                         # Utility funkcije (Next.js)
│   └── mongodb.ts               # MongoDB connection (Next.js)
├── public/                      # Statički fajlovi
│   └── uploads/                 # Uploaded documents
├── .github/
│   └── workflows/
│       └── ci-cd.yml            # GitHub Actions CI/CD
├── package.json
├── next.config.js
├── tailwind.config.js
└── tsconfig.json
```

## 🔑 API Endpoints

### Autentifikacija
- `POST /api/auth/register` - Registracija korisnika
- `POST /api/auth/login` - Prijava
- `GET /api/auth/me` - Trenutni korisnik
- `PUT /api/auth/me` - Ažuriranje profila
- `PUT /api/auth/change-password` - Promena passworda

### Zakazivanje pregleda
- `GET /api/appointments` - Lista pregleda (sa filterima)
- `GET /api/appointments/:id` - Detalji pregleda
- `POST /api/appointments` - Kreiranje pregleda
- `PUT /api/appointments/:id` - Ažuriranje pregleda
- `POST /api/appointments/:id/reschedule` - Promena termina
- `POST /api/appointments/:id/cancel` - Otkazivanje
- `GET /api/appointments/availability/:doctorId` - Dostupni termini

### Elektronski zdravstveni karton (EHR)
- `GET /api/ehr/patient/:patientId` - EHR pacijenta
- `PUT /api/ehr/patient/:patientId` - Ažuriranje EHR
- `POST /api/ehr/patient/:patientId/diagnosis` - Dodavanje dijagnoze (ICD-10)
- `POST /api/ehr/patient/:patientId/alert` - Medicinsko upozorenje
- `POST /api/ehr/patient/:patientId/vitals` - Vitalni znaci
- `POST /api/ehr/patient/:patientId/documents` - Upload dokumenta
- `GET /api/ehr/search` - Pretraga EHR

### Recepti
- `GET /api/prescriptions` - Lista recepta
- `GET /api/prescriptions/:id` - Detalji recepta
- `POST /api/prescriptions` - Kreiranje recepta
- `PUT /api/prescriptions/:id` - Ažuriranje recepta

### Laboratorijski rezultati
- `GET /api/lab-results` - Lista rezultata
- `GET /api/lab-results/:id` - Detalji rezultata
- `POST /api/lab-results` - Kreiranje narudžbe
- `PUT /api/lab-results/:id` - Ažuriranje rezultata
- `POST /api/lab-results/:id/review` - Pregled rezultata (doktor)

### Telemedicina
- `GET /api/telemedicine` - Lista sesija
- `GET /api/telemedicine/:id` - Detalji sesije
- `POST /api/telemedicine` - Kreiranje sesije
- `POST /api/telemedicine/:id/start` - Pokretanje sesije
- `POST /api/telemedicine/:id/end` - Završetak sesije
- `POST /api/telemedicine/:id/messages` - Chat poruke
- `POST /api/telemedicine/:id/vitals` - Vitalni podaci tokom sesije
- `GET /api/telemedicine/:id/join` - Info za povezivanje

### Poruke
- `GET /api/messages` - Inbox
- `GET /api/messages/sent` - Poslate poruke
- `GET /api/messages/unread-count` - Broj nepročitanih
- `GET /api/messages/:id` - Detalji poruke
- `POST /api/messages` - Slanje poruke
- `PUT /api/messages/:id/read` - Označi kao pročitanu

### Pacijent portal
- `GET /api/patient-portal/dashboard` - Dashboard sa statistikom
- `GET /api/patient-portal/medical-records` - Medicinski zapisi
- `GET /api/patient-portal/documents` - Dokumenta
- `GET /api/patient-portal/appointments` - Pregledi
- `POST /api/patient-portal/appointments` - Zakazivanje
- `GET /api/patient-portal/prescriptions` - Recepti
- `GET /api/patient-portal/lab-results` - Lab rezultati
- `GET /api/patient-portal/doctors` - Lista doktora

### Administracija
- `GET /api/admin/dashboard` - Statistika sistema
- `GET /api/admin/users` - Upravljanje korisnicima
- `GET /api/admin/users/:id` - Detalji korisnika
- `PUT /api/admin/users/:id` - Ažuriranje korisnika
- `DELETE /api/admin/users/:id` - Deaktivacija korisnika
- `GET /api/admin/audit-logs` - Audit logovi

### Izveštaji
- `GET /api/reports/appointments` - Statistika pregleda
- `GET /api/reports/prescriptions` - Statistika recepta
- `GET /api/reports/lab-results` - Statistika lab rezultata
- `GET /api/reports/demographics` - Demografija (admin)

### Integracije
- `POST /api/integrations/rfzo/verify-insurance` - Verifikacija osiguranja
- `POST /api/integrations/rfzo/submit-claim` - Slanje zahteva
- `GET /api/integrations/izjzs/icd10` - ICD-10 kodovi
- `POST /api/integrations/izjzs/epidemiological` - Epidemiološki podaci
- `POST /api/integrations/lis/send-order` - Slanje narudžbe u LIS
- `POST /api/integrations/ris/send-order` - Slanje narudžbe u RIS

## 🔐 Bezbednost

### Autentifikacija i autorizacija
- **JWT** - JSON Web Tokens za autentifikaciju
- **RBAC** - Role-based access control (patient, doctor, nurse, admin, receptionist)
- **Password hashing** - bcryptjs sa salt rounds

### Middleware
- **Helmet** - HTTP security headers
- **Rate limiting** - Zaštita od brute force napada
- **CORS** - Konfigurisano za production

### Audit logging
- Sve akcije korisnika se loguju u `AuditLog` model
- Pristup EHR, recepti, lab rezultati - sve je logovano

## 📊 Baza podataka

### Modeli (Mongoose Schemas)
- **User** - Korisnici sistema (pacijenti, doktori, admini)
- **Appointment** - Zakazani pregledi
- **EHR** - Elektronski zdravstveni karton
- **Prescription** - Recepti
- **LabResult** - Laboratorijski rezultati
- **TelemedicineSession** - Telemedicina sesije
- **Message** - Poruke između korisnika
- **AuditLog** - Logovi aktivnosti

## 🔄 CI/CD Pipeline

GitHub Actions workflow (`ci-cd.yml`) obuhvata:
1. **Test** - Pokretanje testova
2. **Build** - Build aplikacije
3. **Deploy Staging** - Deploy na staging (develop branch)
4. **Deploy Production** - Deploy na production (main branch)

## 🚀 Deployment

### Production preporuke

1. **Environment varijable**
   - Postavite sve potrebne env varijable
   - Koristite sigurne JWT sekrete
   - Konfigurišite MongoDB Atlas ili self-hosted MongoDB

2. **HTTPS/TLS**
   - Obavezno koristite HTTPS u production
   - SSL sertifikati (Let's Encrypt, Cloudflare)

3. **Database**
   - MongoDB Atlas (preporučeno) ili self-hosted sa backup-om
   - Regularni backup-ovi

4. **Security**
   - Rate limiting
   - CORS konfiguracija
   - Input validation
   - SQL injection zaštita (N/A za MongoDB, ali validate input)

5. **Monitoring**
   - Error tracking (Sentry, Rollbar)
   - Performance monitoring
   - Uptime monitoring

## 🧪 Testiranje

```bash
# Run tests (kada budu implementirani)
npm test

# Run linter
npm run lint
```

## 📝 Faze implementacije

1. ✅ **Analiza i planiranje** - Kompletan sistem specifikacija
2. ✅ **Jezgro sistema** - Baza podataka, autentifikacija, middleware
3. ✅ **Backend moduli** - Svi API endpointi
4. ✅ **Frontend landing page** - Landing stranica sa komponentama
5. ⏳ **Frontend aplikacija** - Dashboard, patient portal, admin panel
6. ⏳ **Telemedicina** - WebRTC integracija, Socket.io
7. ⏳ **Testiranje** - Unit, integracioni, E2E testovi
8. ⏳ **Lansiranje** - Production deployment

## 🤝 Doprinos

Projekat je u razvoju. Za doprinos:
1. Fork repozitorijum
2. Kreiram feature branch
3. Commit izmene
4. Push na branch
5. Kreiraj Pull Request

## 📄 Licenca

Privatni projekat - BodyHel

## 👥 Kontakt

Za više informacija, koristite kontakt formu na landing stranici ili kontaktirajte tim za podršku.

---

**BodyHel** - Digitalno zdravstvo na dohvat ruke

**Verzija**: 1.0.0  
**Status**: U razvoju  
**Poslednji update**: 2024