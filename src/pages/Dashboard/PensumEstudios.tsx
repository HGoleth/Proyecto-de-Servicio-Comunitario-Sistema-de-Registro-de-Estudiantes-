import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Plus, Search, BookOpen, Clock, 
  Trash2, Edit3, Copy, RefreshCw, CheckCircle, 
  Layers, School, X,
  Bookmark, GraduationCap, Calendar
} from "lucide-react";
import { 
  AcademicLevel, 
  GRADES_BY_LEVEL, 
  AREAS_FORMACION, 
  PERIODOS_ESCOLARES,
  DEFAULT_SCHOOL_INFO 
} from "../../constants/academic";
import { MateriaPensum } from "../../types/pensum";
import ToastNotification from "../../components/common/ToastNotification";
import { ToastNotificationState } from "../../types/student";

export const PensumEstudios: React.FC = () => {
  const navigate = useNavigate();

  // Filtros principales
  const [periodo, setPeriodo] = useState<string>("2025-2026");
  const [periodosList, setPeriodosList] = useState<string[]>(PERIODOS_ESCOLARES);
  const [nuevoPeriodoInput, setNuevoPeriodoInput] = useState<string>("");
  const [showAddPeriodo, setShowAddPeriodo] = useState<boolean>(false);

  const [nivel, setNivel] = useState<AcademicLevel>("Secundaria");
  const [grado, setGrado] = useState<string>("1er Año");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Datos
  const [materias, setMaterias] = useState<MateriaPensum[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modales
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingMateria, setEditingMateria] = useState<MateriaPensum | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [materiaToDelete, setMateriaToDelete] = useState<MateriaPensum | null>(null);
  const [cloneModalOpen, setCloneModalOpen] = useState<boolean>(false);
  const [periodoDestino, setPeriodoDestino] = useState<string>("2026-2027");

  // Formulario de materia
  const [formMateria, setFormMateria] = useState<{
    nombre: string;
    codigo: string;
    horasSemanales: number;
    area: string;
    otraAreaDescripcion: string;
    descripcion: string;
    grado: string;
    nivel: AcademicLevel;
  }>({
    nombre: "",
    codigo: "",
    horasSemanales: 4,
    area: AREAS_FORMACION[0],
    otraAreaDescripcion: "",
    descripcion: "",
    grado: "1er Año",
    nivel: "Secundaria"
  });

  // Notificación
  const [notification, setNotification] = useState<ToastNotificationState>({
    show: false,
    type: "",
    msg: ""
  });

  const showToast = (type: "success" | "error" | "info", msg: string) => {
    setNotification({ show: true, type, msg });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 3500);
  };

  // Cargar datos
  const fetchPensum = async () => {
    setLoading(true);
    try {
      if ((window as any).electron?.getPensum) {
        const data = await (window as any).electron.getPensum();
        if (Array.isArray(data) && data.length > 0) {
          setMaterias(data);
          localStorage.setItem("sistema_pensum_backup", JSON.stringify(data));
        } else {
          // Si está vacío, resetear con pensum base
          const resetRes = await (window as any).electron.resetPensumDefecto(periodo);
          if (resetRes && resetRes.success) {
            const freshData = await (window as any).electron.getPensum();
            setMaterias(freshData || []);
          }
        }
      } else {
        // Fallback local
        const saved = localStorage.getItem("sistema_pensum_backup");
        if (saved) {
          setMaterias(JSON.parse(saved));
        } else {
          const defaults = generarPensumLocal(periodo);
          setMaterias(defaults);
          localStorage.setItem("sistema_pensum_backup", JSON.stringify(defaults));
        }
      }
    } catch (error) {
      console.error("Error al cargar pensum:", error);
      showToast("error", "Error al comunicarse con la base de datos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPensum();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sincronizar grado cuando cambia el nivel
  useEffect(() => {
    const gradosValidos = GRADES_BY_LEVEL[nivel] || [];
    if (!gradosValidos.includes(grado)) {
      setGrado(gradosValidos[0] || "");
    }
  }, [nivel, grado]);

  // Actualizar lista de periodos únicos existentes en los datos
  useEffect(() => {
    if (materias.length > 0) {
      const periodosEnData = Array.from(new Set(materias.map(m => m.periodo).filter(Boolean)));
      setPeriodosList(prev => {
        const combinados = Array.from(new Set([...prev, ...periodosEnData]));
        return combinados.sort();
      });
    }
  }, [materias]);

  // Filtrado de materias para la vista actual
  const materiasDelGrado = useMemo(() => {
    return materias.filter(m => 
      m.periodo === periodo && 
      m.nivel === nivel && 
      m.grado === grado
    );
  }, [materias, periodo, nivel, grado]);

  const materiasFiltradas = useMemo(() => {
    if (!searchTerm.trim()) return materiasDelGrado;
    const term = searchTerm.toLowerCase();
    return materiasDelGrado.filter(m => 
      m.nombre.toLowerCase().includes(term) ||
      (m.codigo && m.codigo.toLowerCase().includes(term)) ||
      (m.area && m.area.toLowerCase().includes(term)) ||
      (m.otraAreaDescripcion && m.otraAreaDescripcion.toLowerCase().includes(term))
    );
  }, [materiasDelGrado, searchTerm]);

  // Métricas
  const totalHoras = useMemo(() => {
    return materiasDelGrado.reduce((acc, m) => acc + (Number(m.horasSemanales) || 0), 0);
  }, [materiasDelGrado]);

  const areasUnicas = useMemo(() => {
    return new Set(materiasDelGrado.map(m => m.area).filter(Boolean)).size;
  }, [materiasDelGrado]);

  // Generador de código automático sugerido (Clave Única)
  const generarCodigoSugerido = (nombre: string, gradoNombre: string) => {
    const cleanName = nombre.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z0-9]/g, "");
    const prefix = cleanName.substring(0, 3) || "MAT";
    const gradClean = gradoNombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "").toUpperCase();
    return `${prefix}-${gradClean}`;
  };

  // Abrir modal de agregar
  const handleOpenAdd = () => {
    setEditingMateria(null);
    setFormMateria({
      nombre: "",
      codigo: "",
      horasSemanales: nivel === "Inicial" ? 6 : 4,
      area: AREAS_FORMACION[0],
      otraAreaDescripcion: "",
      descripcion: "",
      grado: grado,
      nivel: nivel
    });
    setModalOpen(true);
  };

  // Abrir modal de editar
  const handleOpenEdit = (m: MateriaPensum) => {
    setEditingMateria(m);
    setFormMateria({
      nombre: m.nombre,
      codigo: m.codigo || m.id || "",
      horasSemanales: m.horasSemanales || 4,
      area: m.area || AREAS_FORMACION[0],
      otraAreaDescripcion: m.otraAreaDescripcion || "",
      descripcion: m.descripcion || "",
      grado: m.grado,
      nivel: m.nivel
    });
    setModalOpen(true);
  };

  // Guardar materia (Agregar o Editar) con el código como clave única
  const handleSaveMateria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMateria.nombre.trim()) {
      showToast("error", "El nombre de la materia es obligatorio.");
      return;
    }

    const codigoFinal = formMateria.codigo.trim() 
      ? formMateria.codigo.trim().toUpperCase() 
      : generarCodigoSugerido(formMateria.nombre, formMateria.grado);

    if (!codigoFinal) {
      showToast("error", "El código único de la materia es obligatorio.");
      return;
    }

    // Validar código único (Clave Única de la Materia)
    const codigoDuplicado = materias.some(m => 
      m.periodo === periodo &&
      (m.codigo || m.id || "").trim().toUpperCase() === codigoFinal &&
      (!editingMateria || ((m.codigo || m.id) !== (editingMateria.codigo || editingMateria.id) && m.id !== editingMateria.id))
    );

    if (codigoDuplicado) {
      showToast("error", `El código "${codigoFinal}" ya está registrado como clave única de otra materia en este periodo.`);
      return;
    }

    // Validar nombre duplicado en el mismo grado y periodo
    const esDuplicado = materias.some(m => 
      m.periodo === periodo &&
      m.grado === formMateria.grado &&
      m.nivel === formMateria.nivel &&
      m.nombre.trim().toLowerCase() === formMateria.nombre.trim().toLowerCase() &&
      (!editingMateria || ((m.codigo || m.id) !== (editingMateria.codigo || editingMateria.id) && m.id !== editingMateria.id))
    );

    if (esDuplicado) {
      showToast("error", `Ya existe una materia con el nombre "${formMateria.nombre}" en este grado.`);
      return;
    }

    const payload: MateriaPensum & { previousId?: string } = {
      id: codigoFinal,
      codigo: codigoFinal,
      previousId: editingMateria ? (editingMateria.id || editingMateria.codigo) : undefined,
      nombre: formMateria.nombre.trim(),
      horasSemanales: Number(formMateria.horasSemanales) || 1,
      area: formMateria.area,
      otraAreaDescripcion: formMateria.area === "Otra Área" ? formMateria.otraAreaDescripcion.trim() : undefined,
      descripcion: formMateria.descripcion.trim(),
      grado: formMateria.grado,
      nivel: formMateria.nivel,
      periodo: periodo
    };

    try {
      if ((window as any).electron?.savePensumMateria) {
        const res = await (window as any).electron.savePensumMateria(payload);
        if (res.success) {
          showToast("success", editingMateria ? "Materia actualizada exitosamente." : "Materia añadida al pensum.");
          await fetchPensum();
          setModalOpen(false);
        } else {
          showToast("error", res.message || "Error al guardar en base de datos.");
        }
      } else {
        // Fallback local
        let updated: MateriaPensum[];
        if (editingMateria) {
          const targetKey = editingMateria.codigo || editingMateria.id;
          updated = materias.map(m => ((m.codigo || m.id) === targetKey || m.id === editingMateria.id) ? payload : m);
        } else {
          updated = [...materias, payload];
        }
        setMaterias(updated);
        localStorage.setItem("sistema_pensum_backup", JSON.stringify(updated));
        showToast("success", editingMateria ? "Materia actualizada." : "Materia agregada.");
        setModalOpen(false);
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Error al procesar la materia.");
    }
  };

  // Abrir confirmación de eliminación
  const handleOpenDelete = (m: MateriaPensum) => {
    setMateriaToDelete(m);
    setDeleteModalOpen(true);
  };

  // Confirmar eliminación usando el código único
  const handleConfirmDelete = async () => {
    if (!materiaToDelete) return;
    const targetKey = materiaToDelete.codigo || materiaToDelete.id;

    try {
      if ((window as any).electron?.deletePensumMateria) {
        const res = await (window as any).electron.deletePensumMateria(targetKey);
        if (res.success) {
          showToast("success", `Materia "${materiaToDelete.nombre}" (${targetKey}) eliminada del pensum.`);
          await fetchPensum();
        } else {
          showToast("error", res.message || "No se pudo eliminar la materia.");
        }
      } else {
        const updated = materias.filter(m => (m.codigo || m.id) !== targetKey && m.id !== materiaToDelete.id);
        setMaterias(updated);
        localStorage.setItem("sistema_pensum_backup", JSON.stringify(updated));
        showToast("success", `Materia "${materiaToDelete.nombre}" (${targetKey}) eliminada.`);
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Error al eliminar la materia.");
    } finally {
      setDeleteModalOpen(false);
      setMateriaToDelete(null);
    }
  };


  // Clonar pensum a otro periodo
  const handleClonePensum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!periodoDestino.trim()) {
      showToast("error", "Indica el periodo escolar destino (ej: 2026-2027).");
      return;
    }

    if (periodoDestino.trim() === periodo) {
      showToast("error", "El periodo destino no puede ser igual al periodo origen.");
      return;
    }

    try {
      if ((window as any).electron?.clonarPensum) {
        const res = await (window as any).electron.clonarPensum(periodo, periodoDestino.trim());
        if (res.success) {
          showToast("success", `Se clonaron ${res.total} materias al periodo ${periodoDestino}.`);
          setPeriodo(periodoDestino.trim());
          await fetchPensum();
          setCloneModalOpen(false);
        } else {
          showToast("error", res.message || "Error al clonar el pensum.");
        }
      } else {
        const origenMaterias = materias.filter(m => m.periodo === periodo);
        const sinDestino = materias.filter(m => m.periodo !== periodoDestino.trim());
        const clonadas = origenMaterias.map((m, idx) => ({
          ...m,
          id: `pen_clone_${Date.now()}_${idx}`,
          periodo: periodoDestino.trim()
        }));
        const resultado = [...sinDestino, ...clonadas];
        setMaterias(resultado);
        localStorage.setItem("sistema_pensum_backup", JSON.stringify(resultado));
        setPeriodo(periodoDestino.trim());
        showToast("success", `Pensum clonado con éxito al periodo ${periodoDestino}.`);
        setCloneModalOpen(false);
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Error durante la clonación del pensum.");
    }
  };

  // Añadir un nuevo periodo a la lista
  const handleAddNewPeriodo = () => {
    const val = nuevoPeriodoInput.trim();
    if (!val) return;
    if (!/^\d{4}-\d{4}$/.test(val)) {
      showToast("error", "El formato del periodo debe ser AAAA-AAAA (ej: 2026-2027).");
      return;
    }
    if (!periodosList.includes(val)) {
      setPeriodosList(prev => [...prev, val].sort());
    }
    setPeriodo(val);
    setNuevoPeriodoInput("");
    setShowAddPeriodo(false);
    showToast("info", `Periodo ${val} seleccionado.`);
  };

  // Color de badge por área de formación
  const getBadgeColor = (areaName?: string) => {
    switch (areaName) {
      case "Lengua y Comunicación":
      case "Lenguas Extranjeras":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "Ciencias y Matemáticas":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Ciencias Naturales y Salud":
      case "Ciencias Naturales":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Ciencias Sociales e Historia":
      case "Ciencias Sociales":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Arte y Patrimonio":
        return "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200";
      case "Educación Física y Deporte":
      case "Educación Física":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "Orientación y Convivencia":
      case "Orientación":
        return "bg-cyan-50 text-cyan-700 border-cyan-200";
      case "Producción y Cultura":
      case "Desarrollo Personal":
        return "bg-teal-50 text-teal-700 border-teal-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <motion.div 
      className="w-full flex flex-col gap-6 relative text-left pb-16"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <ToastNotification notification={notification} />

      {/* NAVEGACIÓN SUPERIOR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <button 
          onClick={() => navigate("/dashboard")} 
          className="flex items-center gap-2 text-gray-400 hover:text-green-600 transition-all duration-300 group"
        >
          <div className="p-2 bg-white rounded-xl shadow-sm group-hover:shadow-md border border-gray-100 transition-all">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest leading-none">
            Volver al Dashboard
          </span>
        </button>

        {/* CONTROLES DE ACCIÓN RÁPIDA */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setCloneModalOpen(true)}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl shadow-sm hover:border-green-400 hover:text-green-700 transition font-bold text-xs uppercase tracking-wider"
            title="Copiar todas las materias a otro año escolar"
          >
            <Copy size={15} /> Clonar Pensum
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl shadow-md hover:bg-green-700 transition font-bold text-xs uppercase tracking-wider active:scale-95"
          >
            <Plus size={16} /> Añadir Materia
          </button>
        </div>
      </div>

      {/* CONTENEDOR UNIFICADO PRINCIPAL A PANTALLA COMPLETA */}
      <div className="w-full bg-white rounded-3xl shadow-sm border border-gray-200/80 overflow-hidden flex flex-col">
        
        {/* CABECERA PRINCIPAL Y SELECTOR DE PERIODO */}
        <div className="p-6 md:p-8 border-b border-gray-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-gradient-to-r from-white via-white to-green-50/30">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-green-100/70 text-green-700 rounded-2xl">
                <BookOpen size={24} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
                  Pensum de Estudios y Plan Curricular
                </h1>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-0.5">
                  {DEFAULT_SCHOOL_INFO.name} • Código DEA: {DEFAULT_SCHOOL_INFO.deaCode}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500 max-w-2xl mt-1 font-medium">
              Gestiona, agrega, actualiza y organiza las asignaturas oficiales, carga horaria y áreas de formación correspondientes a cada grado y ciclo lectivo.
            </p>
          </div>

          {/* SELECTOR DE PERIODO ESCOLAR */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white p-2.5 rounded-2xl border border-gray-200 shadow-sm w-full lg:w-auto">
            <div className="flex items-center gap-2 px-2 text-gray-500">
              <Calendar size={18} className="text-green-600" />
              <span className="text-xs font-black uppercase tracking-wider text-gray-700">Periodo:</span>
            </div>

            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="bg-gray-50 border border-gray-200 font-black text-gray-800 text-sm rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 cursor-pointer shadow-inner"
            >
              {periodosList.map((p) => (
                <option key={p} value={p}>
                  Año Escolar {p}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowAddPeriodo(!showAddPeriodo)}
              className="px-3 py-2 text-xs font-bold text-green-700 bg-green-50 rounded-xl hover:bg-green-100 transition whitespace-nowrap"
              title="Añadir un nuevo periodo escolar"
            >
              + Nuevo Año
            </button>
          </div>
        </div>

        {/* FORMULARIO DESPLEGABLE PARA NUEVO PERIODO */}
        {showAddPeriodo && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-green-50/50 border-b border-green-100 px-6 py-4 flex flex-wrap items-center gap-3"
          >
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Registrar Nuevo Periodo:</span>
            <input 
              type="text" 
              placeholder="Ej: 2026-2027" 
              value={nuevoPeriodoInput}
              onChange={(e) => setNuevoPeriodoInput(e.target.value)}
              className="border border-gray-300 rounded-xl px-3 py-1.5 text-xs font-bold bg-white text-gray-800 outline-none focus:border-green-500"
            />
            <button 
              onClick={handleAddNewPeriodo}
              className="bg-green-600 text-white px-4 py-1.5 rounded-xl text-xs font-bold hover:bg-green-700 shadow-sm"
            >
              Confirmar Periodo
            </button>
            <button 
              onClick={() => setShowAddPeriodo(false)}
              className="text-gray-400 hover:text-gray-600 text-xs font-bold px-2 py-1"
            >
              Cancelar
            </button>
          </motion.div>
        )}

        {/* BARRA DE NIVELES ACADÉMICOS (INICIAL, PRIMARIA, SECUNDARIA) */}
        <div className="bg-gray-50/70 border-b border-gray-200 px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {(["Inicial", "Primaria", "Secundaria"] as AcademicLevel[]).map((lvl) => {
              const countLvl = materias.filter(m => m.periodo === periodo && m.nivel === lvl).length;
              const isActive = nivel === lvl;
              return (
                <button
                  key={lvl}
                  onClick={() => setNivel(lvl)}
                  className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all ${
                    isActive 
                      ? "bg-green-600 text-white shadow-md shadow-green-200" 
                      : "bg-white text-gray-600 border border-gray-200 hover:border-green-400 hover:text-green-700"
                  }`}
                >
                  <GraduationCap size={16} />
                  <span>Educación {lvl}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                  }`}>
                    {countLvl}
                  </span>
                </button>
              );
            })}
          </div>

          {/* BUSCADOR RÁPIDO */}
          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar materia o código..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 shadow-sm"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* SELECTOR DE GRADOS SEGÚN EL NIVEL ACTIVO */}
        <div className="bg-white px-6 py-4 border-b border-gray-100 flex items-center gap-2 overflow-x-auto">
          <span className="text-[11px] font-black uppercase text-gray-400 tracking-widest mr-2 shrink-0">
            Grados:
          </span>
          {GRADES_BY_LEVEL[nivel].map((g) => {
            const countGrado = materias.filter(m => m.periodo === periodo && m.grado === g).length;
            const isGradoActive = grado === g;
            return (
              <button
                key={g}
                onClick={() => setGrado(g)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
                  isGradoActive 
                    ? "bg-gray-900 text-white shadow-sm ring-2 ring-gray-900" 
                    : "bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200"
                }`}
              >
                <span>{g}</span>
                <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-md ${
                  isGradoActive ? "bg-white/25 text-white" : "bg-gray-200 text-gray-600"
                }`}>
                  {countGrado}
                </span>
              </button>
            );
          })}
        </div>

        {/* BARRA DE ESTADÍSTICAS DEL GRADO */}
        <div className="p-6 md:p-8 grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gray-50/50 border-b border-gray-100">
          <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
              Asignaturas en {grado}
            </span>
            <div className="flex items-center gap-2">
              <Layers size={20} className="text-green-600" />
              <span className="text-2xl font-black text-gray-900">{materiasDelGrado.length}</span>
              <span className="text-xs text-gray-400 font-bold">materias</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
              Carga Horaria Semanal
            </span>
            <div className="flex items-center gap-2">
              <Clock size={20} className="text-blue-600" />
              <span className="text-2xl font-black text-gray-900">{totalHoras}</span>
              <span className="text-xs text-gray-400 font-bold">horas/sem</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
              Áreas de Conocimiento
            </span>
            <div className="flex items-center gap-2">
              <Bookmark size={20} className="text-purple-600" />
              <span className="text-2xl font-black text-gray-900">{areasUnicas}</span>
              <span className="text-xs text-gray-400 font-bold">áreas</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
              Ciclo Lectivo Activo
            </span>
            <div className="flex items-center gap-2">
              <School size={20} className="text-amber-600" />
              <span className="text-lg font-black text-gray-900">{periodo}</span>
            </div>
          </div>
        </div>

        {/* LISTADO / TABLA DE MATERIAS DEL PENSUM */}
        <div className="p-6 md:p-8 flex-1 flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <div className="w-2.5 h-6 bg-green-600 rounded-full" />
                Malla Curricular: {grado} ({nivel}) — Periodo {periodo}
              </h2>
              <p className="text-xs text-gray-500 mt-1 font-medium">
                {materiasFiltradas.length} materia(s) visible(s) en este plan de estudios
              </p>
            </div>

            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition active:scale-95"
            >
              <Plus size={16} /> Agregar Asignatura a {grado}
            </button>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-3">
              <RefreshCw size={32} className="animate-spin text-green-600" />
              <p className="text-xs font-bold uppercase tracking-widest">Cargando materias del pensum...</p>
            </div>
          ) : materiasFiltradas.length === 0 ? (
            <div className="py-16 px-4 bg-gray-50/70 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-gray-300 shadow-sm mb-4">
                <BookOpen size={32} />
              </div>
              <h3 className="text-base font-bold text-gray-800 mb-1">
                {searchTerm 
                  ? "No se encontraron materias que coincidan con la búsqueda" 
                  : `No hay materias registradas para ${grado} en el periodo ${periodo}`}
              </h3>
              <p className="text-xs text-gray-500 max-w-md mb-6 font-medium">
                {searchTerm 
                  ? "Intenta modificar el término de búsqueda o limpia el filtro para ver todas las asignaturas." 
                  : "Puedes agregar y organizar las asignaturas para este grado utilizando el botón a continuación."}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={handleOpenAdd}
                  className="bg-green-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-green-700 transition shadow-sm flex items-center gap-2"
                >
                  <Plus size={16} /> Crear Primera Materia
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/90 border-b border-gray-200 text-[10px] font-black text-gray-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-12 text-center">#</th>
                    <th className="py-3.5 px-4 w-36">Código Único (PK)</th>
                    <th className="py-3.5 px-6">Nombre de la Asignatura</th>
                    <th className="py-3.5 px-4">Área de Formación</th>
                    <th className="py-3.5 px-4 text-center w-28">Horas / Sem</th>
                    <th className="py-3.5 px-4">Descripción</th>
                    <th className="py-3.5 px-4 text-center w-28">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {materiasFiltradas.map((m, index) => (
                    <tr 
                      key={m.codigo || m.id} 
                      className="hover:bg-green-50/20 transition-colors group"
                    >
                      <td className="py-4 px-4 text-center text-xs font-bold text-gray-400">
                        {index + 1}
                      </td>

                      <td className="py-4 px-4">
                        <span className="font-mono text-xs font-black bg-green-50 text-green-800 px-2.5 py-1 rounded-lg border border-green-200">
                          {m.codigo || m.id}
                        </span>
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2.5">
                          <div className="w-2 h-2 rounded-full bg-green-500 group-hover:scale-125 transition-transform shrink-0" />
                          <span className="font-extrabold text-gray-800 text-sm">
                            {m.nombre}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="inline-flex flex-col items-start gap-0.5">
                          <span className={`inline-block text-[11px] font-bold px-3 py-1 rounded-xl border ${getBadgeColor(m.area)}`}>
                            {m.area === "Otra Área" && m.otraAreaDescripcion
                              ? m.otraAreaDescripcion
                              : (m.area || "General")}
                          </span>
                          {m.area === "Otra Área" && m.otraAreaDescripcion && (
                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider pl-1">
                              (Otra Área)
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5 font-bold text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-xl border border-blue-100">
                          <Clock size={13} />
                          <span>{m.horasSemanales || 4} hrs</span>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-xs text-gray-500 max-w-xs truncate font-medium">
                        {m.descripcion || "—"}
                      </td>

                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(m)}
                            className="p-2 text-gray-500 hover:text-green-700 hover:bg-green-50 rounded-xl transition"
                            title="Editar materia"
                          >
                            <Edit3 size={16} />
                          </button>

                          <button
                            onClick={() => handleOpenDelete(m)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                            title="Eliminar materia"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </div>

      {/* MODAL PARA AGREGAR / EDITAR MATERIA */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-xl w-full overflow-hidden text-left"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 text-green-700 rounded-xl">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-gray-900">
                      {editingMateria ? "Editar Asignatura" : "Añadir Nueva Asignatura"}
                    </h3>
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                      {formMateria.grado} • Periodo {periodo}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveMateria} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nivel y Grado (informativo/modificable) */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Nivel Académico
                    </label>
                    <select
                      value={formMateria.nivel}
                      onChange={(e) => {
                        const newNivel = e.target.value as AcademicLevel;
                        setFormMateria(prev => ({
                          ...prev,
                          nivel: newNivel,
                          grado: GRADES_BY_LEVEL[newNivel][0] || ""
                        }));
                      }}
                      className="border border-gray-300 rounded-xl p-3 bg-white text-xs font-bold text-gray-800 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                    >
                      {(["Inicial", "Primaria", "Secundaria"] as AcademicLevel[]).map(lvl => (
                        <option key={lvl} value={lvl}>{lvl}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Grado / Año
                    </label>
                    <select
                      value={formMateria.grado}
                      onChange={(e) => setFormMateria(prev => ({ ...prev, grado: e.target.value }))}
                      className="border border-gray-300 rounded-xl p-3 bg-white text-xs font-bold text-gray-800 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                    >
                      {GRADES_BY_LEVEL[formMateria.nivel].map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Nombre de la Asignatura */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex justify-between">
                    <span>Nombre de la Materia *</span>
                    <span className="text-[10px] text-gray-400">Requerido</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Matemáticas, Castellano, Física, Biología..."
                    value={formMateria.nombre}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormMateria(prev => ({
                        ...prev,
                        nombre: val,
                        codigo: prev.codigo || generarCodigoSugerido(val, prev.grado)
                      }));
                    }}
                    className="border border-gray-300 rounded-xl p-3.5 bg-white text-sm font-bold text-gray-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 shadow-sm"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Código (Clave Única) */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-green-700 uppercase tracking-wider flex justify-between">
                      <span>Código de Materia (Clave Única) *</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: MAT-1ERANO"
                      value={formMateria.codigo}
                      onChange={(e) => setFormMateria(prev => ({ ...prev, codigo: e.target.value.toUpperCase() }))}
                      className="border border-gray-300 rounded-xl p-3 bg-white text-xs font-mono font-bold text-gray-800 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 shadow-sm"
                      required
                    />
                  </div>

                  {/* Horas semanales */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Horas Semanales (Carga)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={formMateria.horasSemanales}
                      onChange={(e) => setFormMateria(prev => ({ ...prev, horasSemanales: parseInt(e.target.value, 10) || 1 }))}
                      className="border border-gray-300 rounded-xl p-3 bg-white text-xs font-bold text-gray-800 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 shadow-sm"
                    />
                  </div>
                </div>

                {/* Área de Formación */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Área de Formación / Campo Curricular
                  </label>
                  <select
                    value={formMateria.area}
                    onChange={(e) => setFormMateria(prev => ({ ...prev, area: e.target.value }))}
                    className="border border-gray-300 rounded-xl p-3 bg-white text-xs font-bold text-gray-800 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 shadow-sm cursor-pointer"
                  >
                    {AREAS_FORMACION.map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>

                {/* Input box para pequeña descripción de "Otra Área" */}
                {formMateria.area === "Otra Área" && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col gap-1"
                  >
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center justify-between">
                      <span>Descripción de "Otra Área"</span>
                      <span className="text-[10px] text-gray-400 font-medium">Nombre o especificación del área</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Robótica Educativa, Agroecología, Formación Técnica, Música..."
                      value={formMateria.otraAreaDescripcion}
                      onChange={(e) => setFormMateria(prev => ({ ...prev, otraAreaDescripcion: e.target.value }))}
                      className="border border-gray-300 rounded-xl p-3 bg-white text-xs font-bold text-gray-800 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 shadow-sm transition"
                      maxLength={80}
                      autoFocus
                    />
                  </motion.div>
                )}

                {/* Descripción / Objetivos */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Descripción / Propósito (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Objetivo general, temas principales o competencias del área..."
                    value={formMateria.descripcion}
                    onChange={(e) => setFormMateria(prev => ({ ...prev, descripcion: e.target.value }))}
                    className="border border-gray-300 rounded-xl p-3 bg-white text-xs font-medium text-gray-800 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 shadow-sm"
                  />
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs uppercase tracking-wider hover:bg-gray-100 transition"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-green-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-green-700 shadow-md transition active:scale-95 flex items-center gap-2"
                  >
                    <CheckCircle size={16} />
                    {editingMateria ? "Guardar Cambios" : "Añadir Asignatura"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE CONFIRMACIÓN PARA ELIMINAR */}
      <AnimatePresence>
        {deleteModalOpen && materiaToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-gray-100 text-center"
            >
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={28} />
              </div>

              <h3 className="text-xl font-extrabold text-gray-900 mb-2">
                ¿Eliminar Asignatura?
              </h3>

              <p className="text-xs text-gray-500 mb-6 font-medium">
                Estás a punto de eliminar <strong className="text-gray-800">"{materiaToDelete.nombre}"</strong> ({materiaToDelete.codigo}) del pensum de <strong className="text-gray-800">{materiaToDelete.grado}</strong> para el periodo <strong className="text-gray-800">{materiaToDelete.periodo}</strong>. Esta acción no se puede deshacer.
              </p>

              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs uppercase tracking-wider hover:bg-gray-100 transition"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-6 py-2.5 rounded-xl bg-red-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-red-700 shadow-md transition active:scale-95"
                >
                  Sí, Eliminar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL PARA CLONAR PENSUM A OTRO PERIODO */}
      <AnimatePresence>
        {cloneModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-gray-100 text-left"
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                    <Copy size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-gray-900">
                      Clonar Pensum Completo
                    </h3>
                    <p className="text-xs text-gray-400 font-semibold">
                      Duplicar estructura curricular
                    </p>
                  </div>
                </div>
                <button onClick={() => setCloneModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleClonePensum} className="space-y-4">
                <p className="text-xs text-gray-500 font-medium">
                  Se copiarán todas las materias del periodo de origen hacia el nuevo periodo lectivo seleccionado.
                </p>

                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200">
                  <span className="text-[10px] font-black uppercase text-gray-400 block mb-1">
                    Periodo Origen:
                  </span>
                  <span className="text-sm font-extrabold text-gray-800">
                    Año Escolar {periodo} ({materias.filter(m => m.periodo === periodo).length} materias)
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Periodo Destino (Nuevo Año Escolar) *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: 2026-2027"
                    value={periodoDestino}
                    onChange={(e) => setPeriodoDestino(e.target.value)}
                    className="border border-gray-300 rounded-xl p-3 bg-white text-sm font-bold text-gray-800 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 shadow-sm"
                    required
                  />
                  <p className="text-[10px] text-gray-400 italic mt-0.5">
                    Formato: AAAA-AAAA (ej: 2026-2027)
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setCloneModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs uppercase tracking-wider hover:bg-gray-100 transition"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-green-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-green-700 shadow-md transition active:scale-95"
                  >
                    Clonar a {periodoDestino}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

// Generador de respaldo local (con código de materia como clave única)
function generarPensumLocal(periodo: string): MateriaPensum[] {
  const result: MateriaPensum[] = [];

  // Primaria
  ["1ero", "2do", "3ero", "4to", "5to", "6to"].forEach(g => {
    [
      { n: "Castellano y Literatura", c: "CAS", h: 6, a: "Lengua y Comunicación" },
      { n: "Matemáticas para la Vida", c: "MAT", h: 6, a: "Ciencias y Matemáticas" },
      { n: "Ciencias Naturales y Salud", c: "NAT", h: 4, a: "Ciencias Naturales y Salud" },
      { n: "Ciencias Sociales e Identidad", c: "SOC", h: 4, a: "Ciencias Sociales e Historia" },
      { n: "Educación Estética y Cultura", c: "EST", h: 3, a: "Arte y Patrimonio" },
      { n: "Educación Física y Deportes", c: "EDF", h: 3, a: "Educación Física y Deporte" },
    ].forEach(m => {
      const cod = `${m.c}-${g.toUpperCase()}`;
      result.push({
        id: cod,
        codigo: cod,
        nombre: m.n,
        grado: g,
        nivel: "Primaria",
        periodo: periodo,
        horasSemanales: m.h,
        area: m.a,
        descripcion: "Área de formación de Educación Primaria"
      });
    });
  });

  // Secundaria
  ["1er Año", "2do Año", "3er Año", "4to Año", "5to Año"].forEach(g => {
    [
      { n: "Castellano", c: "CAS", h: 4, a: "Lengua y Comunicación" },
      { n: "Inglés y Otras Lenguas", c: "ING", h: 4, a: "Lenguas Extranjeras" },
      { n: "Matemáticas", c: "MAT", h: 4, a: "Ciencias y Matemáticas" },
      { n: "Educación Física", c: "EDF", h: 3, a: "Educación Física y Deporte" },
      { n: "Ciencias Naturales", c: "NAT", h: 4, a: "Ciencias Naturales y Salud" },
      { n: "Geografía, Historia y Ciudadanía", c: "GHC", h: 4, a: "Ciencias Sociales e Historia" },
      { n: "Orientación y Convivencia", c: "ORI", h: 2, a: "Orientación y Convivencia" },
      { n: "Grupos de Creación y Producción", c: "CRP", h: 3, a: "Producción y Cultura" },
    ].forEach(m => {
      const cod = `${m.c}-${g.replace(/\s+/g, '').toUpperCase()}`;
      result.push({
        id: cod,
        codigo: cod,
        nombre: m.n,
        grado: g,
        nivel: "Secundaria",
        periodo: periodo,
        horasSemanales: m.h,
        area: m.a,
        descripcion: "Área de formación de Educación Media General"
      });
    });
  });

  return result;
}

export default PensumEstudios;
