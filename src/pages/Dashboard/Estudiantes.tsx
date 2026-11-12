import { useNavigate } from "react-router-dom";
import { motion, Variants } from "framer-motion";
import { ArrowLeft } from "lucide-react";

const Estudiantes = () => {
  const navigate = useNavigate(); // Hook para movernos entre rutas

  // ✅ Lista actualizada con Inicial, Primaria y Secundaria en el orden solicitado
  const types = [
    {
      title: "Inicial",
      text: "Inscripción para educación inicial (Pre-escolar).",
      image: "./inicial.jpg",
      route: "/dashboard/estudiantes/inicial", 
    },
    {
      title: "Primaria",
      text: "Inscripción para estudiantes de educación primaria (1° a 6° grado).",
      image: "./primaria.jpg",
      route: "/dashboard/estudiantes/primaria", 
    },
    {
      title: "Secundaria",
      text: "Inscripción para estudiantes de secundaria o liceo.",
      image: "./secundaria.png",
      route: "/dashboard/estudiantes/secundaria",
    },
  ];

  // Variantes para que los elementos entren animados uno después del otro
  const containerVariants: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.15 } }, // Retardo entre hijos
  };

  // Animación para cada tarjeta individual
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 }, // Comienza abajo y transparente
    show: {
      opacity: 1,
      y: 0, // Termina arriba y visible
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

    {/* ======= TÍTULO Y TEXTO PRINCIPAL ======= */}
    <div className="flex flex-col items-center justify-center text-center mb-10">
      <motion.h1
        className="text-4xl md:text-5xl font-extrabold text-green-700 tracking-tight drop-shadow-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.6 } }}
      >
          Selecciona el tipo de inscripción
        </motion.h1>

        <motion.p
          className="text-gray-600 text-lg md:text-xl mt-3 max-w-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.3 } }}
        >
          Elige el nivel académico correspondiente para iniciar el proceso de inscripción.
        </motion.p>
      </div>

      {/* ✅ GRILLA ACTUALIZADA A 3 COLUMNAS PARA SOPORTAR LOS 3 NIVELES */}
      <motion.div
        variants={containerVariants}
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 justify-items-center max-w-6xl mx-auto"
      >
        {types.map((t, i) => (
          <motion.div
            key={i}
            variants={itemVariants} // Animación de entrada
            whileHover={{
              // Animación cuando pasas el mouse por encima
              scale: 1.05,
              y: -5,
              boxShadow: "0 20px 30px rgba(85,100,235,0.3), 0 10px 15px rgba(85,100,235,0.2)",
            }}
            onClick={() => navigate(t.route)} // Navega a la ruta configurada
            className="cursor-pointer relative bg-white rounded-2xl shadow-md hover:shadow-xl overflow-hidden w-full max-w-[350px] transition-all duration-300 group"
          >
            {/* Imagen del tipo de inscripción */}
            <div className="relative w-full h-48">
              <img
                src={t.image}
                alt={t.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {/* Degradado para que el texto se lea sin problema */}
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/70 to-transparent" />
            </div>

            {/* Texto de la tarjeta */}
            <div className="p-5 bg-white/90 backdrop-blur-sm text-left">
              <h2 className="text-green-700 font-semibold text-lg md:text-xl">{t.title}</h2>
              <p className="text-gray-600 text-sm md:text-base mt-2">{t.text}</p>
            </div>

            {/* Línea verde animada debajo al hacer hover */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-green-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default Estudiantes;