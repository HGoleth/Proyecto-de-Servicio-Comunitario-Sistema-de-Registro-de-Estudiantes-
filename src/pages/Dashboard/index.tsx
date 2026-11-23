import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
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
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import Loader from "../../components/Loader";
import WindowControls from "../../components/common/WindowControls";

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

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

  useEffect(() => {
    if (window.electron) window.electron.setClickThrough(false);
    setLoading(false);
  }, []);

  // Doble clic en cabecera para alternar maximizar / restaurar
  const handleHeaderDoubleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, input, a, select")) return;
    if (window.electron?.maximize) {
      window.electron.maximize();
    }
  };

  // Determinar únicamente el ítem del menú con la coincidencia más específica (evita que dos botones se marquen activos a la vez)
  const activeMenuPath = menuItems
    .filter(
      (m) =>
        location.pathname === m.path ||
        location.pathname.startsWith(m.path + "/")
    )
    .sort((a, b) => b.path.length - a.path.length)[0]?.path || "/dashboard";

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
          className="flex flex-col items-center justify-center mt-6 mb-3 cursor-pointer relative shrink-0"
        >
          <div className="relative text-center">
            <div className="absolute inset-0 rounded-full blur-xl bg-green-400/60 animate-pulse" />
            <motion.img
              src="./logo.png"
              alt="Logo"
              className="relative w-14 h-14 object-contain hover:scale-110 transition-transform duration-300"
              whileTap={{ scale: 0.9 }}
            />
          </div>
        </motion.div>

        <nav className="flex-1 mt-1 pb-4 overflow-y-auto overflow-x-hidden scrollbar-hide px-3 space-y-1">
          {menuItems.map((item, i) => {
            const isActive = item.path === activeMenuPath;
            return (
              <div key={i} className="relative group">
                <motion.div
                  onClick={() => navigate(item.path)}
                  whileHover={{ scale: 1.02, x: 4 }}
                  className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
                    isActive
                      ? "bg-white/25 shadow-sm ring-1 ring-white/30"
                      : "hover:bg-white/15"
                  }`}
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

                {!sidebarOpen && (
                  <div className="fixed left-[90px] mt-[-45px] bg-white text-green-800 text-[11px] font-black py-2 px-4 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.2)] opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap z-[100] pointer-events-none border border-green-100 uppercase tracking-tighter transform scale-90 group-hover:scale-100">
                    {item.name}
                    <div className="absolute top-1/2 -left-1.5 -mt-1.5 w-3 h-3 bg-white transform rotate-45 border-l border-b border-green-100"></div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </motion.aside>

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        
        <header
          onDoubleClick={handleHeaderDoubleClick}
          className="flex justify-end items-center bg-white shadow-sm px-8 py-3 z-40 relative select-none"
          style={{ WebkitAppRegion: "drag" as any }}
        >
          <div className="flex items-center gap-4 text-left" style={{ WebkitAppRegion: "no-drag" as any }}>
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
