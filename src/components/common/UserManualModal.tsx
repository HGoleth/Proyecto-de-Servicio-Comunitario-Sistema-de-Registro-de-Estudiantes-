import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  BookOpen,
  Search,
  X,
  CheckCircle2,
  GitBranch,
  Keyboard,
  ShieldAlert,
  Sparkles,
  ChevronRight,
  Layers,
  History,
  Compass,
} from "lucide-react";
import {
  MANUAL_METADATA,
  SECCIONES_MANUAL,
  ATAJOS_TECLADO,
  HISTORIAL_ACTUALIZACIONES_MANUAL,
  ManualSection,
} from "../../data/manualUsuarioData";

type TabMode = "modulo" | "todos-flujos" | "atajos-historial";

export const UserManualModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string>(SECCIONES_MANUAL[0].id);
  const [searchQuery, setSearchQuery] = useState("");
  const [tabMode, setTabMode] = useState<TabMode>("modulo");
  const lastToggleRef = useRef<number>(0);

  useEffect(() => {
    const safeToggle = () => {
      const now = Date.now();
      if (now - lastToggleRef.current < 200) return;
      lastToggleRef.current = now;
      setIsOpen((prev) => !prev);
    };

    // 1. Listener de teclado en el renderer (F10 para abrir/cerrar, Esc para cerrar)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F10") {
        e.preventDefault();
        e.stopPropagation();
        safeToggle();
      } else if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    // 2. Listener de evento personalizado (por si se invoca desde un botón en la UI)
    const handleCustomOpen = () => safeToggle();

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("toggle-user-manual-ui", handleCustomOpen);

    // 3. Listener desde el proceso principal de Electron (before-input-event F10)
    const electronApi = (window as unknown as {
      electron?: { onToggleUserManual?: (cb: () => void) => () => void };
    }).electron;

    let unsubscribeElectron: (() => void) | undefined;
    if (electronApi?.onToggleUserManual) {
      unsubscribeElectron = electronApi.onToggleUserManual(() => {
        safeToggle();
      });
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("toggle-user-manual-ui", handleCustomOpen);
      if (unsubscribeElectron) unsubscribeElectron();
    };
  }, [isOpen]);

  // Filtrado de secciones por búsqueda
  const seccionesFiltradas = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return SECCIONES_MANUAL;
    return SECCIONES_MANUAL.filter((sec) => {
      const enTitulo =
        sec.titulo.toLowerCase().includes(q) ||
        sec.categoria.toLowerCase().includes(q) ||
        sec.resumen.toLowerCase().includes(q);
      const enFunc = sec.funcionalidades.some((f) => f.toLowerCase().includes(q));
      const enReglas = sec.reglasNegocio.some((r) => r.toLowerCase().includes(q));
      const enFlujos = sec.flujosTrabajo.some(
        (wf) =>
          wf.nombre.toLowerCase().includes(q) ||
          wf.objetivo.toLowerCase().includes(q) ||
          wf.pasos.some(
            (p) => p.titulo.toLowerCase().includes(q) || p.detalle.toLowerCase().includes(q)
          )
      );
      return enTitulo || enFunc || enReglas || enFlujos;
    });
  }, [searchQuery]);

  const activeSection: ManualSection = useMemo(() => {
    return (
      seccionesFiltradas.find((s) => s.id === activeSectionId) ||
      seccionesFiltradas[0] ||
      SECCIONES_MANUAL[0]
    );
  }, [seccionesFiltradas, activeSectionId]);

  const totalFlujos = useMemo(
    () => SECCIONES_MANUAL.reduce((acc, s) => acc + s.flujosTrabajo.length, 0),
    []
  );

  const totalFuncionalidades = useMemo(
    () => SECCIONES_MANUAL.reduce((acc, s) => acc + s.funcionalidades.length, 0),
    []
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-fadeIn"
      style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
    >
      <div className="bg-white w-full max-w-7xl h-[90vh] rounded-[2.5rem] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* CABECERA DEL MANUAL */}
        <div className="bg-gradient-to-r from-[#1e237e] via-[#283093] to-indigo-800 text-white px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-inner shrink-0">
              <BookOpen className="w-7 h-7 text-amber-300" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-200 text-[10px] font-black uppercase tracking-widest">
                  Tecla Rápida: {MANUAL_METADATA.atajoPrincipal}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 border border-emerald-300/40 text-emerald-200 text-[10px] font-black uppercase tracking-widest">
                  {MANUAL_METADATA.versionActual} • Actualizado: {MANUAL_METADATA.ultimaActualizacion}
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-black tracking-tight mt-1">
                {MANUAL_METADATA.titulo}
              </h2>
              <p className="text-xs text-indigo-100/80 font-medium">
                {MANUAL_METADATA.institucion} • {SECCIONES_MANUAL.length} Módulos •{" "}
                {totalFuncionalidades} Funcionalidades • {totalFlujos} Flujos de Trabajo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Buscador global dentro del manual */}
            <div className="relative w-64 md:w-80">
              <Search className="w-4 h-4 text-indigo-200 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar módulo, función o flujo..."
                className="w-full pl-10 pr-8 py-2.5 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-indigo-200/70 text-xs font-bold focus:outline-none focus:bg-white/20 focus:border-amber-300 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-indigo-200 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              title="Cerrar Manual (F10 o Esc)"
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-black text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Cerrar (F10)</span>
            </button>
          </div>
        </div>

        {/* BARRA DE PESTAÑAS DE VISTA */}
        <div className="bg-slate-50 border-b border-slate-200 px-8 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTabMode("modulo")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                tabMode === "modulo"
                  ? "bg-[#312E81] text-white shadow-md"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              <Layers className="w-4 h-4" />
              Guía por Módulo y Funciones
            </button>

            <button
              type="button"
              onClick={() => setTabMode("todos-flujos")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                tabMode === "todos-flujos"
                  ? "bg-[#312E81] text-white shadow-md"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              <GitBranch className="w-4 h-4" />
              Catálogo Completo de Flujos ({totalFlujos})
            </button>

            <button
              type="button"
              onClick={() => setTabMode("atajos-historial")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                tabMode === "atajos-historial"
                  ? "bg-[#312E81] text-white shadow-md"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              <Keyboard className="w-4 h-4" />
              Atajos (F10 / F12) e Historial
            </button>
          </div>

          <div className="text-[11px] font-bold text-slate-500 flex items-center gap-2">
            <span>Presione</span>
            <kbd className="px-2 py-0.5 bg-slate-200 text-slate-800 rounded-md font-mono text-[10px] font-black">
              F10
            </kbd>
            <span>en cualquier momento para abrir o cerrar este manual</span>
          </div>
        </div>

        {/* CUERPO PRINCIPAL */}
        <div className="flex-1 flex overflow-hidden">
          {tabMode === "modulo" && (
            <>
              {/* ÍNDICE LATERAL DE MÓDULOS */}
              <aside className="w-72 md:w-80 bg-slate-50/80 border-r border-slate-200 overflow-y-auto p-4 space-y-1.5 shrink-0">
                <p className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Módulos del Programa ({seccionesFiltradas.length})
                </p>
                {seccionesFiltradas.map((sec) => {
                  const isSelected = sec.id === activeSection.id;
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => setActiveSectionId(sec.id)}
                      className={`w-full text-left p-3.5 rounded-2xl transition-all flex items-start justify-between gap-2 cursor-pointer ${
                        isSelected
                          ? "bg-[#312E81] text-white shadow-lg shadow-indigo-900/15"
                          : "hover:bg-white text-slate-700 border border-transparent hover:border-slate-200"
                      }`}
                    >
                      <div className="min-w-0">
                        <span
                          className={`block text-[10px] font-black uppercase tracking-wider ${
                            isSelected ? "text-amber-300" : "text-indigo-600"
                          }`}
                        >
                          {sec.categoria}
                        </span>
                        <span className="block text-xs font-extrabold leading-snug mt-0.5 truncate">
                          {sec.titulo}
                        </span>
                        <span
                          className={`inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            isSelected
                              ? "bg-white/15 text-indigo-100"
                              : "bg-slate-200/70 text-slate-600"
                          }`}
                        >
                          {sec.flujosTrabajo.length} flujo(s) • {sec.funcionalidades.length} funciones
                        </span>
                      </div>
                      <ChevronRight
                        className={`w-4 h-4 shrink-0 mt-1 transition-transform ${
                          isSelected ? "text-amber-300 translate-x-0.5" : "text-slate-400"
                        }`}
                      />
                    </button>
                  );
                })}
                {seccionesFiltradas.length === 0 && (
                  <div className="p-6 text-center text-xs text-slate-400 font-bold">
                    No se encontraron módulos que coincidan con "{searchQuery}".
                  </div>
                )}
              </aside>

              {/* CONTENIDO DETALLADO DEL MÓDULO SELECCIONADO */}
              <main className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 bg-white">
                {/* Encabezado del módulo */}
                <div className="bg-gradient-to-br from-slate-50 to-indigo-50/40 border border-slate-200/80 rounded-3xl p-6">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <span className="px-3 py-1 rounded-xl bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase tracking-widest">
                      {activeSection.categoria}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded-xl border border-slate-200">
                      <Compass className="w-3.5 h-3.5 text-indigo-600" />
                      Ubicación: <strong className="text-slate-800">{activeSection.rutaAcceso}</strong>
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                    {activeSection.titulo}
                  </h3>
                  <p className="text-sm text-slate-600 font-medium mt-2 leading-relaxed">
                    {activeSection.resumen}
                  </p>
                </div>

                {/* Funcionalidades del módulo */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                    <h4 className="text-sm font-black uppercase tracking-wider text-slate-800">
                      Funcionalidades Incluidas en este Módulo ({activeSection.funcionalidades.length})
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {activeSection.funcionalidades.map((func, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/70"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-slate-700 font-semibold leading-relaxed">
                          {func}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reglas de Negocio y Condiciones Especiales */}
                {activeSection.reglasNegocio.length > 0 && (
                  <div className="bg-amber-50/80 border border-amber-200 rounded-3xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <ShieldAlert className="w-5 h-5 text-amber-600" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-amber-900">
                        Reglas de Negocio y Condiciones Automáticas del Sistema
                      </h4>
                    </div>
                    <ul className="space-y-2">
                      {activeSection.reglasNegocio.map((regla, idx) => (
                        <li
                          key={idx}
                          className="text-xs text-amber-900/90 font-semibold flex items-start gap-2 leading-relaxed"
                        >
                          <span className="font-black text-amber-600">•</span>
                          <span>{regla}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Flujos de Trabajo Paso a Paso */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <GitBranch className="w-5 h-5 text-indigo-600" />
                    <h4 className="text-sm font-black uppercase tracking-wider text-slate-800">
                      Flujos de Trabajo Paso a Paso ({activeSection.flujosTrabajo.length})
                    </h4>
                  </div>

                  <div className="space-y-6">
                    {activeSection.flujosTrabajo.map((wf) => (
                      <div
                        key={wf.id}
                        className="border-2 border-indigo-100 rounded-3xl overflow-hidden bg-white shadow-sm"
                      >
                        <div className="bg-indigo-50/70 px-6 py-4 border-b border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <h5 className="text-base font-black text-indigo-950">{wf.nombre}</h5>
                            <p className="text-xs font-semibold text-indigo-700 mt-0.5">
                              Objetivo: {wf.objetivo}
                            </p>
                          </div>
                          <span className="px-3 py-1 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-wider self-start sm:self-center shrink-0">
                            {wf.pasos.length} Pasos
                          </span>
                        </div>

                        <div className="p-6 space-y-4">
                          {wf.pasos.map((paso) => (
                            <div
                              key={paso.paso}
                              className="flex items-start gap-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-100"
                            >
                              <div className="w-8 h-8 rounded-xl bg-[#312E81] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                                {paso.paso}
                              </div>
                              <div>
                                <h6 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                                  {paso.titulo}
                                </h6>
                                <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">
                                  {paso.detalle}
                                </p>
                              </div>
                            </div>
                          ))}

                          <div className="mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            <p className="text-xs font-bold text-emerald-900">
                              <span className="uppercase tracking-wider font-black">
                                Resultado Esperado:{" "}
                              </span>
                              {wf.resultadoEsperado}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </main>
            </>
          )}

          {tabMode === "todos-flujos" && (
            <main className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 bg-white">
              <div className="max-w-5xl mx-auto space-y-8">
                <div className="border-b border-slate-200 pb-4">
                  <h3 className="text-xl font-black text-slate-900">
                    Catálogo Completo de Flujos de Trabajo del Sistema ({totalFlujos} Flujos)
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold mt-1">
                    Todos los procedimientos operativos paso a paso de cada opción del programa en una sola vista continua.
                  </p>
                </div>

                {seccionesFiltradas.map((sec) => (
                  <div key={sec.id} className="space-y-4">
                    <div className="flex items-center justify-between bg-slate-900 text-white px-5 py-3 rounded-2xl">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">
                          {sec.categoria}
                        </span>
                        <h4 className="text-sm font-black">{sec.titulo}</h4>
                      </div>
                      <span className="text-[11px] font-bold text-slate-300">{sec.rutaAcceso}</span>
                    </div>

                    <div className="grid grid-cols-1 gap-4 pl-2 md:pl-4">
                      {sec.flujosTrabajo.map((wf) => (
                        <div
                          key={wf.id}
                          className="border border-slate-200 rounded-2xl p-5 bg-slate-50/60 space-y-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <h5 className="text-sm font-black text-indigo-950">{wf.nombre}</h5>
                            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-lg bg-indigo-100 text-indigo-800">
                              {wf.pasos.length} pasos
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 font-semibold">
                            Objetivo: {wf.objetivo}
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                            {wf.pasos.map((p) => (
                              <div
                                key={p.paso}
                                className="bg-white p-3 rounded-xl border border-slate-200/80 flex items-start gap-2.5"
                              >
                                <span className="w-6 h-6 rounded-lg bg-indigo-900 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                                  {p.paso}
                                </span>
                                <div>
                                  <p className="text-xs font-black text-slate-800">{p.titulo}</p>
                                  <p className="text-[11px] text-slate-600 font-medium mt-0.5 leading-snug">
                                    {p.detalle}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl">
                            ✓ Resultado: {wf.resultadoEsperado}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </main>
          )}

          {tabMode === "atajos-historial" && (
            <main className="flex-1 overflow-y-auto p-6 md:p-10 bg-white">
              <div className="max-w-4xl mx-auto space-y-8">
                {/* Tabla de Atajos de Teclado */}
                <div className="border border-slate-200 rounded-3xl p-6 bg-slate-50/50">
                  <div className="flex items-center gap-2.5 mb-4">
                    <Keyboard className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-base font-black text-slate-900 uppercase tracking-wider">
                      Atajos de Teclado Globales del Sistema
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {ATAJOS_TECLADO.map((at, i) => (
                      <div
                        key={i}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-2xl bg-white border border-slate-200"
                      >
                        <div className="flex items-center gap-3">
                          <kbd className="px-3 py-1.5 rounded-xl bg-slate-900 text-amber-300 font-mono text-xs font-black shadow-sm">
                            {at.tecla}
                          </kbd>
                          <span className="text-xs font-extrabold text-slate-800">{at.accion}</span>
                        </div>
                        <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg">
                          {at.alcance}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Historial de Actualizaciones del Manual */}
                <div className="border border-slate-200 rounded-3xl p-6 bg-white">
                  <div className="flex items-center gap-2.5 mb-4">
                    <History className="w-5 h-5 text-indigo-600" />
                    <div>
                      <h3 className="text-base font-black text-slate-900 uppercase tracking-wider">
                        Bitácora de Actualizaciones del Programa y del Manual
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        Este manual se actualiza automáticamente con cada nueva funcionalidad o modificación del sistema.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {HISTORIAL_ACTUALIZACIONES_MANUAL.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="px-3 py-1 rounded-lg bg-[#312E81] text-white text-xs font-black">
                            Versión {item.version}
                          </span>
                          <span className="text-xs font-bold text-slate-500">
                            Fecha: {item.fecha}
                          </span>
                        </div>
                        <ul className="space-y-2">
                          {item.cambios.map((c, cIdx) => (
                            <li
                              key={cIdx}
                              className="text-xs text-slate-700 font-semibold flex items-start gap-2"
                            >
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </main>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManualModal;
