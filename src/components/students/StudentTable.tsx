import React, { useState, useEffect, useMemo } from "react";
import { Eye, Edit, Trash2, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { Student } from "../../types/student";

interface StudentTableProps {
  students: Student[];
  loading: boolean;
  onView: (student: Student) => void;
  onEdit: (student: Student) => void;
  onDelete: (id: string) => void;
  docsObligatoriosIds: string[];
}

export const StudentTable: React.FC<StudentTableProps> = ({
  students,
  loading,
  onView,
  onEdit,
  onDelete,
  docsObligatoriosIds,
}) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(25);

  useEffect(() => {
    setPage(1);
  }, [students.length, pageSize]);

  const totalPages = Math.max(1, Math.ceil(students.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const visibleStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return students.slice(start, start + pageSize);
  }, [students, currentPage, pageSize]);

  const getInitials = (name: string) => (name ? name.charAt(0).toUpperCase() : "?");

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden min-h-[400px] flex flex-col justify-between">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-green-800 uppercase text-[10px] font-black tracking-widest border-b border-green-100">
            <tr>
              <th className="px-8 py-6">Estudiante</th>
              <th className="px-8 py-6">Cédula / ID Escolar</th>
              <th className="px-8 py-6">Nivel</th>
              <th className="px-8 py-6">Grado / Año</th>
              <th className="px-8 py-6">Estatus</th>
              <th className="px-8 py-6 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-left">
            {!loading && visibleStudents.length > 0 ? (
              visibleStudents.map((student) => (
                <tr key={student.id} className="hover:bg-green-50/20 transition-colors group">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-4">
                      {/* CELDA DE FOTO CON TOOLTIP LATERAL */}
                      <div className="relative group/photo">
                        <div className="w-11 h-11 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border-2 border-gray-100 shadow-sm">
                          {student.studentPhoto ? (
                            <img
                              src={student.studentPhoto}
                              className="w-full h-full object-cover"
                              alt={`${student.firstName} ${student.lastName}`}
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-base font-black uppercase">
                              {getInitials(student.firstName)}
                            </div>
                          )}
                        </div>

                        {(() => {
                          const faltantes = docsObligatoriosIds.filter(
                            (docId) =>
                              !student.inscriptionFiles?.some((f) =>
                                f.path.toLowerCase().includes(docId.toLowerCase())
                              )
                          );

                          if (faltantes.length > 0) {
                            return (
                              <div className="absolute -top-1.5 -right-1.5 z-50 group/alert">
                                <div className="bg-red-600 text-white rounded-full p-1 shadow-md border-2 border-white">
                                  <AlertTriangle size={10} strokeWidth={3} />
                                </div>

                                <div className="absolute left-full ml-3 top-0 w-44 p-3 bg-gray-900 text-white text-[9px] rounded-2xl shadow-2xl opacity-0 group-hover/alert:opacity-100 pointer-events-none transition-all duration-200 border border-white/10 z-[100]">
                                  <p className="font-black uppercase tracking-widest text-red-400 mb-1">
                                    Expediente Incompleto
                                  </p>
                                  <p className="font-medium text-gray-200 leading-tight">
                                    Faltan{" "}
                                    <span className="text-white font-black">
                                      {faltantes.length} documentos
                                    </span>{" "}
                                    para completar la ficha técnica.
                                  </p>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>

                      {/* INFORMACIÓN DE IDENTIDAD */}
                      <div className="flex flex-col text-left">
                        <span className="font-black text-gray-800 uppercase text-xs tracking-tight leading-none mb-1">
                          {student.firstName} {student.lastName}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono tracking-tighter uppercase">
                          {student.id}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4 text-gray-600 font-mono text-xs font-bold uppercase">
                    {student.ci || ""}
                  </td>
                  <td className="px-8 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${
                        student.level === "Inicial"
                          ? "bg-amber-100 text-amber-700"
                          : student.level === "Primaria"
                          ? "bg-green-100 text-green-700"
                          : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      {student.level}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-gray-600 text-xs font-bold uppercase tracking-tighter">
                    {student.grade} "{student.section}"
                  </td>

                  {/* CELDA DE ESTATUS */}
                  <td className="px-8 py-4">
                    <span
                      className={`flex items-center gap-2 text-[10px] font-black uppercase ${
                        student.status === "Inscrito"
                          ? "text-green-600"
                          : student.status === "Pendiente"
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          student.status === "Inscrito"
                            ? "bg-green-500"
                            : student.status === "Pendiente"
                            ? "bg-yellow-500"
                            : "bg-red-600"
                        }`}
                      />
                      {student.status}
                    </span>
                  </td>

                  <td className="px-8 py-4">
                    <div className="flex justify-center items-center gap-3">
                      <button
                        onClick={() => onView(student)}
                        className="p-2.5 bg-blue-50 text-blue-500 hover:text-blue-700 hover:bg-blue-100 border border-blue-100 rounded-xl shadow-sm transition-colors duration-150"
                        title="Ver Ficha Completa"
                      >
                        <Eye size={17} />
                      </button>

                      <button
                        onClick={() => onEdit(student)}
                        className="p-2.5 bg-green-50 text-green-500 hover:text-green-700 hover:bg-green-100 border border-green-100 rounded-xl shadow-sm transition-colors duration-150"
                        title="Editar Expediente"
                      >
                        <Edit size={17} />
                      </button>

                      <button
                        onClick={() => onDelete(student.id)}
                        className="p-2.5 bg-red-50 text-red-400 hover:text-red-600 hover:bg-red-100 border border-red-100 rounded-xl shadow-sm transition-colors duration-150"
                        title="Eliminar Estudiante"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              !loading && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-20 text-center text-gray-400 uppercase text-[10px] font-black italic tracking-widest border-none"
                  >
                    No hay registros coincidentes
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      {/* BARRA DE PAGINACIÓN OPTIMIZADA */}
      {!loading && students.length > 0 && (
        <div className="px-8 py-4 bg-gray-50/80 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Mostrando {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, students.length)} de {students.length}
            </span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-[10px] font-black text-gray-600 uppercase outline-none cursor-pointer"
            >
              <option value={15}>15 por pág.</option>
              <option value={25}>25 por pág.</option>
              <option value={50}>50 por pág.</option>
              <option value={200}>Ver Todos ({students.length})</option>
            </select>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="px-3 py-1 text-[10px] font-black text-gray-600 uppercase">
                Página {currentPage} de {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(StudentTable);
