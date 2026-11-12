import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Settings,
  FileCog,
  Database,
  Save,
  Building2,
  UploadCloud,
  FileText,
  Trash2,
  ShieldCheck,
  Download,
  X,
  Loader2,
  Phone,
  Mail,
  MapPin,
  RefreshCcw,
  ArrowLeft,
  Upload,
  CheckCircle,
  AlertTriangle
} from "lucide-react";

const fadeIn: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const ConfigSistema = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [docs, setDocs] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);
  
  const [modalNotify, setModalNotify] = useState<{ show: boolean; type: "success" | "error" | "warning"; title: string; message: string }>({
    show: false,
    type: "success",
    title: "",
    message: ""
  });

  const [config, setConfig] = useState({
    nombre_colegio: "",
    periodo: "",
    direccion: "",
    telefono: "",
    email: "",
    codigo_plantel: "",
    director: ""
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    const data = await (window as any).electron.getConfig();
    if (data) {
      setConfig(data);
      if (data.documentos_fundamentales) setDocs(data.documentos_fundamentales);
    }
  };

  const showNotification = (type: "success" | "error" | "warning", title: string, message: string) => {
    setModalNotify({ show: true, type, title, message });
  };

  const handleUpdateConfig = async () => {
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
      showNotification("success", "¡Guardado!", "La configuración institucional se ha actualizado correctamente.");
    } else {
      showNotification("error", "Error", "No se pudo guardar la configuración.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== "application/pdf") {
      if(file) showNotification("warning", "Formato Inválido", "Solo se permiten archivos en formato PDF.");
      return;
    }

    setLoadingFile(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const res = await (window as any).electron.uploadFundamentalDoc({
        name: file.name,
        base64: reader.result
      });
      if (res.success) {
        setDocs(prev => [...prev, res.documento]);
        showNotification("success", "Archivo Subido", "El documento ha sido registrado exitosamente.");
      }
      setLoadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
  };

  const handleDeleteDoc = async (id: number) => {
    const res = await (window as any).electron.deleteFundamentalDoc(id);
    if (res.success) {
      setDocs(prev => prev.filter(d => d.id !== id));
      showNotification("success", "Eliminado", "El documento ha sido removido del sistema.");
    }
  };

  const handleBackup = async () => {
    const res = await (window as any).electron.createBackup();
    if (res.success) {
      showNotification("success", "Respaldo Creado", `Copia de seguridad guardada en: ${res.path}`);
    } else {
      showNotification("error", "Error de Respaldo", "No se pudo generar la copia de seguridad.");
    }
  };

  const menuItems = [
    { id: "ajustes", label: "Ajustes Básicos", icon: <Settings size={22} />, description: "Identidad y datos del plantel." },
    { id: "archivos", label: "Archivos Fundamentales", icon: <FileCog size={22} />, description: "PEIC y reglamentos internos." },
    { id: "backup", label: "Respaldo y Seguridad", icon: <Database size={22} />, description: "Gestión de base de datos y copias." }
  ];

  return (
    <motion.div className="p-6 md:p-10 max-w-5xl mx-auto" variants={fadeIn} initial="hidden" animate="visible">
      
      {/* ✅ NAVEGACIÓN SUPERIOR DOBLE AÑADIDA */}
      <div className="flex flex-col gap-2 mb-6 w-full">
        <div className="flex items-center gap-4">
          {/* Regresar al Dashboard principal */}
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

          <div className="h-4 w-px bg-gray-300" />

          {/* Regresar al menú de Archivos */}
          <button 
            onClick={() => navigate("/dashboard/archivos")} 
            className="flex items-center gap-2 text-gray-400 hover:text-blue-600 transition-all duration-300 group"
          >
            <div className="p-2 bg-white rounded-xl shadow-sm group-hover:shadow-md border border-gray-100 transition-all">
              <FileCog size={16} className="group-hover:rotate-12 transition-transform text-blue-500" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest leading-none">
              Volver a Archivos
            </span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {modalNotify.show && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full text-center relative overflow-hidden"
            >
              <div className={`absolute top-0 left-0 w-full h-2 ${modalNotify.type === "success" ? "bg-green-500" : modalNotify.type === "error" ? "bg-red-500" : "bg-yellow-500"}`} />
              
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${modalNotify.type === "success" ? "bg-green-100 text-green-600" : modalNotify.type === "error" ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-600"}`}>
                {modalNotify.type === "success" ? <CheckCircle size={32} /> : <AlertTriangle size={32} />}
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-2">{modalNotify.title}</h3>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">{modalNotify.message}</p>

              <button 
                onClick={() => setModalNotify({ ...modalNotify, show: false })}
                className={`w-full py-3 rounded-xl font-bold text-white transition-all shadow-lg ${modalNotify.type === "success" ? "bg-green-600 hover:bg-green-700 hover:shadow-green-200" : "bg-gray-800 hover:bg-gray-900 shadow-gray-200"}`}
              >
                Aceptar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <h1 className="text-3xl font-extrabold text-green-700">Configuración del Sistema</h1>
      <p className="mt-2 text-gray-600">Administra los parámetros institucionales y seguridad de datos.</p>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {menuItems.map((item) => (
          <motion.div
            key={item.id}
            whileHover={{ scale: 1.03 }}
            onClick={() => setSelected(item.id)}
            className={`cursor-pointer p-6 rounded-2xl border transition-all shadow-sm ${
              selected === item.id ? "bg-green-600 text-white border-green-600 shadow-green-200" : "bg-white text-gray-700 border-green-100 hover:shadow-md"
            }`}
          >
            <div className={`${selected === item.id ? "text-white" : "text-green-700"} mb-3`}>{item.icon}</div>
            <h3 className="font-bold text-lg">{item.label}</h3>
            <p className={`text-xs mt-1 ${selected === item.id ? "text-green-100" : "text-gray-500"}`}>{item.description}</p>
          </motion.div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {selected && (
          <motion.div key={selected} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="mt-10 bg-white p-8 rounded-3xl shadow-xl border border-green-50 relative">
            <button onClick={() => setSelected(null)} className="absolute top-6 right-6 text-gray-400 hover:text-red-500 transition"><X size={24}/></button>
            
            {selected === "ajustes" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-green-800 flex items-center gap-2"><Building2/> Ajustes Institucionales</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Nombre del Plantel</label>
                    <div className="relative">
                      <Building2 size={16} className="absolute left-3 top-3 text-gray-400"/>
                      <input type="text" value={config.nombre_colegio} onChange={e => setConfig({...config, nombre_colegio: e.target.value})} className="w-full border pl-10 pr-3 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-green-500"/>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Año Escolar Activo</label>
                    <input type="text" value={config.periodo} onChange={e => setConfig({...config, periodo: e.target.value})} className="w-full border p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-green-500" placeholder="Ej: 2025-2026"/>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Código del Plantel (DEA)</label>
                    <input type="text" value={config.codigo_plantel || ""} onChange={e => setConfig({...config, codigo_plantel: e.target.value})} className="w-full border p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-green-500"/>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Nombre del Director(a)</label>
                    <input type="text" value={config.director || ""} onChange={e => setConfig({...config, director: e.target.value})} className="w-full border p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-green-500"/>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase text-green-600">Teléfono de Contacto</label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3 top-3 text-green-600 opacity-50"/>
                      <input type="text" value={config.telefono || ""} onChange={e => setConfig({...config, telefono: e.target.value})} className="w-full border pl-10 pr-3 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-green-500"/>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase text-green-600">Email Institucional</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-3 text-green-600 opacity-50"/>
                      <input type="email" value={config.email || ""} onChange={e => setConfig({...config, email: e.target.value})} className="w-full border pl-10 pr-3 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-green-500"/>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><MapPin size={10}/> Dirección Completa</label>
                    <textarea value={config.direccion} onChange={e => setConfig({...config, direccion: e.target.value})} className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-sm" rows={2}/>
                </div>
                <button onClick={handleUpdateConfig} className="flex items-center gap-2 bg-green-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-green-700 transition">
                  <Save size={20}/> Guardar Información Institucional
                </button>
              </div>
            )}

            {selected === "archivos" && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-green-800 flex items-center gap-2"><FileCog/> Documentos Legales y Base</h2>
                <div onClick={() => !loadingFile && fileInputRef.current?.click()} className={`border-2 border-dashed border-green-200 bg-green-50 rounded-2xl p-10 text-center transition group relative ${loadingFile ? 'opacity-50' : 'cursor-pointer hover:bg-green-100'}`}>
                  <input type="file" className="hidden" ref={fileInputRef} accept=".pdf" onChange={handleFileUpload} />
                  {loadingFile ? <Loader2 size={48} className="mx-auto text-green-600 mb-2 animate-spin" /> : <UploadCloud size={48} className="mx-auto text-green-600 mb-2 group-hover:scale-110 transition" />}
                  <p className="font-bold text-green-700">Subir Reglamento, PEIC o Manuales (PDF)</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {docs.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl border border-gray-100 hover:border-green-200 transition">
                      <div className="flex items-center gap-3 truncate">
                        <FileText className="text-red-500 flex-shrink-0" size={24}/>
                        <div className="truncate">
                          <p className="font-bold text-sm text-gray-700 truncate">{doc.nombre}</p>
                          <p className="text-[10px] text-gray-400">Registrado: {doc.fecha}</p>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteDoc(doc.id)} className="text-gray-300 hover:text-red-500 transition p-2 hover:bg-red-50 rounded-full"><Trash2 size={18}/></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selected === "backup" && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-green-600 to-green-800 p-8 rounded-3xl text-white shadow-xl flex flex-col justify-between">
                    <div>
                      <ShieldCheck size={48} className="mb-4 opacity-50" />
                      <h3 className="text-2xl font-bold mb-2">Crear Respaldo Local</h3>
                      <p className="text-sm text-green-100 mb-8">Genera una copia exacta de la base de datos en la carpeta de seguridad.</p>
                    </div>
                    {/* Botón de Respaldo con Framer Motion */}
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleBackup} 
                      className="w-full bg-white text-green-700 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-green-50 transition shadow-lg"
                    >
                      <Download size={20}/> Iniciar Respaldo Ahora
                    </motion.button>
                  </div>

                  <div className="bg-white border-2 border-green-100 p-8 rounded-3xl flex flex-col justify-between shadow-sm">
                    <div>
                      <RefreshCcw size={48} className="text-green-600 mb-4 opacity-50" />
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">Restauración</h3>
                      <p className="text-sm text-gray-500 mb-8">Seleccione un archivo de respaldo previo para sobrescribir los datos actuales.</p>
                    </div>
                    <div className="space-y-3">
                       <input type="file" ref={backupInputRef} className="hidden" accept=".json" onChange={() => showNotification("warning", "Atención", "⚠️ ESTA ACCIÓN REEMPLAZARÁ TODOS LOS DATOS ACTUALES.")} />
                       {/* Botón de Restauración con Framer Motion */}
                       <motion.button 
                         whileHover={{ scale: 1.02 }}
                         whileTap={{ scale: 0.98 }}
                         onClick={() => backupInputRef.current?.click()} 
                         className="w-full border-2 border-green-600 text-green-700 py-4 rounded-2xl font-bold hover:bg-green-50 transition flex items-center justify-center gap-2"
                       >
                         <Upload size={20}/> Seleccionar Archivo JSON
                       </motion.button>
                       <p className="text-[10px] text-red-500 font-bold text-center uppercase tracking-tighter">⚠️ ESTA ACCIÓN REEMPLAZARÁ TODOS LOS DATOS ACTUALES.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 border border-orange-200 p-4 rounded-2xl flex gap-4 items-start shadow-sm">
                   <ShieldCheck className="text-orange-600 flex-shrink-0" size={24}/>
                   <div>
                     <p className="text-xs font-bold text-orange-800 uppercase tracking-widest">CONSEJO DE SEGURIDAD</p>
                     <p className="text-xs text-orange-700 leading-relaxed">
                       Se recomienda realizar respaldos semanales y guardarlos en una unidad de almacenamiento externa (USB) para mayor seguridad.
                     </p>
                   </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ConfigSistema;