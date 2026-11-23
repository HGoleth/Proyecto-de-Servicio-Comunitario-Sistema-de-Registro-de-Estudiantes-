import { useState, useEffect, useMemo } from "react"; 
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { Dialog } from "@headlessui/react";
import { 
  ArrowLeft, Users, X, 
  Contact2, BookOpen, Clock, CheckCircle
} from "lucide-react";

// PLAN DE ESTUDIOS DE RESPALDO CON CÓDIGO ÚNICO POR MATERIA
const PLAN_ESTUDIOS_FALLBACK: Record<string, { codigo: string; nombre: string; horas: number; area: string }[]> = {
  "Maternal": [
    { codigo: "FPS-MAT", nombre: "Formación Personal, Social y Comunicación", horas: 6, area: "Desarrollo Personal" },
    { codigo: "RCA-MAT", nombre: "Relación entre los Componentes del Ambiente", horas: 6, area: "Ciencias Naturales y Salud" },
    { codigo: "EPC-MAT", nombre: "Expresión Plástica, Corporal y Musical", horas: 4, area: "Arte y Patrimonio" },
    { codigo: "EFM-MAT", nombre: "Educación Física y Recreación Motriz", horas: 4, area: "Educación Física y Deporte" }
  ],
  "1er Grupo": [
    { codigo: "FPS-1GR", nombre: "Formación Personal, Social y Comunicación", horas: 6, area: "Desarrollo Personal" },
    { codigo: "RCA-1GR", nombre: "Relación entre los Componentes del Ambiente", horas: 6, area: "Ciencias Naturales y Salud" },
    { codigo: "EPC-1GR", nombre: "Expresión Plástica, Corporal y Musical", horas: 4, area: "Arte y Patrimonio" },
    { codigo: "EFM-1GR", nombre: "Educación Física y Recreación Motriz", horas: 4, area: "Educación Física y Deporte" }
  ],
  "2do Grupo": [
    { codigo: "FPS-2GR", nombre: "Formación Personal, Social y Comunicación", horas: 6, area: "Desarrollo Personal" },
    { codigo: "RCA-2GR", nombre: "Relación entre los Componentes del Ambiente", horas: 6, area: "Ciencias Naturales y Salud" },
    { codigo: "EPC-2GR", nombre: "Expresión Plástica, Corporal y Musical", horas: 4, area: "Arte y Patrimonio" },
    { codigo: "EFM-2GR", nombre: "Educación Física y Recreación Motriz", horas: 4, area: "Educación Física y Deporte" }
  ],
  "3er Grupo": [
    { codigo: "FPS-3GR", nombre: "Formación Personal, Social y Comunicación", horas: 6, area: "Desarrollo Personal" },
    { codigo: "RCA-3GR", nombre: "Relación entre los Componentes del Ambiente", horas: 6, area: "Ciencias Naturales y Salud" },
    { codigo: "EPC-3GR", nombre: "Expresión Plástica, Corporal y Musical", horas: 4, area: "Arte y Patrimonio" },
    { codigo: "EFM-3GR", nombre: "Educación Física y Recreación Motriz", horas: 4, area: "Educación Física y Deporte" }
  ],
  "1ero": [
    { codigo: "CAS-1ERO", nombre: "Castellano y Literatura", horas: 6, area: "Lengua y Comunicación" },
    { codigo: "MAT-1ERO", nombre: "Matemáticas para la Vida", horas: 6, area: "Ciencias y Matemáticas" },
    { codigo: "NAT-1ERO", nombre: "Ciencias Naturales y Salud", horas: 4, area: "Ciencias Naturales" },
    { codigo: "SOC-1ERO", nombre: "Ciencias Sociales, Identidad y Soberanía", horas: 4, area: "Ciencias Sociales" },
    { codigo: "EST-1ERO", nombre: "Educación Estética y Cultura", horas: 3, area: "Arte y Patrimonio" },
    { codigo: "EDF-1ERO", nombre: "Educación Física, Deporte y Recreación", horas: 3, area: "Educación Física" }
  ],
  "2do": [
    { codigo: "CAS-2DO", nombre: "Castellano y Literatura", horas: 6, area: "Lengua y Comunicación" },
    { codigo: "MAT-2DO", nombre: "Matemáticas para la Vida", horas: 6, area: "Ciencias y Matemáticas" },
    { codigo: "NAT-2DO", nombre: "Ciencias Naturales y Salud", horas: 4, area: "Ciencias Naturales" },
    { codigo: "SOC-2DO", nombre: "Ciencias Sociales, Identidad y Soberanía", horas: 4, area: "Ciencias Sociales" },
    { codigo: "EST-2DO", nombre: "Educación Estética y Cultura", horas: 3, area: "Arte y Patrimonio" },
    { codigo: "EDF-2DO", nombre: "Educación Física, Deporte y Recreación", horas: 3, area: "Educación Física" }
  ],
  "3ero": [
    { codigo: "CAS-3ERO", nombre: "Castellano y Literatura", horas: 6, area: "Lengua y Comunicación" },
    { codigo: "MAT-3ERO", nombre: "Matemáticas para la Vida", horas: 6, area: "Ciencias y Matemáticas" },
    { codigo: "NAT-3ERO", nombre: "Ciencias Naturales y Salud", horas: 4, area: "Ciencias Naturales" },
    { codigo: "SOC-3ERO", nombre: "Ciencias Sociales, Identidad y Soberanía", horas: 4, area: "Ciencias Sociales" },
    { codigo: "EST-3ERO", nombre: "Educación Estética y Cultura", horas: 3, area: "Arte y Patrimonio" },
    { codigo: "EDF-3ERO", nombre: "Educación Física, Deporte y Recreación", horas: 3, area: "Educación Física" }
  ],
  "4to": [
    { codigo: "CAS-4TO", nombre: "Castellano y Literatura", horas: 6, area: "Lengua y Comunicación" },
    { codigo: "MAT-4TO", nombre: "Matemáticas para la Vida", horas: 6, area: "Ciencias y Matemáticas" },
    { codigo: "NAT-4TO", nombre: "Ciencias Naturales y Salud", horas: 4, area: "Ciencias Naturales" },
    { codigo: "SOC-4TO", nombre: "Ciencias Sociales, Identidad y Soberanía", horas: 4, area: "Ciencias Sociales" },
    { codigo: "EST-4TO", nombre: "Educación Estética y Cultura", horas: 3, area: "Arte y Patrimonio" },
    { codigo: "EDF-4TO", nombre: "Educación Física, Deporte y Recreación", horas: 3, area: "Educación Física" }
  ],
  "5to": [
    { codigo: "CAS-5TO", nombre: "Castellano y Literatura", horas: 6, area: "Lengua y Comunicación" },
    { codigo: "MAT-5TO", nombre: "Matemáticas para la Vida", horas: 6, area: "Ciencias y Matemáticas" },
    { codigo: "NAT-5TO", nombre: "Ciencias Naturales y Salud", horas: 4, area: "Ciencias Naturales" },
    { codigo: "SOC-5TO", nombre: "Ciencias Sociales, Identidad y Soberanía", horas: 4, area: "Ciencias Sociales" },
    { codigo: "EST-5TO", nombre: "Educación Estética y Cultura", horas: 3, area: "Arte y Patrimonio" },
    { codigo: "EDF-5TO", nombre: "Educación Física, Deporte y Recreación", horas: 3, area: "Educación Física" }
  ],
  "6to": [
    { codigo: "CAS-6TO", nombre: "Castellano y Literatura", horas: 6, area: "Lengua y Comunicación" },
    { codigo: "MAT-6TO", nombre: "Matemáticas para la Vida", horas: 6, area: "Ciencias y Matemáticas" },
    { codigo: "NAT-6TO", nombre: "Ciencias Naturales y Salud", horas: 4, area: "Ciencias Naturales" },
    { codigo: "SOC-6TO", nombre: "Ciencias Sociales, Identidad y Soberanía", horas: 4, area: "Ciencias Sociales" },
    { codigo: "EST-6TO", nombre: "Educación Estética y Cultura", horas: 3, area: "Arte y Patrimonio" },
    { codigo: "EDF-6TO", nombre: "Educación Física, Deporte y Recreación", horas: 3, area: "Educación Física" }
  ],
  "1er Año": [
    { codigo: "CAS-1ERANO", nombre: "Castellano", horas: 4, area: "Lengua y Comunicación" },
    { codigo: "ING-1ERANO", nombre: "Inglés y Otras Lenguas", horas: 4, area: "Lenguas Extranjeras" },
    { codigo: "MAT-1ERANO", nombre: "Matemáticas", horas: 4, area: "Ciencias y Matemáticas" },
    { codigo: "EDF-1ERANO", nombre: "Educación Física", horas: 3, area: "Educación Física" },
    { codigo: "ART-1ERANO", nombre: "Arte y Patrimonio", horas: 3, area: "Arte y Patrimonio" },
    { codigo: "NAT-1ERANO", nombre: "Ciencias Naturales", horas: 4, area: "Ciencias Naturales" },
    { codigo: "GHC-1ERANO", nombre: "Geografía, Historia y Ciudadanía", horas: 4, area: "Ciencias Sociales" },
    { codigo: "ORI-1ERANO", nombre: "Orientación y Convivencia", horas: 2, area: "Orientación" },
    { codigo: "CRP-1ERANO", nombre: "Grupos de Creación y Producción", horas: 3, area: "Producción y Cultura" }
  ],
  "2do Año": [
    { codigo: "CAS-2DOANO", nombre: "Castellano", horas: 4, area: "Lengua y Comunicación" },
    { codigo: "ING-2DOANO", nombre: "Inglés y Otras Lenguas", horas: 4, area: "Lenguas Extranjeras" },
    { codigo: "MAT-2DOANO", nombre: "Matemáticas", horas: 4, area: "Ciencias y Matemáticas" },
    { codigo: "EDF-2DOANO", nombre: "Educación Física", horas: 3, area: "Educación Física" },
    { codigo: "ART-2DOANO", nombre: "Arte y Patrimonio", horas: 3, area: "Arte y Patrimonio" },
    { codigo: "NAT-2DOANO", nombre: "Ciencias Naturales", horas: 4, area: "Ciencias Naturales" },
    { codigo: "GHC-2DOANO", nombre: "Geografía, Historia y Ciudadanía", horas: 4, area: "Ciencias Sociales" },
    { codigo: "ORI-2DOANO", nombre: "Orientación y Convivencia", horas: 2, area: "Orientación" },
    { codigo: "CRP-2DOANO", nombre: "Grupos de Creación y Producción", horas: 3, area: "Producción y Cultura" }
  ],
  "3er Año": [
    { codigo: "CAS-3ANO", nombre: "Castellano", horas: 4, area: "Lengua y Comunicación" },
    { codigo: "ING-3ANO", nombre: "Inglés y Otras Lenguas", horas: 4, area: "Lenguas Extranjeras" },
    { codigo: "MAT-3ANO", nombre: "Matemáticas", horas: 4, area: "Ciencias y Matemáticas" },
    { codigo: "EDF-3ANO", nombre: "Educación Física", horas: 3, area: "Educación Física" },
    { codigo: "FIS-3ANO", nombre: "Física", horas: 4, area: "Ciencias Naturales" },
    { codigo: "QUI-3ANO", nombre: "Química", horas: 4, area: "Ciencias Naturales" },
    { codigo: "BIO-3ANO", nombre: "Biología", horas: 4, area: "Ciencias Naturales" },
    { codigo: "GHC-3ANO", nombre: "Geografía, Historia y Ciudadanía", horas: 4, area: "Ciencias Sociales" },
    { codigo: "ORI-3ANO", nombre: "Orientación y Convivencia", horas: 2, area: "Orientación" },
    { codigo: "CRP-3ANO", nombre: "Grupos de Creación y Producción", horas: 3, area: "Producción y Cultura" }
  ],
  "4to Año": [
    { codigo: "CAS-4TOANO", nombre: "Castellano", horas: 4, area: "Lengua y Comunicación" },
    { codigo: "ING-4TOANO", nombre: "Inglés y Otras Lenguas", horas: 4, area: "Lenguas Extranjeras" },
    { codigo: "MAT-4TOANO", nombre: "Matemáticas", horas: 4, area: "Ciencias y Matemáticas" },
    { codigo: "EDF-4TOANO", nombre: "Educación Física", horas: 3, area: "Educación Física" },
    { codigo: "FIS-4TOANO", nombre: "Física", horas: 4, area: "Ciencias Naturales" },
    { codigo: "QUI-4TOANO", nombre: "Química", horas: 4, area: "Ciencias Naturales" },
    { codigo: "BIO-4TOANO", nombre: "Biología", horas: 4, area: "Ciencias Naturales" },
    { codigo: "GHC-4TOANO", nombre: "Geografía, Historia y Ciudadanía", horas: 4, area: "Ciencias Sociales" },
    { codigo: "FSN-4TOANO", nombre: "Formación para la Soberanía", horas: 3, area: "Ciencias Sociales" },
    { codigo: "ORI-4TOANO", nombre: "Orientación y Convivencia", horas: 2, area: "Orientación" },
    { codigo: "CRP-4TOANO", nombre: "Grupos de Creación y Producción", horas: 3, area: "Producción y Cultura" }
  ],
  "5to Año": [
    { codigo: "CAS-5TOANO", nombre: "Castellano", horas: 4, area: "Lengua y Comunicación" },
    { codigo: "ING-5TOANO", nombre: "Inglés y Otras Lenguas", horas: 4, area: "Lenguas Extranjeras" },
    { codigo: "MAT-5TOANO", nombre: "Matemáticas", horas: 4, area: "Ciencias y Matemáticas" },
    { codigo: "EDF-5TOANO", nombre: "Educación Física", horas: 3, area: "Educación Física" },
    { codigo: "FIS-5TOANO", nombre: "Física", horas: 4, area: "Ciencias Naturales" },
    { codigo: "QUI-5TOANO", nombre: "Química", horas: 4, area: "Ciencias Naturales" },
    { codigo: "BIO-5TOANO", nombre: "Biología", horas: 4, area: "Ciencias Naturales" },
    { codigo: "CIE-5TOANO", nombre: "Ciencias de la Tierra", horas: 4, area: "Ciencias Naturales" },
    { codigo: "GHC-5TOANO", nombre: "Geografía, Historia y Ciudadanía", horas: 4, area: "Ciencias Sociales" },
    { codigo: "FSN-5TOANO", nombre: "Formación para la Soberanía", horas: 3, area: "Ciencias Sociales" },
    { codigo: "ORI-5TOANO", nombre: "Orientación y Convivencia", horas: 2, area: "Orientación" },
    { codigo: "CRP-5TOANO", nombre: "Grupos de Creación y Producción", horas: 3, area: "Producción y Cultura" }
  ]
};

const DistribucionAcademica = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [estudiantes, setEstudiantes] = useState<any[]>([]);
  const [pensumMaterias, setPensumMaterias] = useState<any[]>([]);
  const [filtroNivel, setFiltroNivel] = useState<"Inicial" | "Primaria" | "Secundaria">("Primaria");
  const [modalOpen, setModalOpen] = useState(false);
  const [seccionSeleccionada, setSeccionSeleccionada] = useState<any>(null);

  const cargarDatos = async () => {
    try {
      const estData = await (window as any).electron?.getStudents?.();
      setEstudiantes(estData || []);
      if ((window as any).electron?.getPensum) {
        const penData = await (window as any).electron.getPensum();
        if (Array.isArray(penData)) setPensumMaterias(penData);
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
    }
  };

  useEffect(() => { cargarDatos(); }, []);

  // Manejar apertura automática cuando se redirige desde las tarjetas del Dashboard
  useEffect(() => {
    if (location.state) {
      const { autoOpenLevel } = location.state as any;
      if (autoOpenLevel && (autoOpenLevel === "Inicial" || autoOpenLevel === "Primaria" || autoOpenLevel === "Secundaria")) {
        setFiltroNivel(autoOpenLevel);
      }
    }
  }, [location.state]);

  const gradosOrganizados = useMemo(() => {
    const estructura: any = {};
    const listaGrados = filtroNivel === "Inicial"
      ? ["Maternal", "1er Grupo", "2do Grupo", "3er Grupo"]
      : filtroNivel === "Primaria" 
      ? ["1ero", "2do", "3ero", "4to", "5to", "6to"]
      : ["1er Año", "2do Año", "3er Año", "4to Año", "5to Año"];

    listaGrados.forEach(grado => { estructura[grado] = { nombre: grado, secciones: {} }; });

    estudiantes.filter(e => (e.nivel || e.level) === filtroNivel).forEach(est => {
      if (!estructura[est.grade]) return;
      if (!estructura[est.grade].secciones[est.section]) {
        estructura[est.grade].secciones[est.section] = { nombre: est.section, estudiantes: [] };
      }
      estructura[est.grade].secciones[est.section].estudiantes.push(est);
    });
    return Object.values(estructura);
  }, [estudiantes, filtroNivel]);

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

  const materiasDelGradoSeleccionado = useMemo(() => {
    if (!seccionSeleccionada) return [];
    const fromPensum = pensumMaterias.filter(
      (m: any) => m.grado === seccionSeleccionada.grado && m.nivel === filtroNivel
    );
    if (fromPensum.length > 0) {
      return fromPensum.map((m: any) => ({
        codigo: m.codigo || m.id,
        nombre: m.nombre,
        horas: m.horasSemanales || 4,
        area: m.area || "General"
      }));
    }
    return PLAN_ESTUDIOS_FALLBACK[seccionSeleccionada.grado] || [];
  }, [seccionSeleccionada, pensumMaterias, filtroNivel]);

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
          {(["Inicial", "Primaria", "Secundaria"] as const).map((nivel) => (
            <button key={nivel} onClick={() => { setFiltroNivel(nivel); setSeccionSeleccionada(null); }} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${filtroNivel === nivel ? "bg-[#5564eb] text-white shadow-md shadow-blue-200" : "text-gray-400 hover:text-gray-600"}`}>
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
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Plan de Estudios y Matrícula del Grupo</p>
                </div>
                <button onClick={() => setModalOpen(false)} className="p-3 bg-white shadow-sm border border-gray-100 rounded-2xl text-gray-400 hover:text-red-500 transition-all active:scale-95"><X size={24}/></button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 md:p-12 grid grid-cols-1 lg:grid-cols-12 gap-12 custom-scrollbar">
                
                <div className="lg:col-span-5 space-y-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-100">
                        <BookOpen size={20}/>
                      </div>
                      <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest">Asignaturas del Grado</h4>
                    </div>
                    <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-3 py-1 rounded-full uppercase">
                      {materiasDelGradoSeleccionado.length} Materias
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {materiasDelGradoSeleccionado.map((mat) => (
                      <div key={mat.codigo} className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:border-blue-200 transition-all flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <span className="font-mono text-[10px] font-black uppercase text-[#5564eb] bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100 inline-block mb-1">
                            {mat.codigo}
                          </span>
                          <p className="text-xs font-black text-gray-800 uppercase truncate">{mat.nombre}</p>
                          <p className="text-[10px] font-semibold text-gray-400 truncate">{mat.area}</p>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-bold bg-gray-50 text-gray-600 px-2.5 py-1 rounded-xl border border-gray-100 shrink-0">
                          <Clock size={12} className="text-blue-500" />
                          <span>{mat.horas}h</span>
                        </div>
                      </div>
                    ))}
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

              <div className="p-8 bg-gray-50 border-t border-gray-100 flex justify-end gap-4">
                <button onClick={() => setModalOpen(false)} className="px-10 py-4 bg-[#5564eb] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center gap-3 active:scale-95">
                  <CheckCircle size={18}/> Cerrar Vista
                </button>
              </div>
            </motion.div>
          </Dialog>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DistribucionAcademica;
