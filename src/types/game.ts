export type GameStatus = 'menu' | 'playing' | 'paused' | 'success' | 'failed';
export type FailReason = 'power' | 'oxygen' | 'derail' | 'collision' | 'window' | 'value';
export type BaseType = 'mine' | 'smelter' | 'oxygen' | 'solar' | 'return' | 'start';

export interface TrackNode {
  id: string;
  x: number;
  y: number;
  connections: string[];
  isJunction?: boolean;
  leftConnection?: string;
  rightConnection?: string;
}

export interface BaseStation {
  id: string;
  nodeId: string;
  type: BaseType;
  name: string;
  oreValue?: number;
  oreWeight?: number;
  valueMultiplier?: number;
  powerRestore?: number;
  oxygenRestore?: number;
  requiredValue?: number;
}

export interface LevelConfig {
  id: number;
  name: string;
  description: string;
  difficulty: 1 | 2 | 3;
  threeStarScore: [number, number, number];
  initialPower: number;
  initialOxygen: number;
  returnWindow: number;
  trackNodes: TrackNode[];
  baseStations: BaseStation[];
  startNodeId: string;
  obstacles: { x: number; y: number; radius: number; type: 'crater' | 'rock' }[];
  meteorSchedule: { time: number; x: number; y: number; warningTime: number; radius: number }[];
}

export interface RoverState {
  currentNodeId: string;
  targetNodeId: string | null;
  prevNodeId: string | null;
  progress: number;
  speed: number;
  maxSpeed: number;
  cargoValue: number;
  cargoWeight: number;
  hasCargo: boolean;
  cargoAttached: boolean;
  position: { x: number; y: number };
  angle: number;
  isBraking: boolean;
  isAccelerating: boolean;
}

export interface MeteorState {
  id: string;
  x: number;
  y: number;
  radius: number;
  timeToImpact: number;
  warningTime: number;
  impacted: boolean;
}

export interface GameState {
  status: GameStatus;
  failReason?: FailReason;
  failMessage?: string;
  currentLevel: number;
  power: number;
  maxPower: number;
  oxygen: number;
  maxOxygen: number;
  timeRemaining: number;
  totalTime: number;
  elapsedTime: number;
  score: number;
  starRating: 0 | 1 | 2 | 3;
  rover: RoverState;
  visitedStations: string[];
  activeMeteors: MeteorState[];
  junctionChoice: 'left' | 'right' | null;
  pendingJunction: boolean;
  message: string | null;
  jumpRequestCount: number;
  cargoToggleRequestCount: number;
  scoreBreakdown: {
    oreValue: number;
    remainingPowerBonus: number;
    remainingTimeBonus: number;
    remainingOxygenBonus: number;
    total: number;
  } | null;
}

export interface PlayerProgress {
  unlockedLevels: number[];
  bestScores: Record<number, { score: number; stars: 0 | 1 | 2 | 3 }>;
}

export const FAIL_REASON_MESSAGES: Record<FailReason, { title: string; description: string; suggestion: string }> = {
  power: {
    title: '电量耗尽',
    description: '矿车电池已完全耗尽，无法继续移动。',
    suggestion: '提示：尝试在太阳能充电区补充电量，或规划更短的路线减少耗电。'
  },
  oxygen: {
    title: '氧气耗尽',
    description: '氧气储备已耗尽，任务无法继续。',
    suggestion: '提示：确保路线经过氧气塔补充氧气，或减少不必要的绕路。'
  },
  derail: {
    title: '货箱脱轨',
    description: '货箱在急转弯或高速行驶时脱离了轨道。',
    suggestion: '提示：在弯道前提前刹车减速，或减轻货箱重量。'
  },
  collision: {
    title: '撞击障碍',
    description: '矿车撞上了陨石或月面障碍。',
    suggestion: '提示：注意红色警告区域，使用跃迁避开陨石坠落点。'
  },
  window: {
    title: '错过发射窗口',
    description: '返回舱发射窗口已关闭，无法离开月球。',
    suggestion: '提示：提前规划路线，在倒计时结束前到达返回舱。'
  },
  value: {
    title: '矿石价值不足',
    description: '采集的矿石总价值未达到返回舱的最低要求。',
    suggestion: '提示：访问更多采矿点，或经过熔炼站提升矿石价值。'
  }
};

export const BASE_TYPE_INFO: Record<BaseType, { label: string; color: string; icon: string }> = {
  mine: { label: '采矿点', color: '#ffd93d', icon: '⛏' },
  smelter: { label: '熔炼站', color: '#ff6b35', icon: '🔥' },
  oxygen: { label: '氧气塔', color: '#6bcb77', icon: '💨' },
  solar: { label: '太阳能区', color: '#4ecdc4', icon: '☀' },
  return: { label: '返回舱', color: '#ff4757', icon: '🚀' },
  start: { label: '起点', color: '#a29bfe', icon: '🏁' }
};
