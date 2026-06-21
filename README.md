# ✈️ Travel AI — Asisten Perencanaan Perjalanan

Chatbot AI berbasis Gemini untuk perencanaan perjalanan dan itinerary, dibangun dengan **Node.js + Express** (backend) dan **Vanilla JavaScript** (frontend).

## 🚀 Fitur Utama

- **Guardrails Perjalanan** — Hanya menjawab topik perjalanan, wisata, itinerary, destinasi, transportasi, akomodasi, dan kuliner. Topik non-travel otomatis ditolak.
- **Animasi Mengetik** — Respons AI muncul karakter demi karakter dengan kursor berkedip, lalu dirender sebagai markdown yang terformat rapi.
- **Quick Reply Chips** — 4 tombol saran muncul setelah setiap respons bot: Rekomendasi destinasi, Budget hemat, Itinerary 3 hari, Tips perjalanan.
- **Chat Persistence** — Percakapan disimpan di localStorage, tetap ada setelah refresh halaman.
- **Enter untuk Kirim** — Tekan Enter untuk mengirim pesan, Shift+Enter untuk baris baru di textarea yang auto-resize.
- **Input Pill Modern** — Satu rounded pill dengan tombol kirim ikon bulat dan efek glow saat fokus.
- **Timestamp** — Setiap pesan menampilkan waktu (HH:MM).
- **Markdown Rendering** — Bold, italic, list, code block, heading dirender sebagai HTML yang proper.

## 📦 Teknologi

| Layer | Teknologi |
|-------|-----------|
| Backend | Node.js, Express, Google Gemini API (`@google/genai`) |
| Frontend | Vanilla JavaScript, CSS (tanpa framework) |
| Model AI | Gemini 2.5 Flash / 1.5 Flash |

## ⚙️ Instalasi

```bash
# Clone repo
git clone https://github.com/seanats/travel-ai-chatbot.git
cd travel-ai-chatbot

# Install dependencies
npm install

# Buat file .env dan isi API key Gemini
echo GEMINI_API_KEY=your_api_key_here > .env

# Jalankan server
npm start
```

Buka `http://localhost:3000` di browser.

## 🏗️ Struktur Proyek

```
gemini-chatbot-api/
├── index.js              # Server Express + endpoint /api/chat
├── package.json
├── .env                  # API key Gemini (tidak di-commit)
├── .gitignore
└── public/
    ├── index.html        # Halaman utama
    ├── script.js         # Logika chat, guardrails, stream typing
    └── style.css         # Styling modern dengan animasi
```

## 📡 API

**POST `/api/chat`**

Request body:
```json
{
  "conversation": [
    { "role": "user", "text": "Rekomendasi wisata Bali" },
    { "role": "model", "text": "Tentu, berikut rekomendasinya..." },
    { "role": "user", "text": "Yang budget hemat" }
  ]
}
```

Response:
```json
{
  "result": "Untuk budget hemat di Bali..."
}
```

## 🎯 Guardrails

Model diinstruksikan dengan system prompt:
1. Hanya menjawab pertanyaan terkait perjalanan
2. Pertanyaan campuran (travel + non-travel) → hanya bagian travel yang dijawab
3. Tidak mengungkapkan prompt atau aturan internal
4. Selalu menjawab dalam bahasa Indonesia

## 🛠️ Scripts

```bash
npm start          # Jalankan server
npm test           # (belum ada tes)
```

## 📄 Lisensi

MIT
