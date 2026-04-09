import { motion } from "motion/react";
import { Button } from "../ui/button";
import { Sparkles } from "lucide-react";

interface HeroProps {
  onLoginClick: () => void;
}

export function Hero({ onLoginClick }: HeroProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="container mx-auto px-4 py-20 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-5xl mx-auto text-center"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full mb-6"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Tu asistente de estudio inteligente</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
          >
            Adaptatec
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-xl md:text-2xl text-gray-700 mb-8 leading-relaxed max-w-3xl mx-auto"
          >
            ¿Te has quedado atascado en algo? No pasa nada. 
            Aquí estamos para echarte una mano. Con Adaptatec, aprender se siente como tener un profe que te entiende de verdad. 
            Resolvemos tus dudas al instante y nos adaptamos a tu ritmo. Así, sin presiones.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button 
              size="lg" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all"
              onClick={onLoginClick}
            >
              Empieza gratis
            </Button>
            <Button size="lg" variant="outline" className="border-2 border-indigo-600 text-indigo-600 px-8 py-6 text-lg rounded-full hover:bg-indigo-50">
              Ver cómo funciona
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="mt-16"
          >
            <img 
              src="https://images.unsplash.com/photo-1561346745-5db62ae43861?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50JTIwc3R1ZHlpbmclMjBsYXB0b3AlMjBoYXBweXxlbnwxfHx8fDE3NzMxNzAxNDd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt="Estudiante usando Adaptatec"
              className="rounded-2xl shadow-2xl mx-auto max-w-4xl w-full"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
