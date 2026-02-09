# BodyHel - Frontend Dokumentacija

## 🎨 Implementirane stranice i komponente

### Autentifikacija
- ✅ **Login stranica** (`/login`) - Prijava korisnika
- ✅ **Register stranica** (`/register`) - Registracija novih korisnika
- ✅ **Auth Context** - Globalni state management za autentifikaciju

### Patient Portal
- ✅ **Dashboard** (`/dashboard/patient`) - Pregled statistike, predstojećih pregleda, recepta
- ✅ **Appointments** (`/dashboard/patient/appointments`) - Zakazivanje i upravljanje pregledima
- ✅ **Medical Records** (`/dashboard/patient/medical-records`) - Pregled EHR podataka (dijagnoze, vitalni znaci, dokumenta, anamneza)
- ✅ **Prescriptions** (`/dashboard/patient/prescriptions`) - Pregled aktivnih i završenih recepta
- ✅ **Lab Results** (`/dashboard/patient/lab-results`) - Pregled laboratorijskih rezultata
- ✅ **Messages** (`/dashboard/patient/messages`) - Komunikacija sa lekarima
- ✅ **Telemedicine** (`/dashboard/patient/telemedicine`) - Lista telemedicina sesija

### Doctor Portal
- ✅ **Dashboard** (`/dashboard/doctor`) - Pregled današnjih pregleda i statistike
- ✅ **Patient EHR** (`/dashboard/doctor/patients/[id]`) - Kompletan EHR interface sa:
  - Pregledom svih podataka
  - Dodavanjem dijagnoza (ICD-10)
  - Unosom vitalnih znakova
  - Pregledom recepta i lab rezultata

### Admin Portal
- ✅ **Dashboard** (`/dashboard/admin`) - Statistika sistema
- ✅ **Users Management** (`/dashboard/admin/users`) - Upravljanje korisnicima (aktivacija/deaktivacija)

### Shared Components
- ✅ **DashboardLayout** - Navigacija i layout za sve dashboard stranice
- ✅ **API Client** - Centralizovani API klijent za sve backend pozive

## 🔧 Tehnologije

- **Next.js 14** - React framework sa App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **React Hooks** - State management
- **Context API** - Global state (autentifikacija)

## 📡 API Integracija

Svi frontend pozivi idu preko centralizovanog API klijenta (`lib/api.ts`):

```typescript
// Primeri korišćenja
import { api } from '@/lib/api';

// Login
await api.login(email, password);

// Get appointments
const response = await api.getAppointments({ status: 'scheduled' });

// Get EHR
const ehr = await api.getEHR(patientId);

// Add diagnosis
await api.addDiagnosis(patientId, { code: 'I10', description: '...' });
```

## 🎯 Funkcionalnosti

### Patient Features
1. **Zakazivanje pregleda**
   - Pretraga doktora
   - Pregled dostupnih termina
   - Online booking

2. **Pregled medicinskih podataka**
   - Dijagnoze (ICD-10)
   - Vitalni znaci
   - Dokumenta
   - Anamneza

3. **Recepti i lab rezultati**
   - Pregled aktivnih recepta
   - Detalji lekova
   - Lab rezultati sa tabelama

4. **Komunikacija**
   - Poruke sa lekarima
   - Notifikacije

5. **Telemedicina**
   - Lista sesija
   - Pridruživanje sesijama

### Doctor Features
1. **EHR Management**
   - Pregled pacijentovog EHR
   - Dodavanje dijagnoza (sa ICD-10 pretragom)
   - Unos vitalnih znakova
   - Pregled istorije

2. **Dashboard**
   - Današnji pregledi
   - Statistika

### Admin Features
1. **User Management**
   - Lista svih korisnika
   - Pretraga i filtriranje
   - Aktivacija/deaktivacija

2. **Dashboard**
   - Statistika sistema
   - Brze akcije

## 🚀 Pokretanje

1. **Instaliraj dependencies:**
```bash
npm install
```

2. **Konfiguriši environment varijable:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

3. **Pokreni development server:**
```bash
npm run dev
```

4. **Otvori u browseru:**
```
http://localhost:3000
```

## 📝 Navigacija

### Patient Flow
1. Login/Register → Patient Dashboard
2. Dashboard → Appointments/Medical Records/Prescriptions/etc.
3. Appointments → Book new appointment
4. Medical Records → View EHR data
5. Messages → Communicate with doctors

### Doctor Flow
1. Login → Doctor Dashboard
2. Dashboard → View today's appointments
3. Click patient → Open EHR
4. EHR → Add diagnosis/vitals

### Admin Flow
1. Login → Admin Dashboard
2. Dashboard → View statistics
3. Users → Manage users

## 🎨 Dizajn

- **Boje**: Koristi BodyHel paletu boja
  - Primary: `#6BB2A0`
  - Dark: `#2C6975`
  - Light: `#CDE0C9`
  - Background: `#E0ECDE`

- **Komponente**: 
  - Responzivni dizajn
  - Mobile-friendly sidebar
  - Modal dialogs za forme
  - Tabs za organizaciju sadržaja

## 🔐 Bezbednost

- JWT tokeni se čuvaju u localStorage
- Automatska provera autentifikacije na svim dashboard stranicama
- Redirect na login ako korisnik nije autentifikovan
- Role-based navigation (različiti meniji za različite role)

## 📱 Responzivnost

- Mobile-first pristup
- Sidebar se sakriva na mobilnim uređajima
- Grid layout se prilagođava ekranu
- Touch-friendly buttons i inputs

## 🔄 State Management

- **Auth Context** - Globalni auth state
- **Local State** - React useState za komponente
- **API Calls** - Async/await sa error handling

## 📚 Dodatne napomene

- Sve stranice koriste `DashboardLayout` za konzistentan izgled
- API pozivi imaju error handling
- Loading states su implementirani
- Form validation na frontendu
- User feedback kroz alerts i notifications