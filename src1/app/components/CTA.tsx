import { motion } from "motion/react";
import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";

interface CTAProps {
  onLoginClick: () => void;
}

export function CTA({ onLoginClick }: CTAProps) {
  return (
    <section className="py-24 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            ¿Listo para aprender de verdad?
          </h2>
          <p className="text-xl md:text-2xl text-indigo-100 mb-10 leading-relaxed">
            Únete a miles de estudiantes que ya están cambiando su forma de estudiar. 
            Es gratis. Es fácil. Y sí, funciona.
          </p>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button 
              size="lg" 
              className="bg-white text-indigo-600 hover:bg-gray-100 px-10 py-7 text-lg rounded-full shadow-2xl hover:shadow-3xl transition-all group"
              onClick={onLoginClick}
            >
              Comenzar ahora
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>

          <p className="text-sm text-indigo-200 mt-6">
            No se requiere tarjeta de crédito • Acceso inmediato
          </p>
        </motion.div>
      </div>
    </section>
  );
}