# BodyHel - Biznis Predlog
## Digitalno zdravstvo na dohvat ruke

---

## 1. Kratak uvod i vizija

BodyHel je planirana kao moderna, web‑bazirana platforma za upravljanje zdravstvom i pružanje digitalnih zdravstvenih usluga. Sistem će objediniti funkcije ekvivalentne Heliant zdravstvenom informacionom sistemu (zakazivanje pregleda, vođenje elektronskog zdravstvenog kartona, administracija i izveštavanje) te uvesti napredne module: telemedicinu i pacijent‑portal. Razvija se od nule koristeći savremenu JavaScript tehnologiju: Node.js/Express kao backend, MongoDB kao NoSQL bazu podataka i Next.js kao full‑stack frontend okvir. Landing stranica će promovisati aplikaciju, objašnjavati benefite i omogućiti prijavu korisnika.

---

## 2. Ciljevi projekta

### Digitalizacija zdravstvenih procesa
Omogućiti ustanovama i pacijentima kompletnu online podršku za zakazivanje, evidenciju i analizu.

### Poboljšanje dostupnosti i efikasnosti
Telemedicina i pacijent‑portal smanjuju broj poseta i ubrzavaju komunikaciju između pacijenata i zdravstvenih radnika.

### Povećanje sigurnosti i usklađenosti
Implementirati role‑based pristup, enkripciju i usklađenost sa lokalnim propisima (npr. zaštita ličnih podataka).

### Skalabilnost i modularnost
Arhitektura omogućava dodavanje novih funkcija (AI analitika, integracija sa državnim sistemima). Next.js 16 nudi poboljšano keširanje, novi Cache Components model i stabilnu integraciju Turbopacka za brže build‑ove.

---

## 3. Obuhvat funkcionalnosti

### 3.1 Osnovne funkcije (ekvivalent Heliant sistemu)

#### Zakazivanje i upravljanje terminima
Modul za zakazivanje pregleda po lekarima/ordinacijama sa grafičkim prikazom, filtrima, brzim unosom pacijenata, automatskim zakazivanjem i pomeranjem termina.

#### Ambulantni i stacionarni pregledi
Specijalistički pregledi svih oblasti, kurativni i sistematski pregledi, vođenje stomatoloških kartona i stanja zuba; modul stacionarnog liječenja (prijem, terapija, anesteziologija, operacije, otpust).

#### Elektronski zdravstveni karton (EHR)
Čuvanje medicinskih upozorenja, dijagnoza (ICD‑10), recepata, laboratorijskih rezultata, dokumenata, demografskih podataka; napredna pretraga i konfigurabilni obrasci.

#### Administracija i izveštavanje
Upravljanje korisničkim ulogama, rasporedima, pravima pristupa i internim porukama; generisanje statističkih, kapitacionih i grafičkih izveštaja.

### 3.2 Napredne funkcije

#### Telemedicina (daljinske konsultacije)
Omogućava video/audio konsultacije između pacijenata i lekara, zakazivanje on‑line termina i automatsko logovanje posete u EHR. Podržava prenos vitalnih podataka, čuvanje snimaka i asinkronu komunikaciju.

#### Pacijent‑portal
Siguran portal kroz koji pacijenti mogu pristupati medicinskim dokumentima, zakazivati termine, slati poruke lekarima i pregledati edukativne materijale. Automatski podsetnici smanjuju administrativno opterećenje.

---

## 4. Tehnička arhitektura

### 4.1 Pregled slojeva

#### Frontend (Next.js 16)
Koriste se React Server Components i novi Cache Components API za brze navigacije i PPR; Turbopack je zadani bundler za brže build‑ove. Next.js omogućava server‑side rendering (SSR) i static generation (SSG) za landing stranicu i UI aplikacije. Dizajn ćemo implementirati putem Tailwind CSS ili drugog utility CSS frameworka, sa fokusom na pristupačnost.

#### Backend (Node.js + Express)
Express 5 (ili 6 kada postane stabilan) pruža jednostavan i brz HTTP sloj. Express 5 modernizuje kod i donosi native async/await middlewares i sigurnije rutiranje. API će biti RESTful, a eventualno i GraphQL gateway za zahtevnije klijente.

#### Baza podataka (MongoDB Atlas)
NoSQL dokumentna baza omogućava fleksibilno čuvanje medicinskih kartona, termina i logova. Koristi se Mongoose ORM/ODM za definisanje šema i validaciju podataka.

#### Integracioni sloj
Moduli za integraciju sa državnim servisima (RFZO, IZJZS), laboratorijskim sistemima (LIS/RIS) preko secure API‑ja.

#### Komunikacione i telekom usluge
Video pozivi putem WebRTC ili integracije sa telehealth servisima (npr. Twilio, Daily), e-mail/SMS notifikacije.

#### Bezbednost i usklađenost
HTTPS/TLS enkripcija, JWT/OAuth2 autentikacija, enkripcija podataka u mirovanju, role‑based access control, audit logovi. Zbog Express modernizacije fokus će biti na performansama i sigurnosti.

### 4.2 Mikroservisi vs. monolit
Za početak je predviđen modularni monolit sa jasnim podelama (zakazivanje, kartoni, telemedicina, pacijent‑portal). Kako raste obim, moduli se mogu izdvajati u mikroservise uz pomoć Docker/Kubernetes orkestra. MongoDB klaster se može horizontalno skalirati.

---

## 5. Landing stranica

Landing stranica je ključna za predstavljanje BodyHel‑a potencijalnim korisnicima (zdravstvene ustanove, lekari i pacijenti). Predlaže se sledeća struktura:

### Hero sekcija
Naziv „BodyHel" i slogan (npr. „Digitalno zdravstvo na dohvat ruke"), kratki opis i CTA dugmad („Zatraži demo", „Prijavi se").

### Opis platforme
Prikaz glavnih funkcija (zakazivanje, EHR, telemedicina i pacijent‑portal) uz kratke tekstove i ikonice. Ove informacije mogu biti prezentovane kroz kartice ili sekcije.

### Prednosti
Lista benefita (veća efikasnost, smanjeni troškovi, bolje iskustvo pacijenata, skalabilnost), potkrepljena podacima (npr. studije o benefitima pacijent‑portala i telemedicine).

### Demo video / screenshot
Prikaz korisničkog interfejsa i telemedicinske konsultacije.

### Planovi i cena
Kratki pregled paketa (osnovni, napredni, premium sa telemedicinom i pacijent‑portalom). Pruža jasnu vrednost i poziva na kontakt za detaljniju ponudu.

### Sekcija za česta pitanja
Odgovori na najčešće postavljana pitanja (bezbednost, migracija podataka, integracije).

### Kontakt forma i poziv na akciju
Mogućnost da klinike zatraže demo, kao i linkovi za pacijent‑portal.

### Footer
Informacije o kompaniji, partnerima, sertifikatima, zaštiti podataka i linkovima ka društvenim mrežama.

**Tehnički zahtevi:** Stranica treba da bude responzivna, pristupačna (WCAG), optimizovana za SEO i brza zahvaljujući SSR/SSG. Next.js 16 sa Cache Components i Turbopack podrškom obezbeđuje brzo renderovanje i keširanje.

---

## Paleta boja

Platforma koristi sledeću paletu boja za dizajn:

- **Primarna tamna:** `#2C6975` - tamno teal/plavo-zelena
- **Primarna:** `#6BB2A0` - srednje seafoam zelena/mint zelena
- **Primarna svetla:** `#CDE0C9` - svetlo pastel mint zelena/pale sage zelena
- **Pozadinska svetla:** `#E0ECDE` - vrlo svetlo bleda zelena/off-white
- **Bela:** `#FFFFFF` - čista bela

---

**BodyHel** - Digitalno zdravstvo na dohvat ruke