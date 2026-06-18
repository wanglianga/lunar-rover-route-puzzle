import Phaser from 'phaser';
import type { LevelConfig, TrackNode, BaseStation, MeteorState, ShadowState } from '../../types/game';
import { BASE_TYPE_INFO, ORE_TYPE_INFO } from '../../types/game';
import { useGameStore } from '../../store/gameStore';

const GRAVITY_MULTIPLIER = 0.17;
const BASE_ACCELERATION = 180;
const LIGHT_WEIGHT_ACCEL_BONUS = 1.6;
const HEAVY_WEIGHT_ACCEL_PENALTY = 0.55;
const BRAKE_DECELERATION = 280;
const LIGHT_WEIGHT_BRAKE_BONUS = 1.4;
const HEAVY_WEIGHT_BRAKE_PENALTY = 0.45;
const BASE_DECELERATION = 40;
const JUNCTION_TRIGGER_DISTANCE = 20;
const POWER_DRAIN_BASE = 1.5;
const POWER_DRAIN_SPEED_FACTOR = 0.008;
const POWER_DRAIN_WEIGHT_FACTOR = 0.06;
const POWER_DRAIN_LIGHT_WEIGHT_BONUS = 0.6;
const OXYGEN_DRAIN = 0.8;
const JUMP_POWER_COST_BASE = 15;
const JUMP_POWER_COST_PER_DIST = 0.03;
const JUMP_POWER_WEIGHT_FACTOR = 0.8;
const DERAIL_SPEED_THRESHOLD = 150;
const DERAIL_ANGLE_THRESHOLD = 0.9;
const DERAIL_LIGHT_WEIGHT_REDUCTION = 0.3;
const DERAIL_HEAVY_WEIGHT_MULTIPLIER = 2.5;
const SHADOW_POWER_RESTORE_MULTIPLIER = 0.25;
const WEAK_TRACK_DAMAGE_PER_WEIGHT = 0.035;
const WEAK_TRACK_DAMAGE_HEAVY_EXTRA = 0.08;
const TRACK_COLLAPSE_THRESHOLD = 1.0;

export default class GameScene extends Phaser.Scene {
  private graphics!: Phaser.GameObjects.Graphics;
  private roverSprite!: Phaser.GameObjects.Container;
  private roverBody!: Phaser.GameObjects.Graphics;
  private ledLight!: Phaser.GameObjects.Arc;
  private cargoSprite!: Phaser.GameObjects.Graphics;
  private dustParticles!: Phaser.GameObjects.Particles.ParticleEmitter;
  private stars!: Phaser.GameObjects.Arc[];
  private meteorWarnings: Map<string, Phaser.GameObjects.Arc> = new Map();
  private meteorObjects: Map<string, Phaser.GameObjects.Graphics> = new Map();
  private stationSprites: Map<string, Phaser.GameObjects.Container> = new Map();
  private shadowOverlays: Map<string, Phaser.GameObjects.Graphics> = new Map();
  private shadowProgressBars: Map<string, { bg: Phaser.GameObjects.Graphics; fill: Phaser.GameObjects.Graphics; label: Phaser.GameObjects.Text; timer: Phaser.GameObjects.Text }> = new Map();
  private weakTrackWarnings: Map<string, Phaser.GameObjects.Graphics> = new Map();
  private trackGlows: Phaser.GameObjects.Graphics[] = [];
  private lastUpdateMs = 0;
  private processedMeteorIndices: Set<number> = new Set();
  private messageTimer: Phaser.Time.TimerEvent | null = null;
  private derailAngle = 0;
  private pendingStationId: string | null = null;
  private stationTriggerCooldown = 0;
  private lastJumpRequestCount = 0;
  private lastCargoToggleRequestCount = 0;

  constructor() {
    super('GameScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#0d0d1a');
    this.createStarfield();
    this.graphics = this.add.graphics();

    const state = useGameStore.getState();
    if (!state.level) return;

    this.createLunarTerrain(state.level);
    this.drawTracks(state.level);
    this.createObstacles(state.level);
    this.createBaseStations(state.level);
    this.createShadowOverlays(state.level);
    this.createWeakTrackMarkers(state.level);
    this.createRover();
    this.createDustParticles();
    this.setupInputListeners();

    this.events.on('shutdown', this.handleShutdown.bind(this));
  }

  private createStarfield() {
    this.stars = [];
    for (let i = 0; i < 120; i++) {
      const x = Phaser.Math.Between(0, this.game.scale.width);
      const y = Phaser.Math.Between(0, this.game.scale.height);
      const size = Phaser.Math.FloatBetween(0.5, 2);
      const alpha = Phaser.Math.FloatBetween(0.3, 1);
      const star = this.add.circle(x, y, size, 0xffffff, alpha);
      this.stars.push(star);
    }

    this.time.addEvent({
      delay: 200,
      loop: true,
      callback: () => {
        this.stars.forEach(star => {
          if (Math.random() < 0.05) {
            star.setAlpha(Phaser.Math.FloatBetween(0.3, 1));
          }
        });
      }
    });
  }

  private createLunarTerrain(level: LevelConfig) {
    const terrain = this.add.graphics();
    terrain.fillStyle(0x1a1a2e, 1);
    terrain.fillRect(0, 0, this.game.scale.width, this.game.scale.height);

    terrain.fillStyle(0x252540, 0.8);
    for (let i = 0; i < 8; i++) {
      const x = Phaser.Math.Between(100, this.game.scale.width - 100);
      const y = Phaser.Math.Between(50, this.game.scale.height - 50);
      const radius = Phaser.Math.Between(60, 140);
      terrain.fillCircle(x, y, radius);
    }

    for (let i = 0; i < 15; i++) {
      const x = Phaser.Math.Between(30, this.game.scale.width - 30);
      const y = Phaser.Math.Between(30, this.game.scale.height - 30);
      const radius = Phaser.Math.Between(8, 25);
      terrain.fillStyle(0x2a2a4a, 0.6);
      terrain.fillCircle(x, y, radius);
    }
  }

  private drawTracks(level: LevelConfig) {
    const nodeMap = new Map<string, TrackNode>();
    level.trackNodes.forEach(n => nodeMap.set(n.id, n));

    const drawnEdges = new Set<string>();

    level.trackNodes.forEach(node => {
      node.connections.forEach(connId => {
        const edgeKey = [node.id, connId].sort().join('-');
        if (drawnEdges.has(edgeKey)) return;
        drawnEdges.add(edgeKey);
        const target = nodeMap.get(connId);
        if (!target) return;

        const isWeak = node.trackType === 'weak' || target.trackType === 'weak';

        if (isWeak) {
          const g = this.add.graphics();
          g.lineStyle(8, 0x5a4030, 0.6);
          g.lineBetween(node.x, node.y, target.x, target.y);
          g.lineStyle(4, 0x8b6040, 1);
          g.lineBetween(node.x, node.y, target.x, target.y);
          g.lineStyle(1, 0xcc9966, 0.5);
          const dx = target.x - node.x;
          const dy = target.y - node.y;
          const len = Math.hypot(dx, dy);
          const dashLen = 10;
          const gapLen = 8;
          let dist = 0;
          while (dist < len) {
            const segEnd = Math.min(dist + dashLen, len);
            const t1 = dist / len;
            const t2 = segEnd / len;
            g.lineBetween(
              node.x + dx * t1, node.y + dy * t1,
              node.x + dx * t2, node.y + dy * t2
            );
            dist = segEnd + gapLen;
          }
          this.trackGlows.push(g);
        } else {
          this.graphics.lineStyle(10, 0x3a3020, 0.6);
          this.graphics.lineBetween(node.x, node.y, target.x, target.y);

          this.graphics.lineStyle(6, 0x8b7355, 1);
          this.graphics.lineBetween(node.x, node.y, target.x, target.y);

          this.graphics.lineStyle(2, 0xc9b898, 0.8);
          this.graphics.lineBetween(node.x, node.y, target.x, target.y);
        }
      });
    });

    level.trackNodes.forEach(node => {
      if (node.isJunction) {
        this.graphics.fillStyle(0x2a1a0a, 0.9);
        this.graphics.fillCircle(node.x, node.y, 12);
        this.graphics.fillStyle(0xff6b35, 0.9);
        this.graphics.fillCircle(node.x, node.y, 8);
        this.graphics.lineStyle(2, 0xffddaa, 1);
        this.graphics.strokeCircle(node.x, node.y, 12);
      } else if (node.trackType === 'weak') {
        this.graphics.fillStyle(0x2a1a0a, 0.9);
        this.graphics.fillCircle(node.x, node.y, 8);
        this.graphics.fillStyle(0x8b6040, 0.9);
        this.graphics.fillCircle(node.x, node.y, 4);
        this.graphics.lineStyle(1, 0xcc9966, 0.6);
        this.graphics.strokeCircle(node.x, node.y, 8);
      } else {
        this.graphics.fillStyle(0x3a3020, 0.8);
        this.graphics.fillCircle(node.x, node.y, 6);
        this.graphics.fillStyle(0x6a5a4a, 0.8);
        this.graphics.fillCircle(node.x, node.y, 3);
      }
    });
  }

  private createObstacles(level: LevelConfig) {
    level.obstacles.forEach(obs => {
      if (obs.type === 'crater') {
        const crater = this.add.graphics();
        crater.fillStyle(0x0a0a15, 0.7);
        crater.fillCircle(obs.x, obs.y, obs.radius);
        crater.lineStyle(2, 0x3a3a55, 0.8);
        crater.strokeCircle(obs.x, obs.y, obs.radius);
        crater.fillStyle(0x202035, 0.5);
        crater.fillCircle(obs.x + 3, obs.y + 3, obs.radius * 0.85);
      } else {
        const rock = this.add.graphics();
        rock.fillStyle(0x4a4a5e, 1);
        rock.fillCircle(obs.x, obs.y, obs.radius);
        rock.fillStyle(0x5a5a70, 0.7);
        rock.fillCircle(obs.x - obs.radius * 0.3, obs.y - obs.radius * 0.3, obs.radius * 0.4);
        rock.lineStyle(1, 0x2a2a3e, 0.8);
        rock.strokeCircle(obs.x, obs.y, obs.radius);
      }
    });
  }

  private createBaseStations(level: LevelConfig) {
    const nodeMap = new Map<string, TrackNode>();
    level.trackNodes.forEach(n => nodeMap.set(n.id, n));

    level.baseStations.forEach(station => {
      const node = nodeMap.get(station.nodeId);
      if (!node) return;
      this.createStationSprite(station, node);
    });
  }

  private createStationSprite(station: BaseStation, node: TrackNode) {
    const info = BASE_TYPE_INFO[station.type];
    const color = Phaser.Display.Color.HexStringToColor(info.color).color;

    const container = this.add.container(node.x, node.y);
    container.setSize(60, 60);

    const glow = this.add.circle(0, 0, 35, color, 0.15);
    container.add(glow);

    const base = this.add.circle(0, 0, 26, 0x2a2a45, 0.95);
    base.setStrokeStyle(3, color, 1);
    container.add(base);

    const inner = this.add.circle(0, 0, 18, 0x1a1a2e, 1);
    container.add(inner);

    const iconText = this.add.text(0, 0, info.icon, {
      fontSize: '22px',
      fontFamily: 'serif'
    });
    iconText.setOrigin(0.5);
    container.add(iconText);

    const nameText = this.add.text(0, 42, station.name, {
      fontSize: '12px',
      color: info.color,
      fontFamily: 'sans-serif',
      fontStyle: 'bold'
    });
    nameText.setOrigin(0.5);
    nameText.setStroke('#0a0a15', 3);
    container.add(nameText);

    if (station.type === 'mine' && station.oreType) {
      const oreInfo = ORE_TYPE_INFO[station.oreType];
      const oreLabel = this.add.text(0, -35, `${oreInfo.icon}${oreInfo.label}`, {
        fontSize: '10px',
        color: oreInfo.color,
        fontFamily: 'sans-serif',
        fontStyle: 'bold'
      });
      oreLabel.setOrigin(0.5);
      oreLabel.setStroke('#0a0a15', 2);
      container.add(oreLabel);
    }

    this.tweens.add({
      targets: glow,
      scale: { from: 1, to: 1.3 },
      alpha: { from: 0.15, to: 0.05 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.stationSprites.set(station.id, container);
  }

  private createShadowOverlays(level: LevelConfig) {
    if (!level.shadowZones) return;

    const nodeMap = new Map<string, TrackNode>();
    level.trackNodes.forEach(n => nodeMap.set(n.id, n));

    level.shadowZones.forEach(sz => {
      const station = level.baseStations.find(s => s.id === sz.stationId);
      if (!station) return;
      const node = nodeMap.get(station.nodeId);
      if (!node) return;

      const shadowGfx = this.add.graphics();
      shadowGfx.fillStyle(0x000033, 0.4);
      shadowGfx.fillCircle(0, 0, 45);
      shadowGfx.lineStyle(2, 0x3333aa, 0.6);
      shadowGfx.strokeCircle(0, 0, 45);
      shadowGfx.setPosition(node.x, node.y);
      shadowGfx.setAlpha(0);
      shadowGfx.setDepth(5);

      this.shadowOverlays.set(sz.id, shadowGfx);

      const barBg = this.add.graphics();
      barBg.fillStyle(0x000000, 0.6);
      barBg.fillRoundedRect(-35, 48, 70, 8, 2);
      barBg.lineStyle(1, 0x4a4a7a, 0.8);
      barBg.strokeRoundedRect(-35, 48, 70, 8, 2);
      barBg.setPosition(node.x, node.y);
      barBg.setDepth(6);

      const barFill = this.add.graphics();
      barFill.setPosition(node.x, node.y);
      barFill.setDepth(6);

      const labelText = this.add.text(node.x, node.y + 42, '☀ 光照中', {
        fontSize: '10px',
        color: '#4ecdc4',
        fontFamily: 'sans-serif',
        fontStyle: 'bold'
      });
      labelText.setOrigin(0.5);
      labelText.setDepth(6);
      labelText.setStroke('#0a0a15', 2);

      const timerText = this.add.text(node.x, node.y + 62, '', {
        fontSize: '10px',
        color: '#ffffff',
        fontFamily: 'sans-serif',
        fontStyle: 'bold'
      });
      timerText.setOrigin(0.5);
      timerText.setDepth(6);
      timerText.setStroke('#0a0a15', 2);

      this.shadowProgressBars.set(sz.id, {
        bg: barBg,
        fill: barFill,
        label: labelText,
        timer: timerText
      });
    });
  }

  private createWeakTrackMarkers(level: LevelConfig) {
    level.trackNodes.forEach(node => {
      if (node.trackType !== 'weak') return;

      const marker = this.add.graphics();
      marker.fillStyle(0xff6600, 0.3);
      marker.fillCircle(node.x, node.y, 20);
      marker.lineStyle(2, 0xff9900, 0.5);
      marker.strokeCircle(node.x, node.y, 20);

      const warnText = this.add.text(node.x, node.y - 28, '⚠临时', {
        fontSize: '9px',
        color: '#ff9900',
        fontFamily: 'sans-serif',
        fontStyle: 'bold'
      });
      warnText.setOrigin(0.5);
      warnText.setStroke('#0a0a15', 2);

      this.tweens.add({
        targets: marker,
        alpha: { from: 0.6, to: 0.2 },
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      this.weakTrackWarnings.set(node.id, marker);
    });
  }

  private createRover() {
    const state = useGameStore.getState();
    const pos = state.rover.position;

    this.roverSprite = this.add.container(pos.x, pos.y);
    this.roverSprite.setSize(48, 32);
    this.roverSprite.setDepth(10);

    this.roverBody = this.add.graphics();
    this.drawRoverBody();
    this.roverSprite.add(this.roverBody);

    this.ledLight = this.add.circle(0, -12, 4, 0x6bcb77, 1);
    this.ledLight.setStrokeStyle(1, 0x000000, 1);
    this.roverSprite.add(this.ledLight);

    this.cargoSprite = this.add.graphics();
    this.drawCargoSprite();
    this.roverSprite.add(this.cargoSprite);

    const headlight = this.add.sprite(22, 0, null as any);
    headlight.setVisible(false);
    this.roverSprite.add(headlight);
  }

  private drawRoverBody() {
    this.roverBody.clear();
    this.roverBody.fillStyle(0x8b4513, 1);
    this.roverBody.fillRoundedRect(-20, -12, 36, 24, 4);

    this.roverBody.fillStyle(0xa0522d, 1);
    this.roverBody.fillRoundedRect(-18, -10, 32, 6, 2);

    this.roverBody.fillStyle(0x2a4a6a, 0.9);
    this.roverBody.fillRoundedRect(-8, -8, 18, 12, 2);
    this.roverBody.fillStyle(0x4a7aaa, 0.6);
    this.roverBody.fillRoundedRect(-6, -6, 14, 4, 1);

    this.roverBody.fillStyle(0x1a1a1a, 1);
    this.roverBody.fillCircle(-14, 12, 6);
    this.roverBody.fillCircle(6, 12, 6);
    this.roverBody.fillStyle(0x3a3a3a, 1);
    this.roverBody.fillCircle(-14, 12, 3);
    this.roverBody.fillCircle(6, 12, 3);

    this.roverBody.lineStyle(1, 0x5a3010, 0.8);
    this.roverBody.strokeRoundedRect(-20, -12, 36, 24, 4);
  }

  private drawCargoSprite() {
    this.cargoSprite.clear();
    const state = useGameStore.getState();
    if (state.rover.cargoAttached) {
      if (state.rover.hasCargo) {
        const weightRatio = Math.min(1, state.rover.cargoWeight / 25);
        let cargoColor = 0xd4af37;
        let borderColor = 0xffd700;
        if (state.rover.cargoWeight >= 20) {
          cargoColor = 0xcc3300;
          borderColor = 0xff4500;
        } else if (state.rover.cargoWeight >= 12) {
          cargoColor = 0xdaa520;
          borderColor = 0xffcc00;
        } else {
          cargoColor = 0x87ceeb;
          borderColor = 0xaaddff;
        }

        this.cargoSprite.fillStyle(cargoColor, 0.95);
        this.cargoSprite.fillRoundedRect(-28, -6, 12, 16, 2);
        this.cargoSprite.lineStyle(2, borderColor, 1);
        this.cargoSprite.strokeRoundedRect(-28, -6, 12, 16, 2);

        this.cargoSprite.fillStyle(0x000000, 0.3 + weightRatio * 0.3);
        this.cargoSprite.fillRoundedRect(-26, -4, 8, 12, 1);
      } else {
        this.cargoSprite.fillStyle(0x8b7355, 0.7);
        this.cargoSprite.fillRoundedRect(-28, -6, 12, 16, 2);
        this.cargoSprite.lineStyle(2, 0xa08060, 0.8);
        this.cargoSprite.strokeRoundedRect(-28, -6, 12, 16, 2);
      }
    }
  }

  private createDustParticles() {
    this.dustParticles = this.add.particles(0, 0, null as any, {
      lifespan: 600,
      speed: { min: 10, max: 30 },
      scale: { start: 0.08, end: 0 },
      alpha: { start: 0.5, end: 0 },
      quantity: 0,
      emitZone: { source: new Phaser.Geom.Rectangle(-20, 8, 10, 8) as any, type: 'random' as any }
    }) as any;

    this.dustParticles.startFollow(this.roverSprite);
  }

  private setupInputListeners() {
    const keys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      upArrow: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      downArrow: Phaser.Input.Keyboard.KeyCodes.DOWN,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      leftArrow: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      rightArrow: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
      q: Phaser.Input.Keyboard.KeyCodes.Q,
      e: Phaser.Input.Keyboard.KeyCodes.E
    }) as Record<string, Phaser.Input.Keyboard.Key>;

    const actions = useGameStore.getState().actions;

    const accelKeys = [keys.up, keys.upArrow];
    const brakeKeys = [keys.down, keys.downArrow];
    const leftKeys = [keys.left, keys.leftArrow, keys.q];
    const rightKeys = [keys.right, keys.rightArrow, keys.e];

    accelKeys.forEach(k => {
      k.on('down', () => actions.setAccelerating(true));
      k.on('up', () => actions.setAccelerating(false));
    });

    brakeKeys.forEach(k => {
      k.on('down', () => actions.setBraking(true));
      k.on('up', () => actions.setBraking(false));
    });

    leftKeys.forEach(k => {
      k.on('down', () => {
        const s = useGameStore.getState();
        if (s.pendingJunction) {
          actions.setJunctionChoice('left');
        }
      });
    });

    rightKeys.forEach(k => {
      k.on('down', () => {
        const s = useGameStore.getState();
        if (s.pendingJunction) {
          actions.setJunctionChoice('right');
        }
      });
    });

    keys.space.on('down', () => {
      this.tryJump();
    });

    keys.e.on('down', () => {
      this.tryToggleCargo();
    });
  }

  private tryJump() {
    const state = useGameStore.getState();
    const actions = state.actions;
    if (!state.level || state.status !== 'playing') return;

    const currentPos = state.rover.position;
    let nearestId: string | null = null;
    let nearestDist = Infinity;

    state.level.trackNodes.forEach(node => {
      if (node.id === state.rover.currentNodeId) return;
      if (state.rover.targetNodeId && node.id === state.rover.targetNodeId) return;
      const dist = Math.hypot(node.x - currentPos.x, node.y - currentPos.y);
      if (dist < 250 && dist < nearestDist) {
        nearestDist = dist;
        nearestId = node.id;
      }
    });

    if (!nearestId) {
      actions.setMessage('附近没有可跃迁的节点');
      this.startMessageTimer();
      return;
    }

    let weightCostBonus = state.rover.cargoWeight * JUMP_POWER_WEIGHT_FACTOR;
    if (state.rover.cargoAttached && state.rover.hasCargo && state.rover.cargoWeight <= 8) {
      weightCostBonus *= 0.5;
    } else if (state.rover.cargoAttached && state.rover.hasCargo && state.rover.cargoWeight >= 20) {
      weightCostBonus *= 1.8;
    }
    const cost = Math.floor(JUMP_POWER_COST_BASE + nearestDist * JUMP_POWER_COST_PER_DIST + weightCostBonus);
    if (state.power < cost) {
      actions.setMessage(`电量不足！跃迁需要 ${cost} 电量`);
      this.startMessageTimer();
      return;
    }

    this.tweens.add({
      targets: this.roverSprite,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0.3,
      duration: 150,
      yoyo: true,
      onComplete: () => {
        actions.jumpToNode(nearestId!, cost);
        this.cameras.main.flash(100, 100, 200, 255);
        this.tweens.add({
          targets: this.roverSprite,
          scaleX: 1,
          scaleY: 1,
          alpha: 1,
          duration: 150
        });
      }
    });

    this.startMessageTimer();
  }

  private tryToggleCargo() {
    const state = useGameStore.getState();
    const actions = state.actions as any;
    if (state.status !== 'playing') return;

    if (state.rover.targetNodeId) {
      actions.setMessage('移动中无法切换货箱');
      this.startMessageTimer();
      return;
    }

    if (state.rover.cargoAttached) {
      actions.toggleCargoAttached();
      actions.setMessage('货箱已卸下，矿车更轻快了');
      this.cameras.main.shake(100, 0.003);
    } else {
      actions.toggleCargoAttached();
      actions.setMessage('已挂载货箱，可以装载矿石了');
      this.cameras.main.shake(100, 0.003);
    }
    this.startMessageTimer();
  }

  private startMessageTimer() {
    if (this.messageTimer) this.time.removeEvent(this.messageTimer);
    this.messageTimer = this.time.delayedCall(2500, () => {
      useGameStore.getState().actions.setMessage(null);
      this.messageTimer = null;
    });
  }

  update(time: number, deltaMs: number) {
    const state = useGameStore.getState();
    if (!state.level) return;

    const delta = deltaMs / 1000;

    if (state.status === 'playing') {
      if (state.jumpRequestCount !== this.lastJumpRequestCount) {
        this.lastJumpRequestCount = state.jumpRequestCount;
        this.tryJump();
      }
      if (state.cargoToggleRequestCount !== this.lastCargoToggleRequestCount) {
        this.lastCargoToggleRequestCount = state.cargoToggleRequestCount;
        this.tryToggleCargo();
      }

      this.updateShadowStates(state, delta);
      this.updateResources(state, delta);
      this.updateRoverPhysics(state, delta, deltaMs);
      this.updateMeteors(state, delta);
      this.checkCollisions(state);
      this.updateWeakTrackVisuals(state);
      this.updateShadowVisuals(state);
      this.updateVisuals(state);

      this.stationTriggerCooldown = Math.max(0, this.stationTriggerCooldown - delta);

      if (state.timeRemaining <= 0) {
        state.actions.failGame('window');
      }
      if (state.power <= 0 && state.rover.speed <= 0.1 && !state.rover.targetNodeId) {
        state.actions.failGame('power');
      }
      if (state.oxygen <= 0) {
        state.actions.failGame('oxygen');
      }
    }

    if (state.status === 'success' && !state.scoreBreakdown) {
      state.actions.calculateScore();
    }
  }

  private updateShadowStates(state: ReturnType<typeof useGameStore.getState>, delta: number) {
    const level = state.level!;
    if (!level.shadowZones) return;

    const updatedShadows: ShadowState[] = state.shadowStates.map(ss => {
      const zoneConfig = level.shadowZones!.find(z => z.id === ss.id);
      if (!zoneConfig) return ss;

      const newTimeInCycle = (ss.timeInCycle + delta) % zoneConfig.cycleDuration;
      const isShadowed = newTimeInCycle >= (zoneConfig.cycleDuration - zoneConfig.shadowDuration);

      return {
        ...ss,
        timeInCycle: newTimeInCycle,
        isShadowed
      };
    });

    state.actions.updateShadowStates(updatedShadows);
  }

  private updateResources(state: ReturnType<typeof useGameStore.getState>, delta: number) {
    const actions = state.actions;
    const rover = state.rover;

    let powerDrain = POWER_DRAIN_BASE + Math.abs(rover.speed) * POWER_DRAIN_SPEED_FACTOR + rover.cargoWeight * POWER_DRAIN_WEIGHT_FACTOR;
    if (rover.cargoAttached && rover.hasCargo && rover.cargoWeight <= 8) {
      powerDrain *= POWER_DRAIN_LIGHT_WEIGHT_BONUS;
    }
    if (!rover.cargoAttached) {
      powerDrain *= 0.7;
    }
    actions.setPower(state.power - powerDrain * delta);
    actions.setOxygen(state.oxygen - OXYGEN_DRAIN * delta);
    actions.setTimeRemaining(state.timeRemaining - delta);
    actions.setElapsedTime(state.elapsedTime + delta);
  }

  private updateRoverPhysics(state: ReturnType<typeof useGameStore.getState>, delta: number, deltaMs: number) {
    const actions = state.actions;
    const rover = { ...state.rover };
    const level = state.level!;
    const nodeMap = new Map<string, TrackNode>();
    level.trackNodes.forEach(n => nodeMap.set(n.id, n));

    let effectiveMaxSpeed = rover.maxSpeed / (1 + rover.cargoWeight * 0.028);
    if (!rover.cargoAttached) {
      effectiveMaxSpeed *= 1.5;
    }
    if (rover.cargoAttached && rover.hasCargo && rover.cargoWeight <= 8) {
      effectiveMaxSpeed *= 1.15;
    }

    let effectiveAcceleration = BASE_ACCELERATION;
    if (rover.cargoAttached && rover.hasCargo) {
      if (rover.cargoWeight <= 8) {
        effectiveAcceleration *= LIGHT_WEIGHT_ACCEL_BONUS;
      } else if (rover.cargoWeight >= 20) {
        effectiveAcceleration *= HEAVY_WEIGHT_ACCEL_PENALTY;
      } else {
        effectiveAcceleration /= (1 + rover.cargoWeight * 0.015);
      }
    }

    const weightBrakeFactor = level.weightBrakeFactor || 3;
    let effectiveBrakeDeceleration = BRAKE_DECELERATION;
    if (rover.cargoAttached && rover.hasCargo) {
      if (rover.cargoWeight <= 8) {
        effectiveBrakeDeceleration *= LIGHT_WEIGHT_BRAKE_BONUS;
      } else if (rover.cargoWeight >= 20) {
        effectiveBrakeDeceleration *= HEAVY_WEIGHT_BRAKE_PENALTY;
      } else {
        effectiveBrakeDeceleration /= (1 + rover.cargoWeight * weightBrakeFactor * 0.012);
      }
    }

    if (rover.isAccelerating && state.power > 0) {
      rover.speed = Math.min(effectiveMaxSpeed, rover.speed + effectiveAcceleration * delta);
    }
    if (rover.isBraking) {
      rover.speed = Math.max(0, rover.speed - effectiveBrakeDeceleration * delta);
    }
    if (!rover.isAccelerating) {
      const baseDecel = BASE_DECELERATION * GRAVITY_MULTIPLIER;
      const weightDecelBonus = rover.cargoAttached && rover.hasCargo && rover.cargoWeight <= 8 ? 1.2 : 1;
      rover.speed = Math.max(0, rover.speed - baseDecel * weightDecelBonus * delta);
    }

    const currentNode = nodeMap.get(rover.currentNodeId)!;
    let targetNode: TrackNode | null = null;

    if (!rover.targetNodeId) {
      if (rover.speed > 2) {
        const candidates = currentNode.connections.filter(c => c !== rover.prevNodeId);
        if (candidates.length > 0) {
          targetNode = nodeMap.get(candidates[0])!;
          rover.targetNodeId = targetNode.id;
          rover.progress = 0;
        }
      }
    } else {
      targetNode = nodeMap.get(rover.targetNodeId);
    }

    if (targetNode && rover.speed > 0.1) {
      const dx = targetNode.x - currentNode.x;
      const dy = targetNode.y - currentNode.y;
      const segLen = Math.hypot(dx, dy);
      if (segLen > 0) {
        const moveDist = rover.speed * delta;
        rover.progress += moveDist / segLen;

        if (currentNode.isJunction) {
          const distToTarget = (1 - rover.progress) * segLen;
          if (distToTarget < 80 && state.junctionChoice === null && state.pendingJunction === false) {
            actions.setPendingJunction(true);
            actions.setMessage('岔路口！按 A/← 或 D/→ 选择方向');
          }
        }

        if (rover.progress >= 1) {
          this.handleArrivalAtNode(state, actions, rover, currentNode, targetNode, nodeMap, deltaMs);
        } else {
          rover.position.x = currentNode.x + dx * rover.progress;
          rover.position.y = currentNode.y + dy * rover.progress;
          rover.angle = Math.atan2(dy, dx);

          if (currentNode.isJunction) {
            const angleChange = Math.abs(this.angleDifference(this.derailAngle, rover.angle));
            this.derailAngle = rover.angle;
            let derailChance = 0;
            if (rover.cargoAttached && rover.hasCargo) {
              if (rover.cargoWeight <= 8) {
                derailChance = 0.005 + (rover.speed - DERAIL_SPEED_THRESHOLD) * 0.0005;
                derailChance *= DERAIL_LIGHT_WEIGHT_REDUCTION;
              } else if (rover.cargoWeight >= 20) {
                derailChance = (0.03 + (rover.speed - DERAIL_SPEED_THRESHOLD) * 0.002) * DERAIL_HEAVY_WEIGHT_MULTIPLIER;
                derailChance += rover.cargoWeight * 0.004;
              } else {
                derailChance = 0.015 + (rover.speed - DERAIL_SPEED_THRESHOLD) * 0.001 + rover.cargoWeight * 0.0025;
              }
            }
            const derailSpeedThreshold = rover.cargoWeight >= 20
              ? DERAIL_SPEED_THRESHOLD - rover.cargoWeight * 3
              : DERAIL_SPEED_THRESHOLD - rover.cargoWeight * 1.5;
            if (angleChange > DERAIL_ANGLE_THRESHOLD && rover.speed > derailSpeedThreshold && derailChance > 0) {
              if (Math.random() < Math.max(0, derailChance)) {
                actions.failGame('derail');
                return;
              }
            }
          }

          const isOnWeakTrack = currentNode.trackType === 'weak' || (targetNode.trackType === 'weak');
          if (isOnWeakTrack && rover.cargoAttached && rover.cargoWeight > 0 && !state.reinforcedNodes.includes(currentNode.id)) {
            const collapseWeight = level.weakTrackCollapseWeight || 20;
            let damage = 0;
            if (rover.cargoWeight <= 8) {
              damage = rover.cargoWeight * WEAK_TRACK_DAMAGE_PER_WEIGHT * delta * 0.15;
            } else if (rover.cargoWeight >= 20) {
              damage = rover.cargoWeight * (WEAK_TRACK_DAMAGE_PER_WEIGHT + WEAK_TRACK_DAMAGE_HEAVY_EXTRA) * delta * Math.pow(rover.cargoWeight / collapseWeight, 1.5);
            } else {
              damage = rover.cargoWeight * WEAK_TRACK_DAMAGE_PER_WEIGHT * delta * (rover.cargoWeight / collapseWeight);
            }
            actions.addTrackDamage(currentNode.id, damage);

            const currentDamage = state.trackDamages.find(d => d.nodeId === currentNode.id);
            const totalDamage = (currentDamage?.damageLevel || 0) + damage;

            if (totalDamage >= TRACK_COLLAPSE_THRESHOLD) {
              actions.failGame('track_collapse');
              this.cameras.main.shake(500, 0.015);
              return;
            }

            if (rover.cargoWeight >= collapseWeight * 0.6 && Math.random() < 0.015) {
              actions.setMessage('⚠临时轨道承受压力！重矿石风险极高');
              this.startMessageTimer();
            } else if (rover.cargoWeight >= collapseWeight * 0.4 && Math.random() < 0.005) {
              actions.setMessage('临时轨道吱呀作响，注意重量！');
              this.startMessageTimer();
            }
          }
        }
      }
    }

    actions.updateRover({
      speed: rover.speed,
      targetNodeId: rover.targetNodeId,
      prevNodeId: rover.prevNodeId,
      currentNodeId: rover.currentNodeId,
      progress: rover.progress,
      position: rover.position,
      angle: rover.angle
    });
  }

  private handleArrivalAtNode(
    state: ReturnType<typeof useGameStore.getState>,
    actions: any,
    rover: any,
    currentNode: TrackNode,
    targetNode: TrackNode,
    nodeMap: Map<string, TrackNode>,
    deltaMs: number
  ) {
    rover.currentNodeId = targetNode.id;
    rover.prevNodeId = currentNode.id;
    rover.progress = 0;
    rover.position.x = targetNode.x;
    rover.position.y = targetNode.y;
    rover.targetNodeId = null;

    if (state.pendingJunction && state.junctionChoice) {
      actions.setPendingJunction(false);
      actions.setJunctionChoice(null);
      actions.setMessage(null);
    }

    this.triggerStation(state, targetNode.id);

    if (targetNode.trackType === 'weak' && !state.reinforcedNodes.includes(targetNode.id)) {
      const isLightOrEmpty = !state.rover.cargoAttached || state.rover.cargoWeight <= 8;
      if (state.rover.cargoAttached && state.rover.cargoWeight > 0 && !isLightOrEmpty) {
        const collapseWeight = state.level?.weakTrackCollapseWeight || 20;
        let damage = 0;
        if (state.rover.cargoWeight >= 20) {
          damage = state.rover.cargoWeight * (WEAK_TRACK_DAMAGE_PER_WEIGHT + WEAK_TRACK_DAMAGE_HEAVY_EXTRA) * (state.rover.cargoWeight / collapseWeight);
        } else {
          damage = state.rover.cargoWeight * WEAK_TRACK_DAMAGE_PER_WEIGHT * (state.rover.cargoWeight / collapseWeight);
        }
        actions.addTrackDamage(targetNode.id, damage);

        const currentDamage = state.trackDamages.find((d: any) => d.nodeId === targetNode.id);
        const totalDamage = (currentDamage?.damageLevel || 0) + damage;

        if (totalDamage >= TRACK_COLLAPSE_THRESHOLD) {
          actions.failGame('track_collapse');
          this.cameras.main.shake(500, 0.015);
          return;
        }
      } else if (isLightOrEmpty) {
        actions.reinforceNode(targetNode.id);
        const marker = this.weakTrackWarnings.get(targetNode.id);
        if (marker) {
          marker.clear();
          marker.fillStyle(0x22aa44, 0.4);
          marker.fillCircle(targetNode.x, targetNode.y, 20);
          marker.lineStyle(2, 0x33cc55, 0.6);
          marker.strokeCircle(targetNode.x, targetNode.y, 20);
        }
        if (state.rover.cargoAttached && state.rover.cargoWeight > 0) {
          actions.setMessage('✓轻矿石加固了临时轨道！');
        } else {
          actions.setMessage('✓空车通过加固了临时轨道！');
        }
        this.startMessageTimer();
      }
    }

    if (rover.speed > 2 && targetNode.connections.length > 0) {
      let nextCandidates = targetNode.connections.filter(c => c !== rover.prevNodeId);

      if (targetNode.isJunction && targetNode.leftConnection && targetNode.rightConnection) {
        const choice = state.junctionChoice;
        if (choice === 'left') {
          nextCandidates = [targetNode.leftConnection];
        } else if (choice === 'right') {
          nextCandidates = [targetNode.rightConnection];
        } else {
          if (nextCandidates.length > 1) {
            rover.speed = Math.max(0, rover.speed - BRAKE_DECELERATION * (deltaMs / 1000) * 2);
          }
        }
      }

      if (nextCandidates.length > 0 && !targetNode.connections.includes(rover.currentNodeId)) {
        const nextId = nextCandidates[0];
        const nextNode = nodeMap.get(nextId);
        if (nextNode) {
          rover.targetNodeId = nextId;
          const dx = nextNode.x - targetNode.x;
          const dy = nextNode.y - targetNode.y;
          rover.angle = Math.atan2(dy, dx);
        }
      }
    }
  }

  private triggerStation(state: ReturnType<typeof useGameStore.getState>, nodeId: string) {
    if (this.stationTriggerCooldown > 0) return;
    const station = state.level!.baseStations.find(s => s.nodeId === nodeId);
    if (!station) return;

    const actions = state.actions;
    const actions2 = actions as any;

    if (state.visitedStations.includes(station.id)) {
      if (station.type === 'solar') {
        const shadowState = state.shadowStates.find(ss => ss.stationId === station.id);
        const isShadowed = shadowState?.isShadowed || false;
        const baseRestore = station.powerRestore || 0;
        const actualRestore = isShadowed ? Math.floor(baseRestore * SHADOW_POWER_RESTORE_MULTIPLIER) : baseRestore;

        actions.restorePower(actualRestore);
        if (isShadowed) {
          actions.setMessage(`阴影中充电缓慢 +${actualRestore} 电量（效率降低）`);
        } else {
          actions.setMessage(`补充 ${actualRestore} 电量`);
        }
        this.stationTriggerCooldown = 1;
        this.animateStation(station.id);
        this.startMessageTimer();
      } else if (station.type === 'oxygen') {
        actions.restoreOxygen(station.oxygenRestore || 0);
        actions.setMessage(`补充 ${station.oxygenRestore} 氧气`);
        this.stationTriggerCooldown = 1;
        this.animateStation(station.id);
        this.startMessageTimer();
      }
      return;
    }

    actions.addVisitedStation(station.id);
    this.animateStation(station.id);
    this.stationTriggerCooldown = 0.5;

    switch (station.type) {
      case 'mine': {
        if (!state.rover.cargoAttached) {
          actions.setMessage('需要先挂载货箱才能装载矿石');
          this.startMessageTimer();
          return;
        }
        const val = station.oreValue || 0;
        const w = station.oreWeight || 0;
        const oreType = station.oreType || 'medium';
        const oreInfo = ORE_TYPE_INFO[oreType];
        const currentVal = state.rover.cargoValue;
        const currentW = state.rover.cargoWeight;
        actions2.setCargo(currentVal + val, currentW + w);

        let weightWarning = '';
        if (oreType === 'heavy') {
          weightWarning = ' ⚠重矿石：刹车距离变长，弱轨道有风险！';
        } else if (oreType === 'light') {
          weightWarning = ' 轻便快速！';
        }
        actions.setMessage(`${oreInfo.icon}装载${oreInfo.label} +${val}价值 +${w}重量${weightWarning}`);
        this.cameras.main.shake(150, 0.004);
        break;
      }
      case 'smelter': {
        const mult = station.valueMultiplier || 1.5;
        if (state.rover.cargoValue > 0) {
          actions2.multiplyCargoValue(mult);
          actions.setMessage(`熔炼成功！矿石价值 ×${mult}`);
          this.cameras.main.flash(200, 255, 107, 53, false);
        } else {
          actions.setMessage('熔炼站需要先装载矿石');
        }
        break;
      }
      case 'oxygen': {
        actions.restoreOxygen(station.oxygenRestore || 0);
        actions.setMessage(`补充 ${station.oxygenRestore} 氧气`);
        break;
      }
      case 'solar': {
        const shadowState = state.shadowStates.find(ss => ss.stationId === station.id);
        const isShadowed = shadowState?.isShadowed || false;
        const baseRestore = station.powerRestore || 0;
        const actualRestore = isShadowed ? Math.floor(baseRestore * SHADOW_POWER_RESTORE_MULTIPLIER) : baseRestore;

        actions.restorePower(actualRestore);
        if (isShadowed) {
          actions.setMessage(`⚠阴影中！充电效率降低 +${actualRestore} 电量`);
        } else {
          actions.setMessage(`补充 ${actualRestore} 电量`);
        }
        break;
      }
      case 'return': {
        if (state.rover.cargoValue >= (station.requiredValue || 0)) {
          actions.winGame();
          actions.setMessage('成功返回！任务完成');
          this.cameras.main.flash(500, 255, 255, 255, false);
        } else {
          actions.failGame('value');
          this.cameras.main.shake(200, 0.006);
        }
        break;
      }
    }
    this.startMessageTimer();
  }

  private animateStation(stationId: string) {
    const sprite = this.stationSprites.get(stationId);
    if (!sprite) return;
    this.tweens.add({
      targets: sprite,
      scaleX: { from: 1, to: 1.25 },
      scaleY: { from: 1, to: 1.25 },
      duration: 250,
      yoyo: true,
      ease: 'Back.easeOut'
    });
  }

  private updateMeteors(state: ReturnType<typeof useGameStore.getState>, delta: number) {
    const actions = state.actions;
    const actions2 = actions as any;
    const level = state.level!;
    const elapsed = state.elapsedTime;

    level.meteorSchedule.forEach((m, idx) => {
      if (this.processedMeteorIndices.has(idx)) return;
      if (elapsed >= m.time - m.warningTime && elapsed < m.time) {
        const id = `meteor-${idx}`;
        if (!state.activeMeteors.find(am => am.id === id)) {
          const meteor: MeteorState = {
            id,
            x: m.x,
            y: m.y,
            radius: m.radius,
            timeToImpact: m.time - elapsed,
            warningTime: m.warningTime,
            impacted: false
          };
          actions2.addMeteor(meteor);
          this.showMeteorWarning(meteor);
        }
      }
      if (elapsed >= m.time) {
        this.processedMeteorIndices.add(idx);
      }
    });

    const updatedMeteors: MeteorState[] = [];
    state.activeMeteors.forEach(meteor => {
      const newTti = meteor.timeToImpact - delta;
      if (newTti <= 0 && !meteor.impacted) {
        this.impactMeteor(meteor);
        meteor.impacted = true;
      }
      if (newTti > -1) {
        updatedMeteors.push({ ...meteor, timeToImpact: newTti });
      } else {
        this.removeMeteorVisuals(meteor.id);
      }
    });
    actions2.updateMeteors(updatedMeteors);
  }

  private showMeteorWarning(meteor: MeteorState) {
    const warning = this.add.circle(meteor.x, meteor.y, meteor.radius, 0xff4757, 0.25);
    warning.setStrokeStyle(3, 0xff4757, 0.9);
    this.meteorWarnings.set(meteor.id, warning);

    this.tweens.add({
      targets: warning,
      alpha: { from: 0.9, to: 0.2 },
      scale: { from: 0.8, to: 1.1 },
      duration: 300,
      yoyo: true,
      repeat: -1
    });
  }

  private impactMeteor(meteor: MeteorState) {
    const warning = this.meteorWarnings.get(meteor.id);
    if (warning) {
      this.tweens.killTweensOf(warning);
      warning.destroy();
      this.meteorWarnings.delete(meteor.id);
    }

    const crater = this.add.graphics();
    crater.fillStyle(0x3a1a1a, 0.8);
    crater.fillCircle(meteor.x, meteor.y, meteor.radius);
    crater.fillStyle(0x1a0a0a, 0.7);
    crater.fillCircle(meteor.x, meteor.y, meteor.radius * 0.75);
    crater.lineStyle(2, 0x663333, 0.6);
    crater.strokeCircle(meteor.x, meteor.y, meteor.radius);

    const rock = this.add.graphics();
    rock.fillStyle(0x5a4040, 1);
    rock.fillCircle(meteor.x, meteor.y, meteor.radius * 0.4);
    rock.fillStyle(0x7a5a5a, 0.6);
    rock.fillCircle(meteor.x - meteor.radius * 0.15, meteor.y - meteor.radius * 0.15, meteor.radius * 0.15);

    this.meteorObjects.set(meteor.id, rock);
    this.cameras.main.shake(350, 0.008);

    this.time.delayedCall(50, () => {
      const state = useGameStore.getState();
      if (state.status !== 'playing') return;
      const pos = state.rover.position;
      const dist = Math.hypot(pos.x - meteor.x, pos.y - meteor.y);
      if (dist < meteor.radius + 20) {
        state.actions.failGame('collision');
      }
    });
  }

  private removeMeteorVisuals(id: string) {
    const warning = this.meteorWarnings.get(id);
    if (warning) {
      this.tweens.killTweensOf(warning);
      warning.destroy();
      this.meteorWarnings.delete(id);
    }
    const obj = this.meteorObjects.get(id);
    if (obj) {
      this.meteorObjects.delete(id);
    }
  }

  private checkCollisions(state: ReturnType<typeof useGameStore.getState>) {
    if (state.status !== 'playing') return;
    const level = state.level!;
    const pos = state.rover.position;
    for (const obs of level.obstacles) {
      const dist = Math.hypot(pos.x - obs.x, pos.y - obs.y);
      if (dist < obs.radius + 15) {
        if (state.rover.speed > 50) {
          state.actions.failGame('collision');
          return;
        }
      }
    }
  }

  private updateWeakTrackVisuals(state: ReturnType<typeof useGameStore.getState>) {
    state.trackDamages.forEach(damage => {
      const marker = this.weakTrackWarnings.get(damage.nodeId);
      if (!marker) return;

      const node = state.level?.trackNodes.find(n => n.id === damage.nodeId);
      if (!node) return;

      if (state.reinforcedNodes.includes(damage.nodeId)) return;

      marker.clear();
      const r = damage.damageLevel;
      const red = Math.floor(255 * Math.min(1, r * 2));
      const green = Math.floor(153 * (1 - r));
      const color = (red << 16) | (green << 8);
      marker.fillStyle(color, 0.3 + r * 0.4);
      marker.fillCircle(node.x, node.y, 20 + r * 10);
      marker.lineStyle(2, color, 0.5 + r * 0.5);
      marker.strokeCircle(node.x, node.y, 20 + r * 10);
    });
  }

  private updateShadowVisuals(state: ReturnType<typeof useGameStore.getState>) {
    if (!state.level?.shadowZones) return;

    state.shadowStates.forEach(ss => {
      const overlay = this.shadowOverlays.get(ss.id);
      if (!overlay) return;

      const zoneConfig = state.level!.shadowZones!.find(z => z.id === ss.id);
      if (!zoneConfig) return;

      const progressBars = this.shadowProgressBars.get(ss.id);

      if (ss.isShadowed) {
        overlay.setAlpha(0.8);
        if (progressBars) {
          const timeLeft = Math.max(0, zoneConfig.cycleDuration - ss.timeInCycle);
          const progress = Math.min(1, timeLeft / zoneConfig.shadowDuration);
          progressBars.fill.clear();
          progressBars.fill.fillStyle(0x818cf8, 1);
          progressBars.fill.fillRoundedRect(-34, 49, 68 * progress, 6, 2);
          progressBars.label.setText('🌙 阴影中');
          progressBars.label.setColor('#a5b4fc');
          progressBars.timer.setText(`${timeLeft.toFixed(0)}s 后云散`);
          progressBars.timer.setColor('#c7d2fe');
          if (timeLeft < 3) {
            progressBars.label.setColor('#6ee7b7');
            progressBars.timer.setColor('#6ee7b7');
          }
        }
      } else {
        const timeToShadow = zoneConfig.cycleDuration - zoneConfig.shadowDuration - ss.timeInCycle;
        const approaching = timeToShadow < 5 && timeToShadow > 0;
        overlay.setAlpha(approaching ? 0.3 * (1 - timeToShadow / 5) : 0);
        if (progressBars) {
          const sunnyProgress = Math.min(1, ss.timeInCycle / (zoneConfig.cycleDuration - zoneConfig.shadowDuration));
          progressBars.fill.clear();
          progressBars.fill.fillStyle(0x22d3ee, 1);
          progressBars.fill.fillRoundedRect(-34, 49, 68 * sunnyProgress, 6, 2);
          if (approaching) {
            progressBars.label.setText('⚠ 阴影临近');
            progressBars.label.setColor(timeToShadow < 2 ? '#f472b6' : '#a78bfa');
            progressBars.timer.setText(`${timeToShadow.toFixed(0)}s 后遮蔽`);
            progressBars.timer.setColor(timeToShadow < 2 ? '#f472b6' : '#c4b5fd');
          } else {
            progressBars.label.setText('☀ 光照中');
            progressBars.label.setColor('#22d3ee');
            progressBars.timer.setText(`${timeToShadow.toFixed(0)}s 后有云`);
            progressBars.timer.setColor('#67e8f9');
          }
        }
      }
    });
  }

  private updateVisuals(state: ReturnType<typeof useGameStore.getState>) {
    const rover = state.rover;

    this.roverSprite.x = rover.position.x;
    this.roverSprite.y = rover.position.y;
    this.roverSprite.rotation = rover.angle;

    const powerRatio = state.power / state.maxPower;
    const oxygenRatio = state.oxygen / state.maxOxygen;
    let ledColor = 0x6bcb77;
    if (powerRatio < 0.1 || oxygenRatio < 0.1 || state.timeRemaining < 10) {
      ledColor = 0xff4757;
    } else if (powerRatio < 0.25 || oxygenRatio < 0.25 || state.timeRemaining < 25) {
      ledColor = 0xffd93d;
    } else if (rover.cargoWeight >= 20 && rover.cargoAttached) {
      ledColor = 0xff8c00;
    }
    this.ledLight.fillColor = ledColor;

    this.drawCargoSprite();

    if (Math.abs(rover.speed) > 10 && rover.targetNodeId) {
      this.dustParticles.emitParticleAt(this.roverSprite.x - Math.cos(rover.angle) * 20, this.roverSprite.y - Math.sin(rover.angle) * 20 + 6);
    }

    this.tweens.add({
      targets: this.roverSprite,
      y: rover.position.y + Math.sin(this.time.now * 0.005 + rover.position.x * 0.01) * (rover.speed > 10 ? 1.2 : 0.3),
      duration: 50,
      override: false
    });
  }

  private angleDifference(a: number, b: number): number {
    let diff = Math.abs(a - b) % (Math.PI * 2);
    if (diff > Math.PI) diff = Math.PI * 2 - diff;
    return diff;
  }

  private handleShutdown() {
    this.processedMeteorIndices.clear();
    this.meteorWarnings.forEach(w => w.destroy());
    this.meteorWarnings.clear();
    this.meteorObjects.clear();
    this.stationSprites.clear();
    this.shadowOverlays.forEach(o => o.destroy());
    this.shadowOverlays.clear();
    this.shadowProgressBars.forEach(pb => {
      pb.bg.destroy();
      pb.fill.destroy();
      pb.label.destroy();
      pb.timer.destroy();
    });
    this.shadowProgressBars.clear();
    this.weakTrackWarnings.forEach(w => w.destroy());
    this.weakTrackWarnings.clear();
    this.trackGlows = [];
    if (this.messageTimer) {
      this.time.removeEvent(this.messageTimer);
      this.messageTimer = null;
    }
  }
}
