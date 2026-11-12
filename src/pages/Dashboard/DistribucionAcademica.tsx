import { useState, useEffect, useMemo, useRef } from "react"; 
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { Dialog } from "@headlessui/react";
import { 
  ArrowLeft, Users, UserCheck, X, 
  Contact2, GraduationCap, BookOpen, AlertCircle, Trash2, Save, CheckCircle, Plus, UserPlus2,
  Stethoscope
} from "lucide-react";

//  PLAN DE ESTUDIOS OFICIAL
const PLAN_ESTUDIOS: Record<string, string[]> = {
  "1er Año": ["Castellano", "Inglés y Otras Lenguas", "Matemáticas", "Educación Física", "Arte y Patrimonio", "Ciencias Naturales", "Geografía, Historia y Ciudadanía", "Orientación y Convivencia", "Grupos de Creación y Producción"],
  "2do Año": ["Castellano", "Inglés y Otras Lenguas", "Matemáticas", "Educación Física", "Arte y Patrimonio", "Ciencias Naturales", "Geografía, Historia y Ciudadanía", "Orientación y Convivencia", "Grupos de Creación y Producción"],
  "3er Año": ["Castellano", "Inglés y Otras Lenguas", "Matemáticas", "Educación Física", "Física", "Química", "Biología", "Geografía, Historia y Ciudadanía", "Orientación y Convivencia", "Grupos de Creación y Producción"],
  "4to Año": ["Castellano", "Inglés y Otras Lenguas", "Matemáticas", "Educación Física", "Física", "Química", "Biología", "Geografía, Historia y Ciudadanía", "Formación para la Soberanía", "Orientación y Convivencia", "Grupos de Creación y Producción"],
  "5to Año": ["Castellano", "Inglés y Otras Lenguas", "Matemáticas", "Educación Física", "Física", "Química", "Biología", "Ciencias de la Tierra", "Geografía, Historia y Ciudadanía", "Formación para la Soberanía", "Orientación y Convivencia", "Grupos de Creación y Producción"]
};

const DistribucionAcademica = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [estudiantes, setEstudiantes] = useState<any[]>([]);
  const [docentes, setDocentes] = useState<any[]>([]);
  const [filtroNivel, setFiltroNivel] = useState<"Primaria" | "Secundaria">("Primaria");
  const [modalOpen, setModalOpen] = useState(false);
  const [seccionSeleccionada, setSeccionSeleccionada] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeMateriaSelector, setActiveMateriaSelector] = useState<string | null>(null);

  const materiasRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const cargarDatos = async () => {
    try {
      const estData = await (window as any).electron.getStudents();
      const docData = await (window as any).electron.getDocentes();
      setEstudiantes(estData || []);
      setDocentes(docData || []);
    } catch (error) {
      console.error("Error cargando datos:", error);
    }
  };

  useEffect(() => { cargarDatos(); }, []);

  // Manejar apertura automática cuando se redirige desde las tarjetas del Dashboard
  useEffect(() => {
    if (location.state) {
      const { autoOpenLevel } = location.state as any;
      if (autoOpenLevel && (autoOpenLevel === "Primaria" || autoOpenLevel === "Secundaria")) {
        setFiltroNivel(autoOpenLevel);
      }
    }
  }, [location.state]);

  useEffect(() => {
    if (activeMateriaSelector && materiasRefs.current[activeMateriaSelector]) {
      setTimeout(() => {
        materiasRefs.current[activeMateriaSelector]?.scrollIntoView({
          behavior: "smooth",
          block: "center" 
        });
      }, 150); 
    }
  }, [activeMateriaSelector]);

  const gradosOrganizados = useMemo(() => {
    const estructura: any = {};
    const listaGrados = filtroNivel === "Primaria" 
      ? ["1ero", "2do", "3ero", "4to", "5to", "6to"]
      : ["1er Año", "2do Año", "3er Año", "4to Año", "5to Año"];

    listaGrados.forEach(grado => { estructura[grado] = { nombre: grado, secciones: {} }; });

    estudiantes.filter(e => e.nivel === filtroNivel).forEach(est => {
      if (!estructura[est.grade]) return;
      if (!estructura[est.grade].secciones[est.section]) {
        //  En Primaria buscamos el guía único asignado a este grado y sección
        const docenteGuia = docentes.find(d => 
          d.nivel === "Primaria" && 
          d.grado_asignado === est.grade && 
          d.seccion_asignada === est.section
        );
        estructura[est.grade].secciones[est.section] = { nombre: est.section, estudiantes: [], guia: docenteGuia || null };
      }
      estructura[est.grade].secciones[est.section].estudiantes.push(est);
    });
    return Object.values(estructura);
  }, [estudiantes, docentes, filtroNivel]);

  // Si se navegó indicando un grado y sección específicos, abrirlo automáticamente
  useEffect(() => {
    if (location.state && gradosOrganizados.length > 0) {
      const { autoOpenGrade, autoOpenSection } = location.state as any;
      if (autoOpenGrade && autoOpenSection) {
        const g: any = gradosOrganizados.find((gr: any) => gr.nombre === autoOpenGrade);
        if (g && g.secciones && g.secciones[autoOpenSection]) {
          setSeccionSeleccionada({ ...g.secciones[autoOpenSection], grado: autoOpenGrade });
          setModalOpen(true);
        }
      }
    }
  }, [gradosOrganizados, location.state]);

  const actualizarAsignacion = async (materia: string | null, docenteId: string, action: "add" | "remove") => {
    if (!seccionSeleccionada) return;
    try {
      const docente = docentes.find(d => d.id === docenteId);
      if (!docente && action === "add") return;

      let actualizacion;
      if (filtroNivel === "Primaria") {
        //  Lógica de Primaria: Asignación exclusiva de Grado y Sección
        actualizacion = action === "add" 
          ? { ...docente, grado_asignado: seccionSeleccionada.grado, seccion_asignada: seccionSeleccionada.nombre }
          : { ...docentes.find(d => d.id === docenteId), grado_asignado: "", seccion_asignada: "" };
      } else {
        const docObj = action === "add" ? docente : docentes.find(d => d.id === docenteId);
        if (!docObj) return;
        const materiasActuales = Array.isArray(docObj.materiasAsignadas) ? docObj.materiasAsignadas : [];
        actualizacion = { 
          ...docObj, 
          materiasAsignadas: action === "add" 
            ? [...materiasActuales, { materia, grado: seccionSeleccionada.grado, seccion: seccionSeleccionada.nombre }] 
            : materiasActuales.filter((m: any) => !(m.materia === materia && m.grado === seccionSeleccionada.grado && m.seccion === seccionSeleccionada.nombre))
        };
      }

      const res = await (window as any).electron.updateDocente(actualizacion.id, actualizacion);
      if (res.success) {
        await cargarDatos();
        if (action === "add") setActiveMateriaSelector(null);
      }
    } catch (error) { console.error("Error al actualizar:", error); }
  };

  const normalizarGradoTexto = (t: string) => {
    return (t || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/1(er|°|ro)/g, "1")
      .replace(/2(do|°|er)/g, "2")
      .replace(/3(er|°|ro)/g, "3")
      .replace(/4(to|°|er)/g, "4")
      .replace(/5(to|°|er)/g, "5")
      .replace(/6(to|°|er)/g, "6")
      .replace(/\s+/g, "");
  };

  const getDocentesAptos = (materia: string) => {
    if (!seccionSeleccionada) return [];
    return docentes.filter(d => {
      if (d.nivel !== filtroNivel) return false;
      
      //  En Primaria, cualquier docente del nivel es apto si no tiene otra sección asignada
      if (filtroNivel === "Primaria") {
        return !d.grado_asignado || d.grado_asignado === "";
      }

      const normalizar = (t: string) => (t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const materiaNorm = normalizar(materia);
      const tieneMateriaHabilitada = Array.isArray(d.materias) && d.materias.some((m: string) => normalizar(m).includes(materiaNorm.split(" ")[0]));
      const estaHabilitadoParaGrado = normalizarGradoTexto(d.grado_asignado || "") === normalizarGradoTexto(seccionSeleccionada.grado);
      return tieneMateriaHabilitada && estaHabilitadoParaGrado;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setModalOpen(false);
    }, 800);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 md:p-10 max-w-7xl mx-auto text-left min-h-screen bg-gray-50">
      <div className="flex justify-between items-center mb-10">
        <div>
          <button onClick={() => navigate("/dashboard/archivos")} className="flex items-center gap-2 text-gray-400 hover:text-[#5564eb] transition-colors font-bold uppercase text-[10px] mb-2 tracking-widest">
            <ArrowLeft size={14}/> Volver a Archivos
          </button>
          <h1 className="text-4xl font-black text-[#5564eb] uppercase tracking-tighter">Distribución Académica</h1>
        </div>
        <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
          {(["Primaria", "Secundaria"] as const).map((nivel) => (
            <button key={nivel} onClick={() => { setFiltroNivel(nivel); setSeccionSeleccionada(null); }} className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${filtroNivel === nivel ? "bg-[#5564eb] text-white shadow-md shadow-blue-200" : "text-gray-400 hover:text-gray-600"}`}>
              {nivel}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-12">
        {gradosOrganizados.map((grado: any) => (
          <div key={grado.nombre} className="bg-white rounded-[3rem] p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4 mb-8 border-b pb-4 text-left">
              <div className="w-12 h-12 rounded-2xl bg-[#5564eb] text-white flex items-center justify-center font-black text-xl">{grado.nombre.charAt(0)}</div>
              <h2 className="text-2xl font-black text-gray-800 uppercase italic tracking-tighter">{grado.nombre}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Object.values(grado.secciones).map((sec: any) => (
                <button 
                  key={sec.nombre} 
                  onClick={() => { setSeccionSeleccionada({ ...sec, grado: grado.nombre }); setModalOpen(true); }} 
                  className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 hover:border-[#5564eb] hover:bg-white hover:shadow-xl transition-all text-left group"
                >
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-3xl font-black text-[#5564eb] italic">"{sec.nombre}"</span>
                    <Users size={20} className="text-gray-300 group-hover:text-[#5564eb]" />
                  </div>
                  <p className="text-sm font-black text-gray-700">{sec.estudiantes.length} Estudiantes</p>
                  {/*  Badge de Guía en Primaria */}
                  {filtroNivel === "Primaria" && sec.guia && (
                    <div className="mt-3 flex items-center gap-2">
                       <UserCheck size={12} className="text-blue-500"/>
                       <p className="text-[9px] font-black text-gray-400 uppercase truncate">{sec.guia.nombre}</p>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {modalOpen && seccionSeleccionada && (
          <Dialog open={modalOpen} onClose={() => setModalOpen(false)} className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-left">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[2.5rem] w-full max-w-6xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col relative text-left border border-gray-100">
              
              <div className="p-8 md:p-10 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h3 className="text-3xl font-black text-gray-800 uppercase tracking-tighter">{seccionSeleccionada.grado} <span className="text-[#5564eb] italic">Sección "{seccionSeleccionada.nombre}"</span></h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">{filtroNivel === "Primaria" ? "Asignación de Docente de Aula" : "Configuración Académica del Grupo"}</p>
                </div>
                <button onClick={() => setModalOpen(false)} className="p-3 bg-white shadow-sm border border-gray-100 rounded-2xl text-gray-400 hover:text-red-500 transition-all active:scale-95"><X size={24}/></button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 md:p-12 grid grid-cols-1 lg:grid-cols-12 gap-12 custom-scrollbar">
                
                <div className="lg:col-span-5 space-y-8">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-100">
                        {filtroNivel === "Primaria" ? <GraduationCap size={20}/> : <BookOpen size={20}/>}
                    </div>
                    <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest">{filtroNivel === "Primaria" ? "Docente Encargado" : "Plan de Estudios"}</h4>
                  </div>
                  
                  <div className="space-y-6">
                    {(filtroNivel === "Primaria" ? ["Aula Regular"] : PLAN_ESTUDIOS[seccionSeleccionada.grado])?.map((materia) => {
                      const doc = docentes.find(d => 
                        filtroNivel === "Primaria" 
                        ? (d.grado_asignado === seccionSeleccionada.grado && d.seccion_asignada === seccionSeleccionada.nombre)
                        : (Array.isArray(d.materiasAsignadas) && d.materiasAsignadas.some((m: any) => m.materia === materia && m.grado === seccionSeleccionada.grado && m.seccion === seccionSeleccionada.nombre))
                      );
                      const aptos = getDocentesAptos(materia);
                      const isSelectorOpen = activeMateriaSelector === materia;

                      return (
                        <div key={materia} ref={(el) => (materiasRefs.current[materia] = el)} className="space-y-3">
                          {doc ? (
                            <div className="p-5 rounded-[2rem] bg-white border-2 border-blue-100 shadow-lg shadow-blue-50 relative overflow-hidden group/card animate-in fade-in zoom-in-95 duration-300">
                               <div className="absolute top-0 right-0 p-4 opacity-0 group-hover/card:opacity-100 transition-opacity">
                                  <button onClick={() => actualizarAsignacion(materia, doc.id, "remove")} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 shadow-sm transition-all active:scale-90"><Trash2 size={16}/></button>
                               </div>
                               <span className="text-[11px] font-black uppercase text-white bg-blue-600 px-4 py-1.5 rounded-full tracking-widest inline-block mb-5 shadow-md shadow-blue-100">{materia}</span>
                               <div className="flex items-center gap-4">
                                  <div className="w-16 h-16 rounded-[1.5rem] border-4 border-white shadow-md overflow-hidden bg-gray-50 flex-shrink-0">
                                    {doc.foto ? <img src={doc.foto} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-600 font-black text-2xl">{doc.nombre.charAt(0)}</div>}
                                  </div>
                                  <div className="min-w-0 text-left">
                                    <p className="text-base font-black text-gray-800 leading-none truncate mb-1.5">{doc.nombre} {doc.apellido}</p>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-green-50 text-green-600 rounded-lg text-[8px] font-black uppercase tracking-tighter"><CheckCircle size={10}/> Docente Guía</span>
                                        {/*  Etiqueta de Especialista en el Modal */}
                                        {doc.es_especialista && (
                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-lg text-[8px] font-black uppercase tracking-tighter border border-purple-200">
                                                <Stethoscope size={10}/> Educación Especial
                                            </span>
                                        )}
                                    </div>
                                  </div>
                               </div>
                            </div>
                          ) : (
                            <motion.button 
                              whileHover={{ scale: 1.01, translateY: -2 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setActiveMateriaSelector(isSelectorOpen ? null : materia)}
                              className={`w-full relative overflow-hidden rounded-[2rem] border-2 border-dashed transition-all duration-300 ${isSelectorOpen ? 'bg-white border-blue-500 ring-4 ring-blue-50 shadow-2xl' : 'bg-gray-50/50 border-gray-200 hover:border-blue-400 hover:bg-white hover:shadow-xl'}`}
                            >
                               <div className="p-8 flex flex-col items-center justify-center gap-4 text-center">
                                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${isSelectorOpen ? 'bg-red-50 text-red-500 rotate-90' : 'bg-white text-blue-600 shadow-md shadow-blue-100 group-hover:scale-110'}`}>{isSelectorOpen ? <X size={28}/> : <UserPlus2 size={28}/>}</div>
                                  <div>
                                     <h5 className={`text-[11px] font-black uppercase tracking-widest transition-colors ${isSelectorOpen ? 'text-red-500' : 'text-gray-400'}`}>{isSelectorOpen ? 'Cerrar Panel' : 'Asignar Docente'}</h5>
                                     <p className="text-[12px] font-black text-blue-900 bg-blue-50/50 px-5 py-2 rounded-2xl uppercase tracking-tight border border-blue-100/50 mt-2">{materia}</p>
                                  </div>
                               </div>
                            </motion.button>
                          )}

                          <AnimatePresence>
                            {isSelectorOpen && (
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                <div className="bg-gray-50 border-x-2 border-b-2 border-blue-500 rounded-b-[2rem] p-6 space-y-3 shadow-inner">
                                  <p className="text-[9px] font-black text-blue-600/60 uppercase mb-4 px-2 flex items-center gap-2"><GraduationCap size={14}/> Docentes Disponibles ({aptos.length})</p>
                                  {aptos.length > 0 ? aptos.map(d => (
                                    <button key={d.id} onClick={() => actualizarAsignacion(materia, d.id, "add")} className="w-full flex items-center gap-4 p-3 bg-white rounded-2xl hover:bg-blue-600 hover:text-white transition-all group shadow-sm border border-gray-100">
                                      <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-white flex-shrink-0">{d.foto ? <img src={d.foto} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400 font-black">{d.nombre.charAt(0)}</div>}</div>
                                      <div className="text-left flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-[11px] font-black truncate uppercase">{d.nombre} {d.apellido}</p>
                                            {/*  Badge de especialista en lista de selección */}
                                            {d.es_especialista && <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" title="Especialista"/>}
                                        </div>
                                        <p className="text-[9px] font-bold opacity-60 uppercase tracking-tighter">C.I. {d.ci}</p>
                                      </div>
                                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors"><Plus size={16}/></div>
                                    </button>
                                  )) : (
                                    <div className="p-8 text-center bg-white/50 rounded-2xl border-2 border-dashed border-gray-200"><AlertCircle className="mx-auto text-gray-300 mb-2" size={24}/><p className="text-[10px] font-bold text-gray-400 uppercase italic">No hay docentes disponibles en este nivel</p></div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="lg:col-span-7 space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3"><div className="p-2 bg-[#5564eb] rounded-xl text-white shadow-lg shadow-blue-100"><Users size={20}/></div><h4 className="text-sm font-black text-gray-800 uppercase tracking-widest">Matrícula Escolar</h4></div>
                    <span className="text-[10px] font-black bg-gray-100 text-gray-500 px-4 py-1.5 rounded-full uppercase tracking-tighter">{seccionSeleccionada.estudiantes.length} Alumnos Inscritos</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {seccionSeleccionada.estudiantes.map((est: any) => (
                      <div key={est.id} className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-[2rem] shadow-sm hover:border-blue-200 hover:shadow-md transition-all group/est">
                        <div className="w-14 h-14 rounded-2xl bg-gray-100 overflow-hidden flex-shrink-0 border-2 border-white shadow-sm group-hover/est:scale-105 transition-transform duration-300">{est.studentPhoto ? <img src={est.studentPhoto} className="w-full h-full object-cover" /> : <Contact2 className="w-full h-full p-3 text-gray-300"/>}</div>
                        <div className="truncate text-left"><p className="text-xs font-black text-gray-800 truncate uppercase leading-tight">{est.firstName} {est.lastName}</p><p className="text-[9px] font-mono text-gray-400 mt-1 font-bold italic">{est.ci || 'SIN ID'}</p></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-8 bg-gray-50 border-t border-gray-100 flex justify-end gap-4 items-center text-left">
                <p className="text-[10px] text-gray-400 font-bold uppercase mr-auto flex items-center gap-2"><CheckCircle size={14} className="text-[#5564eb]"/> Registro Sincronizado</p>
                <button onClick={() => setModalOpen(false)} className="px-8 py-4 bg-white text-gray-400 font-black text-[11px] uppercase rounded-2xl border border-gray-200 hover:bg-gray-100 transition-all active:scale-95">Cancelar</button>
                <button onClick={handleSave} disabled={isSaving} className="px-10 py-4 bg-[#5564eb] text-white font-black text-[11px] uppercase rounded-2xl shadow-xl shadow-blue-100 hover:bg-[#4353d8] transition-all flex items-center gap-3 disabled:opacity-70 active:scale-95">{isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18}/>}Guardar Cambios</button>
              </div>
            </motion.div>
          </Dialog>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DistribucionAcademica;