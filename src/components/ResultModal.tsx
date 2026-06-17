import { Star, RotateCcw, Home, ChevronRight, Trophy, XCircle, Lightbulb } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { FAIL_REASON_MESSAGES, BASE_TYPE_INFO } from '../types/game';
import { LEVELS } from '../game/config/levels';

interface ResultModalProps {
  onBackToMenu: () => void;
  onNextLevel?: () => void;
}

export default function ResultModal({ onBackToMenu, onNextLevel }: ResultModalProps) {
  const {
    status,
    failReason,
    score,
    starRating,
    scoreBreakdown,
    currentLevel,
    rover,
    level,
    timeRemaining,
    power,
    oxygen,
    actions
  } = useGameStore();

  if (status !== 'success' && status !== 'failed') return null;

  const isSuccess = status === 'success';
  const nextLevel = LEVELS.find(l => l.id === currentLevel + 1);
  const bestScore = useGameStore.getState().playerProgress.bestScores[currentLevel];

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
      <div className={`
        relative w-full max-w-lg mx-4 rounded-3xl overflow-hidden
        border-4 shadow-2xl
        ${isSuccess
          ? 'bg-gradient-to-br from-[#1a2e1a] via-[#15252a] to-[#1a1a2e] border-emerald-500/60 shadow-emerald-500/20'
          : 'bg-gradient-to-br from-[#2e1a1a] via-[#2a1515] to-[#1a1a2e] border-red-500/60 shadow-red-500/20'
        }
      `}>
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl ${isSuccess ? 'bg-emerald-500' : 'bg-red-500'}`} />
        </div>

        <div className="relative p-6 md:p-8">
          <div className="flex flex-col items-center mb-6">
            <div className={`
              w-20 h-20 rounded-full flex items-center justify-center mb-4
              border-4 shadow-xl
              ${isSuccess
                ? 'bg-gradient-to-br from-yellow-400 to-orange-500 border-yellow-300 shadow-yellow-500/40'
                : 'bg-gradient-to-br from-red-500 to-rose-700 border-red-400 shadow-red-500/40'
              }
            `}>
              {isSuccess ? (
                <Trophy className="w-10 h-10 text-white drop-shadow-lg" />
              ) : (
                <XCircle className="w-10 h-10 text-white drop-shadow-lg" />
              )}
            </div>

            <h2 className={`text-3xl md:text-4xl font-black mb-1 tracking-wider ${isSuccess ? 'text-emerald-300' : 'text-red-300'}`}>
              {isSuccess ? '任务成功！' : '任务失败'}
            </h2>

            <p className="text-gray-400 text-sm font-medium">
              {level?.name} · 关卡 {currentLevel}
            </p>
          </div>

          {isSuccess ? (
            <div className="space-y-6">
              <div className="flex justify-center items-center gap-3 py-2">
                {[1, 2, 3].map(i => (
                  <Star
                    key={i}
                    className={`w-12 h-12 transition-all duration-500 ${
                      i <= starRating
                        ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.5)] scale-100'
                        : 'text-gray-600 fill-gray-700/30 scale-90'
                    }`}
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>

              <div className="bg-black/40 rounded-2xl p-5 border border-white/10 space-y-3">
                <h3 className="text-sm text-gray-400 font-semibold uppercase tracking-widest mb-3">得分明细</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">矿石基础价值</span>
                    <span className="font-mono font-bold text-yellow-400">+{scoreBreakdown?.oreValue || rover.cargoValue}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">剩余电量奖励</span>
                    <span className="font-mono font-bold text-cyan-400">+{scoreBreakdown?.remainingPowerBonus || Math.floor(power * 10)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">剩余时间奖励</span>
                    <span className="font-mono font-bold text-orange-400">+{scoreBreakdown?.remainingTimeBonus || Math.floor(timeRemaining * 15)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">剩余氧气奖励</span>
                    <span className="font-mono font-bold text-emerald-400">+{scoreBreakdown?.remainingOxygenBonus || Math.floor(oxygen * 5)}</span>
                  </div>
                </div>
                <div className="h-px bg-white/10 my-3" />
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-white">最终得分</span>
                  <span className="text-3xl font-black font-mono text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                    {scoreBreakdown?.total || score}
                  </span>
                </div>
              </div>

              {bestScore && (
                <div className="text-center text-sm text-gray-400">
                  历史最佳: <span className="font-bold text-yellow-300">{bestScore.score}</span>
                  <span className="ml-2">
                    {[1, 2, 3].map(i => (
                      <Star
                        key={i}
                        className={`inline w-4 h-4 ${i <= bestScore.stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`}
                      />
                    ))}
                  </span>
                </div>
              )}

              {level && (
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  {level.threeStarScore.map((s, i) => (
                    <div key={i} className="bg-white/5 rounded-lg px-2 py-2 border border-white/5">
                      <div className="flex justify-center mb-1">
                        {[1, 2, 3].map(j => (
                          <Star
                            key={j}
                            className={`w-3 h-3 ${j <= i + 1 ? 'text-yellow-500/60 fill-yellow-500/60' : 'text-gray-700'}`}
                          />
                        ))}
                      </div>
                      <div className="font-mono font-bold text-gray-400">{s}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              {failReason && (
                <div className="bg-red-950/50 rounded-2xl p-5 border-2 border-red-500/30">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">
                        {failReason === 'power' && '🔋'}
                        {failReason === 'oxygen' && '💨'}
                        {failReason === 'derail' && '📦'}
                        {failReason === 'collision' && '💥'}
                        {failReason === 'window' && '⏰'}
                        {failReason === 'value' && '⛏'}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-red-300 mb-1">
                        {FAIL_REASON_MESSAGES[failReason].title}
                      </h3>
                      <p className="text-red-200/80 text-sm leading-relaxed">
                        {FAIL_REASON_MESSAGES[failReason].description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 pt-3 border-t border-red-500/20">
                    <Lightbulb className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <p className="text-yellow-200/80 text-sm leading-relaxed">
                      {FAIL_REASON_MESSAGES[failReason].suggestion}
                    </p>
                  </div>
                </div>
              )}

              {failReason === 'value' && level ? (
                <div className="bg-gradient-to-br from-red-950/60 to-yellow-950/40 rounded-2xl p-5 border-2 border-yellow-600/40 space-y-4">
                  <h4 className="text-sm text-yellow-300 font-black uppercase tracking-widest flex items-center gap-2">
                    <span>⛏</span> 矿石价值明细
                  </h4>
                  {(() => {
                    const targetValue = level.baseStations.find(b => b.type === 'return')?.requiredValue || 0;
                    const currentValue = rover.cargoValue;
                    const diff = Math.max(0, targetValue - currentValue);
                    const progress = Math.min(100, (currentValue / targetValue) * 100);
                    return (
                      <>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400 text-xs">完成进度</span>
                            <span className="font-mono font-bold text-yellow-300 text-sm">{Math.floor(progress)}%</span>
                          </div>
                          <div className="h-4 bg-black/60 rounded-full overflow-hidden border border-yellow-700/50">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${progress}%`,
                                background: progress >= 100
                                  ? 'linear-gradient(90deg, #10b981, #34d399)'
                                  : 'linear-gradient(90deg, #f59e0b, #ef4444)'
                              }}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div className="bg-black/30 rounded-xl p-3 border border-yellow-600/20">
                            <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">当前价值</div>
                            <div className="font-mono font-black text-xl text-yellow-400">{currentValue}</div>
                          </div>
                          <div className="bg-black/30 rounded-xl p-3 border border-red-600/30">
                            <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">还需差额</div>
                            <div className="font-mono font-black text-xl text-red-400">+{diff}</div>
                          </div>
                          <div className="bg-black/30 rounded-xl p-3 border border-emerald-600/20">
                            <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">目标价值</div>
                            <div className="font-mono font-black text-xl text-emerald-400">{targetValue}</div>
                          </div>
                        </div>
                        <div className="pt-3 border-t border-yellow-600/20 space-y-2">
                          <div className="flex items-start gap-2 text-xs">
                            <span className="text-yellow-500 flex-shrink-0 mt-0.5">💡</span>
                            <p className="text-yellow-200/80 leading-relaxed">
                              建议：访问更多采矿点收集矿石，或经过熔炼站提升矿石价值倍率。
                            </p>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              ) : (
                <div className="bg-black/30 rounded-xl p-4 border border-white/5 space-y-2 text-sm">
                  <h4 className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">本次状态</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">当前矿石价值</span>
                      <span className="font-mono font-bold text-yellow-400">{rover.cargoValue}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">货箱重量</span>
                      <span className="font-mono font-bold text-amber-400">{rover.cargoWeight}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">剩余电量</span>
                      <span className="font-mono font-bold text-cyan-400">{Math.ceil(power)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">剩余时间</span>
                      <span className="font-mono font-bold text-orange-400">{Math.ceil(timeRemaining)}s</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="text-center">
                <p className="text-xs text-gray-500 mb-2">提示：必经过的站点类型</p>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {Object.entries(BASE_TYPE_INFO).filter(([k]) => ['mine', 'smelter', 'solar', 'oxygen'].includes(k)).map(([key, info]) => (
                    <div
                      key={key}
                      className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 border border-white/10 text-xs"
                      style={{ color: info.color }}
                    >
                      <span>{info.icon}</span>
                      <span>{info.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                actions.resetGame();
                setTimeout(() => actions.startGame(), 50);
              }}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl
                bg-gradient-to-b from-[#3a3a5a] to-[#2a2a48] hover:from-[#454570] hover:to-[#353558]
                border-2 border-[#5a5a80]
                text-white font-bold text-base
                transition-all active:scale-95 shadow-lg"
            >
              <RotateCcw className="w-5 h-5" />
              重新挑战
            </button>

            {isSuccess && nextLevel && onNextLevel && (
              <button
                onClick={onNextLevel}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl
                  bg-gradient-to-b from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600
                  border-2 border-emerald-400/60
                  text-white font-bold text-base
                  transition-all active:scale-95 shadow-lg shadow-emerald-500/30"
              >
                下一关
                <ChevronRight className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={onBackToMenu}
              className="flex-1 sm:flex-none sm:w-40 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl
                bg-black/40 hover:bg-black/60
                border-2 border-gray-600/50
                text-gray-300 font-bold text-base
                transition-all active:scale-95"
            >
              <Home className="w-5 h-5" />
              主菜单
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
