import { create } from 'zustand';
import type {
  GameState,
  RoverState,
  MeteorState,
  GameStatus,
  FailReason,
  PlayerProgress,
  LevelConfig
} from '../types/game';
import { getLevelById } from '../game/config/levels';

const STORAGE_KEY = 'lunar-rover-progress';

function loadProgress(): PlayerProgress {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load progress', e);
  }
  return {
    unlockedLevels: [1],
    bestScores: {}
  };
}

function saveProgress(progress: PlayerProgress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error('Failed to save progress', e);
  }
}

function createInitialRover(level: LevelConfig): RoverState {
  const startNode = level.trackNodes.find(n => n.id === level.startNodeId)!;
  const firstConnection = startNode.connections.length > 0 
    ? level.trackNodes.find(n => n.id === startNode.connections[0]) 
    : null;
  const initialAngle = firstConnection 
    ? Math.atan2(firstConnection.y - startNode.y, firstConnection.x - startNode.x) 
    : 0;
  
  return {
    currentNodeId: level.startNodeId,
    targetNodeId: null,
    prevNodeId: null,
    progress: 0,
    speed: 0,
    maxSpeed: 120,
    cargoValue: 0,
    cargoWeight: 0,
    hasCargo: false,
    cargoAttached: true,
    position: { x: startNode.x, y: startNode.y },
    angle: initialAngle,
    isBraking: false,
    isAccelerating: false
  };
}

interface GameStore extends GameState {
  playerProgress: PlayerProgress;
  level: LevelConfig | null;
  actions: {
    loadLevel: (levelId: number) => void;
    startGame: () => void;
    setStatus: (status: GameStatus) => void;
    failGame: (reason: FailReason, message?: string) => void;
    winGame: () => void;
    setAccelerating: (accelerating: boolean) => void;
    setBraking: (braking: boolean) => void;
    setJunctionChoice: (choice: 'left' | 'right' | null) => void;
    setPendingJunction: (pending: boolean) => void;
    updateRover: (updates: Partial<RoverState>) => void;
    setPower: (power: number) => void;
    setOxygen: (oxygen: number) => void;
    setTimeRemaining: (time: number) => void;
    setElapsedTime: (time: number) => void;
    addMeteor: (meteor: MeteorState) => void;
    updateMeteors: (meteors: MeteorState[]) => void;
    removeMeteor: (id: string) => void;
    addVisitedStation: (stationId: string) => void;
    setCargo: (value: number, weight: number) => void;
    multiplyCargoValue: (multiplier: number) => void;
    setCargoAttached: (attached: boolean) => void;
    toggleCargoAttached: () => void;
    restorePower: (amount: number) => void;
    restoreOxygen: (amount: number) => void;
    setMessage: (message: string | null) => void;
    jumpToNode: (nodeId: string, powerCost: number) => boolean;
    requestJump: () => void;
    requestCargoToggle: () => void;
    resetGame: () => void;
    goToMenu: () => void;
    saveScore: (levelId: number, score: number, stars: 0 | 1 | 2 | 3) => void;
    calculateScore: () => void;
  };
}

export const useGameStore = create<GameStore>((set, get) => ({
  status: 'menu',
  failReason: undefined,
  failMessage: undefined,
  currentLevel: 0,
  power: 100,
  maxPower: 100,
  oxygen: 100,
  maxOxygen: 100,
  timeRemaining: 120,
  totalTime: 120,
  elapsedTime: 0,
  score: 0,
  starRating: 0,
  rover: {
    currentNodeId: '',
    targetNodeId: null,
    prevNodeId: null,
    progress: 0,
    speed: 0,
    maxSpeed: 120,
    cargoValue: 0,
    cargoWeight: 0,
    hasCargo: false,
    cargoAttached: true,
    position: { x: 0, y: 0 },
    angle: 0,
    isBraking: false,
    isAccelerating: false
  },
  visitedStations: [],
  activeMeteors: [],
  junctionChoice: null,
  pendingJunction: false,
  message: null,
  jumpRequestCount: 0,
  cargoToggleRequestCount: 0,
  scoreBreakdown: null,
  level: null,
  playerProgress: loadProgress(),

  actions: {
    loadLevel: (levelId: number) => {
      const level = getLevelById(levelId);
      if (!level) return;

      set({
        level,
        currentLevel: levelId,
        status: 'menu',
        failReason: undefined,
        failMessage: undefined,
        power: level.initialPower,
        maxPower: level.initialPower,
        oxygen: level.initialOxygen,
        maxOxygen: level.initialOxygen,
        timeRemaining: level.returnWindow,
        totalTime: level.returnWindow,
        elapsedTime: 0,
        score: 0,
        starRating: 0,
        rover: createInitialRover(level),
        visitedStations: [],
        activeMeteors: [],
        junctionChoice: null,
        pendingJunction: false,
        message: null,
        jumpRequestCount: 0,
        cargoToggleRequestCount: 0,
        scoreBreakdown: null
      });
    },

    startGame: () => {
      const state = get();
      if (!state.level) return;
      const level = state.level;
      set({
        status: 'playing',
        rover: createInitialRover(level),
        power: level.initialPower,
        oxygen: level.initialOxygen,
        timeRemaining: level.returnWindow,
        elapsedTime: 0,
        visitedStations: [],
        activeMeteors: [],
        junctionChoice: null,
        pendingJunction: false,
        message: '任务开始！按 W/↑ 加速矿车出发',
        jumpRequestCount: 0,
        cargoToggleRequestCount: 0,
        scoreBreakdown: null,
        score: 0,
        starRating: 0
      });
    },

    setStatus: (status: GameStatus) => set({ status }),

    failGame: (reason: FailReason, message?: string) => {
      set({
        status: 'failed',
        failReason: reason,
        failMessage: message,
        score: 0,
        starRating: 0
      });
    },

    winGame: () => {
      set({ status: 'success' });
    },

    setAccelerating: (accelerating: boolean) =>
      set(state => ({ rover: { ...state.rover, isAccelerating: accelerating } })),

    setBraking: (braking: boolean) =>
      set(state => ({ rover: { ...state.rover, isBraking: braking } })),

    setJunctionChoice: (choice: 'left' | 'right' | null) => set({ junctionChoice: choice }),

    setPendingJunction: (pending: boolean) => set({ pendingJunction: pending }),

    updateRover: (updates: Partial<RoverState>) =>
      set(state => ({ rover: { ...state.rover, ...updates } })),

    setPower: (power: number) =>
      set(state => ({ power: Math.max(0, Math.min(state.maxPower, power)) })),

    setOxygen: (oxygen: number) =>
      set(state => ({ oxygen: Math.max(0, Math.min(state.maxOxygen, oxygen)) })),

    setTimeRemaining: (time: number) => set({ timeRemaining: Math.max(0, time) }),

    setElapsedTime: (time: number) => set({ elapsedTime: time }),

    addMeteor: (meteor: MeteorState) =>
      set(state => ({ activeMeteors: [...state.activeMeteors, meteor] })),

    updateMeteors: (meteors: MeteorState[]) => set({ activeMeteors: meteors }),

    removeMeteor: (id: string) =>
      set(state => ({ activeMeteors: state.activeMeteors.filter(m => m.id !== id) })),

    addVisitedStation: (stationId: string) =>
      set(state => {
        if (state.visitedStations.includes(stationId)) return {};
        return { visitedStations: [...state.visitedStations, stationId] };
      }),

    setCargo: (value: number, weight: number) =>
      set(state => ({
        rover: {
          ...state.rover,
          cargoValue: value,
          cargoWeight: weight,
          hasCargo: value > 0
        }
      })),

    multiplyCargoValue: (multiplier: number) =>
      set(state => ({
        rover: {
          ...state.rover,
          cargoValue: Math.floor(state.rover.cargoValue * multiplier)
        }
      })),

    setCargoAttached: (attached: boolean) =>
      set(state => ({
        rover: {
          ...state.rover,
          cargoAttached: attached
        }
      })),

    toggleCargoAttached: () =>
      set(state => ({
        rover: {
          ...state.rover,
          cargoAttached: !state.rover.cargoAttached
        }
      })),

    restorePower: (amount: number) =>
      set(state => ({
        power: Math.min(state.maxPower, state.power + amount)
      })),

    restoreOxygen: (amount: number) =>
      set(state => ({
        oxygen: Math.min(state.maxOxygen, state.oxygen + amount)
      })),

    setMessage: (message: string | null) => set({ message }),

    jumpToNode: (nodeId: string, powerCost: number): boolean => {
      const state = get();
      if (state.power < powerCost || !state.level) return false;
      const targetNode = state.level.trackNodes.find(n => n.id === nodeId);
      if (!targetNode) return false;

      const newPower = state.power - powerCost;
      set({
        power: newPower,
        rover: {
          ...state.rover,
          currentNodeId: nodeId,
          targetNodeId: null,
          prevNodeId: state.rover.currentNodeId,
          progress: 0,
          position: { x: targetNode.x, y: targetNode.y }
        },
        message: `跃迁成功！消耗 ${powerCost} 电量`
      });
      return true;
    },

    requestJump: () => {
      set(state => ({ jumpRequestCount: state.jumpRequestCount + 1 }));
    },

    requestCargoToggle: () => {
      set(state => ({ cargoToggleRequestCount: state.cargoToggleRequestCount + 1 }));
    },

    resetGame: () => {
      const state = get();
      if (state.currentLevel > 0) {
        get().actions.loadLevel(state.currentLevel);
      }
    },

    goToMenu: () => {
      set({ status: 'menu' });
    },

    saveScore: (levelId: number, score: number, stars: 0 | 1 | 2 | 3) => {
      const state = get();
      const progress = { ...state.playerProgress };
      const existing = progress.bestScores[levelId];
      if (!existing || score > existing.score) {
        progress.bestScores[levelId] = { score, stars };
      }
      const nextLevelId = levelId + 1;
      if (stars > 0 && !progress.unlockedLevels.includes(nextLevelId)) {
        progress.unlockedLevels.push(nextLevelId);
      }
      saveProgress(progress);
      set({ playerProgress: progress });
    },

    calculateScore: () => {
      const state = get();
      const level = state.level;
      if (!level) return;

      const oreValue = state.rover.cargoValue;
      const remainingPowerBonus = Math.floor(state.power * 10);
      const remainingTimeBonus = Math.floor(state.timeRemaining * 15);
      const remainingOxygenBonus = Math.floor(state.oxygen * 5);
      const total = oreValue + remainingPowerBonus + remainingTimeBonus + remainingOxygenBonus;

      const [oneStar, twoStar, threeStar] = level.threeStarScore;
      let starRating: 0 | 1 | 2 | 3 = 0;
      if (total >= threeStar) starRating = 3;
      else if (total >= twoStar) starRating = 2;
      else if (total >= oneStar) starRating = 1;

      set({
        score: total,
        starRating,
        scoreBreakdown: {
          oreValue,
          remainingPowerBonus,
          remainingTimeBonus,
          remainingOxygenBonus,
          total
        }
      });

      get().actions.saveScore(level.id, total, starRating);
    }
  }
}));
