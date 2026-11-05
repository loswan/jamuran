# CHECKPOINT RESMI: JAMATH_OFFICIAL_UI_BASELINE_CP4
Tanggal Penetapan: 31 Oktober 2026
Status: STRICT UI FREEZE AKTIF (Baseline Permanen)

---

## 1. Status Checkpoint
Checkpoint ini menandai versi final yang disetujui client untuk seluruh antarmuka Game JAMATH (Jamuran & Matematika).
Seluruh berkas desain UI, layout Flexbox, dan token styling dibekukan (UI Freeze). Modifikasi berikutnya hanya diperkenankan dengan prinsip Controlled Modification pada ruang lingkup spesifik per permintaan.

---

## 2. Manifest Berkas Baseline UI
Berikut daftar berkas yang menjadi acuan standar baseline (DILARANG diubah tanpa izin):

1. `src/index.css`
   - Definisi wajib `#root { width: 100%; height: 100%; min-height: 100%; display: flex; flex-direction: column; }`
   - Palet warna tradisional Jawa: Forest Dark (#112925), Forest Card (#183d38), Gold (#ffd166), Terracotta (#d95d39), Sage (#79b85b).
   - Animasi transisi: curtain, slide, badge-bounce, number-glow, corner-scoreboard.

2. `src/App.tsx`
   - Root Flexbox shell `w-full h-full flex flex-col flex-1 min-h-0 min-w-0 bg-[#091614] overflow-hidden select-none box-border`.

3. `src/components/layout/ResponsiveLandscapeWrapper.tsx`
   - Pembungkus responsif landscape-first.
   - Mengunci proporsi desktop seimbang (`max-w-[1920px] max-h-[1080px]`) jika terdeteksi pointer mouse (`pointer: fine`), dan 100% ekspansi pada mobile landscape.

4. `src/components/OrientationPrompt.tsx`
   - Deteksi orientasi presisi tinggi:
     - Dikecualikan untuk desktop dan laptop.
     - Dikecualikan untuk Menu Utama dan Lobi Kelas.
     - Hanya aktif saat gameplay aktif di HP mobile portrait dalam format floating banner non-blocking (dilengkapi tombol "Lanjut" & "✕").

5. `src/components/ui/` (Pustaka Komponen Baku)
   - `Panel.tsx`: Radius 16px, varian card, subtle, accent, outlined.
   - `Button.tsx`: Radius 10px, tinggi sentuh >= 44px di mobile landscape.
   - `Modal.tsx`: Radius 16px, scroll internal, header & footer sticky.
   - `InputAndBadge.tsx`: Badge radius 6px, Input radius 10px.

6. `src/components/GameComponents.tsx`
   - `GameHeader`: HUD ringkas babak, skor, lirik Jamuran, mute, dan panduan.
   - `RotationPaddles`: Tombol kontrol sentuh jempol melingkar di sudut bawah.
   - `MathControlDock`: Panel kontrol garis bilangan modular (-5 s.d. +5, -1, +1, Jawab).
   - `TurnNominationModal`: Modal 6 kelompok landscape grid.
   - `RetryBanner`: Banner jawaban salah dengan tombol coba lagi.

7. `src/components/MainMenuOverlay.tsx`
   - Tata letak menu utama proporsional tanpa tabrakan.

8. `src/components/LobbyView.tsx`
   - Tampilan lobi room kelas multiplayer dengan grid 6 kelompok.

9. `src/components/MathSuccessTransition.tsx` & `src/components/ScoreboardBadge.tsx`
   - Feedback animasi transisi dan papan skor melayang di sudut layar.

---

## 3. Logika Permainan Terintegrasi
- WebSocket Multiplayer Online 6 Kelompok (14 skenario test lulus 100%).
- Sintesis Web Audio Gamelan Slendro & Pelog (Saron, Bonang, Kendang, Kempul).
- Garis bilangan interaktif & sistem rotasi Pancer.
