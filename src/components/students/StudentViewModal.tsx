import React from "react";
import { Dialog, DialogPanel } from "@headlessui/react";
import { AnimatePresence } from "framer-motion";
import { 
  X, ShieldCheck, User, Users, Activity, FileText, Phone, Eye 
} from "lucide-react";
import { MdErrorOutline, MdCheckCircle } from "react-icons/md";
import { Student } from "../../types/student";

interface StudentViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  docsObligatorios?: { id: string; label: string }[];
}

const DEFAULT_DOCS = [
  { id: "birthCertificate", label: "Partida de Nacimiento" },
  { id: "studentCI", label: "Cédula del Estudiante" },
  { id: "medicalCertificate", label: "Certificado Médico" },
  { id: "vaccinationCard", label: "Carnet de Vacunación" },
  { id: "repCI", label: "Cédula del Representante" },
  { id: "addressProof", label: "Constancia de Domicilio" },
  { id: "reportCard", label: "Boletín Año Anterior" },
  { id: "conductLetter", label: "Constancia de Conducta" },
];

export const StudentViewModal: React.FC<StudentViewModalProps> = ({
  isOpen,
  onClose,
  student,
  docsObligatorios = DEFAULT_DOCS,
}) => {
  if (!student) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog
          open={true}
          onClose={onClose}
          className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
        >
          <DialogPanel className="bg-white rounded-[3rem] w-full max-w-5xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col border border-gray-100">
            {/* CABECERA */}
            <div className="bg-[#5564eb] p-6 flex flex-col md:flex-row gap-6 items-center text-white relative shrink-0">
              <div className="absolute top-0 right-10 p-10 opacity-10 rotate-12 pointer-events-none">
                <ShieldCheck size={140} />
              </div>
              <button
                type="button"
                onClick={onClose}
                className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/15 hover:bg-white/25 p-2 rounded-full transition z-20 shadow-sm active:scale-95"
                title="Cerrar ventana"
              >
                <X size={22} />
              </button>

              <div className="w-28 h-28 rounded-[2rem] bg-white border-4 border-white shadow-xl overflow-hidden shrink-0 z-10">
                {student.studentPhoto ? (
                  <img
                    src={student.studentPhoto}
                    className="w-full h-full object-cover"
                    alt="Estudiante"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-200 bg-gray-50">
                    <User size={50} />
                  </div>
                )}
              </div>

              <div className="flex-1 text-center md:text-left z-10">
                <h2 className="text-2xl font-black capitalize tracking-tighter leading-tight">
                  {student.firstName} {student.lastName}
                </h2>
                <p className="text-blue-100 font-mono text-base font-bold opacity-90 mb-3">
                  {student.ci ? `V-${student.ci}` : "ID GENERADO: " + student.id}
                </p>

                <div className="flex flex-wrap gap-3 justify-center md:justify-start items-center">
                  <div className="flex gap-1.5 uppercase font-black text-[8px]">
                    <span className="px-3 py-1 bg-white/20 rounded-full backdrop-blur-md border border-white/30 tracking-widest">
                      {student.level}
                    </span>
                    <span className="px-3 py-1 bg-white/20 rounded-full backdrop-blur-md border border-white/30 tracking-widest">
                      {student.grade} - {student.section}
                    </span>
                    <span className="px-3 py-1 bg-white/20 rounded-full backdrop-blur-md border border-white/30 tracking-widest">
                      PERIODO: {student.schoolYear}
                    </span>
                  </div>

                  <span
                    className={`px-4 py-1.5 rounded-full border border-white/30 text-[9px] font-black uppercase tracking-widest shadow-lg transition-all ${
                      student.status === "Inscrito"
                        ? "bg-green-400 text-green-900"
                        : student.status === "Pendiente"
                        ? "bg-yellow-400 text-yellow-900"
                        : "bg-red-600 text-white"
                    }`}
                  >
                    {student.status}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-center z-10 shrink-0 mr-8 md:mr-14">
                <div className="w-16 h-16 rounded-2xl bg-white/20 border-2 border-white/50 shadow-lg overflow-hidden mb-1 backdrop-blur-sm">
                  {student.repPhoto ? (
                    <img
                      src={student.repPhoto}
                      className="w-full h-full object-cover"
                      alt="Representante"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/50">
                      <Users size={24} />
                    </div>
                  )}
                </div>
                <span className="text-[7px] uppercase font-black tracking-widest opacity-80">
                  Tutor Legal
                </span>
              </div>
            </div>

            {/* CONTENIDO CON SCROLL */}
            <div className="overflow-y-auto p-8 flex-1 bg-gray-50 custom-scrollbar text-left font-bold uppercase text-gray-600 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* BLOQUE: DATOS PERSONALES */}
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                  <h3 className="text-[#5564eb] font-black mb-4 flex items-center gap-2 border-b pb-2 text-[10px] tracking-widest">
                    <User size={16} /> DATOS PERSONALES
                  </h3>
                  <div className="grid grid-cols-2 gap-y-3 text-[11px]">
                    <span className="text-gray-400">NACIMIENTO:</span>{" "}
                    <span>{student.birthDate || "---"}</span>
                    <span className="text-gray-400">EDAD:</span>{" "}
                    <span>{student.age} AÑOS</span>
                    <span className="text-gray-400">LUGAR NAC:</span>{" "}
                    <span>{student.placeOfBirth || "---"}</span>
                    <span className="text-gray-400">ENTIDAD:</span>{" "}
                    <span>{student.entity || "---"}</span>
                    <span className="text-gray-400">GÉNERO:</span>{" "}
                    <span>{student.gender || "---"}</span>
                    <span className="text-gray-400">DEA COLEGIO:</span>{" "}
                    <span>{student.deaCode || "N/A"}</span>
                    <span className="text-gray-400">PROCEDENCIA:</span>{" "}
                    <span className="truncate">{student.previousSchool || "---"}</span>
                    <span className="text-gray-400">DIRECCIÓN:</span>{" "}
                    <span className="lowercase leading-tight">{student.address || "NO REGISTRADA"}</span>
                  </div>
                </div>

                {/* BLOQUE: SALUD Y BIOMETRÍA */}
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                  <h3 className="text-red-700 font-black mb-4 flex items-center gap-2 border-b pb-2 text-[10px] tracking-widest">
                    <Activity size={16} /> BIOMETRÍA Y SALUD
                  </h3>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-red-50 p-2 rounded-xl border border-red-100 text-center">
                      <span className="text-[7px] block text-red-400">SANGRE</span>
                      <span className="text-xs font-black text-red-700">
                        {student.bloodType || "N/A"}
                      </span>
                    </div>
                    <div className="bg-red-50 p-2 rounded-xl border border-red-100 text-center">
                      <span className="text-[7px] block text-red-400">PESO</span>
                      <span className="text-xs font-black text-red-700">
                        {student.weight ? `${student.weight} KG` : "---"}
                      </span>
                    </div>
                    <div className="bg-red-50 p-2 rounded-xl border border-red-100 text-center">
                      <span className="text-[7px] block text-red-400">TALLA</span>
                      <span className="text-xs font-black text-red-700">
                        {student.height ? `${student.height} CM` : "---"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[10px] mb-4">
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                      <span className="text-gray-400 block mb-1">ALERGIAS:</span>
                      <span className="text-gray-700 leading-none">
                        {student.allergies || "NINGUNA REGISTRADA"}
                      </span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                      <span className="text-gray-400 block mb-1">CONDICIÓN MÉDICA:</span>
                      <span className="text-gray-700 leading-none">
                        {student.medicalCondition || "SANO / NINGUNA"}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between text-[10px] bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <span>CAMISA: {student.shirtSize || "---"}</span>
                    <span>PANTALÓN: {student.pantsSize || "---"}</span>
                    <span>CALZADO: {student.shoeSize || "---"}</span>
                  </div>
                </div>
              </div>

              {/* BLOQUE: EXPEDIENTE DE TRASLADO */}
              {student.isTransfer && (
                <div className="bg-orange-50/50 p-6 rounded-[2rem] border border-orange-200 shadow-sm">
                  <h3 className="text-orange-700 font-black mb-4 flex items-center gap-2 border-b border-orange-200 pb-2 text-[10px] tracking-widest">
                    <FileText size={16} /> EXPEDIENTE DE TRASLADO
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px]">
                    <p>
                      <span className="text-orange-400">COLEGIO ANTERIOR:</span>{" "}
                      <span className="text-gray-700">{student.lastSchoolName || "---"}</span>
                    </p>
                    <p>
                      <span className="text-orange-400">ÚLTIMO GRADO/LAPSO:</span>{" "}
                      <span className="text-gray-700">
                        {student.lastGradeCompleted} / {student.lastTermCompleted}
                      </span>
                    </p>
                    <p className="md:col-span-3">
                      <span className="text-orange-400">OBSERVACIONES DE TRASLADO:</span>{" "}
                      <span className="text-gray-700 italic lowercase leading-tight">
                        {student.transferObservations || "SIN NOTAS"}
                      </span>
                    </p>
                  </div>
                </div>
              )}

              {/* FILA 2: NÚCLEO FAMILIAR */}
              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                <h3 className="text-blue-700 font-black mb-4 flex items-center gap-2 border-b pb-2 text-[10px] tracking-widest">
                  <Users size={16} /> NÚCLEO FAMILIAR
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50/30 p-4 rounded-2xl border border-blue-100">
                    <p className="text-[9px] text-blue-400 mb-2 tracking-widest italic uppercase">
                      Madre
                    </p>
                    <div className="space-y-2 text-[11px]">
                      <p>
                        <span className="text-gray-400">NOMBRES:</span>{" "}
                        {student.motherFirstName || "---"}
                      </p>
                      <p>
                        <span className="text-gray-400">APELLIDOS:</span>{" "}
                        {student.motherLastName || "---"}
                      </p>
                      <p>
                        <span className="text-gray-400">CÉDULA:</span>{" "}
                        {student.motherCI ? `V-${student.motherCI}` : "---"}
                      </p>
                      <p>
                        <span className="text-gray-400">TELÉFONO:</span>{" "}
                        {student.motherPhone || "---"}
                      </p>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <p className="text-[9px] text-gray-400 mb-2 tracking-widest italic uppercase">
                      Padre
                    </p>
                    <div className="space-y-2 text-[11px]">
                      <p>
                        <span className="text-gray-400">NOMBRES:</span>{" "}
                        {student.fatherFirstName || "---"}
                      </p>
                      <p>
                        <span className="text-gray-400">APELLIDOS:</span>{" "}
                        {student.fatherLastName || "---"}
                      </p>
                      <p>
                        <span className="text-gray-400">CÉDULA:</span>{" "}
                        {student.fatherCI ? `V-${student.fatherCI}` : "---"}
                      </p>
                      <p>
                        <span className="text-gray-400">TELÉFONO:</span>{" "}
                        {student.fatherPhone || "---"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* FILA 3: REPRESENTANTE Y DOCUMENTOS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* BLOQUE: REPRESENTANTE ASIGNADO */}
                <div className="bg-blue-50/40 p-6 rounded-[2rem] border border-blue-200 shadow-sm">
                  <h3 className="text-[#5564eb] font-black mb-4 flex items-center gap-2 border-b border-blue-200 pb-2 text-[10px] tracking-widest">
                    <ShieldCheck size={16} /> REPRESENTANTE ASIGNADO
                  </h3>
                  <div className="space-y-3 text-[11px]">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[#5564eb]/60 block text-[8px] mb-0.5 font-black uppercase">
                          Nombres
                        </span>
                        <p className="font-black text-gray-700 truncate">
                          {student.repFirstName || "---"}
                        </p>
                      </div>
                      <div>
                        <span className="text-[#5564eb]/60 block text-[8px] mb-0.5 font-black uppercase">
                          Apellidos
                        </span>
                        <p className="font-black text-gray-700 truncate">
                          {student.repLastName || "---"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 border-t border-blue-100 pt-2">
                      <div>
                        <span className="text-[#5564eb]/60 block text-[8px] mb-0.5 font-black uppercase">
                          Cédula
                        </span>
                        <p className="font-black text-gray-700">V-{student.repCI}</p>
                      </div>
                      <div>
                        <span className="text-[#5564eb]/60 block text-[8px] mb-0.5 font-black uppercase">
                          Parentesco
                        </span>
                        <p className="font-black text-gray-700 uppercase">
                          {student.relationship || "---"}
                        </p>
                      </div>
                    </div>

                    <div className="bg-white/60 p-3 rounded-xl border border-blue-100 mt-1 shadow-inner">
                      <span className="text-[#5564eb]/60 block text-[8px] mb-1 font-black uppercase">
                        Canal de Contacto Directo
                      </span>
                      <p className="font-black text-gray-700 flex items-center gap-2">
                        <Phone size={12} className="text-[#5564eb]" />
                        {student.repPhone || "S/T"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* BLOQUE: EXPEDIENTE DIGITAL */}
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                  <h3 className="text-gray-400 font-black mb-4 flex items-center gap-2 border-b pb-2 text-[10px] tracking-widest uppercase">
                    <FileText size={16} /> ESTATUS DE EXPEDIENTE DIGITAL
                  </h3>
                  <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                    {docsObligatorios.map((doc) => {
                      const file = student.inscriptionFiles?.find((f) =>
                        f.path.toLowerCase().includes(doc.id.toLowerCase())
                      );

                      return (
                        <div
                          key={doc.id}
                          className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                            file
                              ? "bg-white border-green-100 shadow-sm"
                              : "bg-gray-50 border-gray-100"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-1.5 rounded-lg ${
                                file ? "bg-green-100 text-green-600" : "bg-red-50 text-red-400"
                              }`}
                            >
                              {file ? <MdCheckCircle size={16} /> : <MdErrorOutline size={16} />}
                            </div>
                            <span className="text-[9px] font-black text-gray-600 uppercase tracking-tighter truncate w-40">
                              {doc.label}
                            </span>
                          </div>

                          <div className="flex gap-2 items-center">
                            {file ? (
                              <>
                                <span className="text-[7px] bg-green-600 text-white px-2.5 py-1 rounded-md font-black tracking-widest shadow-sm">
                                  CARGADO
                                </span>
                                <button
                                  type="button"
                                  onClick={() => window.open(file.path)}
                                  className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all active:scale-90 border border-blue-100 shadow-sm"
                                  title="Visualizar Documento"
                                >
                                  <Eye size={14} />
                                </button>
                              </>
                            ) : (
                              <span className="text-[7px] bg-red-50 text-red-600 px-2.5 py-1 rounded-md font-black border border-red-100 animate-pulse tracking-widest uppercase">
                                Faltante
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* BLOQUE: OBSERVACIONES TÉCNICAS */}
              <div className="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100 shadow-sm">
                <h3 className="text-blue-700 font-black mb-4 flex items-center gap-2 border-b border-blue-200 pb-2 text-[10px] tracking-widest">
                  <FileText size={16} /> NOTAS TÉCNICAS DEL ALUMNO
                </h3>
                <div className="space-y-4 text-[10px]">
                  {student.obsPersonal && (
                    <p>
                      <span className="text-blue-400 tracking-tighter">[PASO 1 - ESTUDIANTE]:</span>{" "}
                      <span className="text-gray-700 italic font-medium leading-none">
                        {student.obsPersonal}
                      </span>
                    </p>
                  )}
                  {student.obsFamiliar && (
                    <p>
                      <span className="text-blue-400 tracking-tighter">[PASO 2 - FAMILIAR]:</span>{" "}
                      <span className="text-gray-700 italic font-medium leading-none">
                        {student.obsFamiliar}
                      </span>
                    </p>
                  )}
                  {student.obsSalud && (
                    <p>
                      <span className="text-blue-400 tracking-tighter">[PASO 3 - SALUD]:</span>{" "}
                      <span className="text-gray-700 italic font-medium leading-none">
                        {student.obsSalud}
                      </span>
                    </p>
                  )}
                  {student.observations && (
                    <p>
                      <span className="text-blue-400 tracking-tighter">[PASO 4 - ACADÉMICO]:</span>{" "}
                      <span className="text-gray-700 italic font-medium leading-none">
                        {student.observations}
                      </span>
                    </p>
                  )}
                  {!student.obsPersonal &&
                    !student.obsFamiliar &&
                    !student.obsSalud &&
                    !student.observations && (
                      <p className="text-gray-400 italic text-center">
                        Sin observaciones registradas en el expediente.
                      </p>
                    )}
                </div>
              </div>
            </div>

            {/* PIE DE MODAL FIJO */}
            <div className="p-6 border-t bg-gray-50 flex justify-end shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-10 py-3 rounded-xl bg-gray-900 text-white font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all shadow-xl"
              >
                Cerrar Ficha
              </button>
            </div>
          </DialogPanel>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default StudentViewModal;
