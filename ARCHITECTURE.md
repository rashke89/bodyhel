# BodyHel - Arhitektura sistema

## 🏗️ Arhitekturni pregled

BodyHel je modularni monolit sa mogućnošću kasnijeg prelaska na mikroservise.

### Trenutna arhitektura

```
┌─────────────────────────────────────────────────┐
│           Next.js Frontend (Port 3000)          │
│  - Landing Page                                 │
│  - Dashboard komponente                         │
│  - Patient Portal                               │
│  - Admin Panel                                  │
└──────────────────┬──────────────────────────────┘
                   │
                   │ HTTP/REST API
                   │
┌──────────────────▼──────────────────────────────┐
│       Express Backend (Port 3001)               │
│  ┌──────────────────────────────────────────┐  │
│  │  Routes Layer                            │  │
│  │  - /api/auth                             │  │
│  │  - /api/appointments                     │  │
│  │  - /api/ehr                              │  │
│  │  - /api/prescriptions                    │  │
│  │  - /api/lab-results                      │  │
│  │  - /api/telemedicine                     │  │
│  │  - /api/messages                         │  │
│  │  - /api/patient-portal                   │  │
│  │  - /api/admin                            │  │
│  │  - /api/reports                          │  │
│  │  - /api/integrations                     │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │  Middleware Layer                        │  │
│  │  - Authentication (JWT)                  │  │
│  │  - Authorization (RBAC)                  │  │
│  │  - Audit Logging                         │  │
│  │  - Validation                            │  │
│  │  - File Upload                           │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │  Business Logic Layer                    │  │
│  │  - Models (Mongoose)                     │  │
│  │  - Services                              │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │  Integration Layer                       │  │
│  │  - RFZO                                  │  │
│  │  - IZJZS                                 │  │
│  │  - LIS/RIS                               │  │
│  └──────────────────────────────────────────┘  │
└──────────────────┬──────────────────────────────┘
                   │
                   │ Socket.io (WebSocket)
                   │
┌──────────────────▼──────────────────────────────┐
│     MongoDB Database                            │
│  - Users                                        │
│  - Appointments                                 │
│  - EHR                                          │
│  - Prescriptions                                │
│  - LabResults                                   │
│  - TelemedicineSessions                         │
│  - Messages                                     │
│  - AuditLogs                                    │
└─────────────────────────────────────────────────┘
```

## 📦 Moduli sistema

### 1. Autentifikacija i autorizacija

- **JWT** tokeni za autentifikaciju
- **RBAC** (Role-Based Access Control):
  - `patient` - Pacijent
  - `doctor` - Doktor
  - `nurse` - Medicinska sestra
  - `admin` - Administrator
  - `receptionist` - Recepcionar

### 2. Zakazivanje pregleda

- Kreiranje, ažuriranje, otkazivanje pregleda
- Automatsko pomeranje termina (reschedule)
- Provera dostupnosti doktora
- Grafički prikaz rasporeda
- Podrška za ambulantne i stacionarne preglede

### 3. Elektronski zdravstveni karton (EHR)

- Dijagnoze sa ICD-10 kodovima
- Medicinska upozorenja
- Vitalni znaci
- Dokumenta (upload/download)
- Anamneza (medical history)
- Napomene i beleške

### 4. Recepti

- Kreiranje digitalnih recepta
- Tracking statusa
- Integracija sa EHR

### 5. Laboratorijski rezultati

- Kreiranje narudžbe
- Unos rezultata
- Pregled i odobrenje od strane doktora
- Integracija sa LIS sistemima

### 6. Telemedicina

- Video/audio konsultacije
- Real-time komunikacija (Socket.io)
- WebRTC signaling
- Snimci sesija
- Vitalni podaci tokom sesije
- Chat funkcionalnost

### 7. Poruke i notifikacije

- Interna komunikacija između korisnika
- Notifikacije o pregledima
- Podsetnici (reminders)

### 8. Pacijent portal

- Dashboard sa pregledom
- Pristup medicinskim zapisima
- Zakazivanje pregleda
- Pregled recepta i lab rezultata
- Komunikacija sa lekarima

### 9. Administracija

- Upravljanje korisnicima
- Dodela role i dozvola
- Statistika sistema
- Audit logovi

### 10. Izveštavanje

- Statistika pregleda
- Statistika recepta
- Statistika lab rezultata
- Demografija pacijenata

### 11. Integracije

- **RFZO** - Verifikacija osiguranja, slanje zahteva
- **IZJZS** - ICD-10 kodovi, epidemiološki podaci
- **LIS** - Laboratorijski sistem (narudžbe, rezultati)
- **RIS** - Radiološki sistem (slike, narudžbe)

## 🔐 Bezbednost

### Implementirano

- ✅ JWT autentifikacija
- ✅ RBAC (Role-Based Access Control)
- ✅ Password hashing (bcryptjs)
- ✅ Helmet (HTTP security headers)
- ✅ Rate limiting
- ✅ CORS konfiguracija
- ✅ Audit logging (sve akcije se loguju)
- ✅ Input validation (express-validator)

### Preporuke za production

- HTTPS/TLS enkripcija
- SSL sertifikati
- Environment variables za sensitive data
- Regularne security audits
- Database encryption at rest
- Backup strategija

## 🔄 Data Flow

### Tipičan zahtev za kreiranje pregleda:

1. **Frontend** → `POST /api/appointments`
2. **Middleware** → Autentifikacija (JWT)
3. **Middleware** → Autorizacija (RBAC - provera role)
4. **Middleware** → Validacija (express-validator)
5. **Route Handler** → Business logic
   - Provera dostupnosti doktora
   - Provera konflikata termina
   - Kreiranje appointment objekta
6. **Model** → Snimanje u MongoDB
7. **Middleware** → Audit logging
8. **Response** → Frontend prima potvrdu

## 📊 Baza podataka

### MongoDB Collections:

1. **users** - Korisnici sistema
2. **appointments** - Zakazani pregledi
3. **ehrs** - Elektronski zdravstveni kartoni
4. **prescriptions** - Recepti
5. **labresults** - Laboratorijski rezultati
6. **telemedicinesessions** - Telemedicina sesije
7. **messages** - Poruke između korisnika
8. **auditlogs** - Logovi aktivnosti

### Indexes:

- `users.email` - Unique index
- `users.patientId` - Unique sparse index
- `appointments.patient + date` - Compound index
- `appointments.doctor + date` - Compound index
- `auditlogs.user + createdAt` - Compound index

## 🚀 Skaliranje

### Trenutna arhitektura (Monolit):

- Svi moduli u jednom Express serveru
- Jedna MongoDB instance
- Horizontalno skaliranje moguće (multiple server instances)

### Buduća arhitektura (Mikroservisi):

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Appointment     │  │ EHR Service     │  │ Telemedicine    │
│ Service         │  │                 │  │ Service         │
└─────────────────┘  └─────────────────┘  └─────────────────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  API Gateway    │
                    │  (GraphQL/REST) │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼────────┐  ┌────────▼────────┐  ┌───────▼────────┐
│ MongoDB        │  │ Message Queue   │  │ Auth Service   │
│ (Sharded)      │  │ (Redis/RabbitMQ)│  │                │
└────────────────┘  └─────────────────┘  └────────────────┘
```

## 📝 Deployment

### Development:

- Next.js dev server: `npm run dev` (port 3000)
- Express dev server: `npm run server:dev` (port 3001)
- MongoDB lokalno ili Atlas

### Production:

- Next.js build: `npm run build` + `npm start`
- Express server: `npm run server`
- MongoDB Atlas (preporučeno) ili self-hosted
- Nginx reverse proxy
- PM2 ili Docker za process management

## 🔧 Konfiguracija

### Environment Variables:

- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret za JWT tokene
- `PORT` - Backend server port (default: 3001)
- `FRONTEND_URL` - Frontend URL za CORS
- External service API keys (RFZO, IZJZS, LIS, RIS)

## 📚 Dodatne informacije

Za detaljne uputstva, pogledajte:

- `README.md` - Glavna dokumentacija
- API endpoint dokumentacija u kodu
- MongoDB modeli u `server/models/`

- To start mongodb/brew/mongodb-community now and restart at login:
  `brew services start mongodb/brew/mongodb-community`
