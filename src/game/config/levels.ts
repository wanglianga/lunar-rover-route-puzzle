import type { LevelConfig } from '../../types/game';

export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: '第一关：新手训练',
    description: '熟悉矿车操作，完成一次简单的采矿和返回。',
    difficulty: 1,
    threeStarScore: [1500, 2500, 3500],
    initialPower: 100,
    initialOxygen: 100,
    returnWindow: 120,
    startNodeId: 'n0',
    trackNodes: [
      { id: 'n0', x: 150, y: 500, connections: ['n1'] },
      { id: 'n1', x: 350, y: 500, connections: ['n0', 'n2'] },
      { id: 'n2', x: 550, y: 400, connections: ['n1', 'n3'] },
      { id: 'n3', x: 750, y: 300, connections: ['n2', 'n4', 'n5'], isJunction: true, leftConnection: 'n4', rightConnection: 'n5' },
      { id: 'n4', x: 900, y: 200, connections: ['n3', 'n6'] },
      { id: 'n5', x: 750, y: 500, connections: ['n3', 'n7'] },
      { id: 'n6', x: 1050, y: 200, connections: ['n4', 'n7'] },
      { id: 'n7', x: 1050, y: 500, connections: ['n5', 'n6', 'n8'] },
      { id: 'n8', x: 1200, y: 500, connections: ['n7'] }
    ],
    baseStations: [
      { id: 'b-start', nodeId: 'n0', type: 'start', name: '出发点' },
      { id: 'b-mine1', nodeId: 'n4', type: 'mine', name: '采矿点Alpha', oreValue: 800, oreWeight: 15 },
      { id: 'b-solar1', nodeId: 'n2', type: 'solar', name: '太阳能区', powerRestore: 40 },
      { id: 'b-oxygen1', nodeId: 'n5', type: 'oxygen', name: '氧气塔', oxygenRestore: 50 },
      { id: 'b-return', nodeId: 'n8', type: 'return', name: '返回舱', requiredValue: 500 }
    ],
    obstacles: [
      { x: 600, y: 150, radius: 40, type: 'crater' },
      { x: 500, y: 600, radius: 30, type: 'rock' }
    ],
    meteorSchedule: [
      { time: 45, x: 750, y: 400, warningTime: 3, radius: 50 }
    ]
  },
  {
    id: 2,
    name: '第二关：熔炼增值',
    description: '学会使用熔炼站提升矿石价值，规划最有价值的路线。',
    difficulty: 2,
    threeStarScore: [3000, 4500, 6000],
    initialPower: 120,
    initialOxygen: 100,
    returnWindow: 150,
    startNodeId: 'n0',
    trackNodes: [
      { id: 'n0', x: 100, y: 400, connections: ['n1'] },
      { id: 'n1', x: 250, y: 400, connections: ['n0', 'n2'] },
      { id: 'n2', x: 400, y: 250, connections: ['n1', 'n3', 'n4'], isJunction: true, leftConnection: 'n3', rightConnection: 'n4' },
      { id: 'n3', x: 550, y: 150, connections: ['n2', 'n5'] },
      { id: 'n4', x: 400, y: 550, connections: ['n2', 'n6'] },
      { id: 'n5', x: 700, y: 150, connections: ['n3', 'n7'] },
      { id: 'n6', x: 550, y: 600, connections: ['n4', 'n8'] },
      { id: 'n7', x: 850, y: 250, connections: ['n5', 'n8', 'n9'], isJunction: true, leftConnection: 'n8', rightConnection: 'n9' },
      { id: 'n8', x: 700, y: 450, connections: ['n6', 'n7', 'n10'] },
      { id: 'n9', x: 1000, y: 150, connections: ['n7', 'n11'] },
      { id: 'n10', x: 850, y: 600, connections: ['n8', 'n12'] },
      { id: 'n11', x: 1150, y: 300, connections: ['n9', 'n12'] },
      { id: 'n12', x: 1150, y: 550, connections: ['n10', 'n11', 'n13'] },
      { id: 'n13', x: 1250, y: 550, connections: ['n12'] }
    ],
    baseStations: [
      { id: 'b-start', nodeId: 'n0', type: 'start', name: '出发点' },
      { id: 'b-mine1', nodeId: 'n5', type: 'mine', name: '采矿点Alpha', oreValue: 600, oreWeight: 12 },
      { id: 'b-mine2', nodeId: 'n6', type: 'mine', name: '采矿点Beta', oreValue: 900, oreWeight: 18 },
      { id: 'b-smelter', nodeId: 'n9', type: 'smelter', name: '熔炼站', valueMultiplier: 1.8 },
      { id: 'b-solar1', nodeId: 'n3', type: 'solar', name: '太阳能区', powerRestore: 35 },
      { id: 'b-oxygen1', nodeId: 'n10', type: 'oxygen', name: '氧气塔', oxygenRestore: 45 },
      { id: 'b-return', nodeId: 'n13', type: 'return', name: '返回舱', requiredValue: 1500 }
    ],
    obstacles: [
      { x: 300, y: 650, radius: 35, type: 'crater' },
      { x: 800, y: 700, radius: 45, type: 'crater' },
      { x: 1050, y: 80, radius: 25, type: 'rock' }
    ],
    meteorSchedule: [
      { time: 30, x: 550, y: 380, warningTime: 3, radius: 45 },
      { time: 80, x: 1000, y: 420, warningTime: 3, radius: 55 }
    ]
  },
  {
    id: 3,
    name: '第三关：终极挑战',
    description: '多采矿点、多岔路、陨石密集，考验你的规划能力！',
    difficulty: 3,
    threeStarScore: [5000, 7000, 9000],
    initialPower: 140,
    initialOxygen: 90,
    returnWindow: 180,
    startNodeId: 'n0',
    trackNodes: [
      { id: 'n0', x: 100, y: 350, connections: ['n1'] },
      { id: 'n1', x: 280, y: 350, connections: ['n0', 'n2', 'n3'], isJunction: true, leftConnection: 'n2', rightConnection: 'n3' },
      { id: 'n2', x: 280, y: 150, connections: ['n1', 'n4'] },
      { id: 'n3', x: 280, y: 550, connections: ['n1', 'n5'] },
      { id: 'n4', x: 460, y: 150, connections: ['n2', 'n6', 'n7'], isJunction: true, leftConnection: 'n6', rightConnection: 'n7' },
      { id: 'n5', x: 460, y: 550, connections: ['n3', 'n8'] },
      { id: 'n6', x: 640, y: 80, connections: ['n4', 'n9'] },
      { id: 'n7', x: 640, y: 280, connections: ['n4', 'n9', 'n10'], isJunction: true, leftConnection: 'n9', rightConnection: 'n10' },
      { id: 'n8', x: 460, y: 720, connections: ['n5', 'n11'] },
      { id: 'n9', x: 820, y: 180, connections: ['n6', 'n7', 'n12'] },
      { id: 'n10', x: 640, y: 480, connections: ['n7', 'n11', 'n13'], isJunction: true, leftConnection: 'n11', rightConnection: 'n13' },
      { id: 'n11', x: 640, y: 680, connections: ['n8', 'n10', 'n14'] },
      { id: 'n12', x: 1000, y: 180, connections: ['n9', 'n15'] },
      { id: 'n13', x: 820, y: 480, connections: ['n10', 'n15', 'n16'], isJunction: true, leftConnection: 'n14', rightConnection: 'n16' },
      { id: 'n14', x: 820, y: 680, connections: ['n11', 'n13', 'n17'] },
      { id: 'n15', x: 1080, y: 330, connections: ['n12', 'n13', 'n17'], isJunction: true, leftConnection: 'n17', rightConnection: 'n16' },
      { id: 'n16', x: 1000, y: 550, connections: ['n13', 'n15', 'n18'] },
      { id: 'n17', x: 1000, y: 720, connections: ['n14', 'n15', 'n18'] },
      { id: 'n18', x: 1180, y: 620, connections: ['n16', 'n17', 'n19'] },
      { id: 'n19', x: 1260, y: 620, connections: ['n18'] }
    ],
    baseStations: [
      { id: 'b-start', nodeId: 'n0', type: 'start', name: '出发点' },
      { id: 'b-mine1', nodeId: 'n6', type: 'mine', name: '采矿点Alpha', oreValue: 700, oreWeight: 14 },
      { id: 'b-mine2', nodeId: 'n8', type: 'mine', name: '采矿点Beta', oreValue: 1000, oreWeight: 20 },
      { id: 'b-mine3', nodeId: 'n12', type: 'mine', name: '采矿点Gamma', oreValue: 500, oreWeight: 10 },
      { id: 'b-smelter1', nodeId: 'n9', type: 'smelter', name: '熔炼站A', valueMultiplier: 1.6 },
      { id: 'b-smelter2', nodeId: 'n16', type: 'smelter', name: '熔炼站B', valueMultiplier: 1.5 },
      { id: 'b-solar1', nodeId: 'n2', type: 'solar', name: '太阳能区A', powerRestore: 30 },
      { id: 'b-solar2', nodeId: 'n14', type: 'solar', name: '太阳能区B', powerRestore: 40 },
      { id: 'b-oxygen1', nodeId: 'n5', type: 'oxygen', name: '氧气塔A', oxygenRestore: 40 },
      { id: 'b-oxygen2', nodeId: 'n17', type: 'oxygen', name: '氧气塔B', oxygenRestore: 50 },
      { id: 'b-return', nodeId: 'n19', type: 'return', name: '返回舱', requiredValue: 2500 }
    ],
    obstacles: [
      { x: 180, y: 250, radius: 35, type: 'rock' },
      { x: 550, y: 400, radius: 50, type: 'crater' },
      { x: 730, y: 600, radius: 40, type: 'crater' },
      { x: 1100, y: 100, radius: 30, type: 'rock' },
      { x: 900, y: 80, radius: 25, type: 'rock' },
      { x: 380, y: 450, radius: 30, type: 'crater' }
    ],
    meteorSchedule: [
      { time: 20, x: 460, y: 350, warningTime: 3, radius: 50 },
      { time: 55, x: 820, y: 350, warningTime: 3, radius: 45 },
      { time: 95, x: 640, y: 580, warningTime: 3, radius: 60 },
      { time: 130, x: 1080, y: 480, warningTime: 3, radius: 55 }
    ]
  }
];

export function getLevelById(id: number): LevelConfig | undefined {
  return LEVELS.find(l => l.id === id);
}
