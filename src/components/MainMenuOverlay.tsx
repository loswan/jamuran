import React from 'react';
import { PlayerProfile, GameMode } from '../types/game';
import { Play, Users, User, HelpCircle, Volume2, VolumeX, Sparkles, Edit3, Maximize2, Minimize2 } from 'lucide-react';
import { Button, Panel, Badge } from './ui';
import { playUIClick } from '../audio/uiSound';

interface MainMenuOverlayProps {
  playerProfile: PlayerProfile;
  gameMode: GameMode;
  isMuted: boolean;
  isFullscreen?: boolean;
  onToggleMute: () => void;
  onToggleFullscreen?: () => void;
  onStartPlay: () => void;
  onOpenModeSelect: () => void;
  onOpenIdentityModal: () => void;
  onOpenHelp: () => void;
}

export const MainMenuOverlay: React.FC<MainMenuOverlayProps> = ({
  playerProfile,
  gameMode,
  isMuted,
  isFullscreen = false,
  onToggleMute,
  onToggleFullscreen,
  onStartPlay,
  onOpenModeSelect,
  onOpenIdentityModal,
  onOpenHelp
}) => {
  return (
    <div
      className="absolute inset-0 z-30 flex flex-col justify-between w-full h-full min-h-0 min-w-0 p-2.5 sm:p-4 px-safe bg-[#112925]/90 backdrop-blur-md animate-fadeIn select-none overflow-y-auto box-border"
      style={{ boxSizing: 'border-box' }}
    >
      {/* Top Header Bar */}
      <header className="flex items-center justify-between w-full max-w-4xl mx-auto px-2 py-1 shrink-0 box-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-[10px] bg-[#d95d39] border border-[#f4d7a1] flex items-center justify-center font-black text-[#fff1c7] text-sm shadow">
            J
          </div>
          <div>
            <span className="font-extrabold text-sm sm:text-base text-[#fff1c7] tracking-wider font-serif">
              JAMATH
            </span>
            <span className="ml-2 text-[10px] text-[#b5d48c] hidden sm:inline">
              Dolanan Jamuran & Garis Bilangan
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={() => {
              playUIClick();
              onToggleMute();
            }}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-[10px] bg-[#183d38] hover:bg-[#24564b] border border-[#f4d7a1]/30 flex items-center justify-center text-[#fff1c7] transition-all cursor-pointer active:scale-95"
            title={isMuted ? 'Nyalakan Musik' : 'Bisukan Suara'}
            aria-label="Toggle Sound"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-[#ffd166]" />
            )}
          </button>

          {/* Fullscreen Toggle */}
          {onToggleFullscreen && (
            <button
              onClick={() => {
                playUIClick();
                onToggleFullscreen();
              }}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-[10px] bg-[#183d38] hover:bg-[#24564b] border border-[#f4d7a1]/30 flex items-center justify-center text-[#fff1c7] transition-all cursor-pointer active:scale-95 touch-manipulation"
              title={isFullscreen ? 'Keluar dari Layar Penuh' : 'Mode Layar Penuh (Fullscreen)'}
              aria-label={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4 text-[#ffd166]" />
              ) : (
                <Maximize2 className="w-4 h-4 text-[#ffd166]" />
              )}
            </button>
          )}

          {/* Help Button */}
          <button
            onClick={() => {
              playUIClick();
              onOpenHelp();
            }}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-[10px] bg-[#183d38] hover:bg-[#24564b] border border-[#f4d7a1]/30 flex items-center justify-center text-[#fff1c7] transition-all cursor-pointer active:scale-95"
            title="Panduan Bermain"
            aria-label="Panduan"
          >
            <HelpCircle className="w-4 h-4 text-[#ffd166]" />
          </button>
        </div>
      </header>

      {/* Main Center Card - Strictly 16px radius Panel */}
      <main className="flex-1 min-h-0 flex items-center justify-center my-auto py-2 box-border">
        <Panel
          variant="card"
          padding="lg"
          className="w-full max-w-lg text-center backdrop-blur-md relative"
        >
          {/* Decorative Corner Ornaments */}
          <div className="absolute top-2 left-2 text-[#f4d7a1]/25 text-xs select-none">✦</div>
          <div className="absolute top-2 right-2 text-[#f4d7a1]/25 text-xs select-none">✦</div>
          <div className="absolute bottom-2 left-2 text-[#f4d7a1]/25 text-xs select-none">✦</div>
          <div className="absolute bottom-2 right-2 text-[#f4d7a1]/25 text-xs select-none">✦</div>

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 mb-2">
            <Badge variant="gold" size="sm" icon={<Sparkles className="w-3 h-3" />}>
              EDISI BUDAYA JAWA & MATEMATIKA
            </Badge>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#ffd166] tracking-wider font-serif leading-tight drop-shadow-sm">
            JAMATH
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm font-bold text-[#fff1c7] mt-1 tracking-wide">
            DOLANAN JAMURAN & MATEMATIKA
          </p>

          <p className="text-[11px] sm:text-xs text-[#b5d48c] mt-1 max-w-sm mx-auto leading-relaxed">
            Pembelajaran interaktif bilangan bulat di garis bilangan dengan keseruan tembang dolanan Jamuran tradisional.
          </p>

          {/* Main Action Buttons - Strictly 10px radius */}
          <div className="mt-4 sm:mt-5 flex flex-col gap-2.5 max-w-xs mx-auto">
            {/* Big Start Button */}
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={onStartPlay}
              icon={<Play className="w-5 h-5 fill-current" />}
            >
              MULAI BERMAIN
            </Button>

            {/* Secondary Controls Row */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={onOpenModeSelect}
                icon={gameMode === 'GROUP' ? <Users className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
              >
                {gameMode === 'GROUP' ? 'Mode Kelompok' : 'Mode Individu'}
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={onOpenHelp}
                icon={<HelpCircle className="w-3.5 h-3.5" />}
              >
                Panduan
              </Button>
            </div>
          </div>
        </Panel>
      </main>

      {/* Bottom Profile Bar */}
      <footer className="w-full max-w-4xl mx-auto px-2 py-1 shrink-0 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 bg-[#0f2824]/90 px-3 py-1.5 rounded-[10px] border border-[#79b85b]/30">
          <span className="text-slate-400 text-[11px]">Pemain:</span>
          <span className="font-bold text-[#ffd166] text-xs truncate max-w-[140px] sm:max-w-[200px]">
            {playerProfile.name}
          </span>
          <span className="text-[10px] text-[#b5d48c]">
            ({playerProfile.character === 'boy' ? 'Bagio' : 'Siti'})
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onOpenIdentityModal}
          icon={<Edit3 className="w-3.5 h-3.5 text-[#ffd166]" />}
        >
          Ganti Profil
        </Button>
      </footer>
    </div>
  );
};
