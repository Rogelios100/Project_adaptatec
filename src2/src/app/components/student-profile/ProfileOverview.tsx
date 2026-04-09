import { Mail, MapPin, Calendar, Award, BookOpen, Clock } from "lucide-react";

export function ProfileOverview() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header con foto de perfil */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600" />
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-16">
            <img
              src="https://images.unsplash.com/photo-1729824186570-4d4aede00043?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50JTIwcHJvZmlsZSUyMGF2YXRhcnxlbnwxfHx8fDE3NzQ1NzMxMjZ8MA&ixlib=rb-4.1.0&q=80&w=400"
              alt="Perfil del alumno"
              className="w-32 h-32 rounded-full border-4 border-white object-cover"
            />
            <div className="flex-1 text-center sm:text-left sm:mb-4">
              <h1 className="text-2xl font-bold text-gray-900">Juan David Pérez</h1>
              <p className="text-gray-600">Estudiante de Ingeniería en Sistemas</p>
            </div>
            <div className="sm:mb-4">
              <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg">
                <span className="font-semibold">Nivel 12</span> - Aprendiz Avanzado
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Información Personal */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Información Personal</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 text-gray-700">
            <Mail size={20} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p>juan.perez@universidad.edu</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-gray-700">
            <Calendar size={20} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Fecha de Ingreso</p>
              <p>Marzo 2024</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-gray-700">
            <MapPin size={20} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Ubicación</p>
              <p>Ciudad de México, México</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-gray-700">
            <BookOpen size={20} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">Matrícula</p>
              <p>2024-IS-0012</p>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas Rápidas */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <BookOpen size={20} className="text-blue-600" />
            </div>
            <span className="text-xs text-gray-500">Total</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">8</p>
          <p className="text-sm text-gray-600">Materias Activas</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Award size={20} className="text-green-600" />
            </div>
            <span className="text-xs text-gray-500">Obtenidos</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">24</p>
          <p className="text-sm text-gray-600">Logros Desbloqueados</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock size={20} className="text-purple-600" />
            </div>
            <span className="text-xs text-gray-500">Esta semana</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">12.5</p>
          <p className="text-sm text-gray-600">Horas de Estudio</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Award size={20} className="text-orange-600" />
            </div>
            <span className="text-xs text-gray-500">Acumulados</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">1,850</p>
          <p className="text-sm text-gray-600">Puntos de Experiencia</p>
        </div>
      </div>

      {/* Materias Recientes y Actividad */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Materias en Progreso */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Materias en Progreso</h3>
          <div className="space-y-4">
            {[
              { name: "Algoritmos y Estructuras de Datos", progress: 75, color: "blue" },
              { name: "Desarrollo Web Avanzado", progress: 60, color: "purple" },
              { name: "Base de Datos", progress: 85, color: "green" },
            ].map((subject, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-700">{subject.name}</p>
                  <span className="text-sm font-medium text-gray-900">{subject.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`bg-${subject.color}-500 h-2 rounded-full transition-all`}
                    style={{ width: `${subject.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actividad Reciente */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Actividad Reciente</h3>
          <div className="space-y-4">
            {[
              { 
                action: "Completaste el módulo de Árboles Binarios", 
                time: "Hace 2 horas",
                icon: "✅",
                color: "green"
              },
              { 
                action: "Desbloqueaste el logro 'Racha de 7 días'", 
                time: "Hace 5 horas",
                icon: "🏆",
                color: "yellow"
              },
              { 
                action: "Realizaste 15 preguntas a la IA", 
                time: "Hace 1 día",
                icon: "💬",
                color: "blue"
              },
              { 
                action: "Obtuviste 100% en el examen de SQL", 
                time: "Hace 2 días",
                icon: "🎯",
                color: "purple"
              },
            ].map((activity, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="text-2xl">{activity.icon}</div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700">{activity.action}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
