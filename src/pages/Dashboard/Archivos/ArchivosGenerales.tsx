import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { useNavigate } from "react-router-dom"; 
import { 
  Users, 
  UserSquare2, 
  School, 
  LayoutGrid, 
  ChevronRight, 
  X, 
  CheckCircle, 
  AlertTriangle,
  Search,
  Baby,
  Phone,
  Contact2,
  Edit3,
  Mail,
  BookOpen,
  TrendingUp,
  UserCheck,
  PieChart,
  ArrowUpRight,
  LayoutDashboard
} from "lucide-react";

const fadeIn: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const ArchivosGenerales = () => {
  const navigate = useNavigate(); 
  const [selected, setSelected] = useState<string | null>(null);
  const [representantes, setRepresentantes] = useState<any[]>([]);
  const [docentes, setDocentes] = useState<any[]>([]);
  const [estudiantes, setEstudiantes] = useState<any[]>([]); 
  const [repSeleccionado, setRepSeleccionado] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [modalNotify, setModalNotify] = useState<{ 
    show: boolean; 
    type: "success" | "error" | "warning"; 
    title: string; 
    message: string 
  }>({
    show: false,
    type: "success",
    title: "",
    message: ""
  });

  useEffect(() => {
    cargarDatosGlobales();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarDatosGlobales = async () => {
    try {
      const docs = await (window as any).electron.getDocentes();
      const ests = await (window as any).electron.getStudents();
      setDocentes(docs || []);
      setEstudiantes(ests || []); 
      
      if (ests && Array.isArray(ests)) {
        procesarRepresentantes(ests);
      }
    } catch (error) {
      console.error("Error al obtener datos:", error);
    }
  };

  const irAEstudiante = (idEstudiante: string) => {
    if (!idEstudiante) return;
    localStorage.setItem("filterStudentID", idEstudiante);
    navigate("/dashboard/estudiantes/administracion"); 
  };

  const irATodosLosHijos = (cedulaRep: string) => {
    if (!cedulaRep || cedulaRep === "S/C") {
      setModalNotify({
        show: true,
        type: "warning",
        title: "Dato Incompleto",
        message: "Este representante no posee una cédula válida para realizar el filtrado masivo."
      });
      return;
    }
    localStorage.setItem("filterRepIdentidad", cedulaRep);
    navigate("/dashboard/estudiantes/administracion"); 
  };

  const procesarRepresentantes = (estudiantes: any[]) => {
    const mapaRepresentantes = estudiantes.reduce((acc: any, est: any) => {
      const cedulaReal = est.repCI || est.repCedula;
      const nombreReal = est.repFirstName ? `${est.repFirstName} ${est.repLastName || ""}`.trim() : est.repName;
      const ciValida = cedulaReal && cedulaReal !== "S/C" && cedulaReal !== "" ? cedulaReal : null;
      const nombreValido = nombreReal && nombreReal !== "Sin Nombre" && nombreReal !== "" ? nombreReal : null;

      if (!ciValida && !nombreValido) return acc;
      const key = ciValida || `TEMP-${nombreValido}`;

      if (!acc[key]) {
        acc[key] = {
          nombre: nombreReal || "Representante Pendiente",
          cedula: ciValida || "S/C",
          telefono: est.repPhone || "S/T",
          parentesco: est.relationship || "N/A",
          foto: est.repPhoto || null,
          hijos: []
        };
      }
      
      const yaExisteHijo = acc[key].hijos.find((h: any) => h.id === est.id);
      if (!yaExisteHijo) {
        acc[key].hijos.push({
          nombre: `${est.firstName} ${est.lastName}`, 
          id: est.id,
          grado: `${est.grade} "${est.section}"`,
          foto: est.studentPhoto
        });
      }
      return acc;
    }, {});

    setRepresentantes(Object.values(mapaRepresentantes));
  };

  const resumenDistribucion = useMemo(() => {
    const grupos: Record<string, any> = {};
    estudiantes.forEach(est => {
      const key = `${est.nivel}-${est.grade}-${est.section}`;
      if (!grupos[key]) {
        grupos[key] = { nivel: est.nivel, grado: est.grade, seccion: est.section, matricula: 0 };
      }
      grupos[key].matricula++;
    });
    return Object.values(grupos).slice(0, 6); 
  }, [estudiantes]);
  
  const menuItems = [
    { id: "docentes", label: "Personal Docente", icon: <UserSquare2 size={24} />, description: "Gestión de profesores y carga horaria." },
    { id: "representantes", label: "Base de Representantes", icon: <Users size={24} />, description: "Directorio de padres y representantes legales." },
    { id: "planteles", label: "Planteles y Enlaces", icon: <School size={24} />, description: "Registro de instituciones y circuitos." },
    { id: "distribucion", label: "Distribución Académica", icon: <LayoutDashboard size={24} />, description: "Organización de secciones y grados." }
  ];

  const datosFiltrados = selected === "representantes" 
    ? representantes.filter(r => r.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || r.cedula?.toString().includes(searchTerm))
    : docentes.filter(d => d.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || d.ci?.includes(searchTerm));

  return (
    <motion.div className="p-6 md:p-10 max-w-6xl mx-auto text-left" variants={fadeIn} initial="hidden" animate="visible">
      
      <AnimatePresence>
        {modalNotify.show && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full text-center relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-full h-2 ${modalNotify.type === "success" ? "bg-green-500" : "bg-yellow-500"}`} />
              <div className="flex justify-center mb-4">
                {modalNotify.type === "success" ? <CheckCircle className="text-green-500" size={56} /> : <AlertTriangle className="text-yellow-500" size={56} />}
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{modalNotify.title}</h3>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">{modalNotify.message}</p>
              <button onClick={() => setModalNotify({ ...modalNotify, show: false })} className="w-full py-3 rounded-xl bg-gray-800 text-white font-bold hover:bg-gray-900 transition-all shadow-lg uppercase text-[10px] tracking-widest">Entendido</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {repSeleccionado && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="bg-white rounded-[2.5rem] p-8 shadow-2xl max-w-lg w-full relative text-left">
              <button onClick={() => setRepSeleccionado(null)} className="absolute top-6 right-6 text-gray-400 hover:text-red-500 transition-all"><X size={28}/></button>
              <div className="mb-6 border-b pb-4">
                <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">Representados de {repSeleccionado.nombre}</h3>
                <button onClick={() => irATodosLosHijos(repSeleccionado.cedula)} className="mt-3 flex items-center gap-2 bg-blue-50 text-[#5564eb] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#5564eb] hover:text-white transition-all border border-blue-100 shadow-sm">
                  <Users size={14}/> Filtrar en Matrícula
                </button>
              </div>
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                {repSeleccionado.hijos.map((hijo: any) => (
                  <motion.div key={hijo.id} whileHover={{ x: 5 }} onClick={() => irAEstudiante(hijo.id)} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-all group">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-200 border border-gray-200">
                      {hijo.foto ? <img src={hijo.foto} className="w-full h-full object-cover" alt="" /> : <Baby className="w-full h-full p-2 text-gray-400" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-700 text-sm group-hover:text-green-700 transition-colors uppercase">{hijo.nombre}</p>
                      <p className="text-[10px] text-green-600 font-bold uppercase tracking-widest">{hijo.grado}</p>
                    </div>
                    <ChevronRight size={18} className="text-gray-300 group-hover:text-green-500" />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="mb-10 text-left">
        <h1 className="text-4xl font-black text-green-700 tracking-tight uppercase tracking-tighter">Archivos Generales</h1>
        <p className="mt-2 text-gray-500 text-lg font-medium">Administración de entidades globales y recursos del sistema.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {menuItems.map((item) => (
          <motion.div
            key={item.id}
            whileHover={{ scale: 1.02, translateY: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelected(item.id)}
            className={`cursor-pointer p-8 rounded-[2.5rem] border-2 transition-all flex items-start gap-6 ${
              selected === item.id ? "bg-green-600 border-green-600 shadow-xl text-white shadow-green-200" : "bg-white border-gray-100 shadow-sm text-gray-700 hover:shadow-md"
            }`}
          >
            <div className={`p-4 rounded-2xl ${selected === item.id ? "bg-white/20 text-white" : "bg-green-50 text-green-600"}`}>
              {item.icon}
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-black text-xl mb-1 uppercase tracking-tighter">{item.label}</h3>
              <p className={`text-sm leading-relaxed ${selected === item.id ? "text-green-100" : "text-gray-400 font-medium"}`}>{item.description}</p>
            </div>
            <ChevronRight className={`mt-1 ${selected === item.id ? "text-white" : "text-gray-300"}`} />
          </motion.div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {selected && (
          <motion.div key={selected} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }} className="mt-12 bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl border border-green-50 relative">
            <button onClick={() => setSelected(null)} className="absolute -top-4 -right-4 p-3 bg-white text-gray-400 hover:text-red-500 rounded-full shadow-lg border border-gray-100 transition-all z-10 hover:scale-110">
              <X size={24}/>
            </button>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 border-b pb-8">
              <div className="text-left">
                <h2 className="text-3xl font-black text-green-800 uppercase tracking-tighter">{menuItems.find(m => m.id === selected)?.label}</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Información Institucional Activa</p>
              </div>
              <div className="flex gap-4 items-center">
                {selected !== "distribucion" && (
                  <div className="relative">
                    <Search size={18} className="absolute left-3 top-3 text-gray-400" />
                    <input 
                      type="text" 
                      value={searchTerm} 
                      onChange={(e) => setSearchTerm(e.target.value)} 
                      placeholder="Buscar..." 
                      className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500 w-64 transition-all" 
                    />
                  </div>
                )}
                <button 
                  onClick={() => {
                    if (selected === "docentes") navigate("/dashboard/docentes");
                    else if (selected === "representantes") navigate("/dashboard/estudiantes/administracion");
                    else if (selected === "distribucion") navigate("/dashboard/archivos/distribucion");
                  }}
                  className="bg-blue-600 text-white px-6 py-3 rounded-2xl hover:bg-blue-700 transition-all shadow-xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest active:scale-95"
                >
                  <Edit3 size={18}/> Gestionar Módulo
                </button>
              </div>
            </div>

            {selected === "representantes" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {datosFiltrados.map((rep: any, idx: number) => (
                  <motion.div key={idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-gray-50 border border-gray-100 rounded-[2.5rem] p-6 shadow-sm hover:bg-white hover:shadow-xl transition-all group text-left">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white border-2 border-green-50 group-hover:border-green-500 transition-colors shadow-sm">
                        {rep.foto ? <img src={rep.foto} className="w-full h-full object-cover" alt="" /> : <Contact2 className="w-full h-full p-3 text-gray-300" />}
                      </div>
                      <div className="truncate">
                        <h4 className="font-black text-gray-800 truncate uppercase tracking-tighter">{rep.nombre}</h4>
                        <span className="text-[9px] font-black bg-green-100 text-green-700 px-2 py-0.5 rounded uppercase">{rep.parentesco}</span>
                      </div>
                    </div>
                    <div className="space-y-2 mb-6 px-2">
                      <p className="text-xs text-gray-500 flex items-center gap-2 font-bold"><Phone size={14} className="text-green-600"/> {rep.telefono}</p>
                      <p className="text-[10px] text-gray-400 flex items-center gap-2 font-mono">C.I: {rep.cedula}</p>
                    </div>
                    <button onClick={() => setRepSeleccionado(rep)} className="w-full py-3 bg-white text-gray-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-green-600 hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm border border-gray-100">
                      Ver Representados ({rep.hijos.length})
                    </button>
                  </motion.div>
                ))}
              </div>
            ) : selected === "docentes" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {datosFiltrados.map((doc: any) => (
                  <motion.div key={doc.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-gray-50 border border-gray-100 rounded-[2.5rem] p-6 shadow-sm hover:bg-white hover:shadow-xl transition-all group text-left">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 rounded-2xl bg-white text-green-600 border-2 border-green-100 flex items-center justify-center shadow-sm group-hover:bg-green-600 group-hover:text-white transition-all overflow-hidden">
                        {doc.foto ? <img src={doc.foto} className="w-full h-full object-cover rounded-xl"/> : <UserSquare2 size={32} />}
                      </div>
                      <div className="truncate">
                        <h4 className="font-black text-gray-800 truncate uppercase tracking-tighter leading-none mb-2">{doc.nombre} {doc.apellido}</h4>
                        <div className="flex flex-wrap gap-2 items-center">
                          <p className="text-[9px] font-black text-green-600 uppercase tracking-widest">{doc.nivel} | {doc.grado_asignado || 'Docente'}</p>
                          {/*  ETIQUETA DE ESPECIALISTA EN VISTA PREVIA */}
                          {doc.es_especialista && (
                            <span className="bg-purple-100 text-purple-700 text-[8px] px-2 py-0.5 rounded-full font-black uppercase border border-purple-200">
                                Especialista
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 mb-6 bg-white p-4 rounded-2xl shadow-inner border border-gray-50">
                       <div className="flex items-center gap-2 text-xs text-gray-500 font-medium truncate"><Mail size={14} className="text-green-600 flex-shrink-0"/> {doc.email}</div>
                       <div className="flex items-center gap-2 text-[11px] font-black text-gray-700 uppercase"><BookOpen size={14} className="text-blue-500 flex-shrink-0"/> {doc.grado_asignado || 'N/A'} - "{doc.seccion_asignada || 'N/A'}"</div>
                    </div>
                    <button 
                      onClick={() => { localStorage.setItem("editDocenteID", doc.id); navigate("/dashboard/docentes"); }} 
                      className="w-full py-3 bg-white text-gray-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all border border-gray-100 shadow-sm"
                    >
                      Gestionar Perfil
                    </button>
                  </motion.div>
                ))}
              </div>
            ) : selected === "distribucion" ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                  <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-[2.5rem] border border-green-100 shadow-sm relative overflow-hidden group text-left">
                    <TrendingUp size={64} className="absolute -right-4 -bottom-4 text-green-100 opacity-50 group-hover:scale-110 transition-transform"/>
                    <p className="text-[10px] font-black text-green-600 uppercase mb-2 tracking-widest">Matrícula Total</p>
                    <h3 className="text-4xl font-black text-green-800">{estudiantes.length} <span className="text-sm font-bold text-gray-400">Ests.</span></h3>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-[2.5rem] border border-blue-100 shadow-sm relative overflow-hidden group text-left">
                    <UserCheck size={64} className="absolute -right-4 -bottom-4 text-blue-100 opacity-50 group-hover:scale-110 transition-transform"/>
                    <p className="text-[10px] font-black text-blue-600 uppercase mb-2 tracking-widest">Planta Docente</p>
                    <h3 className="text-4xl font-black text-blue-800">{docentes.length} <span className="text-sm font-bold text-gray-400">Profs.</span></h3>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-white p-6 rounded-[2.5rem] border border-orange-100 shadow-sm relative overflow-hidden group text-left">
                    <PieChart size={64} className="absolute -right-4 -bottom-4 text-orange-100 opacity-50 group-hover:scale-110 transition-transform"/>
                    <p className="text-[10px] font-black text-orange-600 uppercase mb-2 tracking-widest">Secciones</p>
                    <h3 className="text-4xl font-black text-orange-800">{resumenDistribucion.length}+ <span className="text-sm font-bold text-gray-400">Grupos</span></h3>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {resumenDistribucion.map((sec: any, idx) => (
                    <motion.div key={idx} whileHover={{ translateY: -3 }} className="p-6 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm hover:border-green-300 hover:shadow-lg transition-all text-left relative overflow-hidden">
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[9px] font-black bg-gray-100 text-gray-500 px-3 py-1 rounded-full uppercase tracking-tighter">{sec.nivel}</span>
                        <Users size={16} className="text-gray-200" />
                      </div>
                      <h4 className="text-xl font-black text-gray-800 leading-none mb-3">{sec.grado} <span className="text-green-600 italic">"{sec.seccion}"</span></h4>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">
                            <div className="h-full bg-green-500 rounded-full transition-all duration-1000" style={{ width: `${(sec.matricula / 40) * 100}%` }} />
                        </div>
                        <span className="text-[10px] font-black text-gray-400">{sec.matricula}</span>
                      </div>
                    </motion.div>
                  ))}

                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    onClick={() => navigate("/dashboard/archivos/distribucion")}
                    className="p-6 border-2 border-dashed border-gray-200 rounded-[2.5rem] flex flex-col items-center justify-center gap-3 text-gray-400 hover:text-green-600 hover:border-green-300 hover:bg-green-50/50 transition-all group"
                  >
                    <div className="p-3 bg-gray-50 rounded-2xl group-hover:bg-green-100 transition-colors">
                        <ArrowUpRight size={28} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-widest">Abrir Mapa Escolar</span>
                  </motion.button>
                </div>
              </div>
            ) : (
              <div className="py-24 text-center text-gray-400 italic border-2 border-dashed border-gray-100 rounded-[2.5rem] bg-gray-50/50">
                <LayoutGrid size={64} className="mx-auto mb-4 opacity-10" />
                <p className="text-lg font-bold uppercase tracking-[0.2em]">Módulo en Mantenimiento</p>
                <p className="text-xs font-medium text-gray-400 mt-2">Esta sección está siendo optimizada por el equipo técnico.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ArchivosGenerales;