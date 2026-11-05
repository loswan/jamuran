import React from 'react';
import { Modal, Button, Badge } from './ui';
import { BookOpen, Sparkles, HelpCircle, ArrowRight, ArrowLeft, Check } from 'lucide-react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="PANDUAN BERMAIN JAMATH"
      subtitle="Perpaduan Permainan Tradisional Jamuran & Matematika Garis Bilangan"
      icon={<BookOpen className="w-5 h-5 text-[#ffd166]" />}
      badge={<Badge variant="gold" size="sm">PETUNJUK</Badge>}
      maxWidthClass="max-w-2xl"
      footer={
        <div className="flex justify-end">
          <Button
            variant="primary"
            size="md"
            onClick={onClose}
            icon={<Check className="w-4 h-4" />}
          >
            Mengerti, Ayo Bermain!
          </Button>
        </div>
      }
    >
      <div className="space-y-3.5 text-xs sm:text-sm text-slate-200">
        {/* Section 1: Mengenal Jamuran - 16px radius panel */}
        <section className="p-3.5 sm:p-4 bg-[#0f2824] rounded-[16px] border border-[#79b85b]/30">
          <h3 className="flex items-center gap-2 font-bold text-[#ffd166] text-sm sm:text-base mb-1.5 font-serif">
            <Sparkles className="w-4 h-4 text-[#ffd166]" />
            1. Mengenal Permainan Tradisional Jamuran
          </h3>
          <p className="leading-relaxed text-xs text-slate-300">
            <strong>Jamuran</strong> adalah dolanan tradisional anak-anak khas Jawa. Anak-anak berpegangan tangan melingkar mengelilingi satu anak di tengah yang disebut <strong>"Pancer"</strong>. Sambil berputar, semua anak melantunkan tembang dolanan:
          </p>
          <div className="mt-2 p-2.5 bg-[#183d38] rounded-[10px] border border-[#f4d7a1]/20 italic text-center text-[#fff1c7] font-serif text-xs">
            "Jamuran ya gē-gē thok, jamur apa ya gē-gē thok...<br />
            Jamur gajih mbregijih sa-ara-ara, semprat-semprit jamur apa?"
          </div>
          <p className="mt-2 leading-relaxed text-xs text-slate-300">
            Saat tembang selesai, Pancer berseru menyebut nama jamur (misal: <em>Jamur Kethek</em>, <em>Jamur Gagang</em>, dsb.), dan semua anak harus menahan pose gerakan tersebut!
          </p>
        </section>

        {/* Section 2: Garis Bilangan - 16px radius panel */}
        <section className="p-3.5 sm:p-4 bg-[#0f2824] rounded-[16px] border border-[#79b85b]/30">
          <h3 className="flex items-center gap-2 font-bold text-[#ffd166] text-sm sm:text-base mb-1.5 font-serif">
            <HelpCircle className="w-4 h-4 text-[#ffd166]" />
            2. Tantangan Garis Bilangan Matematika
          </h3>
          <p className="leading-relaxed text-xs text-slate-300 mb-2.5">
            Setelah rintangan Jamuran, giliran tantangan matematika bilangan bulat di garis bilangan rentang <strong>-5 sampai 5</strong>:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-[#183d38] rounded-[10px] border border-emerald-500/30">
              <div className="flex items-center gap-1.5 font-bold text-emerald-300 mb-1">
                <ArrowRight className="w-3.5 h-3.5" /> Penjumlahan (+)
              </div>
              <p className="text-slate-300 text-[11px]">Melangkah ke arah <strong>KANAN</strong> sebanyak nilai penambah.</p>
              <p className="mt-1 text-slate-400 text-[10px]">Contoh: <code>-3 + 5 = 2</code> (mulai di -3, maju kanan 5, sampai di 2).</p>
            </div>
            <div className="p-2.5 bg-[#183d38] rounded-[10px] border border-amber-500/30">
              <div className="flex items-center gap-1.5 font-bold text-amber-300 mb-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Pengurangan (-)
              </div>
              <p className="text-slate-300 text-[11px]">Melangkah ke arah <strong>KIRI</strong> sebanyak nilai pengurang.</p>
              <p className="mt-1 text-slate-400 text-[10px]">Contoh: <code>2 - 4 = -2</code> (mulai di 2, mundur kiri 4, sampai di -2).</p>
            </div>
          </div>
        </section>

        {/* Section 3: Tombol & Kontrol - 16px radius panel */}
        <section className="p-3.5 sm:p-4 bg-[#0f2824] rounded-[16px] border border-[#79b85b]/30">
          <h3 className="font-bold text-[#ffd166] text-sm sm:text-base mb-1.5 font-serif">
            3. Tombol & Cara Bermain
          </h3>
          <ul className="space-y-1.5 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <span className="font-bold text-[#b5d48c] shrink-0 min-w-24">Fase Melingkar:</span>
              <span>Gunakan tombol sentuh <strong>Putar Kiri</strong> / <strong>Putar Kanan</strong> di layar HP atau tombol panah keyboard.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-[#b5d48c] shrink-0 min-w-24">Fase Matematika:</span>
              <span>Gunakan tombol <strong>-1</strong> / <strong>+1</strong> atau sentuh langsung angka pada garis bilangan, lalu tekan <strong>JAWAB</strong>.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-[#b5d48c] shrink-0 min-w-24">Suara Gamelan:</span>
              <span>Nyalakan / bisukan suara gamelan tradisional sewaktu-waktu melalui tombol speaker di sudut kanan atas.</span>
            </li>
          </ul>
        </section>
      </div>
    </Modal>
  );
};
