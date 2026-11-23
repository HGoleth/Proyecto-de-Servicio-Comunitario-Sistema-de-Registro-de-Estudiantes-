import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Plus, RefreshCw, Download, ArrowLeft } from "lucide-react";
import { Student } from "../../types/student";
import ToastNotification from "../../components/common/ToastNotification";
import StudentFilterBar from "../../components/students/StudentFilterBar";
import StudentTable from "../../components/students/StudentTable";
import QuickRegisterModal from "../../components/students/QuickRegisterModal";
import StudentViewModal from "../../components/students/StudentViewModal";
import StudentEditModal from "../../components/students/StudentEditModal";
import ConfirmDeleteModal from "../../components/students/ConfirmDeleteModal";
import { BLOOD_TYPES } from "../../constants/academic";

const DOCS_OBLIGATORIOS = [
  { id: "birthCertificate", label: "Partida de Nacimiento" },
  { id: "studentCI", label: "Cédula del Estudiante" },
  { id: "medicalCertificate", label: "Certificado Médico" },
  { id: "vaccinationCard", label: "Carnet de Vacunación" },
  { id: "repCI", label: "Cédula del Representante" },
  { id: "addressProof", label: "Constancia de Domicilio" },
  { id: "reportCard", label: "Boletín Año Anterior" },
  { id: "conductLetter", label: "Constancia de Conducta" },
];

const DOCS_OBLIGATORIOS_IDS = DOCS_OBLIGATORIOS.map((d) => d.id);

export const StudentAdministration: React.FC = () => {
  const navigate = useNavigate();

  // Filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [auditFilter, setAuditFilter] = useState<"all" | "complete" | "incomplete">("all");

  // Estado de estudiantes
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Modales
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);

  // Notificación Toast
  const [notification, setNotification] = useState<{
    show: boolean;
    type: "success" | "error" | "info" | "";
    msg: string;
  }>({ show: false, type: "", msg: "" });

  const showToast = (type: "success" | "error", msg: string) => {
    setNotification({ show: true, type, msg });
    setTimeout(() => setNotification((prev) => ({ ...prev, show: false })), 4000);
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await (window as any).electron.getStudents();
      if (data) {
        const formattedData = data.map((student: any) => ({
          ...student,
          level: student.nivel || student.level || "Sin Asignar",
          status: student.status || "Inscrito",
        }));
        setStudents(formattedData);
      }
    } catch {
      showToast("error", "Error al cargar la base de datos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    const pendingID = localStorage.getItem("filterStudentID");
    if (pendingID) {
      setSearchTerm(pendingID);
      localStorage.removeItem("filterStudentID");
    }
    const pendingRepCI = localStorage.getItem("filterRepIdentidad");
    if (pendingRepCI) {
      setSearchTerm(pendingRepCI);
      localStorage.removeItem("filterRepIdentidad");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // CÁLCULO DE EDAD AL EDITAR
  useEffect(() => {
    if (selectedStudent?.birthDate) {
      const birthDate = new Date(selectedStudent.birthDate);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
      const finalAge = Math.max(0, age).toString();
      if (selectedStudent.age !== finalAge) {
        setSelectedStudent((prev) => (prev ? { ...prev, age: finalAge } : null));
      }
    }
  }, [selectedStudent?.birthDate, selectedStudent?.age]);

  // CÁLCULO DE AÑO ESCOLAR AL EDITAR
  useEffect(() => {
    if (selectedStudent?.admissionDate) {
      const date = new Date(selectedStudent.admissionDate);
      let startYear = date.getFullYear();
      if (date.getMonth() < 7) startYear -= 1;
      const schoolYear = `${startYear}-${startYear + 1}`;
      if (selectedStudent.schoolYear !== schoolYear) {
        setSelectedStudent((prev) => (prev ? { ...prev, schoolYear } : null));
      }
    }
  }, [selectedStudent?.admissionDate, selectedStudent?.schoolYear]);

  // Carga de archivo individual en edición
  const handleFileUploadAdmin = async (file: File, docId: string, docLabel: string) => {
    if (!file || !selectedStudent) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const fileName = `${docId}_${file.name}`;
      const res = await (window as any).electron.uploadStudentDoc({
        studentId: selectedStudent.id,
        fileData: { name: fileName, data: reader.result },
      });

      if (res.success) {
        showToast("success", `${docLabel} actualizado.`);
        const nuevoDoc = { name: fileName, path: res.path };
        setSelectedStudent((prev: any) => ({
          ...prev,
          inscriptionFiles: [
            ...(prev.inscriptionFiles || []).filter(
              (f: any) =>
                !f.name.toLowerCase().startsWith(docId.toLowerCase()) &&
                !f.path.toLowerCase().includes(docId.toLowerCase())
            ),
            nuevoDoc,
          ],
        }));
        fetchStudents();
      } else {
        showToast("error", "No se pudo guardar el archivo físico.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmDeleteFile = async () => {
    if (!selectedStudent || !fileToDelete) return;
    const res = await (window as any).electron.deleteStudentDoc({
      studentId: selectedStudent.id,
      filePath: fileToDelete,
    });

    if (res.success) {
      showToast("success", "Archivo removido físicamente del servidor.");
      setSelectedStudent((prev: any) => ({
        ...prev,
        inscriptionFiles: prev.inscriptionFiles.filter((d: any) => d.path !== fileToDelete),
      }));
      setFileToDelete(null);
      fetchStudents();
    } else {
      showToast("error", "Error al eliminar el archivo.");
    }
  };

  const handleQuickSave = async (quickData: {
    firstName: string;
    lastName: string;
    ci: string;
    level: string;
    grade: string;
  }) => {
    const studentData = {
      ...quickData,
      ci: quickData.ci.trim() === "" ? "" : quickData.ci,
      nivel: quickData.level,
      grade: quickData.grade,
      section: "N/A",
      status: "Pendiente",
    };

    const res = await (window as any).electron.registerStudent(studentData);
    if (res.success) {
      setIsQuickAddOpen(false);
      fetchStudents();
      showToast("success", "Pre-inscripción creada exitosamente.");
    }
  };

  const filteredStudents = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    const filterStatusLower = filterStatus.toLowerCase();

    return students.filter((student) => {
      const studentStatus = (student.status || (student as any).estatus || "").toString().toLowerCase();
      const studentLevel = student.level || (student as any).nivel;
      const studentYear = student.schoolYear || (student as any).periodo;

      const matchesSearch =
        !searchLower ||
        student.firstName?.toLowerCase().includes(searchLower) ||
        student.lastName?.toLowerCase().includes(searchLower) ||
        student.ci?.toLowerCase().includes(searchLower) ||
        student.id?.toLowerCase().includes(searchLower) ||
        student.repCI?.toLowerCase().includes(searchLower);

      const matchesLevel = filterLevel ? studentLevel === filterLevel : true;
      const matchesGrade = filterGrade ? student.grade === filterGrade : true;
      const matchesSection = filterSection ? student.section === filterSection : true;
      const matchesStatus = filterStatus ? studentStatus === filterStatusLower : true;
      const matchesYear = filterYear ? studentYear === filterYear : true;

      const hasMissingDocs = DOCS_OBLIGATORIOS_IDS.some(
        (docId) => !student.inscriptionFiles?.some((f) => f.path.toLowerCase().includes(docId.toLowerCase()))
      );

      const matchesAudit =
        auditFilter === "all" ? true : auditFilter === "complete" ? !hasMissingDocs : hasMissingDocs;

      return (
        matchesSearch &&
        matchesLevel &&
        matchesGrade &&
        matchesSection &&
        matchesStatus &&
        matchesYear &&
        matchesAudit
      );
    });
  }, [students, searchTerm, filterLevel, filterGrade, filterSection, filterStatus, filterYear, auditFilter]);

  const handleDelete = async () => {
    if (!studentToDelete) return;
    const res = await (window as any).electron.deleteStudent(studentToDelete);
    if (res.success) {
      setStudents((prev) => prev.filter((s) => s.id !== studentToDelete));
      showToast("success", "Estudiante eliminado.");
      setIsDeleteOpen(false);
      setStudentToDelete(null);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    try {
      setLoading(true);
      let ciFinal = selectedStudent.ci;
      if (!ciFinal && selectedStudent.motherCI && selectedStudent.birthDate) {
        ciFinal = `1${selectedStudent.birthDate.slice(2, 4)}${selectedStudent.motherCI}`;
      }

      const studentToSave = {
        ...selectedStudent,
        ci: ciFinal,
        inscriptionFiles: selectedStudent.inscriptionFiles || [],
        nivel: selectedStudent.level,
      };

      const res = await (window as any).electron.updateStudent(studentToSave);

      if (res.success) {
        const ciRep = selectedStudent.repCI || selectedStudent.repCedula;
        if (ciRep) {
          const hermanos = students.filter(
            (s) => (s.repCI === ciRep || s.repCedula === ciRep) && s.id !== selectedStudent.id
          );
          for (const hermano of hermanos) {
            await (window as any).electron.updateStudent({
              ...hermano,
              repPhoto: selectedStudent.repPhoto,
            });
          }
        }

        setIsEditOpen(false);
        await fetchStudents();
        showToast("success", "Expediente institucional sincronizado y guardado.");
      } else {
        showToast("error", "Error al persistir los cambios en la base de datos.");
      }
    } catch (error) {
      console.error("Error en handleSaveEdit:", error);
      showToast("error", "Error crítico al sincronizar datos.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const numericFields = [
      "ci",
      "motherCI",
      "motherPhone",
      "fatherCI",
      "fatherPhone",
      "repCI",
      "repPhone",
      "weight",
      "height",
    ];
    if (numericFields.includes(name)) {
      if (value !== "" && !/^\d+$/.test(value)) return;
      if (name.includes("Phone") && value.length > 11) return;
      if (name.includes("CI") && value.length > 10) return;
    }

    const textFields = ["firstName", "lastName", "motherName", "fatherName", "repName"];
    if (textFields.includes(name)) {
      if (value !== "" && !/^[a-zA-Z\sñÑáéíóúÁÉÍÓÚüÜ]*$/.test(value)) return;
    }

    if (selectedStudent) {
      setSelectedStudent({ ...selectedStudent, [name]: value });
    }
  };

  const handleStudentPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedStudent) {
      const reader = new FileReader();
      reader.onloadend = () =>
        setSelectedStudent({ ...selectedStudent, studentPhoto: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleRepPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedStudent) {
      const reader = new FileReader();
      reader.onloadend = () =>
        setSelectedStudent({ ...selectedStudent, repPhoto: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleExport = () => {
    if (filteredStudents.length === 0) return showToast("error", "Sin datos para exportar");
    const headers = ["ID,Cédula,Nombre,Apellido,Nivel,Grado,Sección,Estatus"];
    const rows = filteredStudents.map(
      (s) =>
        `${s.id},${s.ci},${s.firstName},${s.lastName},${s.level},${s.grade},${s.section},${s.status}`
    );
    const csvContent = "data:text/csv;charset=utf-8," + headers.concat(rows).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "lista_estudiantes.csv");
    link.click();
  };

  return (
    <motion.div
      className="w-full p-6 md:p-10 bg-gray-50 min-h-screen relative text-left"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <ToastNotification
        show={notification.show}
        type={notification.type}
        msg={notification.msg}
      />

      {/* CABECERA CON NAVEGACIÓN */}
      <div className="mb-10 text-left">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-gray-400 hover:text-[#5564eb] transition-colors mb-3 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest leading-none">
            Volver al Home
          </span>
        </button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-5xl font-black text-[#5564eb] tracking-tighter uppercase mb-1">
              Matrícula Estudiantil
            </h1>
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] italic mb-3">
              Registra, consulta y administra los expedientes de los estudiantes
            </p>
            <div className="flex items-center gap-4">
              <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest leading-none">
                {loading
                  ? "Sincronizando base de datos..."
                  : `Total: ${filteredStudents.length} registros encontrados`}
              </p>
              <div className="h-px w-24 bg-gradient-to-r from-gray-200 to-transparent" />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setIsQuickAddOpen(true)}
              className="flex items-center gap-2 bg-[#5564eb] text-white px-5 py-3 rounded-2xl shadow-xl hover:bg-[#4353d8] transition-all active:scale-95 font-black uppercase text-[10px] tracking-widest shadow-blue-200"
            >
              <Plus size={18} /> Registro Rápido
            </button>

            <button
              onClick={fetchStudents}
              className="flex items-center gap-2 bg-white border border-gray-100 text-gray-600 px-4 py-3 rounded-xl shadow-sm hover:bg-gray-100 transition-all active:scale-90"
              title="Refrescar lista"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>

            <button
              onClick={handleExport}
              className="flex items-center gap-2 bg-white border border-gray-100 text-gray-600 px-4 py-3 rounded-xl shadow-sm hover:bg-blue-50 hover:text-[#5564eb] transition-all active:scale-90"
              title="Exportar CSV"
            >
              <Download size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* FILTROS Y BÚSQUEDA */}
      <StudentFilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterLevel={filterLevel}
        setFilterLevel={setFilterLevel}
        filterGrade={filterGrade}
        setFilterGrade={setFilterGrade}
        filterSection={filterSection}
        setFilterSection={setFilterSection}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterYear={filterYear}
        setFilterYear={setFilterYear}
        auditFilter={auditFilter}
        setAuditFilter={setAuditFilter}
      />

      {/* TABLA PRINCIPAL DE ESTUDIANTES */}
      <StudentTable
        students={filteredStudents}
        loading={loading}
        onView={(s) => {
          setSelectedStudent(s);
          setIsViewOpen(true);
        }}
        onEdit={(s) => {
          setSelectedStudent(s);
          setIsEditOpen(true);
        }}
        onDelete={(id) => {
          setStudentToDelete(id);
          setIsDeleteOpen(true);
        }}
        docsObligatoriosIds={DOCS_OBLIGATORIOS_IDS}
      />

      {/* MODAL FICHA RÁPIDA */}
      <QuickRegisterModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onSave={handleQuickSave}
      />

      {/* MODAL VER FICHA */}
      <StudentViewModal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        student={selectedStudent}
        docsObligatorios={DOCS_OBLIGATORIOS}
      />

      {/* MODAL EDITAR EXPEDIENTE */}
      <StudentEditModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        student={selectedStudent}
        setStudent={setSelectedStudent}
        onSave={handleSaveEdit}
        onEditChange={handleEditChange}
        onStudentPhotoChange={handleStudentPhotoChange}
        onRepPhotoChange={handleRepPhotoChange}
        onFileUpload={handleFileUploadAdmin}
        onOpenDeleteFileModal={(path) => setFileToDelete(path)}
        bloodTypes={[...BLOOD_TYPES]}
        docsObligatorios={DOCS_OBLIGATORIOS}
      />

      {/* MODAL CONFIRMAR ELIMINAR ESTUDIANTE */}
      <ConfirmDeleteModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setStudentToDelete(null);
        }}
        onConfirm={handleDelete}
        title="¿Eliminar Registro?"
        message={
          <>
            Esta acción eliminará permanentemente al estudiante{" "}
            <span className="text-red-600 font-bold">ID: {studentToDelete}</span> de la matrícula escolar.
          </>
        }
      />

      {/* MODAL CONFIRMAR ELIMINAR ARCHIVO */}
      <ConfirmDeleteModal
        isOpen={!!fileToDelete}
        onClose={() => setFileToDelete(null)}
        onConfirm={handleConfirmDeleteFile}
        title="¿Eliminar Documento?"
        message={
          <>
            Esta acción borrará el archivo{" "}
            <span className="text-red-600 font-bold italic">físicamente</span> de la base de datos institucional. No se puede deshacer.
          </>
        }
        confirmText="Confirmar Eliminación"
        cancelText="Mantener Archivo"
        accentColor="orange"
      />
    </motion.div>
  );
};

export default StudentAdministration;
