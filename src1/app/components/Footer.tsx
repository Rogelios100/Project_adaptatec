import { GraduationCap, Mail, Twitter, Instagram, Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="w-8 h-8 text-indigo-400" />
              <span className="text-xl font-bold text-white">Adaptatec</span>
            </div>
            <p className="text-gray-400 leading-relaxed">
              Tu asistente inteligente para aprender mejor, más rápido y a tu manera.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Producto</h3>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Características</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Precios</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Casos de uso</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Empresa</h3>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Sobre nosotros</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition-colors">Contacto</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Síguenos</h3>
            <div className="flex gap-4">
              <a href="#" className="hover:text-indigo-400 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-indigo-400 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-indigo-400 transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="hover:text-indigo-400 transition-colors">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
          <p>© 2026 Adaptatec. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
