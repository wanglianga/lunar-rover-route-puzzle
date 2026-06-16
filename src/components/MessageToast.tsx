import { useGameStore } from '../store/gameStore';

export default function MessageToast() {
  const message = useGameStore(state => state.message);

  if (!message) return null;

  return (
    <div className="absolute top-28 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-in slide-in-from-top-4 duration-300">
      <div className="px-6 py-3 rounded-2xl
        bg-gradient-to-r from-indigo-900/95 via-purple-900/95 to-indigo-900/95
        backdrop-blur-md
        border-2 border-indigo-400/50
        shadow-2xl shadow-indigo-500/30">
        <p className="text-white font-bold text-base md:text-lg tracking-wide text-center whitespace-nowrap drop-shadow">
          {message}
        </p>
      </div>
    </div>
  );
}
