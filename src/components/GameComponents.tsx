import React from 'react';
import {
  Volume2,
  VolumeX,
  HelpCircle,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Target,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Button, Panel, Modal, Badge } from './ui';
import { RoomState, MathQuestion } from '../types/game';

// Re-export standard UI library components for unified convenience
export { Button, Panel, Modal, Badge };
export { PrimaryButton, SecondaryButton } from './common/Buttons';
export { ModalContainer } from './common/ModalContainer';
export { StatusBadge, GamePanel } from './common/GamePanel';
export { ResponsiveLandscapeWrapper } from './layout/ResponsiveLandscapeWrapper';
export type { ResponsiveLandscapeWrapperProps } from './layout/ResponsiveLandscapeWrapper';

/* ========================================================================= */
/* 1. GAME CONTAINER (Enforces box-sizing: border-box & standard Flex shell)  */
/* ========================================================================= */
export interface GameContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const GameContainer: React.FC<GameContainerProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`w-full h-full flex flex-col flex-1 min-h-0 min-w-0 relative overflow-hidden select-none bg-[#112925] box-border ${className}`}
      style={{ boxSizing: 'border-box' }}
      {...props}
    >
      {children}
    </div>
  );
};

/* ========================================================================= */
/* 2. GAME HEADER HUD (Top Compact Bar for Landscape Gameplay)               */
/* ========================================================================= */
export interface GameHeaderProps {
  roomCode?: string;
  isGroupMode: boolean;
  roundNumber: number;
  score: number;
  isMuted: boolean;
  isFullscreen?: boolean;
  currentLyric?: string;
  isSingingPhase: boolean;
  onHomeClick: () => void;
  onScoreboardToggle: () => void;
  onToggleMute: () => void;
  onToggleFullscreen?: () => void;
  onOpenHelp: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  roomCode,
  isGroupMode,
  roundNumber,
  score,
  isMuted,
  isFullscreen = false,
  currentLyric,
  isSingingPhase,
  onHomeClick,
  onScoreboardToggle,
  onToggleMute,
  onToggleFullscreen,
  onOpenHelp
}) => {
  return (
    <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-safe py-1 sm:py-2 bg-[#183d38]/95 backdrop-blur-md border-b border-[#f4d7a1]/25 text-slate-100 box-border">
      {/* Brand & Mode Tag */}
      <div className="flex items-center gap-2">
        <button
          onClick={onHomeClick}
          className="flex items-center gap-1.5 group cursor-pointer"
          title="Kembali ke Menu Utama"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[10px] bg-[#d95d39] border border-[#f4d7a1] flex items-center justify-center font-black text-[#fff1c7] text-xs sm:text-sm shadow">
            J
          </div>
          <span className="font-extrabold text-sm sm:text-base text-[#fff1c7] tracking-wider font-serif">
            JAMATH
          </span>
        </button>

        <Badge variant="gold" size="sm">
          {isGroupMode ? `Room ${roomCode || ''}` : 'Individu'}
        </Badge>
      </div>

      {/* Center: Live Lyrics ticker in circle singing phase */}
      {isSingingPhase && currentLyric && (
        <div className="flex items-center gap-1.5 px-3 py-1 bg-[#0f2824]/90 rounded-[10px] border border-[#79b85b]/40 text-[#ffd166] text-[11px] sm:text-xs font-semibold animate-pulse box-border">
          <span>♫</span>
          <span className="truncate max-w-[200px] sm:max-w-[320px]">{currentLyric}</span>
        </div>
      )}

      {/* Right Controls & Scores */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={onScoreboardToggle}
          className="flex items-center gap-1.5 text-xs cursor-pointer hover:opacity-90 active:scale-95 transition-all box-border"
          title="Lihat Papan Skor"
        >
          <div className="px-2 py-1 bg-[#0f2824] rounded-[10px] border border-[#f4d7a1]/30 box-border">
            <span className="text-slate-400 mr-1 text-[10px]">Babak:</span>
            <span className="font-bold text-[#ffd166]">{roundNumber}</span>
          </div>

          <div className="px-2 py-1 bg-[#0f2824] hover:bg-[#1b433b] rounded-[10px] border border-[#f4d7a1]/40 flex items-center gap-1 box-border">
            <span className="text-slate-400 mr-0.5 text-[10px]">Skor:</span>
            <span className="font-bold text-[#b5d48c]">{score}</span>
            <span className="text-[9px] text-[#ffd166] ml-0.5">▼</span>
          </div>
        </button>

        {/* Sound Toggle */}
        <button
          onClick={onToggleMute}
          className="w-8 h-8 rounded-[10px] bg-[#0f2824] hover:bg-[#24564b] border border-[#f4d7a1]/30 flex items-center justify-center text-[#fff1c7] transition-all cursor-pointer active:scale-95"
          title={isMuted ? 'Nyalakan Suara Gamelan' : 'Bisukan Suara'}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-[#ffd166]" />}
        </button>

        {/* Fullscreen Toggle */}
        {onToggleFullscreen && (
          <button
            onClick={onToggleFullscreen}
            className="w-8 h-8 rounded-[10px] bg-[#0f2824] hover:bg-[#24564b] border border-[#f4d7a1]/30 flex items-center justify-center text-[#fff1c7] transition-all cursor-pointer active:scale-95 touch-manipulation"
            title={isFullscreen ? 'Keluar dari Layar Penuh' : 'Mode Layar Penuh (Fullscreen)'}
            aria-label={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5 text-[#ffd166]" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5 text-[#ffd166]" />
            )}
          </button>
        )}

        {/* Help Button */}
        <button
          onClick={onOpenHelp}
          className="w-8 h-8 rounded-[10px] bg-[#0f2824] hover:bg-[#24564b] border border-[#f4d7a1]/30 flex items-center justify-center text-[#fff1c7] transition-all cursor-pointer active:scale-95"
          title="Panduan Bermain"
        >
          <HelpCircle className="w-3.5 h-3.5 text-[#ffd166]" />
        </button>
      </div>
    </header>
  );
};

/* ========================================================================= */
/* 3. ROTATION PADDLES (Dedicated Thumb-Zone Controls for Circle Phase)       */
/* ========================================================================= */
export interface RotationPaddlesProps {
  onRotateLeftStart: () => void;
  onRotateLeftEnd: () => void;
  onRotateRightStart: () => void;
  onRotateRightEnd: () => void;
}

export const RotationPaddles: React.FC<RotationPaddlesProps> = ({
  onRotateLeftStart,
  onRotateLeftEnd,
  onRotateRightStart,
  onRotateRightEnd
}) => {
  return (
    <>
      {/* Left Thumb: Putar Kiri */}
      <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-20 pointer-events-auto box-border">
        <button
          onPointerDown={onRotateLeftStart}
          onPointerUp={onRotateLeftEnd}
          onPointerLeave={onRotateLeftEnd}
          className="min-h-[44px] flex items-center gap-1.5 px-4 py-2.5 bg-[#183d38]/95 active:bg-[#79b85b] rounded-[10px] text-xs sm:text-sm font-bold text-[#fff1c7] border-2 border-[#b5d48c] shadow-2xl backdrop-blur-md transition-transform active:scale-90 cursor-pointer select-none"
        >
          <ChevronLeft className="w-5 h-5 text-[#ffd166]" /> Putar Kiri
        </button>
      </div>

      {/* Right Thumb: Putar Kanan */}
      <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-20 pointer-events-auto box-border">
        <button
          onPointerDown={onRotateRightStart}
          onPointerUp={onRotateRightEnd}
          onPointerLeave={onRotateRightEnd}
          className="min-h-[44px] flex items-center gap-1.5 px-4 py-2.5 bg-[#183d38]/95 active:bg-[#79b85b] rounded-[10px] text-xs sm:text-sm font-bold text-[#fff1c7] border-2 border-[#b5d48c] shadow-2xl backdrop-blur-md transition-transform active:scale-90 cursor-pointer select-none"
        >
          Putar Kanan <ChevronRight className="w-5 h-5 text-[#ffd166]" />
        </button>
      </div>
    </>
  );
};

/* ========================================================================= */
/* 4. MATH QUESTION PANEL (Landscape Left Column: Question & Guidance Card)  */
/* ========================================================================= */
export interface MathQuestionPanelProps {
  question: MathQuestion | null;
  isGroupMode?: boolean;
  targetGroupName?: string;
}

export const MathQuestionPanel: React.FC<MathQuestionPanelProps> = ({
  question,
  isGroupMode = false,
  targetGroupName
}) => {
  if (!question) return null;

  return (
    <div className="w-full h-full flex flex-col justify-between p-2.5 sm:p-3.5 bg-[#183d38]/95 backdrop-blur-md rounded-[16px] border-[1.5px] border-[#f4d7a1]/60 shadow-xl overflow-y-auto box-border text-[#fff1c7]">
      {/* Header section with title and optional target group badge */}
      <div className="flex flex-col pt-1 sm:pt-1.5">
        <div className="flex items-center justify-between gap-1.5 flex-wrap">
          <span className="text-[11px] sm:text-xs font-black tracking-wider text-[#ffd166] uppercase font-serif">
            TANTANGAN MATEMATIKA
          </span>
          {isGroupMode && targetGroupName && (
            <span className="px-2 py-0.5 rounded-[6px] bg-[#24564b] border border-[#f4d7a1]/40 text-[10px] text-[#ffd166] font-bold">
              {targetGroupName}
            </span>
          )}
        </div>
        <p className="mt-2 sm:mt-2.5 pt-0.5 sm:pt-1 text-xs sm:text-[13px] text-[#fff1c7] font-semibold leading-snug">
          {question.prompt}
        </p>
      </div>

      {/* Dominant formula display */}
      <div className="my-auto py-2 flex flex-col items-center justify-center">
        <div className="text-2xl xs:text-3xl sm:text-4xl font-extrabold text-white tracking-widest font-mono drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] bg-[#0d221e]/75 px-4 py-2 rounded-[12px] border border-[#f4d7a1]/40 text-center w-full">
          {question.operation} = ?
        </div>
      </div>

      {/* Concept note / guidance */}
      <div className="bg-[#0f2824]/85 p-2 sm:p-2.5 rounded-[10px] border border-[#b5d48c]/30 text-[10px] sm:text-[11px] text-[#b5d48c] leading-relaxed">
        {question.conceptNote}
      </div>
    </div>
  );
};

/* ========================================================================= */
/* 5. MATH CONTROL DOCK (Landscape Bottom Dock with Non-Colliding Controls)  */
/* ========================================================================= */
export interface MathControlDockProps {
  currentValue: number;
  isMyTurn: boolean;
  minVal?: number;
  maxVal?: number;
  onStepLeft: () => void;
  onStepRight: () => void;
  onDirectSelect: (val: number) => void;
  onSubmit: () => void;
}

export const MathControlDock: React.FC<MathControlDockProps> = ({
  currentValue,
  isMyTurn,
  minVal = -5,
  maxVal = 5,
  onStepLeft,
  onStepRight,
  onDirectSelect,
  onSubmit
}) => {
  const numbers = [];
  for (let i = minVal; i <= maxVal; i++) {
    numbers.push(i);
  }

  return (
    <div className="w-full flex justify-center items-center py-1 sm:py-1.5 px-2 px-safe bg-[#0f2824]/95 border-t border-[#f4d7a1]/25 box-border flex-shrink-0 z-20">
      <div className="w-full max-w-4xl flex items-center justify-between sm:justify-center gap-1 sm:gap-2 px-2 py-1 bg-[#183d38]/95 backdrop-blur-md rounded-[12px] sm:rounded-[16px] border border-[#f4d7a1]/70 shadow-lg box-border overflow-x-auto">
        {/* Step -1 Button */}
        <button
          onClick={onStepLeft}
          disabled={!isMyTurn}
          className="h-8 sm:h-9 px-2 sm:px-3 flex items-center gap-1 bg-[#24564b] hover:bg-[#1b433b] active:scale-95 disabled:opacity-40 rounded-[10px] font-bold text-xs sm:text-sm text-[#fff1c7] border border-[#b5d48c]/40 shrink-0 shadow transition-transform cursor-pointer"
          title="Geser -1 ke kiri"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">-1</span>
        </button>

        {/* Direct Number Buttons (-5 to +5) */}
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0 py-0.5">
          {numbers.map((val) => (
            <button
              key={val}
              onClick={() => onDirectSelect(val)}
              disabled={!isMyTurn}
              className={`w-6 h-7 sm:w-7 sm:h-8 md:w-8 md:h-8 rounded-[8px] sm:rounded-[10px] text-[11px] sm:text-xs font-bold transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                currentValue === val
                  ? 'bg-[#ffd166] text-[#2b1506] ring-2 ring-white scale-105 shadow font-extrabold'
                  : 'bg-[#0d221e] text-slate-200 hover:bg-[#24564b] disabled:opacity-40'
              }`}
            >
              {val}
            </button>
          ))}
        </div>

        {/* Step +1 Button */}
        <button
          onClick={onStepRight}
          disabled={!isMyTurn}
          className="h-8 sm:h-9 px-2 sm:px-3 flex items-center gap-1 bg-[#24564b] hover:bg-[#1b433b] active:scale-95 disabled:opacity-40 rounded-[10px] font-bold text-xs sm:text-sm text-[#fff1c7] border border-[#b5d48c]/40 shrink-0 shadow transition-transform cursor-pointer"
          title="Geser +1 ke kanan"
        >
          <span className="hidden xs:inline">+1</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        {/* Submit Button */}
        <button
          onClick={onSubmit}
          disabled={!isMyTurn}
          className="h-8 sm:h-9 px-3 sm:px-5 bg-[#d95d39] hover:bg-[#c04a28] active:scale-95 disabled:opacity-40 text-[#fff1c7] font-black rounded-[10px] border border-[#f4d7a1] shadow text-xs sm:text-sm shrink-0 transition-transform cursor-pointer flex items-center justify-center"
        >
          {isMyTurn ? 'JAWAB' : 'MENUNGGU'}
        </button>
      </div>
    </div>
  );
};

/* ========================================================================= */
/* 6. RETRY BANNER (Singleplayer Prompt for Incorrect Answers)               */
/* ========================================================================= */
export interface RetryBannerProps {
  message?: string;
  onRetry: () => void;
}

export const RetryBanner: React.FC<RetryBannerProps> = ({
  message = 'Belum tepat! Perhatikan pergeseran di garis bilangan.',
  onRetry
}) => {
  return (
    <div className="w-full flex justify-center items-center py-1 sm:py-1.5 px-safe bg-[#0f2824]/95 border-t border-[#f4d7a1]/25 box-border flex-shrink-0 z-20">
      <div className="flex items-center gap-3 px-3 py-1.5 bg-[#183d38]/95 backdrop-blur-md rounded-[12px] sm:rounded-[16px] border border-amber-400 shadow-lg box-border">
        <span className="text-xs text-[#ffd166] font-semibold">{message}</span>
        <button
          onClick={onRetry}
          className="h-8 px-4 bg-[#d95d39] hover:bg-[#c04a28] active:scale-95 text-[#fff1c7] font-bold rounded-[10px] border border-[#f4d7a1] shadow text-xs flex items-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Coba Lagi
        </button>
      </div>
    </div>
  );
};

/* ========================================================================= */
/* 6. TURN NOMINATION MODAL (6-Group Grid for Multiplayer Class Play)         */
/* ========================================================================= */
export interface TurnNominationModalProps {
  serverRoomState: RoomState;
  isMyGroupTurn: boolean;
  onNominateGroup: (groupId: string) => void;
}

export const TurnNominationModal: React.FC<TurnNominationModalProps> = ({
  serverRoomState,
  isMyGroupTurn,
  onNominateGroup
}) => {
  return (
    <Modal
      isOpen={true}
      title="PENUNJUKAN KELOMPOK PENJAWAB"
      subtitle="Kelompok penunjuk berhak memilih kelompok lawan yang harus menjawab soal!"
      icon={<Target className="w-5 h-5 text-[#ffd166]" />}
      badge={<Badge variant="terracotta" size="sm">GILIRAN</Badge>}
      maxWidthClass="max-w-2xl"
    >
      <div className="box-border">
        {isMyGroupTurn ? (
          <div>
            <p className="text-xs sm:text-sm font-bold text-[#fff1c7] text-center mb-2.5">
              Giliran Kelompokmu! Ketuk salah satu kelompok lawan untuk menunjuk mereka:
            </p>
            {/* 3 Columns Grid in Landscape */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.values(serverRoomState.groups)
                .filter((g) => g.id !== serverRoomState.activeSelectorGroupId && g.memberIds.length > 0)
                .map((group) => {
                  const isPancer = group.isPancer;
                  return (
                    <button
                      key={group.id}
                      onClick={() => onNominateGroup(group.id)}
                      className={`p-2.5 sm:p-3 rounded-[16px] border-2 text-left transition-all active:scale-95 cursor-pointer box-border ${
                        isPancer
                          ? 'bg-[#14312c] border-amber-500/40 opacity-75'
                          : 'bg-[#0f2824] hover:bg-[#24564b] border-[#79b85b]/40 hover:border-[#ffd166] shadow'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs sm:text-sm text-[#fff1c7] truncate">{group.name}</span>
                        {isPancer && <Badge variant="gold" size="sm">Pancer</Badge>}
                      </div>
                      <p className="text-[10px] text-[#b5d48c] mt-0.5">
                        {group.memberIds.length} Siswa • Skor: {group.score}
                      </p>
                    </button>
                  );
                })}
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="text-sm sm:text-base font-bold text-[#ffd166] font-serif">
              {serverRoomState.groups[serverRoomState.activeSelectorGroupId || '']?.name || 'Kelompok Penunjuk'} sedang berdiskusi...
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Mereka sedang memilih kelompok mana yang akan menerima tantangan soal berikutnya.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};
