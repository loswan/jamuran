export type GameState =
  | 'MENU'
  | 'CHARACTER_SELECT'
  | 'JAMURAN'
  | 'MUSIC_PLAYING'
  | 'MUSIC_STOPPED'
  | 'JAMUR_COMMAND'
  | 'JAMUR_ACTION'
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

export type JamurCommandId = 'kethek' | 'gagang' | 'payung' | 'meja_kursi' | 'barat';

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
