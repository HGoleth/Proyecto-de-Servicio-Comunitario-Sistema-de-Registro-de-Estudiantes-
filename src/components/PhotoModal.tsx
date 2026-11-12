import { useRef, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

// Props que recibe el modal
interface PhotoModalProps {
  image: string;
  onClose: () => void;
  onSave: (cropped: string) => void;
}

const PhotoModal = ({ image, onClose, onSave }: PhotoModalProps) => {
  // Referencia al canvas 
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // Referencia interna a la imagen cargada
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Estado para controlar el scale
  const [scale, setScale] = useState(1);
  // Posición de la imagen dentro del canvas
  const [position, setPosition] = useState({ x: 0, y: 0 });
  // Bandera para saber si el usuario está arrastrando la imagen
  const [drag, setDrag] = useState(false);
  // Guarda la posicion inicial donde empezó a arrastrar
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  // Función que dibuja la imagen en el canvas
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Tamaño del área donde editamos la foto
    canvas.width = 400;
    canvas.height = 500;

    // se limpia el canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Se calcula el tamaño real con zoom aplicado
    const w = img.width * scale;
    const h = img.height * scale;

    // Dibujamos la imagen con su zoom y su posición movida
    ctx.drawImage(img, position.x, position.y, w, h);
  }, [scale, position]);

  // Cada vez que cambia la imagen, el zoom o la posición se dibuja el canvas
  useEffect(() => {
    const img = new Image();
    img.src = image;

    // Cuando la imagen carga, la guardamos en la ref y la dibujamos en el canvas
    img.onload = () => {
      imgRef.current = img;
      draw();
    };
  }, [image, draw]);

  // Cuando el usuario hace clic para empezar a mover la imagen
  const handleMouseDown = (e: any) => {
    setDrag(true); // Activamos el modo "arrastrar"
    // c calcula desde dónde comenzó el movimiento respecto a la posición actual
    setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  // Mientras arrastra, actualizamos la posición de la imagen
  const handleMouseMove = (e: any) => {
    if (!drag) return; // Si no está arrastrando, no hace nada

    setPosition({
      x: e.clientX - startPos.x,
      y: e.clientY - startPos.y,
    });
  };

  // Cuando suelta el clic, deja de arrastrar
  const handleMouseUp = () => setDrag(false);

  // Guardar imagen recortada (lo que se ve en el canvas)
  const saveImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Convertimos lo que hay en pantalla a un string base64 (imagen)
    onSave(canvas.toDataURL("image/jpeg"));

    // Cerramos el modal
    onClose();
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Contenedor blanco del popup */}
      <motion.div
        className="bg-white p-4 rounded-xl shadow-xl max-w-md w-full"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
      >
        <h2 className="text-lg font-semibold mb-3 text-center">Editar Foto</h2>

        {/* Área donde se muestra el canvas */}
        <div
          className="border relative bg-gray-200 rounded overflow-hidden"
          onMouseDown={handleMouseDown}   // Comienza el arrastre
          onMouseMove={handleMouseMove}   // Mueve la imagen
          onMouseUp={handleMouseUp}       // Termina el arrastre
        >
          <canvas ref={canvasRef} />
        </div>

        {/* Botones de zoom */}
        <div className="flex justify-between mt-4">
          <button
            onClick={() => setScale(scale + 0.1)} // Aumentar zoom
            className="px-3 py-2 bg-gray-300 rounded"
          >
            Zoom +
          </button>

          <button
            onClick={() => setScale(scale - 0.1)} // Disminuir zoom
            className="px-3 py-2 bg-gray-300 rounded"
          >
            Zoom -
          </button>
        </div>

        {/* Botones Guardar & Cancelar */}
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onClose} // Cerrar modal sin guardar
            className="px-4 py-2 rounded bg-gray-400 text-white"
          >
            Cancelar
          </button>

          <button
            onClick={saveImage} // Guarda lo que hay en el canvas
            className="px-4 py-2 rounded bg-green-600 text-white"
          >
            Guardar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PhotoModal;
