import React from 'react';
import { X, HelpCircle, Volume2, ArrowRight, ArrowLeft, Sparkles, BookOpen } from 'lucide-react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#183d38] border-2 border-[#f4d7a1] rounded-2xl shadow-2xl p-6 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#f4d7a1]/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#79b85b]/30 rounded-xl text-[#ffd166]">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#fff1c7] tracking-wide">
                Panduan Bermain JAMATH
              </h2>
              <p className="text-xs text-[#b5d48c]">
                Perpaduan Permainan Tradisional Jamuran & Matematika Garis Bilangan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-6 text-sm text-slate-200">
          {/* Section 1: Mengenal Jamuran */}
          <section className="p-4 bg-[#0f2824] rounded-xl border border-[#79b85b]/30">
            <h3 className="flex items-center gap-2 font-bold text-[#ffd166] text-base mb-2">
              <Sparkles className="w-4 h-4" />
              1. Mengenal Permainan Tradisional Jamuran
            </h3>
            <p className="leading-relaxed text-xs sm:text-sm">
              <strong>Jamuran</strong> adalah dolanan tradisional anak-anak dari Jawa. Anak-anak berpegangan tangan membentuk lingkaran mengelilingi satu anak di tengah yang disebut <strong>"Pancer"</strong>. Sambil berputar, semua anak bernyanyi tembang dolanan:
            </p>
            <div className="mt-2.5 p-3 bg-[#183d38] rounded-lg border border-[#f4d7a1]/20 italic text-center text-[#fff1c7] font-medium text-xs sm:text-sm">
              "Jamuran ya gē-gē thok, jamur apa ya gē-gē thok...<br />
              Jamur gajih mbregijih sa-ara-ara, semprat-semprit jamur apa?"
            </div>
            <p className="mt-2.5 leading-relaxed text-xs sm:text-sm">
              Saat lagu berhenti, Pancer akan meneriakkan nama jamur (misal: <em>Jamur Kethek</em>, <em>Jamur Gagang</em>, atau <em>Jamur Payung</em>), dan semua anak harus memperagakan gerakannya!
            </p>
          </section>

          {/* Section 2: Tantangan Garis Bilangan */}
          <section className="p-4 bg-[#0f2824] rounded-xl border border-[#79b85b]/30">
            <h3 className="flex items-center gap-2 font-bold text-[#ffd166] text-base mb-2">
              <HelpCircle className="w-4 h-4" />
              2. Tantangan Garis Bilangan Matematika
            </h3>
            <p className="leading-relaxed text-xs sm:text-sm mb-3">
              Setelah aksi jamur selesai, Pancer memberikan soal matematika penjumlahan atau pengurangan bilangan bulat. Kamu akan melangkah di atas garis bilangan dari -5 sampai 5:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#183d38] rounded-lg border border-emerald-500/30">
                <div className="flex items-center gap-2 font-bold text-emerald-400 mb-1">
                  <ArrowRight className="w-4 h-4" /> Operasi Penjumlahan (+)
                </div>
                <p>Melangkah ke arah <strong>KANAN</strong> sebanyak nilai penambah.</p>
                <p className="mt-1 text-slate-300">Contoh: <code>-3 + 5 = 2</code> (mulai di -3, maju kanan 5 langkah, sampai di 2).</p>
              </div>
              <div className="p-3 bg-[#183d38] rounded-lg border border-amber-500/30">
                <div className="flex items-center gap-2 font-bold text-amber-400 mb-1">
                  <ArrowLeft className="w-4 h-4" /> Operasi Pengurangan (-)
                </div>
                <p>Melangkah ke arah <strong>KIRI</strong> sebanyak nilai pengurang.</p>
                <p className="mt-1 text-slate-300">Contoh: <code>2 - 4 = -2</code> (mulai di 2, mundur kiri 4 langkah, sampai di -2).</p>
              </div>
            </div>
          </section>

          {/* Section 3: Kontrol */}
          <section className="p-4 bg-[#0f2824] rounded-xl border border-[#79b85b]/30">
            <h3 className="font-bold text-[#ffd166] text-base mb-2">
              3. Tombol & Cara Mengendalikan Karakter
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li className="flex items-start gap-2">
                <span className="font-bold text-[#b5d48c] min-w-28">Fase Lingkaran:</span>
                <span>Gunakan tombol panah <strong>Kiri (◀)</strong> / <strong>Kanan (▶)</strong> atau tombol di layar untuk memutar lingkaran.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-[#b5d48c] min-w-28">Fase Matematika:</span>
                <span>Tekan panah Kiri/Kanan, gunakan tombol sentuh <strong>-1 / +1</strong>, atau sentuh langsung angka pada garis bilangan, lalu tekan tombol <strong>JAWAB</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-[#b5d48c] min-w-28">Suara Gamelan:</span>
                <span>Kamu bisa membisukan atau menyalakan instrumen gamelan tradisional melalui tombol speaker di sudut kanan atas layar.</span>
              </li>
            </ul>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-[#f4d7a1]/30 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#d95d39] hover:bg-[#c44f2d] active:scale-95 text-[#fff1c7] font-bold rounded-xl border border-[#f4d7a1] transition-all shadow-md text-sm"
          >
            Mengerti, Ayo Bermain!
          </button>
        </div>
      </div>
    </div>
  );
};
