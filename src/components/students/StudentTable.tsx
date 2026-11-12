import React from "react";
import { Eye, Edit, Trash2, AlertTriangle } from "lucide-react";
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
  const getInitials = (name: string) => (name ? name.charAt(0).toUpperCase() : "?");

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden min-h-[400px]">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-green-800 uppercase text-[10px] font-black tracking-widest border-b border-green-100">
            <tr>
              <th className="px-8 py-6">Estudiante</th>
              <th className="px-8 py-6">Cédula</th>
              <th className="px-8 py-6">Nivel</th>
              <th className="px-8 py-6">Grado/Año</th>
              <th className="px-8 py-6">Estatus</th>
              <th className="px-8 py-6 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-left">
            {!loading && students.length > 0 ? (
              students.map((student) => (
                <tr key={student.id} className="hover:bg-green-50/20 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      {/* CELDA DE FOTO CON TOOLTIP LATERAL */}
                      <div className="relative group/photo">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border-2 border-gray-100 shadow-sm group-hover:scale-110 transition-transform duration-300">
                          {student.studentPhoto ? (
                            <img
                              src={student.studentPhoto}
                              className="w-full h-full object-cover"
                              alt={`${student.firstName} ${student.lastName}`}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300 text-lg font-black uppercase">
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
                                <div className="bg-red-600 text-white rounded-full p-1 shadow-md border-2 border-white transition-transform duration-200 group-hover/alert:scale-110">
                                  <AlertTriangle size={10} strokeWidth={3} />
                                </div>

                                {/* Posicionamiento lateral derecho */}
                                <div className="absolute left-full ml-3 top-0 w-44 p-3 bg-gray-900 text-white text-[9px] rounded-2xl shadow-2xl opacity-0 group-hover/alert:opacity-100 pointer-events-none transition-all duration-200 transform -translate-x-2 group-hover/alert:translate-x-0 border border-white/10 z-[100]">
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
                                  <div className="absolute right-full top-3 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[6px] border-r-gray-900" />
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
                  <td className="px-8 py-5 text-gray-600 font-mono text-xs font-bold uppercase">
                    {student.ci || ""}
                  </td>
                  <td className="px-8 py-5">
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
                  <td className="px-8 py-5 text-gray-600 text-xs font-bold uppercase tracking-tighter">
                    {student.grade} "{student.section}"
                  </td>

                  {/* CELDA DE ESTATUS */}
                  <td className="px-8 py-5">
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
                            ? "bg-green-500 shadow-[0_0_8px_rgba(85,100,235,0.5)]"
                            : student.status === "Pendiente"
                            ? "bg-yellow-500"
                            : "bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.5)]"
                        }`}
                      />
                      {student.status}
                    </span>
                  </td>

                  <td className="px-8 py-5">
                    <div className="flex justify-center items-center gap-3">
                      <button
                        onClick={() => onView(student)}
                        className="p-2.5 bg-blue-50 text-blue-400 hover:text-blue-700 hover:bg-blue-100 border border-blue-100 rounded-xl shadow-sm transition-all duration-200 active:scale-90 group"
                        title="Ver Ficha Completa"
                      >
                        <Eye size={18} className="group-hover:scale-110 transition-transform" />
                      </button>

                      <button
                        onClick={() => onEdit(student)}
                        className="p-2.5 bg-green-50 text-green-400 hover:text-green-700 hover:bg-green-100 border border-green-100 rounded-xl shadow-sm transition-all duration-200 active:scale-90 group"
                        title="Editar Expediente"
                      >
                        <Edit size={18} className="group-hover:scale-110 transition-transform" />
                      </button>

                      <button
                        onClick={() => onDelete(student.id)}
                        className="p-2.5 bg-red-50 text-red-300 hover:text-red-600 hover:bg-red-100 border border-red-100 rounded-xl shadow-sm transition-all duration-200 active:scale-90 group"
                        title="Eliminar Estudiante"
                      >
                        <Trash2 size={18} className="group-hover:scale-110 transition-transform" />
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
    </div>
  );
};

export default StudentTable;
