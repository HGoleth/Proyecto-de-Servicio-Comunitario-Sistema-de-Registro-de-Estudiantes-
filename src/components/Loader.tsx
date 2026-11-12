// framer-motion
import { motion, AnimatePresence } from "framer-motion";
// Importamos los hooks de React
import { useState, useEffect } from "react";

// Componente del loader 
const Loader = () => {
  //loader visible o no
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // temporizador
    const timer = setTimeout(() => setVisible(false), 1500); // duración visible antes del fade
    // limpieza del temporizador
    return () => clearTimeout(timer);
  }, []);

  return (
    // AnimatePresence 
    <AnimatePresence>
      {visible && (
        // Contenedor principal del loader
        <motion.div
          className="w-full h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-800 via-green-600 to-green-400 text-white fixed inset-0 z-50"
          initial={{ opacity: 1 }} // empieza visible
          animate={{ opacity: 1 }} // se mantiene visible un rato
          exit={{ opacity: 0 }} // se desvanece al salir
          transition={{ duration: 0.8, ease: "easeInOut" }} // animacion suave
        >
          {/* Logo animado */}
          <motion.img
            src="./logo.png"
            alt="Logo"
            initial={{ scale: 0, opacity: 0 }} // empieza chiquito y transparente
            animate={{ scale: 1, opacity: 1 }} // crece y se muestra
            transition={{ duration: 0.8, ease: "easeOut" }} // animación fluida
            className="w-36 mb-6 drop-shadow-[0_0_22px_rgba(255,255,255,0.45)] object-contain"
          />

          {/* Nombre del colegio */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }} // aparece desde abajo
            animate={{ opacity: 1, y: 0 }} // se coloca en su sitio
            transition={{ delay: 0.4, duration: 0.6 }} // entra despues del logo
            className="text-2xl font-bold tracking-wide text-center"
          >
            U.E. "REPÚBLICA DE CHILE"
          </motion.h1>

          {/* Barra animada tipo "loading" */}
          <motion.div
            className="mt-8 w-20 h-1.5 rounded-full bg-white/40 overflow-hidden"
            initial={{ width: 0 }} // empieza sin ancho
            animate={{ width: "5rem" }} // se expande a su tamaño
            transition={{ delay: 0.5, duration: 1.2 }} // un poco despues del texto
          >
            {/* Este div interno se mueve de lado a lado dando efecto de carga */}
            <motion.div
              className="h-full bg-white"
              animate={{ x: ["-100%", "100%"] }} // animacion continua de izquierda a derecha
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }} // se repite sin parar
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Exportamos el componente para usarlo en otras partes
export default Loader;
