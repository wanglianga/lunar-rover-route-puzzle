import { useState } from 'react';
import { Play, Star, Lock, Info, ChevronRight, Rocket, Moon, HelpCircle, X } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { LEVELS } from '../game/config/levels';
import { BASE_TYPE_INFO } from '../types/game';

interface MainMenuProps {
  onSelectLevel: (levelId: number) => void;
}

export default function MainMenu({ onSelectLevel }: MainMenuProps) {
  const [showHelp, setShowHelp] = useState(false);
  const { playerProgress } = useGameStore();

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-gradient-to-br from-[#0a0a18] via-[#10102a] to-[#0d0d20]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 80 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              width: `${Math.random() * 2 + 1}px`,
              height: `${Math.random() * 2 + 1}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.7 + 0.2,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${Math.random() * 2 + 2}s`
            }}
          />
        ))}
        <div className="absolute top-20 right-20 w-64 h-64 rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-500/5 blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 rounded-full bg-gradient-to-tr from-orange-500/10 to-red-500/5 blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 md:py-12 max-w-6xl">
        <div className="text-center mb-10 md:mb-14">
          <div className="inline-flex items-center gap-3 mb-4 px-5 py-2 rounded-full bg-orange-500/10 border border-orange-400/30">
            <Moon className="w-5 h-5 text-orange-300" />
            <span className="text-orange-200 text-sm font-semibold tracking-wider uppercase">Lunar Logistics Corp</span>
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-200 via-yellow-200 to-orange-300 mb-4 tracking-tight">
            月球矿车
            <span className="block mt-2 text-3xl md:text-5xl lg:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-blue-200 to-indigo-200">
              路线解谜
            </span>
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto text-base md:text-lg leading-relaxed">
            驾驶矿车在月面基地之间运输矿石，连接采矿点、熔炼站、氧气塔和返回舱，
            <br className="hidden md:block" />
            在有限的电量与时间窗口内规划出最佳路线！
          </p>
        </div>

        <div className="flex justify-center gap-3 mb-8">
          <button
            onClick={() => setShowHelp(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl
              bg-[#1a1a35]/80 hover:bg-[#252550]
              border-2 border-[#3a3a60]
              text-gray-300 hover:text-white font-semibold text-sm
              transition-all active:scale-95 backdrop-blur-sm"
          >
            <HelpCircle className="w-4 h-4" />
            游戏说明
          </button>
        </div>

        <div className="mb-6 md:mb-8">
          <h2 className="text-xl md:text-2xl font-bold text-gray-200 mb-5 flex items-center gap-3">
            <Rocket className="w-6 h-6 text-orange-400" />
            选择关卡
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {LEVELS.map((level, idx) => {
              const isUnlocked = playerProgress.unlockedLevels.includes(level.id);
              const best = playerProgress.bestScores[level.id];
              const prevLevel = idx > 0 ? LEVELS[idx - 1] : null;
              const prevBest = prevLevel ? playerProgress.bestScores[prevLevel.id] : null;
              const unlockHint = prevLevel && !isUnlocked
                ? `需完成「${prevLevel.name}」（${prevBest ? '至少1星' : '首次通关'}）`
                : null;

              return (
                <button
                  key={level.id}
                  disabled={!isUnlocked}
                  onClick={() => isUnlocked && onSelectLevel(level.id)}
                  className={`
                    group relative text-left rounded-2xl overflow-hidden
                    border-2 transition-all duration-300
                    ${isUnlocked
                      ? 'bg-gradient-to-br from-[#1a1a35] to-[#151528] border-[#3a3a60] hover:border-orange-400/60 hover:shadow-2xl hover:shadow-orange-500/10 hover:-translate-y-1'
                      : 'bg-[#0f0f1e] border-[#1a1a30] cursor-not-allowed opacity-60'
                    }
                  `}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 to-indigo-500/0 group-hover:from-orange-500/5 group-hover:to-indigo-500/5 transition-all" />

                  <div className="relative p-5 md:p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`
                          w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black
                          ${isUnlocked
                            ? 'bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/30'
                            : 'bg-gray-700 text-gray-500'
                          }
                        `}>
                          {isUnlocked ? level.id : <Lock className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="flex gap-1 mb-1">
                            {Array.from({ length: level.difficulty }).map((_, i) => (
                              <span key={i} className="w-2 h-2 rounded-full bg-orange-400" />
                            ))}
                            {Array.from({ length: 3 - level.difficulty }).map((_, i) => (
                              <span key={i} className="w-2 h-2 rounded-full bg-gray-600" />
                            ))}
                          </div>
                          <h3 className={`text-lg md:text-xl font-bold ${isUnlocked ? 'text-white' : 'text-gray-500'}`}>
                            {level.name}
                          </h3>
                        </div>
                      </div>
                      {isUnlocked && (
                        <ChevronRight className="w-6 h-6 text-gray-500 group-hover:text-orange-400 transition-colors group-hover:translate-x-1" />
                      )}
                    </div>

                    <p className={`text-sm leading-relaxed mb-5 ${isUnlocked ? 'text-gray-400' : 'text-gray-600'}`}>
                      {isUnlocked ? level.description : unlockHint || '完成前一关解锁'}
                    </p>

                    {isUnlocked && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">三星门槛</span>
                          <div className="flex gap-4">
                            {level.threeStarScore.map((s, i) => (
                              <div key={i} className="flex items-center gap-1">
                                <Star
                                  className={`w-3.5 h-3.5 ${best && best.stars >= i + 1 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`}
                                />
                                <span className="text-xs font-mono font-bold text-gray-400 tabular-nums">{s}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {best && (
                          <div className="flex items-center justify-between pt-3 border-t border-white/5">
                            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">最佳成绩</span>
                            <div className="flex items-center gap-2">
                              <div className="flex gap-0.5">
                                {[1, 2, 3].map(i => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${best.stars >= i ? 'text-yellow-400 fill-yellow-400' : 'text-gray-700'}`}
                                  />
                                ))}
                              </div>
                              <span className="font-mono font-bold text-white text-sm tabular-nums">{best.score}</span>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/5">
                          <div className="text-center">
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">电量</div>
                            <div className="text-xs font-mono font-bold text-cyan-400">{level.initialPower}</div>
                          </div>
                          <div className="text-center border-x border-white/5">
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">氧气</div>
                            <div className="text-xs font-mono font-bold text-emerald-400">{level.initialOxygen}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">时间</div>
                            <div className="text-xs font-mono font-bold text-orange-400">{level.returnWindow}s</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {isUnlocked && (
                      <div className="mt-5 flex items-center justify-center gap-2 py-2.5 rounded-xl
                        bg-gradient-to-r from-orange-600/20 to-amber-600/20
                        border border-orange-400/30
                        text-orange-300 font-bold text-sm
                        group-hover:from-orange-500/30 group-hover:to-amber-500/30 transition-all">
                        <Play className="w-4 h-4 fill-current" />
                        开始挑战
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-12 text-center">
          <div className="inline-block px-6 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <p className="text-xs md:text-sm text-gray-400 leading-relaxed">
              <span className="text-gray-300 font-semibold">快捷操作：</span>
              <kbd className="mx-1 px-2 py-0.5 rounded bg-black/60 border border-gray-700 text-gray-300 font-mono text-[10px]">W/↑</kbd>加速
              <span className="text-gray-600 mx-1">·</span>
              <kbd className="mx-1 px-2 py-0.5 rounded bg-black/60 border border-gray-700 text-gray-300 font-mono text-[10px]">S/↓</kbd>刹车
              <span className="text-gray-600 mx-1">·</span>
              <kbd className="mx-1 px-2 py-0.5 rounded bg-black/60 border border-gray-700 text-gray-300 font-mono text-[10px]">A/D</kbd>岔路
              <span className="text-gray-600 mx-1">·</span>
              <kbd className="mx-1 px-2 py-0.5 rounded bg-black/60 border border-gray-700 text-gray-300 font-mono text-[10px]">SPACE</kbd>跃迁
            </p>
          </div>
        </div>
      </div>

      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl
            bg-gradient-to-br from-[#15152a] to-[#101020]
            border-2 border-[#3a3a60] shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-[#15152a]/95 backdrop-blur border-b border-white/10">
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                <Info className="w-6 h-6 text-cyan-400" />
                游戏说明
              </h2>
              <button
                onClick={() => setShowHelp(false)}
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <section>
                <h3 className="text-lg font-bold text-orange-300 mb-3">🎯 游戏目标</h3>
                <p className="text-gray-300 leading-relaxed text-sm">
                  驾驶月球矿车，在有限的电量和返回窗口时间内，从采矿点装载矿石，
                  经过熔炼站提升价值，补充必要的电力和氧气，最终在返回舱成功发射！
                </p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-cyan-300 mb-3">🎮 操作指南</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { keys: 'W / ↑', desc: '踩下油门，加速前进（消耗电量）' },
                    { keys: 'S / ↓', desc: '踩下刹车，紧急减速' },
                    { keys: 'A / ← / Q', desc: '岔路口选择左侧轨道' },
                    { keys: 'D / → / E', desc: '岔路口选择右侧轨道' },
                    { keys: 'SPACE', desc: '短距离跃迁到附近节点（消耗额外电量）' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                      <div className="flex gap-1 flex-shrink-0">
                        {item.keys.split('/').map(k => (
                          <kbd key={k} className="px-2 py-1 rounded-md bg-black/60 border border-gray-600 text-xs font-mono font-bold text-gray-200">
                            {k.trim()}
                          </kbd>
                        ))}
                      </div>
                      <p className="text-gray-300 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-lg font-bold text-emerald-300 mb-3">🏭 基地类型</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(BASE_TYPE_INFO).map(([key, info]) => (
                    <div key={key} className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center text-lg"
                          style={{ backgroundColor: `${info.color}22`, border: `2px solid ${info.color}66` }}
                        >
                          {info.icon}
                        </div>
                        <span className="font-bold text-white text-sm">{info.label}</span>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        {key === 'mine' && '装载矿石，增加价值与重量'}
                        {key === 'smelter' && '将已有矿石价值乘以倍率'}
                        {key === 'oxygen' && '瞬间补充氧气储备'}
                        {key === 'solar' && '瞬间补充电量储备'}
                        {key === 'return' && '终点，需满足最低矿石价值'}
                        {key === 'start' && '矿车出发点'}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-lg font-bold text-yellow-300 mb-3">⚠️ 失败原因</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex gap-2"><span className="text-red-400 font-bold">电量耗尽：</span>电量归零且矿车已停下</li>
                  <li className="flex gap-2"><span className="text-red-400 font-bold">氧气耗尽：</span>氧气储备归零</li>
                  <li className="flex gap-2"><span className="text-red-400 font-bold">货箱脱轨：</span>牵引货箱时高速急转弯</li>
                  <li className="flex gap-2"><span className="text-red-400 font-bold">撞击障碍：</span>高速撞上月岩或陨石</li>
                  <li className="flex gap-2"><span className="text-red-400 font-bold">错过窗口：</span>返回倒计时结束未能抵达</li>
                  <li className="flex gap-2"><span className="text-red-400 font-bold">价值不足：</span>抵达返回舱但矿石价值不够</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-bold text-purple-300 mb-3">💡 策略建议</h3>
                <ul className="space-y-2 text-sm text-gray-300 list-disc list-inside marker:text-purple-400">
                  <li>低重力环境下制动距离很长，提前刹车！</li>
                  <li>货箱越重，最高速度越低，耗电越快</li>
                  <li>跃迁可以越过陨石警告区，节省时间</li>
                  <li>太阳能区和氧气塔可重复进入补充</li>
                  <li>熔炼站需先装矿石才能生效</li>
                  <li>想拿三星？尽量节省资源并快速返回！</li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
