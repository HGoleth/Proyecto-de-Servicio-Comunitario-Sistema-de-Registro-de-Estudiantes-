import { useNavigate } from "react-router-dom";
import { motion, Variants } from "framer-motion";
import { ArrowLeft } from "lucide-react";

const Archivos = () => {
  const navigate = useNavigate();

  // ✅ LISTA CORREGIDA: Solo Configuración y Formatos
  const items = [
    {
      title: "Configuración del Sistema",
      text: "Ajustes básicos y archivos fundamentales del sistema.",
      image: "./config_sistema.png",
      route: "/dashboard/archivos/sistema",
    },
    {
      title: "Formatos y Valores",
      text: "Encabezados, boletines, notas cualitativas y valores predeterminados.",
      image: "./formatos_valores.jpg",
      route: "/dashboard/archivos/formatos",
    },
    {
      title: "Pensum y Currículo",
      text: "Asignación de asignaturas, áreas y carga horaria por grado y periodo.",
      image: "./grades.jpg",
      route: "/dashboard/pensum",
    },
    {
      title: "Generador de Documentos",
      text: "Constancias de estudio, conducta, inscripción y plantillas automatizadas.",
      image: "./files.jpg",
      route: "/dashboard/documentos",
    },
  ];

  const containerVariants: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.15 } },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 200, damping: 20 },
    },
  };

  return (
    <motion.div
      className="w-full h-full flex flex-col p-6 md:p-10 bg-gray-50 overflow-y-auto relative text-left"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* ✅ BOTÓN DE NAVEGACIÓN UNIFICADO */}
      <div className="flex mb-4 max-w-5xl mx-auto w-full">
        <button 
          onClick={() => navigate("/dashboard")} 
          className="flex items-center gap-2 text-gray-400 hover:text-green-600 transition-all duration-300 group"
        >
          <div className="p-2 bg-white rounded-xl shadow-sm group-hover:shadow-md border border-gray-100 transition-all">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest leading-none">
            Volver al Home
          </span>
        </button>
      </div>

      <div className="flex flex-col items-center justify-center text-center mb-10">
        <motion.h1
          className="text-4xl md:text-5xl font-extrabold text-green-700 tracking-tight drop-shadow-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.6 } }}
        >
          Archivos del Sistema
        </motion.h1>

        <motion.p
          className="text-gray-600 text-lg md:text-xl mt-3 max-w-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, delay: 0.3 },
          }}
        >
          Selecciona una categoría para administrar la configuración y archivos
          principales del sistema.
        </motion.p>
      </div>

      {/* ✅ GRID AJUSTADO PARA 2 TARJETAS CENTRADAS */}
      <motion.div
        variants={containerVariants}
        className="grid gap-8 sm:grid-cols-2 justify-items-center max-w-4xl mx-auto"
      >
        {items.map((item, i) => (
          <motion.div
            key={i}
            variants={itemVariants}
            whileHover={{
              scale: 1.05,
              y: -5,
              boxShadow: "0 20px 30px rgba(85,100,235,0.3), 0 10px 15px rgba(85,100,235,0.2)",
            }}
            onClick={() => navigate(item.route)}
            className="cursor-pointer relative bg-white rounded-2xl shadow-md hover:shadow-xl overflow-hidden w-full max-w-[380px] transition-all duration-300 group"
          >
            <div className="relative w-full h-52">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/70 to-transparent" />
            </div>

            <div className="p-6 bg-white/90 backdrop-blur-sm">
              <h2 className="text-green-700 font-bold text-xl md:text-2xl">
                {item.title}
              </h2>
              <p className="text-gray-600 text-sm md:text-base mt-2 font-medium">
                {item.text}
              </p>
            </div>

            <div className="absolute bottom-0 left-0 w-full h-1 bg-green-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default Archivos;