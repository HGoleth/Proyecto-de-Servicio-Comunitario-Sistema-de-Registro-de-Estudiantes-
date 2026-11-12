import { useNavigate } from "react-router-dom";
import { motion, Variants } from "framer-motion";

const GestionEstudiantes = () => {
  const navigate = useNavigate(); // Hook para navegar entre pantallas

  // aki c define las tarjetas "Gestión de Estudiantes".
  const modules = [
    {
      title: "Inscripción de Estudiantes",
      text: "Registra nuevos alumnos y elige primaria o secundaria.",
      image: "./students.jpg",
      route: "/dashboard/estudiantes", 
    },
    // --- NUEVA TARJETA AGREGADA ---
    {
      title: "Administración de Estudiantes",
      text: "Visualiza, edita y gestiona el listado de alumnos inscritos.",
      image: "./administracion.png",
      route: "/dashboard/estudiantes/administracion", // Ruta sugerida para la nueva pantalla
    },
  ];

  // Define la animacion general del contenedor.
  // StaggerChildren = hace que las tarjetas aparezcan una tras otra.
  const containerVariants: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.15 } },
  };

  // Animación de cada tarjeta individual.
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 }, // Entra desde abajo y transparente
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 200, damping: 20 },
    },
  };

  return (
    <motion.div
      className="w-full h-full flex flex-col p-6 md:p-10 bg-gray-50 overflow-y-auto"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* ===================== TÍTULO DEL MÓDULO ===================== */}
      <div className="flex flex-col items-center justify-center text-center mb-10">
        <motion.h1
          className="text-4xl md:text-5xl font-extrabold text-green-700 tracking-tight drop-shadow-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.6 } }}
        >
          Gestión de Estudiantes
        </motion.h1>

        <motion.p
          className="text-gray-600 text-lg md:text-xl mt-3 max-w-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.3 } }}
        >
          Selecciona una opción para continuar.
        </motion.p>
      </div>

      {/* ===================== TARJETAS ===================== */}
      <motion.div
        variants={containerVariants}
        className="grid gap-6 sm:grid-cols-2 justify-items-center"
      >
        {modules.map((mod, i) => (
          <motion.div
            key={i}
            variants={itemVariants} 
            whileHover={{
              scale: 1.05,
              y: -5,
              boxShadow: "0 20px 30px rgba(85,100,235,0.3), 0 10px 15px rgba(85,100,235,0.2)",
            }}
            onClick={() => navigate(mod.route)} 
            className="cursor-pointer relative bg-white rounded-2xl shadow-md hover:shadow-xl overflow-hidden w-full max-w-[350px] transition-all duration-300 group"
          >
            {/* Imagen de la tarjeta */}
            <div className="relative w-full h-48">
              <img
                src={mod.image}
                alt={mod.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {/* Degradado para mejorar la lectura del texto sobre la imagen */}
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/70 to-transparent" />
            </div>

            {/* Texto dentro de la tarjeta */}
            <div className="p-5 bg-white/90 backdrop-blur-sm">
              <h2 className="text-green-700 font-semibold text-lg md:text-xl">{mod.title}</h2>
              <p className="text-gray-600 text-sm md:text-base mt-2">{mod.text}</p>
            </div>

            {/* Línea verde animada en la parte inferior */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-green-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default GestionEstudiantes;