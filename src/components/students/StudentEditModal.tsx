import React, { useState, useMemo } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { AnimatePresence } from "framer-motion";
import {
  Edit,
  X,
  User,
  Camera,
  ShieldCheck,
  MapPin,
  Users,
  Activity,
  GraduationCap,
  FileText,
  Eye,
  RefreshCw,
  Plus,
  Trash2,
  AlertTriangle,
  Save,
} from "lucide-react";
import { MdCheckCircle } from "react-icons/md";
import { Student } from "../../types/student";

interface StudentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  setStudent: React.Dispatch<React.SetStateAction<Student | null>>;
  onSave: (e: React.FormEvent) => Promise<void>;
  onEditChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => void;
  onStudentPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRepPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileUpload: (file: File, docId: string, docLabel: string) => Promise<void>;
  onOpenDeleteFileModal: (filePath: string) => void;
  bloodTypes: string[];
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

export const StudentEditModal: React.FC<StudentEditModalProps> = ({
  isOpen,
  onClose,
  student,
  setStudent,
  onSave,
  onEditChange,
  onStudentPhotoChange,
  onRepPhotoChange,
  onFileUpload,
  onOpenDeleteFileModal,
  bloodTypes,
  docsObligatorios = DEFAULT_DOCS,
}) => {
  const [customDocs, setCustomDocs] = useState<{ id: string; label: string }[]>([]);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [showAddDocInput, setShowAddDocInput] = useState(false);

  const allDocs = useMemo(() => {
    const baseIds = new Set(docsObligatorios.map((d) => d.id.toLowerCase()));
    const extraFromStudent: { id: string; label: string }[] = [];

    (student?.inscriptionFiles || []).forEach((f: any) => {
      const fId = (f.id || (f.name || "").split("_")[0] || "").trim();
      const matchesBase = Array.from(baseIds).some(
        (bId) =>
          fId.toLowerCase() === bId ||
          (f.name || "").toLowerCase().startsWith(bId) ||
          (f.path || "").toLowerCase().includes(bId)
      );
      if (!matchesBase && fId) {
        extraFromStudent.push({
          id: fId,
          label: f.label || f.name || fId,
        });
      }
    });

    const combined = [...docsObligatorios, ...extraFromStudent];
    customDocs.forEach((cd) => {
      if (!combined.some((c) => c.id.toLowerCase() === cd.id.toLowerCase())) {
        combined.push(cd);
      }
    });
    return combined;
  }, [docsObligatorios, student?.inscriptionFiles, customDocs]);

  const handleAddCustomDoc = () => {
    const cleanTitle = newDocTitle.trim();
    if (!cleanTitle) return;
    const slug = cleanTitle
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 20);
    const customId = `customDoc-${slug || "doc"}-${Date.now()}`;
    setCustomDocs((prev) => [...prev, { id: customId, label: cleanTitle }]);
    setNewDocTitle("");
    setShowAddDocInput(false);
  };

  if (!student) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog
          open={true}
          onClose={onClose}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 text-left"
        >
          <DialogPanel className="bg-white rounded-[3rem] w-full max-w-5xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col border border-gray-100">
            {/* Encabezado */}
            <div className="p-8 border-b flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-5 text-left">
                <div className="p-4 bg-green-600 text-white rounded-3xl shadow-xl shadow-green-100 ring-4 ring-green-50">
                  <Edit size={32} />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black text-gray-800 uppercase tracking-tighter leading-none mb-1">
                    Editor de Expediente
                  </DialogTitle>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    ESTUDIANTE ID: {student.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-3 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-2xl transition-all active:scale-90"
              >
                <X size={36} />
              </button>
            </div>

            <form
              onSubmit={onSave}
              className="flex-1 overflow-y-auto p-10 space-y-12 bg-white custom-scrollbar text-left font-bold"
            >
              {/* 1. DATOS DEL ESTUDIANTE E IDENTIDAD */}
              <section className="space-y-6 text-left">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shadow-sm">
                    <User size={18} />
                  </div>
                  <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">
                    1. Datos del Estudiante e Identidad
                  </h3>
                </div>

                <div className="flex flex-col md:flex-row items-start gap-8">
                  {/* FOTO Y ESTATUS */}
                  <div className="flex flex-col items-center gap-4 shrink-0">
                    <div className="relative group">
                      <div className="w-40 h-40 rounded-[2.5rem] overflow-hidden bg-white border-4 border-white shadow-xl group-hover:scale-105 transition-transform duration-300">
                        {student.studentPhoto ? (
                          <img
                            src={student.studentPhoto}
                            className="w-full h-full object-cover"
                            alt="Estudiante"
                          />
                        ) : (
                          <User className="w-full h-full p-8 text-gray-200" />
                        )}
                      </div>
                      <label className="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-[2.5rem] backdrop-blur-sm">
                        <Camera size={28} className="mb-2" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-center px-4">
                          Cambiar Foto Estudiante
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={onStudentPhotoChange}
                        />
                      </label>
                    </div>

                    <div className="w-full space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest text-center block italic">
                        Estatus del Alumno
                      </label>
                      <select
                        name="status"
                        value={student.status}
                        onChange={onEditChange}
                        className={`w-full border-2 p-3 rounded-2xl outline-none text-[10px] font-black uppercase tracking-widest cursor-pointer shadow-sm transition-all ${
                          student.status === "Inscrito"
                            ? "bg-green-50 border-green-200 text-green-700"
                            : student.status === "Pendiente"
                            ? "bg-yellow-50 border-yellow-200 text-yellow-700"
                            : "bg-red-50 border-red-200 text-red-700"
                        }`}
                      >
                        <option value="Inscrito">Inscrito</option>
                        <option value="Pendiente">Pendiente</option>
                        <option value="Retirado">Retirado</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full uppercase">
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1 text-left">
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1">
                          CÉDULA DE IDENTIDAD (VACÍO = ID ESCOLAR)
                        </label>
                        <input
                          name="ci"
                          value={student.ci}
                          onChange={onEditChange}
                          placeholder="Solo números..."
                          className="w-full border p-4 rounded-2xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 outline-none transition text-sm font-black shadow-inner uppercase"
                        />
                        {!student.ci && student.motherCI && student.birthDate ? (
                          <div className="flex items-center gap-1.5 ml-1 mt-1 animate-pulse">
                            <ShieldCheck size={12} className="text-blue-600" />
                            <p className="text-[9px] text-blue-600 font-black tracking-tight uppercase">
                              SE ASIGNARÁ ID: 1{student.birthDate.slice(2, 4)}
                              {student.motherCI}
                            </p>
                          </div>
                        ) : (
                          !student.ci && (
                            <p className="text-[8px] text-gray-400 ml-1 italic">
                              Complete Fecha de Nac. y CI Madre para generar ID Escolar
                            </p>
                          )
                        )}
                      </div>
                      <div className="space-y-1 text-left">
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1">
                          PRIMER NOMBRE
                        </label>
                        <input
                          name="firstName"
                          value={student.firstName}
                          onChange={onEditChange}
                          className="w-full border p-4 rounded-2xl bg-gray-50 text-sm font-black uppercase outline-none focus:bg-white focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-1">
                        SEGUNDO NOMBRE
                      </label>
                      <input
                        name="secondName"
                        value={student.secondName || ""}
                        onChange={onEditChange}
                        className="w-full border p-4 rounded-2xl bg-gray-50 text-sm font-black uppercase outline-none focus:bg-white focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-1">
                        PRIMER APELLIDO
                      </label>
                      <input
                        name="lastName"
                        value={student.lastName}
                        onChange={onEditChange}
                        className="w-full border p-4 rounded-2xl bg-gray-50 text-sm font-black uppercase outline-none focus:bg-white focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-1">
                        SEGUNDO APELLIDO
                      </label>
                      <input
                        name="secondLastName"
                        value={student.secondLastName || ""}
                        onChange={onEditChange}
                        className="w-full border p-4 rounded-2xl bg-gray-50 text-sm font-black uppercase outline-none focus:bg-white focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-1">
                        FECHA DE NACIMIENTO
                      </label>
                      <input
                        type="date"
                        name="birthDate"
                        value={student.birthDate || ""}
                        onChange={onEditChange}
                        className="w-full border p-4 rounded-2xl bg-gray-50 text-sm font-black outline-none focus:bg-white focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-1">
                        EDAD CALCULADA
                      </label>
                      <input
                        name="age"
                        value={student.age ? `${student.age} AÑOS` : ""}
                        readOnly
                        className="w-full border p-4 rounded-2xl bg-gray-100 text-sm font-black cursor-not-allowed text-gray-500 font-mono tracking-widest"
                      />
                    </div>
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-1">
                        GÉNERO
                      </label>
                      <select
                        name="gender"
                        value={student.gender || ""}
                        onChange={onEditChange}
                        className="w-full border p-4 rounded-2xl bg-gray-50 text-xs font-black uppercase outline-none cursor-pointer"
                      >
                        <option value="">Seleccione...</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Femenino">Femenino</option>
                      </select>
                    </div>
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-1">
                        LUGAR DE NACIMIENTO
                      </label>
                      <input
                        name="placeOfBirth"
                        value={student.placeOfBirth || ""}
                        onChange={onEditChange}
                        className="w-full border p-4 rounded-2xl bg-gray-50 text-sm uppercase outline-none focus:bg-white"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* 2. DIRECCIÓN */}
              <section className="space-y-6 text-left">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                  <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg shadow-sm">
                    <MapPin size={18} />
                  </div>
                  <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">
                    2. Dirección de Habitación
                  </h3>
                </div>
                <textarea
                  name="address"
                  value={student.address || ""}
                  onChange={onEditChange}
                  className="w-full border p-5 rounded-[2rem] bg-gray-50 outline-none text-sm min-h-[100px] shadow-inner focus:bg-white transition-all uppercase font-medium"
                  placeholder="Escriba dirección exacta..."
                />
              </section>

              {/* 3. ESTRUCTURA FAMILIAR */}
              <section className="space-y-8 text-left uppercase">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                  <div className="p-2 bg-orange-50 text-orange-600 rounded-lg shadow-sm">
                    <Users size={18} />
                  </div>
                  <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">
                    3. Estructura Familiar
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* MADRE */}
                  <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 space-y-4 shadow-inner">
                    <p className="text-[10px] font-black text-orange-600 uppercase border-b pb-2 italic tracking-widest">
                      Datos de la Madre
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase ml-1">
                          Nombres
                        </label>
                        <input
                          name="motherFirstName"
                          placeholder="Ej: Maria"
                          value={student.motherFirstName || ""}
                          onChange={onEditChange}
                          className="w-full border p-4 rounded-2xl bg-white shadow-sm font-bold text-sm uppercase outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase ml-1">
                          Apellidos
                        </label>
                        <input
                          name="motherLastName"
                          placeholder="Ej: Perez"
                          value={student.motherLastName || ""}
                          onChange={onEditChange}
                          className="w-full border p-4 rounded-2xl bg-white shadow-sm font-bold text-sm uppercase outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase ml-1">
                        Cédula de Identidad
                      </label>
                      <input
                        name="motherCI"
                        placeholder="Solo números"
                        value={student.motherCI || ""}
                        onChange={onEditChange}
                        className="w-full border p-4 rounded-2xl bg-white text-sm font-mono shadow-sm outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase ml-1">
                        Número Telefónico
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={student.motherPhone?.substring(0, 4) || "0424"}
                          onChange={(e) =>
                            setStudent((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    motherPhone:
                                      e.target.value + (prev.motherPhone?.substring(4) || ""),
                                  }
                                : null
                            )
                          }
                          className="w-[100px] border p-4 rounded-2xl bg-white text-xs font-black appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          {["0424", "0412", "0426", "0416", "0422", "0414"].map((pref) => (
                            <option key={pref} value={pref}>
                              {pref}
                            </option>
                          ))}
                        </select>
                        <input
                          placeholder="7 dígitos"
                          value={student.motherPhone?.substring(4) || ""}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "").slice(0, 7);
                            setStudent((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    motherPhone:
                                      (prev.motherPhone?.substring(0, 4) || "0424") + val,
                                  }
                                : null
                            );
                          }}
                          className="flex-1 border p-4 rounded-2xl bg-white text-sm font-mono shadow-sm outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* PADRE */}
                  <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 space-y-4 shadow-inner">
                    <p className="text-[10px] font-black text-blue-600 uppercase border-b pb-2 italic tracking-widest">
                      Datos del Padre
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase ml-1">
                          Nombres
                        </label>
                        <input
                          name="fatherFirstName"
                          placeholder="Ej: Carlos"
                          value={student.fatherFirstName || ""}
                          onChange={onEditChange}
                          className="w-full border p-4 rounded-2xl bg-white shadow-sm font-bold text-sm uppercase outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase ml-1">
                          Apellidos
                        </label>
                        <input
                          name="fatherLastName"
                          placeholder="Ej: Silva"
                          value={student.fatherLastName || ""}
                          onChange={onEditChange}
                          className="w-full border p-4 rounded-2xl bg-white shadow-sm font-bold text-sm uppercase outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase ml-1">
                        Cédula de Identidad
                      </label>
                      <input
                        name="fatherCI"
                        placeholder="Solo números"
                        value={student.fatherCI || ""}
                        onChange={onEditChange}
                        className="w-full border p-4 rounded-2xl bg-white text-sm font-mono shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase ml-1">
                        Número Telefónico
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={student.fatherPhone?.substring(0, 4) || "0424"}
                          onChange={(e) =>
                            setStudent((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    fatherPhone:
                                      e.target.value + (prev.fatherPhone?.substring(4) || ""),
                                  }
                                : null
                            )
                          }
                          className="w-[100px] border p-4 rounded-2xl bg-white text-xs font-black appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {["0424", "0412", "0426", "0416", "0422", "0414"].map((pref) => (
                            <option key={pref} value={pref}>
                              {pref}
                            </option>
                          ))}
                        </select>
                        <input
                          placeholder="7 dígitos"
                          value={student.fatherPhone?.substring(4) || ""}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "").slice(0, 7);
                            setStudent((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    fatherPhone:
                                      (prev.fatherPhone?.substring(0, 4) || "0424") + val,
                                  }
                                : null
                            );
                          }}
                          className="flex-1 border p-4 rounded-2xl bg-white text-sm font-mono shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* REPRESENTANTE */}
                <div className="bg-green-50/50 p-8 rounded-[2.5rem] border border-green-200 mt-6 flex flex-col md:flex-row gap-8 items-center shadow-sm">
                  <div className="flex flex-col items-center gap-3 shrink-0">
                    <div className="relative group">
                      <div className="w-32 h-32 rounded-3xl overflow-hidden bg-white border-4 border-white shadow-xl">
                        {student.repPhoto ? (
                          <img
                            src={student.repPhoto}
                            className="w-full h-full object-cover"
                            alt="Representante"
                          />
                        ) : (
                          <Users className="w-full h-full p-6 text-gray-300" />
                        )}
                      </div>
                      <label className="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-3xl backdrop-blur-sm">
                        <Camera size={24} className="mb-1" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-center px-2">
                          Cambiar Foto Tutor
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={onRepPhotoChange}
                        />
                      </label>
                    </div>
                    <span className="text-[9px] font-black text-green-700 uppercase tracking-widest">
                      Tutor Registrado
                    </span>
                  </div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full text-left uppercase">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-green-800 uppercase ml-1">
                        Nombres
                      </label>
                      <input
                        name="repFirstName"
                        value={student.repFirstName || ""}
                        onChange={onEditChange}
                        className="w-full border-none p-4 rounded-2xl bg-white shadow-sm text-sm uppercase outline-none focus:ring-4 focus:ring-green-500/10"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-green-800 uppercase ml-1">
                        Apellidos
                      </label>
                      <input
                        name="repLastName"
                        value={student.repLastName || ""}
                        onChange={onEditChange}
                        className="w-full border-none p-4 rounded-2xl bg-white shadow-sm text-sm uppercase outline-none focus:ring-4 focus:ring-green-500/10"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-green-800 uppercase ml-1">
                        Cédula (CI)
                      </label>
                      <input
                        name="repCI"
                        value={student.repCI || ""}
                        onChange={onEditChange}
                        className="w-full border-none p-4 rounded-2xl bg-white shadow-sm text-sm font-mono outline-none focus:ring-4 focus:ring-green-500/10"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-green-800 uppercase ml-1">
                        Número de Contacto
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={student.repPhone?.substring(0, 4) || "0424"}
                          onChange={(e) =>
                            setStudent((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    repPhone:
                                      e.target.value + (prev.repPhone?.substring(4) || ""),
                                  }
                                : null
                            )
                          }
                          className="w-[100px] border-none p-4 rounded-2xl bg-white shadow-sm text-xs font-black appearance-none cursor-pointer outline-none focus:ring-4 focus:ring-green-500/10"
                        >
                          {["0424", "0412", "0426", "0416", "0422", "0414"].map((pref) => (
                            <option key={pref} value={pref}>
                              {pref}
                            </option>
                          ))}
                        </select>
                        <input
                          placeholder="7 números"
                          value={student.repPhone?.substring(4) || ""}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "").slice(0, 7);
                            setStudent((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    repPhone:
                                      (prev.repPhone?.substring(0, 4) || "0424") + val,
                                  }
                                : null
                            );
                          }}
                          className="flex-1 border-none p-4 rounded-2xl bg-white shadow-sm text-sm font-mono outline-none focus:ring-4 focus:ring-green-500/10"
                        />
                      </div>
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[9px] font-black text-green-800 ml-2 tracking-widest">
                        Parentesco
                      </label>
                      <input
                        name="relationship"
                        value={student.relationship || ""}
                        onChange={onEditChange}
                        placeholder="Madre, Padre, etc..."
                        className="w-full border-none p-5 rounded-2xl bg-white shadow-xl text-sm uppercase focus:ring-8 focus:ring-green-500/10"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* 4. SALUD Y BIOMETRÍA */}
              <section className="space-y-6 text-left">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                  <div className="p-2 bg-red-50 text-red-600 rounded-lg shadow-sm">
                    <Activity size={18} />
                  </div>
                  <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">
                    4. Salud y Biometría
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-black uppercase text-left">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">
                      Grupo Sanguíneo
                    </label>
                    <select
                      name="bloodType"
                      value={student.bloodType || ""}
                      onChange={onEditChange}
                      className="w-full border p-4 rounded-2xl bg-gray-50 outline-none text-xs font-black uppercase shadow-inner cursor-pointer appearance-none"
                    >
                      <option value="">Seleccione...</option>
                      {bloodTypes.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">
                      Alergias Conocidas
                    </label>
                    <input
                      name="allergies"
                      value={student.allergies || ""}
                      onChange={onEditChange}
                      className="w-full border p-4 rounded-2xl bg-gray-50 outline-none text-sm font-bold shadow-inner"
                      placeholder="Ej: Penicilina..."
                    />
                  </div>
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">
                      Condición Médica / Especial
                    </label>
                    <input
                      name="medicalCondition"
                      value={student.medicalCondition || ""}
                      onChange={onEditChange}
                      className="w-full border p-4 rounded-2xl bg-gray-50 outline-none text-sm font-bold shadow-inner"
                      placeholder="Sindrome de Down, Autismo, etc."
                    />
                  </div>
                </div>

                {/* TALLAS */}
                <div className="mt-4 p-8 bg-gray-50/20 rounded-[2.5rem] border border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-6 uppercase font-black text-left">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 uppercase ml-1">Peso (kg)</label>
                    <input
                      name="weight"
                      value={student.weight || ""}
                      onChange={onEditChange}
                      className="w-full border p-4 rounded-2xl bg-white text-sm shadow-sm font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 uppercase ml-1">Altura (cm)</label>
                    <input
                      name="height"
                      value={student.height || ""}
                      onChange={onEditChange}
                      className="w-full border p-4 rounded-2xl bg-white text-sm shadow-sm font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 uppercase ml-1">Camisa</label>
                    <input
                      name="shirtSize"
                      value={student.shirtSize || ""}
                      onChange={onEditChange}
                      className="w-full border p-4 rounded-2xl bg-white text-sm shadow-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 uppercase ml-1">Calzado</label>
                    <input
                      name="shoeSize"
                      value={student.shoeSize || ""}
                      onChange={onEditChange}
                      className="w-full border p-4 rounded-2xl bg-white text-sm shadow-sm"
                    />
                  </div>
                </div>
              </section>

              {/* 5. UBICACIÓN ACADÉMICA Y EXPEDIENTE DIGITAL */}
              <section className="space-y-6 text-left">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-lg shadow-sm">
                    <GraduationCap size={18} />
                  </div>
                  <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">
                    5. Ubicación Académica y Expediente Digital
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 text-left uppercase font-black">
                  <div className="bg-green-50/30 p-8 rounded-[2.5rem] border border-green-100 space-y-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-green-700 uppercase ml-1">
                        FECHA INGRESO INSTITUCIÓN
                      </label>
                      <input
                        type="date"
                        name="admissionDate"
                        value={student.admissionDate || ""}
                        onChange={onEditChange}
                        className="w-full border-none p-4 rounded-2xl bg-white shadow-sm font-black text-sm outline-none focus:ring-4 focus:ring-green-500/10 transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-green-700 uppercase ml-1">
                        AÑO ESCOLAR (AUTOMÁTICO)
                      </label>
                      <input
                        name="schoolYear"
                        value={student.schoolYear || ""}
                        readOnly
                        className="w-full border-none p-4 rounded-2xl bg-white shadow-sm font-black text-sm text-gray-500 cursor-not-allowed font-mono tracking-widest"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 uppercase font-black text-left">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-1">
                        NIVEL EDUCATIVO
                      </label>
                      <select
                        name="level"
                        value={student.level}
                        onChange={onEditChange}
                        className="w-full border p-4 rounded-2xl bg-gray-50 outline-none text-xs font-black uppercase cursor-pointer appearance-none shadow-inner"
                      >
                        <option value="Inicial">INICIAL</option>
                        <option value="Primaria">PRIMARIA</option>
                        <option value="Secundaria">SECUNDARIA</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-1">
                        GRADO / AÑO SELECCIONADO
                      </label>
                      <select
                        name="grade"
                        value={student.grade}
                        onChange={onEditChange}
                        className="w-full border p-4 rounded-2xl bg-gray-50 outline-none text-xs font-black uppercase cursor-pointer appearance-none shadow-inner"
                      >
                        {student.level === "Inicial" ? (
                          <>
                            <option value="Maternal">Maternal</option>
                            <option value="1er Grupo">1er Grupo</option>
                            <option value="2do Grupo">2do Grupo</option>
                            <option value="3er Grupo">3er Grupo</option>
                          </>
                        ) : student.level === "Primaria" ? (
                          <>
                            <option value="1ero">1ero</option>
                            <option value="2do">2DO</option>
                            <option value="3ero">3ero</option>
                            <option value="4to">4to</option>
                            <option value="5to">5to</option>
                            <option value="6to">6to</option>
                          </>
                        ) : (
                          <>
                            <option value="1er Año">1er Año</option>
                            <option value="2do Año">2do Año</option>
                            <option value="3er Año">3er Año</option>
                            <option value="4to Año">4to Año</option>
                            <option value="5to Año">5to Año</option>
                          </>
                        )}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-1">
                        SECCIÓN
                      </label>
                      <input
                        name="section"
                        value={student.section || ""}
                        onChange={onEditChange}
                        className="w-full border p-4 rounded-2xl bg-gray-50 outline-none text-sm font-black uppercase text-center shadow-inner"
                      />
                    </div>
                  </div>
                </div>

                {/* EXPEDIENTE DIGITAL */}
                <div className="bg-gray-50/50 p-8 rounded-[2.5rem] border border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                    <div className="flex items-center gap-3">
                      <FileText size={18} className="text-blue-500" />
                      <h4 className="text-xs font-black text-gray-700 uppercase tracking-widest">
                        EXPEDIENTE DIGITAL (ARCHIVOS ASOCIADOS)
                      </h4>
                    </div>

                    {!showAddDocInput ? (
                      <button
                        type="button"
                        onClick={() => setShowAddDocInput(true)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-200 font-black text-[10px] uppercase tracking-wider transition-all shadow-sm w-fit"
                      >
                        <Plus size={14} /> Agregar Documento
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-gray-200 shadow-sm">
                        <input
                          type="text"
                          value={newDocTitle}
                          onChange={(e) => setNewDocTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddCustomDoc();
                            } else if (e.key === "Escape") {
                              setShowAddDocInput(false);
                              setNewDocTitle("");
                            }
                          }}
                          placeholder="Título del documento..."
                          autoFocus
                          className="px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 outline-none focus:border-blue-500 w-52 normal-case"
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomDoc}
                          className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white font-black text-[10px] uppercase tracking-wider hover:bg-blue-700 transition shadow-sm"
                        >
                          Crear
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddDocInput(false);
                            setNewDocTitle("");
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition"
                          title="Cancelar"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {allDocs.map((doc) => {
                      const file = student.inscriptionFiles?.find(
                        (f: any) =>
                          (f.id && f.id.toLowerCase() === doc.id.toLowerCase()) ||
                          (f.name || "").toLowerCase().startsWith(doc.id.toLowerCase()) ||
                          (f.path || "").toLowerCase().includes(doc.id.toLowerCase())
                      );

                      return (
                        <div
                          key={doc.id}
                          className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3 min-w-0 text-left">
                            <div
                              className={`p-2 rounded-xl shrink-0 ${
                                file ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
                              }`}
                            >
                              {file ? <MdCheckCircle size={18} /> : <FileText size={18} />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-black text-gray-700 uppercase truncate tracking-tighter leading-tight">
                                {doc.label}
                              </p>
                              <span
                                className={`text-[8px] font-black uppercase ${
                                  file ? "text-green-500" : "text-red-400 animate-pulse"
                                }`}
                              >
                                {file ? "Cargado" : "Faltante"}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {file && (
                              <button
                                type="button"
                                onClick={() => window.open(file.path)}
                                className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                                title="Ver archivo"
                              >
                                <Eye size={16} />
                              </button>
                            )}

                            <label
                              className={`cursor-pointer p-2 rounded-xl transition-all active:scale-90 ${
                                file
                                  ? "text-gray-400 hover:text-blue-600"
                                  : "bg-blue-600 text-white shadow-lg hover:bg-blue-700"
                              }`}
                            >
                              {file ? <RefreshCw size={16} /> : <Plus size={16} />}
                              <input
                                type="file"
                                className="hidden"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => {
                                  const selectedFile = e.target.files?.[0];
                                  if (selectedFile) {
                                    onFileUpload(selectedFile, doc.id, doc.label);
                                  }
                                }}
                              />
                            </label>

                            {file && (
                              <button
                                type="button"
                                onClick={() => onOpenDeleteFileModal(file.path)}
                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            </form>

            {/* Pie de Modal */}
            <div className="p-8 border-t bg-gray-50 flex flex-col md:flex-row justify-between items-center gap-4 text-left uppercase font-black">
              <div className="flex items-center gap-3 text-yellow-700 bg-yellow-100/50 px-6 py-3 rounded-2xl border border-yellow-200 shadow-sm">
                <AlertTriangle size={24} />
                <span className="text-[10px] font-black uppercase tracking-tight text-left leading-tight italic">
                  Sincronización de Identidad: Al dejar el campo cédula vacío,
                  <br />
                  el sistema generará el ID Escolar oficial (1+AÑO+CI MADRE).
                </span>
              </div>
              <div className="flex gap-4 w-full md:w-auto ml-auto font-black uppercase">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 md:flex-none px-12 py-4 rounded-2xl text-gray-500 hover:bg-gray-200 transition-all border border-gray-200 text-xs tracking-widest active:scale-95 bg-white shadow-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={onSave}
                  className="flex-1 md:flex-none px-16 py-4 bg-green-600 text-white rounded-2xl font-black shadow-2xl shadow-green-100 hover:bg-green-700 flex items-center justify-center gap-3 transition-all active:scale-95 text-xs tracking-widest uppercase"
                >
                  <Save size={24} /> Guardar Expediente
                </button>
              </div>
            </div>
          </DialogPanel>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default StudentEditModal;
