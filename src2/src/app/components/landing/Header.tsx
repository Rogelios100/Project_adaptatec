import { motion } from "motion/react";
import { GraduationCap, Menu, X } from "lucide-react";
import { Button } from "../ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  onLoginClick: () => void;
}

export function Header({ onLoginClick }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <GraduationCap className="w-8 h-8 text-indigo-600" />
            <span className="text-2xl font-bold text-gray-900">Adaptatec</span>
          </motion.div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#caracteristicas" className="text-gray-700 hover:text-indigo-600 transition-colors">
              Características
            </a>
            <a href="#como-funciona" className="text-gray-700 hover:text-indigo-600 transition-colors">
              Cómo funciona
            </a>
            <a href="#beneficios" className="text-gray-700 hover:text-indigo-600 transition-colors">
              Beneficios
            </a>
            <Button 
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full"
              onClick={onLoginClick}
            >
              Empezar gratis
            </Button>
          </nav>

          <button
            className="md:hidden text-gray-700"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden py-4 border-t border-gray-200"
          >
            <nav className="flex flex-col gap-4">
              <a href="#caracteristicas" className="text-gray-700 hover:text-indigo-600 transition-colors">
                Características
              </a>
              <a href="#como-funciona" className="text-gray-700 hover:text-indigo-600 transition-colors">
                Cómo funciona
              </a>
              <a href="#beneficios" className="text-gray-700 hover:text-indigo-600 transition-colors">
                Beneficios
              </a>
              <Button 
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full w-full"
                onClick={onLoginClick}
              >
                Empezar gratis
              </Button>
            </nav>
          </motion.div>
        )}
      </div>
    </header>
  );
}
