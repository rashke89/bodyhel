# MongoDB Setup Guide

## Problem: MongoDB connection refused

Ako dobijate grešku `ECONNREFUSED ::1:27017` ili `connect ECONNREFUSED 127.0.0.1:27017`, to znači da MongoDB server nije pokrenut.

## Rešenja

### Opcija 1: Pokrenite lokalni MongoDB server

#### macOS (sa Homebrew):
```bash
# Instaliraj MongoDB (ako nije instaliran)
brew tap mongodb/brew
brew install mongodb-community

# Pokreni MongoDB
brew services start mongodb-community

# Ili ručno:
mongod --config /usr/local/etc/mongod.conf
```

#### Linux (Ubuntu/Debian):
```bash
# Instaliraj MongoDB
sudo apt-get update
sudo apt-get install -y mongodb

# Pokreni MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod  # Za auto-start

# Proveri status
sudo systemctl status mongod
```

#### Windows:
1. Otvori "Services" (Win + R, ukucaj `services.msc`)
2. Pronađi "MongoDB" servis
3. Klikni desni klik → Start

Ili preko Command Prompt kao Administrator:
```cmd
net start MongoDB
```

### Opcija 2: Koristite MongoDB Atlas (Cloud - Preporučeno)

1. **Registrujte se na MongoDB Atlas:**
   - Idite na https://www.mongodb.com/cloud/atlas
   - Kreirajte besplatan nalog

2. **Kreirajte cluster:**
   - Kliknite "Build a Database"
   - Izaberite FREE tier (M0)
   - Izaberite region (najbliži vama)
   - Kliknite "Create"

3. **Kreirajte database user:**
   - Security → Database Access
   - Add New Database User
   - Username i Password
   - Database User Privileges: "Read and write to any database"

4. **Omogućite pristup:**
   - Security → Network Access
   - Add IP Address
   - Allow Access from Anywhere (0.0.0.0/0) - za development
   - Ili dodajte vašu IP adresu

5. **Povežite se:**
   - Database → Connect
   - Izaberite "Connect your application"
   - Kopirajte connection string

6. **Postavite u .env:**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/bodyhel?retryWrites=true&w=majority
   ```
   Zamenite `username`, `password`, i `cluster0.xxxxx` sa vašim vrednostima.

### Opcija 3: Koristite Docker

Ako imate Docker instaliran:

```bash
# Pokreni MongoDB u Docker kontejneru
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Proveri da li radi
docker ps

# Zaustavi
docker stop mongodb

# Pokreni ponovo
docker start mongodb
```

## Provera konekcije

Nakon što pokrenete MongoDB, proverite da li radi:

```bash
# Povežite se preko MongoDB shell
mongosh

# Ili za starije verzije:
mongo
```

Ako se uspešno povežete, viditećete prompt:
```
Current Mongosh Log ID: ...
Connecting to: mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000
Using MongoDB: 7.0.x
Using Mongosh: 2.0.x
```

## Pokretanje seed skripte

Nakon što je MongoDB pokrenut:

```bash
npm run seed
```

Ili proverite da li je MongoDB dostupan pre pokretanja:

```bash
# Proveri da li MongoDB server radi
mongosh --eval "db.adminCommand('ping')"

# Ako dobijete: { ok: 1 }, MongoDB radi!
```

## Troubleshooting

### MongoDB se ne pokreće

**macOS:**
```bash
# Proveri logove
tail -f /usr/local/var/log/mongodb/mongo.log

# Proveri da li port 27017 nije zauzet
lsof -i :27017

# Ako je port zauzet, zaustavite proces
kill -9 <PID>
```

**Linux:**
```bash
# Proveri logove
sudo tail -f /var/log/mongodb/mongod.log

# Proveri status
sudo systemctl status mongod
```

### MongoDB Atlas connection issues

- Proverite da li je vaša IP adresa dozvoljena u Network Access
- Proverite da li su username i password ispravni
- Proverite connection string format
- Možda treba da promenite `retryWrites=true` u connection stringu

## Preporuke

Za development, preporučujem:
- **MongoDB Atlas** (besplatno, lako setup, cloud backup)
- **Docker** (ako već koristite Docker za druge servise)

Za production:
- **MongoDB Atlas** (scalable, managed, secure)
- **Self-hosted MongoDB** sa proper backup strategijom