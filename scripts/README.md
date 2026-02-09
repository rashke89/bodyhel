# Seed Scripts

## Seed Database

Seed skripta popunjava bazu podataka sa početnim podacima za testiranje i razvoj.

### Pokretanje

```bash
npm run seed
```

Ili direktno:

```bash
node scripts/seed.js
```

### Šta se kreira

Seed skripta kreira:

1. **Korisnici:**
   - 1 Admin korisnik
   - 3 Doktora (Kardiologija, Pedijatrija, Interna medicina)
   - 1 Medicinska sestra
   - 1 Recepcionar
   - 3 Pacijenta

2. **EHR zapisi:**
   - Za svakog pacijenta se kreira EHR sa:
     - Dijagnozama (ICD-10)
     - Medicinskim upozorenjima
     - Vitalnim znacima
     - Anamnezom (prethodne bolesti, operacije, porodična istorija)

3. **Pregledi:**
   - 4 primer pregleda (scheduled, completed, telemedicine)

4. **Recepti:**
   - 2 primer recepta sa lekovima

5. **Lab rezultati:**
   - 2 primer lab rezultata (jedan completed, jedan ordered)

6. **Poruke:**
   - 3 primer poruke između doktora i pacijenata

### Test nalozí

Nakon pokretanja seed skripte, možete se prijaviti sa:

**Admin:**
- Email: `admin@bodyhel.com`
- Password: `Admin123!`

**Doktor:**
- Email: `dr.petrovic@bodyhel.com`
- Password: `Doctor123!`

**Pacijent:**
- Email: `pacijent1@bodyhel.com`
- Password: `Patient123!`

**Medicinska sestra:**
- Email: `sestra.maric@bodyhel.com`
- Password: `Nurse123!`

**Recepcionar:**
- Email: `recepcionar@bodyhel.com`
- Password: `Recep123!`

### Napomena

⚠️ **VAŽNO:** Seed skripta **briše sve postojeće podatke** pre kreiranja novih. Koristite je samo u development okruženju!

### Environment Variables

Obavezno postavite `MONGODB_URI` u `.env` fajlu:

```env
MONGODB_URI=mongodb://localhost:27017/bodyhel
```

Ili za MongoDB Atlas:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bodyhel
```