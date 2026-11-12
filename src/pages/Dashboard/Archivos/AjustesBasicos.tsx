import { useState, useEffect } from "react";
import { Save, Building2, MapPin } from "lucide-react";

const AjustesBasicos = () => {
  const [config, setConfig] = useState({
    nombre_colegio: "",
    periodo: "",
    direccion: "",
    telefono: "",
    email: ""
  });

  // Cargar datos actuales de la DB al montar
  useEffect(() => {
    const loadConfig = async () => {
      
      const data = await (window as any).electron.getConfig();
      if (data) setConfig(data);
    };
    loadConfig();
  }, []);

  const handleSave = async () => {
    const res = await (window as any).electron.updateConfig(config);
    if (res.success) {
      if (config.periodo) {
        localStorage.setItem("sistema_periodo_activo", config.periodo);
      }
      try {
        localStorage.setItem("sistema_config", JSON.stringify(config));
      } catch (err) {
        console.error("Error guardando config en localStorage:", err);
      }
      window.dispatchEvent(new CustomEvent("config_updated", { detail: config }));
      window.dispatchEvent(new Event("storage"));
      alert("Configuración actualizada correctamente");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-500 uppercase flex items-center gap-2">
            <Building2 size={16}/> Nombre de la Institución
          </label>
          <input 
            type="text" 
            value={config.nombre_colegio}
            onChange={(e) => setConfig({...config, nombre_colegio: e.target.value})}
            className="w-full border p-2.5 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-500 uppercase flex items-center gap-2">
            Año Escolar Activo
          </label>
          <input 
            type="text" 
            value={config.periodo}
            onChange={(e) => setConfig({...config, periodo: e.target.value})}
            className="w-full border p-2.5 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
            placeholder="Ej: 2025-2026"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-gray-500 uppercase flex items-center gap-2">
          <MapPin size={16}/> Dirección Física
        </label>
        <textarea 
          value={config.direccion}
          onChange={(e) => setConfig({...config, direccion: e.target.value})}
          className="w-full border p-2.5 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
          rows={2}
        />
      </div>

      <div className="flex justify-end pt-4">
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 bg-green-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-green-700 transition shadow-lg shadow-green-100"
        >
          <Save size={18}/> Guardar Cambios
        </button>
      </div>
    </div>
  );
};

export default AjustesBasicos;