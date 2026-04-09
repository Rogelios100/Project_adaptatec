import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Haz tu pregunta",
    description: "Escribe lo que no entiendes. Sin miedo, sin vergüenza. Aquí no hay preguntas tontas."
  },
  {
    number: "02",
    title: "La IA analiza tu nivel",
    description: "Nuestra tecnología detecta dónde estás y qué necesitas. Todo en segundos."
  },
  {
    number: "03",
    title: "Recibes tu respuesta personalizada",
    description: "Te explicamos justo como lo necesitas. A tu ritmo. Con tu lenguaje. Y si no quedó claro, pregunta de nuevo."
  }
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="py-24 bg-gradient-to-br from-indigo-600 to-purple-700 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-pattern opacity-10"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Súper fácil de usar
          </h2>
          <p className="text-xl text-indigo-100 max-w-2xl mx-auto">
            Tres pasos. Eso es todo. Así de simple funciona.
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2, duration: 0.6 }}
              className="flex flex-col md:flex-row items-start gap-6 mb-12 last:mb-0"
            >
              <div className="flex-shrink-0">
                <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border-2 border-white/20">
                  <span className="text-3xl font-bold">{step.number}</span>
                </div>
              </div>
              
              <div className="flex-1">
                <h3 className="text-2xl md:text-3xl font-semibold mb-3">
                  {step.title}
                </h3>
                <p className="text-lg text-indigo-100 leading-relaxed">
                  {step.description}
                </p>
              </div>

              {index < steps.length - 1 && (
                <div className="hidden md:flex items-center justify-center flex-shrink-0">
                  <ArrowRight className="w-8 h-8 text-white/40" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
