import React, { useState } from 'react';
import { RoomState } from '../types/game';
import { multiplayerService } from '../services/multiplayerService';
import { Button, Panel, Badge } from './ui';
import { Copy, Check, Users, Play, LogOut, Crown, ShieldAlert, Sparkles, UserCheck, Maximize2, Minimize2 } from 'lucide-react';

interface LobbyViewProps {
  roomState: RoomState;
  myPlayerId: string;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  roomState,
  myPlayerId,
  isFullscreen = false,
  onToggleFullscreen,
  onStartGame,
  onLeaveRoom
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const myPlayer = roomState.players[myPlayerId];
  const isHost = myPlayer?.isHost || roomState.hostId === myPlayerId;
  const groupsList = Object.values(roomState.groups);
  const playersList = Object.values(roomState.players);

  const filledGroups = groupsList.filter((g) => g.memberIds.length > 0);
  const canStart = isHost && filledGroups.length >= 2;

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomState.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoinGroup = (groupId: string) => {
    multiplayerService.joinGroup(groupId);
  };

  const handleStart = () => {
    if (!canStart) {
      setErrorMsg('Minimal butuh 2 kelompok yang memiliki anggota untuk memulai permainan!');
      return;
    }
    setErrorMsg('');
    onStartGame();
  };

  return (
    <div
      className="w-full h-full flex flex-col flex-1 min-h-0 min-w-0 bg-[#112925] text-slate-100 p-2.5 sm:p-4 px-safe overflow-y-auto select-none box-border"
      style={{ boxSizing: 'border-box' }}
    >
      {/* Top Bar with Room Code - Strictly 16px radius Panel */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between gap-3 p-2.5 sm:p-3.5 bg-[#183d38] border-2 border-[#f4d7a1] rounded-[16px] shadow-xl shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-[10px] bg-[#d95d39] border border-[#f4d7a1] flex items-center justify-center font-black text-[#fff1c7] text-sm sm:text-base shadow shrink-0">
            J
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-sm sm:text-base font-black text-[#ffd166] tracking-wide font-serif truncate">
                LOBI ROOM KELAS
              </h1>
              <Badge variant="emerald" size="sm">Online</Badge>
            </div>
            <p className="text-[10px] text-[#b5d48c] truncate">
              {playersList.length} Siswa Bergabung • {filledGroups.length} Kelompok Aktif
            </p>
          </div>
        </div>

        {/* Right Header Group: Room Code Badge & Fullscreen Toggle */}
        <div className="flex items-center gap-2">
          {/* Room Code Badge */}
          <div className="flex items-center gap-2 bg-[#0f2824] px-3 py-1.5 rounded-[10px] border border-[#79b85b]/40 shrink-0">
            <div>
              <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">KODE ROOM</div>
              <div className="text-base sm:text-lg font-mono font-black text-[#ffd166] tracking-widest leading-none">
                {roomState.roomCode}
              </div>
            </div>
            <button
              onClick={copyRoomCode}
              className="w-8 h-8 rounded-[10px] bg-[#24564b] hover:bg-[#1a443e] text-[#fff1c7] border border-[#f4d7a1]/40 flex items-center justify-center transition-transform active:scale-90 cursor-pointer"
              title="Salin Kode Room"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Fullscreen Button */}
          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-[10px] bg-[#0f2824] hover:bg-[#24564b] border border-[#f4d7a1]/40 flex items-center justify-center text-[#fff1c7] transition-all cursor-pointer active:scale-95 touch-manipulation shrink-0"
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
        </div>
      </header>

      {/* Host Announcement Banner */}
      {roomState.announcement && (
        <div className="w-full max-w-6xl mx-auto mt-2 p-2 bg-[#183d38]/90 border border-[#f4d7a1]/30 rounded-[12px] text-xs text-[#fff1c7] flex items-center gap-2 shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-[#ffd166] shrink-0" />
          <span className="text-[11px] truncate">{roomState.announcement}</span>
        </div>
      )}

      {errorMsg && (
        <div className="w-full max-w-6xl mx-auto mt-2 p-2 bg-rose-950/80 border border-rose-500/50 rounded-[12px] text-rose-200 text-xs flex items-center gap-2 shrink-0">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span className="text-[11px]">{errorMsg}</span>
        </div>
      )}

      {/* Main Content Layout */}
      <main className="w-full max-w-6xl mx-auto mt-3 flex-1 grid grid-cols-1 lg:grid-cols-4 gap-3">
        {/* Groups Column: 6 Groups Landscape Grid */}
        <div className="lg:col-span-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs sm:text-sm font-bold text-[#fff1c7] flex items-center gap-1.5 font-serif">
              <Users className="w-4 h-4 text-[#ffd166]" /> 6 Kelompok Dolanan ({filledGroups.length}/6 Terisi)
            </h2>
            <span className="text-[10px] text-slate-400">Sentuh kelompok untuk bergabung</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {groupsList.map((group) => {
              const isMyGroup = myPlayer?.groupId === group.id;
              const memberNames = group.memberIds
                .map((id) => roomState.players[id]?.name)
                .filter(Boolean);

              return (
                <div
                  key={group.id}
                  className={`p-2.5 sm:p-3 rounded-[16px] border-2 transition-all flex flex-col justify-between ${
                    isMyGroup
                      ? 'bg-[#24564b] border-[#ffd166] shadow'
                      : 'bg-[#183d38] border-[#79b85b]/30 hover:border-[#f4d7a1]/60'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h3 className="font-bold text-xs sm:text-sm text-[#fff1c7] truncate">{group.name}</h3>
                      {isMyGroup && (
                        <Badge variant="gold" size="sm">Tim Kamu</Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-[#b5d48c]">
                      Perwakilan: {group.character === 'boy' ? 'Bagio' : 'Siti'}
                    </p>

                    {/* Member Tags */}
                    <div className="mt-1.5 min-h-[30px]">
                      <div className="text-[9px] font-semibold text-slate-400 uppercase">
                        Siswa ({memberNames.length}):
                      </div>
                      {memberNames.length > 0 ? (
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {memberNames.map((name, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.2 rounded-[6px] bg-[#0f2824] text-[10px] text-slate-200 border border-white/10 truncate max-w-[85px]"
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] italic text-slate-400">Belum ada siswa</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 pt-1.5 border-t border-white/10">
                    {isMyGroup ? (
                      <div className="text-center py-1 text-[11px] font-bold text-[#ffd166] flex items-center justify-center gap-1">
                        <UserCheck className="w-3.5 h-3.5" /> Kamu Di Sini
                      </div>
                    ) : (
                      <button
                        onClick={() => handleJoinGroup(group.id)}
                        className="w-full min-h-[34px] py-1 px-2 bg-[#0f2824] hover:bg-[#24564b] active:scale-95 text-[#fff1c7] text-[11px] font-bold rounded-[10px] border border-[#f4d7a1]/30 transition-transform cursor-pointer"
                      >
                        Pilih Kelompok Ini
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Players Sidebar & Actions */}
        <div className="flex flex-col gap-2.5">
          {/* Players Roster Panel - Strictly 16px radius */}
          <Panel variant="card" padding="sm" className="flex-1 flex flex-col">
            <h2 className="text-xs font-bold text-[#fff1c7] flex items-center gap-1.5 mb-2 font-serif">
              <Crown className="w-3.5 h-3.5 text-[#ffd166]" /> Siswa ({playersList.length})
            </h2>

            <div className="space-y-1 overflow-y-auto max-h-48 lg:max-h-56 pr-1">
              {playersList.map((player) => {
                const groupName = player.groupId ? roomState.groups[player.groupId]?.name : 'Belum pilih';
                return (
                  <div
                    key={player.id}
                    className="p-1.5 bg-[#0f2824] rounded-[10px] border border-white/5 flex items-center justify-between text-[11px]"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-semibold text-slate-100 truncate max-w-[90px]">{player.name}</span>
                      {player.isHost && (
                        <Badge variant="gold" size="sm">Host</Badge>
                      )}
                    </div>
                    <span className="text-[10px] text-[#b5d48c] truncate max-w-[80px]">{groupName}</span>
                  </div>
                );
              })}
            </div>
          </Panel>

          {/* Action Box: Start Game / Leave - Strictly 16px radius */}
          <Panel variant="card" padding="sm" className="space-y-2">
            {isHost ? (
              <div>
                <Button
                  variant="primary"
                  fullWidth
                  size="md"
                  onClick={handleStart}
                  disabled={!canStart}
                  icon={<Play className="w-4 h-4 fill-current" />}
                >
                  MULAI GAME KELAS
                </Button>
                {!canStart && (
                  <p className="text-[10px] text-amber-300 text-center mt-1 font-medium">
                    *Butuh minimal 2 kelompok yang memiliki anggota.
                  </p>
                )}
              </div>
            ) : (
              <div className="p-2.5 bg-[#0f2824] rounded-[10px] border border-[#79b85b]/30 text-center text-xs text-[#b5d48c]">
                Menunggu Host ({roomState.players[roomState.hostId]?.name || 'Host'}) memulai game...
              </div>
            )}

            <Button
              variant="outline"
              fullWidth
              size="sm"
              onClick={onLeaveRoom}
              icon={<LogOut className="w-3.5 h-3.5" />}
            >
              Keluar Room
            </Button>
          </Panel>
        </div>
      </main>
    </div>
  );
};
