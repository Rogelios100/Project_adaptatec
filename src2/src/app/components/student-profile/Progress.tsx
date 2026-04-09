import { TrendingUp, Calendar, Clock, BookOpen, Target, Brain } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const weeklyData = [
  { day: "Lun", hours: 2.5 },
  { day: "Mar", hours: 3.0 },
  { day: "Mié", hours: 1.5 },
  { day: "Jue", hours: 2.8 },
  { day: "Vie", hours: 3.5 },
  { day: "Sáb", hours: 2.2 },
  { day: "Dom", hours: 1.8 },
];

const monthlyProgress = [
  { month: "Sep", score: 75 },
  { month: "Oct", score: 78 },
  { month: "Nov", score: 82 },
  { month: "Dic", score: 80 },
  { month: "Ene", score: 85 },
  { month: "Feb", score: 88 },
  { month: "Mar", score: 90 },
];

const subjectDistribution = [
  { name: "Algoritmos", value: 35, color: "#3B82F6" },
  { name: "Web Dev", value: 25, color: "#8B5CF6" },
  { name: "Base Datos", value: 20, color: "#10B981" },
  { name: "IA", value: 15, color: "#EC4899" },
  { name: "Otros", value: 5, color: "#F97316" },
];

export function Progress() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mi Progreso</h1>
          <p className="text-gray-600 mt-1">Analiza tu rendimiento y mejora continuamente</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors">
            Esta Semana
          </button>
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors">
            Este Mes
          </button>
        </div>
      </div>

      {/* Resumen de Estadísticas */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <Clock className="text-blue-500" size={24} />
            <TrendingUp className="text-green-500" size={16} />
          </div>
          <p className="text-2xl font-bold text-gray-900">17.3h</p>
          <p className="text-sm text-gray-600">Horas esta semana</p>
          <p className="text-xs text-green-600 mt-1">+2.5h vs semana pasada</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <Target className="text-purple-500" size={24} />
            <TrendingUp className="text-green-500" size={16} />
          </div>
          <p className="text-2xl font-bold text-gray-900">90%</p>
          <p className="text-sm text-gray-600">Promedio de calificación</p>
          <p className="text-xs text-green-600 mt-1">+2% vs mes pasado</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <BookOpen className="text-green-500" size={24} />
            <span className="text-xs text-gray-500">Total</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">47</p>
          <p className="text-sm text-gray-600">Módulos completados</p>
          <p className="text-xs text-gray-500 mt-1">De 85 totales</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <Brain className="text-orange-500" size={24} />
            <span className="text-xs text-gray-500">Nivel</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">12</p>
          <p className="text-sm text-gray-600">Nivel actual</p>
          <p className="text-xs text-gray-500 mt-1">650 XP para nivel 13</p>
        </div>
      </div>

      {/* Gráficas principales */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Horas de Estudio Semanales */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Horas de Estudio Esta Semana</h3>
            <Clock size={20} className="text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="hours" fill="#3B82F6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Promedio diario:</span>
              <span className="font-semibold text-gray-900">2.47 horas</span>
            </div>
          </div>
        </div>

        {/* Progreso Mensual */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Progreso de Calificaciones</h3>
            <TrendingUp size={20} className="text-green-500" />
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyProgress}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis domain={[70, 100]} tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#8B5CF6" 
                strokeWidth={3}
                dot={{ fill: '#8B5CF6', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Mejora en 6 meses:</span>
              <span className="font-semibold text-green-600">+15 puntos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Distribución de Tiempo y Metas */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Distribución por Materia */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Distribución de Tiempo por Materia</h3>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={subjectDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {subjectDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {subjectDistribution.map((subject, index) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: subject.color }}
                />
                <span className="text-xs text-gray-600">{subject.name}</span>
                <span className="text-xs font-semibold text-gray-900">{subject.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Metas y Objetivos */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Metas del Mes</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700">Estudiar 80 horas</span>
                <span className="text-sm font-semibold text-gray-900">67.5/80h</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: "84%" }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">84% completado</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700">Completar 15 módulos</span>
                <span className="text-sm font-semibold text-gray-900">12/15</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: "80%" }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">80% completado</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700">Mantener promedio 85%</span>
                <span className="text-sm font-semibold text-gray-900">90%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full" 
                  style={{ width: "100%" }}
                />
              </div>
              <p className="text-xs text-green-600 mt-1">¡Meta superada!</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700">Ganar 500 XP</span>
                <span className="text-sm font-semibold text-gray-900">320/500</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-orange-500 h-2 rounded-full" 
                  style={{ width: "64%" }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">64% completado</p>
            </div>
          </div>
        </div>
      </div>

      {/* Racha de Estudio */}
      <div className="bg-gradient-to-r from-orange-400 to-pink-500 rounded-xl shadow-lg p-6 text-white">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-3xl">
              🔥
            </div>
            <div>
              <h3 className="text-2xl font-bold">Racha de 7 días</h3>
              <p className="text-white/90 mt-1">¡Sigue así! Mantén tu ritmo de estudio</p>
            </div>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map((day) => (
              <div 
                key={day}
                className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center"
              >
                <span className="text-lg">✓</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
