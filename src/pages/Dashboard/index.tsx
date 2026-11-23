import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {

  FaBell,
  FaSignOutAlt,
  FaUserCog,
  FaUserGraduate,
  FaUsers,
  FaFileSignature
} from "react-icons/fa";
import {
  MdDashboard,
  MdPeople,
  MdSettings,
  MdAssessment,
  MdClass,
  MdHistoryEdu,
  MdMenuBook
} from "react-icons/md";
import { useNavigate, Outlet } from "react-router-dom";
import Loader from "../../components/Loader";
import WindowControls from "../../components/common/WindowControls";

// Interfaz para los datos del usuario
interface UserData {
  usuario: string; // username
  rol: string;
  nombre?: string;
  email?: string;
  id?: string;
}

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // --- ESTADOS DEL PERFIL ---
  const [profileOpen, setProfileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const profileRef = useRef<HTMLDivElement>(null); 

  const navigate = useNavigate();

  // ✅ MENÚ LATERAL ACTUALIZADO: SIN EXPEDIENTES NI REPORTES
  const menuItems = [
    { name: "Inicio", icon: <MdDashboard />, path: "/dashboard" },
    { name: "Inscripción", icon: <FaUserGraduate />, path: "/dashboard/estudiantes" },
    { name: "Gestión Estudiantes", icon: <MdPeople />, path: "/dashboard/estudiantes/administracion" },
    { name: "Gestión Representantes", icon: <FaUsers />, path: "/dashboard/representantes" },
    { name: "Distribución Académica", icon: <MdClass />, path: "/dashboard/archivos/distribucion" },
    { name: "Pensum y Currículo", icon: <MdMenuBook />, path: "/dashboard/pensum" },
    { name: "Control de Notas", icon: <MdHistoryEdu />, path: "/dashboard/notas" },
    { name: "Reportes Académicos", icon: <MdAssessment />, path: "/dashboard/reportes" },
    { name: "Generador Documentos", icon: <FaFileSignature />, path: "/dashboard/documentos" },
    { name: "Configuración Sistema", icon: <MdSettings />, path: "/dashboard/archivos" },
  ];

  const handleLogout = () => {
    if (window.electron?.close) {
      window.electron.close();
    } else {
      navigate("/dashboard");
    }
  };

  useEffect(() => {
    if (window.electron) window.electron.setClickThrough(false);
    const storedUser = localStorage.getItem("usuario_actual");
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch {
        const defaultUser = { usuario: "admin", rol: "director", nombre: "Administrador", email: "admin@escuela.com" };
        setCurrentUser(defaultUser);
        localStorage.setItem("usuario_actual", JSON.stringify(defaultUser));
      }
    } else {
      const defaultUser = { usuario: "admin", rol: "director", nombre: "Administrador", email: "admin@escuela.com" };
      setCurrentUser(defaultUser);
      localStorage.setItem("usuario_actual", JSON.stringify(defaultUser));
    }
    
    const handleUserUpdate = () => {
      const stored = localStorage.getItem("usuario_actual");
      if (stored) {
        try {
          setCurrentUser(JSON.parse(stored));
        } catch (e) {
          console.error("Error sincronizando usuario:", e);
        }
      }
    };
    window.addEventListener("user_updated", handleUserUpdate);
    window.addEventListener("storage", handleUserUpdate);

    const timer = setTimeout(() => setLoading(false), 500);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("user_updated", handleUserUpdate);
      window.removeEventListener("storage", handleUserUpdate);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileOpen && profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

  // Doble clic en cabecera para alternar maximizar / restaurar
  const handleHeaderDoubleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, input, a, select")) return;
    if (window.electron?.maximize) {
      window.electron.maximize();
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden text-left font-sans">

      {/* SIDEBAR */}
      <motion.aside
        animate={{ width: sidebarOpen ? 260 : 80 }}
        className="bg-gradient-to-b from-green-800 via-green-700 to-green-600 text-white flex flex-col shadow-[4px_0_20px_rgba(0,0,0,0.15)] transition-all duration-300 relative z-50"
      >
        <motion.div
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex flex-col items-center justify-center mt-10 mb-6 cursor-pointer relative"
        >
          <div className="relative text-center">
            <div className="absolute inset-0 rounded-full blur-xl bg-green-400/60 animate-pulse" />
            <motion.img
              src="./logo.png"
              alt="Logo"
              className="relative w-16 h-16 object-contain hover:scale-110 transition-transform duration-300"
              whileTap={{ scale: 0.9 }}
            />
          </div>
        </motion.div>

        <nav className="flex-1 mt-3 overflow-y-auto overflow-x-hidden scrollbar-hide px-3">
          {menuItems.map((item, i) => (
            <div key={i} className="relative group">
              <motion.div
                onClick={() => navigate(item.path)}
                whileHover={{ scale: 1.02, x: 4, backgroundColor: "rgba(255, 255, 255, 0.15)" }}
                className="flex items-center gap-3 p-3 my-1 rounded-xl cursor-pointer transition-all duration-200"
              >
                <div className="text-xl min-w-[24px] flex justify-center text-white">
                  {item.icon}
                </div>

                {sidebarOpen && (
                  <motion.span
                    animate={{ opacity: 1 }}
                    initial={{ opacity: 0 }}
                    className="text-sm font-medium whitespace-nowrap truncate text-white"
                  >
                    {item.name}
                  </motion.span>
                )}
              </motion.div>

              {/* ✅ MENSAJE FLOTANTE (TOOLTIP) CORREGIDO CON POSICIÓN FIXED */}
              {!sidebarOpen && (
                <div className="fixed left-[90px] mt-[-45px] bg-white text-green-800 text-[11px] font-black py-2 px-4 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.2)] opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap z-[100] pointer-events-none border border-green-100 uppercase tracking-tighter transform scale-90 group-hover:scale-100">
                  {item.name}
                  <div className="absolute top-1/2 -left-1.5 -mt-1.5 w-3 h-3 bg-white transform rotate-45 border-l border-b border-green-100"></div>
                </div>
              )}
            </div>
          ))}
        </nav>
      </motion.aside>

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        
        <header
          onDoubleClick={handleHeaderDoubleClick}
          className="flex justify-between items-center bg-white shadow-sm px-8 py-3.5 z-40 relative select-none"
          style={{ WebkitAppRegion: "drag" as any }}
        >
          <div className="flex items-center gap-4 text-left" style={{ WebkitAppRegion: "no-drag" as any }}>
          </div>

          <div className="flex items-center gap-4 text-left" style={{ WebkitAppRegion: "no-drag" as any }}>
            <button className="relative text-gray-400 hover:text-green-600 transition p-2.5 rounded-xl hover:bg-gray-50 text-left">
              <FaBell size={20} />
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white text-left"></span>
            </button>

            <div className="relative text-left" ref={profileRef}>
              <button 
                onClick={(e) => {
                  e.stopPropagation(); 
                  setProfileOpen(!profileOpen);
                }}
                className="flex items-center gap-3 focus:outline-none group p-1.5 rounded-2xl hover:bg-gray-50 transition border border-transparent hover:border-gray-100 text-left"
              >
                <div className="text-right hidden md:block text-left">
                  <p className="text-xs font-black text-gray-700 group-hover:text-green-700 transition uppercase tracking-tighter text-left">
                    {currentUser?.usuario || "Admin"}
                  </p>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-none text-left">
                    {currentUser?.rol || "Director"}
                  </p>
                </div>
                
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-green-600 to-green-400 flex items-center justify-center text-white font-black shadow-lg ring-2 ring-transparent group-hover:ring-green-100 transition-all italic text-lg text-left">
                  {currentUser?.nombre ? currentUser.nombre.charAt(0).toUpperCase() : "A"}
                </div>
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-3 w-64 bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden origin-top-right z-[100] p-2 text-left"
                  >
                    <div className="p-5 border-b border-gray-50 bg-gray-50/50 rounded-t-[1.5rem] mb-2 text-left">
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1 text-left">Usuario Activo</p>
                      <p className="text-sm font-bold text-gray-800 text-left">{currentUser?.usuario || "Admin"}</p>
                      <p className="text-[10px] text-gray-500 truncate text-left">{currentUser?.email || "admin@escuela.com"}</p>
                    </div>

                    <div className="space-y-1 text-left">
                      <button 
                        onClick={() => {
                          setProfileOpen(false);
                          navigate("/dashboard/configuracion");
                        }}
                        className="flex items-center w-full px-4 py-3 text-sm text-gray-600 hover:bg-green-50 hover:text-green-700 rounded-2xl transition-colors gap-3 font-medium text-left"
                      >
                        <FaUserCog className="text-lg opacity-70" />
                        Perfil de Usuario
                      </button>

                      <button 
                        onClick={() => {
                          setProfileOpen(false);
                          navigate("/dashboard/archivos/sistema");
                        }}
                        className="flex items-center w-full px-4 py-3 text-sm text-gray-600 hover:bg-green-50 hover:text-green-700 rounded-2xl transition-colors gap-3 font-medium text-left"
                      >
                        <MdSettings className="text-lg opacity-70" />
                        Ajustes del Sistema
                      </button>
                    </div>

                    <div className="mt-2 pt-2 border-t border-gray-100 text-left">
                      <button 
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-3 text-sm text-red-500 hover:bg-red-50 rounded-2xl transition-colors gap-3 font-black uppercase tracking-tighter italic text-left"
                      >
                        <FaSignOutAlt className="text-lg" />
                        Salir del Sistema
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* SEPARADOR Y CONTROLES DE VENTANA */}
            <div className="h-6 w-[1px] bg-gray-200 ml-1"></div>
            <WindowControls variant="header" />
          </div>
        </header>

        {/* CONTENIDO DE LA PÁGINA */}
        <main className="flex-1 overflow-y-auto bg-[#f4f6fb] p-6 scrollbar-thin scrollbar-thumb-gray-200 text-left">
          <Outlet /> 
        </main>
      </div>
    </div>
  );
};

export default Dashboard;