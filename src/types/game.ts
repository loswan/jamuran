export type GameMode = 'INDIVIDUAL' | 'GROUP';

export type GameState =
  | 'MENU'
  | 'CHARACTER_SELECT'
  | 'MODE_SELECT'
  | 'LOBBY'
  | 'MUSIC_PLAYING'
  | 'MUSIC_STOPPED'
  | 'JAMUR_COMMAND'
  | 'JAMUR_ACTION'
  | 'TURN_NOMINATION'
  | 'MATH_CHALLENGE'
  | 'FEEDBACK_CORRECT'
  | 'FEEDBACK_WRONG'
  | 'ROUND_VICTORY';

export type CharacterType = 'boy' | 'girl';

export interface CharacterInfo {
  id: CharacterType;
  name: string;
  title: string;
  description: string;
  attire: string;
  color: string;
}

export interface PlayerProfile {
  id: string;
  name: string;
  character: CharacterType;
  colorVariant: number;
  groupId?: string;
  isHost?: boolean;
  isReady?: boolean;
  joinedAt: number;
}

export interface GroupProfile {
  id: string;
  name: string;
  character: CharacterType;
  colorVariant: number;
  score: number;
  isPancer: boolean;
  memberIds: string[];
}

export interface MathQuestion {
  id: number;
  prompt: string;
  operation: string;
  start: number;
  step: number; // positive or negative
  answer: number;
  explanation: string;
  conceptNote: string;
}

export type JamurCommandId = 'gagak' | 'kethek' | 'gagang' | 'payung' | 'meja_kursi';

export interface JamurCommand {
  id: JamurCommandId;
  name: string;
  javaneseName: string;
  description: string;
  actionInstruction: string;
  duration: number; // in seconds
}

export interface PlayerCircleState {
  angle: number;
  direction: number; // 1: clockwise, -1: counterclockwise
  angularSpeed: number;
  radius: number;
  isMoving: boolean;
  walkTimer: number;
  walkFrame: number;
  directionRow: number;
  flipHorizontal: boolean;
  x: number;
  y: number;
  previousX: number | null;
  previousY: number | null;
}

export interface NpcMember {
  id: string;
  name: string;
  angleOffset: number;
  character: CharacterType;
  directionRow: number;
  flipHorizontal: boolean;
  x: number;
  y: number;
  colorVariant: number;
}

export interface PancerState {
  character: CharacterType;
  name: string;
  groupId?: string;
  x: number;
  y: number;
  directionRow: number;
  frame: number;
  commandNumber: number;
}

export interface GameScore {
  current: number;
  highScore: number;
  streak: number;
  round: number;
  totalAnswered: number;
  correctCount: number;
}

// Multiplayer Room State broadcast by server
export interface RoomState {
  roomCode: string;
  hostId: string;
  mode: GameMode;
  phase: GameState;
  players: Record<string, PlayerProfile>;
  groups: Record<string, GroupProfile>;
  activeSelectorGroupId: string | null;
  activeTargetGroupId: string | null;
  pancerGroupId: string | null;
  currentQuestion: MathQuestion;
  questionIndex: number;
  numberLineMin: number;
  numberLineMax: number;
  numberLineCurrent: number;
  numberLineStart: number;
  activeCommand: JamurCommand;
  commandDialogElapsed: number;
  actionElapsed: number;
  feedbackElapsed: number;
  feedbackResult: 'correct' | 'wrong' | null;
  turnTimeRemaining: number;
  maxTurnTime: number;
  announcement: string | null;
  roundNumber: number;
  updatedAt: number;
}

// Client-to-Server Messages
export type ClientMessage =
  | { type: 'CREATE_ROOM'; payload: { mode: GameMode; player: Omit<PlayerProfile, 'isHost' | 'joinedAt'> } }
  | { type: 'JOIN_ROOM'; payload: { roomCode: string; player: Omit<PlayerProfile, 'isHost' | 'joinedAt'> } }
  | { type: 'UPDATE_PROFILE'; payload: { name: string; character: CharacterType; colorVariant: number } }
  | { type: 'JOIN_GROUP'; payload: { groupId: string; groupName?: string } }
  | { type: 'CREATE_GROUP'; payload: { name: string; character: CharacterType; colorVariant: number } }
  | { type: 'START_GAME' }
  | { type: 'SELECT_TARGET_GROUP'; payload: { targetGroupId: string } }
  | { type: 'MOVE_NUMBER_LINE'; payload: { position: number } }
  | { type: 'SUBMIT_ANSWER'; payload: { position: number } }
  | { type: 'PHASE_COMPLETE'; payload?: { currentPhase: GameState } }
  | { type: 'RESTART_ROUND' }
  | { type: 'LEAVE_ROOM' }
  | { type: 'PING' };

// Server-to-Client Messages
export type ServerMessage =
  | { type: 'ROOM_CREATED'; payload: { roomCode: string; playerId: string; roomState: RoomState } }
  | { type: 'ROOM_JOINED'; payload: { roomCode: string; playerId: string; roomState: RoomState } }
  | { type: 'ROOM_STATE_UPDATE'; payload: RoomState }
  | { type: 'ERROR'; payload: { message: string; code?: string } }
  | { type: 'PLAYER_DISCONNECTED'; payload: { playerId: string; playerName: string } }
  | { type: 'ANNOUNCEMENT'; payload: { message: string; level?: 'info' | 'success' | 'warning' } }
  | { type: 'PONG' };
