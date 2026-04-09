import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { GraduationCap, Mail, Lock } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate login
    onOpenChange(false);
    navigate("/dashboard");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <GraduationCap className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            {isLogin ? "¡Bienvenido de nuevo!" : "Crea tu cuenta"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {isLogin 
              ? "Ingresa tus datos para continuar aprendiendo" 
              : "Únete a miles de estudiantes que ya están mejorando"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">
                O {isLogin ? "inicia sesión" : "regístrate"} con email
              </span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Nombre completo</Label>
                <Input 
                  id="name" 
                  placeholder="Juan Pérez"
                  className="py-5"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="tu@email.com"
                  className="pl-10 py-5"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••"
                  className="pl-10 py-5"
                />
              </div>
            </div>

            {isLogin && (
              <div className="flex justify-end">
                <button 
                  type="button"
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            <Button 
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-6"
            >
              {isLogin ? "Iniciar sesión" : "Crear cuenta"}
            </Button>
          </form>

          <div className="text-center text-sm text-gray-600">
            {isLogin ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-indigo-600 hover:text-indigo-700 font-semibold"
            >
              {isLogin ? "Regístrate gratis" : "Inicia sesión"}
            </button>
          </div>

          {!isLogin && (
            <p className="text-xs text-center text-gray-500 px-4">
              Al crear una cuenta, aceptas nuestros Términos de Servicio y Política de Privacidad
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
