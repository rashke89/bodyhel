# MongoDB Compass - Vodič za BodyHel bazu

## Kreiranje nove baze u MongoDB Compass

MongoDB Compass je GUI alat za MongoDB. Evo koraka:

### 1. Otvorite MongoDB Compass

Ako već nije otvoren, pokrenite MongoDB Compass aplikaciju.

### 2. Povežite se sa MongoDB serverom

U Compass-u, povežite se sa:
```
mongodb://localhost:27017
```

Ili ako koristite defaultne postavke, samo kliknite "Connect".

### 3. Kreirajte novu bazu

U MongoDB-u, **baze se kreiraju automatski** kada kreiramo prvu kolekciju u njima. 

**Kako kreirati bazu `bodyhel`:**

1. U MongoDB Compass-u, na dnu liste baza, vidite **"CREATE DATABASE"**
2. Kliknite na "CREATE DATABASE"
3. Unesite:
   - **Database Name:** `bodyhel`
   - **Collection Name:** `users` (ili bilo koja kolekcija - ona će biti kreirana)
4. Kliknite "Create Database"

**Ili jednostavnije:** Samo pokrenite seed skriptu - ona će automatski kreirati bazu i sve kolekcije!

### 4. Podešavanje connection string-a za seed skriptu

U vašem `.env` ili `.env.local` fajlu, postavite:

```env
MONGODB_URI=mongodb://localhost:27017/bodyhel
```

Ili ako MongoDB radi na drugom portu:

```env
MONGODB_URI=mongodb://localhost:27017/bodyhel
```

### 5. Provera konekcije

Da proverite da li MongoDB radi:

```bash
# U terminalu
mongosh --eval "db.adminCommand('ping')"
# Trebalo bi da dobijete: { ok: 1 }
```

Ili direktno u Compass-u - ako vidite liste baza, MongoDB radi.

### 6. Pokretanje seed skripte

Sada možete pokrenuti seed skriptu:

```bash
npm run seed
```

Seed skripta će:
- Povezati se sa `mongodb://localhost:27017/bodyhel`
- Automatski kreirati bazu `bodyhel` ako ne postoji
- Kreirati sve potrebne kolekcije (users, appointments, ehrs, itd.)
- Popuniti bazu sa test podacima

## Provera u Compass-u nakon seed-a

Nakon što pokrenete seed skriptu:

1. Otvorite MongoDB Compass
2. Povežite se sa `mongodb://localhost:27017`
3. U listi baza, trebalo bi da vidite **`bodyhel`** bazu
4. Kliknite na `bodyhel` bazu
5. Trebalo bi da vidite kolekcije:
   - `users` (9 korisnika)
   - `appointments` (4 pregleda)
   - `ehrs` (3 EHR zapisa)
   - `prescriptions` (2 recepta)
   - `labresults` (2 lab rezultata)
   - `messages` (3 poruke)

## Troubleshooting

### MongoDB Compass ne može da se poveže

**Proverite da li MongoDB server radi:**

```bash
# macOS
brew services list
# Trebalo bi da vidite mongodb-community status: started

# Ako nije pokrenut:
brew services start mongodb-community
```

**Ili proverite MongoDB service:**

```bash
# Proverite da li port 27017 radi
lsof -i :27017

# Trebalo bi da vidite mongod proces
```

### Seed skripta i dalje ne radi

**Proverite connection string:**

1. U Compass-u, kliknite desni klik na konekciju
2. Kliknite "Copy connection string"
3. Uporedite sa vašim `MONGODB_URI` u `.env` fajlu

**Proverite .env fajl:**

```bash
# U root direktorijumu projekta
cat .env
# ili
cat .env.local

# Trebalo bi da vidite:
MONGODB_URI=mongodb://localhost:27017/bodyhel
```

### Kolekcije se ne vide u Compass-u

- Refresh-ujte Compass (F5 ili kliknite refresh dugme)
- Proverite da li je seed skripta uspešno završena
- Proverite terminal output za greške

## Korisne MongoDB Compass funkcije

### Pregled podataka:
- Kliknite na kolekciju da vidite dokumente
- Filtrirajte dokumente koristeći JSON query
- Edit-ujte dokumente direktno u Compass-u

### Indexes:
- Vidite sve indexe za kolekcije
- Kreirajte nove indexe za bolje performanse

### Performance:
- Monitorujte query performance
- Vidite explain plan za upite

## Next Steps

Nakon što uspešno pokrenete seed skriptu:

1. ✅ Baza `bodyhel` je kreirana
2. ✅ Svi test korisnici su kreirani
3. ✅ Možete se prijaviti sa test nalozima:
   - Admin: `admin@bodyhel.com` / `Admin123!`
   - Doktor: `dr.petrovic@bodyhel.com` / `Doctor123!`
   - Pacijent: `pacijent1@bodyhel.com` / `Patient123!`

4. Pokrenite aplikaciju:
```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
npm run server:dev
```

5. Otvorite browser: http://localhost:3000