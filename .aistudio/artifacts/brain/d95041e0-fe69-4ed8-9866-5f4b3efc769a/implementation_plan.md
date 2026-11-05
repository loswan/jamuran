# Rencana Implementasi: Sistem Efek Suara Tradisional Gamelan & Slendro JAMATH

Berdasarkan preferensi yang Anda pilih:
- **Gaya Efek Suara**: Sintesis Web Audio bernuansa tradisional gamelan dan skala pentatonik (Slendro & Pelog: Saron, Bonang, Kendang, dan Gong Ageng).
- **Pemicu Rintangan Jamuran**: Diputar saat berhasil menahan pose perintah jamuran (*Jamur payung, Jamur gajih, Jamur barat, dll.*) dan saat transisi penunjukan Pancer baru.

---

## 1. Arsitektur Efek Suara (Web Audio API)

Semua efek suara disintesis langsung menggunakan Web Audio API tanpa dependensi file eksternal besar, menjamin responsivitas instan (<10ms latensi) pada perangkat mobile tanpa buffering.

### Frekuensi Pentatonik Slendro & Pelog
- **Pelog/Slendro Ji (275Hz), Ro (308Hz), Lu (348Hz), Ma (412Hz), Nem (465Hz)** dan oktaf tingginya (**JI_HI 550Hz, RO_HI 616Hz, LU_HI 696Hz**).

---

## 2. Rincian Modifikasi Kode

### A. File `src/audio/gamelanAudio.ts`
1. **Peningkatan `playCorrect()` (Jawaban Matematika Benar)**:
   - Menggantikan nada barat standar dengan melodi pentatonik Gamelan Slendro naik cepat (*Ji-Ro-Lu-Ma-Nem-Ji-Hi*).
   - Menambahkan harmonik perunggu (*inharmonic overtone ~2.76x*) khas bilah saron dan pantulan kettle bonang, diakhiri dentang kempul manis beresonansi.
2. **Peningkatan `playWrong()` (Jawaban Matematika Salah)**:
   - Menggantikan nada buzzer kasar dengan bunyi kendang redam (*dhung*) bersanding dengan gesekan nada rendah slendro disonan lembut yang menyemangati pemain untuk mencoba kembali.
3. **Efek Baru `playObstacleSuccess()` (Sukses Melewati Rintangan Pose Jamuran)**:
   - Dijalankan tepat saat timer pose jamuran (*JAMUR_ACTION*) selesai dan pemain sukses menahan pose tanpa terkena diskualifikasi.
   - Sintesis fanfare perayaan Gamelan: arpeggio imbal bonang cepat dipadu pukulan bilah saron gembira dan dentum gong kempul penanda kemenangan rintangan.
4. **Efek Baru `playPancerTransition()` (Transisi Pancer Baru / Giliran Baru)**:
   - Pola kendang ritmis khas pertunjukan tari Jawa (*dhung - tak - dhung - tong!*) dengan gong ageng penutup saat pergantian pancer di tengah arena.
5. **Efek Pembantu `playPoseTick()`**:
   - Ketukan ritmis kendang tak ringan setiap detik terakhir hitung mundur pose jamuran agar pemain merasakan ketegangan menyenangkan saat menahan pose.

### B. File `src/components/JamathGame.tsx`
1. **Integrasi Saat Sukses Tahan Pose Jamuran (`JAMUR_ACTION`)**:
   - Pada transisi `st.actionElapsed >= st.activeCommand.duration`, panggil `audioManager.playObstacleSuccess()` tepat sebelum berpindah ke `MATH_CHALLENGE`.
2. **Integrasi Transisi Pancer Baru (`TURN_NOMINATION` & Penunjukan Pancer)**:
   - Panggil `audioManager.playPancerTransition()` saat pancer baru ditetapkan atau ketika kelompok terpilih menjadi pancer.
3. **Integrasi Matematika**:
   - Pastikan pemanggilan `audioManager.playCorrect()` dan `audioManager.playWrong()` sinkron dengan animasi transisi layar dan confetti.

---

## 3. Rencana Verifikasi & Pengujian

1. **Kompilasi TypeScript**:
   - Menjalankan `compile_applet` untuk memastikan tidak ada kesalahan tipe data atau sintaksis.
2. **ESLint / Validasi Lint**:
   - Menjalankan `lint_applet` untuk memastikan kode bersih tanpa peringatan atau *dead code*.
3. **Verifikasi Sistem Multiplayer**:
   - Menjalankan pengujian regresi multiplayer melalui `npx tsx test-multiplayer.ts` untuk memastikan seluruh alur 14 skenario WebSocket tetap 100% stabil.
4. **Uji Fungsional Interaksi**:
   - Memastikan audio mematuhi kontrol toggle mute (Volume On/Off) dan tidak bocor saat pengguna menonaktifkan suara.
