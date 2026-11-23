import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom"; 
import { 
  FileText, 
  ListChecks, 
  Type, 
  X, 
  Save, 
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Calculator,
  GraduationCap,
  School,
  FileCog,
  Baby
} from "lucide-react";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const FormatosValores = () => {
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const navigate = useNavigate(); 
  const [selected, setSelected] = useState<string | null>("notas");
  const [modalNotify, setModalNotify] = useState({ show: false, type: "success", title: "", message: "" });
  const [guardandoEncabezado, setGuardandoEncabezado] = useState(false);

  // ✅ ESTADOS PARA NOTAS Y CALCULADORA (3 LAPSOS FIJOS)
  const [nivel, setNivel] = useState<"inicial" | "primaria" | "secundaria">("primaria");
  const [listaNotas, setListaNotas] = useState(["", "", ""]);

  // ✅ ESTADO DEL MEMBRETE UNIFICADO
  useEffect(() => {
    const saved = localStorage.getItem("membrete_institucional");
    if (saved) {
      try {
        setMembrete(JSON.parse(saved));
      } catch (e) { console.error("Error al cargar membrete:", e); }
    }
  }, []);

  const [membrete, setMembrete] = useState({
    linea1: "REPÚBLICA BOLIVARIANA DE VENEZUELA",
    linea2: "MINISTERIO DEL PODER POPULAR PARA LA EDUCACIÓN",
    linea3: "DIRECCIÓN SECTORIAL DE EDUCACIÓN",
    nombreInstitucion: 'U.E. "REPÚBLICA DE CHILE"',
    ubicacion: "EL ESPINAL - MUNICIPIO DÍAZ",
  });

  const menuItems = [
    { 
      id: "encabezados", 
      label: "Encabezados", 
      icon: <Type size={22} />, 
      description: "Títulos y membretes para documentos oficiales." 
    },
    { 
      id: "notas", 
      label: "Escalas y Cualitativas", 
      icon: <ListChecks size={22} />, 
      description: "Valores para boletas y literales de rendimiento." 
    }
  ];

  // ✅ LÓGICA DE LA CALCULADORA QUE CAMBIA SEGÚN EL NIVEL
  const calcularPromedio = () => {
    if (nivel === "primaria" || nivel === "inicial") {
      // Mapeo cualitativo para promediar literales
      const equivalencias: { [key: string]: number } = { A: 5, B: 4, C: 3, D: 2, E: 1 };
      const puntos = listaNotas
        .map(l => equivalencias[l.toUpperCase()] || 0)
        .filter(p => p > 0);
      
      if (puntos.length === 0) return "-";
      
      const promedioNum = Math.round(puntos.reduce((a, b) => a + b, 0) / puntos.length);
      // Retorna la letra correspondiente al promedio redondeado
      return Object.keys(equivalencias).find(key => equivalencias[key] === promedioNum) || "-";
    } else {
      // Lógica numérica para secundaria (01-20)
      const valores = listaNotas
        .map(n => parseFloat(n))
        .filter(n => !isNaN(n) && n >= 0 && n <= 20);
      
      if (valores.length === 0) return "0.00";
      
      const result = valores.reduce((a, b) => a + b, 0) / valores.length;
      return result.toFixed(2);
    }
  };

  // ✅ MANEJADOR DE ENTRADA CON VALIDACIÓN
  const handleInputChange = (index: number, value: string) => {
    const nuevasNotas = [...listaNotas];
    if (nivel === "primaria" || nivel === "inicial") {
      const letra = value.toUpperCase().trim().slice(-1);
      if (["A", "B", "C", "D", "E", ""].includes(letra)) {
        nuevasNotas[index] = letra;
      }
    } else {
      if (value === "" || (parseFloat(value) >= 0 && parseFloat(value) <= 20)) {
        nuevasNotas[index] = value;
      }
    }
    setListaNotas(nuevasNotas);
  };

  const handlePreviewPDF = () => {
    setShowPDFPreview(true);
  };

  const showNotification = (type: any, title: string, message: string) => {
    setModalNotify({ show: true, type, title, message });
  };

  const guardarEncabezado = async () => {
    setGuardandoEncabezado(true);
    try {
      localStorage.setItem("membrete_institucional", JSON.stringify(membrete));
      if ((window as any).electron?.updateConfig) {
        await (window as any).electron.updateConfig({ membrete });
      }
      showNotification("success", "Encabezados Guardados", "Los membretes han sido actualizados y guardados exitosamente.");
    } catch {
      showNotification("error", "Error", "No se pudo guardar el membrete.");
    } finally {
      setGuardandoEncabezado(false);
    }
  };

  return (
    <motion.div className="p-6 md:p-10 max-w-5xl mx-auto text-left" variants={fadeIn} initial="hidden" animate="visible">
      
      {/* ✅ NAVEGACIÓN SUPERIOR UNIFICADA */}
      <div className="flex flex-col gap-2 mb-8 w-full">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-gray-400 hover:text-green-600 transition-all group">
            <div className="p-2 bg-white rounded-xl shadow-sm group-hover:shadow-md border border-gray-100 transition-all">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest leading-none">Volver al Home</span>
          </button>
          <div className="h-4 w-px bg-gray-300" />
          <button onClick={() => navigate("/dashboard/archivos")} className="flex items-center gap-2 text-gray-400 hover:text-blue-600 transition-all group">
            <div className="p-2 bg-white rounded-xl shadow-sm group-hover:shadow-md border border-gray-100 transition-all">
              <FileCog size={16} className="group-hover:rotate-12 transition-transform text-blue-500" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest leading-none">Volver a Archivos</span>
          </button>
        </div>
      </div>

      {/* Notificación Flotante */}
      <AnimatePresence>
        {modalNotify.show && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 text-center">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-[2rem] p-8 shadow-2xl max-w-sm w-full relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-full h-2 ${modalNotify.type === "success" ? "bg-green-500" : "bg-yellow-500"}`} />
              <div className="flex justify-center mb-4">
                {modalNotify.type === "success" ? <CheckCircle className="text-green-500" size={48} /> : <AlertTriangle className="text-yellow-500" size={48} />}
              </div>
              <h3 className="text-xl font-black text-gray-800 mb-2 uppercase tracking-tighter">{modalNotify.title}</h3>
              <p className="text-gray-500 text-xs font-bold leading-relaxed mb-6">{modalNotify.message}</p>
              <button onClick={() => setModalNotify({ ...modalNotify, show: false })} className="w-full py-3 rounded-xl bg-gray-800 text-white font-bold hover:bg-gray-900 transition-all text-[10px] uppercase tracking-widest">Aceptar</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="mb-8">
        <h1 className="text-4xl font-black text-green-700 uppercase tracking-tighter mb-2">Formatos y Valores</h1>
        <p className="text-gray-500 font-bold italic text-sm">Configura la identidad de los reportes y criterios de evaluación.</p>
      </div>

      {/* Menú Principal */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
        {menuItems.map((item) => (
          <motion.div
            key={item.id}
            whileHover={{ scale: 1.03 }}
            onClick={() => setSelected(item.id)}
            className={`cursor-pointer p-6 rounded-3xl border transition-all ${
              selected === item.id ? "bg-green-600 text-white border-green-600 shadow-xl" : "bg-white text-gray-700 border-gray-100 hover:shadow-md"
            }`}
          >
            <div className={`${selected === item.id ? "text-white" : "text-green-700"} mb-3`}>{item.icon}</div>
            <h3 className="font-black text-xs uppercase tracking-widest leading-none">{item.label}</h3>
            <p className={`text-[10px] mt-1 font-bold ${selected === item.id ? "text-green-100" : "text-gray-500"}`}>{item.description}</p>
          </motion.div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {selected && (
          <motion.div key={selected} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="mt-10 bg-white p-8 rounded-[2.5rem] shadow-xl border border-green-50 relative">
            <button onClick={() => setSelected(null)} className="absolute top-8 right-8 text-gray-400 hover:text-red-500 transition"><X size={24}/></button>

            {/* SECCIÓN ENCABEZADOS */}
            {selected === "encabezados" && (
              <div className="space-y-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 text-green-700 rounded-2xl">
                    <Type size={24}/>
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Membrete de Reportes Oficiales</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Edición de encabezados institucionales</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">País / Nación (Línea 1)</label>
                      <input type="text" value={membrete.linea1} onChange={(e) => setMembrete({...membrete, linea1: e.target.value.toUpperCase()})} className="w-full border p-3.5 rounded-2xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 outline-none text-[11px] font-black transition-all" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Ministerio (Línea 2)</label>
                      <input type="text" value={membrete.linea2} onChange={(e) => setMembrete({...membrete, linea2: e.target.value.toUpperCase()})} className="w-full border p-3.5 rounded-2xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 outline-none text-[11px] font-black transition-all" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Dirección / Zona (Línea 3)</label>
                      <input type="text" value={membrete.linea3} onChange={(e) => setMembrete({...membrete, linea3: e.target.value.toUpperCase()})} className="w-full border p-3.5 rounded-2xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 outline-none text-[11px] font-black transition-all" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Nombre de la Institución</label>
                      <input type="text" value={membrete.nombreInstitucion} onChange={(e) => setMembrete({...membrete, nombreInstitucion: e.target.value.toUpperCase()})} className="w-full border p-3.5 rounded-2xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 outline-none text-[11px] font-black transition-all" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Ubicación Geográfica</label>
                      <input type="text" value={membrete.ubicacion} onChange={(e) => setMembrete({...membrete, ubicacion: e.target.value.toUpperCase()})} className="w-full border p-3.5 rounded-2xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 outline-none text-[11px] font-black transition-all" />
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-[2.5rem] p-8 border-2 border-dashed border-gray-200 flex flex-col min-h-[350px]">
                    <p className="text-[9px] font-black text-gray-300 uppercase mb-8 tracking-[0.3em] text-center w-full">Vista Previa de Impresión</p>
                    
                    <div className="flex items-start gap-4">
                      <div className="shrink-0 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                        <img src="./logo.png" className="w-16 h-16 object-contain grayscale" alt="Logo" />
                      </div>
                      <div className="flex-1 uppercase font-serif text-[10px] text-gray-700 leading-none space-y-0.5 pt-1">
                        <p>{membrete.linea1}</p>
                        <p>{membrete.linea2}</p>
                        <p>{membrete.linea3}</p>
                        <p>{membrete.nombreInstitucion}</p>
                        <p className="italic">{membrete.ubicacion}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 justify-end pt-6 border-t border-gray-100">
                  <button 
                    onClick={handlePreviewPDF}
                    className="bg-gray-100 text-gray-600 px-6 py-4 rounded-2xl font-black hover:bg-gray-200 transition-all active:scale-95 flex items-center gap-3 uppercase text-[10px] tracking-widest"
                  >
                    <FileText size={18}/> Previsualizar PDF
                  </button>

                  <button 
                    onClick={guardarEncabezado}
                    disabled={guardandoEncabezado}
                    className={`bg-green-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl hover:bg-green-700 transition-all active:scale-95 flex items-center gap-3 uppercase text-[10px] tracking-widest ${
                      guardandoEncabezado ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                  >
                    <Save size={18}/> {guardandoEncabezado ? "Sincronizando..." : "Guardar Membrete"}
                  </button>
                </div>
              </div>
            )}

            {/* ✅ SECCIÓN NOTAS: DISEÑO CORREGIDO CON CONTRASTE, TAMAÑO Y ANIMACIÓN */}
              {selected === "notas" && (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 text-blue-700 rounded-2xl">
                            <ListChecks size={24}/>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Escalas de Rendimiento</h2>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                              {(nivel === "primaria" || nivel === "inicial") ? "Evaluación Cualitativa (Literales)" : "Evaluación Cuantitativa (01-20)"}
                            </p>
                        </div>
                    </div>

                    {/* Selector de Nivel con Animación Deslizante layoutId */}
                    <div className="flex bg-gray-100 p-1.5 rounded-2xl w-full md:w-fit border border-gray-200 relative overflow-hidden">
                      <button 
                        onClick={() => { setNivel("inicial"); setListaNotas(["", "", ""]); }}
                        className={`relative flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black transition-colors duration-300 z-10 ${
                          nivel === "inicial" ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
                        }`}
                      >
                        <Baby size={16} /> 
                        <span className="relative z-20">INICIAL (MATERNAL)</span>
                        {nivel === "inicial" && (
                          <motion.div 
                            layoutId="activeTab"
                            className="absolute inset-0 bg-white rounded-xl shadow-sm border border-gray-100 z-0"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                      </button>

                      <button 
                        onClick={() => { setNivel("primaria"); setListaNotas(["", "", ""]); }}
                        className={`relative flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black transition-colors duration-300 z-10 ${
                          nivel === "primaria" ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
                        }`}
                      >
                        <GraduationCap size={16} /> 
                        <span className="relative z-20">PRIMARIA</span>
                        {nivel === "primaria" && (
                          <motion.div 
                            layoutId="activeTab"
                            className="absolute inset-0 bg-white rounded-xl shadow-sm border border-gray-100 z-0"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                      </button>

                      <button 
                        onClick={() => { setNivel("secundaria"); setListaNotas(["", "", ""]); }}
                        className={`relative flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black transition-colors duration-300 z-10 ${
                          nivel === "secundaria" ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
                        }`}
                      >
                        <School size={16} /> 
                        <span className="relative z-20">SECUNDARIA</span>
                        {nivel === "secundaria" && (
                          <motion.div 
                            layoutId="activeTab"
                            className="absolute inset-0 bg-white rounded-xl shadow-sm border border-gray-100 z-0"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Grid de Tarjetas con Animación de entrada por Nivel */}
                  <motion.div 
                    key={nivel}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {(nivel === "primaria" || nivel === "inicial") ? (
                      <>
                        <CardNota letra="A" titulo="Excelente" color="green" desc='"Consolidó todos los objetivos propuestos de manera sobresaliente."' />
                        <CardNota letra="B" titulo="Muy Bueno" color="blue" desc='"Consolidó la mayoría de los objetivos con muy buen desempeño."' />
                        <CardNota letra="C" titulo="Bueno" color="yellow" desc='"Consolidó los objetivos básicos mínimos para la aprobación."' />
                        <CardNota letra="D" titulo="Regular" color="orange" desc='"Presentó dificultades para consolidar algunos objetivos básicos."' />
                        <CardNota letra="E" titulo="Deficiente" color="red" desc='"No logró consolidar los objetivos mínimos. Requiere refuerzo."' />
                      </>
                    ) : (
                      <>
                        <CardNota letra="19-20" titulo="Sobresaliente" color="green" desc="Dominio excepcional de las competencias e indicadores esperados." />
                        <CardNota letra="14-18" titulo="Distinguido" color="blue" desc="Cumple satisfactoriamente con los procesos de aprendizaje." />
                        <CardNota letra="10-13" titulo="Aprobado" color="yellow" desc="Logra los conocimientos mínimos necesarios para la aprobación." />
                        <CardNota letra="01-09" titulo="Reprobado" color="red" desc="No alcanza los objetivos mínimos. Requiere evaluación de estrategias." />
                      </>
                    )}
                  </motion.div>

                  {/* ✅ CALCULADORA DE 3 LAPSOS FIJOS INTEGRADA */}
                  <div className="bg-gray-50 p-8 rounded-[3rem] border-2 border-dashed border-gray-200 mt-10 text-center">
                    <div className="flex items-center justify-center gap-3 mb-8">
                        <Calculator className="text-blue-500" size={22}/>
                        <h3 className="text-sm font-black text-gray-700 uppercase tracking-widest">Simulador de {(nivel === "primaria" || nivel === "inicial") ? "Literales" : "Notas"}</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                      {listaNotas.map((nota, index) => (
                        <div key={index} className="space-y-3 text-left">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Lapso {index + 1}</label>
                          <input 
                            type={(nivel === "primaria" || nivel === "inicial") ? "text" : "number"}
                            value={nota}
                            onChange={(e) => handleInputChange(index, e.target.value)}
                            placeholder={(nivel === "primaria" || nivel === "inicial") ? "A-E" : "01-20"}
                            className="w-full bg-white border-2 border-gray-100 rounded-3xl p-5 text-center text-2xl font-black text-gray-800 focus:border-blue-500 focus:outline-none transition-all shadow-sm"
                          />
                        </div>
                      ))}
                    </div>
                    
                    <div className="inline-block bg-blue-600 px-16 py-6 rounded-[2.5rem] text-center shadow-blue-200 shadow-2xl min-w-[280px]">
                      <p className="text-[10px] font-black text-blue-100 uppercase mb-1 tracking-widest">Resultado Final</p>
                      <span className="text-6xl font-black text-white uppercase leading-none">{calcularPromedio()}</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 mt-6 text-center">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] italic text-center">
                        ⚠️ Estos promedios se calculan automáticamente en base al sistema de {nivel}.
                      </p>
                  </div>
                </div>
              )}
          </motion.div>
        )}
      </AnimatePresence>

        {/* MODAL DE VISTA PREVIA PDF */}
        <AnimatePresence>
          {showPDFPreview && (
            <div
              className="fixed inset-0 z-[150] flex items-start justify-center bg-black/70 backdrop-blur-md p-4 md:p-10 overflow-y-auto"
              style={{ WebkitAppRegion: "no-drag" as any }}
            >
              <button 
                type="button"
                onClick={() => setShowPDFPreview(false)} 
                style={{ WebkitAppRegion: "no-drag" as any }}
                className="fixed top-12 right-8 w-14 h-14 flex items-center justify-center bg-red-600 rounded-full text-white shadow-2xl hover:bg-red-700 transition-all z-[200] active:scale-90 cursor-pointer"
                title="Cerrar Vista Previa"
              >
                <X size={26} className="pointer-events-none" />
              </button>

              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white w-full max-w-[800px] shadow-2xl relative p-[1.5cm] md:p-[2.5cm] flex flex-col font-serif text-black my-auto rounded-sm origin-top"
                style={{ minHeight: '11in' }} 
              >

                <div className="flex items-start gap-5 leading-none mb-10 text-left">
                  <img src="./logo.png" className="w-16 h-16 object-contain grayscale" alt="Logo" />
                  <div className="flex-1 uppercase text-[10px] md:text-[11px] space-y-0.5 tracking-tighter">
                    <p>{membrete.linea1}</p>
                    <p>{membrete.linea2}</p>
                    <p>{membrete.linea3}</p>
                    <p>{membrete.nombreInstitucion}</p>
                    <p className="italic">{membrete.ubicacion}</p>
                  </div>
                </div>

                <div className="mt-16 text-center">
                  <h2 className="text-[16px] md:text-[18px] font-bold uppercase underline tracking-[0.2em] mb-20">
                    Libro de Vida del Estudiante
                  </h2>
                  <div className="mt-10 h-px w-full bg-gray-200" />
                </div>

                <div className="mt-auto pt-10 text-center text-gray-300 text-[9px] font-sans uppercase tracking-widest border-t border-gray-50">
                  U.E. "República de Chile" - Sistema de Gestión Escolar v2.0
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
    </motion.div>
  );
};

// ✅ COMPONENTE CARD NOTA CORREGIDO (Colores sólidos, contraste y tamaño adaptable)
const CardNota = ({ letra, titulo, color, desc }: any) => {
  const bgColor: any = {
    green: "bg-green-600 shadow-green-100",
    blue: "bg-blue-600 shadow-blue-100",
    yellow: "bg-yellow-500 shadow-yellow-200", // Amarillo sólido vibrante
    orange: "bg-orange-500 shadow-orange-200", // Naranja sólido vibrante
    red: "bg-red-600 shadow-red-100",
  };

  const containerStyle: any = {
    green: "bg-green-50 border-green-200",
    blue: "bg-blue-50 border-blue-200",
    yellow: "bg-yellow-50 border-yellow-200",
    orange: "bg-orange-50 border-orange-200",
    red: "bg-red-50 border-red-200",
  };

  return (
    <div className={`${containerStyle[color]} p-6 rounded-[2.5rem] border shadow-sm flex flex-col justify-between min-h-[160px] transition-all hover:shadow-md`}>
      <div className="flex justify-between items-start mb-4">
        {/* Cuadro sólido corregido: mayor tamaño (w-14) y fuente dinámica para secundaria */}
        <span className={`${bgColor[color]} text-white ${letra.length > 2 ? 'text-xs px-1' : 'text-xl'} font-black w-14 h-14 flex items-center justify-center rounded-2xl shadow-lg border-2 border-white/20 shrink-0`}>
          {letra}
        </span>
        {/* Título en color oscuro para visibilidad total */}
        <span className="text-[11px] font-black text-gray-800 uppercase tracking-tighter text-right">{titulo}</span>
      </div>
      <p className="text-[11px] font-bold text-gray-700 italic leading-snug tracking-tight text-left">
        {desc}
      </p>
    </div>
  );
};

export default FormatosValores;