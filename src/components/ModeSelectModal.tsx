import React from 'react';
import { GameMode } from '../types/game';
import { Modal, Badge } from './ui';
import { User, Users, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';

interface ModeSelectModalProps {
  onSelectMode: (mode: GameMode) => void;
  onClose: () => void;
}

export const ModeSelectModal: React.FC<ModeSelectModalProps> = ({ onSelectMode, onClose }) => {
  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="PILIH MODE PERMAINAN"
      subtitle="Latihan mandiri atau bertanding kelompok bersama teman kelas"
      icon={<Users className="w-5 h-5 text-[#ffd166]" />}
      badge={<Badge variant="gold" size="sm">MODE</Badge>}
      maxWidthClass="max-w-2xl"
    >
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Mode 1: Individu */}
          <button
            onClick={() => onSelectMode('INDIVIDUAL')}
            className="group flex flex-col justify-between p-3.5 sm:p-4 bg-[#0f2824] hover:bg-[#1a443e] border-2 border-[#79b85b]/40 hover:border-[#ffd166] rounded-[16px] text-left transition-all active:scale-95 shadow cursor-pointer"
          >
            <div>
              <div className="w-10 h-10 rounded-[10px] bg-[#24564b] border border-[#f4d7a1]/30 flex items-center justify-center text-[#ffd166] mb-2.5 group-hover:bg-[#d95d39] transition-colors shadow-sm">
                <User className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-1.5 mb-1">
                <h3 className="text-sm sm:text-base font-extrabold text-[#fff1c7] group-hover:text-[#ffd166] transition-colors font-serif">
                  Mode Individu
                </h3>
              </div>
              <div className="mb-2">
                <Badge variant="sage" size="sm">Latihan Mandiri (1 Perangkat)</Badge>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Bermain langsung tanpa butuh koneksi room. Melingkar bersama kawan NPC Jamuran dan taklukkan tantangan garis bilangan sendiri.
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center gap-1 text-xs text-[#ffd166] font-bold group-hover:translate-x-1 transition-transform">
              <span>Mulai Latihan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>

          {/* Mode 2: Kelompok */}
          <button
            onClick={() => onSelectMode('GROUP')}
            className="group flex flex-col justify-between p-3.5 sm:p-4 bg-[#0f2824] hover:bg-[#1a443e] border-2 border-[#d95d39]/60 hover:border-[#ffd166] rounded-[16px] text-left transition-all active:scale-95 shadow relative cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-[10px] bg-[#24564b] border border-[#f4d7a1]/30 flex items-center justify-center text-[#ffd166] group-hover:bg-[#d95d39] transition-colors shadow-sm">
                  <Users className="w-5 h-5" />
                </div>
                <Badge variant="terracotta" size="sm" icon={<Sparkles className="w-2.5 h-2.5" />}>
                  Rekomendasi Kelas
                </Badge>
              </div>

              <div className="flex items-center gap-1.5 mb-1">
                <h3 className="text-sm sm:text-base font-extrabold text-[#fff1c7] group-hover:text-[#ffd166] transition-colors font-serif">
                  Mode Kelompok
                </h3>
              </div>
              <div className="mb-2">
                <Badge variant="gold" size="sm">Multiplayer Online Kelas</Badge>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Kolaborasi kelas lintas HP & laptop. Tunjuk kelompok lawan untuk menjawab tantangan, kelompok yang salah bergiliran menjadi Pancer!
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center gap-1 text-xs text-[#ffd166] font-bold group-hover:translate-x-1 transition-transform">
              <span>Masuk Room Kelas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>

        {/* Feature Note */}
        <div className="p-2.5 bg-[#0f2824]/90 rounded-[12px] border border-[#79b85b]/30 flex items-center gap-2 text-[11px] text-slate-300">
          <ShieldCheck className="w-4 h-4 text-[#b5d48c] shrink-0" />
          <span>
            Sinkron real-time melalui WebSocket. Aman dimainkan bersama di kelas menggunakan HP, tablet, maupun laptop.
          </span>
        </div>
      </div>
    </Modal>
  );
};
