import React from 'react';
import {
  Trophy,
  Star,
  Flame,
  Award,
  TrendingUp,
  Sparkles,
  Crown,
  Users
} from 'lucide-react';
import { GroupProfile } from '../types/game';

interface ScoreboardBadgeProps {
  visible: boolean;
  isGroupMode: boolean;
  pointsGained: number;
  streak: number;
  totalScore: number;
  roundNumber: number;
  totalAnswered?: number;
  highScore?: number;
  isNewHighScore?: boolean;
  groupName?: string;
  allGroups?: Record<string, GroupProfile>;
  activeGroupId?: string | null;
  onClose?: () => void;
}

export const ScoreboardBadge: React.FC<ScoreboardBadgeProps> = ({
  visible,
  isGroupMode,
  pointsGained,
  streak,
  totalScore,
  roundNumber,
  totalAnswered = 1,
  highScore = 0,
  isNewHighScore = false,
  groupName,
  allGroups,
  activeGroupId,
  onClose
}) => {
  if (!visible) return null;

  // Calculate sorted group standings for multiplayer mode
  const sortedGroups = allGroups
    ? Object.values(allGroups)
        .filter((g) => g.memberIds.length > 0)
        .sort((a, b) => b.score - a.score)
    : [];

  const rankMedals = ['🥇', '🥈', '🥉'];

  return (
    <aside
      aria-label="Papan Skor Permainan"
      className="fixed top-12 right-2 sm:top-14 sm:right-4 z-55 pointer-events-auto select-none animate-corner-scoreboard max-w-[270px] sm:max-w-[310px] w-full"
    >
      <div
        className="relative bg-gradient-to-b from-[#1b433b]/95 via-[#14342f]/95 to-[#0c1e1b]/98 backdrop-blur-md rounded-[16px] border-2 border-[#ffd166] shadow-[0_12px_36px_rgba(0,0,0,0.65),0_0_24px_rgba(255,209,102,0.3)] p-2.5 sm:p-3 text-slate-100 overflow-hidden"
      >
        {/* Decorative corner batik motifs */}
        <div className="absolute top-0 right-0 w-8 h-8 pointer-events-none opacity-25 bg-[radial-gradient(circle_at_top_right,#ffd166,transparent)]" />
        <div className="absolute bottom-0 left-0 w-8 h-8 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_bottom_left,#79b85b,transparent)]" />

        {/* Top Header: Badge Pop Bounce & Title */}
        <div className="flex items-center gap-2 pb-1.5 border-b border-[#f4d7a1]/25">
          {/* Animated Bouncing Badge Seal */}
          <div className="relative flex-shrink-0 animate-badge-pop-bounce">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-[10px] bg-gradient-to-br from-[#d95d39] to-[#b3401f] border-2 border-[#ffd166] flex items-center justify-center shadow-lg text-[#fff1c7]">
              {streak > 2 ? (
                <Flame className="w-6 h-6 text-amber-300 fill-amber-400 drop-shadow animate-pulse" />
              ) : isGroupMode ? (
                <Users className="w-5 h-5 text-[#ffd166] drop-shadow" />
              ) : (
                <Trophy className="w-5 h-5 text-[#ffd166] drop-shadow" />
              )}
            </div>

            {/* Sparkle satellite */}
            <div className="absolute -top-1 -right-1 text-[#ffd166]">
              <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} />
            </div>
          </div>

          {/* Title and Round Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#ffd166] flex items-center gap-1">
                <Award className="w-3 h-3 text-[#ffd166]" /> Papan Skor
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-[6px] bg-[#24564b] border border-[#79b85b]/40 text-[#b5d48c] font-bold">
                Babak {roundNumber}
              </span>
            </div>

            <div className="flex items-baseline gap-1 mt-0.5">
              <h4 className="text-xs sm:text-sm font-extrabold text-[#fff1c7] truncate font-serif">
                {isGroupMode && groupName ? groupName : 'Tantangan Berhasil!'}
              </h4>
            </div>
          </div>

          {/* Optional close button if user wants to minimize */}
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-xs p-1 rounded-[10px] hover:bg-white/10 transition-colors"
              title="Tutup"
            >
              ✕
            </button>
          )}
        </div>

        {/* Score Gained Pop Banner */}
        <div className="mt-2 flex items-center justify-between bg-[#0e2723]/90 rounded-[12px] p-2 border border-[#79b85b]/35 shadow-inner">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-[8px] bg-[#79b85b]/20 border border-[#79b85b]/50 flex items-center justify-center text-[#79b85b]">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-[9px] text-[#b5d48c] uppercase font-bold tracking-wider">
                Poin Masuk
              </div>
              <div className="text-sm sm:text-base font-black text-[#79b85b] animate-number-glow leading-none mt-0.5">
                +{pointsGained}
              </div>
            </div>
          </div>

          {/* Total Score display */}
          <div className="text-right">
            <div className="text-[9px] text-slate-300 uppercase font-bold tracking-wider flex items-center justify-end gap-1">
              <Star className="w-2.5 h-2.5 text-[#ffd166] fill-[#ffd166]" /> Total Skor
            </div>
            <div className="text-sm sm:text-base font-black text-[#ffd166] leading-none mt-0.5">
              {totalScore}
            </div>
          </div>
        </div>

        {/* Streak or High Score Notification */}
        <div className="mt-2 flex items-center justify-between gap-1 text-[10px] sm:text-[11px]">
          {streak > 1 ? (
            <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 border border-amber-500/40 rounded-[10px] text-amber-300 font-bold w-full animate-badge-bounce">
              <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-bounce" />
              <span>Streak Combo {streak}x! (+{Math.max(0, streak - 1) * 20} bonus)</span>
            </div>
          ) : isNewHighScore ? (
            <div className="flex items-center gap-1 px-2 py-1 bg-[#ffd166]/20 border border-[#ffd166]/50 rounded-[10px] text-[#ffd166] font-bold w-full">
              <Crown className="w-3.5 h-3.5 text-[#ffd166]" />
              <span>Rekor Baru Tercapai!</span>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full px-2 py-1 bg-[#143a34] rounded-[10px] border border-[#f4d7a1]/20 text-[#b5d48c]">
              <span>Tantangan Terselesaikan:</span>
              <span className="font-bold text-[#fff1c7]">{totalAnswered} Soal</span>
            </div>
          )}
        </div>

        {/* Group Mode: Mini Leaderboard Ranking Preview */}
        {isGroupMode && sortedGroups.length > 0 && (
          <div className="mt-2 pt-2 border-t border-[#f4d7a1]/20">
            <div className="flex items-center justify-between text-[9px] uppercase font-bold text-[#ffd166] mb-1">
              <span>Klasemen Kelompok</span>
              <span>Skor</span>
            </div>
            <div className="space-y-1">
              {sortedGroups.slice(0, 3).map((grp, idx) => {
                const isCurrentActive = grp.id === activeGroupId;
                return (
                  <div
                    key={grp.id}
                    className={`flex items-center justify-between px-2 py-1 rounded-[10px] text-[10px] sm:text-[11px] transition-all ${
                      isCurrentActive
                        ? 'bg-[#79b85b]/25 border border-[#79b85b] font-bold text-[#fff1c7]'
                        : 'bg-[#0a1e1b] border border-[#f4d7a1]/10 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-xs">{rankMedals[idx] || `${idx + 1}.`}</span>
                      <span className="truncate">{grp.name}</span>
                      {isCurrentActive && (
                        <span className="text-[8px] px-1 py-0.2 bg-[#ffd166] text-[#112925] font-black rounded">
                          +POIN
                        </span>
                      )}
                    </div>
                    <span className="font-mono font-bold text-[#ffd166] ml-2">
                      {grp.score}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Singleplayer Mode: High Score Comparison */}
        {!isGroupMode && highScore > 0 && (
          <div className="mt-1.5 pt-1.5 border-t border-[#f4d7a1]/15 flex items-center justify-between text-[9px] sm:text-[10px] text-slate-400">
            <span>Skor Tertinggi:</span>
            <span className="font-bold text-[#ffd166]">{highScore} Poin</span>
          </div>
        )}
      </div>
    </aside>
  );
};
