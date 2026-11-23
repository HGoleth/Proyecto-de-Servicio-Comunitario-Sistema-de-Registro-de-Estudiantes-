import React, { useState, useEffect, useMemo } from "react";
import NotasReportModal from "../../components/notas/NotasReportModal";
import NotasSuccessModal from "../../components/notas/NotasSuccessModal";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  BookOpen, 
  ArrowLeft, Plus, Trash2, CheckCircle,
  ChevronLeft,
  Calendar, Settings2, ListChecks,
  FileText, TrendingUp,
  AlertTriangle, Clock, FileDown
} from "lucide-react";

interface CustomElectron {
  obtenerMaterias: () => Promise<any[]>;
  getPensum?: () => Promise<any[]>;
  getStudents: () => Promise<any[]>;
  getConfig?: () => Promise<any>;
  obtenerDistribucion: () => Promise<any[]>; 
  actualizarConfiguracionLapsos: (datos: any) => Promise<{ success: boolean }>;
  guardarNotasSeccion: (datos: any) => Promise<{ success: boolean }>;
  obtenerNotasSeccion: (seccionId: string, materia: string) => Promise<any>; 
}

const PLAN_ESTUDIOS_FALLBACK: Record<string, string[]> = {
  "1er Año": ["Castellano", "Inglés y Otras Lenguas", "Matemáticas", "Educación Física", "Arte y Patrimonio", "Ciencias Naturales", "Geografía, Historia y Ciudadanía", "Orientación y Convivencia", "Grupos de Creación y Producción"],
  "2do Año": ["Castellano", "Inglés y Otras Lenguas", "Matemáticas", "Educación Física", "Arte y Patrimonio", "Ciencias Naturales", "Geografía, Historia y Ciudadanía", "Orientación y Convivencia", "Grupos de Creación y Producción"],
  "3er Año": ["Castellano", "Inglés y Otras Lenguas", "Matemáticas", "Educación Física", "Física", "Química", "Biología", "Geografía, Historia y Ciudadanía", "Orientación y Convivencia", "Grupos de Creación y Producción"],
  "4to Año": ["Castellano", "Inglés y Otras Lenguas", "Matemáticas", "Educación Física", "Física", "Química", "Biología", "Geografía, Historia y Ciudadanía", "Formación para la Soberanía", "Orientación y Convivencia", "Grupos de Creación y Producción"],
  "5to Año": ["Castellano", "Inglés y Otras Lenguas", "Matemáticas", "Educación Física", "Física", "Química", "Biología", "Ciencias de la Tierra", "Geografía, Historia y Ciudadanía", "Formación para la Soberanía", "Orientación y Convivencia", "Grupos de Creación y Producción"],
  "1ero": ["Castellano", "Matemáticas", "Ciencias Naturales", "Ciencias Sociales", "Estética", "Educación Física"],
  "2do": ["Castellano", "Matemáticas", "Ciencias Naturales", "Ciencias Sociales", "Estética", "Educación Física"],
  "3ero": ["Castellano", "Matemáticas", "Ciencias Naturales", "Ciencias Sociales", "Estética", "Educación Física"],
  "4to": ["Castellano", "Matemáticas", "Ciencias Naturales", "Ciencias Sociales", "Estética", "Educación Física"],
  "5to": ["Castellano", "Matemáticas", "Ciencias Naturales", "Ciencias Sociales", "Estética", "Educación Física"],
  "6to": ["Castellano", "Matemáticas", "Ciencias Naturales", "Ciencias Sociales", "Estética", "Educación Física"],
};

const DEFAULT_EVALUACIONES: Record<number, any[]> = {
  1: [
    { id: 101, nombre: "Evaluación 1", peso: 25 },
    { id: 102, nombre: "Evaluación 2", peso: 25 },
    { id: 103, nombre: "Evaluación 3", peso: 25 },
    { id: 104, nombre: "Evaluación 4", peso: 25 },
  ],
  2: [
    { id: 201, nombre: "Evaluación 1", peso: 25 },
    { id: 202, nombre: "Evaluación 2", peso: 25 },
    { id: 203, nombre: "Evaluación 3", peso: 25 },
    { id: 204, nombre: "Evaluación 4", peso: 25 },
  ],
  3: [
    { id: 301, nombre: "Evaluación 1", peso: 25 },
    { id: 302, nombre: "Evaluación 2", peso: 25 },
    { id: 303, nombre: "Evaluación 3", peso: 25 },
    { id: 304, nombre: "Evaluación 4", peso: 25 },
  ],
};

const Notas: React.FC = () => {
  const navigate = useNavigate();

  const [nivel, setNivel] = useState<"Primaria" | "Secundaria">("Secundaria");
  const [paso, setPaso] = useState<"secciones" | "materias" | "estudiantes">("secciones");
  const [seccionSel, setSeccionSel] = useState<any>(null);
  const [materiaSel, setMateriaSel] = useState<string | null>(null);
  const [lapsoActivo, setLapsoActivo] = useState<number>(1);
  const [filtroAño, setFiltroAño] = useState<string>("Todos");
  const [showPlanificacion, setShowPlanificacion] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoadingPersistence, setIsLoadingPersistence] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [showPDFPreview, setShowPDFPreview] = useState<boolean>(false);
  const [ultimaSincronizacion, setUltimaSincronizacion] = useState<string | null>(null);

  const [evaluacionesPorLapso, setEvaluacionesPorLapso] = useState<Record<number, any[]>>(DEFAULT_EVALUACIONES);
  const [distribucion, setDistribucion] = useState<any[]>([]);
  const [estudiantes, setEstudiantes] = useState<any[]>([]);
  const [pensumMaterias, setPensumMaterias] = useState<any[]>([]);
  const [periodoActivo, setPeriodoActivo] = useState<string>(() => localStorage.getItem("sistema_periodo_activo") || "2025-2026");
  
  // Guardamos las notas como strings normalizados para no perder decimales ni focus durante la edición
  const [notasAlumnos, setNotasAlumnos] = useState<Record<string, Record<string | number, string>>>({});

  const [membrete, setMembrete] = useState({
    linea1: "REPÚBLICA BOLIVARIANA DE VENEZUELA",
    linea2: "MINISTERIO DEL PODER POPULAR PARA LA EDUCACIÓN",
    linea3: "DIRECCIÓN SECTORIAL DE EDUCACIÓN",
    nombreInstitucion: 'U.E. "REPÚBLICA DE CHILE"',
    ubicacion: "EL ESPINAL - MUNICIPIO DÍAZ",
  });

  // Carga inicial única (sin dependencias volátiles)
  useEffect(() => {
    let isMounted = true;
    const cargarDatos = async () => {
      try {
        const electronApi = (window as any).electron as CustomElectron;
        if (!electronApi) return;

        const sts = await electronApi.getStudents();
        if (!isMounted) return;

        setEstudiantes(sts || []);

        if (electronApi.getConfig) {
          try {
            const cfg = await electronApi.getConfig();
            if (isMounted && cfg?.periodo) {
              setPeriodoActivo(cfg.periodo);
              localStorage.setItem("sistema_periodo_activo", cfg.periodo);
            }
          } catch (ce) {
            console.error("Error al cargar config institucional en notas:", ce);
          }
        }

        if (electronApi.getPensum) {
          try {
            const p = await electronApi.getPensum();
            if (isMounted && Array.isArray(p) && p.length > 0) {
              setPensumMaterias(p);
            }
          } catch (pe) {
            console.error("Error al cargar pensum:", pe);
          }
        }

        // Construir catálogo de secciones basadas en estudiantes reales
        const seccionesMap = new Map<string, any>();
        (sts || []).forEach((s: any) => {
          const g = s.grade || (s.nivel === "Primaria" ? "1ero" : "1er Año");
          const rawSec = s.section && s.section !== "N/A" ? s.section : "A";
          const niv = s.nivel || (g.includes("Año") ? "Secundaria" : "Primaria");
          const key = `${g}-${rawSec}-${niv}`;

          if (!seccionesMap.has(key)) {
            seccionesMap.set(key, {
              id: key,
              nombre: `Sección ${rawSec}`,
              año: g,
              nivel: niv,
              seccion: rawSec
            });
          }
        });

        // Garantizar al menos secciones A y B por cada grado si la base está vacía
        if (seccionesMap.size === 0) {
          ["1er Año", "2do Año", "3er Año", "4to Año", "5to Año"].forEach(g => {
            ["A", "B"].forEach(sec => {
              const key = `${g}-${sec}-Secundaria`;
              seccionesMap.set(key, { id: key, nombre: `Sección ${sec}`, año: g, nivel: "Secundaria", seccion: sec });
            });
          });
          ["1ero", "2do", "3ero", "4to", "5to", "6to"].forEach(g => {
            ["A", "B"].forEach(sec => {
              const key = `${g}-${sec}-Primaria`;
              seccionesMap.set(key, { id: key, nombre: `Sección ${sec}`, año: g, nivel: "Primaria", seccion: sec });
            });
          });
        }

        setDistribucion(Array.from(seccionesMap.values()));
      } catch (e) {
        console.error("Error al cargar datos en Notas:", e);
      }
    };

    cargarDatos();

    const saved = localStorage.getItem("membrete_institucional");
    if (saved) {
      try {
        setMembrete(JSON.parse(saved));
      } catch (e) {
        console.error("Error al cargar membrete:", e);
      }
    }

    return () => { isMounted = false; };
  }, []);

  // Carga de persistencia controlada (sólo cambia si cambia seccion o materia)
  const seccionId = seccionSel?.id;
  useEffect(() => {
    let isMounted = true;
    const cargarPersistencia = async () => {
      if (paso === "estudiantes" && seccionId && materiaSel) {
        setIsLoadingPersistence(true);
        try {
          const electronApi = (window as any).electron as CustomElectron;
          const dataExistente = electronApi?.obtenerNotasSeccion 
            ? await electronApi.obtenerNotasSeccion(seccionId, materiaSel)
            : null;

          if (!isMounted) return;

          if (dataExistente) {
            if (dataExistente.planificacion) {
              setEvaluacionesPorLapso(dataExistente.planificacion);
            }
            if (dataExistente.notas) {
              setNotasAlumnos(dataExistente.notas);
            }
            setUltimaSincronizacion(dataExistente.fechaActualizacion || null);
          } else {
            setNotasAlumnos({});
            setUltimaSincronizacion(null);
            setEvaluacionesPorLapso(DEFAULT_EVALUACIONES);
          }
        } catch (err) {
          console.error("Error al recuperar notas:", err);
        } finally {
          if (isMounted) setIsLoadingPersistence(false);
        }
      }
    };

    cargarPersistencia();
    return () => { isMounted = false; };
  }, [paso, seccionId, materiaSel]);

  const totalPorcentajeLapso = (l: number): number => 
    (evaluacionesPorLapso[l] || []).reduce((sum, ev) => sum + (Number(ev.peso) || 0), 0);

  const esLapsoValido = (l: number): boolean => totalPorcentajeLapso(l) === 100;

  const sincronizarConBaseDeDatos = async () => {
    if (!seccionSel || !materiaSel) return;
    
    const pct = totalPorcentajeLapso(lapsoActivo);
    if (pct !== 100) {
      const confirmSave = window.confirm(
        `⚠️ El Lapso ${lapsoActivo} suma ${pct}% de 100% de la planificación.\n\n¿Desea guardar el avance de calificaciones de todas formas?`
      );
      if (!confirmSave) return;
    }

    setIsSaving(true);
    const ahora = new Date().toLocaleString();
    const datosParaGuardar = {
      seccionId: seccionSel.id,
      materia: materiaSel,
      planificacion: evaluacionesPorLapso,
      notas: notasAlumnos,
      fechaActualizacion: ahora
    };

    try {
      const electronApi = (window as any).electron as CustomElectron;
      const res = await electronApi.guardarNotasSeccion(datosParaGuardar);
      if (res && res.success) {
        setUltimaSincronizacion(ahora);
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error(error);
      alert("Error al sincronizar con el disco.");
    } finally {
      setIsSaving(false);
    }
  };

  // Manejo de cambio de notas cuantitativas y cualitativas (SIN BUGS DE SELECCIÓN NI DE DECIMALES)
  const manejarCambioNota = (estId: string, evId: number | string, valor: string) => {
    if (nivel === "Primaria") {
      const valUpper = valor.toUpperCase().trim();
      if (valUpper === "") {
        setNotasAlumnos(prev => {
          const copia = { ...(prev[estId] || {}) };
          delete copia[evId];
          return { ...prev, [estId]: copia };
        });
        return;
      }
      if (["A", "B", "C", "D", "E"].includes(valUpper)) {
        setNotasAlumnos(prev => ({
          ...prev,
          [estId]: { ...(prev[estId] || {}), [evId]: valUpper }
        }));
      }
      return;
    }

    // Secundaria: permitir comas convertidas a puntos
    const normalizado = valor.replace(",", ".");

    // Permitir borrar completamente la casilla
    if (normalizado === "") {
      setNotasAlumnos(prev => {
        const copia = { ...(prev[estId] || {}) };
        delete copia[evId];
        return { ...prev, [estId]: copia };
      });
      return;
    }

    // Permitir dígitos y punto decimal mientras escribe (ej: "1", "18", "18.", "18.5")
    if (!/^\d{0,2}(\.\d{0,2})?$/.test(normalizado)) {
      return;
    }

    const numVal = parseFloat(normalizado);
    if (!isNaN(numVal) && numVal > 20) {
      // Limitar al máximo 20 puntos
      setNotasAlumnos(prev => ({
        ...prev,
        [estId]: { ...(prev[estId] || {}), [evId]: "20" }
      }));
      return;
    }

    // Guardar exactamente la cadena para no interferir con la posición del cursor
    setNotasAlumnos(prev => ({
      ...prev,
      [estId]: { ...(prev[estId] || {}), [evId]: normalizado }
    }));
  };

  // Al salir del campo (blur), formatear adecuadamente sin puntos colgados
  const manejarBlurNota = (estId: string, evId: number | string) => {
    if (nivel === "Secundaria") {
      const rawVal = notasAlumnos[estId]?.[evId];
      if (rawVal === undefined || rawVal === null || rawVal === "") return;

      let clean = String(rawVal).trim();
      if (clean.endsWith(".")) {
        clean = clean.slice(0, -1);
      }
      const num = parseFloat(clean);
      if (!isNaN(num)) {
        const clamped = Math.max(0, Math.min(20, Math.round(num * 10) / 10));
        setNotasAlumnos(prev => ({
          ...prev,
          [estId]: { ...(prev[estId] || {}), [evId]: String(clamped) }
        }));
      }
    }
  };

  // Cálculo de nota final del lapso
  const calcularNotaFinalLapso = (estId: string, lapso: number): string => {
    const notas = notasAlumnos[estId] || {};
    const evs = evaluacionesPorLapso[lapso] || [];
    if (evs.length === 0) return "—";

    const evsConNota = evs.filter(ev => {
      const v = notas[ev.id];
      return v !== undefined && v !== null && String(v).trim() !== "" && String(v) !== "—";
    });
    if (evsConNota.length === 0) return "—";

    if (nivel === "Primaria") {
      const equiv: Record<string, number> = { A: 20, B: 16, C: 12, D: 8, E: 4 };
      let acum = 0;
      evs.forEach(ev => {
        const valStr = String(notas[ev.id] || "").toUpperCase().trim();
        const pt = equiv[valStr] || 0;
        acum += pt * ((Number(ev.peso) || 0) / 100);
      });

      if (acum >= 18) return "A";
      if (acum >= 14) return "B";
      if (acum >= 10) return "C";
      if (acum >= 6) return "D";
      if (acum > 0) return "E";
      return "-";
    }

    const acumulado = evs.reduce((acc, ev) => {
      const valStr = String(notas[ev.id] || "").replace(",", ".");
      const notaVal = parseFloat(valStr);
      const safeNota = !isNaN(notaVal) ? notaVal : 0;
      return acc + (safeNota * ((Number(ev.peso) || 0) / 100));
    }, 0);

    return acumulado.toFixed(1);
  };

  // Cálculo del promedio acumulado del ciclo lectivo
  const calcularPromedioCiclo = (estId: string): string => {
    if (nivel === "Primaria") {
      const l1 = calcularNotaFinalLapso(estId, 1);
      const l2 = calcularNotaFinalLapso(estId, 2);
      const l3 = calcularNotaFinalLapso(estId, 3);
      const equiv: Record<string, number> = { A: 5, B: 4, C: 3, D: 2, E: 1 };
      const pts = [l1, l2, l3].map(l => equiv[l] || 0).filter(p => p > 0);
      if (pts.length === 0) return "—";
      const prom = Math.round(pts.reduce((a, b) => a + b, 0) / pts.length);
      return Object.keys(equiv).find(k => equiv[k] === prom) || "—";
    } else {
      const lapsosValidos: number[] = [];
      [1, 2, 3].forEach(l => {
        const nota = calcularNotaFinalLapso(estId, l);
        if (nota !== "—") {
          const parsed = parseFloat(nota);
          if (!isNaN(parsed)) lapsosValidos.push(parsed);
        }
      });
      if (lapsosValidos.length === 0) return "—";
      const prom = lapsosValidos.reduce((a, b) => a + b, 0) / lapsosValidos.length;
      return prom.toFixed(1);
    }
  };

  const actualizarEvaluacion = (id: number, campo: string, valor: any) => {
    let v = valor;
    if (campo === "peso") {
      if (valor === "" || valor === undefined) v = 0;
      else {
        const parsed = parseInt(valor, 10);
        v = isNaN(parsed) ? 0 : Math.max(0, Math.min(100, parsed));
      }
    }
    setEvaluacionesPorLapso(prev => ({
      ...prev,
      [lapsoActivo]: prev[lapsoActivo].map(e => e.id === id ? { ...e, [campo]: v } : e)
    }));
  };

  const agregarFila = () => {
    const currentEvs = evaluacionesPorLapso[lapsoActivo] || [];
    if (currentEvs.length >= 6) return;
    const nextNum = currentEvs.length + 1;
    const newId = (lapsoActivo * 100) + nextNum;
    setEvaluacionesPorLapso(prev => ({
      ...prev,
      [lapsoActivo]: [...(prev[lapsoActivo] || []), { id: newId, nombre: `Evaluación ${nextNum}`, peso: 0 }]
    }));
  };

  const getCodigoMateria = (materia: string | null) => {
    if (!materia || !seccionSel) return "S/C";
    const found = pensumMaterias.find(
      (m: any) => m.nombre?.toLowerCase().trim() === materia.toLowerCase().trim() && m.grado === seccionSel.año
    );
    if (found && (found.codigo || found.id)) {
      return (found.codigo || found.id).toUpperCase();
    }
    const cleanName = materia.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z0-9]/g, "");
    const prefix = cleanName.substring(0, 3) || "MAT";
    const gradClean = (seccionSel.año || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "").toUpperCase();
    return `${prefix}-${gradClean}`;
  };

  // Lista de materias para el año seleccionado
  const materiasDisponibles = useMemo(() => {
    if (!seccionSel) return [];
    if (nivel === "Primaria") {
      return ["Aula Regular", "Educación Física", "Arte y Patrimonio"];
    }
    const materiasPensumGrado = pensumMaterias
      .filter((m: any) => m.grado === seccionSel.año && m.nivel === "Secundaria")
      .map((m: any) => m.nombre);
    
    if (materiasPensumGrado.length > 0) {
      return materiasPensumGrado;
    }
    return PLAN_ESTUDIOS_FALLBACK[seccionSel.año] || [];
  }, [seccionSel, nivel, pensumMaterias]);

  // Alumnos filtrados de forma segura
  const estudiantesFiltrados = useMemo(() => {
    if (!seccionSel) return [];
    return estudiantes.filter(e => {
      const matchGrado = (e.grade || "").toLowerCase().trim() === (seccionSel.año || "").toLowerCase().trim();
      const secEst = (e.section && e.section !== "N/A" ? e.section : "A").trim().toUpperCase();
      const secSel = (seccionSel.seccion || seccionSel.nombre?.replace("Sección ", "") || "A").trim().toUpperCase();
      return matchGrado && (secEst === secSel || (!e.section && secSel === "A"));
    });
  }, [estudiantes, seccionSel]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 md:p-6 max-w-[100vw] mx-auto space-y-4 font-sans text-gray-800 bg-[#f8fafc] min-h-screen text-left print:bg-white print:p-0">
      
      {/* Botón Volver al Home */}
      <div className="flex flex-col gap-2 mb-1 w-full no-print">
        <div className="flex items-center gap-4">
          <button 
            type="button"
            onClick={() => navigate("/dashboard")} 
            className="flex items-center gap-2 text-gray-500 hover:text-[#5564eb] transition-all group"
          >
            <div className="p-2 bg-white rounded-xl shadow-sm group-hover:shadow-md border border-gray-100 transition-all">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            </div>
            <span className="text-xs font-black uppercase tracking-wider leading-none">Volver al Home</span>
          </button>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #reporte-oficial, #reporte-oficial * { visibility: visible !important; }
          #reporte-oficial { position: absolute; left: 0; top: 0; width: 100%; height: auto; }
          .no-print { display: none !important; }
        }
      `}</style>

      <NotasSuccessModal 
        isOpen={showSuccessModal} 
        onClose={() => setShowSuccessModal(false)} 
      />

      <NotasReportModal
        isOpen={showPDFPreview}
        onClose={() => setShowPDFPreview(false)}
        membrete={membrete}
        materiaSel={materiaSel}
        seccionSel={seccionSel}
        evaluacionesPorLapso={evaluacionesPorLapso}
        estudiantesFiltrados={estudiantesFiltrados}
        notasAlumnos={notasAlumnos as any}
        nivel={nivel}
        calcularNotaFinalLapso={calcularNotaFinalLapso}
        calcularPromedioCiclo={calcularPromedioCiclo}
        codigoMateria={getCodigoMateria(materiaSel)}
        periodo={periodoActivo}
      />

      {/* Header con Barra de Nivel y Periodo */}
      <header className="flex justify-between items-center gap-2 bg-gradient-to-r from-[#5564eb] to-[#3948b8] p-3 rounded-2xl shadow-lg border border-blue-600/30 no-print">
        <div className="flex bg-white/20 p-1 rounded-full backdrop-blur-md">
          <button 
            type="button"
            onClick={() => { setNivel("Primaria"); setPaso("secciones"); }} 
            className={`px-6 py-2 rounded-full text-xs font-black uppercase transition-all ${
              nivel === "Primaria" ? "bg-white text-[#5564eb] shadow-md" : "text-white/80 hover:text-white"
            }`}
          >
            Primaria
          </button>
          <button 
            type="button"
            onClick={() => { setNivel("Secundaria"); setPaso("secciones"); }} 
            className={`px-6 py-2 rounded-full text-xs font-black uppercase transition-all ${
              nivel === "Secundaria" ? "bg-white text-[#5564eb] shadow-md" : "text-white/80 hover:text-white"
            }`}
          >
            Secundaria
          </button>
        </div>
        <div className="flex items-center gap-2 bg-white/95 px-5 py-2 rounded-full shadow-sm text-xs font-black uppercase text-[#5564eb] tracking-widest">
          <Calendar size={14} /> CICLO {periodoActivo}
        </div>
      </header>

      {/* Título de la Sección */}
      <div className="flex items-center gap-4 px-2 py-2 text-left no-print">
        <div className="p-3 bg-gradient-to-br from-[#5564eb] to-[#3948b8] rounded-2xl shadow-lg text-white">
          <FileText size={24} />
        </div>
        <div className="flex flex-col text-left">
          <h1 className="text-2xl font-black text-gray-800 tracking-tight uppercase italic leading-none">
            {paso === 'secciones' ? 'Control de Calificaciones' : paso === 'materias' ? 'Registro por Asignatura' : 'Planilla Académica'}
          </h1>
          <div className="flex items-center gap-2 mt-1.5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sincronización en Tiempo Real</p>
            {ultimaSincronizacion && (
              <span className="text-[10px] bg-blue-50 text-[#5564eb] px-2.5 py-0.5 rounded-full font-bold border border-blue-100 uppercase flex items-center gap-1">
                <Clock size={11}/> Último Respaldo: {ultimaSincronizacion}
              </span>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {paso === "secciones" ? (
          <motion.div key="secciones" className="space-y-4 pt-1 text-left px-2 no-print">
            {/* Filtros de Grado / Año */}
            <div className="flex flex-wrap gap-2 justify-center">
              {(nivel === "Secundaria" ? ["Todos", "1er Año", "2do Año", "3er Año", "4to Año", "5to Año"] : ["Todos", "1ero", "2do", "3ero", "4to", "5to", "6to"]).map((opt: string) => (
                <button 
                  key={opt} 
                  type="button"
                  onClick={() => setFiltroAño(opt)} 
                  className={`px-5 py-2 rounded-full text-xs font-black uppercase transition-all ${
                    filtroAño === opt ? "bg-[#5564eb] text-white shadow-lg shadow-blue-200" : "bg-white text-gray-500 border border-gray-200 hover:border-[#5564eb]"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>

            {/* Cuadrícula de Secciones */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {distribucion.filter(s => s.nivel === nivel && (filtroAño === "Todos" || s.año === filtroAño)).map((item) => (
                <motion.div 
                  whileHover={{ scale: 1.02 }} 
                  onClick={() => { setSeccionSel(item); setPaso("materias"); }} 
                  key={item.id} 
                  className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:border-[#5564eb] hover:shadow-md transition-all text-left group"
                >
                  <span className="text-xs font-black text-[#5564eb] uppercase tracking-wider block mb-1">{item.año}</span>
                  <h3 className="text-sm font-black text-gray-700 uppercase truncate leading-none group-hover:text-[#5564eb] transition-colors">{item.nombre}</h3>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : paso === "materias" ? (
          <motion.div key="materias" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5 text-left px-2 no-print">
            <button 
              type="button"
              onClick={() => setPaso("secciones")} 
              className="flex items-center gap-2 text-gray-500 hover:text-[#5564eb] transition-colors font-bold uppercase text-xs px-1"
            >
              <ChevronLeft size={16}/> Volver a Secciones
            </button>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {materiasDisponibles.map((materia) => (
                <button 
                  key={getCodigoMateria(materia)} 
                  type="button"
                  onClick={() => { setMateriaSel(materia); setPaso("estudiantes"); }} 
                  className="p-6 bg-white rounded-3xl border border-gray-100 hover:border-[#5564eb] hover:shadow-lg shadow-sm transition-all text-left flex flex-col justify-between h-40 group"
                >
                  <div className="flex justify-between items-start w-full">
                    <div className="bg-blue-50 p-3 rounded-2xl text-[#5564eb] group-hover:bg-[#5564eb] group-hover:text-white transition-colors duration-300">
                      <BookOpen size={22} />
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-gray-400 uppercase mb-0.5">Código Único</p>
                      <p className="text-xs font-mono font-black text-[#5564eb] bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-100 uppercase">
                        {getCodigoMateria(materia)}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-gray-800 uppercase tracking-tight leading-tight group-hover:text-[#5564eb] transition-colors">
                    {materia}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div key="planilla" className="space-y-4 text-left px-2 no-print">
            {isLoadingPersistence ? (
              <div className="h-64 flex flex-col items-center justify-center bg-white rounded-3xl shadow-sm border border-gray-100">
                <div className="w-10 h-10 border-4 border-blue-100 border-t-[#5564eb] rounded-full animate-spin mb-4" />
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest italic">Recuperando Registro Académico...</p>
              </div>
            ) : (
              <>
                {/* Métricas Resumen */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-2xl shadow-sm flex items-center justify-between border border-gray-100">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">Puntos Lapso {lapsoActivo}</p>
                      <p className={`text-2xl font-black ${esLapsoValido(lapsoActivo) ? 'text-[#5564eb]' : 'text-amber-500'} font-mono`}>
                        {((totalPorcentajeLapso(lapsoActivo) * 20) / 100).toFixed(1)} / 20.0 pts
                      </p>
                    </div>
                    <TrendingUp className={esLapsoValido(lapsoActivo) ? "text-blue-300" : "text-amber-300"} size={32}/>
                  </div>

                  <div className={`p-5 rounded-2xl shadow-sm flex items-center justify-between border transition-all ${
                    esLapsoValido(lapsoActivo) ? 'bg-white border-gray-100' : 'bg-amber-50/60 border-amber-200'
                  }`}>
                    <div>
                      <p className={`text-[10px] font-black uppercase mb-1 tracking-wider ${
                        esLapsoValido(lapsoActivo) ? 'text-gray-400' : 'text-amber-700'
                      }`}>
                        Carga de Planificación
                      </p>
                      <p className={`text-2xl font-black font-mono ${
                        esLapsoValido(lapsoActivo) ? 'text-[#5564eb]' : 'text-amber-600'
                      }`}>
                        {totalPorcentajeLapso(lapsoActivo)}%
                      </p>
                    </div>
                    {esLapsoValido(lapsoActivo) ? (
                      <ListChecks className="text-blue-300" size={32}/>
                    ) : (
                      <AlertTriangle className="text-amber-500 animate-pulse" size={32}/>
                    )}
                  </div>

                  <div className="bg-white p-5 rounded-2xl shadow-sm flex items-center justify-between border border-gray-100">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase mb-1 tracking-wider">Código Único de Materia</p>
                      <p className="text-lg font-mono font-black text-[#5564eb] uppercase">
                        {getCodigoMateria(materiaSel)}
                      </p>
                    </div>
                    <BookOpen className="text-blue-300" size={32}/>
                  </div>
                </div>

                {/* Contenedor Principal de la Planilla */}
                <div className="bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden">
                  
                  {/* Barra de Sub-cabecera */}
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/70">
                    <div className="flex gap-4 items-center">
                      <button 
                        type="button"
                        onClick={() => setPaso("materias")} 
                        className="p-2.5 bg-white text-[#5564eb] rounded-xl shadow-sm border border-gray-200 hover:bg-[#5564eb] hover:text-white transition-all"
                      >
                        <ChevronLeft size={18}/>
                      </button>
                      <div>
                        <h2 className="text-base font-black uppercase text-gray-800 leading-none tracking-tight">
                          {seccionSel?.año} - {seccionSel?.nombre} 
                          <span className="text-[#5564eb] ml-2 font-black">| {materiaSel}</span>
                        </h2>
                        <p className="text-xs font-mono font-bold text-gray-400 uppercase mt-1 tracking-wider">
                          Código: {getCodigoMateria(materiaSel)}
                        </p>
                      </div>
                    </div>
                    
                    <button 
                      type="button"
                      onClick={() => setShowPlanificacion(!showPlanificacion)} 
                      className={`px-5 py-2.5 rounded-xl border flex items-center gap-2 shadow-sm transition-all ${
                        showPlanificacion 
                          ? 'bg-[#5564eb] text-white border-[#5564eb] shadow-blue-100' 
                          : 'bg-white text-gray-700 border-gray-200 hover:border-[#5564eb] hover:text-[#5564eb]'
                      }`}
                    >
                      <Settings2 size={16} />
                      <span className="text-xs font-black uppercase tracking-wider leading-none">Planificación</span>
                    </button>
                  </div>

                  {/* Panel Desplegable de Planificación de Evaluaciones */}
                  <AnimatePresence>
                    {showPlanificacion && (
                      <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="bg-blue-50/30 border-b border-blue-100 overflow-hidden">
                        <div className="p-5 space-y-5 max-w-6xl mx-auto">
                          <div className="flex flex-wrap justify-between items-center bg-white p-3 rounded-2xl border border-blue-100 shadow-sm gap-4">
                            <div className="flex gap-2">
                              {[1, 2, 3].map((l: number) => (
                                <button 
                                  key={l} 
                                  type="button"
                                  onClick={() => setLapsoActivo(l)} 
                                  className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${
                                    lapsoActivo === l 
                                      ? "bg-[#5564eb] text-white shadow-md shadow-blue-200" 
                                      : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                                  }`}
                                >
                                  Lapso {l}
                                </button>
                              ))}
                            </div>
                            
                            <div className="flex flex-col items-center flex-1 max-w-[280px] px-4">
                              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-1 border border-gray-200">
                                <motion.div 
                                  animate={{ width: `${Math.min(100, totalPorcentajeLapso(lapsoActivo))}%` }} 
                                  className={`h-full ${esLapsoValido(lapsoActivo) ? 'bg-[#5564eb]' : 'bg-amber-500'}`} 
                                />
                              </div>
                              <span className={`text-[11px] font-black ${esLapsoValido(lapsoActivo) ? 'text-[#5564eb]' : 'text-amber-600'}`}>
                                {((totalPorcentajeLapso(lapsoActivo) * 20) / 100).toFixed(1)} / 20.0 pts Planificados ({totalPorcentajeLapso(lapsoActivo)}%)
                              </span>
                            </div>

                            <button 
                              type="button"
                              onClick={agregarFila} 
                              className="bg-[#5564eb] text-white px-4 py-2 rounded-xl shadow-md hover:bg-[#4353d8] active:scale-95 transition-all flex items-center gap-1.5 text-xs font-bold uppercase"
                            >
                              <Plus size={16}/> Agregar Evaluación
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {(evaluacionesPorLapso[lapsoActivo] || []).map((ev, i: number) => (
                              <div 
                                key={ev.id} 
                                className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 hover:border-[#5564eb] transition-all flex flex-col gap-3"
                              >
                                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                  <span className="text-[10px] font-black text-[#5564eb] uppercase tracking-wider">
                                    Evaluación {i + 1}
                                  </span>
                                  {(evaluacionesPorLapso[lapsoActivo] || []).length > 1 && (
                                    <button 
                                      type="button"
                                      onClick={() => setEvaluacionesPorLapso(prev => ({
                                        ...prev, 
                                        [lapsoActivo]: prev[lapsoActivo].filter(x => x.id !== ev.id)
                                      }))}
                                      className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                      title="Eliminar evaluación"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </div>
                                
                                <input 
                                  type="text" 
                                  value={ev.nombre} 
                                  onChange={(e) => actualizarEvaluacion(ev.id, "nombre", e.target.value)} 
                                  className="text-xs font-bold outline-none bg-gray-50 p-2.5 rounded-xl border border-gray-200 focus:border-[#5564eb] focus:bg-white text-gray-800 placeholder:text-gray-400 w-full" 
                                  placeholder="Ej: Taller, Examen, Exposición..." 
                                />

                                <div className="flex justify-between items-center mt-1">
                                  <div className="flex items-center gap-2 bg-blue-50/50 px-3 py-1.5 rounded-xl border border-blue-100 w-28">
                                    <input 
                                      type="number" 
                                      min={0}
                                      max={100}
                                      value={ev.peso === 0 ? "" : ev.peso} 
                                      onChange={(e) => actualizarEvaluacion(ev.id, "peso", e.target.value)} 
                                      placeholder="0"
                                      className="w-full text-xs font-black text-[#5564eb] bg-transparent outline-none text-center" 
                                    />
                                    <span className="text-xs text-[#5564eb] font-bold">%</span>
                                  </div>
                                  <div className="bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">
                                    <span className="text-xs font-black text-[#5564eb]">
                                      {(((Number(ev.peso) || 0) * 20) / 100).toFixed(1)} pts
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Tabla Principal de Calificaciones */}
                  <div className="overflow-x-auto bg-white scrollbar-thin scrollbar-thumb-blue-200">
                    <table className="w-full text-left border-collapse min-w-[960px]">
                      <thead>
                        {/* Fila 1 de Encabezados (Lapsos y Promedio) */}
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <th className="p-3 text-xs font-black text-gray-600 uppercase sticky left-0 bg-gray-50 z-20 w-[210px] min-w-[210px] border-r border-gray-200 shadow-sm">
                            Ficha Estudiante
                          </th>

                          {[1, 2, 3].map((l: number) => {
                            const cantEvs = (evaluacionesPorLapso[l] || []).length;
                            return (
                              <th 
                                key={l} 
                                colSpan={cantEvs + 1}
                                className={`p-0 border-l border-blue-300 ${
                                  lapsoActivo === l ? 'bg-[#5564eb] text-white' : 'bg-[#5564eb]/90 text-white'
                                }`}
                              >
                                <div className="text-xs font-black py-2.5 text-center uppercase tracking-widest leading-none">
                                  Lapso {l}
                                </div>
                              </th>
                            );
                          })}

                          <th className="p-2 text-center bg-[#3948b8] text-white text-xs font-black uppercase w-[85px] min-w-[85px] border-l border-blue-900 leading-none">
                            Prom.<br/>Ciclo
                          </th>
                        </tr>

                        {/* Fila 2 de Encabezados (Subcolumnas por Evaluación) */}
                        <tr className="border-b border-gray-200 bg-gray-50/90 text-center">
                          <th className="p-2 sticky left-0 bg-gray-50 z-20 border-r border-gray-200 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            Nombres / C.I.
                          </th>

                          {[1, 2, 3].map((l: number) => (
                            <React.Fragment key={l}>
                              {(evaluacionesPorLapso[l] || []).map((ev, idx: number) => (
                                <th 
                                  key={ev.id} 
                                  className="p-2 border-l border-gray-200 text-center min-w-[70px] max-w-[100px] bg-gray-50/50"
                                >
                                  <p 
                                    className="text-[10px] font-black text-gray-700 truncate uppercase leading-tight mb-1" 
                                    title={ev.nombre || `Eval ${idx + 1}`}
                                  >
                                    {ev.nombre || `Eval ${idx + 1}`}
                                  </p>
                                  <span className="text-[9px] font-bold text-[#5564eb] bg-blue-50 px-2 py-0.5 rounded border border-blue-100 inline-block">
                                    {ev.peso}%
                                  </span>
                                </th>
                              ))}
                              
                              <th className="p-2 border-l border-blue-200 bg-blue-50 text-center text-[10px] font-black text-[#5564eb] w-[48px] min-w-[48px]">
                                Def L{l}
                              </th>
                            </React.Fragment>
                          ))}

                          <th className="p-2 bg-blue-100/60 text-center text-[10px] font-black text-blue-950 border-l border-blue-300">
                            Definitiva
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-100">
                        {estudiantesFiltrados.length === 0 ? (
                          <tr>
                            <td colSpan={20} className="p-8 text-center text-gray-400 font-bold uppercase text-xs">
                              No hay estudiantes inscritos en este grado y sección.
                            </td>
                          </tr>
                        ) : (
                          estudiantesFiltrados.map((est, idx) => (
                            <tr key={est.id || idx} className="h-12 hover:bg-blue-50/20 transition-colors group">
                              {/* Columna Estudiante (Sticky) */}
                              <td className="px-3 py-2 sticky left-0 bg-white z-10 border-r border-gray-200 shadow-sm overflow-hidden">
                                <p className="font-bold text-xs text-gray-800 uppercase truncate leading-tight group-hover:text-[#5564eb] transition-colors">
                                  {est.lastName}, {est.firstName}
                                </p>
                                <p className="text-[10px] font-semibold text-gray-400 font-mono tracking-wider mt-0.5">
                                  {est.ci ? `C.I. ${est.ci}` : 'Sin C.I.'}
                                </p>
                              </td>

                              {/* Lapsos 1, 2, 3 */}
                              {[1, 2, 3].map((l: number) => (
                                <React.Fragment key={l}>
                                  {(evaluacionesPorLapso[l] || []).map(ev => {
                                    const val = notasAlumnos[est.id]?.[ev.id];
                                    const displayVal = val !== undefined && val !== null ? String(val) : "";

                                    return (
                                      <td key={ev.id} className="p-1 border-l border-gray-100 text-center">
                                        <div className="flex justify-center items-center">
                                          <input 
                                            type="text" 
                                            value={displayVal}
                                            onChange={(e) => manejarCambioNota(est.id, ev.id, e.target.value)}
                                            onBlur={() => manejarBlurNota(est.id, ev.id)}
                                            onFocus={(e) => {
                                              e.target.select();
                                            }}
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter" || e.key === "ArrowDown") {
                                                e.preventDefault();
                                                const allInputs = document.querySelectorAll<HTMLInputElement>(`input[data-col="${ev.id}"]`);
                                                const list = Array.from(allInputs);
                                                const currIndex = list.indexOf(e.currentTarget);
                                                if (currIndex !== -1 && currIndex < list.length - 1) {
                                                  list[currIndex + 1].focus();
                                                  list[currIndex + 1].select();
                                                }
                                              } else if (e.key === "ArrowUp") {
                                                e.preventDefault();
                                                const allInputs = document.querySelectorAll<HTMLInputElement>(`input[data-col="${ev.id}"]`);
                                                const list = Array.from(allInputs);
                                                const currIndex = list.indexOf(e.currentTarget);
                                                if (currIndex > 0) {
                                                  list[currIndex - 1].focus();
                                                  list[currIndex - 1].select();
                                                }
                                              }
                                            }}
                                            data-col={ev.id}
                                            placeholder="—"
                                            className="w-12 h-8 text-center font-bold text-xs text-gray-800 bg-gray-50/70 hover:bg-white focus:bg-white rounded-lg border border-gray-200 focus:border-[#5564eb] focus:ring-2 focus:ring-[#5564eb]/25 outline-none transition-all shadow-sm"
                                          />
                                        </div>
                                      </td>
                                    );
                                  })}

                                  {/* Subtotal del Lapso */}
                                  <td className="p-1 border-l border-blue-100 bg-blue-50/40 text-center font-black text-xs text-[#5564eb] italic">
                                    {calcularNotaFinalLapso(est.id, l)}
                                  </td>
                                </React.Fragment>
                              ))}

                              {/* Promedio General del Ciclo */}
                              <td className="p-1 border-l border-blue-200 bg-blue-50/70 text-center font-black text-xs text-blue-900 italic">
                                {calcularPromedioCiclo(est.id)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Footer con Acciones */}
                  <div className="p-4 bg-gray-50 flex flex-wrap justify-between items-center gap-3 border-t border-gray-200">
                    <button 
                      type="button"
                      onClick={() => setShowPDFPreview(true)} 
                      className="px-6 py-2.5 bg-white text-[#5564eb] rounded-xl font-bold text-xs uppercase shadow-sm border border-blue-200 hover:bg-[#5564eb] hover:text-white transition-all flex items-center gap-2 active:scale-95"
                    >
                      <FileDown size={16}/> Planilla Institucional
                    </button>

                    <button 
                      type="button"
                      onClick={sincronizarConBaseDeDatos} 
                      disabled={isSaving} 
                      className="bg-[#5564eb] hover:bg-[#4353d8] text-white px-8 py-3 rounded-xl font-bold uppercase text-xs tracking-wider shadow-lg shadow-blue-200 transition-all flex items-center gap-2.5 active:scale-95 disabled:opacity-50"
                    >
                      {isSaving ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <CheckCircle size={16}/>
                      )}
                      {isSaving ? 'Sincronizando...' : 'Sincronizar Registro Académico'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Notas;
