# Zapchasty — mobil ilova (Expo React Native)

Avtoehtiyot qismlar C2C e'lonlar bozorining xaridor/sotuvchi mobil ilovasi.
Backend public API (`/catalog`, `/search`, `/listings`, `/auth`, `/upload`) ga ulanadi.

## Stack
- **Expo SDK 51** + **expo-router** (fayl asosidagi navigatsiya)
- **React Native 0.74**, TypeScript (strict)
- **TanStack Query v5** — server holati, infinite scroll
- **Zustand** (+ AsyncStorage persist) — auth sessiyasi
- **axios** — avtomatik token-refresh interceptor
- **expo-image**, **expo-image-picker** — rasm ko'rsatish va yuklash
- **expo-notifications** (+ expo-device) — push bildirishnomalar
- **socket.io-client** — real-time chat
- **@expo/vector-icons** (Ionicons)

## Tuzilish
```
app/                         expo-router route'lari
├── _layout.tsx              root Stack + providerlar + auth hydratsiya gate
├── (tabs)/
│   ├── _layout.tsx          Tab bar (Bosh / Qidiruv / Saralangan / Profil)
│   ├── index.tsx            Bosh — kategoriyalar gridi + ommabop brendlar
│   ├── search.tsx           Qidiruv — debounce + infinite scroll + filtrlar
│   ├── messages.tsx         Xabarlar (inbox) — o'qilmaganlar belgisi bilan
│   ├── favorites.tsx        Saralangan (auth talab qiladi)
│   └── profile.tsx          Profil + menyu + chiqish
├── listing/[id].tsx         E'lon tafsiloti — rasm pager, OEM, fitment, qo'ng'iroq
├── category/[id].tsx        Kategoriya bo'yicha e'lonlar
├── auth/login.tsx           Telefon + OTP kirish (modal)
├── create-listing.tsx       E'lon berish (forma + rasm yuklash, auth talab qiladi)
├── my-listings.tsx          Sotuvchining e'lonlari (status bilan)
└── chat/[id].tsx            Suhbat oynasi (real-time xabarlar)

src/
├── lib/        api.ts, auth.ts (zustand), query.tsx, types.ts, format.ts, image.ts, category-icons.ts, push.ts, socket.ts
├── components/ Button, Input, Badge, Loading, EmptyState, ListingCard, CategoryTile, PickerSheet, AuthPrompt
├── theme/      ranglar, oraliqlar, radius, label lug'atlari
└── config.ts   API_URL
```

## O'rnatish va ishga tushirish
```bash
npm install
cp .env.example .env        # EXPO_PUBLIC_API_URL ni sozlang
npm start                   # Expo dev server (QR kod)
```
So'ng **Expo Go** (telefon) yoki emulyatorda oching.

### ⚠️ API manzili (muhim)
`EXPO_PUBLIC_API_URL` backendga ishora qilishi kerak:
- **Haqiqiy qurilma (Expo Go):** kompyuteringizning LAN IP si — masalan `http://192.168.1.10:4000/api` (`localhost` ishlamaydi!)
- **Android emulyator:** `http://10.0.2.2:4000/api`
- **iOS simulyator:** `http://localhost:4000/api`

Backend ishlab turishi shart (`npm run dev`, 4000-port). DEV rejimida SMS o'rniga
tasdiqlash kodi backend konsolida chiqadi va ilovada **Alert** orqali ko'rsatiladi.

## Oqim
Sotuvchi e'lon beradi (create-listing) → admin moderatsiya qiladi → e'lon `active` bo'ladi
→ xaridor qidiradi/ko'radi → sotuvchiga **qo'ng'iroq qiladi** (`tel:` orqali). Savatcha yo'q — C2C model.

## Chat (xabarlashuv)
Xaridor e'lon sahifasidagi **«Yozish»** tugmasi orqali sotuvchi bilan real-time suhbat
boshlaydi (`POST /chat/conversations` → suhbat ochiladi/topiladi). Socket.io (`src/lib/socket.ts`)
yangi xabarlarni darhol yetkazadi; **Xabarlar** tabida o'qilmaganlar soni ko'rsatiladi.
Xabar yuborilganda qabul qiluvchiga **push bildirishnoma** ham boradi. «Qo'ng'iroq» tugmasi
saqlanib qoladi — foydalanuvchi yozish yoki qo'ng'iroqni tanlaydi (C2C model).

## Shikoyat (report)
E'lon sahifasidagi **«Shikoyat qilish»** orqali foydalanuvchi sabab (spam, firibgarlik,
taqiqlangan mahsulot va h.k.) va ixtiyoriy izoh bilan shikoyat yuboradi (`POST /reports`).
Shikoyatlar admin panelidagi **Shikoyatlar** bo'limida ko'rib chiqiladi va e'lon rad etilishi mumkin.

## Push bildirishnomalar
Tizimga kirgan foydalanuvchi avtomatik Expo push tokeni olib backendga yuboradi
(`src/lib/push.ts` → `POST /users/push-token`). Backend quyidagi hodisalarda push yuboradi:
- **E'lon tasdiqlandi / rad etildi** — admin moderatsiyasidan so'ng sotuvchiga
- **E'lon saralandi** — kimdir e'lonni sevimliga qo'shganda sotuvchiga

Bildirishnoma bosilsa, ilova tegishli e'lon sahifasini ochadi.

> **Production:** real push uchun `eas init` qilib `app.json` ichidagi
> `extra.eas.projectId` ni to'ldiring. SDK 51 da push Expo Go'da ham ishlaydi;
> ishonchli sinov uchun **dev build** (`eas build --profile development`) tavsiya etiladi.
> Backendda bu `https://exp.host` ga ulanadi — tarmoqda ruxsat berilgan bo'lishi kerak.

## Rasmlar
DEV rejimida backend rasmlarni `/uploads/...` (lokal) sifatida qaytaradi; ilova ularni
API originiga bog'lab to'liq URL qiladi (`src/lib/image.ts`). Productionда R2 (Cloudflare)
to'liq URL lari o'zgarmasdan ishlaydi.

## Build (EAS)
```bash
npm i -g eas-cli && eas login
eas build -p android --profile preview
```
# Avto-zapchasty-Mobile
