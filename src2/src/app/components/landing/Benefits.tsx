import { motion } from "motion/react";
import { CheckCircle } from "lucide-react";

const benefits = [
  "Estudia a tu ritmo, sin estrés ni presiones",
  "Disponible 24/7, cuando tú lo necesites",
  "Explicaciones personalizadas para tu nivel",
  "Todas tus materias en un solo lugar",
  "Aprende de forma más dinámica y divertida",
  "Ahorra tiempo y estudia más eficientemente"
];

export function Benefits() {
  return (
    <section id="beneficios" className="py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
              Estudiar ya no tiene por qué ser un dolor de cabeza
            </h2>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Con Adaptatec, el aprendizaje se vuelve accesible. Dinámico. Real. 
              No más noches en vela sin entender nada. 
              Aquí sí vas a comprender las cosas.
            </p>

            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="flex items-start gap-3"
                >
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                  <span className="text-lg text-gray-700">{benefit}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <img 
              src="https://images.unsplash.com/photo-1758270705518-b61b40527e76?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaXZlcnNlJTIwc3R1ZGVudHMlMjBjb2xsYWJvcmF0aW9ufGVufDF8fHx8MTc3MzIyMjMwMnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt="Estudiantes colaborando"
              className="rounded-2xl shadow-2xl w-full"
            />
            <div className="absolute -bottom-6 -left-6 bg-indigo-600 text-white p-6 rounded-xl shadow-xl max-w-xs">
              <p className="text-lg font-semibold">
                "Desde que uso Adaptatec, todo tiene más sentido"
              </p>
              <p className="text-sm text-indigo-200 mt-2">- María, estudiante de ingeniería</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
