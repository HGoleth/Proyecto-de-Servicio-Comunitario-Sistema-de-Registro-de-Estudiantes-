import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Printer, ArrowLeft, GraduationCap, 
  School, Eye, FileDown, Baby
} from "lucide-react";

const PLAN_ESTUDIOS_FALLBACK: Record<string, { codigo: string; nombre: string }[]> = {
  "Maternal": [
    { codigo: "FPS-MAT", nombre: "Formación Personal, Social y Comunicación" },
    { codigo: "RCA-MAT", nombre: "Relación entre los Componentes del Ambiente" },
    { codigo: "EPC-MAT", nombre: "Expresión Plástica, Corporal y Musical" },
    { codigo: "EFM-MAT", nombre: "Educación Física y Recreación Motriz" }
  ],
  "1er Grupo": [
    { codigo: "FPS-1GR", nombre: "Formación Personal, Social y Comunicación" },
    { codigo: "RCA-1GR", nombre: "Relación entre los Componentes del Ambiente" },
    { codigo: "EPC-1GR", nombre: "Expresión Plástica, Corporal y Musical" },
    { codigo: "EFM-1GR", nombre: "Educación Física y Recreación Motriz" }
  ],
  "2do Grupo": [
    { codigo: "FPS-2GR", nombre: "Formación Personal, Social y Comunicación" },
    { codigo: "RCA-2GR", nombre: "Relación entre los Componentes del Ambiente" },
    { codigo: "EPC-2GR", nombre: "Expresión Plástica, Corporal y Musical" },
    { codigo: "EFM-2GR", nombre: "Educación Física y Recreación Motriz" }
  ],
  "3er Grupo": [
    { codigo: "FPS-3GR", nombre: "Formación Personal, Social y Comunicación" },
    { codigo: "RCA-3GR", nombre: "Relación entre los Componentes del Ambiente" },
    { codigo: "EPC-3GR", nombre: "Expresión Plástica, Corporal y Musical" },
    { codigo: "EFM-3GR", nombre: "Educación Física y Recreación Motriz" }
  ],
  "1ero": [
    { codigo: "CAS-1ERO", nombre: "Castellano y Literatura" },
    { codigo: "MAT-1ERO", nombre: "Matemáticas para la Vida" },
    { codigo: "NAT-1ERO", nombre: "Ciencias Naturales y Salud" },
    { codigo: "SOC-1ERO", nombre: "Ciencias Sociales, Identidad y Soberanía" },
    { codigo: "EST-1ERO", nombre: "Educación Estética y Cultura" },
    { codigo: "EDF-1ERO", nombre: "Educación Física, Deporte y Recreación" }
  ],
  "2do": [
    { codigo: "CAS-2DO", nombre: "Castellano y Literatura" },
    { codigo: "MAT-2DO", nombre: "Matemáticas para la Vida" },
    { codigo: "NAT-2DO", nombre: "Ciencias Naturales y Salud" },
    { codigo: "SOC-2DO", nombre: "Ciencias Sociales, Identidad y Soberanía" },
    { codigo: "EST-2DO", nombre: "Educación Estética y Cultura" },
    { codigo: "EDF-2DO", nombre: "Educación Física, Deporte y Recreación" }
  ],
  "3ero": [
    { codigo: "CAS-3ERO", nombre: "Castellano y Literatura" },
    { codigo: "MAT-3ERO", nombre: "Matemáticas para la Vida" },
    { codigo: "NAT-3ERO", nombre: "Ciencias Naturales y Salud" },
    { codigo: "SOC-3ERO", nombre: "Ciencias Sociales, Identidad y Soberanía" },
    { codigo: "EST-3ERO", nombre: "Educación Estética y Cultura" },
    { codigo: "EDF-3ERO", nombre: "Educación Física, Deporte y Recreación" }
  ],
  "4to": [
    { codigo: "CAS-4TO", nombre: "Castellano y Literatura" },
    { codigo: "MAT-4TO", nombre: "Matemáticas para la Vida" },
    { codigo: "NAT-4TO", nombre: "Ciencias Naturales y Salud" },
    { codigo: "SOC-4TO", nombre: "Ciencias Sociales, Identidad y Soberanía" },
    { codigo: "EST-4TO", nombre: "Educación Estética y Cultura" },
    { codigo: "EDF-4TO", nombre: "Educación Física, Deporte y Recreación" }
  ],
  "5to": [
    { codigo: "CAS-5TO", nombre: "Castellano y Literatura" },
    { codigo: "MAT-5TO", nombre: "Matemáticas para la Vida" },
    { codigo: "NAT-5TO", nombre: "Ciencias Naturales y Salud" },
    { codigo: "SOC-5TO", nombre: "Ciencias Sociales, Identidad y Soberanía" },
    { codigo: "EST-5TO", nombre: "Educación Estética y Cultura" },
    { codigo: "EDF-5TO", nombre: "Educación Física, Deporte y Recreación" }
  ],
  "6to": [
    { codigo: "CAS-6TO", nombre: "Castellano y Literatura" },
    { codigo: "MAT-6TO", nombre: "Matemáticas para la Vida" },
    { codigo: "NAT-6TO", nombre: "Ciencias Naturales y Salud" },
    { codigo: "SOC-6TO", nombre: "Ciencias Sociales, Identidad y Soberanía" },
    { codigo: "EST-6TO", nombre: "Educación Estética y Cultura" },
    { codigo: "EDF-6TO", nombre: "Educación Física, Deporte y Recreación" }
  ],
  "1er Año": [
    { codigo: "CAS-1ERANO", nombre: "Castellano" },
    { codigo: "ING-1ERANO", nombre: "Inglés y Otras Lenguas" },
    { codigo: "MAT-1ERANO", nombre: "Matemáticas" },
    { codigo: "EDF-1ERANO", nombre: "Educación Física" },
    { codigo: "ART-1ERANO", nombre: "Arte y Patrimonio" },
    { codigo: "NAT-1ERANO", nombre: "Ciencias Naturales" },
    { codigo: "GHC-1ERANO", nombre: "Geografía, Historia y Ciudadanía" },
    { codigo: "ORI-1ERANO", nombre: "Orientación y Convivencia" },
    { codigo: "CRP-1ERANO", nombre: "Grupos de Creación, Recreación y Producción" }
  ],
  "2do Año": [
    { codigo: "CAS-2DOANO", nombre: "Castellano" },
    { codigo: "ING-2DOANO", nombre: "Inglés y Otras Lenguas" },
    { codigo: "MAT-2DOANO", nombre: "Matemáticas" },
    { codigo: "EDF-2DOANO", nombre: "Educación Física" },
    { codigo: "ART-2DOANO", nombre: "Arte y Patrimonio" },
    { codigo: "NAT-2DOANO", nombre: "Ciencias Naturales" },
    { codigo: "GHC-2DOANO", nombre: "Geografía, Historia y Ciudadanía" },
    { codigo: "ORI-2DOANO", nombre: "Orientación y Convivencia" },
    { codigo: "CRP-2DOANO", nombre: "Grupos de Creación, Recreación y Producción" }
  ],
  "3er Año": [
    { codigo: "CAS-3ANO", nombre: "Castellano" },
    { codigo: "ING-3ANO", nombre: "Inglés y Otras Lenguas" },
    { codigo: "MAT-3ANO", nombre: "Matemáticas" },
    { codigo: "EDF-3ANO", nombre: "Educación Física" },
    { codigo: "FIS-3ANO", nombre: "Física" },
    { codigo: "QUI-3ANO", nombre: "Química" },
    { codigo: "BIO-3ANO", nombre: "Biología" },
    { codigo: "GHC-3ANO", nombre: "Geografía, Historia y Ciudadanía" },
    { codigo: "ORI-3ANO", nombre: "Orientación y Convivencia" },
    { codigo: "CRP-3ANO", nombre: "Grupos de Creación, Recreación y Producción" }
  ],
  "4to Año": [
    { codigo: "CAS-4TOANO", nombre: "Castellano" },
    { codigo: "ING-4TOANO", nombre: "Inglés y Otras Lenguas" },
    { codigo: "MAT-4TOANO", nombre: "Matemáticas" },
    { codigo: "EDF-4TOANO", nombre: "Educación Física" },
    { codigo: "FIS-4TOANO", nombre: "Física" },
    { codigo: "QUI-4TOANO", nombre: "Química" },
    { codigo: "BIO-4TOANO", nombre: "Biología" },
    { codigo: "GHC-4TOANO", nombre: "Geografía, Historia y Ciudadanía" },
    { codigo: "FSN-4TOANO", nombre: "Formación para la Soberanía Nacional" },
    { codigo: "ORI-4TOANO", nombre: "Orientación y Convivencia" },
    { codigo: "CRP-4TOANO", nombre: "Grupos de Creación, Recreación y Producción" }
  ],
  "5to Año": [
    { codigo: "CAS-5TOANO", nombre: "Castellano" },
    { codigo: "ING-5TOANO", nombre: "Inglés y Otras Lenguas" },
    { codigo: "MAT-5TOANO", nombre: "Matemáticas" },
    { codigo: "EDF-5TOANO", nombre: "Educación Física" },
    { codigo: "FIS-5TOANO", nombre: "Física" },
    { codigo: "QUI-5TOANO", nombre: "Química" },
    { codigo: "BIO-5TOANO", nombre: "Biología" },
    { codigo: "CIE-5TOANO", nombre: "Ciencias de la Tierra" },
    { codigo: "GHC-5TOANO", nombre: "Geografía, Historia y Ciudadanía" },
    { codigo: "FSN-5TOANO", nombre: "Formación para la Soberanía Nacional" },
    { codigo: "ORI-5TOANO", nombre: "Orientación y Convivencia" },
    { codigo: "CRP-5TOANO", nombre: "Grupos de Creación, Recreación y Producción" }
  ]
};

const Reportes = () => {
  const [paso, setPaso] = useState<"niveles" | "grados" | "secciones" | "preview">("niveles");
  const [nivel, setNivel] = useState<"Inicial" | "Primaria" | "Secundaria">("Primaria");
  const [gradoSel, setGradoSel] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [estudiantes, setEstudiantes] = useState<any[]>([]);
  const [pensumMaterias, setPensumMaterias] = useState<any[]>([]);
  const [notasEstudiante, setNotasEstudiante] = useState<Record<string, { codigo: string; L1: any; L2: any; L3: any }>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [periodoActivo, setPeriodoActivo] = useState<string>(() => localStorage.getItem("sistema_periodo_activo") || "2026-2027");

  const [membrete, setMembrete] = useState({
    linea1: "REPÚBLICA BOLIVARIANA DE VENEZUELA",
    linea2: "MINISTERIO DEL PODER POPULAR PARA LA EDUCACIÓN",
    linea3: "DIRECCIÓN SECTORIAL DE EDUCACIÓN",
    nombreInstitucion: 'U.E. "REPÚBLICA DE CHILE"',
    ubicacion: "EL ESPINAL - MUNICIPIO DÍAZ",
  });

  useEffect(() => {
    const cargarDatosIniciales = async () => {
      try {
        const electron = (window as any).electron;
        const [ests, cfg, pensum] = await Promise.all([
          electron?.getStudents?.() || [],
          electron?.getConfig?.() || null,
          electron?.getPensum?.() || []
        ]);
        setEstudiantes(ests || []);
        if (Array.isArray(pensum)) setPensumMaterias(pensum);
        if (cfg?.periodo) {
          setPeriodoActivo(cfg.periodo);
          localStorage.setItem("sistema_periodo_activo", cfg.periodo);
        }
      } catch (e) {
        console.error("Error cargando datos en reportes:", e);
      }
    };
    cargarDatosIniciales();

    const saved = localStorage.getItem("membrete_institucional");
    if (saved) {
      try {
        setMembrete(JSON.parse(saved));
      } catch (e) { console.error("Error al cargar membrete:", e); }
    }
  }, []);

  const obtenerMateriasDelGrado = (grado: string, niv: string) => {
    const fromDb = pensumMaterias.filter(m => m.grado === grado && m.nivel === niv);
    if (fromDb.length > 0) {
      return fromDb.map(m => ({ codigo: m.codigo || m.id, nombre: m.nombre }));
    }
    return PLAN_ESTUDIOS_FALLBACK[grado] || [];
  };

  const cargarNotasReales = async (est: any) => {
    setIsLoading(true);
    const nivEst = est.nivel || nivel;
    const materiasPlan = obtenerMateriasDelGrado(est.grade, nivEst);
    const mapaNotas: Record<string, { codigo: string; L1: any; L2: any; L3: any }> = {};

    try {
      const seccionId = `${est.grade}-${est.section}-${nivEst}`;
      await Promise.all(
        materiasPlan.map(async (mat) => {
          const data = await (window as any).electron.obtenerNotasSeccion(seccionId, mat.nombre);
          if (data && data.planificacion) {
            if (nivEst === "Primaria" || nivEst === "Inicial") {
              const equiv: Record<string, number> = { A: 20, B: 16, C: 12, D: 8, E: 4 };
              const calcLapsoLiteral = (l: number) => {
                const evs = data.planificacion[l] || [];
                if (evs.length === 0) return "-";
                let acum = 0;
                evs.forEach((ev: any) => {
                  const raw = String(data.notas?.[est.id]?.[ev.id] || "").toUpperCase().trim();
                  const pt = equiv[raw] || (Number(raw) || 0);
                  acum += pt * ((Number(ev.peso) || 0) / 100);
                });
                if (acum >= 18) return "A";
                if (acum >= 14) return "B";
                if (acum >= 10) return "C";
                if (acum >= 6) return "D";
                if (acum > 0) return "E";
                return "-";
              };
              mapaNotas[mat.nombre] = {
                codigo: mat.codigo,
                L1: calcLapsoLiteral(1),
                L2: calcLapsoLiteral(2),
                L3: calcLapsoLiteral(3)
              };
            } else {
              const calcularLapsoNum = (l: number) => {
                const evs = data.planificacion[l] || [];
                if (evs.length === 0) return "-";
                const acumulado = evs.reduce((acc: number, ev: any) => {
                  const val = parseFloat(String(data.notas?.[est.id]?.[ev.id] || "0").replace(",", "."));
                  return acc + ((isNaN(val) ? 0 : val) * ((Number(ev.peso) || 0) / 100));
                }, 0);
                return acumulado > 0 ? parseFloat(acumulado.toFixed(1)) : "-";
              };
              mapaNotas[mat.nombre] = {
                codigo: mat.codigo,
                L1: calcularLapsoNum(1),
                L2: calcularLapsoNum(2),
                L3: calcularLapsoNum(3)
              };
            }
          } else {
            mapaNotas[mat.nombre] = { codigo: mat.codigo, L1: "-", L2: "-", L3: "-" };
          }
        })
      );

      setNotasEstudiante(mapaNotas);
      setSelectedStudent(est);
      setPaso("preview");
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const listaGrados = nivel === "Inicial"
    ? ["Maternal", "1er Grupo", "2do Grupo", "3er Grupo"]
    : nivel === "Primaria" 
    ? ["1ero", "2do", "3ero", "4to", "5to", "6to"]
    : ["1er Año", "2do Año", "3er Año", "4to Año", "5to Año"];

  const seccionesDelGrado = useMemo(() => {
    const filtrados = estudiantes.filter(e => (e.nivel || e.level) === nivel && e.grade === gradoSel);
    const unicas = Array.from(new Set(filtrados.map(e => e.section))).sort();
    return unicas.map(s => ({
      nombre: s,
      alumnos: filtrados.filter(e => e.section === s).sort((a, b) => (a.lastName || "").localeCompare(b.lastName || ""))
    }));
  }, [estudiantes, nivel, gradoSel]);

  const handleDescargarPDF = async () => {
    const electron = (window as any).electron;
    if (electron?.guardarDocumentoPdf && selectedStudent) {
      await electron.guardarDocumentoPdf({
        filename: `Boletin_${selectedStudent.lastName}_${selectedStudent.firstName}_${selectedStudent.grade}_${selectedStudent.section}`,
        pageSize: "Carta"
      });
    } else {
      window.print();
    }
  };

  const handleImprimirBoletin = async () => {
    const electron = (window as any).electron;
    if (electron?.imprimirDocumentoDirecto) {
      await electron.imprimirDocumentoDirecto({ pageSize: "Carta" });
    } else {
      window.print();
    }
  };

  const BoletinPreview = () => {
    const alumnosSeccion = estudiantes
      .filter(e => e.grade === selectedStudent.grade && e.section === selectedStudent.section)
      .sort((a, b) => (a.lastName || "").localeCompare(b.lastName || ""));
    const noLista = alumnosSeccion.findIndex(e => e.id === selectedStudent.id) + 1;
    const materiasGrado = obtenerMateriasDelGrado(selectedStudent.grade, selectedStudent.nivel || nivel);

    const promediarLiterales = (l1: string, l2: string, l3: string) => {
      const equiv: Record<string, number> = { A: 5, B: 4, C: 3, D: 2, E: 1 };
      const pts = [l1, l2, l3].map(v => equiv[v] || 0).filter(p => p > 0);
      if (pts.length === 0) return "-";
      const prom = Math.round(pts.reduce((a, b) => a + b, 0) / pts.length);
      return Object.keys(equiv).find(k => equiv[k] === prom) || "-";
    };

    // Promedio general cuantitativo o cualitativo
    const resumenGeneral = (() => {
      if (nivel === "Primaria" || nivel === "Inicial") {
        const defs = materiasGrado.map(m => {
          const n = notasEstudiante[m.nombre] || { L1: "-", L2: "-", L3: "-" };
          return promediarLiterales(n.L1, n.L2, n.L3);
        });
        const equiv: Record<string, number> = { A: 5, B: 4, C: 3, D: 2, E: 1 };
        const pts = defs.map(v => equiv[v] || 0).filter(p => p > 0);
        if (pts.length === 0) return "—";
        const prom = Math.round(pts.reduce((a, b) => a + b, 0) / pts.length);
        return `Literal ${Object.keys(equiv).find(k => equiv[k] === prom) || "A"}`;
      } else {
        const proms: number[] = [];
        materiasGrado.forEach(m => {
          const n = notasEstudiante[m.nombre];
          if (n && typeof n.L1 === "number" && typeof n.L2 === "number" && typeof n.L3 === "number") {
            proms.push((n.L1 + n.L2 + n.L3) / 3);
          }
        });
        if (proms.length === 0) return "—";
        return `${(proms.reduce((a, b) => a + b, 0) / proms.length).toFixed(1)} / 20 pts`;
      }
    })();

    // Condición final después de tener todas las notas de los 3 lapsos
    const condicionFinalBoletin = (() => {
      if (materiasGrado.length === 0) return { estado: "EN_CURSO", etiqueta: "En Curso (Faltan Notas)" };
      const todasCompletas = materiasGrado.every(m => {
        const n = notasEstudiante[m.nombre];
        if (!n) return false;
        return n.L1 !== "-" && n.L2 !== "-" && n.L3 !== "-" && n.L1 !== "" && n.L2 !== "" && n.L3 !== "";
      });
      if (!todasCompletas) {
        return { estado: "EN_CURSO", etiqueta: "En Curso (Faltan Notas)" };
      }

      if (nivel === "Primaria" || nivel === "Inicial") {
        const equiv: Record<string, number> = { A: 5, B: 4, C: 3, D: 2, E: 1 };
        const defs = materiasGrado.map(m => {
          const n = notasEstudiante[m.nombre];
          return promediarLiterales(n.L1, n.L2, n.L3);
        });
        const pts = defs.map(v => equiv[v] || 0).filter(p => p > 0);
        const prom = pts.length > 0 ? Math.round(pts.reduce((a, b) => a + b, 0) / pts.length) : 0;
        const litFinal = Object.keys(equiv).find(k => equiv[k] === prom) || "E";
        const aprobo = ["A", "B", "C"].includes(litFinal);
        return aprobo
          ? { estado: "PROMOVIDO", etiqueta: "PASÓ DE GRADO (PROMOVIDO)" }
          : { estado: "REPITIENTE", etiqueta: "REPITIENTE" };
      } else {
        const proms: number[] = [];
        materiasGrado.forEach(m => {
          const n = notasEstudiante[m.nombre];
          if (n && typeof n.L1 === "number" && typeof n.L2 === "number" && typeof n.L3 === "number") {
            proms.push((n.L1 + n.L2 + n.L3) / 3);
          }
        });
        const promGeneral = proms.length > 0 ? proms.reduce((a, b) => a + b, 0) / proms.length : 0;
        return promGeneral >= 10
          ? { estado: "PROMOVIDO", etiqueta: "PASÓ DE AÑO (PROMOVIDO)" }
          : { estado: "REPITIENTE", etiqueta: "REPITIENTE" };
      }
    })();

    return (
      <motion.div
        id="boletin-print-area"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white p-10 shadow-2xl max-w-[21.59cm] mx-auto border border-gray-300 min-h-[27.94cm] flex flex-col font-serif text-black relative text-[10px]"
      >
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
          <div className="text-center">Posición: <span className="underline ml-1">{noLista} / {alumnosSeccion.length}</span></div>
          <div className="text-right">Momento: <span className="underline ml-1">Anual</span></div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <table className="w-full border-collapse border border-black text-left">
              <thead>
                <tr className="bg-gray-100 font-bold uppercase text-[8px]">
                  <th className="border border-black p-1.5 w-20 text-center">Código (PK)</th>
                  <th className="border border-black p-1.5 text-left">Área de Formación / Asignatura</th>
                  <th className="border border-black p-1.5 w-12 text-center">Lap 1</th>
                  <th className="border border-black p-1.5 w-12 text-center">Lap 2</th>
                  <th className="border border-black p-1.5 w-12 text-center">Lap 3</th>
                  <th className="border border-black p-1.5 w-14 text-center bg-gray-200">Definit.</th>
                </tr>
              </thead>
              <tbody>
                {materiasGrado.map((mat) => {
                  const n = notasEstudiante[mat.nombre] || { codigo: mat.codigo, L1: "-", L2: "-", L3: "-" };
                  const def = (nivel === "Primaria" || nivel === "Inicial")
                    ? promediarLiterales(n.L1, n.L2, n.L3)
                    : (typeof n.L1 === "number" && typeof n.L2 === "number" && typeof n.L3 === "number")
                    ? ((n.L1 + n.L2 + n.L3) / 3).toFixed(1)
                    : (typeof n.L1 === "number" ? n.L1 : "-");

                  return (
                    <tr key={mat.codigo} className="h-7">
                      <td className="border border-black px-1.5 text-center font-mono font-bold text-[8px]">{mat.codigo}</td>
                      <td className="border border-black px-2 font-bold uppercase text-[8px]">{mat.nombre}</td>
                      <td className="border border-black text-center font-bold">{n.L1}</td>
                      <td className="border border-black text-center font-bold">{n.L2}</td>
                      <td className="border border-black text-center font-bold">{n.L3}</td>
                      <td className="border border-black text-center font-black bg-gray-50">{def}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="w-44 space-y-4">
            <div className="border border-black p-2.5 rounded-sm text-left">
              <p className="font-bold text-[8px] border-b border-black pb-1 mb-1.5 uppercase">Resumen Académico</p>
              <p className="text-[7px] uppercase text-gray-600 font-bold">Modalidad:</p>
              <p className="text-[8px] font-black mb-2">Evaluación {(nivel === "Primaria" || nivel === "Inicial") ? "Cualitativa" : "Cuantitativa"}</p>
              <p className="text-[7px] uppercase text-gray-600 font-bold">Promedio Anual:</p>
              <p className="text-[10px] font-black text-black mb-2">{resumenGeneral}</p>
              <p className="text-[7px] uppercase text-gray-600 font-bold">Condición Final:</p>
              <p className={`text-[8px] font-black uppercase ${
                condicionFinalBoletin.estado === "PROMOVIDO"
                  ? "text-emerald-700"
                  : condicionFinalBoletin.estado === "REPITIENTE"
                  ? "text-red-700"
                  : "text-amber-700"
              }`}>
                {condicionFinalBoletin.etiqueta}
              </p>
            </div>
            <div className="border border-black p-2 h-32 flex flex-col items-center justify-center text-center text-gray-400 text-[7px] font-bold italic">
              <div className="w-16 h-16 border border-black border-dashed rounded-full flex items-center justify-center">Sello del Plantel</div>
            </div>
          </div>
        </div>

        <div className="mt-6 border border-black p-3 flex-1 text-left">
          <p className="font-black border-b border-black pb-1 mb-2 uppercase text-[9px]">Observaciones y Recomendaciones:</p>
          <p className="text-[9px] italic text-gray-800 mb-3">
            {selectedStudent.observations || "El (la) estudiante ha cumplido satisfactoriamente con las competencias y evaluaciones programadas durante el período escolar."}
          </p>
          <div className="h-12 border-b border-black border-dotted mb-2"></div>
          <div className="h-8 border-b border-black border-dotted"></div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-24 pt-14 text-center text-[9px] font-bold italic uppercase px-10">
          <div className="border-t border-black pt-1">Coordinación de Control de Estudios</div>
          <div className="border-t border-black pt-1">
            Dirección del Plantel ({new Date().toLocaleDateString()})
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
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
             <button onClick={() => { setNivel("Inicial"); setPaso("grados"); }} className="group p-10 bg-white rounded-[3rem] border border-gray-100 shadow-sm hover:border-amber-500 hover:shadow-2xl transition-all text-left">
                <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-all mb-6 shadow-inner text-left"><Baby size={32}/></div>
                <h3 className="text-2xl font-black text-gray-800 uppercase italic">Educación Inicial</h3>
                <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest leading-none">Maternal, 1er, 2do y 3er Grupo</p>
             </button>
             <button onClick={() => { setNivel("Primaria"); setPaso("grados"); }} className="group p-10 bg-white rounded-[3rem] border border-gray-100 shadow-sm hover:border-green-500 hover:shadow-2xl transition-all text-left">
                <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 group-hover:bg-green-600 group-hover:text-white transition-all mb-6 shadow-inner text-left"><School size={32}/></div>
                <h3 className="text-2xl font-black text-gray-800 uppercase italic">Educación Primaria</h3>
                <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest leading-none">Evaluación cualitativa por asignaturas (1ero a 6to)</p>
             </button>
             <button onClick={() => { setNivel("Secundaria"); setPaso("grados"); }} className="group p-10 bg-white rounded-[3rem] border border-gray-100 shadow-sm hover:border-blue-500 hover:shadow-2xl transition-all text-left">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all mb-6 shadow-inner text-left"><GraduationCap size={32}/></div>
                <h3 className="text-2xl font-black text-gray-800 uppercase italic">Media General</h3>
                <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest leading-none">Evaluación cuantitativa por áreas (1er a 5to Año)</p>
             </button>
          </motion.div>
        )}

        {paso === "grados" && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {listaGrados.map(g => {
              const count = estudiantes.filter(e => (e.nivel || e.level) === nivel && e.grade === g).length;
              return (
                <button key={g} onClick={() => { setGradoSel(g); setPaso("secciones"); }} className="p-8 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-green-400 transition-all text-left group">
                  <h4 className="text-xl font-black text-gray-800 uppercase italic leading-none mb-2">{g}</h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{count} Estudiantes</p>
                </button>
              );
            })}
          </motion.div>
        )}

        {paso === "secciones" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {seccionesDelGrado.map(sec => (
                <div key={sec.nombre} className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
                  <div className="px-10 py-5 bg-gray-50 border-b border-gray-100 flex justify-between items-center text-left">
                    <h3 className="font-black text-gray-700 uppercase italic tracking-tighter">
                      {gradoSel} — Sección "{sec.nombre}" ({sec.alumnos.length} Estudiantes)
                    </h3>
                  </div>
                  <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sec.alumnos.map(est => (
                      <div key={est.id} onClick={() => cargarNotasReales(est)} className="p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-green-400 hover:bg-white cursor-pointer transition-all flex items-center justify-between group">
                        <div>
                          <p className="text-xs font-black text-gray-700 uppercase">{est.lastName}, {est.firstName}</p>
                          <p className="text-[10px] font-mono text-gray-400">{est.ci}</p>
                        </div>
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
            <div className="flex flex-wrap justify-between items-center gap-4 no-print">
               <button onClick={() => setPaso("secciones")} className="px-8 py-4 bg-white text-gray-500 font-black text-[11px] uppercase rounded-2xl border border-gray-200 hover:text-green-600 shadow-sm transition-all flex items-center gap-3"><ArrowLeft size={18}/> Regresar a la Sección</button>
               <div className="flex items-center gap-3">
                 <button onClick={handleDescargarPDF} className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-[11px] uppercase rounded-2xl shadow-lg transition-all flex items-center gap-2">
                   <FileDown size={18}/> Guardar PDF
                 </button>
                 <button onClick={handleImprimirBoletin} className="px-10 py-4 bg-green-600 hover:bg-green-700 text-white font-black text-[11px] uppercase rounded-2xl shadow-xl transition-all flex items-center gap-3">
                   <Printer size={18}/> Imprimir Boletín
                 </button>
               </div>
            </div>
            <BoletinPreview />
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media print {
          body * { visibility: hidden !important; background: white !important; }
          .no-print { display: none !important; }
          #boletin-print-area, #boletin-print-area * { visibility: visible !important; }
          #boletin-print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; border: none !important; box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
};

export default Reportes;
