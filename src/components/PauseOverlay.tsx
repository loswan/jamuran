import React, { useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, HelpCircle, Home, X, Sparkles } from 'lucide-react';
import { GameMode, GameState } from '../types/game';
import { Button, Badge } from './ui';
import { playUIClick } from '../audio/uiSound';

export interface PauseOverlayProps {
  isOpen: boolean;
  gameMode: GameMode;
  roundNumber: number;
  score: number;
  isMuted: boolean;
  gameState: GameState;
  onResume: () => void;
  onToggleMute: () => void;
  onOpenHelp: () => void;
  onReturnToMenu: () => void;
}

export const PauseOverlay: React.FC<PauseOverlayProps> = ({
  isOpen,
  gameMode,
  roundNumber,
  score,
  isMuted,
  gameState,
  onResume,
  onToggleMute,
  onOpenHelp,
  onReturnToMenu
}) => {
  // Listen for Escape or P key to quickly resume
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        playUIClick();
        onResume();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onResume]);

  if (!isOpen) return null;

  const getPhaseDescription = (state: GameState): string => {
    switch (state) {
      case 'MUSIC_PLAYING':
        return 'Lagu Jamuran & Melingkar';
      case 'JAMUR_COMMAND':
        return 'Instruksi Pancer Jamuran';
      case 'JAMUR_ACTION':
        return 'Aksi Gerakan Jamuran';
      case 'MATH_CHALLENGE':
        return 'Tantangan Garis Bilangan';
      case 'FEEDBACK_CORRECT':
      case 'FEEDBACK_WRONG':
        return 'Hasil Jawaban';
      case 'TURN_NOMINATION':
        return 'Pemilihan Giliran Kelompok';
      default:
        return 'Permainan Aktif';
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Permainan Dijeda"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none box-border"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          playUIClick();
          onResume();
        }
      }}
    >
      <div
        className="relative w-full max-w-sm sm:max-w-md bg-[#183d38] border-2 border-[#f4d7a1] rounded-[16px] shadow-2xl text-slate-100 overflow-hidden box-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#f4d7a1]/25 bg-[#14332e] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-[10px] bg-[#d95d39] border border-[#f4d7a1]/40 flex items-center justify-center text-[#fff1c7] shrink-0 shadow-sm">
              <Pause className="w-4 h-4 text-[#ffd166]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-[#ffd166] tracking-wide font-serif">
                  PERMAINAN DIJEDA
                </h2>
                <Badge variant="gold" size="sm">PAUSE</Badge>
              </div>
              <p className="text-[10px] text-[#b5d48c]">
                Status permainan tersimpan aman
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playUIClick();
              onResume();
            }}
            className="w-8 h-8 rounded-[10px] bg-[#0f2824] hover:bg-[#24564b] border border-[#f4d7a1]/30 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95"
            title="Lanjutkan (Esc / P)"
            aria-label="Lanjutkan Permainan"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 flex flex-col gap-3 box-border">
          {/* Game Stats Snapshot */}
          <div className="grid grid-cols-3 gap-2 p-2.5 bg-[#0f2824] rounded-[12px] border border-[#f4d7a1]/25 text-center">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400">Mode</span>
              <span className="text-xs font-bold text-[#ffd166] truncate mt-0.5">
                {gameMode === 'GROUP' ? 'Kelompok' : 'Individu'}
              </span>
            </div>
            <div className="flex flex-col border-x border-white/10">
              <span className="text-[10px] text-slate-400">Babak</span>
              <span className="text-xs font-black text-[#b5d48c] mt-0.5">
                Ke-{roundNumber}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400">Skor</span>
              <span className="text-xs font-black text-white mt-0.5">
                {score}
              </span>
            </div>
          </div>

          {/* Current Phase Badge */}
          <div className="px-3 py-2 bg-[#122e28] rounded-[10px] border border-[#79b85b]/30 flex items-center justify-between text-xs text-slate-300">
            <span className="text-[11px] text-slate-400">Fase Saat Ini:</span>
            <span className="font-semibold text-[#ffd166] text-[11px] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#b5d48c]" />
              {getPhaseDescription(gameState)}
            </span>
          </div>

          {/* Action Buttons List */}
          <div className="flex flex-col gap-2 pt-1">
            {/* Primary Action: Resume */}
            <Button
              variant="primary"
              size="md"
              fullWidth
              icon={<Play className="w-4 h-4 fill-current text-[#fff1c7]" />}
              onClick={() => {
                playUIClick();
                onResume();
              }}
            >
              Lanjutkan Permainan
            </Button>

            {/* Sound Toggle Button */}
            <Button
              variant="secondary"
              size="sm"
              fullWidth
              icon={isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-[#ffd166]" />}
              onClick={() => {
                playUIClick();
                onToggleMute();
              }}
            >
              {isMuted ? 'Suara Gamelan: Mati (Klik untuk Nyala)' : 'Suara Gamelan: Nyala (Klik untuk Bisu)'}
            </Button>

            {/* Help Button */}
            <Button
              variant="outline"
              size="sm"
              fullWidth
              icon={<HelpCircle className="w-4 h-4 text-[#ffd166]" />}
              onClick={() => {
                playUIClick();
                onOpenHelp();
              }}
            >
              Panduan & Cara Bermain
            </Button>

            {/* Return to Menu Button */}
            <button
              onClick={() => {
                playUIClick();
                onReturnToMenu();
              }}
              className="mt-1 py-2 px-3 rounded-[10px] text-xs font-semibold text-rose-300 hover:text-rose-100 hover:bg-rose-950/60 border border-rose-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Keluar ke Menu Utama</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
