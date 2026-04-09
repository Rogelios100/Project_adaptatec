import { Trophy, Award, Star, Zap, Target, Crown, Flame, Medal } from "lucide-react";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedDate?: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  points: number;
}

const achievements: Achievement[] = [
  {
    id: "1",
    name: "Primera Victoria",
    description: "Completa tu primer módulo",
    icon: "trophy",
    unlocked: true,
    unlockedDate: "15 Mar 2024",
    rarity: "common",
    points: 50,
  },
  {
    id: "2",
    name: "Racha de Fuego",
    description: "Estudia 7 días consecutivos",
    icon: "flame",
    unlocked: true,
    unlockedDate: "20 Mar 2024",
    rarity: "rare",
    points: 100,
  },
  {
    id: "3",
    name: "Maestro del Conocimiento",
    description: "Completa 10 módulos con 100%",
    icon: "crown",
    unlocked: true,
    unlockedDate: "25 Mar 2024",
    rarity: "epic",
    points: 250,
  },
  {
    id: "4",
    name: "Conversador IA",
    description: "Realiza 50 preguntas a la IA",
    icon: "zap",
    unlocked: true,
    unlockedDate: "22 Mar 2024",
    rarity: "rare",
    points: 100,
  },
  {
    id: "5",
    name: "Perfeccionista",
    description: "Obtén 100% en 3 exámenes seguidos",
    icon: "target",
    unlocked: true,
    unlockedDate: "18 Mar 2024",
    rarity: "epic",
    points: 200,
  },
  {
    id: "6",
    name: "Madrugador",
    description: "Estudia antes de las 7 AM durante 5 días",
    icon: "star",
    unlocked: false,
    rarity: "rare",
    points: 150,
  },
  {
    id: "7",
    name: "Leyenda del Aprendizaje",
    description: "Alcanza nivel 20",
    icon: "medal",
    unlocked: false,
    rarity: "legendary",
    points: 500,
  },
  {
    id: "8",
    name: "Colaborador",
    description: "Ayuda a 10 compañeros en foros",
    icon: "award",
    unlocked: false,
    rarity: "rare",
    points: 100,
  },
  {
    id: "9",
    name: "Maratón de Estudio",
    description: "Estudia 30 horas en una semana",
    icon: "zap",
    unlocked: false,
    rarity: "epic",
    points: 300,
  },
];

const iconMap: Record<string, any> = {
  trophy: Trophy,
  flame: Flame,
  crown: Crown,
  zap: Zap,
  target: Target,
  star: Star,
  medal: Medal,
  award: Award,
};

const rarityColors = {
  common: { bg: "bg-gray-100", border: "border-gray-300", text: "text-gray-700", badge: "bg-gray-500" },
  rare: { bg: "bg-blue-100", border: "border-blue-300", text: "text-blue-700", badge: "bg-blue-500" },
  epic: { bg: "bg-purple-100", border: "border-purple-300", text: "text-purple-700", badge: "bg-purple-500" },
  legendary: { bg: "bg-yellow-100", border: "border-yellow-300", text: "text-yellow-700", badge: "bg-yellow-500" },
};

export function Rewards() {
  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const lockedAchievements = achievements.filter(a => !a.unlocked);
  const totalPoints = unlockedAchievements.reduce((sum, a) => sum + a.points, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-500 rounded-xl shadow-lg p-6 text-white">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Trophy size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Recompensas y Logros</h1>
              <p className="text-white/90 mt-1">Sigue aprendiendo para desbloquear más</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold">{totalPoints}</p>
            <p className="text-white/90">Puntos Totales</p>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <Award className="text-blue-500" size={24} />
            <span className="text-2xl font-bold text-gray-900">{unlockedAchievements.length}</span>
          </div>
          <p className="text-sm text-gray-600">Logros Desbloqueados</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <Target className="text-purple-500" size={24} />
            <span className="text-2xl font-bold text-gray-900">{achievements.length}</span>
          </div>
          <p className="text-sm text-gray-600">Total de Logros</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <Zap className="text-yellow-500" size={24} />
            <span className="text-2xl font-bold text-gray-900">7</span>
          </div>
          <p className="text-sm text-gray-600">Racha Actual (días)</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <Star className="text-orange-500" size={24} />
            <span className="text-2xl font-bold text-gray-900">12</span>
          </div>
          <p className="text-sm text-gray-600">Nivel Actual</p>
        </div>
      </div>

      {/* Logros Desbloqueados */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Logros Desbloqueados</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {unlockedAchievements.map((achievement) => {
            const Icon = iconMap[achievement.icon];
            const colors = rarityColors[achievement.rarity];
            
            return (
              <div
                key={achievement.id}
                className={`${colors.bg} border-2 ${colors.border} rounded-xl p-4 hover:scale-105 transition-transform`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-12 h-12 ${colors.badge} rounded-full flex items-center justify-center`}>
                    <Icon size={24} className="text-white" />
                  </div>
                  <span className={`${colors.badge} text-white text-xs px-2 py-1 rounded-full`}>
                    +{achievement.points} XP
                  </span>
                </div>
                <h3 className={`font-semibold ${colors.text} mb-1`}>{achievement.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                <p className="text-xs text-gray-500">Desbloqueado: {achievement.unlockedDate}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Logros Bloqueados */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Próximos Logros</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lockedAchievements.map((achievement) => {
            const Icon = iconMap[achievement.icon];
            const colors = rarityColors[achievement.rarity];
            
            return (
              <div
                key={achievement.id}
                className="bg-gray-100 border-2 border-gray-300 rounded-xl p-4 opacity-60 hover:opacity-80 transition-opacity"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 bg-gray-400 rounded-full flex items-center justify-center">
                    <Icon size={24} className="text-white" />
                  </div>
                  <span className="bg-gray-400 text-white text-xs px-2 py-1 rounded-full">
                    +{achievement.points} XP
                  </span>
                </div>
                <h3 className="font-semibold text-gray-700 mb-1">{achievement.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <span className={`inline-block w-2 h-2 ${colors.badge} rounded-full`}></span>
                  <span className="capitalize">{achievement.rarity}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Progreso del Nivel */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Progreso al Siguiente Nivel</h3>
          <span className="text-sm text-gray-600">Nivel 12 → 13</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full transition-all"
            style={{ width: "75%" }}
          />
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>1,850 / 2,500 XP</span>
          <span>650 XP restantes</span>
        </div>
      </div>
    </div>
  );
}
