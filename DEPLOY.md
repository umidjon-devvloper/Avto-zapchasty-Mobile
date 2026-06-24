# Zapchasty — Productionga joylashtirish qo'llanmasi

Bu hujjat uchala ilovani (backend, admin panel, mobil ilova) ishlab chiqarishga
chiqarishning to'liq bosqichlarini qamrab oladi.

## 0. Umumiy arxitektura

```
Mobil ilova (Expo)  ─┐
                     ├─►  Backend API (Railway)  ──►  MongoDB Atlas
Admin panel (Vercel) ┘         │  │  │
                               │  │  └──►  Eskiz.uz (SMS / OTP)
                               │  └─────►  Cloudflare R2 (rasmlar)
                               └────────►  Socket.io (real-time chat) + Expo Push
```

Joylashtirish tartibi: **(1) tashqi xizmatlar → (2) backend → (3) admin → (4) mobil**.

---

## 1. Tashqi xizmatlarni tayyorlash

### 1.1 MongoDB Atlas (ma'lumotlar bazasi)
1. https://cloud.mongodb.com — bepul **M0** klaster yarating.
2. **Database Access** → foydalanuvchi yarating (login + parol).
3. **Network Access** → IP allowlist: `0.0.0.0/0` (Railway IP'lari dinamik).
4. **Connect → Drivers** → ulanish satrini oling:
   `mongodb+srv://<user>:<parol>@cluster.xxxx.mongodb.net/autoparts?retryWrites=true&w=majority`
   (oxiriga `/autoparts` — baza nomini qo'shing).
5. *(Ixtiyoriy, lekin tavsiya etiladi)* Qidiruvni kuchaytirish uchun **Atlas Search**
   indekslarini yoqishingiz mumkin (sinonim/fuzzy). Asosiy qidiruv Atlas Search'siz ham
   matn indeksida ishlaydi.

### 1.2 Cloudflare R2 (rasmlar saqlash)
1. Cloudflare → **R2** → bucket yarating (masalan `autoparts`).
2. **Manage R2 API Tokens** → token yarating → `Access Key ID` va `Secret Access Key` oling.
3. **Account ID** ni R2 sahifasidan oling.
4. Public URL: bucketga **Public access** (r2.dev) yoqing yoki custom domen ulang →
   `R2_PUBLIC_URL` (masalan `https://cdn.sizning-domen.uz`).
5. **CORS**: bucket sozlamalarida `GET` ga ruxsat bering (rasmlar ko'rinishi uchun).

> R2 bo'sh qoldirilsa, rasmlar serverda `/uploads` ga saqlanadi — bu faqat sinov uchun,
> productionda R2 majburiy (Railway disk vaqtinchalik).

### 1.3 Eskiz.uz (SMS / OTP)
1. https://eskiz.uz — hisob oching, **email + parol** oling (API token shu orqali olinadi).
2. **Sender (alfa nom)** ni tasdiqlating yoki standart `4546` dan foydalaning (`ESKIZ_FROM`).
3. Tarif/balansni to'ldiring.

> Eskiz bo'sh qoldirilsa — DEV rejim: OTP kodi server konsoliga chiqadi va `devCode` sifatida
> qaytariladi. Productionda Eskiz majburiy.

---

## 2. Backend (Railway)

1. Kodingizni GitHub repozitoriyga joylang.
2. https://railway.app → **New Project → Deploy from GitHub** → backend repo.
3. **Variables** bo'limiga quyidagilarni kiriting:

| O'zgaruvchi | Qiymat |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `4000` (yoki Railway bergan portni qoldiring) |
| `MONGODB_URI` | Atlas ulanish satri |
| `JWT_ACCESS_SECRET` | kuchli tasodifiy satr (≥32 belgi) |
| `JWT_REFRESH_SECRET` | boshqa kuchli tasodifiy satr |
| `JWT_ACCESS_TTL` | `15m` |
| `JWT_REFRESH_TTL` | `30d` |
| `ESKIZ_EMAIL` | Eskiz email |
| `ESKIZ_PASSWORD` | Eskiz parol |
| `ESKIZ_FROM` | `4546` (yoki tasdiqlangan sender) |
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 access key |
| `R2_SECRET_ACCESS_KEY` | R2 secret |
| `R2_BUCKET` | `autoparts` |
| `R2_PUBLIC_URL` | R2 public/custom URL |

> Kuchli secret: `openssl rand -hex 32` yoki `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

4. **Start Command**: `node src/server.js` (yoki `npm start`).
5. **Bazani to'ldirish (bir marta)** — Railway shell yoki lokal terminalda:
   ```bash
   railway run npm run seed
   ```
   Bu kataloglar, brendlar, shaharlar va sinonimlarni yuklaydi.
6. **Domen**: Settings → **Generate Domain** → `https://avtoehtiyot-xxx.up.railway.app`.
   Bu URL admin va mobil uchun API manzili bo'ladi.

**Tekshiruv:** `https://<domen>/api/catalog/categories` → JSON qaytarsa, backend tayyor.
Socket.io WebSocket Railway'da ishlaydi — qo'shimcha sozlash shart emas.

> **CORS:** hozir backend barcha manbalarga ochiq (`cors()`). Mobil (native) uchun CORS
> ahamiyatsiz. Admin domenini cheklamoqchi bo'lsangiz, `src/app.js` dagi `cors()` ni
> `cors({ origin: 'https://admin-domeningiz' })` ga o'zgartiring.

---

## 3. Admin panel (Vercel)

1. https://vercel.com → **Add New → Project** → admin repo.
2. **Root Directory**: admin papkasi (agar monorepo bo'lsa).
3. **Environment Variables**:

| O'zgaruvchi | Qiymat |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://<railway-domen>/api` |

4. **Deploy** → `https://admin-xxx.vercel.app`.

### Birinchi superadmin
1. Admin panelda telefon raqamingiz bilan OTP orqali ro'yxatdan o'ting (avval `buyer` bo'lasiz).
2. MongoDB Atlas → Collections → `users` da o'zingizni toping va rolni yangilang:
   ```js
   db.users.updateOne({ phone: '+998901234567' }, { $set: { role: 'superadmin' } })
   ```
   (Atlas UI → Browse Collections → hujjatni tahrirlash ham mumkin.)
3. Qayta kiring — endi to'liq admin huquqlari bor.

---

## 4. Mobil ilova (EAS Build)

> `eas.json` paket ichida tayyor. `preview`/`production` profillaridagi
> `EXPO_PUBLIC_API_URL` ni o'zingizning Railway domeningizga **o'zgartiring**.

1. EAS CLI:
   ```bash
   npm install -g eas-cli
   eas login
   ```
2. Loyihani EAS'ga bog'lash (bu `app.json` ga `extra.eas.projectId` yozadi — **push uchun zarur**):
   ```bash
   eas init
   ```
3. **APK (test/tarqatish uchun):**
   ```bash
   eas build -p android --profile preview
   ```
   Tayyor bo'lgach EAS yuklab olish havolasini beradi (`.apk`).
4. **Play Store uchun (AAB):**
   ```bash
   eas build -p android --profile production
   eas submit -p android --profile production
   ```

### Push bildirishnomalar (production)
- **Android (FCM):** Firebase loyihasi yarating, `google-services` / FCM hisob ma'lumotlarini
  EAS'ga yuklang:
  ```bash
  eas credentials
  ```
  (Android → Push Notifications → FCM kalitini/Service Account'ni qo'shing.)
- **iOS (APNs):** Apple Developer hisobida APNs kaliti kerak; EAS uni so'raydi.
- Backend `https://exp.host` ga ulanadi — qo'shimcha kalit shart emas (Expo Push Service bepul).

> Push'ni sinash uchun **dev build** ishlating (`--profile development`), chunki SDK 51+
> da remote push Expo Go'da cheklangan.

---

## 5. Production tekshiruv ro'yxati

- [ ] `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` kuchli va maxfiy (repoda emas)
- [ ] MongoDB Atlas avtomatik backup yoqilgan
- [ ] Eskiz sender tasdiqlangan, balans bor
- [ ] R2 bucket public + CORS (`GET`) sozlangan
- [ ] `R2_PUBLIC_URL` to'g'ri (rasmlar mobil/admin'da ochilyapti)
- [ ] Admin `NEXT_PUBLIC_API_URL` production backendga ishora qiladi
- [ ] Mobil `EXPO_PUBLIC_API_URL` (eas.json) production backendga ishora qiladi
- [ ] Birinchi superadmin tayinlangan
- [ ] `eas init` bajarilgan (push uchun `projectId` bor)
- [ ] (Ixtiyoriy) CORS admin domeniga cheklangan

---

## 6. Xulosa: qaysi xizmat nimani ishlatadi

| Komponent | Hosting | Bog'liq xizmatlar |
|---|---|---|
| Backend API + Socket.io | Railway | MongoDB Atlas, Cloudflare R2, Eskiz.uz, Expo Push |
| Admin panel | Vercel | Backend API |
| Mobil ilova | EAS Build → APK/AAB | Backend API, Expo Push (FCM/APNs) |
