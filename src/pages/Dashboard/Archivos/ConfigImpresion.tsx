import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, FileCog, Printer, Save, CheckCircle } from "lucide-react";

const ConfigImpresion = () => {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [prefs, setPrefs] = useState(() => {
    try {
      const raw = localStorage.getItem("config_impresion_institucional");
      if (raw) return JSON.parse(raw);
    } catch (err) {
      console.error("Error leyendo preferencias de impresión:", err);
    }
    return {
      paperSize: "Carta",
      orientation: "portrait",
      marginMm: 20,
      includeWatermark: false,
      autoOpenPdf: true
    };
  });

  const handleSave = () => {
    localStorage.setItem("config_impresion_institucional", JSON.stringify(prefs));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 md:p-10 max-w-4xl mx-auto text-left"
    >
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-gray-400 hover:text-green-600 transition-all group"
        >
          <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100">
            <ArrowLeft size={16} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">Volver al Home</span>
        </button>
        <div className="h-4 w-px bg-gray-300" />
        <button
          onClick={() => navigate("/dashboard/archivos")}
          className="flex items-center gap-2 text-gray-400 hover:text-blue-600 transition-all group"
        >
          <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100">
            <FileCog size={16} className="text-blue-500" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">Volver a Archivos</span>
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-xl border border-gray-100 space-y-8">
        <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
          <div className="p-4 bg-green-50 text-green-600 rounded-2xl">
            <Printer size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-800 uppercase tracking-tighter">
              Configuración de Impresión
            </h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
              Parámetros predeterminados para boletines, actas y constancias
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Tamaño de Hoja Predeterminado
            </label>
            <select
              value={prefs.paperSize}
              onChange={(e) => setPrefs({ ...prefs, paperSize: e.target.value })}
              className="w-full p-3.5 rounded-2xl bg-gray-50 border border-gray-200 font-bold text-sm text-gray-700 outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="Carta">Carta (Letter - 21.59 x 27.94 cm)</option>
              <option value="Oficio">Oficio (Legal - 21.59 x 35.56 cm)</option>
              <option value="A4">ISO A4 (21.00 x 29.70 cm)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Orientación de Página
            </label>
            <select
              value={prefs.orientation}
              onChange={(e) => setPrefs({ ...prefs, orientation: e.target.value })}
              className="w-full p-3.5 rounded-2xl bg-gray-50 border border-gray-200 font-bold text-sm text-gray-700 outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="portrait">Vertical (Retrato)</option>
              <option value="landscape">Horizontal (Apaisado)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Margen Estándar (mm)
            </label>
            <input
              type="number"
              min={5}
              max={40}
              value={prefs.marginMm}
              onChange={(e) => setPrefs({ ...prefs, marginMm: Number(e.target.value) || 20 })}
              className="w-full p-3.5 rounded-2xl bg-gray-50 border border-gray-200 font-bold text-sm text-gray-700 outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          {saved ? (
            <span className="flex items-center gap-2 text-green-600 text-xs font-black uppercase">
              <CheckCircle size={16} /> Preferencias de impresión guardadas
            </span>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all"
          >
            <Save size={18} /> Guardar Preferencias
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ConfigImpresion;
