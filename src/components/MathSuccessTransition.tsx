import React from 'react';
import { Award, CheckCircle2, Flame, Sparkles, Trophy } from 'lucide-react';
import { MathQuestion } from '../types/game';

interface MathSuccessTransitionProps {
  question: MathQuestion;
  isGroupMode: boolean;
  scoreEarned: number;
  streak?: number;
  groupName?: string;
  durationSeconds?: number;
}

export const MathSuccessTransition: React.FC<MathSuccessTransitionProps> = ({
  question,
  isGroupMode,
  scoreEarned,
  streak = 1,
  groupName,
  durationSeconds = 3
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 pointer-events-none overflow-hidden animate-transition-curtain">
      {/* Background radial atmosphere */}
      <div className="absolute inset-0 bg-radial from-[#183d38]/85 via-[#0f2824]/92 to-[#091715]/96 backdrop-blur-sm" />

      {/* Decorative Golden Rays / Starburst Shimmer */}
      <div className="absolute inset-0 opacity-20 pointer-events-none flex items-center justify-center">
        <div className="w-[120vw] h-[120vw] max-w-[900px] max-h-[900px] rounded-full bg-[radial-gradient(circle,#ffd166_0%,transparent_65%)] animate-pulse-gold" />
      </div>

      {/* Main Slide-in Celebration Card - Strictly 16px radius Panel */}
      <div
        className="relative z-10 w-full max-w-lg bg-gradient-to-b from-[#1f4a43] to-[#14332e] border-2 border-[#ffd166] rounded-[16px] p-3.5 sm:p-5 shadow-[0_0_50px_rgba(255,209,102,0.35)] text-slate-100 animate-transition-slide flex flex-col items-center pointer-events-auto"
        style={{
          boxShadow: '0 12px 48px -8px rgba(0, 0, 0, 0.75), 0 0 24px rgba(255, 209, 102, 0.3)'
        }}
      >
        {/* Top Floating Victory Seal */}
        <div className="relative -mt-8 sm:-mt-10 mb-2 flex items-center justify-center">
          <div className="relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#d95d39] border-2 border-[#ffd166] shadow-xl text-[#fff1c7] animate-badge-bounce">
            <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8 text-[#fff1c7] drop-shadow-md" />
            <div className="absolute -top-1 -right-1 text-amber-300">
              <Sparkles className="w-4 h-4 animate-spin text-[#ffd166]" style={{ animationDuration: '4s' }} />
            </div>
          </div>
        </div>

        {/* Title & Badge */}
        <div className="text-center w-full">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-[6px] bg-[#ffd166]/15 border border-[#ffd166]/40 text-[#ffd166] text-[10px] sm:text-xs font-bold tracking-wide uppercase mb-1">
            <Award className="w-3.5 h-3.5" />
            Tantangan Selesai
          </div>

          <h2 className="text-lg sm:text-2xl font-black text-[#fff1c7] tracking-wide font-serif drop-shadow-sm">
            JAWABAN TEPAT!
          </h2>
          <p className="text-[11px] sm:text-xs text-[#b5d48c] mt-0.5">
            Langkah di garis bilangan berhenti pada angka target yang benar.
          </p>
        </div>

        {/* Math Equation Highlight Card - 12px radius */}
        <div className="w-full my-2.5 sm:my-3 py-2 px-3 sm:py-2.5 sm:px-4 bg-[#0d221f]/90 border border-[#79b85b]/40 rounded-[12px] text-center shadow-inner">
          <div className="flex items-center justify-center gap-2">
            <span className="text-xl sm:text-3xl font-extrabold text-[#ffd166] font-mono tracking-wider">
              {question.operation} = {question.answer}
            </span>
            <span className="px-2 py-0.5 rounded-[6px] bg-[#79b85b] text-[#112925] text-[10px] sm:text-xs font-black tracking-wider uppercase shadow">
              BENAR
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-[#e2f3d8] mt-1 line-clamp-2 italic">
            {question.explanation}
          </p>
        </div>

        {/* Score & Streak / Team Reward Bar - 10px radius items */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 w-full text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-[#143a34] rounded-[10px] border border-[#f4d7a1]/30 text-[#fff1c7]">
            <Trophy className="w-3.5 h-3.5 text-[#ffd166]" />
            <span className="text-slate-300 text-[10px] sm:text-xs">Skor:</span>
            <span className="font-extrabold text-[#79b85b]">+{scoreEarned} Poin</span>
          </div>

          {isGroupMode && groupName ? (
            <div className="flex items-center gap-1 px-3 py-1 bg-[#143a34] rounded-[10px] border border-[#79b85b]/40 text-[#ffd166] text-[10px] sm:text-xs font-bold">
              <span>Kelompok: {groupName}</span>
            </div>
          ) : (
            streak > 1 && (
              <div className="flex items-center gap-1 px-3 py-1 bg-[#d95d39]/30 rounded-[10px] border border-[#d95d39]/50 text-amber-300 text-[10px] sm:text-xs font-bold">
                <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>Streak {streak}x!</span>
              </div>
            )
          )}
        </div>

        {/* Dynamic Transition Countdown / Progress Bar */}
        <div className="w-full mt-3 pt-2.5 border-t border-[#f4d7a1]/20">
          <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-[#f4d7a1]/90 mb-1">
            <span className="flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#ffd166] animate-ping" />
              Beralih ke lingkaran lagu Jamuran...
            </span>
            <span className="font-semibold text-slate-300">Babak Berikutnya</span>
          </div>

          {/* Progress track */}
          <div className="relative w-full h-1.5 sm:h-2 bg-[#091715] rounded-full overflow-hidden border border-[#ffd166]/30">
            <div
              className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-[#79b85b] via-[#ffd166] to-[#79b85b] rounded-full"
              style={{
                width: '100%',
                animation: `fillProgressBar ${durationSeconds}s linear forwards`
              }}
            >
              {/* Shimmer light effect inside progress bar */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent w-full h-full animate-shimmer" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
