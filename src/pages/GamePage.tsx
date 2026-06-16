import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { LEVELS } from '../game/config/levels';
import GameManager from '../game/GameManager';
import StatusBar from '../components/StatusBar';
import ControlPanel from '../components/ControlPanel';
import MessageToast from '../components/MessageToast';
import ResultModal from '../components/ResultModal';

export default function GamePage() {
  const { levelId } = useParams<{ levelId: string }>();
  const navigate = useNavigate();
  const { currentLevel, actions, level } = useGameStore();

  const parsedLevelId = Number(levelId);

  useEffect(() => {
    if (parsedLevelId && LEVELS.find(l => l.id === parsedLevelId)) {
      actions.loadLevel(parsedLevelId);
    } else {
      navigate('/');
    }
    return () => {
      actions.goToMenu();
    };
  }, [parsedLevelId, navigate, actions]);

  const nextLevel = LEVELS.find(l => l.id === parsedLevelId + 1);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#0a0a18] via-[#10102a] to-[#0d0d20] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/40"
            style={{
              width: `${Math.random() * 1.5 + 0.5}px`,
              height: `${Math.random() * 1.5 + 0.5}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.5 + 0.2,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-4 py-4 md:py-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl
              bg-[#1a1a35]/80 hover:bg-[#252550]
              border-2 border-[#3a3a60]
              text-gray-300 hover:text-white font-semibold text-sm
              transition-all active:scale-95 backdrop-blur-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            返回主菜单
          </button>

          <div className="text-center">
            <h1 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-200 to-yellow-200">
              {level?.name || `关卡 ${parsedLevelId}`}
            </h1>
            <p className="text-xs md:text-sm text-gray-500 mt-0.5">{level?.description}</p>
          </div>

          <div className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[#1a1a35]/60 border border-[#3a3a60] backdrop-blur-sm">
            {level && Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="text-xs font-mono font-bold text-gray-500"
                style={{ opacity: i < level.difficulty ? 1 : 0.25 }}
              >
                ●
              </div>
            ))}
            <span className="text-xs text-gray-400 font-semibold ml-1">
              {level?.difficulty === 1 ? '简单' : level?.difficulty === 2 ? '中等' : '困难'}
            </span>
          </div>
        </div>

        <div className="relative">
          {currentLevel === parsedLevelId ? (
            <GameManager levelId={parsedLevelId} />
          ) : (
            <div className="w-full min-h-[600px] rounded-xl border-2 border-[#3a3a55] bg-[#15152a]/50 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full border-4 border-orange-400/30 border-t-orange-400 animate-spin" />
                <p className="text-gray-400">正在加载关卡...</p>
              </div>
            </div>
          )}

          <StatusBar />
          <MessageToast />
          <ControlPanel />
          <ResultModal
            onBackToMenu={() => navigate('/')}
            onNextLevel={nextLevel ? () => navigate(`/game/${nextLevel.id}`) : undefined}
          />
        </div>
      </div>
    </div>
  );
}
