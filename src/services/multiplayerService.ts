import { ClientMessage, ServerMessage, RoomState, PlayerProfile, GameMode } from '../types/game';

type StateListener = (state: RoomState) => void;
type AnnouncementListener = (msg: string, level?: 'info' | 'success' | 'warning') => void;
type ErrorListener = (error: string) => void;
type ConnectionListener = (connected: boolean, connecting: boolean) => void;

class MultiplayerService {
  private ws: WebSocket | null = null;
  private currentRoomCode: string | null = null;
  private myPlayerId: string = `p_${Math.random().toString(36).substring(2, 9)}`;
  private stateListeners: Set<StateListener> = new Set();
  private announcementListeners: Set<AnnouncementListener> = new Set();
  private errorListeners: Set<ErrorListener> = new Set();
  private connectionListeners: Set<ConnectionListener> = new Set();
  private isConnecting: boolean = false;
  private connectPromise: Promise<boolean> | null = null;
  private pingInterval: number | null = null;
  private reconnectTimeout: number | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private manualDisconnect: boolean = false;
  private lastKnownState: RoomState | null = null;
  private storedPlayerProfile: Omit<PlayerProfile, 'isHost' | 'joinedAt'> | null = null;

  constructor() {
    // Generate or retrieve stored playerId
    try {
      const stored = sessionStorage.getItem('jamath_player_id');
      if (stored) {
        this.myPlayerId = stored;
      } else {
        sessionStorage.setItem('jamath_player_id', this.myPlayerId);
      }
    } catch {}
  }

  public getPlayerId(): string {
    return this.myPlayerId;
  }

  public getRoomCode(): string | null {
    return this.currentRoomCode;
  }

  public getLastKnownState(): RoomState | null {
    return this.lastKnownState;
  }

  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Resolves the WebSocket URL with environment variable override (VITE_WS_URL)
   * or falls back dynamically to the current host with correct ws:// or wss:// protocol.
   */
  public getWebSocketUrl(): string {
    const envWsUrl = (import.meta as any).env?.VITE_WS_URL;
    if (envWsUrl && typeof envWsUrl === 'string' && envWsUrl.trim().length > 0) {
      return envWsUrl.trim();
    }
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      return `${protocol}//${host}/ws`;
    }
    return 'ws://localhost:3000/ws';
  }

  /**
   * Connects to WebSocket server. Reuses in-flight promise to prevent duplicate sockets
   * caused by simultaneous calls or React re-renders.
   */
  public connect(): Promise<boolean> {
    if (this.isConnected()) return Promise.resolve(true);
    if (this.connectPromise) return this.connectPromise;

    this.isConnecting = true;
    this.notifyConnection(false, true);

    this.connectPromise = new Promise<boolean>((resolve) => {
      try {
        const wsUrl = this.getWebSocketUrl();
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.connectPromise = null;
          this.notifyConnection(true, false);
          this.startHeartbeat();
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          try {
            const msg: ServerMessage = JSON.parse(event.data);
            this.handleMessage(msg);
          } catch (e) {
            console.error('Failed to parse WS message:', e);
          }
        };

        this.ws.onclose = () => {
          this.isConnecting = false;
          this.connectPromise = null;
          this.stopHeartbeat();
          this.notifyConnection(false, false);
          this.handleUnexpectedClose();
          resolve(false);
        };

        this.ws.onerror = (err) => {
          console.warn('WS error:', err);
          this.isConnecting = false;
          this.connectPromise = null;
          this.notifyConnection(false, false);
          resolve(false);
        };
      } catch (err) {
        this.isConnecting = false;
        this.connectPromise = null;
        this.notifyConnection(false, false);
        resolve(false);
      }
    });

    return this.connectPromise;
  }

  private handleUnexpectedClose() {
    if (this.manualDisconnect) return;
    // Auto-reconnect if player was in an active room
    if (this.currentRoomCode && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 5000);
      this.notifyAnnouncement(
        `Koneksi terputus. Menghubungkan ulang (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`,
        'warning'
      );

      if (this.reconnectTimeout !== null) {
        window.clearTimeout(this.reconnectTimeout);
      }

      this.reconnectTimeout = window.setTimeout(async () => {
        const ok = await this.connect();
        if (ok && this.currentRoomCode && this.storedPlayerProfile) {
          this.send({
            type: 'JOIN_ROOM',
            payload: {
              roomCode: this.currentRoomCode,
              player: { ...this.storedPlayerProfile, id: this.myPlayerId }
            }
          });
        }
      }, delay);
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.pingInterval = window.setInterval(() => {
      this.send({ type: 'PING' });
    }, 20000);
  }

  private stopHeartbeat() {
    if (this.pingInterval !== null) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private handleMessage(msg: ServerMessage) {
    switch (msg.type) {
      case 'ROOM_CREATED':
      case 'ROOM_JOINED':
        this.currentRoomCode = msg.payload.roomCode;
        this.myPlayerId = msg.payload.playerId;
        this.lastKnownState = msg.payload.roomState;
        this.notifyState(msg.payload.roomState);
        break;

      case 'ROOM_STATE_UPDATE':
        this.lastKnownState = msg.payload;
        this.notifyState(msg.payload);
        break;

      case 'ANNOUNCEMENT':
        this.notifyAnnouncement(msg.payload.message, msg.payload.level);
        break;

      case 'ERROR':
        this.notifyError(msg.payload.message);
        break;

      case 'PLAYER_DISCONNECTED':
        this.notifyAnnouncement(`${msg.payload.playerName} keluar dari room`, 'warning');
        break;

      case 'PONG':
        // Heartbeat received
        break;
    }
  }

  private send(msg: ClientMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  public async createRoom(mode: GameMode, player: Omit<PlayerProfile, 'isHost' | 'joinedAt'>) {
    this.manualDisconnect = false;
    this.storedPlayerProfile = player;
    await this.connect();
    this.send({
      type: 'CREATE_ROOM',
      payload: { mode, player: { ...player, id: this.myPlayerId } }
    });
  }

  public async joinRoom(roomCode: string, player: Omit<PlayerProfile, 'isHost' | 'joinedAt'>) {
    this.manualDisconnect = false;
    this.storedPlayerProfile = player;
    await this.connect();
    this.send({
      type: 'JOIN_ROOM',
      payload: { roomCode: roomCode.trim().toUpperCase(), player: { ...player, id: this.myPlayerId } }
    });
  }

  public joinGroup(groupId: string) {
    this.send({
      type: 'JOIN_GROUP',
      payload: { groupId }
    });
  }

  public startGame() {
    this.send({
      type: 'START_GAME'
    });
  }

  public selectTargetGroup(targetGroupId: string) {
    this.send({
      type: 'SELECT_TARGET_GROUP',
      payload: { targetGroupId }
    });
  }

  public moveNumberLine(position: number) {
    this.send({
      type: 'MOVE_NUMBER_LINE',
      payload: { position }
    });
  }

  public submitAnswer(position: number) {
    this.send({
      type: 'SUBMIT_ANSWER',
      payload: { position }
    });
  }

  public leaveRoom() {
    this.manualDisconnect = true;
    if (this.reconnectTimeout !== null) {
      window.clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.send({ type: 'LEAVE_ROOM' });
    this.currentRoomCode = null;
    this.lastKnownState = null;
    this.storedPlayerProfile = null;
    this.reconnectAttempts = 0;
  }

  public disconnect() {
    this.manualDisconnect = true;
    this.stopHeartbeat();
    if (this.reconnectTimeout !== null) {
      window.clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }
    this.isConnecting = false;
    this.connectPromise = null;
    this.notifyConnection(false, false);
  }

  // Listeners
  public onStateUpdate(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    if (this.lastKnownState) listener(this.lastKnownState);
    return () => this.stateListeners.delete(listener);
  }

  public onAnnouncement(listener: AnnouncementListener): () => void {
    this.announcementListeners.add(listener);
    return () => this.announcementListeners.delete(listener);
  }

  public onError(listener: ErrorListener): () => void {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  public onConnectionChange(listener: ConnectionListener): () => void {
    this.connectionListeners.add(listener);
    listener(this.isConnected(), this.isConnecting);
    return () => this.connectionListeners.delete(listener);
  }

  private notifyState(state: RoomState) {
    this.stateListeners.forEach((l) => l(state));
  }

  private notifyAnnouncement(msg: string, level?: 'info' | 'success' | 'warning') {
    this.announcementListeners.forEach((l) => l(msg, level));
  }

  private notifyError(err: string) {
    this.errorListeners.forEach((l) => l(err));
  }

  private notifyConnection(connected: boolean, connecting: boolean) {
    this.connectionListeners.forEach((l) => l(connected, connecting));
  }
}

export const multiplayerService = new MultiplayerService();
