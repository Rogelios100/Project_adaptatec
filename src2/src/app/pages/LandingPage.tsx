import { useState } from "react";
import { useNavigate } from "react-router-dom";

console.log("LandingPage component loading");

export default function LandingPage() {
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  console.log("LandingPage rendering, loginModalOpen:", loginModalOpen);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      console.log("Login attempt with:", email);
      setLoginModalOpen(false);
      setEmail("");
      setPassword("");
      // Navigate to dashboard
      navigate("/dashboard");
    }
  };

  const handleScrollTo = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      color: '#333',
      fontFamily: 'sans-serif'
    }}>
      {/* Header */}
      <div style={{
        position: 'sticky',
        top: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #eee',
        zIndex: 100,
        padding: '20px 40px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <h1 style={{ fontSize: '28px', color: '#4f46e5', margin: 0, cursor: 'pointer' }} onClick={() => navigate("/")}>
            ✨ Adaptatec
          </h1>
          <nav style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
            <button
              onClick={() => handleScrollTo("caracteristicas")}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px',
                color: '#666'
              }}
            >
              Características
            </button>
            <button
              onClick={() => handleScrollTo("como-funciona")}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px',
                color: '#666'
              }}
            >
              Cómo Funciona
            </button>
            <button
              onClick={() => handleScrollTo("beneficios")}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px',
                color: '#666'
              }}
            >
              Beneficios
            </button>
            <button
              onClick={() => setLoginModalOpen(true)}
              style={{
                padding: '10px 20px',
                fontSize: '16px',
                backgroundColor: '#4f46e5',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Empezar Gratis
            </button>
          </nav>
        </div>
      </div>

      {/* Hero Section */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '80px 40px',
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '600px'
      }}>
        <div style={{ maxWidth: '800px' }}>
          <h2 style={{ fontSize: '56px', marginBottom: '20px', fontWeight: 'bold' }}>
            Tu Asistente de Estudio Inteligente
          </h2>
          <p style={{ fontSize: '20px', marginBottom: '30px', lineHeight: '1.6' }}>
            ¿Te has quedado atascado en algo? No pasa nada. Aquí estamos para echarte una mano. 
            Con Adaptatec, aprender se siente como tener un profe que te entiende de verdad.
          </p>
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => setLoginModalOpen(true)}
              style={{
                padding: '15px 30px',
                fontSize: '16px',
                backgroundColor: 'white',
                color: '#4f46e5',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
              }}
            >
              Comenzar Ahora
            </button>
            <button
              onClick={() => handleScrollTo("como-funciona")}
              style={{
                padding: '15px 30px',
                fontSize: '16px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: '2px solid white',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Ver Cómo Funciona
            </button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="caracteristicas" style={{
        backgroundColor: '#fff',
        padding: '80px 40px',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '42px', marginBottom: '50px', textAlign: 'center' }}>
            Características Principales
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '30px'
          }}>
            {[
              { icon: '🧠', title: 'Inteligencia Artificial', desc: 'Algoritmo adaptativo que aprende contigo' },
              { icon: '⚡', title: 'Respuestas Instantáneas', desc: 'Obtén ayuda en tiempo real' },
              { icon: '🎯', title: 'Enfoque Personalizado', desc: 'Adaptado a tu nivel y ritmo' },
              { icon: '💬', title: 'Explicaciones Claras', desc: 'Como hablar con un profesor experto' }
            ].map((feature, idx) => (
              <div key={idx} style={{
                padding: '30px',
                backgroundColor: '#f9fafb',
                borderRadius: '12px',
                textAlign: 'center',
                border: '1px solid #e5e7eb',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
                el.style.transform = 'translateY(-5px)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.boxShadow = 'none';
                el.style.transform = 'translateY(0)';
              }}>
                <div style={{ fontSize: '48px', marginBottom: '15px' }}>
                  {feature.icon}
                </div>
                <h3 style={{ fontSize: '20px', marginBottom: '10px' }}>
                  {feature.title}
                </h3>
                <p style={{ color: '#666' }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div id="como-funciona" style={{
        backgroundColor: '#f3f4f6',
        padding: '80px 40px',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '42px', marginBottom: '50px', textAlign: 'center' }}>
            Cómo Funciona
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '40px'
          }}>
            {[
              { step: '1', title: 'Haz tu Pregunta', desc: 'Escribe la duda que tengas sobre cualquier tema' },
              { step: '2', title: 'IA Analiza', desc: 'Nuestro sistema entiende tu pregunta profundamente' },
              { step: '3', title: 'Recibe Respuesta', desc: 'Obtén una explicación clara y personalizada' }
            ].map((item, idx) => (
              <div key={idx} style={{
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  backgroundColor: '#4f46e5',
                  color: 'white',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '36px',
                  fontWeight: 'bold',
                  marginBottom: '20px'
                }}>
                  {item.step}
                </div>
                <h3 style={{ fontSize: '20px', marginBottom: '10px' }}>
                  {item.title}
                </h3>
                <p style={{ color: '#666' }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div id="beneficios" style={{
        backgroundColor: '#fff',
        padding: '80px 40px',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '42px', marginBottom: '50px', textAlign: 'center' }}>
            Beneficios
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '30px'
          }}>
            {[
              '✅ Acceso 24/7 a tu asistente de estudio',
              '✅ Mejora tu comprensión de los temas',
              '✅ Aprende a tu propio ritmo',
              '✅ Rastrear tu progreso',
              '✅ Gana recompensas por tu dedicación',
              '✅ Comunidad de estudiantes'
            ].map((benefit, idx) => (
              <div key={idx} style={{
                padding: '20px',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center'
              }}>
                {benefit}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '80px 40px',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '42px', marginBottom: '20px', fontWeight: 'bold' }}>
            ¿Listo para aprender de verdad?
          </h2>
          <p style={{ fontSize: '18px', marginBottom: '30px', lineHeight: '1.6' }}>
            Únete a miles de estudiantes que ya están cambiando su forma de estudiar. 
            Es gratis. Es fácil. Y sí, funciona.
          </p>
          <button
            onClick={() => setLoginModalOpen(true)}
            style={{
              padding: '15px 40px',
              fontSize: '18px',
              backgroundColor: 'white',
              color: '#4f46e5',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
            }}
          >
            Crear mi Cuenta Gratis
          </button>
          <p style={{ marginTop: '20px', fontSize: '14px', opacity: 0.9 }}>
            No se requiere tarjeta de crédito • Acceso inmediato
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#1f2937',
        color: 'white',
        padding: '40px',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', marginBottom: '30px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '30px',
            textAlign: 'left',
            marginBottom: '30px'
          }}>
            <div>
              <h4 style={{ marginBottom: '10px' }}>Producto</h4>
              <ul style={{ listStyle: 'none', padding: 0, color: '#b0b0b0' }}>
                <li><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Características</a></li>
                <li><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Precios</a></li>
                <li><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Seguridad</a></li>
              </ul>
            </div>
            <div>
              <h4 style={{ marginBottom: '10px' }}>Empresa</h4>
              <ul style={{ listStyle: 'none', padding: 0, color: '#b0b0b0' }}>
                <li><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Acerca de</a></li>
                <li><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Blog</a></li>
                <li><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Contacto</a></li>
              </ul>
            </div>
            <div>
              <h4 style={{ marginBottom: '10px' }}>Legal</h4>
              <ul style={{ listStyle: 'none', padding: 0, color: '#b0b0b0' }}>
                <li><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Privacidad</a></li>
                <li><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Términos</a></li>
                <li><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Cookies</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid #444', paddingTop: '20px' }}>
          <p>&copy; 2024 Adaptatec - Todos los derechos reservados</p>
          <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'center', gap: '20px' }}>
            <a href="#" style={{ color: '#b0b0b0', textDecoration: 'none' }}>Facebook</a>
            <a href="#" style={{ color: '#b0b0b0', textDecoration: 'none' }}>Twitter</a>
            <a href="#" style={{ color: '#b0b0b0', textDecoration: 'none' }}>LinkedIn</a>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      {loginModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '12px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <h2 style={{ marginBottom: '30px', textAlign: 'center', color: '#4f46e5' }}>
              Iniciar Sesión
            </h2>
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    boxSizing: 'border-box',
                    fontSize: '16px'
                  }}
                  required
                />
              </div>
              <div style={{ marginBottom: '30px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    boxSizing: 'border-box',
                    fontSize: '16px'
                  }}
                  required
                />
              </div>
              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#4f46e5',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  marginBottom: '10px',
                  fontWeight: 'bold',
                  fontSize: '16px'
                }}
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => setLoginModalOpen(false)}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#e5e7eb',
                  color: '#333',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '16px'
                }}
              >
                Cerrar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
