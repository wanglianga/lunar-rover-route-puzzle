import { Zap, Wind, Clock, Coins, Package, AlertTriangle, Sun, Moon, Timer } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import type { ShadowState, ShadowZone, LevelConfig } from '../types/game';

function StatusBarItem({
  icon: Icon,
  label,
  value,
  max,
  color,
  warningThreshold = 0.25,
  criticalThreshold = 0.1,
  unit = ''
}: {
  icon: React.ComponentType<{ className?: string; color?: string }>;
  label: string;
  value: number;
  max: number;
  color: string;
  warningThreshold?: number;
  criticalThreshold?: number;
  unit?: string;
}) {
  const ratio = Math.max(0, Math.min(1, value / max));
  let status = 'normal';
  if (ratio <= criticalThreshold) status = 'critical';
  else if (ratio <= warningThreshold) status = 'warning';

  const statusColors: Record<string, string> = {
    normal: color,
    warning: '#ffd93d',
    critical: '#ff4757'
  };

  const bgColors: Record<string, string> = {
    normal: 'bg-gray-800/50',
    warning: 'bg-yellow-900/30',
    critical: 'bg-red-900/40'
  };

  return (
    <div className={`flex flex-col gap-1 rounded-lg px-3 py-2 ${bgColors[status]} transition-colors`}>
      <div className="flex items-center gap-2 text-xs font-bold">
        <Icon
          className="w-4 h-4"
          color={statusColors[status]}
        />
        <span className="text-gray-300">{label}</span>
        {status !== 'normal' && (
          <AlertTriangle
            className={`w-3 h-3 animate-pulse ${status === 'critical' ? 'text-red-500' : 'text-yellow-500'}`}
          />
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-3 bg-black/60 rounded-full overflow-hidden border border-gray-700">
          <div
            className={`h-full rounded-full transition-all duration-200 ${status === 'critical' ? 'animate-pulse' : ''}`}
            style={{
              width: `${ratio * 100}%`,
              backgroundColor: statusColors[status],
              boxShadow: `0 0 8px ${statusColors[status]}80`
            }}
          />
        </div>
        <span
          className="text-xs font-mono font-bold min-w-[50px] text-right tabular-nums"
          style={{ color: statusColors[status] }}
        >
          {Math.ceil(value)}{unit}
        </span>
      </div>
    </div>
  );
}

interface ShadowTimerInfo {
  shadowState: ShadowState;
  zone: ShadowZone;
  stationName: string;
  isShadowed: boolean;
  timeRemaining: number;
  cycleProgress: number;
  status: 'sunny' | 'approaching' | 'shadowed' | 'clearing';
}

function getShadowTimerInfo(ss: ShadowState, level: LevelConfig | null): ShadowTimerInfo | null {
  if (!level) return null;
  const zone = level.shadowZones?.find((z: ShadowZone) => z.id === ss.id);
  if (!zone) return null;
  const station = level.baseStations.find(s => s.id === ss.stationId);
  if (!station) return null;

  const shadowStartTime = zone.cycleDuration - zone.shadowDuration;
  const isShadowed = ss.isShadowed;

  let timeRemaining: number;
  let status: ShadowTimerInfo['status'];

  if (isShadowed) {
    timeRemaining = zone.cycleDuration - ss.timeInCycle;
    status = timeRemaining < 3 ? 'clearing' : 'shadowed';
  } else {
    timeRemaining = shadowStartTime - ss.timeInCycle;
    status = timeRemaining < 5 ? 'approaching' : 'sunny';
  }

  const cycleProgress = (ss.timeInCycle / zone.cycleDuration) * 100;

  return {
    shadowState: ss,
    zone,
    stationName: station.name,
    isShadowed,
    timeRemaining: Math.max(0, timeRemaining),
    cycleProgress,
    status
  };
}

export default function StatusBar() {
  const { power, maxPower, oxygen, maxOxygen, timeRemaining, totalTime, rover, shadowStates, trackDamages, reinforcedNodes, level } = useGameStore();

  const shadowTimers = shadowStates
    .map(ss => getShadowTimerInfo(ss, level))
    .filter((s): s is ShadowTimerInfo => s !== null);

  const weightRiskLevel = rover.cargoWeight >= 20 ? 'high' : rover.cargoWeight >= 12 ? 'medium' : 'low';
  const damagedWeakTracks = trackDamages.filter(d => d.damageLevel > 0.3 && !reinforcedNodes.includes(d.nodeId));

  return (
    <div className="absolute top-4 left-4 right-4 flex flex-wrap gap-3 z-20 pointer-events-none">
      <div className="flex flex-wrap gap-3 bg-[#15152a]/85 backdrop-blur-md rounded-xl p-3 border border-[#3a3a55] shadow-xl">
        <div className="w-60">
          <StatusBarItem
            icon={Zap}
            label="电量"
            value={power}
            max={maxPower}
            color="#4ecdc4"
            unit=""
          />
        </div>
        <div className="w-60">
          <StatusBarItem
            icon={Wind}
            label="氧气"
            value={oxygen}
            max={maxOxygen}
            color="#6bcb77"
            unit=""
          />
        </div>
        <div className="w-60">
          <StatusBarItem
            icon={Clock}
            label="返回窗口"
            value={timeRemaining}
            max={totalTime}
            color="#ff6b35"
            warningThreshold={30 / 120}
            criticalThreshold={10 / 120}
            unit="s"
          />
        </div>
      </div>

      <div className="flex-1" />

      <div className="flex gap-3 bg-[#15152a]/85 backdrop-blur-md rounded-xl p-3 border border-[#3a3a55] shadow-xl">
        <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-yellow-900/30 border border-yellow-700/50">
          <Coins className="w-5 h-5 text-yellow-400" />
          <div className="flex flex-col">
            <span className="text-[10px] text-yellow-300/80 font-semibold uppercase tracking-wider">矿石价值</span>
            <span className="text-base font-bold font-mono text-yellow-400 tabular-nums">{rover.cargoValue}</span>
          </div>
        </div>

        <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border ${
          weightRiskLevel === 'high' 
            ? 'bg-red-900/40 border-red-700/60' 
            : weightRiskLevel === 'medium' 
              ? 'bg-amber-900/30 border-amber-700/50'
              : 'bg-amber-900/30 border-amber-700/50'
        }`}>
          <Package className={`w-5 h-5 ${
            weightRiskLevel === 'high' ? 'text-red-400' : weightRiskLevel === 'medium' ? 'text-amber-400' : 'text-amber-400'
          }`} />
          <div className="flex flex-col">
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${
              weightRiskLevel === 'high' ? 'text-red-300/80' : 'text-amber-300/80'
            }`}>
              货箱重量
              {weightRiskLevel === 'high' && ' ⚠'}
            </span>
            <span className={`text-base font-bold font-mono tabular-nums ${
              weightRiskLevel === 'high' ? 'text-red-400' : weightRiskLevel === 'medium' ? 'text-amber-400' : 'text-amber-400'
            }`}>{rover.cargoWeight}</span>
          </div>
        </div>

        {shadowTimers.map((info, idx) => {
          const statusColors = {
            sunny: { bg: 'bg-cyan-900/30', border: 'border-cyan-600/50', text: 'text-cyan-300', icon: 'text-cyan-400' },
            approaching: { bg: 'bg-purple-900/50', border: 'border-purple-500/60', text: 'text-purple-300', icon: 'text-purple-400' },
            shadowed: { bg: 'bg-indigo-900/50', border: 'border-indigo-500/60', text: 'text-indigo-300', icon: 'text-indigo-400' },
            clearing: { bg: 'bg-emerald-900/40', border: 'border-emerald-500/60', text: 'text-emerald-300', icon: 'text-emerald-400' }
          };
          const colors = statusColors[info.status];
          return (
            <div
              key={idx}
              className={`flex items-center gap-2 px-3 py-1 rounded-lg border ${colors.bg} ${colors.border} ${info.status === 'approaching' || info.status === 'clearing' ? 'animate-pulse' : ''}`}
            >
              {info.isShadowed ? (
                <Moon className={`w-5 h-5 ${colors.icon}`} />
              ) : (
                <Sun className={`w-5 h-5 ${colors.icon}`} />
              )}
              <div className="flex flex-col">
                <span className={`text-[10px] ${colors.text}/80 font-semibold uppercase tracking-wider`}>
                  {info.stationName}
                </span>
                <div className="flex items-center gap-1">
                  <Timer className={`w-3 h-3 ${colors.icon}`} />
                  <span className={`text-xs font-mono font-bold tabular-nums ${colors.text}`}>
                    {info.status === 'sunny' && `光照中 ${info.timeRemaining.toFixed(0)}s`}
                    {info.status === 'approaching' && `阴影 ${info.timeRemaining.toFixed(0)}s`}
                    {info.status === 'shadowed' && `阴影中 ${info.timeRemaining.toFixed(0)}s`}
                    {info.status === 'clearing' && `云散 ${info.timeRemaining.toFixed(0)}s`}
                  </span>
                </div>
                <div className="w-16 h-1 bg-black/50 rounded-full overflow-hidden mt-0.5">
                  <div
                    className="h-full rounded-full transition-all duration-200"
                    style={{
                      width: `${info.isShadowed
                        ? Math.max(0, Math.min(100, ((info.zone.cycleDuration - info.shadowState.timeInCycle) / info.zone.shadowDuration) * 100))
                        : Math.max(0, Math.min(100, (info.shadowState.timeInCycle / (info.zone.cycleDuration - info.zone.shadowDuration)) * 100))
                      }%`,
                      backgroundColor: info.isShadowed ? '#818cf8' : '#22d3ee',
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}

        {damagedWeakTracks.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-orange-900/40 border border-orange-600/50">
            <AlertTriangle className="w-5 h-5 text-orange-400 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-[10px] text-orange-300/80 font-semibold uppercase tracking-wider">轨道受损</span>
              <span className="text-xs text-orange-300 font-bold">{damagedWeakTracks.length}处</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
