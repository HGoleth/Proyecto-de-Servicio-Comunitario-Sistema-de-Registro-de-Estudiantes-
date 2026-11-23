import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Printer } from "lucide-react";

interface MembreteInfo {
  linea1: string;
  linea2: string;
  linea3: string;
  nombreInstitucion: string;
  ubicacion: string;
}

interface NotasReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  membrete: MembreteInfo;
  materiaSel: string | null;
  seccionSel: any;
  evaluacionesPorLapso: Record<number, any[]>;
  estudiantesFiltrados: any[];
  notasAlumnos: Record<string, Record<number, number>>;
  nivel: "Inicial" | "Primaria" | "Secundaria";
  calcularNotaFinalLapso: (alumnoId: string, lapsoNum: number) => string;
  calcularPromedioCiclo?: (alumnoId: string) => string;
  codigoMateria?: string;
  periodo?: string;
}

export const NotasReportModal: React.FC<NotasReportModalProps> = ({
  isOpen,
  onClose,
  membrete,
  materiaSel,
  seccionSel,
  evaluacionesPorLapso,
  estudiantesFiltrados,
  notasAlumnos,
  nivel,
  calcularNotaFinalLapso,
  calcularPromedioCiclo,
  codigoMateria,
  periodo,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-start justify-center bg-black/80 backdrop-blur-xl p-4 md:p-10 overflow-y-auto no-print">
          <motion.div
            id="reporte-oficial"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="bg-white w-full max-w-[28cm] shadow-2xl p-[1.5cm] flex flex-col font-serif text-black min-h-[21.59cm] relative rounded-sm border border-gray-100"
          >
            <div className="fixed top-6 right-6 flex gap-3 z-[160] no-print">
              <button
                type="button"
                onClick={() => window.print()}
                className="p-4 bg-[#5564eb] text-white rounded-full shadow-2xl hover:bg-[#4353d8] transition-all active:scale-90"
                title="Imprimir Planilla"
              >
                <Printer size={28} />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-4 bg-gray-900 text-white rounded-full shadow-2xl hover:bg-red-600 transition-all active:scale-90"
                title="Cerrar Vista Previa"
              >
                <X size={28} />
              </button>
            </div>

            <div className="flex items-start gap-8 border-b-2 border-black pb-4 mb-6">
              <img src="./logo.png" className="w-20 h-20 object-contain grayscale" alt="Logo" />
              <div className="flex-1 uppercase text-[11px] space-y-0.5 font-bold leading-tight">
                <p>{membrete.linea1}</p>
                <p>{membrete.linea2}</p>
                <p>{membrete.linea3}</p>
                <p>{membrete.nombreInstitucion}</p>
                <p className="italic font-normal">{membrete.ubicacion}</p>
              </div>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-black uppercase underline tracking-[0.2em] mb-4">
                PLANILLA DE CONTROL ACADÉMICO POR ASIGNATURA
              </h2>
              <div className="grid grid-cols-3 gap-2 text-[11px] font-bold uppercase italic border-y-2 border-black py-3">
                <p className="text-left">AÑO ESCOLAR: {periodo || localStorage.getItem("sistema_periodo_activo") || "2025-2026"}</p>
                <p className="text-center font-black bg-gray-100 px-2 py-1 rounded">
                  MATERIA: {materiaSel} {codigoMateria ? `(${codigoMateria})` : ""}
                </p>
                <p className="text-right">
                  SECCIÓN: {seccionSel?.año} "{seccionSel?.nombre?.split(" ")[1]}"
                </p>
              </div>
            </div>

            <div className="flex-1">
              <table className="w-full border-collapse border-[2.5px] border-black text-[10px]">
                <thead>
                  <tr className="bg-gray-100">
                    <th rowSpan={2} className="border-2 border-black p-2 w-10 text-center font-black">
                      N°
                    </th>
                    <th
                      rowSpan={2}
                      className="border-2 border-black p-2 text-left min-w-[220px] font-black uppercase px-2"
                    >
                      NOMBRE / CÉDULA
                    </th>
                    {[1, 2, 3].map((l) => (
                      <th
                        key={l}
                        colSpan={(evaluacionesPorLapso[l]?.length || 0) + 1}
                        className="border-2 border-black p-1 text-center bg-gray-50 uppercase font-black tracking-widest text-xs italic"
                      >
                        LAPSO {l}
                      </th>
                    ))}
                    <th
                      rowSpan={2}
                      className="border-2 border-black p-2 w-14 text-center bg-gray-200 font-black text-xs"
                    >
                      DEF.
                    </th>
                  </tr>
                  <tr className="bg-white">
                    {[1, 2, 3].map((l) => (
                      <React.Fragment key={l}>
                        {evaluacionesPorLapso[l]?.map((ev, idx) => (
                          <th
                            key={ev.id}
                            className="border border-black p-1 text-[8.5px] w-12 text-center h-44 relative align-bottom overflow-hidden rotate-header"
                          >
                            <div className="absolute inset-x-0 top-2 bottom-12 flex items-center justify-center pointer-events-none">
                              <span className="-rotate-90 block whitespace-nowrap uppercase font-black tracking-tighter leading-none text-[10px] w-36 text-center">
                                {ev.nombre || `EV ${idx + 1}`}
                              </span>
                            </div>
                            <div className="absolute bottom-1 left-0 right-0 border-t border-black pt-1 font-black text-[#5564eb] bg-white/95">
                              {ev.peso}%
                            </div>
                          </th>
                        ))}
                        <th className="border-2 border-black p-1 w-12 text-center bg-gray-50 font-black italic">
                          PROM.
                        </th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-black">
                  {estudiantesFiltrados.map((est, i) => (
                    <tr key={est.id} className="h-11">
                      <td className="border border-black text-center p-1 font-bold text-xs">
                        {i + 1}
                      </td>
                      <td className="border border-black p-2 text-left leading-tight">
                        <p className="uppercase font-black text-[11px] mb-1">
                          {est.lastName}, {est.firstName}
                        </p>
                        <p className="text-[9px] font-mono font-bold tracking-widest text-gray-400">
                          ID: {est.ci || "ID DESCONOCIDO"}
                        </p>
                      </td>
                      {[1, 2, 3].map((l) => (
                        <React.Fragment key={l}>
                          {evaluacionesPorLapso[l]?.map((ev) => (
                            <td
                              key={ev.id}
                              className="border border-black text-center p-1 font-mono text-[12px] font-black bg-white"
                            >
                              {(nivel === "Primaria" || nivel === "Inicial")
                                ? (() => {
                                    const v: any = notasAlumnos[est.id]?.[ev.id];
                                    if (typeof v === "string" && ["A", "B", "C", "D", "E"].includes(v.toUpperCase().trim())) {
                                      return v.toUpperCase().trim();
                                    }
                                    if (v >= 19) return "A";
                                    if (v >= 15) return "B";
                                    if (v >= 11) return "C";
                                    if (v >= 7) return "D";
                                    if (v > 0) return "E";
                                    return v ? String(v) : "-";
                                  })()
                                : (notasAlumnos[est.id]?.[ev.id] !== undefined ? notasAlumnos[est.id][ev.id] : "—")}
                            </td>
                          ))}
                          <td className="border-2 border-black text-center p-1 font-black bg-gray-50 text-[#5564eb] text-[12px]">
                            {calcularNotaFinalLapso(est.id, l)}
                          </td>
                        </React.Fragment>
                      ))}
                      <td className="border-2 border-black text-center p-1 font-black bg-gray-200 text-sm italic">
                        {calcularPromedioCiclo
                          ? calcularPromedioCiclo(est.id)
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-16 grid grid-cols-2 gap-40 text-center text-[12px] font-bold uppercase italic px-10">
              <div className="border-t-2 border-black pt-3 flex flex-col items-center">
                <span>COORDINACIÓN DE CONTROL DE ESTUDIOS</span>
                <span className="mt-4 text-[10px] border-b border-black w-48 font-mono opacity-50">
                  C.I. / FIRMA
                </span>
              </div>
              <div className="border-t-2 border-black pt-3 flex flex-col items-center text-center">
                <span>SELLO DE CONTROL DE ESTUDIOS</span>
                <div className="mt-4 w-28 h-28 border-2 border-dashed border-gray-400 rounded-full flex items-center justify-center text-[8px] text-gray-400 font-black opacity-30 tracking-widest uppercase text-center leading-none">
                  VALIDACIÓN
                  <br />
                  INSTITUCIONAL
                </div>
              </div>
            </div>

            <div className="text-[9px] text-gray-400 text-center mt-auto uppercase tracking-[0.6em] pt-10 italic font-black border-t border-gray-100">
              U.E. "REPÚBLICA DE CHILE" - SISTEMA PSM G6 - REPORTE OFICIAL
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default NotasReportModal;
