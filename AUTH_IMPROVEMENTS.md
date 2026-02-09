# Autentifikacija - Poboljšanja

## Implementirane izmene

### 1. Perzistencija autentifikacije
- ✅ User podaci se čuvaju u `localStorage` kao `user` objekat
- ✅ Token se čuva u `localStorage` kao `token`
- ✅ Pri inicijalizaciji, user se učitava iz `localStorage` za instant UI
- ✅ Token se verifikuje na serveru u pozadini

### 2. AuthContext poboljšanja
- ✅ **Inicijalno učitavanje**: User se učitava iz localStorage pre nego što se učita sa servera
- ✅ **checkAuth()**: Verifikuje token i osvežava user podatke
- ✅ **Login**: Čuva user i token u localStorage
- ✅ **Register**: Čuva user i token u localStorage
- ✅ **Logout**: Briše sve iz localStorage
- ✅ **updateUser**: Ažurira localStorage kada se korisnik ažurira

### 3. API klijent poboljšanja
- ✅ **401 handling**: Automatski briše token i redirectuje na login ako je token nevažeći
- ✅ **setToken**: Automatski briše user iz localStorage kada se token briše
- ✅ **Inicijalno učitavanje**: Token se automatski učitava iz localStorage pri kreiranju ApiClient instance

### 4. DashboardLayout poboljšanja
- ✅ **Loading state**: Prikazuje "Učitavanje..." dok se proverava autentifikacija
- ✅ **Verifikacija state**: Prikazuje "Verifikacija..." ako postoji token ali user još nije učitan
- ✅ **Pametni redirect**: Redirectuje samo kada je siguran da korisnik nije autentifikovan

### 5. Login stranica
- ✅ **Auto-redirect**: Ako je korisnik već ulogovan, automatski ga redirectuje na dashboard
- ✅ **Return URL**: Podržava `returnUrl` parametar za redirect nakon logina

## Kako radi

### Flow pri refresh-u:

1. **Page Load**:
   - AuthContext se inicijalizuje
   - User se učitava iz `localStorage.getItem('user')` (instant UI)
   - Token se učitava iz `localStorage.getItem('token')`
   - `loading = true`

2. **checkAuth() poziv**:
   - API klijent već ima token iz localStorage
   - Poziva se `/api/auth/me` sa tokenom
   - Ako je token validan: user se ažurira, čuva u localStorage
   - Ako token nije validan: briše se token i user iz localStorage, `user = null`

3. **DashboardLayout**:
   - Dok je `loading = true`: prikazuje "Učitavanje..."
   - Kada `loading = false`:
     - Ako postoji `user`: prikazuje dashboard
     - Ako ne postoji `user` ali postoji `token`: prikazuje "Verifikacija..." (kratko)
     - Ako ne postoji ni `user` ni `token`: redirect na `/login`

### Flow pri logout:

1. Korisnik klikne "Odjavi se"
2. `logout()` funkcija:
   - `setUser(null)`
   - `api.setToken(null)` → briše token i user iz localStorage
   - `localStorage.removeItem('token')`
   - `localStorage.removeItem('user')`
   - `router.push('/login')`

### Flow kada token istekne:

1. API poziv vraća 401
2. API klijent detektuje 401:
   - `api.setToken(null)` → briše token i user
   - `localStorage.removeItem('token')`
   - `localStorage.removeItem('user')`
   - Redirect na `/login` (ako nije već tamo)

## Testiranje

1. **Login**:
   - Prijavite se
   - Proverite `localStorage` u browser DevTools
   - Trebalo bi da vidite `token` i `user` keys

2. **Refresh**:
   - Refresh stranicu (F5)
   - Trebalo bi da ostanete ulogovani
   - User podaci se učitavaju instant iz localStorage

3. **Token expiry**:
   - Možete ručno obrisati token iz localStorage
   - Refresh stranicu
   - Trebalo bi da vas redirectuje na login

4. **Logout**:
   - Kliknite "Odjavi se"
   - Trebalo bi da se obrišu svi podaci i redirectuje na login

## localStorage struktura

```javascript
localStorage.getItem('token')  // JWT token string
localStorage.getItem('user')   // JSON string sa user objektom
{
  "id": "...",
  "email": "...",
  "firstName": "...",
  "lastName": "...",
  "role": "patient|doctor|admin|...",
  "patientId": "...",
  "specialization": "..."
}
```

## Napomene

- Token se verifikuje na serveru pri svakom page load-u
- Ako server nije dostupan, koristi se cached user iz localStorage (offline mode)
- Token expiry se proverava pri svakom API pozivu
- User podaci se osvežavaju pri svakom page load-u