import { Zap, Wind, Clock, Coins, Package, AlertTriangle } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

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

export default function StatusBar() {
  const { power, maxPower, oxygen, maxOxygen, timeRemaining, totalTime, rover } = useGameStore();

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

        <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-900/30 border border-amber-700/50">
          <Package className="w-5 h-5 text-amber-400" />
          <div className="flex flex-col">
            <span className="text-[10px] text-amber-300/80 font-semibold uppercase tracking-wider">货箱重量</span>
            <span className="text-base font-bold font-mono text-amber-400 tabular-nums">{rover.cargoWeight}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
