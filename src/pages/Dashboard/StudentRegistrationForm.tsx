import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom"; 
import { 
  ArrowLeft, ArrowRight, CheckCircle, CameraIcon, X, 
  UploadCloud, FileText, GraduationCap, ShieldCheck, AlertTriangle 
} from "lucide-react";
import { Dialog, DialogPanel } from "@headlessui/react";
import { fileToBase64 } from "../../utils/fileHelpers";
import { REQUIRED_DOCUMENTS, BLOOD_TYPES, GRADES_BY_LEVEL, AcademicLevel } from "../../constants/academic";
import { PhotoCropperModal } from "../../components/common/PhotoCropperModal";
import { ToastNotification } from "../../components/common/ToastNotification";
import { StepProgressBar } from "../../components/common/StepProgressBar";
import { ToastNotificationState } from "../../types/student";

interface StudentRegistrationFormProps {
  nivel: "Inicial" | "Primaria" | "Secundaria";
}

const calculateAgeFromDate = (dateStr: string): string => {
  if (!dateStr || dateStr.length < 10) return "0";
  const parts = dateStr.split("-");
  if (parts.length < 3) return "0";
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return "0";
  if (year < 1920 || year > 2100) return "0";

  const today = new Date();
  let age = today.getFullYear() - year;
  const m = today.getMonth() - month;
  if (m < 0 || (m === 0 && today.getDate() < day)) {
    age--;
  }
  return Math.max(0, age).toString();
};

const StudentRegistrationForm: React.FC<StudentRegistrationFormProps> = ({ nivel }) => {

  const navigate = useNavigate();
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [generatedId, setGeneratedId] = useState(""); 
  const [step, setStep] = useState(1);
  
  const academicRef = useRef<HTMLDivElement | null>(null);
  const topRef = useRef<HTMLDivElement | null>(null); 
  
  const [cropModal, setCropModal] = useState<{ open: boolean; type: "student" | "rep" | null; src: string }>({ open: false, type: null, src: "" });
  const [notification, setNotification] = useState<ToastNotificationState>({ show: false, type: "", msg: "" });
  const [confirmAdvanceModal, setConfirmAdvanceModal] = useState<{
    open: boolean;
    message: string;
    action: "next" | "jump" | "submit";
    targetStep?: number;
  }>({ open: false, message: "", action: "next" });

  const initialForm = {
    nivel: nivel,
    ci: "", firstName: "", lastName: "", birthDate: "", age: "0", gender: "Femenino", placeOfBirth: "",
    entity: "", country: "Venezuela", email: "", address: "", municipality: "", parish: "", sector: "", 
    
    // Nombres y Apellidos desglosados para evitar el error 'Property does not exist'
    motherName: "", motherFirstName: "", motherLastName: "", motherCI: "", motherPhone: "0424", 
    fatherName: "", fatherFirstName: "", fatherLastName: "", fatherCI: "", fatherPhone: "0424",
    repName: "", repFirstName: "", repLastName: "", repCI: "", repPhone: "0424", relationship: "",
    
    height: "", weight: "", shirtSize: "", pantsSize: "", shoeSize: "", allergies: "", medicalCondition: "", bloodType: "",
    previousSchool: "U.E. República de Chile", deaCode: "OD01461703", grade: "", section: "", schoolYear: "2025-2026",
    admissionDate: new Date().toISOString().split('T')[0],
    pendingSubjects: '',
    
    // ✅ SECCIÓN DE OBSERVACIONES POR PASO
    obsPersonal: "",    // Observaciones del Estudiante (Paso 1)
    obsFamiliar: "",    // Observaciones del Representante (Paso 2)
    obsSalud: "",       // Observaciones Médicas/Bienestar (Paso 3)
    observations: "",   // Observaciones Académicas (Paso 4)
    
    repeatsYear: "No", lastRepeatedGrade: "", lastRepeatedTerm: "", repeatReason: "", 
    isTransfer: false, lastSchoolName: "", lastGradeCompleted: "", lastTermCompleted: "", transferObservations: "", 
    transferFiles: [] as File[], inscriptionFiles: [] as File[],
    studentPhoto: null as File | null, studentPhotoPreview: "" as string,
    repPhoto: null as File | null, repPhotoPreview: "" as string,
  };

  const [form, setForm] = useState({ ...initialForm });

  useEffect(() => {
    const loadConfigData = async () => {
      try {
        const cfg = await (window as any).electron?.getConfig?.();
        const activePeriod = cfg?.periodo || localStorage.getItem("sistema_periodo_activo");
        if (activePeriod) {
          setForm(prev => ({
            ...prev,
            schoolYear: activePeriod,
            previousSchool: cfg?.nombre_colegio || prev.previousSchool,
            deaCode: cfg?.codigo_dea || cfg?.codigo_plantel || prev.deaCode
          }));
        }
      } catch (e) {
        console.error("Error al cargar config institucional en inscripción:", e);
      }
    };
    loadConfigData();
  }, []);

  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, []);

  useEffect(() => {
    const activePeriod = localStorage.getItem("sistema_periodo_activo");
    if (activePeriod) {
      setForm(prev => ({ ...prev, schoolYear: activePeriod }));
      return;
    }
    if (form.admissionDate) {
        const date = new Date(form.admissionDate);
        let startYear = date.getFullYear();
        if (date.getMonth() < 7) { 
             startYear -= 1;
        }
        const endYear = startYear + 1;
        setForm(prev => ({ ...prev, schoolYear: `${startYear}-${endYear}` }));
    }
  }, [form.admissionDate]);

  const showToast = (type: "success" | "error", msg: string) => {
    setNotification({ show: true, type, msg });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

const validateStep = (currentStep: number) => {
  // --- PASO 1: DATOS DEL ESTUDIANTE ---
  if (currentStep === 1) {
    if (!form.firstName || !form.lastName) return "El nombre y apellido son obligatorios.";
    if (!form.birthDate) return "La fecha de nacimiento es obligatoria.";

    // Validación de fecha no futura
    const parts = form.birthDate.split("-");
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      const bDate = new Date(y, m, d);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (bDate > today) {
        return "La fecha de nacimiento no puede ser una fecha futura.";
      }
    }

    const minRequiredAge = nivel === "Inicial" ? 0 : nivel === "Primaria" ? 5 : 10;
    if (Number(form.age) < minRequiredAge) {
      return `El estudiante no cumple con la edad mínima para ${nivel} (${minRequiredAge} años).`;
    }
    if (!form.address) return "La dirección es obligatoria.";
    
    if (form.ci && (form.ci.length < 7 || form.ci.length > 10)) {
        return "Si ingresa una cédula real, debe tener entre 7 y 10 dígitos.";
    }     
  }

  // --- PASO 2: INFORMACIÓN FAMILIAR (CORREGIDO) ---
  if (currentStep === 2) {
    // Validamos los nuevos campos desglosados y el parentesco
    if (!form.repFirstName || !form.repLastName || !form.repCI || !form.repPhone || !form.relationship) {
        return "Los datos del representante legal son obligatorios.";
    }
  }

  // --- PASO 3: INFORMACIÓN DE SALUD ---
  if (currentStep === 3) {
    if (!form.height || !form.weight) {
      return "Debe ingresar la estatura y el peso del estudiante para el control antropométrico.";
    }
    if (!form.bloodType) {
      return "El grupo sanguíneo es un dato médico obligatorio.";
    }
    if (!form.shirtSize || !form.pantsSize || !form.shoeSize) {
      return "Es obligatorio registrar las tallas de uniforme (Camisa, Pantalón y Calzado).";
    }
  }

  // --- PASO 4: INFORMACIÓN ACADÉMICA ---
  if (currentStep === 4) {
    if (!form.grade || !form.section) return "El grado y la sección son obligatorios.";

    // ✅ VALIDACIÓN DE PLANTEL EXTERNO
    if (form.previousSchool === "Otro") {
      if (!form.lastSchoolName) return "Debe ingresar el nombre de la institución anterior.";
      if (!form.deaCode) return "Debe ingresar el código DEA del plantel de procedencia.";
    }
    
    if (form.repeatsYear === "Sí" && (!form.lastRepeatedGrade || !form.lastRepeatedTerm)) {
      return "Si repite, indique el último grado y lapso cursado.";
    }
    
    if (form.isTransfer && !form.lastSchoolName) return "Si es traslado, indique el colegio anterior.";

    // ✅ Validación corregida: Documentos estrictamente obligatorios (Boletín solo para Primaria y Secundaria)
    const docsObligatorios = [
      { id: "birthCertificate", label: "Partida de Nacimiento" },
      { id: "repCI", label: "Cédula del Representante" },
      { id: "addressProof", label: "Constancia de Domicilio" },
      ...(nivel !== "Inicial" ? [{ id: "reportCard", label: "Boletín Año Anterior" }] : [])
    ];

    const faltante = docsObligatorios.find(doc => 
      !form.inscriptionFiles.some(f => f.name.startsWith(doc.id))
    );

    if (faltante) {
      return `Debe subir el documento obligatorio: ${faltante.label}`;
    }
  }

  return null;
};

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
  const { name, value } = e.target;

  // Manejo directo de Fecha de Nacimiento con cálculo de edad seguro
  if (name === "birthDate") {
    const calculatedAge = calculateAgeFromDate(value);
    setForm((prev) => ({
      ...prev,
      birthDate: value,
      age: calculatedAge,
    }));
    return;
  }

  // ✅ Campos numéricos: Solo permiten dígitos y tienen límites de longitud
  const numericFields = [
    "ci", "age", "motherCI", "motherPhone", "fatherCI", 
    "fatherPhone", "repCI", "repPhone", "height", "weight", 
    "shoeSize", "pantsSize", "shirtSize"
  ];

  // ✅ Campos de texto: NO permiten números ni caracteres especiales (solo letras y espacios)
  const textFields = [
    "firstName", "secondName", "lastName", "secondLastName", 
    "motherFirstName", "motherLastName", // Nuevos campos desglosados
    "fatherFirstName", "fatherLastName", // Nuevos campos desglosados
    "repFirstName", "repLastName",       // Nuevos campos desglosados
    "motherName", "fatherName", "repName", 
    "relationship", "placeOfBirth", "entity", "country", 
    "municipality", "parish", "sector", "allergies"
  ];

  // Lógica de validación para campos numéricos
  if (numericFields.includes(name)) {
    if (value !== "" && !/^\d+$/.test(value)) return; 
    if (name.includes("Phone") && value.length > 11) return; 
    if (name.includes("CI") && value.length > 10) return; 
    if (name === "age" && value.length > 2) return; 
  }

  // Lógica de validación para campos de texto (Bloqueo de números)
  if (textFields.includes(name)) {
    if (value !== "" && !/^[a-zA-Z\sñÑáéíóúÁÉÍÓÚüÜ]*$/.test(value)) return; 
  }

  // Actualización del estado global del formulario con sincronización del tutor legal
  setForm((prev) => {
    const updated = { ...prev, [name]: value };
    if (updated.relationship === "Madre") {
      if (name === "motherFirstName") updated.repFirstName = value;
      if (name === "motherLastName") updated.repLastName = value;
      if (name === "motherCI") updated.repCI = value;
      if (name === "motherPhone") updated.repPhone = value;
    } else if (updated.relationship === "Padre") {
      if (name === "fatherFirstName") updated.repFirstName = value;
      if (name === "fatherLastName") updated.repLastName = value;
      if (name === "fatherCI") updated.repCI = value;
      if (name === "fatherPhone") updated.repPhone = value;
    }
    return updated;
  });
};

  const scrollToTop = () => {
     window.scrollTo({ top: 0, behavior: 'smooth' });
     topRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleNextStep = () => {
    const error = validateStep(step);
    if (error) {
      setConfirmAdvanceModal({
        open: true,
        message: error,
        action: "next",
        targetStep: step + 1
      });
      return;
    }
    setStep((prev) => prev + 1);
    scrollToTop();
  };

  const handlePrevStep = () => {
    setStep((prev) => prev - 1);
    scrollToTop();
  };

  const handleJumpToStep = (targetStep: number) => {
    if (targetStep < step) {
      setStep(targetStep);
      scrollToTop();
    } else if (targetStep > step) {
      const error = validateStep(step);
      if (!error) {
        setStep(targetStep);
        scrollToTop();
      } else {
        setConfirmAdvanceModal({
          open: true,
          message: error,
          action: "jump",
          targetStep
        });
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateStep(4);
    if (error) {
      setConfirmAdvanceModal({
        open: true,
        message: error,
        action: "submit"
      });
      return;
    }
    setPreviewModalOpen(true);
  };

  const handleProceedAnyway = () => {
    const { action, targetStep } = confirmAdvanceModal;
    setConfirmAdvanceModal({ open: false, message: "", action: "next" });
    if (action === "next") {
      setStep((prev) => prev + 1);
      scrollToTop();
    } else if (action === "jump" && targetStep) {
      setStep(targetStep);
      scrollToTop();
    } else if (action === "submit") {
      setPreviewModalOpen(true);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
        let finalCI = form.ci;

        // 1. Lógica de Cédula Escolar con soporte para Morochos/Gemelos
        const baseDoc = form.motherCI || form.repCI || form.fatherCI;
        if (!finalCI && form.birthDate) {
            const yearDigits = form.birthDate.split("-")[0]?.slice(-2) || new Date().getFullYear().toString().slice(-2);
            const baseCI = `1${yearDigits}${baseDoc || Math.floor(1000000 + Math.random() * 9000000)}`;
            
            try {
              // Consultamos a la base de datos cuántos estudiantes existen con este ID base
              const conteoHermanos = await (window as any).electron?.checkDuplicateStudentID?.(baseCI) || 0;
              
              if (conteoHermanos > 0) {
                  finalCI = `${baseCI}-${conteoHermanos + 1}`;
              } else {
                  finalCI = baseCI;
              }
            } catch (err) {
              console.warn("Error consultando hermanos:", err);
              finalCI = baseCI;
            }
        }

        // 2. Conversión de fotos a Base64 para el proceso de Electron
        const studentPhotoB64 = form.studentPhoto ? await fileToBase64(form.studentPhoto) : null;
        const repPhotoB64 = form.repPhoto ? await fileToBase64(form.repPhoto) : null;

        // 3. Conversión de documentos de inscripción a Base64
        const inscriptionFilesB64 = await Promise.all(
            form.inscriptionFiles.map(async (file) => ({
                name: file.name,
                data: await fileToBase64(file)
            }))
        );

        // 4. Conversión de documentos de traslado a Base64
        const transferFilesB64 = await Promise.all(
            form.transferFiles.map(async (file) => ({
                name: file.name,
                data: await fileToBase64(file)
            }))
        );

        // 5. Preparación del objeto final (con la CI definitiva procesada y valores seguros si se omitió algún campo)
        const defaultGrade = (GRADES_BY_LEVEL[nivel as AcademicLevel] || ["1ero"])[0];
        const studentDataToSave = {
            ...form,
            firstName: form.firstName.trim() || "Sin Nombre",
            lastName: form.lastName.trim() || "Sin Apellido",
            grade: form.grade || defaultGrade,
            section: form.section || "A",
            ci: finalCI,
            inscriptionFiles: inscriptionFilesB64,
            transferFiles: transferFilesB64,
            studentPhoto: studentPhotoB64,
            repPhoto: repPhotoB64
        };

        // 6.  Comunicación con Electron: Enviamos datos y esperamos el ID real generado
        const resultado = await (window as any).electron.registerStudent(studentDataToSave);

        if (resultado && resultado.success) {
            // 7.  Sincronización del ID oficial del sistema (EST-2026-XXXX)
            setGeneratedId(resultado.id); 
            
            setPreviewModalOpen(false);
            setSuccessModalOpen(true);
            setForm({ ...initialForm }); // Limpia el formulario para un nuevo registro
            setStep(1); // Regresa al inicio del formulario
            scrollToTop();
        } else {
            showToast("error", "Error al guardar: " + (resultado?.mensaje || "Error desconocido"));
        }

    } catch (error) {
        console.error("Error en handleConfirm:", error);
        showToast("error", "Error crítico en el procesamiento de datos o identidad.");
    } finally {
        setLoading(false);
    }
};

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "student" | "rep") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setCropModal({ open: true, type, src: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCropped = (file: File, preview: string) => {
    if (cropModal.type === "student") {
      setForm((prev) => ({ ...prev, studentPhoto: file, studentPhotoPreview: preview }));
    } else if (cropModal.type === "rep") {
      setForm((prev) => ({ ...prev, repPhoto: file, repPhotoPreview: preview }));
    }
    setCropModal({ open: false, type: null, src: "" });
  };


  const stepsList = useMemo(() => [
    { label: "Datos del Estudiante", active: step === 1 },
    { label: "Información del Representante", active: step === 2 },
    { label: "Información Médica", active: step === 3 },
    { label: "Información Académica", active: step === 4 },
  ], [step]);

  const requiredDocsForLevel = useMemo(() => {
    return REQUIRED_DOCUMENTS.filter((doc) => {
      if (nivel === "Inicial") {
        return doc.id !== "studentCI" && doc.id !== "reportCard" && doc.id !== "conductLetter";
      }
      return true;
    });
  }, [nivel]);


  return (
    <motion.div className="w-full flex flex-col gap-6 relative text-left pb-16" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div ref={topRef} className="absolute top-0 left-0" />

      {/* NAVEGACIÓN SUPERIOR DOBLE */}
      <div className="flex flex-col gap-2 mb-2">
        <div className="flex items-center gap-4">
          {/* Regresar al Dashboard (Home) */}
          <button 
            onClick={() => navigate("/dashboard")} 
            className="flex items-center gap-2 text-gray-400 hover:text-[#5564eb] transition-all duration-300 group"
          >
            <div className="p-2 bg-white rounded-xl shadow-sm group-hover:shadow-md border border-gray-100 transition-all">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest leading-none">
              Volver al Home
            </span>
          </button>

          <div className="h-4 w-px bg-gray-300" />

          {/* Regresar a la selección de nivel (Primaria/Secundaria) */}
          <button 
            onClick={() => navigate("/dashboard/estudiantes")} 
            className="flex items-center gap-2 text-gray-400 hover:text-blue-600 transition-all duration-300 group"
          >
            <div className="p-2 bg-white rounded-xl shadow-sm group-hover:shadow-md border border-gray-100 transition-all">
              <GraduationCap size={16} className="group-hover:scale-110 transition-transform text-blue-500" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest leading-none">
              Cambiar Nivel (Inicial / Primaria / Secundaria)
            </span>
          </button>
        </div>
      </div>
      
      <ToastNotification notification={notification} />

      {/* CONTENEDOR INTEGRAL QUE RELLENA TODO EL ESPACIO */}
      <div className="w-full bg-white rounded-3xl shadow-sm border border-gray-200/80 overflow-hidden flex flex-col">
        {/* BARRA DE PASOS INTEGRADA */}
        <div className="bg-white border-b border-gray-100 px-6 py-5 sticky top-0 z-30">
          <StepProgressBar steps={stepsList} currentStep={step} onStepClick={handleJumpToStep} />
        </div>

        <form onSubmit={handleSubmit} className="w-full p-6 md:p-10 flex flex-col flex-1">
          <h1 className="text-3xl font-extrabold text-[#5564eb] mb-8 text-center border-b pb-4">Inscripción de Educación {nivel}</h1>

          {/* 1. DATOS DEL ESTUDIANTE CON VALIDACIÓN DINÁMICA DE CÉDULA */}
{step === 1 && (
  <motion.div 
    key="s1" 
    initial={{ opacity: 0, x: 20 }} 
    animate={{ opacity: 1, x: 0 }} 
    transition={{ type: "spring", stiffness: 300, damping: 30 }}
  >
    <h2 className="text-xl font-semibold text-green-700 mb-6 flex items-center gap-2">
      <div className="w-2 h-8 bg-green-600 rounded-full"/> Datos del Estudiante
    </h2>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="flex flex-col">
        <label className="text-xs text-gray-500 ml-1 mb-1 font-semibold uppercase tracking-wider">Nombres</label>
        <input 
          name="firstName" 
          placeholder="Nombres" 
          value={form.firstName} 
          onChange={handleChange} 
          className="border border-gray-300 p-3.5 rounded-xl bg-white text-gray-800 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition font-medium shadow-sm" 
        />
      </div>

      <div className="flex flex-col">
        <label className="text-xs text-gray-500 ml-1 mb-1 font-semibold uppercase tracking-wider">Apellidos</label>
        <input 
          name="lastName" 
          placeholder="Apellidos" 
          value={form.lastName} 
          onChange={handleChange} 
          className="border border-gray-300 p-3.5 rounded-xl bg-white text-gray-800 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition font-medium shadow-sm" 
        />
      </div>
      
      <div className="flex flex-col">
        <label className="text-xs text-gray-500 ml-1 mb-1 font-semibold uppercase tracking-wider">Fecha de Nacimiento</label>
        <input 
          type="date" 
          name="birthDate" 
          max={todayStr} 
          value={form.birthDate} 
          onChange={handleChange} 
          className="border border-gray-300 p-3.5 rounded-xl bg-white text-gray-800 focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition font-bold shadow-sm" 
        />
      </div>
      
      <div className="flex flex-col">
        <label className="text-xs text-gray-500 ml-1 mb-1 font-semibold uppercase tracking-wider">Edad Calculada</label>
        <input 
          name="age" 
          value={form.age + " años"} 
          className={`border p-3.5 rounded-xl outline-none transition font-bold shadow-sm ${Number(form.age) < (nivel === "Inicial" ? 0 : nivel === "Primaria" ? 5 : 10) ? 'bg-red-50 text-red-600 border-red-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`} 
          readOnly 
        />
      </div>

      {/* ✅ SECCIÓN DE CÉDULA VALIDADA: Solo aparece si el niño tiene 9 años o más */}
      <div className="md:col-span-2">
        {Number(form.age) >= 9 ? (
          <>
            <label className="text-[10px] text-green-700 font-bold uppercase ml-1 tracking-widest">
              Cédula de Identidad (Dejar vacío para generar ID Escolar)
            </label>
            <input 
              name="ci" 
              placeholder="Cédula (si posee)" 
              value={form.ci} 
              onChange={handleChange} 
              className="w-full border border-green-200 p-3.5 rounded-xl bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition font-bold shadow-sm" 
            />
            {!form.ci && form.motherCI && form.birthDate && (
              <p className="text-[10px] text-orange-600 mt-1 font-bold italic">
                Se generará ID Escolar: 1{form.birthDate.split("-")[0]?.slice(-2) || ""}{form.motherCI}
              </p>
            )}
          </>
        ) : (
          /* Aviso informativo para niños menores de 9 años */
          <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-100 flex items-start gap-3 shadow-sm">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl shrink-0">
              <ShieldCheck size={20}/>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-blue-700 font-black uppercase tracking-widest leading-tight">
                ID ESCOLAR AUTOMÁTICO (MENOR DE 9 AÑOS)
              </p>
              <p className="text-[9px] text-blue-600/80 mt-1 italic font-medium uppercase leading-none">
                El estudiante aún no cumple la edad mínima para cédula obligatoria. El sistema asignará el código institucional automáticamente.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col">
        <label className="text-xs text-gray-500 ml-1 mb-1 font-semibold uppercase tracking-wider">Lugar de Nacimiento</label>
        <input 
          name="placeOfBirth" 
          placeholder="Lugar de Nacimiento" 
          value={form.placeOfBirth} 
          onChange={handleChange} 
          className="border border-gray-300 p-3.5 rounded-xl bg-white text-gray-800 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition font-medium shadow-sm" 
        />
      </div>

      <div className="flex flex-col">
        <label className="text-xs text-gray-500 ml-1 mb-1 font-semibold uppercase tracking-wider">Entidad Federal</label>
        <input 
          name="entity" 
          placeholder="Entidad Federal" 
          value={form.entity} 
          onChange={handleChange} 
          className="border border-gray-300 p-3.5 rounded-xl bg-white text-gray-800 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition font-medium shadow-sm" 
        />
      </div>

      <div className="flex flex-col">
        <label className="text-xs text-gray-500 ml-1 mb-1 font-semibold uppercase tracking-wider">País</label>
        <input 
          name="country" 
          placeholder="País" 
          value={form.country} 
          onChange={handleChange} 
          className="border border-gray-300 p-3.5 rounded-xl bg-white text-gray-800 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition font-medium shadow-sm" 
        />
      </div>
      
      <div className="flex flex-col">
        <label className="text-xs text-gray-500 ml-1 mb-1 font-semibold uppercase tracking-wider">Género</label>
        <select 
          name="gender" 
          value={form.gender} 
          onChange={handleChange} 
          className="border border-gray-300 p-3.5 rounded-xl bg-white text-gray-800 focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition font-bold shadow-sm cursor-pointer"
        >
          <option value="Femenino">Femenino</option>
          <option value="Masculino">Masculino</option>
        </select>
      </div>
      
      <div className="flex flex-col md:col-span-2">
        <label className="text-xs text-gray-500 ml-1 mb-1 font-semibold uppercase tracking-wider">Dirección Exacta de Habitación</label>
        <textarea 
          name="address" 
          placeholder="Dirección Exacta de Habitación" 
          value={form.address} 
          onChange={handleChange} 
          className="border border-gray-300 p-3.5 rounded-xl bg-white text-gray-800 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition font-medium shadow-sm" 
          rows={2} 
        />
      </div>
    </div>

    <div className="mt-8 flex flex-col items-center p-6 border-2 border-dashed border-gray-300 rounded-2xl bg-slate-50/60 hover:bg-white transition-all shadow-sm">
      <p className="text-gray-700 font-semibold mb-3">Fotografía del Estudiante</p>
      <div className="relative w-32 h-40 rounded-lg border-4 border-white shadow-lg overflow-hidden bg-gray-200">
        {form.studentPhotoPreview ? (
          <img src={form.studentPhotoPreview} className="w-full h-full object-cover" alt="Estudiante" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
            <CameraIcon size={32} />
          </div>
        )}
      </div>
      <div className="flex gap-3 mt-4">
        <label className="cursor-pointer bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-700 transition flex items-center gap-2 shadow-md">
          <CameraIcon size={16} />
          {form.studentPhotoPreview ? "Cambiar Foto" : "Subir Foto"}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, "student")} />
        </label>
        {form.studentPhotoPreview && (
          <button type="button" onClick={() => setForm((prev) => ({ ...prev, studentPhoto: null, studentPhotoPreview: "" }))} className="bg-red-100 text-red-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-200 transition">
            Eliminar
          </button>
        )}
      </div>
    </div>
    
    <div className="md:col-span-2 mt-6 text-left">
      <label className="text-[10px] text-green-700 font-bold uppercase ml-1 tracking-widest flex items-center gap-2">
        <ShieldCheck size={14}/> Observaciones Particulares del Estudiante
      </label>
      <textarea 
        name="obsPersonal" 
        value={form.obsPersonal} 
        onChange={handleChange} 
        placeholder="Ej: Es zurdo, destaca en dibujo, requiere refuerzo en motricidad..." 
        className="w-full border border-gray-300 p-3.5 rounded-xl bg-white text-gray-800 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition text-sm shadow-sm" 
        rows={2} 
      />
    </div>

    <div className="flex justify-end mt-8">
      <button onClick={handleNextStep} type="button" className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-green-700 hover:shadow-green-200 transition flex items-center gap-2 uppercase tracking-widest text-xs">
        Siguiente <ArrowRight size={20} />
      </button>
    </div>
  </motion.div>
)}

        {/* ... (Resto de los pasos se mantienen) */}
        
{step === 2 && (
  <motion.div 
    key="s2" 
    initial={{ opacity: 0, x: 20 }} 
    animate={{ opacity: 1, x: 0 }} 
    transition={{ type: "spring", stiffness: 300, damping: 30 }}
  >
    <h2 className="text-xl font-semibold text-green-700 mb-6 flex items-center gap-2 text-left">
      <div className="w-2 h-8 bg-green-600 rounded-full"/> Información Familiar
    </h2>

    <div className="space-y-6 text-left">
      {/* SECCIÓN MADRE */}
      <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 shadow-sm relative">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Datos de la Madre</h3>
            <p className="text-[9px] text-orange-600 font-bold italic uppercase">* Requerido para ID Escolar</p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-gray-200 hover:border-green-500 transition shadow-sm">
            <input 
              type="checkbox" 
              className="w-4 h-4 accent-green-600"
              checked={form.relationship === "Madre"}
              onChange={(e) => {
                if(e.target.checked) {
                  setForm(prev => ({
                    ...prev, 
                    relationship: "Madre",
                    repFirstName: prev.motherFirstName,
                    repLastName: prev.motherLastName,
                    repCI: prev.motherCI,
                    repPhone: prev.motherPhone
                  }));
                } else {
                  setForm(prev => ({...prev, relationship: ""}));
                }
              }}
            />
            <span className="text-[10px] font-black text-gray-600 uppercase tracking-tighter">Tutor Legal</span>
          </label>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <input name="motherFirstName" placeholder="Nombres" value={form.motherFirstName || ""} onChange={handleChange} className="border p-3 rounded-xl bg-white focus:ring-2 focus:ring-green-500 outline-none" />
          <input name="motherLastName" placeholder="Apellidos" value={form.motherLastName || ""} onChange={handleChange} className="border p-3 rounded-xl bg-white focus:ring-2 focus:ring-green-500 outline-none" />
          <input name="motherCI" placeholder="Cédula" value={form.motherCI} onChange={handleChange} className="border p-3 rounded-xl bg-white focus:ring-2 focus:ring-green-500 outline-none font-bold" />
          <div className="flex gap-2">
            <select 
              value={form.motherPhone.substring(0,4) || "0424"} 
              onChange={(e) => setForm(prev => ({ ...prev, motherPhone: e.target.value + (prev.motherPhone.substring(4) || "") }))}
              className="border p-3 rounded-xl bg-white text-xs font-bold w-1/3 appearance-none cursor-pointer"
            >
              {["0424", "0412", "0426", "0416", "0422", "0414"].map(pref => <option key={pref} value={pref}>{pref}</option>)}
            </select>
            <input 
              placeholder="7 números" 
              value={form.motherPhone.substring(4) || ""} 
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 7);
                setForm(prev => ({ ...prev, motherPhone: (prev.motherPhone.substring(0,4) || "0424") + val }));
              }}
              className="border p-3 rounded-xl bg-white text-sm w-2/3" 
            />
          </div>
        </div>
      </div>

      {/* SECCIÓN PADRE */}
      <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 shadow-sm relative">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Datos del Padre</h3>
          <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-gray-200 hover:border-green-500 transition shadow-sm">
            <input 
              type="checkbox" 
              className="w-4 h-4 accent-green-600"
              checked={form.relationship === "Padre"}
              onChange={(e) => {
                if(e.target.checked) {
                  setForm(prev => ({
                    ...prev, 
                    relationship: "Padre",
                    repFirstName: prev.fatherFirstName,
                    repLastName: prev.fatherLastName,
                    repCI: prev.fatherCI,
                    repPhone: prev.fatherPhone
                  }));
                } else {
                  setForm(prev => ({...prev, relationship: ""}));
                }
              }}
            />
            <span className="text-[10px] font-black text-gray-600 uppercase tracking-tighter">Tutor Legal</span>
          </label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <input name="fatherFirstName" placeholder="Nombres" value={form.fatherFirstName || ""} onChange={handleChange} className="border p-3 rounded-xl bg-white focus:ring-2 focus:ring-green-500 outline-none" />
          <input name="fatherLastName" placeholder="Apellidos" value={form.fatherLastName || ""} onChange={handleChange} className="border p-3 rounded-xl bg-white focus:ring-2 focus:ring-green-500 outline-none" />
          <input name="fatherCI" placeholder="Cédula" value={form.fatherCI} onChange={handleChange} className="border p-3 rounded-xl bg-white focus:ring-2 focus:ring-green-500 outline-none" />
          <div className="flex gap-2">
            <select 
              value={form.fatherPhone.substring(0,4) || "0424"} 
              onChange={(e) => setForm(prev => ({ ...prev, fatherPhone: e.target.value + (prev.fatherPhone.substring(4) || "") }))}
              className="border p-3 rounded-xl bg-white text-xs font-bold w-1/3 appearance-none cursor-pointer"
            >
              {["0424", "0412", "0426", "0416", "0422", "0414"].map(pref => <option key={pref} value={pref}>{pref}</option>)}
            </select>
            <input 
              placeholder="7 números" 
              value={form.fatherPhone.substring(4) || ""} 
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 7);
                setForm(prev => ({ ...prev, fatherPhone: (prev.fatherPhone.substring(0,4) || "0424") + val }));
              }}
              className="border p-3 rounded-xl bg-white text-sm w-2/3" 
            />
          </div>
        </div>
      </div>

      {/* REPRESENTANTE LEGAL - TERCERO */}
      <AnimatePresence mode="wait">
        {form.relationship !== "Madre" && form.relationship !== "Padre" && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: "auto", opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }}
            className="bg-green-50 p-5 rounded-2xl border border-green-100 shadow-md overflow-hidden"
          >
            <h3 className="text-sm font-bold text-green-700 uppercase tracking-wider mb-3">Datos del Representante Legal (Tercero)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <input name="repFirstName" placeholder="Nombres" value={form.repFirstName || ""} onChange={handleChange} className="border border-green-200 p-3 rounded-xl bg-white focus:ring-2 focus:ring-green-500 outline-none transition" />
              <input name="repLastName" placeholder="Apellidos" value={form.repLastName || ""} onChange={handleChange} className="border border-green-200 p-3 rounded-xl bg-white focus:ring-2 focus:ring-green-500 outline-none transition" />
              <input name="repCI" placeholder="Cédula" value={form.repCI} onChange={handleChange} className="border border-green-200 p-3 rounded-xl bg-white focus:ring-2 focus:ring-green-500 outline-none transition" />
              <div className="flex gap-2">
                <select 
                  value={form.repPhone.substring(0,4) || "0424"} 
                  onChange={(e) => setForm(prev => ({ ...prev, repPhone: e.target.value + (prev.repPhone.substring(4) || "") }))}
                  className="border border-green-200 p-3 rounded-xl bg-white focus:ring-2 focus:ring-green-500 outline-none text-xs font-bold w-1/3 appearance-none cursor-pointer"
                >
                  {["0424", "0412", "0426", "0416", "0422", "0414"].map(pref => <option key={pref} value={pref}>{pref}</option>)}
                </select>
                <input 
                  placeholder="7 números" 
                  value={form.repPhone.substring(4) || ""} 
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 7);
                    setForm(prev => ({ ...prev, repPhone: (prev.repPhone.substring(0,4) || "0424") + val }));
                  }}
                  className="border border-green-200 p-3 rounded-xl bg-white focus:ring-2 focus:ring-green-500 outline-none text-sm w-2/3" 
                />
              </div>
              
              <div className="lg:col-span-4 mt-2">
                <label className="text-[10px] text-green-700 font-black uppercase ml-1 tracking-widest mb-1 block">Relación con el Estudiante</label>
                <select 
                  name="relationship" 
                  value={form.relationship} 
                  onChange={handleChange} 
                  className="w-full border border-green-200 p-3 rounded-xl bg-white focus:ring-2 focus:ring-green-500 outline-none text-sm italic"
                >
                  <option value="">Seleccione parentesco...</option>
                  <option value="Abuelo">Abuelo</option>
                  <option value="Abuela">Abuela</option>
                  <option value="Tío">Tío</option>
                  <option value="Tía">Tía</option>
                  <option value="Hermano">Hermano</option>
                  <option value="Hermana">Hermana</option>
                  <option value="Padrastro">Padrastro</option>
                  <option value="Madrastra">Madrastra</option>
                  <option value="Otro">Otro (Especificar)</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>

    {/* FOTO REPRESENTANTE */}
    <div className="mt-6 flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200 shadow-sm text-left">
      <div className="relative w-16 h-20 rounded bg-gray-300 overflow-hidden flex-shrink-0 border border-gray-200">
        {form.repPhotoPreview ? (
          <img src={form.repPhotoPreview} className="w-full h-full object-cover" alt="Representante" />
        ) : (
          <div className="flex items-center justify-center h-full text-white">
            <CameraIcon size={24} />
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-bold text-gray-700">Fotografía del Representante</p>
        <label className="text-xs text-green-600 font-black cursor-pointer hover:text-green-700 uppercase tracking-tighter transition">
          {form.repPhotoPreview ? "Cambiar Imagen" : "Subir Imagen"}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, "rep")} />
        </label>
      </div>
    </div>

    {/* Al final del bloque step === 2 */}
    <div className="mt-6 text-left">
      <label className="text-[10px] text-green-700 font-bold uppercase ml-1 tracking-widest flex items-center gap-2">
        <ShieldCheck size={14}/> Observaciones del Entorno Familiar
      </label>
      <textarea 
        name="obsFamiliar" 
        value={form.obsFamiliar} 
        onChange={handleChange} 
        placeholder="Ej: Vive con los abuelos, el representante trabaja fuera de la ciudad..." 
        className="w-full border border-gray-300 p-3.5 rounded-xl bg-white focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition text-sm shadow-sm" 
        rows={2} 
      />
    </div>

    {/* NAVEGACIÓN */}
    <div className="flex justify-between mt-8 pt-4 border-t border-gray-100">
      <button 
        onClick={handlePrevStep} 
        type="button" 
        className="bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-300 transition flex items-center gap-2 shadow-sm active:scale-95 text-xs uppercase tracking-widest"
      >
        <ArrowLeft size={20} /> Atrás
      </button>
      <button 
        onClick={handleNextStep} 
        type="button" 
        className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-green-700 transition flex items-center gap-2 active:scale-95 text-xs uppercase tracking-widest"
      >
        Siguiente <ArrowRight size={20} />
      </button>
    </div>
  </motion.div>
)}

        {step === 3 && (
  <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{type: "spring", stiffness: 300, damping: 30}}>
    <h2 className="text-xl font-semibold text-green-700 mb-6 flex items-center gap-2">
      <div className="w-2 h-8 bg-green-600 rounded-full"/> Información de Salud
    </h2>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-gray-50 p-4 rounded-xl shadow-sm border border-gray-100">
            <label className="text-xs text-gray-500 font-bold uppercase mb-2 block text-left">Antropometría</label>
            <div className="flex gap-2 mt-2">
                <input 
                  name="height" 
                  placeholder="Estatura (cm)" 
                  value={form.height} 
                  onChange={handleChange} 
                  className={`w-full border p-3 rounded-xl bg-white focus:ring-2 focus:ring-green-500 outline-none transition ${!form.height && notification.show ? 'border-red-500 ring-1 ring-red-200' : 'border-gray-200'}`} 
                />
                <input 
                  name="weight" 
                  placeholder="Peso (kg)" 
                  value={form.weight} 
                  onChange={handleChange} 
                  className={`w-full border p-3 rounded-xl bg-white focus:ring-2 focus:ring-green-500 outline-none transition ${!form.weight && notification.show ? 'border-red-500 ring-1 ring-red-200' : 'border-gray-200'}`} 
                />
            </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-xl md:col-span-2">
          <label className="text-xs text-gray-500 font-bold uppercase mb-1 block text-left">Datos Clínicos</label>
          <div className="grid grid-cols-2 gap-2">
              <select 
                name="bloodType" 
                value={form.bloodType} 
                onChange={handleChange} 
                className={`border p-2.5 rounded-lg bg-white w-full font-bold outline-none focus:ring-2 focus:ring-green-500 transition ${!form.bloodType && notification.show ? 'border-red-500 ring-1 ring-red-200' : 'border-gray-200'}`}
              >
                  <option value="">Grupo Sanguíneo...</option>
                  {BLOOD_TYPES.map(tipo => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
              </select>

              <input 
                name="allergies" 
                placeholder="Alergias" 
                value={form.allergies} 
                onChange={handleChange} 
                className="border p-2.5 rounded-lg bg-white outline-none focus:ring-2 focus:ring-green-500 border-gray-200" 
              />
          </div>
      </div>
        <textarea 
          name="medicalCondition" 
          placeholder="Condiciones Médicas Específicas (Opcional)" 
          value={form.medicalCondition} 
          onChange={handleChange} 
          className="border border-gray-300 p-3 rounded-xl bg-white md:col-span-3 outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 shadow-sm" 
          rows={2}
        />
    </div>

    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mt-6 mb-3 text-left">Tallas de Uniforme</h3>
    <div className="grid grid-cols-3 gap-4">
        <input 
          name="shirtSize" 
          placeholder="Camisa" 
          value={form.shirtSize} 
          onChange={handleChange} 
          className={`border p-3 rounded-xl text-center outline-none bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition shadow-sm ${!form.shirtSize && notification.show ? 'border-red-500 ring-1 ring-red-200' : 'border-gray-300'}`} 
        />
        <input 
          name="pantsSize" 
          placeholder="Pantalón" 
          value={form.pantsSize} 
          onChange={handleChange} 
          className={`border p-3 rounded-xl text-center outline-none bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition shadow-sm ${!form.pantsSize && notification.show ? 'border-red-500 ring-1 ring-red-200' : 'border-gray-300'}`} 
        />
        <input 
          name="shoeSize" 
          placeholder="Zapatos" 
          value={form.shoeSize} 
          onChange={handleChange} 
          className={`border p-3 rounded-xl text-center outline-none bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition shadow-sm ${!form.shoeSize && notification.show ? 'border-red-500 ring-1 ring-red-200' : 'border-gray-300'}`} 
        />
    </div>

    {/* Al final del bloque step === 3 */}
<div className="md:col-span-3 mt-6 text-left">
  <label className="text-[10px] text-green-700 font-bold uppercase ml-1 tracking-widest flex items-center gap-2">
    <ShieldCheck size={14}/> Otras Notas de Bienestar y Salud
  </label>
  <textarea 
    name="obsSalud" 
    value={form.obsSalud} 
    onChange={handleChange} 
    placeholder="Ej: Usa lentes para leer, alergia leve al polvo, tendencia a la hiperactividad..." 
    className="w-full border border-gray-300 p-3.5 rounded-xl bg-white focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition text-sm shadow-sm" 
    rows={2} 
  />
</div>

    <div className="flex justify-between mt-8">
      <button 
        onClick={handlePrevStep} 
        type="button" 
        className="bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-300 transition flex items-center gap-2 active:scale-95"
      >
        <ArrowLeft size={20} /> Atrás
      </button>
      <button 
        onClick={handleNextStep} 
        type="button" 
        className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-green-700 transition flex items-center gap-2 active:scale-95 shadow-green-100"
      >
        Siguiente <ArrowRight size={20} />
      </button>
    </div>
  </motion.div>
)}


{step === 4 && (
  <motion.div 
    key="s4" 
    initial={{ opacity: 0, x: 20 }} 
    animate={{ opacity: 1, x: 0 }} 
    transition={{ type: "spring", stiffness: 300, damping: 30 }}
  >
    <div ref={academicRef}>
      <h2 className="text-xl font-semibold text-green-700 mb-6 flex items-center gap-2 text-left">
        <div className="w-2 h-8 bg-green-600 rounded-full"/> Antecedente Académico
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6 text-left">
        {/* Plantel de Procedencia */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500 font-bold uppercase ml-1 tracking-widest">
            Plantel de Procedencia
          </label>
          <select
            name="previousSchool"
            value={form.previousSchool}
            onChange={(e) => {
              const val = e.target.value;
              setForm(prev => ({
                ...prev,
                previousSchool: val,
                deaCode: val === "U.E. República de Chile" ? "OD01461703" : ""
              }));
            }}
            className="border border-gray-300 p-3.5 rounded-xl bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none font-bold transition-all shadow-sm"
          >
            <option value="U.E. República de Chile">U.E. República de Chile (Continuidad)</option>
            <option value="Otro">Otro Plantel (Ingreso Externo)</option>
          </select>
        </div>

        {/* Código DEA */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-gray-500 font-bold uppercase ml-1 tracking-widest">
            Código DEA del Plantel de Procedencia
          </label>
          <input 
            name="deaCode" 
            placeholder="Ingrese Código DEA" 
            value={form.deaCode} 
            onChange={handleChange} 
            className={`border p-3.5 rounded-xl font-bold transition-all outline-none shadow-sm ${
              form.previousSchool === "U.E. República de Chile" 
              ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200" 
              : "bg-white border-green-200 focus:ring-2 focus:ring-green-500"
            }`} 
            readOnly={form.previousSchool === "U.E. República de Chile"} 
          />
        </div>

        {form.previousSchool === "Otro" && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="md:col-span-2 flex flex-col gap-1.5">
            <label className="text-xs text-green-700 font-bold uppercase ml-1 tracking-widest">
              Nombre de la Institución Anterior
            </label>
            <input 
              name="lastSchoolName" 
              placeholder="Ej: Escuela Básica Nacional..." 
              value={form.lastSchoolName} 
              onChange={handleChange} 
              className="w-full border border-green-200 p-3.5 rounded-xl bg-white focus:ring-2 focus:ring-green-500 outline-none font-medium shadow-sm" 
            />
          </motion.div>
        )}
      </div>

      <div className="bg-green-50 p-6 rounded-[2rem] border border-green-100 mb-8 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-left">
          {/* ✅ CÁLCULO DE PERIODO ESCOLAR AUTOMÁTICO */}
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-xs text-green-700 font-bold uppercase ml-1 tracking-widest">Fecha de Inscripción</label>
            <input 
              type="date" 
              name="admissionDate" 
              value={form.admissionDate} 
              onChange={handleChange} 
              className="w-full border p-3 rounded-2xl bg-white focus:ring-2 focus:ring-green-500 outline-none font-bold shadow-sm" 
            />
          </div>
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-xs text-green-700 font-bold uppercase ml-1 tracking-widest">Periodo Escolar Asignado</label>
            <input 
              name="schoolYear" 
              value={form.schoolYear} 
              readOnly 
              className="w-full border p-3 rounded-2xl bg-gray-100 text-green-700 outline-none font-black shadow-inner cursor-not-allowed" 
            />
          </div>

          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-xs text-green-700 font-bold uppercase ml-1 tracking-widest">Grado a Inscribir</label>
            <select name="grade" value={form.grade} onChange={handleChange} className="w-full border p-3 rounded-2xl bg-white focus:ring-2 focus:ring-green-500 outline-none font-bold shadow-sm">
              <option value="">Seleccione...</option>
              {(GRADES_BY_LEVEL[nivel as AcademicLevel] || []).map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-xs text-green-700 font-bold uppercase ml-1 tracking-widest">Sección</label>
            <select name="section" value={form.section} onChange={handleChange} className="w-full border p-3 rounded-2xl bg-white focus:ring-2 focus:ring-green-500 outline-none font-bold shadow-sm">
              <option value="">Seleccione...</option>
              {["A", "B", "C", "D", "U"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {nivel === "Secundaria" && (
        <div className="mb-8 text-left bg-white border border-gray-100 p-5 rounded-3xl shadow-sm">
          <label className="text-xs text-gray-500 font-bold uppercase ml-1 flex items-center gap-2 mb-2">
            <FileText size={14} className="text-blue-500"/> Materias Pendientes (Si aplica)
          </label>
          <textarea 
            name="pendingSubjects" 
            placeholder="Indique si arrastra materias de años anteriores..." 
            value={form.pendingSubjects} 
            onChange={handleChange} 
            className="w-full border border-gray-300 p-4 rounded-2xl bg-white focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition min-h-[80px] shadow-sm" 
            rows={2}
          />
        </div>
      )}

      {/* REPITENCIA Y TRASLADO */}
      <div className="space-y-4 mb-8">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 shadow-sm">
          <span className="font-bold text-gray-700">¿Es repitiente?</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={form.repeatsYear === "Sí"} onChange={(e) => setForm(prev => ({...prev, repeatsYear: e.target.checked ? "Sí" : "No"}))} />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-green-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
          </label>
        </div>

        <AnimatePresence>
          {form.repeatsYear === "Sí" && (
            <motion.div initial={{height: 0, opacity: 0}} animate={{height: 'auto', opacity: 1}} exit={{height: 0, opacity: 0}} className="overflow-hidden text-left">
              <div className="bg-red-50 border border-red-100 p-5 rounded-xl shadow-inner">
                <h3 className="text-red-700 font-bold mb-3 uppercase text-xs tracking-widest">Detalles de Repitencia</h3>
                <div className="grid grid-cols-2 gap-4">
                  <input name="lastRepeatedGrade" placeholder="Último Grado" value={form.lastRepeatedGrade} onChange={handleChange} className="border p-2.5 rounded-xl bg-white w-full" />
                  <input name="lastRepeatedTerm" placeholder="Último Lapso" value={form.lastRepeatedTerm} onChange={handleChange} className="border p-2.5 rounded-xl bg-white w-full" />
                  <textarea name="repeatReason" placeholder="Motivo de repitencia" value={form.repeatReason} onChange={handleChange} className="col-span-2 border p-2.5 rounded-xl bg-white" rows={2}/>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 shadow-sm">
          <span className="font-bold text-gray-700">¿Es un estudiante transferido?</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={form.isTransfer} onChange={(e) => setForm(prev => ({...prev, isTransfer: e.target.checked}))} />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-green-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
          </label>
        </div>

        <AnimatePresence>
          {form.isTransfer && (
            <motion.div initial={{height: 0, opacity: 0}} animate={{height: 'auto', opacity: 1}} exit={{height: 0, opacity: 0}} className="overflow-hidden text-left">
              <div className="bg-orange-50 border border-orange-100 p-5 rounded-xl shadow-inner">
                <h3 className="text-orange-700 font-bold mb-3 uppercase text-xs tracking-widest">Expediente de Traslado</h3>
                <div className="grid grid-cols-2 gap-4">
                  <input name="lastSchoolName" placeholder="Colegio Anterior" value={form.lastSchoolName} onChange={handleChange} className="border p-2.5 rounded-xl bg-white w-full" />
                  <div className="flex gap-2">
                    <input name="lastGradeCompleted" placeholder="Grado" value={form.lastGradeCompleted} onChange={handleChange} className="border p-2.5 rounded-xl bg-white w-full" />
                    <input name="lastTermCompleted" placeholder="Lapso" value={form.lastTermCompleted} onChange={handleChange} className="border p-2.5 rounded-xl bg-white w-full" />
                  </div>
                  <textarea name="transferObservations" placeholder="Observaciones" value={form.transferObservations} onChange={handleChange} className="col-span-2 border p-2.5 rounded-xl bg-white" rows={2}/>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ✅ EXPEDIENTE DIGITAL CON ANIMACIÓN DE CARGA, HOVER Y ACCIONES */}
      <div className="mt-8 pt-6 border-t border-gray-100 text-left">
        <h3 className="text-sm font-bold text-green-700 uppercase mb-4 tracking-widest flex items-center gap-2">
          <FileText size={18}/> Expediente Digital Obligatorio
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requiredDocsForLevel.map((doc) => {
            const file = form.inscriptionFiles.find(f => f.name.startsWith(doc.id));
            const isUploaded = !!file;

            const handleView = () => {
              if (file) {
                const url = URL.createObjectURL(file);
                window.open(url, '_blank');
              }
            };

            const handleRemove = () => {
              setForm(prev => ({
                ...prev,
                inscriptionFiles: prev.inscriptionFiles.filter(f => !f.name.startsWith(doc.id))
              }));
            };

            return (
              <motion.div 
                key={doc.id}
                layout
                whileHover={{ 
                  y: -5, 
                  scale: 1.01,
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)" 
                }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between group ${
                  isUploaded 
                    ? 'border-green-500 bg-green-50/50 hover:bg-green-50' 
                    : 'border-dashed border-gray-300 bg-gray-50/30 hover:border-green-300 hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <AnimatePresence mode="wait">
                    <motion.div 
                      key={isUploaded ? "check" : "upload"}
                      initial={{ scale: 0.5, opacity: 0, rotate: -45 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 15 }}
                      className={`p-2.5 rounded-xl shrink-0 shadow-sm ${
                        isUploaded ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400 group-hover:bg-green-100 group-hover:text-green-600'
                      }`}
                    >
                      {isUploaded ? <CheckCircle size={18}/> : <UploadCloud size={18}/>}
                    </motion.div>
                  </AnimatePresence>

                  <div className="min-w-0">
                    <p className={`text-[9px] font-black uppercase mb-0.5 tracking-tighter ${isUploaded ? 'text-green-600/70' : 'text-gray-400'}`}>
                      {doc.category}
                    </p>
                    <p className="text-xs font-bold text-gray-700 truncate group-hover:text-green-900 transition-colors">
                      {doc.label}
                    </p>
                    
                    <AnimatePresence>
                      {!isUploaded && (
                        <motion.p 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="text-[9px] text-red-500 font-bold italic mt-0.5 animate-pulse"
                        >
                          PENDIENTE
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {isUploaded && (
                    <div className="flex gap-1.5 mr-1 duration-300">
                      <button 
                        type="button"
                        onClick={handleView}
                        className="p-2 rounded-lg bg-white border border-green-200 text-green-600 hover:bg-green-600 hover:text-white transition-all shadow-sm"
                        title="Ver archivo"
                      >
                        <FileText size={14}/>
                      </button>
                      <button 
                        type="button"
                        onClick={handleRemove}
                        className="p-2 rounded-lg bg-white border border-red-200 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                        title="Eliminar"
                      >
                        <X size={14}/>
                      </button>
                    </div>
                  )}

                  <div className="relative">
                    <input 
                      type="file" 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      onChange={(e) => {
                        const selectedFile = e.target.files?.[0];
                        if(selectedFile) {
                          const renamedFile = new File([selectedFile], `${doc.id}_${selectedFile.name}`, { type: selectedFile.type });
                          setForm(prev => ({
                            ...prev, 
                            inscriptionFiles: [...prev.inscriptionFiles.filter(f => !f.name.startsWith(doc.id)), renamedFile]
                          }));
                        }
                      }}
                    />
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button" 
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-sm transition-all ${
                        isUploaded 
                          ? 'bg-green-100 text-green-700 border border-green-200 hover:bg-green-200' 
                          : 'bg-green-600 text-white border border-green-600 hover:bg-green-700'
                      }`}
                    >
                      {isUploaded ? 'Cambiar' : 'Subir'}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Al final del bloque step === 4 */}
    <div className="mt-6 text-left">
      <label className="text-[10px] text-green-700 font-bold uppercase ml-1 tracking-widest flex items-center gap-2">
        <ShieldCheck size={14}/> Observaciones Académicas Finales
      </label>
      <textarea 
        name="observations" 
        value={form.observations} 
        onChange={handleChange} 
        placeholder="Ej: Proviene de un sistema educativo diferente, requiere adaptación, destaca en matemáticas..." 
        className="w-full border border-gray-300 p-3.5 rounded-xl bg-white focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition text-sm shadow-sm" 
        rows={2} 
      />
    </div>

      {/* BOTONES DE ACCIÓN */}
      <div className="flex justify-between mt-10 pt-6 border-t border-gray-100">
        <button onClick={handlePrevStep} type="button" className="bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-300 transition flex items-center gap-2 shadow-sm text-xs uppercase tracking-widest">
          <ArrowLeft size={20} /> Atrás
        </button>
        <button onClick={handleSubmit} className="px-8 py-3 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 transition flex items-center gap-2 shadow-lg shadow-green-100 text-xs uppercase tracking-widest" disabled={loading}>
          {loading ? <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"/> : <><CheckCircle size={20}/> Finalizar Inscripción</>}
        </button>
      </div>
    </div>
  </motion.div>
)}

        </form>
      </div>

{/* ----------------------- MODALES ----------------------- */}
{cropModal.open && cropModal.src && cropModal.type && (
<PhotoCropperModal open={cropModal.open} imageSrc={cropModal.src} onSave={handleSaveCropped} onClose={() => setCropModal({ open: false, type: null, src: "" })} />
)}

{/* ----------------------- MODAL PREVIEW Y CONFIRMACIÓN COMPLETO ----------------------- */}
{previewModalOpen && (
  <Dialog open={true} onClose={() => setPreviewModalOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
    <DialogPanel className="bg-white rounded-[2.5rem] w-full max-w-4xl p-8 max-h-[92vh] overflow-y-auto shadow-2xl border-t-[12px] border-green-600 text-left relative animate-in fade-in zoom-in duration-300">
      
      {/* Encabezado Principal */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
          <FileText className="text-green-600 w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-gray-800 tracking-tighter uppercase leading-none">Validación de Expediente</h2>
        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Revise la información técnica antes de procesar el registro</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* SECCIÓN 1: DATOS DEL ESTUDIANTE */}
        <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 shadow-sm col-span-2">
          <h3 className="text-[10px] font-black text-green-700 uppercase tracking-widest mb-4 flex items-center gap-2">
            <div className="w-1.5 h-4 bg-green-500 rounded-full"/> Identificación del Estudiante
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[13px]">
            <div className="col-span-2 md:col-span-1">
              <p className="text-gray-400 font-black text-[9px] uppercase mb-1">Nombres</p>
              <p className="font-black text-gray-700 uppercase">{form.firstName}</p>
            </div>
            <div className="col-span-2 md:col-span-1">
              <p className="text-gray-400 font-black text-[9px] uppercase mb-1">Apellidos</p>
              <p className="font-black text-gray-700 uppercase">{form.lastName}</p>
            </div>
            <div>
              <p className="text-gray-400 font-black text-[9px] uppercase mb-1">Cédula / ID</p>
              <p className="font-black text-gray-700 uppercase">{form.ci || "ID ESCOLAR"}</p>
            </div>
            <div>
              <p className="text-gray-400 font-black text-[9px] uppercase mb-1">Género</p>
              <p className="font-black text-gray-700 uppercase">{form.gender}</p>
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: INFORMACIÓN MÉDICA */}
        <div className="bg-red-50/50 p-6 rounded-[2rem] border border-red-100 shadow-sm">
          <h3 className="text-[10px] font-black text-red-700 uppercase tracking-widest mb-4 flex items-center gap-2">
            <div className="w-1.5 h-4 bg-red-500 rounded-full"/> Ficha Médica y Tallas
          </h3>
          <div className="space-y-3 text-[12px]">
            <div className="flex justify-between border-b border-red-100 pb-1 italic">
              <span className="text-red-400 font-black uppercase text-[9px]">Talla / Peso:</span>
              <span className="font-black text-gray-700">{form.height}cm / {form.weight}kg</span>
            </div>
            <div className="flex justify-between border-b border-red-100 pb-1 italic">
              <span className="text-red-400 font-black uppercase text-[9px]">Tipo de Sangre:</span>
              <span className="font-black text-gray-700">{form.bloodType}</span>
            </div>
            <div className="flex justify-between border-b border-red-100 pb-1 italic">
              <span className="text-red-400 font-black uppercase text-[9px]">Talla Camisa:</span>
              <span className="font-black text-gray-700 uppercase">{form.shirtSize}</span>
            </div>
            <div className="flex justify-between italic">
              <span className="text-red-400 font-black uppercase text-[9px]">Calzado:</span>
              <span className="font-black text-gray-700 uppercase">{form.shoeSize}</span>
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: DATOS ACADÉMICOS */}
        <div className="bg-green-50/50 p-6 rounded-[2rem] border border-green-100 shadow-sm">
          <h3 className="text-[10px] font-black text-green-700 uppercase tracking-widest mb-4 flex items-center gap-2">
            <div className="w-1.5 h-4 bg-green-500 rounded-full"/> Antecedente Académico
          </h3>
          <div className="space-y-3 text-[12px]">
            <div className="flex flex-col border-b border-green-100 pb-1">
              <span className="text-green-400 font-black uppercase text-[9px]">Plantel de Origen:</span>
              <span className="font-black text-gray-700 uppercase truncate">
                {form.previousSchool === "Otro" ? form.lastSchoolName : form.previousSchool}
              </span>
            </div>
            {/* ✅ Código DEA y Periodo Escolar Añadidos */}
            <div className="flex justify-between border-b border-green-100 pb-1 italic">
              <span className="text-green-400 font-black uppercase text-[9px]">Código DEA:</span>
              <span className="font-black text-gray-700 uppercase">{form.deaCode || "N/A"}</span>
            </div>
            <div className="flex justify-between border-b border-green-100 pb-1">
              <span className="text-green-400 font-black uppercase text-[9px]">Periodo Escolar:</span>
              <span className="font-black text-green-700 uppercase">{form.schoolYear}</span>
            </div>
            <div className="flex justify-between border-b border-green-100 pb-1">
              <span className="text-green-400 font-black uppercase text-[9px]">Grado y Sección:</span>
              <span className="font-black text-gray-700 uppercase">{form.grade} "{form.section}"</span>
            </div>
            {form.pendingSubjects && (
              <div className="flex flex-col border-b border-green-100 pb-1">
                <span className="text-orange-400 font-black uppercase text-[9px]">Materias Pendientes:</span>
                <span className="font-black text-gray-700 uppercase">{form.pendingSubjects}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-green-400 font-black uppercase text-[9px]">Repitiente:</span>
              <span className={`font-black uppercase ${form.repeatsYear === "Sí" ? "text-red-600" : "text-green-600"}`}>
                {form.repeatsYear}
              </span>
            </div>
          </div>
        </div>

        {/* ✅ SECCIÓN 4: EXPEDIENTE DE TRASLADO */}
        <AnimatePresence>
          {form.isTransfer && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              className="bg-orange-50/50 p-6 rounded-[2rem] border border-orange-100 shadow-sm col-span-2 overflow-hidden"
            >
              <h3 className="text-[10px] font-black text-orange-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-orange-500 rounded-full"/> Detalles de Transferencia Externa
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[12px]">
                <div className="flex flex-col">
                  <span className="text-orange-400 font-black uppercase text-[9px] mb-1">Colegio Anterior</span>
                  <span className="font-black text-gray-700 uppercase truncate">{form.lastSchoolName}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-orange-400 font-black uppercase text-[9px] mb-1">Último Grado / Lapso</span>
                  <span className="font-black text-gray-700 uppercase">{form.lastGradeCompleted} - {form.lastTermCompleted}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-orange-400 font-black uppercase text-[9px] mb-1">Observaciones de Traslado</span>
                  <span className="font-black text-gray-700 uppercase italic truncate">{form.transferObservations || "SIN NOTAS"}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SECCIÓN 5: ESTRUCTURA FAMILIAR */}
        <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 shadow-sm col-span-2">
          <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-2">
            <div className="w-1.5 h-4 bg-gray-400 rounded-full"/> Núcleo de Representación
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2 relative pl-5 border-l-2 border-green-200">
              <span className="absolute -left-1.5 top-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
              <p className="text-green-600 font-black text-[9px] uppercase tracking-tighter">Madre</p>
              <div className="space-y-0.5 font-black text-gray-700 text-[13px] uppercase">
                <p>Nombres: {form.motherFirstName}</p>
                <p>Apellidos: {form.motherLastName}</p>
                <p className="text-[10px] text-gray-400 font-bold">CI: {form.motherCI} | Telf: {form.motherPhone}</p>
              </div>
            </div>
            <div className="space-y-2 relative pl-5 border-l-2 border-green-200">
              <span className="absolute -left-1.5 top-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
              <p className="text-green-600 font-black text-[9px] uppercase tracking-tighter">Padre</p>
              <div className="space-y-0.5 font-black text-gray-700 text-[13px] uppercase">
                <p>Nombres: {form.fatherFirstName}</p>
                <p>Apellidos: {form.fatherLastName}</p>
                <p className="text-[10px] text-gray-400 font-bold">CI: {form.fatherCI} | Telf: {form.fatherPhone}</p>
              </div>
            </div>
            <div className="md:col-span-2 bg-green-600 p-5 rounded-3xl text-white shadow-xl shadow-green-100 flex justify-between items-center group overflow-hidden relative">
              <div className="absolute right-0 top-0 opacity-10 translate-x-4 -translate-y-4">
                <ShieldCheck size={120} />
              </div>
              <div className="z-10">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80 mb-1 italic">Tutor Legal Designado ({form.relationship})</p>
                <p className="font-black text-[15px] uppercase tracking-tight">{form.repFirstName} {form.repLastName}</p>
              </div>
              <div className="text-right z-10 font-black">
                <p className="text-[10px]">CI: {form.repCI}</p>
                <p className="text-[10px]">TELF: {form.repPhone}</p>
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN 6: ESTATUS DE DOCUMENTACIÓN DIGITAL */}
        <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 shadow-sm col-span-2">
          <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <div className="w-1.5 h-4 bg-gray-400 rounded-full"/> Estatus de Expediente Digital
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {requiredDocsForLevel.map((doc) => {
              const file = form.inscriptionFiles.find(f => f.name.startsWith(doc.id));
              const isUploaded = !!file;
              return (
                <div key={doc.id} className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${isUploaded ? 'bg-white border-green-100' : 'bg-red-50/30 border-red-100 border-dashed'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg ${isUploaded ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {isUploaded ? <CheckCircle size={14}/> : <X size={14}/>}
                    </div>
                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-tighter">{doc.label}</span>
                  </div>
                  <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${isUploaded ? 'bg-green-600 text-white' : 'bg-red-500 text-white animate-pulse'}`}>
                    {isUploaded ? 'Cargado' : 'Faltante'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECCIÓN 7: OBSERVACIONES */}
        <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 col-span-2">
          <h3 className="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-4">Notas Técnicas del Expediente</h3>
          <div className="space-y-3 text-[11px] italic text-blue-800 font-bold uppercase">
            {form.obsPersonal && <p><span className="text-blue-400 text-[9px] mr-2">Estudiante:</span> {form.obsPersonal}</p>}
            {form.obsFamiliar && <p><span className="text-blue-400 text-[9px] mr-2">Familiar:</span> {form.obsFamiliar}</p>}
            {form.obsSalud && <p><span className="text-blue-400 text-[9px] mr-2">Médica:</span> {form.obsSalud}</p>}
            {form.observations && <p><span className="text-blue-400 text-[9px] mr-2">Académica:</span> {form.observations}</p>}
            {!form.obsPersonal && !form.obsFamiliar && !form.obsSalud && !form.observations && (
              <p className="text-blue-300 font-black">Sin observaciones adicionales registradas.</p>
            )}
          </div>
        </div>
      </div>

      {/* BOTONES DE ACCIÓN */}
      <div className="flex flex-col md:flex-row justify-end gap-3 mt-10 pt-6 border-t border-gray-100">
        <button 
          onClick={() => setPreviewModalOpen(false)} 
          className="px-8 py-4 rounded-2xl bg-gray-100 font-black text-gray-500 hover:bg-gray-200 transition-all text-[10px] uppercase tracking-[0.2em] hover:scale-105 active:scale-95"
        >
          Corregir Datos
        </button>
        <button 
          onClick={handleConfirm} 
          className="px-10 py-4 rounded-2xl bg-green-600 text-white font-black hover:bg-green-700 shadow-xl shadow-green-200 transition-all flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.2em] hover:scale-105 active:scale-95" 
          disabled={loading}
        >
          {loading ? (
            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"/>
          ) : (
            <>Finalizar e Inscribir <CheckCircle size={18}/></>
          )}
        </button>
      </div>
    </DialogPanel>
  </Dialog>
)}
      {/* ----------------------- MODAL CONFIRMAR AVANCE SIN VALIDACIÓN ----------------------- */}
      <AnimatePresence>
        {confirmAdvanceModal.open && (
          <Dialog
            open={true}
            onClose={() => setConfirmAdvanceModal(prev => ({ ...prev, open: false }))}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              className="bg-white rounded-3xl p-8 text-center shadow-2xl max-w-md w-full mx-4 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-amber-500" />
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-extrabold text-gray-800 mb-2">
                ¿Está seguro de que desea avanzar?
              </h3>
              <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-xs font-bold mb-3">
                {confirmAdvanceModal.message}
              </p>
              <p className="text-gray-500 text-xs mb-6 leading-relaxed">
                Faltan datos recomendados en esta sección. ¿Desea continuar al siguiente paso de todas formas?
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmAdvanceModal(prev => ({ ...prev, open: false }))}
                  className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs uppercase tracking-wider hover:bg-gray-200 transition"
                >
                  Revisar Datos
                </button>
                <button
                  type="button"
                  onClick={handleProceedAnyway}
                  className="flex-1 py-3 rounded-xl bg-[#5564eb] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#4352d4] transition shadow-lg shadow-blue-200 flex items-center justify-center gap-1.5"
                >
                  Sí, Avanzar <ArrowRight size={15} />
                </button>
              </div>
            </motion.div>
          </Dialog>
        )}
      </AnimatePresence>

      {/* ----------------------- MODAL ÉXITO ----------------------- */}
      <AnimatePresence>
        {successModalOpen && (
          <Dialog open={true} onClose={() => setSuccessModalOpen(false)} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="bg-white rounded-3xl p-8 text-center shadow-2xl max-w-sm w-full mx-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-green-500"/>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="text-green-600 w-10 h-10" />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-800 mb-2">¡Inscripción Exitosa!</h2>
              <p className="text-gray-500 text-sm mb-6">El estudiante ha sido registrado correctamente en la base de datos.</p>
              
              <div className="bg-gray-100 py-3 px-4 rounded-xl mb-6 border border-gray-200">
                <span className="text-xs text-gray-500 uppercase font-bold block mb-1">ID DE REGISTRO</span>
                <span className="text-xl font-mono font-bold text-green-700 tracking-wider">{generatedId}</span>
              </div>

              <button onClick={() => setSuccessModalOpen(false)} className="w-full py-3 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 transition shadow-lg hover:shadow-green-200">
                Aceptar y Finalizar
              </button>
            </motion.div>
          </Dialog>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default StudentRegistrationForm;