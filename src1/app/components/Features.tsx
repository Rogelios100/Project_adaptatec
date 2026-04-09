import { motion } from "motion/react";
import { Brain, Zap, Target, MessageCircle } from "lucide-react";
import { Card } from "./ui/card";

const features = [
  {
    icon: Brain,
    title: "Inteligencia que se adapta a ti",
    description: "No todos aprendemos igual. Y lo sabemos. Nuestra IA entiende tu nivel, tu estilo, tu manera de procesar la info. Se ajusta a ti, no al revés."
  },
  {
    icon: Zap,
    title: "Respuestas al instante",
    description: "¿Dudas a las 2 de la mañana? Sin problema. Obtienes respuestas claras y rápidas cuando las necesitas. Porque el aprendizaje no tiene horario."
  },
  {
    icon: Target,
    title: "Enfocado en lo que importa",
    description: "Te ayudamos con tus materias específicas. Matemáticas, física, química, lo que sea. Nada de rodeos. Directo al grano con lo que realmente necesitas entender."
  },
  {
    icon: MessageCircle,
    title: "Como hablar con un amigo",
    description: "Olvídate de los textos complicados y el lenguaje robótico. Aquí te explicamos las cosas como si estuviéramos tomando un café. Simple. Claro. Humano."
  }
];

export function Features() {
  return (
    <section id="caracteristicas" className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
            ¿Por qué Adaptatec?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Porque aprender debería ser más fácil. Más intuitivo. Más tuyo.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
            >
              <Card className="p-8 h-full hover:shadow-xl transition-shadow duration-300 border-2 border-gray-100 hover:border-indigo-200">
                <div className="bg-indigo-100 w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7 text-indigo-600" />
                </div>
                <h3 className="text-2xl font-semibold mb-4 text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}