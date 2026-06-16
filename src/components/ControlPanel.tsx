import { ChevronUp, ChevronDown, ArrowLeftCircle, ArrowRightCircle, Zap, Package, Play } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';

interface ControlButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  shortcut: string;
  onDown: () => void;
  onUp?: () => void;
  active?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'accent';
  description?: string;
}

function ControlButton({
  icon: Icon,
  label,
  shortcut,
  onDown,
  onUp,
  active,
  disabled,
  variant = 'secondary',
  description
}: ControlButtonProps) {
  const variants = {
    primary: {
      bg: 'bg-gradient-to-b from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600',
      border: 'border-orange-400/50',
      glow: 'shadow-orange-500/30'
    },
    secondary: {
      bg: 'bg-gradient-to-b from-[#2a2a4a] to-[#1e1e36] hover:from-[#353558] hover:to-[#252548]',
      border: 'border-[#4a4a6a]',
      glow: 'shadow-blue-500/10'
    },
    accent: {
      bg: 'bg-gradient-to-b from-cyan-700 to-cyan-800 hover:from-cyan-600 hover:to-cyan-700',
      border: 'border-cyan-400/50',
      glow: 'shadow-cyan-500/30'
    }
  };

  const style = variants[variant];

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onMouseDown={(e) => { e.preventDefault(); if (!disabled) onDown(); }}
        onMouseUp={() => { if (!disabled && onUp) onUp(); }}
        onMouseLeave={() => { if (!disabled && onUp) onUp(); }}
        onTouchStart={(e) => { e.preventDefault(); if (!disabled) onDown(); }}
        onTouchEnd={() => { if (!disabled && onUp) onUp(); }}
        disabled={disabled}
        className={`
          relative w-14 h-14 md:w-16 md:h-16 rounded-xl
          ${style.bg} ${style.border} border-2
          flex items-center justify-center
          transition-all duration-75
          shadow-lg ${style.glow}
          active:scale-95 active:translate-y-0.5
          disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100
          ${active ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-[#15152a]' : ''}
          group
        `}
      >
        <Icon className={`w-6 h-6 md:w-7 md:h-7 text-white transition-transform ${active ? 'scale-110' : ''}`} />
        {active && (
          <div className="absolute inset-0 rounded-xl bg-white/10 animate-pulse" />
        )}
      </button>
      <span className="text-[10px] md:text-xs text-gray-400 font-medium whitespace-nowrap">{label}</span>
      <div className="flex items-center gap-0.5">
        {shortcut.split('').map((k, i) => (
          <kbd
            key={i}
            className="px-1.5 py-0.5 text-[9px] md:text-[10px] font-mono font-bold bg-black/60 text-gray-300 rounded border border-gray-600"
          >
            {k}
          </kbd>
        ))}
      </div>
      {description && (
        <span className="text-[9px] text-gray-500 mt-0.5 max-w-[70px] text-center leading-tight">{description}</span>
      )}
    </div>
  );
}

export default function ControlPanel() {
  const { status, pendingJunction, junctionChoice, rover, level, actions } = useGameStore();
  const isPlaying = status === 'playing';

  const handleStart = useCallback(() => {
    if (status === 'menu' || status === 'success' || status === 'failed') {
      actions.startGame();
    }
  }, [status, actions]);

  const [accel, setAccel] = useState(false);
  const [brake, setBrake] = useState(false);

  useEffect(() => {
    setAccel(rover.isAccelerating);
  }, [rover.isAccelerating]);

  useEffect(() => {
    setBrake(rover.isBraking);
  }, [rover.isBraking]);

  const handleJunction = (choice: 'left' | 'right') => {
    if (pendingJunction) {
      actions.setJunctionChoice(choice);
    }
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
      {pendingJunction && (
        <div className="absolute bottom-36 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="flex items-center gap-4 bg-orange-900/90 backdrop-blur-md rounded-2xl px-6 py-3 border-2 border-orange-400 shadow-2xl animate-bounce">
            <span className="text-orange-200 font-bold text-lg">⚠ 岔路口！选择方向</span>
          </div>
        </div>
      )}

      <div className="pointer-events-auto w-full flex justify-center pb-4 px-4">
        <div className="bg-[#15152a]/90 backdrop-blur-md rounded-2xl p-4 border-2 border-[#3a3a55] shadow-2xl">
          {!isPlaying && (status === 'menu' || status === 'success' || status === 'failed') ? (
            <button
              onClick={handleStart}
              className="flex items-center gap-3 px-8 py-4 rounded-xl
                bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500
                border-2 border-green-400/60 shadow-lg shadow-green-500/30
                text-white font-bold text-xl
                transition-all active:scale-95"
            >
              <Play className="w-6 h-6 fill-white" />
              {status === 'menu' ? '开始任务' : status === 'success' ? '再次挑战' : '重新开始'}
            </button>
          ) : (
            <div className="flex items-end gap-3 md:gap-4">
              <ControlButton
                icon={ArrowLeftCircle}
                label="左岔路"
                shortcut="A/←"
                onDown={() => handleJunction('left')}
                active={junctionChoice === 'left'}
                disabled={!pendingJunction}
                variant="secondary"
                description="岔路口使用"
              />

              <div className="flex flex-col items-center gap-2">
                <ControlButton
                  icon={ChevronUp}
                  label="加速"
                  shortcut="W/↑"
                  onDown={() => actions.setAccelerating(true)}
                  onUp={() => actions.setAccelerating(false)}
                  active={accel}
                  disabled={!isPlaying}
                  variant="primary"
                />
                <ControlButton
                  icon={ChevronDown}
                  label="刹车"
                  shortcut="S/↓"
                  onDown={() => actions.setBraking(true)}
                  onUp={() => actions.setBraking(false)}
                  active={brake}
                  disabled={!isPlaying}
                  variant="secondary"
                />
              </div>

              <ControlButton
                icon={ArrowRightCircle}
                label="右岔路"
                shortcut="D/→"
                onDown={() => handleJunction('right')}
                active={junctionChoice === 'right'}
                disabled={!pendingJunction}
                variant="secondary"
                description="岔路口使用"
              />

              <div className="w-px h-24 bg-[#3a3a55] mx-1" />

              <ControlButton
                icon={Zap}
                label="跃迁"
                shortcut="SPACE"
                onDown={() => actions.requestJump()}
                variant="accent"
                description="短距离瞬移"
              />

              <ControlButton
                icon={Package}
                label={rover.cargoAttached ? '卸货箱' : '带货箱'}
                shortcut="E"
                onDown={() => actions.requestCargoToggle()}
                variant="secondary"
                active={rover.cargoAttached}
                description={rover.cargoAttached ? '卸下货箱提速' : '挂货箱装矿'}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
