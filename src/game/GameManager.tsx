import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import GameScene from './scenes/GameScene';

interface GameManagerProps {
  levelId: number;
}

export default function GameManager({ levelId }: GameManagerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: 1280,
      height: 800,
      backgroundColor: '#0d0d1a',
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      scene: [GameScene],
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false
        }
      },
      pixelArt: true,
      render: {
        antialias: true,
        pixelArt: false
      }
    };

    gameRef.current = new Phaser.Game(config);

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [levelId]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[600px] relative overflow-hidden rounded-xl border-2 border-[#3a3a55] shadow-2xl"
      style={{ aspectRatio: '16/10' }}
    />
  );
}
