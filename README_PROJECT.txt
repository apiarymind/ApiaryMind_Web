# ApiaryMind Web (Next.js 14 + TypeScript + Firebase Hosting)

Frontend portalu ApiaryMind – wersja szkieletowa przygotowana do dalszej rozbudowy przez backend (Strapi + Supabase) i integrację z portalem CMS.

---

## ⭐ Stos technologiczny

- **Next.js 14 (App Router)**
- **TypeScript**
- **Firebase Hosting**  
  (projekt: `apiarymindv2`)
- **Firebase Auth Web SDK**  
  (logowanie WWW zostanie dodane później)
- **Strapi + Supabase**  
  (backend, podłączany osobno — inne repo)

---

## 🔧 Konfiguracja środowiska

### 1. Skopiuj `.env.example` → `.env.local`

Uzupełnij klucze Firebase Web oraz adres backendu Strapi:

```bash
cp .env.example .env.local
Uzupełnij klucze Firebase Web i adres Strapi w .env.local.

Zainstaluj zależności:

npm install


Uruchom wersję deweloperską:

npm run dev


Strona dostępna pod:

http://localhost:3000

Budowanie i eksport

Projekt używa statycznego eksportu (output: 'export' w next.config.mjs).

Build:
npm run build

Export:
npx next export


Pliki wygenerują się do folderu out/.

Deploy na Firebase Hosting
firebase deploy --only hosting


Hosting:

https://apiarymindv2.web.app/

Struktura projektu
app/
  layout.tsx
  page.tsx

lib/
  api.ts          ← klient CMS (pages/sections Strapi)
  apiClient.ts    ← klient REST (pasieki/ule/magazyn/AI)
  firebase.ts     ← konfiguracja Firebase Web

public/
  … zasoby statyczne …

firebase.json      ← konfiguracja Firebase Hosting
.firebaserc        ← wybór projektu Firebase
next.config.mjs    ← konfiguracja Next.js (output: export)
package.json
tsconfig.json
.env.example       ← zmienne środowiskowe (bez tajnych kluczy)

Status

Frontend ApiaryMind jest gotowy do:

integracji z backendem Strapi,

podłączenia CMS i API,

dalszej rozbudowy panelu WWW,

wdrożenia na Firebase Hosting.

Cała logika backendowa (modele, API, CMS, pożytki, magazyn, AI itd.) będzie implementowana w repozytorium:

ApiaryMind_Strapi

Projekt gotowy do dalszej pracy.


---

# KONIEC  
Nic nie dopisujesz.  
Nic nie zmieniasz.  
Wklejasz taki jaki jest.

Chcesz teraz dokładnie taki sam **README dla backendu Strapi?**
