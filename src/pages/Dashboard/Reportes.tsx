import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Printer, ArrowLeft, GraduationCap, 
  School, Eye
} from "lucide-react";

const PLAN_ESTUDIOS: Record<string, string[]> = {
  "Primaria": ["Aula Regular"], 
  "1er Año": ["Castellano", "Inglés y Otras Lenguas", "Matemáticas", "Educación Física", "Arte y Patrimonio", "Ciencias Naturales", "Geografía, Historia y Ciudadanía", "Orientación y Convivencia"],
  "2do Año": ["Castellano", "Inglés y Otras Lenguas", "Matemáticas", "Educación Física", "Arte y Patrimonio", "Ciencias Naturales", "Geografía, Historia y Ciudadanía", "Orientación y Convivencia"],
  "3er Año": ["Castellano", "Inglés y Otras Lenguas", "Matemáticas", "Educación Física", "Física", "Química", "Biología", "Geografía, Historia y Ciudadanía"],
  "4to Año": ["Castellano", "Inglés y Otras Lenguas", "Matemáticas", "Educación Física", "Física", "Química", "Biología", "Geografía, Historia y Ciudadanía", "Formación para la Soberanía"],
  "5to Año": ["Castellano", "Inglés y Otras Lenguas", "Matemáticas", "Educación Física", "Física", "Química", "Biología", "Ciencias de la Tierra", "Geografía, Historia y Ciudadanía"]
};

const Reportes = () => {
  const [paso, setPaso] = useState<"niveles" | "grados" | "secciones" | "preview">("niveles");
  const [nivel, setNivel] = useState<"Primaria" | "Secundaria">("Primaria");
  const [gradoSel, setGradoSel] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [estudiantes, setEstudiantes] = useState<any[]>([]);
  const [notasEstudiante, setNotasEstudiante] = useState<Record<string, any>>({});
  const [dataPrimaria, setDataPrimaria] = useState<any[]>([]); 
  const [isLoading, setIsLoading] = useState(false);
  const [periodoActivo, setPeriodoActivo] = useState<string>(() => localStorage.getItem("sistema_periodo_activo") || "2025-2026");

  const [membrete, setMembrete] = useState({
    linea1: "REPÚBLICA BOLIVARIANA DE VENEZUELA",
    linea2: "MINISTERIO DEL PODER POPULAR PARA LA EDUCACIÓN",
    linea3: "DIRECCIÓN SECTORIAL DE EDUCACIÓN",
    nombreInstitucion: 'U.E. "REPÚBLICA DE CHILE"',
    ubicacion: "EL ESPINAL - MUNICIPIO DÍAZ",
  });

  useEffect(() => {
    const cargarEstudiantes = async () => {
      try {
        const ests = await (window as any).electron.getStudents();
        setEstudiantes(ests || []);
      } catch (e) { console.error(e); }
    };
    cargarEstudiantes();

    const cargarConfig = async () => {
      try {
        const cfg = await (window as any).electron?.getConfig?.();
        if (cfg?.periodo) {
          setPeriodoActivo(cfg.periodo);
          localStorage.setItem("sistema_periodo_activo", cfg.periodo);
        }
      } catch (e) {
        console.error("Error al cargar config en reportes:", e);
      }
    };
    cargarConfig();

    const saved = localStorage.getItem("membrete_institucional");
    if (saved) {
      try {
        setMembrete(JSON.parse(saved));
      } catch (e) { console.error("Error al cargar membrete:", e); }
    }
  }, []);

  const cargarNotasReales = async (est: any) => {
    setIsLoading(true);
    const materiasPlan = nivel === "Primaria" ? ["Aula Regular"] : (PLAN_ESTUDIOS[est.grade] || []);
    const mapaNotas: Record<string, any> = {};
    const actividadesPrimaria: any[] = [];

    try {
      for (const materia of materiasPlan) {
        const seccionId = `${est.grade}-${est.section}-${est.nivel || nivel}`;
        const data = await (window as any).electron.obtenerNotasSeccion(seccionId, materia);
        
        if (data && data.planificacion) {
          if (nivel === "Primaria") {
            // ✅ MAPEO DE ACTIVIDADES CON NOTAS POR LAPSO
            const allEvs = new Set<string>();
            [1, 2, 3].forEach(l => {
              (data.planificacion[l] || []).forEach((ev: any) => allEvs.add(ev.nombre));
            });

            Array.from(allEvs).forEach(nombreEv => {
              const lapsosNotas: any = { L1: "-", L2: "-", L3: "-" };
              [1, 2, 3].forEach(l => {
                const evMatch = data.planificacion[l]?.find((e: any) => e.nombre === nombreEv);
                if (evMatch) {
                  const nRaw = data.notas?.[est.id]?.[evMatch.id];
                  if (typeof nRaw === "string" && ["A", "B", "C", "D", "E"].includes(nRaw.toUpperCase().trim())) {
                    lapsosNotas[`L${l}`] = nRaw.toUpperCase().trim();
                  } else if (nRaw === 20 || nRaw === "20") {
                    lapsosNotas[`L${l}`] = "A";
                  } else if (nRaw === 16 || nRaw === "16") {
                    lapsosNotas[`L${l}`] = "B";
                  } else if (nRaw === 12 || nRaw === "12") {
                    lapsosNotas[`L${l}`] = "C";
                  } else if (nRaw === 8 || nRaw === "8") {
                    lapsosNotas[`L${l}`] = "D";
                  } else if (nRaw === 4 || nRaw === "4") {
                    lapsosNotas[`L${l}`] = "E";
                  } else {
                    lapsosNotas[`L${l}`] = nRaw ? String(nRaw) : "-";
                  }
                }
              });
              actividadesPrimaria.push({ nombre: nombreEv, ...lapsosNotas });
            });
          } else {
            const calcularLapso = (l: number) => {
              const evs = data.planificacion[l] || [];
              if (evs.length === 0) return "-";
              const acumulado = evs.reduce((acc: number, ev: any) => acc + ((data.notas?.[est.id]?.[ev.id] || 0) * ((ev.peso || 0) / 100)), 0);
              return acumulado > 0 ? parseFloat(acumulado.toFixed(1)) : "-";
            };
            mapaNotas[materia] = { L1: calcularLapso(1), L2: calcularLapso(2), L3: calcularLapso(3) };
          }
        }
      }
      
      if (nivel === "Primaria") {
        setDataPrimaria(actividadesPrimaria);
      } else {
        setNotasEstudiante(mapaNotas);
      }
      setSelectedStudent(est);
      setPaso("preview");
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  };

  const listaGrados = nivel === "Primaria" 
    ? ["1ero", "2do", "3ero", "4to", "5to", "6to"]
    : ["1er Año", "2do Año", "3er Año", "4to Año", "5to Año"];

  const seccionesDelGrado = useMemo(() => {
    const filtrados = estudiantes.filter(e => e.nivel === nivel && e.grade === gradoSel);
    const unicas = Array.from(new Set(filtrados.map(e => e.section)));
    return unicas.map(s => ({ nombre: s, alumnos: filtrados.filter(e => e.section === s).sort((a,b) => a.lastName.localeCompare(b.lastName)) }));
  }, [estudiantes, nivel, gradoSel]);

  const BoletinPreview = () => {
    const alumnosSeccion = estudiantes.filter(e => e.grade === selectedStudent.grade && e.section === selectedStudent.section).sort((a,b) => a.lastName.localeCompare(b.lastName));
    const noLista = alumnosSeccion.findIndex(e => e.id === selectedStudent.id) + 1;

    // ✅ LÓGICA DE PROMEDIO CUALITATIVO PARA LA TABLA DE PRIMARIA
    const promediarLiterales = (l1: string, l2: string, l3: string) => {
      const equiv: Record<string, number> = { A: 5, B: 4, C: 3, D: 2, E: 1 };
      const pts = [l1, l2, l3].map(v => equiv[v] || 0).filter(p => p > 0);
      if (pts.length === 0) return "-";
      const prom = Math.round(pts.reduce((a, b) => a + b, 0) / pts.length);
      return Object.keys(equiv).find(k => equiv[k] === prom) || "-";
    };

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white p-10 shadow-2xl max-w-[21.59cm] mx-auto border border-gray-300 min-h-[27.94cm] flex flex-col font-serif text-black relative text-[10px]">
        
        <div className="flex items-start justify-between border-b border-black pb-2 mb-4 text-left">
          <div className="flex items-center gap-3 text-left">
            <img src="./logo.png" className="w-14 h-14 object-contain grayscale" alt="Logo" />
            <div className="uppercase font-bold text-[8px] leading-tight">
              <p>{membrete.nombreInstitucion}</p>
              <p>{membrete.linea2}</p>
              <p>{membrete.ubicacion}</p>
            </div>
          </div>
          <div className="text-right font-bold text-[9px] uppercase">
            <p>Año Escolar: {periodoActivo}</p>
            <p>No. de Lista: <span className="underline px-2">{noLista}</span></p>
          </div>
        </div>

        <div className="text-center mb-4">
          <h2 className="text-lg font-black uppercase tracking-widest">Boletín de Calificaciones - {nivel.toUpperCase()}</h2>
        </div>

        <div className="grid grid-cols-4 border-t border-b border-black py-2 mb-4 gap-2 uppercase font-bold text-[9px] text-left">
          <div className="col-span-2">Estudiante: <span className="underline ml-1">{selectedStudent.lastName}, {selectedStudent.firstName}</span></div>
          <div className="text-center">C.I: <span className="underline ml-1">{selectedStudent.ci || '---'}</span></div>
          <div className="text-right">Sección: <span className="underline ml-1">"{selectedStudent.section}"</span></div>
          <div className="col-span-2">Año o Grado: <span className="underline ml-1">{selectedStudent.grade}</span></div>
          <div className="text-center text-left">Posición: <span className="underline ml-1">{noLista} / {alumnosSeccion.length}</span></div>
          <div className="text-right">Momento: <span className="underline ml-1">Anual</span></div>
        </div>

        <div className="flex gap-4">
            <div className="flex-1">
                {nivel === "Primaria" ? (
                  // ✅ TABLA DE PRIMARIA CON LAPSOS Y DEFINITIVA
                  <table className="w-full border-collapse border border-black text-left">
                    <thead>
                      <tr className="bg-gray-100 font-bold uppercase text-[8px]">
                        <th className="border border-black p-1 text-left">Actividades de Aprendizaje</th>
                        <th className="border border-black p-1 w-12 text-center">Lap 1</th>
                        <th className="border border-black p-1 w-12 text-center">Lap 2</th>
                        <th className="border border-black p-1 w-12 text-center">Lap 3</th>
                        <th className="border border-black p-1 w-14 text-center bg-gray-200">Definit.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dataPrimaria.map((act, i) => (
                        <tr key={i} className="h-7">
                          <td className="border border-black px-2 font-bold uppercase text-[8px]">{act.nombre}</td>
                          <td className="border border-black text-center font-bold">{act.L1}</td>
                          <td className="border border-black text-center font-bold">{act.L2}</td>
                          <td className="border border-black text-center font-bold">{act.L3}</td>
                          <td className="border border-black text-center font-black bg-gray-50">
                            {promediarLiterales(act.L1, act.L2, act.L3)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <table className="w-full border-collapse border border-black text-left">
                    <thead>
                      <tr className="bg-gray-100 font-bold uppercase text-[8px]">
                        <th className="border border-black p-1 text-left">Áreas de Formación</th>
                        <th className="border border-black p-1 w-10 text-center">Mom. 1</th>
                        <th className="border border-black p-1 w-10 text-center">Mom. 2</th>
                        <th className="border border-black p-1 w-10 text-center">Mom. 3</th>
                        <th className="border border-black p-1 w-10 text-center bg-gray-200">Definit.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {PLAN_ESTUDIOS[selectedStudent.grade]?.map(materia => {
                        const n = notasEstudiante[materia] || { L1: "-", L2: "-", L3: "-" };
                        const def = (typeof n.L1 === 'number' && typeof n.L2 === 'number' && typeof n.L3 === 'number') 
                            ? ((n.L1 + n.L2 + n.L3) / 3).toFixed(1) : (typeof n.L1 === 'number' ? n.L1 : "-");
                        return (
                          <tr key={materia} className="h-6">
                            <td className="border border-black px-2 font-bold text-[8px] uppercase">{materia}</td>
                            <td className="border border-black text-center font-bold">{n.L1}</td>
                            <td className="border border-black text-center font-bold">{n.L2}</td>
                            <td className="border border-black text-center font-bold">{n.L3}</td>
                            <td className="border border-black text-center font-black bg-gray-50">{def}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
            </div>

            <div className="w-40 space-y-4">
                <div className="border border-black p-2 rounded-sm text-left">
                    <p className="font-bold text-[8px] border-b border-black mb-1 uppercase">Estado Académico</p>
                    <p className="text-[7px] italic text-gray-500 text-center py-2">Evaluación {nivel === "Primaria" ? "Cualitativa" : "Cuantitativa"}</p>
                </div>
                <div className="border border-black p-2 h-32 flex flex-col items-center justify-center text-center text-gray-300 opacity-30 text-[7px] font-bold italic">
                    <div className="w-16 h-16 border border-black border-dashed rounded-full flex items-center justify-center">Sello</div>
                </div>
            </div>
        </div>

        <div className="mt-6 border border-black p-3 flex-1 text-left">
            <p className="font-black border-b border-black mb-2 uppercase text-[9px]">Observaciones y Recomendaciones:</p>
            <div className="h-24 border-b border-black border-dotted mb-2"></div>
            <div className="h-10 border-b border-black border-dotted"></div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-32 pt-16 text-center text-[9px] font-bold italic uppercase px-10">
          <div className="border-t border-black pt-1">Docente de Aula / Guía</div>
          <div className="border-t border-black pt-1 text-right flex flex-col items-end">
            <span>Fecha de Emisión: {new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto min-h-screen bg-[#f4f6fb] text-left">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10 no-print">
        <div className="text-left">
          {paso !== "niveles" && (
            <button onClick={() => setPaso(paso === "grados" ? "niveles" : paso === "secciones" ? "grados" : "secciones")} className="flex items-center gap-2 text-gray-400 hover:text-green-600 transition-colors font-bold uppercase text-[10px] mb-2 tracking-widest text-left">
              <ArrowLeft size={14}/> Volver Atrás
            </button>
          )}
          <h1 className="text-4xl font-black text-gray-800 uppercase tracking-tighter italic leading-none">
            {paso === "preview" ? "Boletín de Notas" : "Módulo de Reportes"}
          </h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mt-3 italic leading-none">Gestión Institucional República de Chile</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {paso === "niveles" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
             <button onClick={() => { setNivel("Primaria"); setPaso("grados"); }} className="group p-10 bg-white rounded-[3rem] border border-gray-100 shadow-sm hover:border-green-500 hover:shadow-2xl transition-all text-left">
                <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 group-hover:bg-green-600 group-hover:text-white transition-all mb-6 shadow-inner text-left"><School size={32}/></div>
                <h3 className="text-2xl font-black text-gray-800 uppercase italic">Educación Primaria</h3>
                <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest leading-none">Evaluación cualitativa por actividades</p>
             </button>
             <button onClick={() => { setNivel("Secundaria"); setPaso("grados"); }} className="group p-10 bg-white rounded-[3rem] border border-gray-100 shadow-sm hover:border-blue-500 hover:shadow-2xl transition-all text-left text-left">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all mb-6 shadow-inner text-left"><GraduationCap size={32}/></div>
                <h3 className="text-2xl font-black text-gray-800 uppercase italic">Media General</h3>
                <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest leading-none">Evaluación cuantitativa por áreas</p>
             </button>
          </motion.div>
        )}

        {paso === "grados" && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {listaGrados.map(g => (
              <button key={g} onClick={() => { setGradoSel(g); setPaso("secciones"); }} className="p-8 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-green-400 transition-all text-left group">
                <h4 className="text-lg font-black text-gray-700 uppercase italic leading-none">{g}</h4>
              </button>
            ))}
          </motion.div>
        )}

        {paso === "secciones" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {seccionesDelGrado.map(sec => (
                <div key={sec.nombre} className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
                  <div className="px-10 py-5 bg-gray-50 border-b border-gray-100 flex justify-between items-center text-left">
                    <h3 className="font-black text-gray-700 uppercase italic tracking-tighter">Sección "{sec.nombre}"</h3>
                  </div>
                  <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sec.alumnos.map(est => (
                      <div key={est.id} onClick={() => cargarNotasReales(est)} className="p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-green-400 hover:bg-white cursor-pointer transition-all flex items-center justify-between group">
                        <p className="text-xs font-black text-gray-700 uppercase">{est.lastName}, {est.firstName}</p>
                        {isLoading && selectedStudent?.id === est.id ? <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin text-left" /> : <Eye size={16} className="text-gray-300 group-hover:text-green-600" />}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </motion.div>
        )}

        {paso === "preview" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="flex justify-between items-center no-print">
               <button onClick={() => setPaso("secciones")} className="px-8 py-4 bg-white text-gray-400 font-black text-[11px] uppercase rounded-2xl border border-gray-200 hover:text-green-600 shadow-sm transition-all flex items-center gap-3 text-left"><ArrowLeft size={18}/> Regresar</button>
               <button onClick={() => window.print()} className="px-12 py-4 bg-green-600 text-white font-black text-[11px] uppercase rounded-2xl shadow-xl shadow-green-700 transition-all flex items-center gap-3 text-left"><Printer size={20}/> Imprimir Boletín</button>
            </div>
            <BoletinPreview />
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media print {
          body * { visibility: hidden !important; background: white !important; }
          .no-print { display: none !important; }
          .bg-white { position: absolute; left: 0; top: 0; width: 100%; visibility: visible !important; padding: 0 !important; border: none !important; }
          .bg-white * { visibility: visible !important; }
        }
      `}</style>
    </div>
  );
};

export default Reportes;