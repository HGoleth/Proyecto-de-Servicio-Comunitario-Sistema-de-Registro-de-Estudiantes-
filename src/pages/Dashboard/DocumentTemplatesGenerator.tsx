import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, FileText, Printer, Download, Plus, Minus,
  Trash2, Edit3, CheckCircle, 
  Search, Eye, Sparkles, X, User, Users, 
  AlertCircle, Save, FileSignature,
  RotateCcw, UploadCloud, Sliders, Move,
  Loader2, Maximize2, Minimize2, ChevronDown, ChevronUp
} from "lucide-react";
import { Student } from "../../types/student";
import { DocumentTemplate, DocumentLogoMode, PaperSize, LogoPosition, SignatureBlock, SignaturePosition } from "../../types/templates";
import { 
  DYNAMIC_VARIABLES, 
  renderTemplateText, 
  exportToDocx,
  parseSignatures,
  serializeSignatures
} from "../../utils/templateEngine";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { 
  ACADEMIC_LEVELS, 
  GRADES_BY_LEVEL, 
  SECTIONS, 
  AcademicLevel 
} from "../../constants/academic";
import ToastNotification from "../../components/common/ToastNotification";
import { ToastNotificationState } from "../../types/student";

export const DocumentTemplatesGenerator: React.FC = () => {
  const navigate = useNavigate();
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Pestaña principal: "emitir" o "plantillas"
  const [activeTab, setActiveTab] = useState<"emitir" | "plantillas">("emitir");

  // Modo de emisión: "individual" o "masivo"
  const [emissionMode, setEmissionMode] = useState<"individual" | "masivo">("individual");

  // Datos
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Filtros masivos
  const [filterNivel, setFilterNivel] = useState<AcademicLevel>("Secundaria");
  const [filterGrado, setFilterGrado] = useState<string>("1er Año");
  const [filterSeccion, setFilterSeccion] = useState<string>("A");
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Búsqueda de alumnos en modo individual
  const [studentSearch, setStudentSearch] = useState<string>("");

  // Edición manual de última hora en el documento previsualizado
  const [isEditingLastMinute, setIsEditingLastMinute] = useState<boolean>(false);
  const [lastMinuteDoc, setLastMinuteDoc] = useState<{
    encabezado: string;
    titulo: string;
    cuerpo: string;
    piePagina: string;
  }>({
    encabezado: "",
    titulo: "",
    cuerpo: "",
    piePagina: ""
  });

  // Tamaño de Papel / Hoja (Carta, Oficio, A4)
  const [paperSize, setPaperSize] = useState<PaperSize>(() => {
    return (localStorage.getItem("sistema_doc_papersize") as PaperSize) || "Carta";
  });

  // Logos para el membrete
  const [logoMode, setLogoMode] = useState<DocumentLogoMode>(() => {
    return (localStorage.getItem("sistema_doc_logomode") as DocumentLogoMode) || "both";
  });
  const [instLogo, setInstLogo] = useState<string>(() => {
    return localStorage.getItem("sistema_logo_institucion") || "./logo.png";
  });
  const [mppeLogo, setMppeLogo] = useState<string>(() => {
    return localStorage.getItem("sistema_logo_mppe") || "./mppe_logo.png";
  });

  // Configuración granular de posición y tamaño de logos
  const [instPosition, setInstPosition] = useState<LogoPosition>(() => {
    return (localStorage.getItem("sistema_logo_inst_pos") as LogoPosition) || "right";
  });
  const [instSize, setInstSize] = useState<number>(() => {
    const saved = localStorage.getItem("sistema_logo_inst_size");
    return saved ? parseInt(saved, 10) : 80;
  });
  const [instHeight, setInstHeight] = useState<number | "auto">(() => {
    const saved = localStorage.getItem("sistema_logo_inst_height");
    if (!saved || saved === "auto") return "auto";
    const num = parseInt(saved, 10);
    return isNaN(num) ? "auto" : num;
  });

  const [mppePosition, setMppePosition] = useState<LogoPosition>(() => {
    return (localStorage.getItem("sistema_logo_mppe_pos") as LogoPosition) || "left";
  });
  const [mppeSize, setMppeSize] = useState<number>(() => {
    const saved = localStorage.getItem("sistema_logo_mppe_size");
    return saved ? parseInt(saved, 10) : 80;
  });
  const [mppeHeight, setMppeHeight] = useState<number | "auto">(() => {
    const saved = localStorage.getItem("sistema_logo_mppe_height");
    if (!saved || saved === "auto") return "auto";
    const num = parseInt(saved, 10);
    return isNaN(num) ? "auto" : num;
  });

  // Offsets de posición libre (mover libremente con el puntero en "Editar Documento de Última Hora")
  const [mppeOffset, setMppeOffset] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem("sistema_logo_mppe_offset");
      return saved ? JSON.parse(saved) : { x: 0, y: 0 };
    } catch {
      return { x: 0, y: 0 };
    }
  });

  const [instOffset, setInstOffset] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem("sistema_logo_inst_offset");
      return saved ? JSON.parse(saved) : { x: 0, y: 0 };
    } catch {
      return { x: 0, y: 0 };
    }
  });

  const [logoModalOpen, setLogoModalOpen] = useState<boolean>(false);
  const [printPreviewModalOpen, setPrintPreviewModalOpen] = useState<boolean>(false);

  const fileInputInstRef = useRef<HTMLInputElement>(null);
  const fileInputMppeRef = useRef<HTMLInputElement>(null);

  const handleSetPaperSize = (size: PaperSize) => {
    setPaperSize(size);
    localStorage.setItem("sistema_doc_papersize", size);
    showToast("info", `Tamaño de hoja configurado a ${size}.`);
  };

  const handleUpdateMppeOffset = (updater: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => {
    setMppeOffset(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      localStorage.setItem("sistema_logo_mppe_offset", JSON.stringify(next));
      return next;
    });
  };

  const handleUpdateInstOffset = (updater: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => {
    setInstOffset(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      localStorage.setItem("sistema_logo_inst_offset", JSON.stringify(next));
      return next;
    });
  };

  const handleSetLogoMode = (mode: DocumentLogoMode) => {
    setLogoMode(mode);
    localStorage.setItem("sistema_doc_logomode", mode);
    if (mode === "both") {
      setMppePosition("left");
      setInstPosition("right");
      localStorage.setItem("sistema_logo_mppe_pos", "left");
      localStorage.setItem("sistema_logo_inst_pos", "right");
    } else if (mode === "institucion") {
      setInstPosition("right");
      setMppePosition("none");
      localStorage.setItem("sistema_logo_inst_pos", "right");
      localStorage.setItem("sistema_logo_mppe_pos", "none");
    } else if (mode === "mppe") {
      setMppePosition("left");
      setInstPosition("none");
      localStorage.setItem("sistema_logo_mppe_pos", "left");
      localStorage.setItem("sistema_logo_inst_pos", "none");
    } else if (mode === "none") {
      setMppePosition("none");
      setInstPosition("none");
      localStorage.setItem("sistema_logo_mppe_pos", "none");
      localStorage.setItem("sistema_logo_inst_pos", "none");
    }
  };

  const handleSetInstPosition = (pos: LogoPosition) => {
    setInstPosition(pos);
    localStorage.setItem("sistema_logo_inst_pos", pos);
  };

  const handleSetInstSize = (sz: number | ((prev: number) => number)) => {
    setInstSize(prev => {
      const next = typeof sz === "function" ? sz(prev) : sz;
      localStorage.setItem("sistema_logo_inst_size", next.toString());
      return next;
    });
  };

  const handleSetInstHeight = (val: number | "auto" | ((prev: number | "auto") => number | "auto")) => {
    setInstHeight(prev => {
      const next = typeof val === "function" ? val(prev) : val;
      localStorage.setItem("sistema_logo_inst_height", next.toString());
      return next;
    });
  };

  const handleSetMppePosition = (pos: LogoPosition) => {
    setMppePosition(pos);
    localStorage.setItem("sistema_logo_mppe_pos", pos);
  };

  const handleSetMppeSize = (sz: number | ((prev: number) => number)) => {
    setMppeSize(prev => {
      const next = typeof sz === "function" ? sz(prev) : sz;
      localStorage.setItem("sistema_logo_mppe_size", next.toString());
      return next;
    });
  };

  const handleSetMppeHeight = (val: number | "auto" | ((prev: number | "auto") => number | "auto")) => {
    setMppeHeight(prev => {
      const next = typeof val === "function" ? val(prev) : val;
      localStorage.setItem("sistema_logo_mppe_height", next.toString());
      return next;
    });
  };

  // Cálculo de logos por columna (Izquierda, Centro, Derecha) con soporte para mover y redimensionar libremente
  const leftLogos = useMemo(() => {
    const list = [];
    if (mppePosition === "left") {
      list.push({ 
        id: "mppe", 
        src: mppeLogo, 
        alt: "Logo MPPE", 
        size: mppeSize, 
        height: mppeHeight,
        offset: mppeOffset, 
        setSize: handleSetMppeSize, 
        setHeight: handleSetMppeHeight,
        setOffset: handleUpdateMppeOffset, 
        setPos: handleSetMppePosition 
      });
    }
    if (instPosition === "left") {
      list.push({ 
        id: "inst", 
        src: instLogo, 
        alt: "Logo Institución", 
        size: instSize, 
        height: instHeight,
        offset: instOffset, 
        setSize: handleSetInstSize, 
        setHeight: handleSetInstHeight,
        setOffset: handleUpdateInstOffset, 
        setPos: handleSetInstPosition 
      });
    }
    return list;
  }, [mppePosition, instPosition, mppeLogo, instLogo, mppeSize, instSize, mppeHeight, instHeight, mppeOffset, instOffset]);

  const centerLogos = useMemo(() => {
    const list = [];
    if (mppePosition === "center") {
      list.push({ 
        id: "mppe", 
        src: mppeLogo, 
        alt: "Logo MPPE", 
        size: mppeSize, 
        height: mppeHeight,
        offset: mppeOffset, 
        setSize: handleSetMppeSize, 
        setHeight: handleSetMppeHeight,
        setOffset: handleUpdateMppeOffset, 
        setPos: handleSetMppePosition 
      });
    }
    if (instPosition === "center") {
      list.push({ 
        id: "inst", 
        src: instLogo, 
        alt: "Logo Institución", 
        size: instSize, 
        height: instHeight,
        offset: instOffset, 
        setSize: handleSetInstSize, 
        setHeight: handleSetInstHeight, 
        setOffset: handleUpdateInstOffset, 
        setPos: handleSetInstPosition 
      });
    }
    return list;
  }, [mppePosition, instPosition, mppeLogo, instLogo, mppeSize, instSize, mppeHeight, instHeight, mppeOffset, instOffset]);

  const rightLogos = useMemo(() => {
    const list = [];
    if (instPosition === "right") {
      list.push({ 
        id: "inst", 
        src: instLogo, 
        alt: "Logo Institución", 
        size: instSize, 
        height: instHeight,
        offset: instOffset, 
        setSize: handleSetInstSize, 
        setHeight: handleSetInstHeight, 
        setOffset: handleUpdateInstOffset, 
        setPos: handleSetInstPosition 
      });
    }
    if (mppePosition === "right") {
      list.push({ 
        id: "mppe", 
        src: mppeLogo, 
        alt: "Logo MPPE", 
        size: mppeSize, 
        height: mppeHeight,
        offset: mppeOffset, 
        setSize: handleSetMppeSize, 
        setHeight: handleSetMppeHeight, 
        setOffset: handleUpdateMppeOffset, 
        setPos: handleSetMppePosition 
      });
    }
    return list;
  }, [mppePosition, instPosition, mppeLogo, instLogo, mppeSize, instSize, mppeHeight, instHeight, mppeOffset, instOffset]);

  const leftWidth = useMemo(() => {
    return leftLogos.reduce((acc, curr) => acc + curr.size + 8, 0);
  }, [leftLogos]);

  const rightWidth = useMemo(() => {
    return rightLogos.reduce((acc, curr) => acc + curr.size + 8, 0);
  }, [rightLogos]);

  const handleUploadLogoInst = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("error", "Por favor selecciona un archivo de imagen válido (PNG, JPG, SVG).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setInstLogo(base64);
      localStorage.setItem("sistema_logo_institucion", base64);
      showToast("success", "Logo de la Institución actualizado con éxito.");
    };
    reader.readAsDataURL(file);
  };

  const handleUploadLogoMppe = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("error", "Por favor selecciona un archivo de imagen válido (PNG, JPG, SVG).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setMppeLogo(base64);
      localStorage.setItem("sistema_logo_mppe", base64);
      showToast("success", "Logo del MPPE actualizado con éxito.");
    };
    reader.readAsDataURL(file);
  };

  const handleResetLogos = () => {
    setInstLogo("./logo.png");
    setMppeLogo("./mppe_logo.png");
    handleSetLogoMode("both");
    setInstSize(80);
    setInstHeight("auto");
    setInstOffset({ x: 0, y: 0 });
    setMppeSize(80);
    setMppeHeight("auto");
    setMppeOffset({ x: 0, y: 0 });
    localStorage.removeItem("sistema_logo_inst_height");
    localStorage.removeItem("sistema_logo_mppe_height");
    localStorage.removeItem("sistema_logo_institucion");
    localStorage.removeItem("sistema_logo_mppe");
    localStorage.removeItem("sistema_logo_inst_pos");
    localStorage.removeItem("sistema_logo_inst_size");
    localStorage.removeItem("sistema_logo_inst_offset");
    localStorage.removeItem("sistema_logo_mppe_pos");
    localStorage.removeItem("sistema_logo_mppe_size");
    localStorage.removeItem("sistema_logo_mppe_offset");
    localStorage.removeItem("sistema_doc_logomode");
    showToast("info", "Logos, posiciones y tamaños restablecidos a los valores oficiales.");
  };

  // Refs y handlers para cambio de logos en el Editor de Plantillas y Hoja
  const templateInstInputRef = useRef<HTMLInputElement>(null);
  const templateMppeInputRef = useRef<HTMLInputElement>(null);
  const sheetInstInputRef = useRef<HTMLInputElement>(null);
  const sheetMppeInputRef = useRef<HTMLInputElement>(null);

  const handleTemplateUploadLogoInst = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("error", "Por favor selecciona un archivo de imagen válido (PNG, JPG, SVG, WebP).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setFormTemplate(prev => ({
        ...prev,
        logoSettings: {
          ...prev.logoSettings,
          instUrl: base64
        }
      }));
      setInstLogo(base64);
      localStorage.setItem("sistema_logo_institucion", base64);
      showToast("success", "Logo institucional cargado con éxito.");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleTemplateUploadLogoMppe = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("error", "Por favor selecciona un archivo de imagen válido (PNG, JPG, SVG, WebP).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setFormTemplate(prev => ({
        ...prev,
        logoSettings: {
          ...prev.logoSettings,
          mppeUrl: base64
        }
      }));
      setMppeLogo(base64);
      localStorage.setItem("sistema_logo_mppe", base64);
      showToast("success", "Logo del MPPE / Escudo cargado con éxito.");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleTemplateResetLogoInst = () => {
    setFormTemplate(prev => ({
      ...prev,
      logoSettings: {
        ...prev.logoSettings,
        instUrl: "./logo.png"
      }
    }));
    setInstLogo("./logo.png");
    localStorage.setItem("sistema_logo_institucion", "./logo.png");
    showToast("info", "Logo institucional restablecido al predeterminado.");
  };

  const handleTemplateResetLogoMppe = () => {
    setFormTemplate(prev => ({
      ...prev,
      logoSettings: {
        ...prev.logoSettings,
        mppeUrl: "./mppe_logo.png"
      }
    }));
    setMppeLogo("./mppe_logo.png");
    localStorage.setItem("sistema_logo_mppe", "./mppe_logo.png");
    showToast("info", "Logo del MPPE restablecido al predeterminado.");
  };

  const handleSheetUploadLogoInst = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("error", "Por favor selecciona un archivo de imagen válido (PNG, JPG, SVG, WebP).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setInstLogo(base64);
      localStorage.setItem("sistema_logo_institucion", base64);
      showToast("success", "Logo institucional actualizado.");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSheetUploadLogoMppe = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("error", "Por favor selecciona un archivo de imagen válido (PNG, JPG, SVG, WebP).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setMppeLogo(base64);
      localStorage.setItem("sistema_logo_mppe", base64);
      showToast("success", "Logo del MPPE / Escudo actualizado.");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const previewSheetRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [previewZoomFit, setPreviewZoomFit] = useState<boolean>(false);

  // Helper para generar el PDF de alta resolución a partir del lienzo de la hoja
  const generatePdfBlob = async (): Promise<{ doc: jsPDF; base64: string } | null> => {
    const element = previewSheetRef.current || document.getElementById("preview-document-sheet") || document.getElementById("print-document-sheet");
    if (!element) return null;

    // Medidas exactas en mm según el tamaño de hoja
    const pageDimensions = paperSize === "Oficio" 
      ? { width: 215.9, height: 355.6, format: "legal" }
      : paperSize === "A4" 
      ? { width: 210.0, height: 297.0, format: "a4" }
      : { width: 215.9, height: 279.4, format: "letter" };

    const originalTransform = element.style.transform;
    element.style.transform = "none";

    try {
      const canvas = await html2canvas(element, {
        scale: 2.2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 1200
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.98);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: pageDimensions.format as any
      });

      const imgWidth = pageDimensions.width;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, Math.min(imgHeight, pageDimensions.height));

      const base64 = pdf.output("datauristring");
      return { doc: pdf, base64 };
    } finally {
      element.style.transform = originalTransform;
    }
  };

  // Guardar PDF directamente con diálogo nativo y tamaño de hoja seleccionado
  const handleSavePdf = async () => {
    setIsGeneratingPdf(true);
    showToast("info", `Generando archivo PDF en formato ${paperSize}...`);
    try {
      const studentNameSafe = selectedStudent 
        ? `${selectedStudent.firstName}_${selectedStudent.lastName}` 
        : "Estudiante";
      const tplNameSafe = activeTemplate?.nombre || "Documento";
      const defaultFilename = `${tplNameSafe}_${studentNameSafe}`.replace(/[^a-zA-Z0-9_\-.]/g, '_');

      const result = await generatePdfBlob();
      if (!result) {
        showToast("error", "No se encontró el lienzo del documento para exportar.");
        setIsGeneratingPdf(false);
        return;
      }

      // Si estamos en Electron con IPC disponible
      if ((window as any).electron?.guardarDocumentoPdf) {
        const res = await (window as any).electron.guardarDocumentoPdf({
          pageSize: paperSize,
          filename: defaultFilename,
          pdfBase64: result.base64
        });
        if (res?.success) {
          showToast("success", `¡Documento PDF guardado exitosamente en tamaño ${paperSize}!`);
        } else if (res?.canceled) {
          showToast("info", "Operación de guardado cancelada.");
        } else {
          // Descarga directa cliente si falla el diálogo
          result.doc.save(`${defaultFilename}.pdf`);
          showToast("success", `Documento PDF descargado exitosamente.`);
        }
      } else {
        // En navegador / sin IPC de Electron
        result.doc.save(`${defaultFilename}.pdf`);
        showToast("success", `¡Documento PDF descargado exitosamente en tamaño ${paperSize}!`);
      }
    } catch (err: any) {
      console.error(err);
      showToast("error", "Error al generar el archivo PDF.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Imprimir documento directamente sin error de Electron
  const handlePrintDocument = async () => {
    setIsPrinting(true);
    showToast("info", `Preparando documento en tamaño ${paperSize} para imprimir...`);
    try {
      const result = await generatePdfBlob();
      if (result && (window as any).electron?.imprimirDocumentoDirecto) {
        const res = await (window as any).electron.imprimirDocumentoDirecto({
          pageSize: paperSize,
          pdfBase64: result.base64
        });
        if (res?.success) {
          showToast("success", "Documento abierto en el visor de impresión de Windows.");
        } else {
          window.print();
        }
      } else {
        window.print();
      }
    } catch {
      window.print();
    } finally {
      setIsPrinting(false);
    }
  };

  // Modal para editor de plantilla
  const [templateEditorOpen, setTemplateEditorOpen] = useState<boolean>(false);
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null);
  const [formTemplate, setFormTemplate] = useState<{
    nombre: string;
    codigo: string;
    categoria: string;
    descripcion: string;
    encabezado: string;
    titulo: string;
    cuerpo: string;
    piePagina: string;
    logoMode: DocumentLogoMode;
    paperSize: PaperSize;
    logoSettings: LogoSettings;
  }>({
    nombre: "",
    codigo: "",
    categoria: "Acreditación",
    descripcion: "",
    encabezado: "",
    titulo: "",
    cuerpo: "",
    piePagina: "",
    logoMode: "both",
    paperSize: "Carta",
    logoSettings: {
      mppeVisible: true,
      mppePosition: "left",
      mppeSize: 80,
      mppeHeight: "auto",
      mppeUrl: mppeLogo,
      mppeX: 0,
      mppeY: 0,
      instVisible: true,
      instPosition: "right",
      instSize: 80,
      instHeight: "auto",
      instUrl: instLogo,
      instX: 0,
      instY: 0
    }
  });

  // Filtro de etiquetas inteligentes y destino en el editor
  const [activeTagCategory, setActiveTagCategory] = useState<string>("Todos");
  const [tagTargetField, setTagTargetField] = useState<"cuerpo" | "encabezado" | "piePagina">("cuerpo");
  const [tagSearchTerm, setTagSearchTerm] = useState<string>("");
  const [templateLogoConfigOpen, setTemplateLogoConfigOpen] = useState<boolean>(false);

  // Múltiples firmas configuradas en la plantilla (Izquierda, Centro, Derecha)
  const [formSignatures, setFormSignatures] = useState<SignatureBlock[]>([
    {
      id: "sig_1",
      posicion: "center",
      texto: "_____________________________\n[Nombre Director]\nDirector(a) del Plantel\n(Sello Institucional)"
    }
  ]);
  const [activeSignatureId, setActiveSignatureId] = useState<string>("sig_1");

  // Refs y posición exacta del cursor / puntero para inserción precisa de palabras clave
  const encabezadoInputRef = useRef<HTMLTextAreaElement>(null);
  const cuerpoInputRef = useRef<HTMLTextAreaElement>(null);
  const lastActiveTargetRef = useRef<"cuerpo" | "encabezado" | "piePagina">("cuerpo");
  const lastSelectionRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });

  const handleRecordSelection = (target: "cuerpo" | "encabezado" | "piePagina", el: HTMLTextAreaElement) => {
    lastActiveTargetRef.current = target;
    setTagTargetField(target);
    lastSelectionRef.current = {
      start: el.selectionStart,
      end: el.selectionEnd
    };
  };

  // Modal confirmación eliminar plantilla
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [templateToDelete, setTemplateToDelete] = useState<DocumentTemplate | null>(null);

  // Toast
  const [notification, setNotification] = useState<ToastNotificationState>({
    show: false,
    type: "",
    msg: ""
  });

  const [loading, setLoading] = useState<boolean>(true);

  const showToast = (type: "success" | "error" | "info", msg: string) => {
    setNotification({ show: true, type, msg });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 3500);
  };

  const cleanLegacyTags = (str?: string): string => {
    if (!str) return "";
    return str
      .replace(/\{\{\s*nombre_completo\s*\}\}/gi, '[Nombre Completo]')
      .replace(/\{\{\s*nombre_alumno\s*\}\}/gi, '[Nombre Alumno]')
      .replace(/\{\{\s*apellido_alumno\s*\}\}/gi, '[Apellido Alumno]')
      .replace(/\{\{\s*cedula_alumno\s*\}\}/gi, '[Cédula Alumno]')
      .replace(/\{\{\s*fecha_nacimiento\s*\}\}/gi, '[Fecha Nacimiento]')
      .replace(/\{\{\s*edad_alumno\s*\}\}/gi, '[Edad Alumno]')
      .replace(/\{\{\s*lugar_nacimiento\s*\}\}/gi, '[Lugar Nacimiento]')
      .replace(/\{\{\s*genero_alumno\s*\}\}/gi, '[Género Alumno]')
      .replace(/\{\{\s*direccion_alumno\s*\}\}/gi, '[Dirección Alumno]')
      .replace(/\{\{\s*nivel_academico\s*\}\}/gi, '[Nivel Académico]')
      .replace(/\{\{\s*grado_seccion\s*\}\}/gi, '[Grado y Sección]')
      .replace(/\{\{\s*grado\s*\}\}/gi, '[Grado]')
      .replace(/\{\{\s*seccion\s*\}\}/gi, '[Sección]')
      .replace(/\{\{\s*periodo_escolar\s*\}\}/gi, '[Periodo Escolar]')
      .replace(/\{\{\s*condicion_academica\s*\}\}/gi, '[Condición Académica]')
      .replace(/\{\{\s*nombre_representante\s*\}\}/gi, '[Nombre Representante]')
      .replace(/\{\{\s*cedula_representante\s*\}\}/gi, '[Cédula Representante]')
      .replace(/\{\{\s*parentesco_representante\s*\}\}/gi, '[Parentesco]')
      .replace(/\{\{\s*telefono_representante\s*\}\}/gi, '[Teléfono Representante]')
      .replace(/\{\{\s*nombre_colegio\s*\}\}/gi, '[Nombre Plantel]')
      .replace(/\{\{\s*codigo_dea\s*\}\}/gi, '[Código DEA]')
      .replace(/\{\{\s*municipio_estado\s*\}\}/gi, '[Municipio y Estado]')
      .replace(/\{\{\s*nombre_director\s*\}\}/gi, '[Nombre Director]')
      .replace(/\{\{\s*fecha_actual\s*\}\}/gi, '[Fecha Actual]')
      .replace(/\{\{\s*dia_actual\s*\}\}/gi, '[Día Actual]')
      .replace(/\{\{\s*mes_actual\s*\}\}/gi, '[Mes Actual]')
      .replace(/\{\{\s*anio_actual\s*\}\}/gi, '[Año Actual]');
  };

  const sanitizeTemplates = (list: DocumentTemplate[]): DocumentTemplate[] => {
    return list.map(t => ({
      ...t,
      encabezado: cleanLegacyTags(t.encabezado),
      cuerpo: cleanLegacyTags(t.cuerpo),
      piePagina: cleanLegacyTags(t.piePagina)
    }));
  };

  // Cargar estudiantes y plantillas
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Cargar estudiantes
      if ((window as any).electron?.getStudents) {
        const studs = await (window as any).electron.getStudents();
        setStudents(studs || []);
        if (studs && studs.length > 0 && !selectedStudent) {
          setSelectedStudent(studs[0]);
        }
      }

      // 2. Cargar plantillas
      if ((window as any).electron?.getPlantillas) {
        const tpls = await (window as any).electron.getPlantillas();
        const cleaned = sanitizeTemplates(tpls || []);
        setTemplates(cleaned);
        if (cleaned && cleaned.length > 0) {
          setSelectedTemplateId(cleaned[0].id);
        }
      } else {
        // Fallback local
        const saved = localStorage.getItem("sistema_plantillas_backup");
        if (saved) {
          const parsed = JSON.parse(saved);
          const cleaned = sanitizeTemplates(parsed);
          setTemplates(cleaned);
          if (cleaned.length > 0) setSelectedTemplateId(cleaned[0].id);
        }
      }
    } catch (err) {
      console.error("Error al cargar datos del generador:", err);
      showToast("error", "Error al comunicarse con la base de datos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Plantilla activa seleccionada
  const activeTemplate = useMemo(() => {
    return templates.find(t => t.id === selectedTemplateId) || templates[0] || null;
  }, [templates, selectedTemplateId]);

  // Actualizar documento de última hora cuando cambia el alumno o plantilla
  useEffect(() => {
    if (activeTemplate && selectedStudent) {
      setLastMinuteDoc({
        encabezado: renderTemplateText(activeTemplate.encabezado, selectedStudent),
        titulo: renderTemplateText(activeTemplate.titulo, selectedStudent),
        cuerpo: renderTemplateText(activeTemplate.cuerpo, selectedStudent),
        piePagina: renderTemplateText(activeTemplate.piePagina, selectedStudent),
      });
      setIsEditingLastMinute(false);
    }
  }, [activeTemplate, selectedStudent]);

  // Sincronizar preferencia de logos si la plantilla tiene configuración guardada
  useEffect(() => {
    if (activeTemplate?.logoSettings) {
      const ls = activeTemplate.logoSettings;
      if (ls.mppePosition !== undefined) {
        setMppePosition(ls.mppePosition);
      } else if (ls.mppeVisible === false) {
        setMppePosition("none");
      }
      if (ls.mppeSize !== undefined) setMppeSize(ls.mppeSize);
      if (ls.mppeHeight !== undefined) setMppeHeight(ls.mppeHeight);
      if (ls.mppeUrl) setMppeLogo(ls.mppeUrl);
      if (ls.mppeX !== undefined || ls.mppeY !== undefined) {
        setMppeOffset({ x: ls.mppeX || 0, y: ls.mppeY || 0 });
      } else {
        setMppeOffset({ x: 0, y: 0 });
      }

      if (ls.instPosition !== undefined) {
        setInstPosition(ls.instPosition);
      } else if (ls.instVisible === false) {
        setInstPosition("none");
      }
      if (ls.instSize !== undefined) setInstSize(ls.instSize);
      if (ls.instHeight !== undefined) setInstHeight(ls.instHeight);
      if (ls.instUrl) setInstLogo(ls.instUrl);
      if (ls.instX !== undefined || ls.instY !== undefined) {
        setInstOffset({ x: ls.instX || 0, y: ls.instY || 0 });
      } else {
        setInstOffset({ x: 0, y: 0 });
      }
    } else if (activeTemplate?.logoMode) {
      setLogoMode(activeTemplate.logoMode);
    }

    if (activeTemplate?.paperSize) {
      setPaperSize(activeTemplate.paperSize);
    }
  }, [activeTemplate]);

  // Alumnos filtrados para el buscador individual
  const filteredStudentsSearch = useMemo(() => {
    if (!studentSearch.trim()) return students.slice(0, 8);
    const term = studentSearch.toLowerCase();
    return students.filter(s => 
      s.firstName?.toLowerCase().includes(term) ||
      s.lastName?.toLowerCase().includes(term) ||
      s.ci?.toLowerCase().includes(term) ||
      s.id?.toLowerCase().includes(term)
    ).slice(0, 10);
  }, [students, studentSearch]);

  // Alumnos del grado/sección para el modo masivo
  const studentsInClass = useMemo(() => {
    return students.filter(s => {
      const matchNivel = (s as any).nivel === filterNivel || s.level === filterNivel;
      const matchGrado = s.grade === filterGrado;
      const matchSeccion = s.section === filterSeccion || (!s.section && filterSeccion === "A");
      return matchNivel && matchGrado && matchSeccion;
    });
  }, [students, filterNivel, filterGrado, filterSeccion]);

  // Sincronizar selección masiva cuando cambia el aula
  useEffect(() => {
    setSelectedStudentIds(studentsInClass.map(s => s.id));
  }, [studentsInClass]);

  // Toggle de selección en masiva
  const handleToggleSelectStudent = (id: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllStudents = () => {
    if (selectedStudentIds.length === studentsInClass.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(studentsInClass.map(s => s.id));
    }
  };

  // Insertar etiqueta en la posición exacta del cursor / puntero
  const handleInsertTag = (tag: string, field?: "cuerpo" | "encabezado" | "piePagina") => {
    const target = field || tagTargetField || lastActiveTargetRef.current || "cuerpo";

    if (target === "piePagina") {
      setFormSignatures(prev => {
        const targetId = activeSignatureId || (prev[0] ? prev[0].id : "sig_1");
        const idx = prev.findIndex(s => s.id === targetId);
        if (idx === -1) {
          if (prev.length === 0) {
            const initial: SignatureBlock[] = [{ id: "sig_1", posicion: "center", texto: `${tag} ` }];
            setFormTemplate(f => ({ ...f, piePagina: serializeSignatures(initial) }));
            return initial;
          }
          return prev;
        }

        const sig = prev[idx];
        const currentText = sig.texto || "";
        const textarea = document.getElementById(`sig-textarea-${targetId}`) as HTMLTextAreaElement | null;
        let start = currentText.length;
        let end = currentText.length;

        if (textarea && typeof textarea.selectionStart === "number") {
          start = textarea.selectionStart;
          end = textarea.selectionEnd;
        } else if (lastActiveTargetRef.current === "piePagina") {
          start = lastSelectionRef.current.start;
          end = lastSelectionRef.current.end;
        }

        if (start < 0 || start > currentText.length) start = currentText.length;
        if (end < start || end > currentText.length) end = start;

        const before = currentText.substring(0, start);
        const after = currentText.substring(end);
        const insertValue = `${tag} `;
        const updatedText = `${before}${insertValue}${after}`;
        const newCursorPos = start + insertValue.length;

        lastSelectionRef.current = { start: newCursorPos, end: newCursorPos };

        const updated = [...prev];
        updated[idx] = { ...sig, texto: updatedText };
        setFormTemplate(f => ({ ...f, piePagina: serializeSignatures(updated) }));

        setTimeout(() => {
          const el = document.getElementById(`sig-textarea-${targetId}`) as HTMLTextAreaElement | null;
          if (el) {
            el.focus();
            el.setSelectionRange(newCursorPos, newCursorPos);
          }
        }, 10);

        return updated;
      });

      lastActiveTargetRef.current = "piePagina";
      setTagTargetField("piePagina");
      showToast("info", `Palabra clave ${tag} insertada en la firma.`);
      return;
    }

    const ref = target === "cuerpo" ? cuerpoInputRef : encabezadoInputRef;
    const textarea = ref.current;

    const currentText = formTemplate[target] || "";
    let start = currentText.length;
    let end = currentText.length;

    if (textarea) {
      if (typeof textarea.selectionStart === "number") {
        start = textarea.selectionStart;
        end = textarea.selectionEnd;
      } else if (lastActiveTargetRef.current === target) {
        start = lastSelectionRef.current.start;
        end = lastSelectionRef.current.end;
      }
    } else if (lastActiveTargetRef.current === target) {
      start = lastSelectionRef.current.start;
      end = lastSelectionRef.current.end;
    }

    if (start < 0 || start > currentText.length) start = currentText.length;
    if (end < start || end > currentText.length) end = start;

    const before = currentText.substring(0, start);
    const after = currentText.substring(end);
    const insertValue = `${tag} `;
    const updatedText = `${before}${insertValue}${after}`;
    const newCursorPos = start + insertValue.length;

    setFormTemplate(prev => ({
      ...prev,
      [target]: updatedText
    }));

    lastSelectionRef.current = { start: newCursorPos, end: newCursorPos };
    lastActiveTargetRef.current = target;

    // Restaurar foco y colocar el cursor inmediatamente después de la palabra clave insertada
    setTimeout(() => {
      if (ref.current) {
        ref.current.focus();
        ref.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 10);

    const targetName = target === "cuerpo" ? "el cuerpo" : "el encabezado";
    showToast("info", `Palabra clave ${tag} insertada en ${targetName}.`);
  };

  // Gestión de bloques de firmas en el editor de plantillas
  const handleAddSignature = () => {
    const newId = `sig_${Date.now()}`;
    const hasLeft = formSignatures.some(s => s.posicion === "left");
    const hasRight = formSignatures.some(s => s.posicion === "right");
    let nextPos: SignaturePosition = "center";
    if (hasLeft && !hasRight) nextPos = "right";
    else if (!hasLeft && hasRight) nextPos = "left";
    else if (formSignatures.length === 1 && formSignatures[0].posicion === "center") {
      const reorderedFirst: SignatureBlock = { ...formSignatures[0], posicion: "left" };
      const newBlock: SignatureBlock = {
        id: newId,
        posicion: "right",
        texto: "_____________________________\n[Nombre Representante]\nRepresentante Legal"
      };
      const updated = [reorderedFirst, newBlock];
      setFormSignatures(updated);
      setActiveSignatureId(newId);
      setFormTemplate(prev => ({ ...prev, piePagina: serializeSignatures(updated) }));
      return;
    }

    const updated: SignatureBlock[] = [
      ...formSignatures,
      {
        id: newId,
        posicion: nextPos,
        texto: "_____________________________\n[Nombre Representante]\nRepresentante Legal"
      }
    ];
    setFormSignatures(updated);
    setActiveSignatureId(newId);
    setFormTemplate(prev => ({ ...prev, piePagina: serializeSignatures(updated) }));
  };

  const handleUpdateSignaturePos = (id: string, posicion: SignaturePosition) => {
    setFormSignatures(prev => {
      const updated = prev.map(s => s.id === id ? { ...s, posicion } : s);
      setFormTemplate(f => ({ ...f, piePagina: serializeSignatures(updated) }));
      return updated;
    });
  };

  const handleUpdateSignatureText = (id: string, texto: string) => {
    setFormSignatures(prev => {
      const updated = prev.map(s => s.id === id ? { ...s, texto } : s);
      setFormTemplate(f => ({ ...f, piePagina: serializeSignatures(updated) }));
      return updated;
    });
  };

  const handleRemoveSignature = (id: string) => {
    if (formSignatures.length <= 1) {
      showToast("error", "Debe existir al menos un bloque de firma en el documento.");
      return;
    }
    setFormSignatures(prev => {
      const updated = prev.filter(s => s.id !== id);
      setFormTemplate(f => ({ ...f, piePagina: serializeSignatures(updated) }));
      if (activeSignatureId === id && updated[0]) {
        setActiveSignatureId(updated[0].id);
      }
      return updated;
    });
  };

  // Abrir editor para nueva plantilla
  const handleOpenNewTemplate = () => {
    setEditingTemplate(null);
    const defaultSigs: SignatureBlock[] = [
      {
        id: "sig_1",
        posicion: "center",
        texto: "_____________________________\n[Nombre Director]\nDirector(a) del Plantel\n(Sello Institucional)"
      }
    ];
    setFormSignatures(defaultSigs);
    setActiveSignatureId("sig_1");
    setFormTemplate({
      nombre: "",
      codigo: "",
      categoria: "Acreditación",
      descripcion: "",
      encabezado: "REPÚBLICA BOLIVARIANA DE VENEZUELA\nMINISTERIO DEL PODER POPULAR PARA LA EDUCACIÓN\nUNIDAD EDUCATIVA \"REPÚBLICA DE CHILE\"\nEL ESPINAL - MUNICIPIO DÍAZ - ESTADO NUEVA ESPARTA\nCÓDIGO DEA: OD01461703",
      titulo: "CONSTANCIA INSTITUCIONAL",
      cuerpo: "Quien suscribe, Director(a) de la Unidad Educativa \"República de Chile\", hace constar por medio de la presente que el (la) estudiante: [Nombre Completo], titular de la Cédula / ID Escolar N° [Cédula Alumno], cursa el [Grado y Sección] durante el año escolar [Periodo Escolar].\n\nConstancia que se expide en El Espinal, en fecha [Fecha Actual].",
      piePagina: serializeSignatures(defaultSigs),
      logoMode: "both",
      paperSize: "Carta",
      logoSettings: {
        mppeVisible: true,
        mppePosition: "left",
        mppeSize: 80,
        mppeHeight: "auto",
        mppeUrl: mppeLogo,
        mppeX: 0,
        mppeY: 0,
        instVisible: true,
        instPosition: "right",
        instSize: 80,
        instHeight: "auto",
        instUrl: instLogo,
        instX: 0,
        instY: 0
      }
    });
    setTemplateEditorOpen(true);
  };

  // Abrir editor para modificar plantilla
  const handleOpenEditTemplate = (tpl: DocumentTemplate) => {
    setEditingTemplate(tpl);
    const ls = tpl.logoSettings;
    const sigs = parseSignatures(tpl.piePagina);
    setFormSignatures(sigs);
    if (sigs.length > 0) {
      setActiveSignatureId(sigs[0].id);
    }
    setFormTemplate({
      nombre: tpl.nombre,
      codigo: tpl.codigo || "",
      categoria: tpl.categoria || "Acreditación",
      descripcion: tpl.descripcion || "",
      encabezado: cleanLegacyTags(tpl.encabezado || ""),
      titulo: tpl.titulo || "",
      cuerpo: cleanLegacyTags(tpl.cuerpo || ""),
      piePagina: serializeSignatures(sigs),
      logoMode: tpl.logoMode || "both",
      paperSize: tpl.paperSize || "Carta",
      logoSettings: {
        mppeVisible: ls?.mppeVisible ?? (ls?.mppePosition ? ls.mppePosition !== "none" : (tpl.logoMode !== "institucion" && tpl.logoMode !== "none")),
        mppePosition: ls?.mppePosition || (tpl.logoMode === "institucion" || tpl.logoMode === "none" ? "none" : "left"),
        mppeSize: ls?.mppeSize || 80,
        mppeHeight: ls?.mppeHeight || "auto",
        mppeUrl: ls?.mppeUrl || mppeLogo,
        mppeX: ls?.mppeX || 0,
        mppeY: ls?.mppeY || 0,
        instVisible: ls?.instVisible ?? (ls?.instPosition ? ls.instPosition !== "none" : (tpl.logoMode !== "mppe" && tpl.logoMode !== "none")),
        instPosition: ls?.instPosition || (tpl.logoMode === "mppe" || tpl.logoMode === "none" ? "none" : "right"),
        instSize: ls?.instSize || 80,
        instHeight: ls?.instHeight || "auto",
        instUrl: ls?.instUrl || instLogo,
        instX: ls?.instX || 0,
        instY: ls?.instY || 0
      }
    });
    setTemplateEditorOpen(true);
  };

  // Guardar plantilla
  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTemplate.nombre.trim()) {
      showToast("error", "El nombre de la plantilla es obligatorio.");
      return;
    }
    if (!formTemplate.cuerpo.trim()) {
      showToast("error", "El cuerpo del documento no puede estar vacío.");
      return;
    }

    const payload: DocumentTemplate = {
      id: editingTemplate ? editingTemplate.id : `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      nombre: formTemplate.nombre.trim(),
      codigo: formTemplate.codigo.trim() || `DOC-${Date.now().toString().slice(-4)}`,
      categoria: formTemplate.categoria,
      descripcion: formTemplate.descripcion.trim(),
      encabezado: formTemplate.encabezado.trim(),
      titulo: formTemplate.titulo.trim().toUpperCase(),
      cuerpo: formTemplate.cuerpo.trim(),
      piePagina: formSignatures.length > 0 ? serializeSignatures(formSignatures) : formTemplate.piePagina.trim(),
      logoMode: formTemplate.logoMode || "both",
      paperSize: formTemplate.paperSize || "Carta",
      logoSettings: {
        mppeVisible: formTemplate.logoSettings.mppeVisible,
        mppePosition: formTemplate.logoSettings.mppeVisible ? formTemplate.logoSettings.mppePosition : "none",
        mppeSize: formTemplate.logoSettings.mppeSize,
        mppeHeight: formTemplate.logoSettings.mppeHeight || "auto",
        mppeUrl: formTemplate.logoSettings.mppeUrl || mppeLogo,
        mppeX: formTemplate.logoSettings.mppeX,
        mppeY: formTemplate.logoSettings.mppeY,
        instVisible: formTemplate.logoSettings.instVisible,
        instPosition: formTemplate.logoSettings.instVisible ? formTemplate.logoSettings.instPosition : "none",
        instSize: formTemplate.logoSettings.instSize,
        instHeight: formTemplate.logoSettings.instHeight || "auto",
        instUrl: formTemplate.logoSettings.instUrl || instLogo,
        instX: formTemplate.logoSettings.instX,
        instY: formTemplate.logoSettings.instY
      }
    };

    try {
      if ((window as any).electron?.savePlantilla) {
        const res = await (window as any).electron.savePlantilla(payload);
        if (res.success) {
          showToast("success", editingTemplate ? "Plantilla actualizada." : "Plantilla creada con éxito.");
          await fetchData();
          setTemplateEditorOpen(false);
        } else {
          showToast("error", res.message || "Error al guardar plantilla.");
        }
      } else {
        let updated: DocumentTemplate[];
        if (editingTemplate) {
          updated = templates.map(t => t.id === editingTemplate.id ? payload : t);
        } else {
          updated = [...templates, payload];
        }
        setTemplates(updated);
        localStorage.setItem("sistema_plantillas_backup", JSON.stringify(updated));
        showToast("success", editingTemplate ? "Plantilla modificada." : "Plantilla creada.");
        setTemplateEditorOpen(false);
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Error al guardar la plantilla.");
    }
  };

  // Confirmar eliminación de plantilla
  const handleConfirmDeleteTemplate = async () => {
    if (!templateToDelete) return;
    try {
      if ((window as any).electron?.deletePlantilla) {
        const res = await (window as any).electron.deletePlantilla(templateToDelete.id);
        if (res.success) {
          showToast("success", `Plantilla "${templateToDelete.nombre}" eliminada.`);
          await fetchData();
        } else {
          showToast("error", res.message || "No se pudo eliminar la plantilla.");
        }
      } else {
        const updated = templates.filter(t => t.id !== templateToDelete.id);
        setTemplates(updated);
        localStorage.setItem("sistema_plantillas_backup", JSON.stringify(updated));
        showToast("success", `Plantilla "${templateToDelete.nombre}" eliminada.`);
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Error al eliminar plantilla.");
    } finally {
      setDeleteModalOpen(false);
      setTemplateToDelete(null);
    }
  };


  // Exportar documento actual a DOCX (Word)
  const handleExportDocx = async () => {
    if (!lastMinuteDoc.cuerpo) {
      showToast("error", "No hay contenido para exportar.");
      return;
    }

    try {
      const studentNameSafe = selectedStudent 
        ? `${selectedStudent.firstName}_${selectedStudent.lastName}` 
        : "Estudiante";
      const tplNameSafe = activeTemplate?.nombre || "Documento";

      await exportToDocx({
        encabezado: lastMinuteDoc.encabezado,
        titulo: lastMinuteDoc.titulo,
        cuerpo: lastMinuteDoc.cuerpo,
        piePagina: lastMinuteDoc.piePagina,
        filename: `${tplNameSafe}_${studentNameSafe}`,
        logoMode: logoMode,
        instLogoUrl: instLogo,
        mppeLogoUrl: mppeLogo,
        paperSize: paperSize,
        mppeSize: mppeSize,
        mppeHeight: mppeHeight,
        instSize: instSize,
        instHeight: instHeight,
        mppePosition: mppePosition,
        instPosition: instPosition
      });

      showToast("success", "Documento .DOCX generado y descargado correctamente.");
    } catch (err) {
      console.error(err);
      showToast("error", "Error al generar archivo Word.");
    }
  };

  // Abrir modal de vista previa de impresión y exportación en PDF
  const handlePrintPdf = () => {
    setPrintPreviewModalOpen(true);
  };

  // Exportar Masivo a DOCX
  const handleExportBatchDocx = async () => {
    if (selectedStudentIds.length === 0) {
      showToast("error", "Selecciona al menos un estudiante para la emisión en lote.");
      return;
    }

    if (!activeTemplate) {
      showToast("error", "Selecciona una plantilla válida.");
      return;
    }

    showToast("info", `Generando ${selectedStudentIds.length} documentos Word...`);

    const studentsToExport = students.filter(s => selectedStudentIds.includes(s.id));

    // Generar secuencialmente los documentos
    for (const st of studentsToExport) {
      const renderedEncabezado = renderTemplateText(activeTemplate.encabezado, st);
      const renderedTitulo = renderTemplateText(activeTemplate.titulo, st);
      const renderedCuerpo = renderTemplateText(activeTemplate.cuerpo, st);
      const renderedPie = renderTemplateText(activeTemplate.piePagina, st);

      await exportToDocx({
        encabezado: renderedEncabezado,
        titulo: renderedTitulo,
        cuerpo: renderedCuerpo,
        piePagina: renderedPie,
        filename: `${activeTemplate.nombre}_${st.firstName}_${st.lastName}`,
        logoMode: activeTemplate.logoMode || logoMode,
        instLogoUrl: instLogo,
        mppeLogoUrl: mppeLogo,
        paperSize: activeTemplate.paperSize || paperSize,
        mppeSize: mppeSize,
        mppeHeight: mppeHeight,
        instSize: instSize,
        instHeight: instHeight,
        mppePosition: mppePosition,
        instPosition: instPosition
      });
    }

    showToast("success", `¡${selectedStudentIds.length} documentos .DOCX exportados con éxito!`);
  };

  // Renderizador unificado de firmas institucionales (Izquierda, Centro, Derecha)
  const renderSignatureBlocks = (signaturesText: string, isEdit = false) => {
    const sigs = parseSignatures(signaturesText);
    const leftSigs = sigs.filter(s => s.posicion === "left");
    const centerSigs = sigs.filter(s => s.posicion === "center");
    const rightSigs = sigs.filter(s => s.posicion === "right");

    if (isEdit) {
      return (
        <div className="pt-8 mt-8 border-t-2 border-dashed border-amber-300 p-4 rounded-2xl bg-amber-50/40 space-y-4 no-print">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-amber-200">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
              <FileSignature size={15} className="text-amber-700" />
              Editar Firmas de Última Hora ({sigs.length} {sigs.length === 1 ? "firma" : "firmas"})
            </span>
            <button
              type="button"
              onClick={() => {
                const newSig: SignatureBlock = {
                  id: `sig_${Date.now()}`,
                  posicion: sigs.some(s => s.posicion === "left") && !sigs.some(s => s.posicion === "right") ? "right" : "center",
                  texto: "_____________________________\n[Nombre Representante]\nRepresentante Legal"
                };
                const updated = [...sigs, newSig];
                setLastMinuteDoc(prev => ({ ...prev, piePagina: serializeSignatures(updated) }));
              }}
              className="px-3 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            >
              <Plus size={13} /> Añadir Otra Firma
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sigs.map((sig, idx) => (
              <div key={sig.id} className="p-3 bg-white rounded-xl border border-amber-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-800">Firma #{idx + 1}</span>
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-0.5 bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                      {(["left", "center", "right"] as SignaturePosition[]).map(pos => (
                        <button
                          key={pos}
                          type="button"
                          onClick={() => {
                            const updated = sigs.map(s => s.id === sig.id ? { ...s, posicion: pos } : s);
                            setLastMinuteDoc(prev => ({ ...prev, piePagina: serializeSignatures(updated) }));
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${
                            sig.posicion === pos ? "bg-[#5564eb] text-white shadow-2xs" : "text-gray-600 hover:text-gray-900"
                          }`}
                        >
                          {pos === "left" ? "Izq" : pos === "center" ? "Centro" : "Der"}
                        </button>
                      ))}
                    </div>
                    {sigs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = sigs.filter(s => s.id !== sig.id);
                          setLastMinuteDoc(prev => ({ ...prev, piePagina: serializeSignatures(updated) }));
                        }}
                        className="p-1 text-red-500 hover:bg-red-50 rounded cursor-pointer"
                        title="Eliminar firma"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                <textarea
                  value={sig.texto}
                  onChange={(e) => {
                    const updated = sigs.map(s => s.id === sig.id ? { ...s, texto: e.target.value } : s);
                    setLastMinuteDoc(prev => ({ ...prev, piePagina: serializeSignatures(updated) }));
                  }}
                  rows={3}
                  className="w-full text-center text-xs font-serif border border-amber-200 rounded-lg p-2 outline-none bg-amber-50/20 text-gray-800"
                  placeholder="_____________________________\nNombre y Cargo"
                />
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Modo Visualización (Hoja y Vista Previa de Impresión)
    const hasSideSignatures = leftSigs.length > 0 || rightSigs.length > 0;

    if (hasSideSignatures) {
      return (
        <div className="pt-12 mt-12 w-full flex flex-row justify-between items-start gap-6 text-xs sm:text-sm font-serif">
          {/* Columna Izquierda */}
          <div className="flex-1 flex flex-col items-center text-center">
            {leftSigs.map(sig => (
              <div key={sig.id} className="w-full max-w-[280px] space-y-0.5 mb-4">
                {sig.texto.split("\n").map((line, idx) => (
                  <p key={idx} className="leading-snug text-gray-800 font-medium">
                    {line}
                  </p>
                ))}
              </div>
            ))}
            {leftSigs.length === 0 && (
              <div className="invisible" aria-hidden="true" />
            )}
          </div>

          {/* Columna Centro (si existen firmas centrales) */}
          {centerSigs.length > 0 && (
            <div className="flex-1 flex flex-col items-center text-center">
              {centerSigs.map(sig => (
                <div key={sig.id} className="w-full max-w-[280px] space-y-0.5 mb-4">
                  {sig.texto.split("\n").map((line, idx) => (
                    <p key={idx} className="leading-snug text-gray-800 font-medium">
                      {line}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Columna Derecha */}
          <div className="flex-1 flex flex-col items-center text-center">
            {rightSigs.map(sig => (
              <div key={sig.id} className="w-full max-w-[280px] space-y-0.5 mb-4">
                {sig.texto.split("\n").map((line, idx) => (
                  <p key={idx} className="leading-snug text-gray-800 font-medium">
                    {line}
                  </p>
                ))}
              </div>
            ))}
            {rightSigs.length === 0 && (
              <div className="invisible" aria-hidden="true" />
            )}
          </div>
        </div>
      );
    }

    // Si solo hay firmas centradas
    return (
      <div className="pt-12 mt-12 w-full flex flex-col items-center justify-center gap-6 text-center text-xs sm:text-sm font-serif">
        {centerSigs.map(sig => (
          <div key={sig.id} className="max-w-md w-full space-y-0.5">
            {sig.texto.split("\n").map((line, idx) => (
              <p key={idx} className="leading-snug text-gray-800 font-medium">
                {line}
              </p>
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <motion.div 
      className="w-full flex flex-col gap-6 relative text-left pb-16"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <ToastNotification notification={notification} />

      {/* ESTILOS DE IMPRESIÓN DIRECTA */}
      <style>{`
        @page {
          size: ${paperSize === 'Carta' ? 'letter' : paperSize === 'Oficio' ? 'legal' : 'A4'} portrait;
          margin: 1.5cm;
        }
        @media print {
          body * {
            visibility: hidden;
          }
          #print-document-sheet, #print-document-sheet * {
            visibility: visible;
          }
          #print-document-sheet {
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 2cm;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            font-size: 12pt;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* NAVEGACIÓN SUPERIOR (NO PRINT) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <button 
          onClick={() => navigate("/dashboard")} 
          className="flex items-center gap-2 text-gray-400 hover:text-[#5564eb] transition-all duration-300 group"
        >
          <div className="p-2 bg-white rounded-xl shadow-sm group-hover:shadow-md border border-gray-100 transition-all">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest leading-none">
            Volver al Dashboard
          </span>
        </button>

        {/* PESTAÑAS DE NAVEGACIÓN PRINCIPAL */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-gray-200 shadow-sm">
          <button
            onClick={() => setActiveTab("emitir")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
              activeTab === "emitir"
                ? "bg-[#5564eb] text-white shadow-md shadow-[#5564eb]/25"
                : "text-gray-600 hover:text-[#5564eb] hover:bg-blue-50"
            }`}
          >
            <FileSignature size={16} /> Emitir Documentos
          </button>

          <button
            onClick={() => setActiveTab("plantillas")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
              activeTab === "plantillas"
                ? "bg-[#5564eb] text-white shadow-md shadow-[#5564eb]/25"
                : "text-gray-600 hover:text-[#5564eb] hover:bg-blue-50"
            }`}
          >
            <FileText size={16} /> Gestor de Plantillas ({templates.length})
          </button>
        </div>
      </div>

      {loading && templates.length === 0 ? (
        <div className="py-24 bg-white rounded-3xl border border-gray-100 flex flex-col items-center justify-center text-gray-400 gap-3 shadow-sm">
          <span className="animate-spin w-8 h-8 border-4 border-[#5564eb] border-t-transparent rounded-full" />
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Cargando plantillas y datos estudiantiles...</p>
        </div>
      ) : activeTab === "emitir" ? (
        <div className="w-full flex flex-col gap-6">

          {/* BARRA SUPERIOR DE ACCIONES Y SELECTOR DE PLANTILLA (NO PRINT) */}
          <div className="w-full bg-white rounded-3xl shadow-sm border border-gray-200/80 p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 no-print">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 text-[#5564eb] border border-blue-100 rounded-2xl">
                <FileSignature size={26} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                  Generador Automático de Documentos
                </h1>
                <p className="text-xs text-gray-500 font-medium">
                  Emite constancias, cartas de conducta y certificaciones con datos extraídos al instante.
                </p>
              </div>
            </div>

            {/* SELECTOR DE PLANTILLA Y MODO */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              {/* Selector de Plantilla */}
              <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-200">
                <span className="text-xs font-bold text-gray-500 uppercase ml-1">Plantilla:</span>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="bg-white border border-gray-300 font-extrabold text-gray-800 text-xs rounded-xl px-3 py-2 outline-none focus:border-[#5564eb] cursor-pointer shadow-sm"
                >
                  {templates.map(tpl => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.nombre} ({tpl.codigo})
                    </option>
                  ))}
                </select>
              </div>

              {/* Botón Switch Modo: Individual vs Masivo */}
              <div className="flex items-center bg-gray-100 p-1 rounded-2xl border border-gray-200">
                <button
                  onClick={() => setEmissionMode("individual")}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    emissionMode === "individual"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <User size={14} /> Individual
                </button>
                <button
                  onClick={() => setEmissionMode("masivo")}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    emissionMode === "masivo"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <Users size={14} /> Masivo por Aula
                </button>
              </div>
            </div>
          </div>

          {/* CONTENIDO PRINCIPAL: 2 COLUMNAS (SELECTOR + HOJA DE PREVISUALIZACIÓN) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* COLUMNA IZQUIERDA: SELECCIÓN DE ESTUDIANTE(S) (NO PRINT) */}
            <div className="lg:col-span-4 flex flex-col gap-6 no-print">

              {/* MODO INDIVIDUAL: BUSCADOR DE ALUMNO */}
              {emissionMode === "individual" ? (
                <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-sm flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <span className="text-xs font-black uppercase text-gray-400 tracking-wider flex items-center gap-2">
                      <User size={16} className="text-[#5564eb]" /> Seleccionar Estudiante
                    </span>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                      {students.length} matriculados
                    </span>
                  </div>

                  {/* Buscador interactivo */}
                  <div className="relative">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre o cédula..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-bold text-gray-800 placeholder-gray-400 outline-none focus:bg-white focus:border-[#5564eb] focus:ring-2 focus:ring-[#5564eb]/20 transition"
                    />
                  </div>

                  {/* Lista de resultados / sugeridos */}
                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                    {filteredStudentsSearch.map(st => {
                      const isSelected = selectedStudent?.id === st.id;
                      return (
                        <div
                          key={st.id}
                          onClick={() => setSelectedStudent(st)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                            isSelected
                              ? "bg-blue-50/80 border-[#5564eb] ring-2 ring-[#5564eb]/20 shadow-sm"
                              : "bg-white border-gray-200 hover:border-blue-300 hover:bg-gray-50/50"
                          }`}
                        >
                          <div className="w-10 h-10 rounded-xl bg-gray-200 overflow-hidden shrink-0 border border-gray-200 flex items-center justify-center font-black text-gray-600 text-xs">
                            {st.studentPhoto ? (
                              <img src={st.studentPhoto} alt={st.firstName} className="w-full h-full object-cover" />
                            ) : (
                              <span>{st.firstName?.charAt(0) || "E"}</span>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-extrabold text-gray-900 truncate">
                              {st.firstName} {st.lastName}
                            </p>
                            <p className="text-[10px] text-gray-500 font-mono">
                              C.I: {st.ci || "Sin cédula"} • {st.grade || "S/G"} "{st.section || "A"}"
                            </p>
                          </div>

                          {isSelected && (
                            <CheckCircle size={18} className="text-[#5564eb] shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Ficha Resumen del Alumno Seleccionado */}
                  {selectedStudent && (
                    <div className="mt-2 p-4 bg-gray-50 rounded-2xl border border-gray-200 text-xs space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase text-gray-400 mb-2">
                        <span>Ficha del Alumno</span>
                        <span className="text-[#5564eb] font-bold">{selectedStudent.schoolYear || "2025-2026"}</span>
                      </div>
                      <p><strong className="text-gray-700">Nombre:</strong> {selectedStudent.firstName} {selectedStudent.lastName}</p>
                      <p><strong className="text-gray-700">Cédula:</strong> {selectedStudent.ci || selectedStudent.id}</p>
                      <p><strong className="text-gray-700">Grado:</strong> {selectedStudent.grade} Sección "{selectedStudent.section || "A"}"</p>
                      <p><strong className="text-gray-700">Representante:</strong> {selectedStudent.repName || (selectedStudent as any).repFirstName || "Registrado"}</p>
                    </div>
                  )}
                </div>
              ) : (
                /* MODO MASIVO: FILTROS DE AULA */
                <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-sm flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <span className="text-xs font-black uppercase text-gray-400 tracking-wider flex items-center gap-2">
                      <Users size={16} className="text-blue-600" /> Emisión Masiva por Aula
                    </span>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                      {studentsInClass.length} estudiantes
                    </span>
                  </div>

                  {/* Filtro Nivel */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black uppercase text-gray-500">Nivel:</label>
                    <select
                      value={filterNivel}
                      onChange={(e) => {
                        const newNiv = e.target.value as AcademicLevel;
                        setFilterNivel(newNiv);
                        setFilterGrado(GRADES_BY_LEVEL[newNiv][0] || "");
                      }}
                      className="border border-gray-300 rounded-xl p-2.5 bg-white text-xs font-bold text-gray-800"
                    >
                      {ACADEMIC_LEVELS.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>

                  {/* Filtro Grado */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black uppercase text-gray-500">Grado / Año:</label>
                    <select
                      value={filterGrado}
                      onChange={(e) => setFilterGrado(e.target.value)}
                      className="border border-gray-300 rounded-xl p-2.5 bg-white text-xs font-bold text-gray-800"
                    >
                      {GRADES_BY_LEVEL[filterNivel].map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>

                  {/* Filtro Sección */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black uppercase text-gray-500">Sección:</label>
                    <select
                      value={filterSeccion}
                      onChange={(e) => setFilterSeccion(e.target.value)}
                      className="border border-gray-300 rounded-xl p-2.5 bg-white text-xs font-bold text-gray-800"
                    >
                      {SECTIONS.map(s => <option key={s} value={s}>Sección {s}</option>)}
                    </select>
                  </div>

                  {/* Lista con checkboxes */}
                  <div className="mt-2 border-t border-gray-100 pt-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold text-gray-500 uppercase">
                        Seleccionados ({selectedStudentIds.length}/{studentsInClass.length}):
                      </span>
                      <button
                        onClick={handleSelectAllStudents}
                        className="text-[10px] font-black text-[#5564eb] hover:underline"
                      >
                        {selectedStudentIds.length === studentsInClass.length ? "Deseleccionar todos" : "Seleccionar todos"}
                      </button>
                    </div>

                    <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                      {studentsInClass.map(st => {
                        const checked = selectedStudentIds.includes(st.id);
                        return (
                          <label
                            key={st.id}
                            className={`p-2.5 rounded-xl border flex items-center gap-2.5 text-xs font-medium cursor-pointer transition ${
                              checked ? "bg-blue-50/60 border-blue-300" : "bg-white border-gray-200"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handleToggleSelectStudent(st.id)}
                              className="w-4 h-4 accent-[#5564eb] rounded"
                            />
                            <span className="truncate text-gray-800 font-bold">
                              {st.firstName} {st.lastName}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono ml-auto">
                              {st.ci || st.id}
                            </span>
                          </label>
                        );
                      })}
                      {studentsInClass.length === 0 && (
                        <p className="text-center py-6 text-gray-400 text-xs font-semibold">
                          No hay estudiantes matriculados en esta sección.
                        </p>
                      )}
                    </div>

                    {/* Botón de exportación masiva */}
                    <button
                      onClick={handleExportBatchDocx}
                      disabled={selectedStudentIds.length === 0}
                      className="w-full mt-4 bg-[#5564eb] hover:bg-[#4250d4] text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Download size={16} /> Exportar {selectedStudentIds.length} Documentos en Word (.DOCX)
                    </button>
                  </div>
                </div>
              )}

              {/* ACCIONES DE EXPORTACIÓN DIRECTA (MODO INDIVIDUAL) */}
              {emissionMode === "individual" && (
                <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-sm flex flex-col gap-3">
                  <span className="text-xs font-black uppercase text-gray-400 tracking-wider block mb-1">
                    Acciones de Exportación
                  </span>

                  <button
                    onClick={handleExportDocx}
                    className="w-full bg-[#5564eb] hover:bg-[#4250d4] text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Download size={16} /> Descargar en Word (.DOCX)
                  </button>

                  <button
                    onClick={handlePrintPdf}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition shadow-sm flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Printer size={16} /> Imprimir / Guardar en PDF
                  </button>

                  <button
                    onClick={() => setIsEditingLastMinute(!isEditingLastMinute)}
                    className="w-full border border-gray-300 hover:border-blue-400 hover:text-[#5564eb] text-gray-700 font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center gap-2"
                  >
                    <Edit3 size={15} />
                    {isEditingLastMinute ? "Bloquear Edición Manual" : "Editar Documento de Última Hora"}
                  </button>
                </div>
              )}

            </div>

            {/* COLUMNA DERECHA: HOJA DE PREVISUALIZACIÓN Y CONTROLES (PRINTABLE) */}
            <div className="lg:col-span-8 flex flex-col gap-4">

              {/* BARRA DE CONTROL DE LOGOS Y ACCIONES (NO PRINT) */}
              <div className="bg-white rounded-2xl p-3 px-4 border border-gray-200/80 shadow-sm flex flex-wrap items-center justify-between gap-3 no-print">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-xs font-black uppercase tracking-wider text-gray-500 mr-1 flex items-center gap-1.5">
                    Logos en Membrete:
                  </span>

                  {/* Toggle Logo MPPE */}
                  <button
                    type="button"
                    onClick={() => {
                      const next = mppePosition === "none" ? (activeTemplate?.logoSettings?.mppePosition && activeTemplate.logoSettings.mppePosition !== "none" ? activeTemplate.logoSettings.mppePosition : "left") : "none";
                      handleSetMppePosition(next);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
                      mppePosition !== "none"
                        ? "bg-blue-50 text-[#5564eb] border-blue-200 shadow-2xs font-black"
                        : "bg-gray-100 text-gray-400 border-gray-200 hover:text-gray-600 line-through opacity-70"
                    }`}
                    title={mppePosition !== "none" ? "Hacer clic para DESHABILITAR el Logo MPPE" : "Hacer clic para HABILITAR el Logo MPPE"}
                  >
                    <span>🇻🇪</span>
                    <span>Logo MPPE</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                      mppePosition !== "none" ? "bg-[#5564eb] text-white" : "bg-gray-200 text-gray-500"
                    }`}>
                      {mppePosition !== "none" ? "Visible" : "Deshabilitado"}
                    </span>
                  </button>

                  {/* Toggle Logo Institución */}
                  <button
                    type="button"
                    onClick={() => {
                      const next = instPosition === "none" ? (activeTemplate?.logoSettings?.instPosition && activeTemplate.logoSettings.instPosition !== "none" ? activeTemplate.logoSettings.instPosition : "right") : "none";
                      handleSetInstPosition(next);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
                      instPosition !== "none"
                        ? "bg-blue-50 text-[#5564eb] border-blue-200 shadow-2xs font-black"
                        : "bg-gray-100 text-gray-400 border-gray-200 hover:text-gray-600 line-through opacity-70"
                    }`}
                    title={instPosition !== "none" ? "Hacer clic para DESHABILITAR el Logo de la Institución" : "Hacer clic para HABILITAR el Logo de la Institución"}
                  >
                    <span>🏫</span>
                    <span>Logo Institución</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                      instPosition !== "none" ? "bg-[#5564eb] text-white" : "bg-gray-200 text-gray-500"
                    }`}>
                      {instPosition !== "none" ? "Visible" : "Deshabilitado"}
                    </span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPrintPreviewModalOpen(true)}
                    className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                    title="Abrir vista previa del documento antes de imprimir o guardar en PDF"
                  >
                    <Eye size={14} /> Vista Previa & PDF
                  </button>
                </div>
              </div>

              {isEditingLastMinute && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 font-medium no-print">
                  <div className="flex items-center gap-3">
                    <AlertCircle size={20} className="text-amber-600 shrink-0" />
                    <div>
                      <p className="font-bold text-amber-950">
                        Modo de Edición de Última Hora Activo
                      </p>
                      <p className="text-[11px] text-amber-800">
                        Puedes <strong>arrastrar los logotipos libremente</strong> con el puntero para moverlos a cualquier posición, ajustar sus tamaños con <strong>(+)</strong> y <strong>(-)</strong>, y retocar el texto directamente sobre la hoja.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {mppePosition === "none" && (
                      <button
                        type="button"
                        onClick={() => handleSetMppePosition("left")}
                        className="px-2.5 py-1 bg-white hover:bg-blue-50 border border-blue-200 text-[#5564eb] text-xs font-bold rounded-xl transition flex items-center gap-1"
                      >
                        <Plus size={13} /> Mostrar MPPE
                      </button>
                    )}
                    {instPosition === "none" && (
                      <button
                        type="button"
                        onClick={() => handleSetInstPosition("right")}
                        className="px-2.5 py-1 bg-white hover:bg-blue-50 border border-blue-200 text-[#5564eb] text-xs font-bold rounded-xl transition flex items-center gap-1"
                      >
                        <Plus size={13} /> Mostrar Institución
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => sheetMppeInputRef.current?.click()}
                      className="px-2.5 py-1 bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold rounded-xl transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                      title="Cambiar la imagen del Logo MPPE / Escudo"
                    >
                      <UploadCloud size={13} /> Cambiar Logo MPPE
                    </button>
                    <button
                      type="button"
                      onClick={() => sheetInstInputRef.current?.click()}
                      className="px-2.5 py-1 bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold rounded-xl transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                      title="Cambiar la imagen del Logo Institucional"
                    >
                      <UploadCloud size={13} /> Cambiar Logo Institución
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleUpdateMppeOffset({ x: 0, y: 0 });
                        handleUpdateInstOffset({ x: 0, y: 0 });
                        showToast("info", "Posiciones libres de logos restablecidas.");
                      }}
                      className="px-3 py-1.5 bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold rounded-xl transition shadow-2xs flex items-center gap-1.5"
                    >
                      <RotateCcw size={13} /> Resetear Desplazamiento
                    </button>
                  </div>
                </div>
              )}

              {/* Inputs de archivo ocultos para edición en la hoja */}
              <input 
                type="file" 
                ref={sheetMppeInputRef} 
                accept="image/png,image/jpeg,image/svg+xml,image/webp" 
                className="hidden" 
                onChange={handleSheetUploadLogoMppe} 
              />
              <input 
                type="file" 
                ref={sheetInstInputRef} 
                accept="image/png,image/jpeg,image/svg+xml,image/webp" 
                className="hidden" 
                onChange={handleSheetUploadLogoInst} 
              />

              {/* LA HOJA FÍSICA SIMULADA */}
              <div 
                ref={printAreaRef}
                id="print-document-sheet"
                className={`bg-white rounded-2xl shadow-xl border border-gray-300 p-8 sm:p-14 md:p-16 flex flex-col justify-between ${
                  paperSize === "Oficio" ? "min-h-[1250px]" : paperSize === "A4" ? "min-h-[1100px]" : "min-h-[980px]"
                } text-gray-900 relative transition-all`}
                style={{ fontFamily: "'Times New Roman', Times, serif" }}
              >
                <div>
                  {/* ENCABEZADO INSTITUCIONAL CON LOGOS */}
                  <div className="pb-4 mb-6 border-b border-gray-300">
                    {/* RENDERIZADOR UNIFICADO DE LOGOS CON HITBOX CEÑIDO O EDITABLE */}
                    {(() => {
                      const renderDraggableLogo = (lg: typeof leftLogos[0]) => (
                        <motion.div
                          key={lg.id}
                          drag={isEditingLastMinute}
                          dragMomentum={false}
                          animate={{ x: lg.offset.x, y: lg.offset.y }}
                          onDragEnd={(_e, info) => {
                            lg.setOffset((prev: { x: number; y: number }) => ({
                              x: Math.round(prev.x + info.offset.x),
                              y: Math.round(prev.y + info.offset.y)
                            }));
                          }}
                          style={{ touchAction: "none" }}
                          className={`relative inline-flex flex-col items-center select-none ${
                            isEditingLastMinute 
                              ? "cursor-grab active:cursor-grabbing border-2 border-dashed border-[#5564eb] bg-blue-50/40 p-1 rounded-xl shadow-md z-20" 
                              : ""
                          }`}
                        >
                          <img 
                            src={lg.src} 
                            alt={lg.alt} 
                            draggable={false}
                            style={{ 
                              maxWidth: `${lg.size}px`, 
                              width: lg.height && lg.height !== "auto" ? "auto" : `${lg.size}px`, 
                              height: lg.height && lg.height !== "auto" ? `${lg.height}px` : "auto", 
                              maxHeight: lg.height && lg.height !== "auto" ? `${lg.height}px` : `${lg.size}px`, 
                              objectFit: "contain", 
                              display: "block" 
                            }}
                            className="pointer-events-none drop-shadow-2xs" 
                          />

                          {isEditingLastMinute && (
                            <div 
                              className="absolute -bottom-9 left-1/2 -translate-x-1/2 bg-gray-900/95 text-white px-2.5 py-1 rounded-xl shadow-2xl flex items-center gap-1.5 text-[10px] font-bold z-30 pointer-events-auto whitespace-nowrap border border-gray-700/80 backdrop-blur-sm"
                              onMouseDown={(e) => e.stopPropagation()}
                            >
                              <Move size={11} className="text-blue-300 shrink-0" />
                              
                              {/* Control Ancho */}
                              <div className="flex items-center gap-1 bg-gray-800/90 px-1.5 py-0.5 rounded-lg border border-gray-700">
                                <span className="text-[9px] text-gray-400 font-bold">Ancho:</span>
                                <button
                                  type="button"
                                  onClick={() => lg.setSize((s: number) => Math.max(25, s - 5))}
                                  className="w-4 h-4 flex items-center justify-center rounded bg-gray-700 hover:bg-gray-600 text-amber-300 font-black cursor-pointer transition active:scale-90"
                                  title="Reducir ancho (-5px)"
                                >
                                  <Minus size={9} />
                                </button>
                                <span className="font-mono text-gray-100 min-w-[34px] text-center text-[10px]">{lg.size}px</span>
                                <button
                                  type="button"
                                  onClick={() => lg.setSize((s: number) => Math.min(320, s + 5))}
                                  className="w-4 h-4 flex items-center justify-center rounded bg-gray-700 hover:bg-gray-600 text-emerald-300 font-black cursor-pointer transition active:scale-90"
                                  title="Aumentar ancho (+5px)"
                                >
                                  <Plus size={9} />
                                </button>
                              </div>

                              {/* Control Alto / Hitbox */}
                              <div className="flex items-center gap-1 bg-gray-800/90 px-1.5 py-0.5 rounded-lg border border-gray-700">
                                <span className="text-[9px] text-gray-400 font-bold">Alto:</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    lg.setHeight((h: number | "auto") => {
                                      const current = (h === "auto" || !h) ? Math.round(lg.size * 0.4) : h;
                                      return Math.max(20, current - 5);
                                    });
                                  }}
                                  className="w-4 h-4 flex items-center justify-center rounded bg-gray-700 hover:bg-gray-600 text-amber-300 font-black cursor-pointer transition active:scale-90"
                                  title="Reducir alto de hitbox (-5px)"
                                >
                                  <Minus size={9} />
                                </button>
                                <span className="font-mono text-gray-100 min-w-[40px] text-center text-[10px]">
                                  {lg.height === "auto" || !lg.height ? "Ceñido" : `${lg.height}px`}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    lg.setHeight((h: number | "auto") => {
                                      const current = (h === "auto" || !h) ? Math.round(lg.size * 0.4) : h;
                                      return Math.min(300, current + 5);
                                    });
                                  }}
                                  className="w-4 h-4 flex items-center justify-center rounded bg-gray-700 hover:bg-gray-600 text-emerald-300 font-black cursor-pointer transition active:scale-90"
                                  title="Aumentar alto de hitbox (+5px)"
                                >
                                  <Plus size={9} />
                                </button>
                                {lg.height !== "auto" && lg.height !== undefined && (
                                  <button
                                    type="button"
                                    onClick={() => lg.setHeight("auto")}
                                    className="px-1.5 py-0.5 rounded bg-indigo-700 hover:bg-indigo-600 text-[8px] text-indigo-100 font-bold cursor-pointer transition"
                                    title="Ajustar hitbox exactamente ceñido al contorno de la imagen"
                                  >
                                    📐 Ceñir
                                  </button>
                                )}
                              </div>

                              <span className="text-gray-600">|</span>

                              <button
                                type="button"
                                onClick={() => lg.setOffset({ x: 0, y: 0 })}
                                className="px-1.5 py-0.5 rounded bg-gray-800 hover:bg-gray-700 text-[9px] text-gray-300 cursor-pointer"
                                title="Centrar / Restablecer desplazamiento a (0, 0)"
                              >
                                Centrar
                              </button>

                              <button
                                type="button"
                                onClick={() => lg.id === "mppe" ? sheetMppeInputRef.current?.click() : sheetInstInputRef.current?.click()}
                                className="px-1.5 py-0.5 rounded bg-blue-900/60 hover:bg-blue-800 text-blue-200 text-[9px] cursor-pointer flex items-center gap-0.5"
                                title="Cambiar imagen de este logo"
                              >
                                <UploadCloud size={10} /> Cambiar
                              </button>

                              <button
                                type="button"
                                onClick={() => lg.setPos("none")}
                                className="w-5 h-5 flex items-center justify-center rounded bg-red-900/60 hover:bg-red-800 text-red-200 cursor-pointer"
                                title="Ocultar logo"
                              >
                                <X size={11} />
                              </button>
                            </div>
                          )}
                        </motion.div>
                      );

                      return (
                        <>
                          {/* LOGOS CENTRADOS SI HAY ALGUNO CONFIGURADO */}
                          {centerLogos.length > 0 && (
                            <div className="flex justify-center items-center gap-4 mb-3">
                              {centerLogos.map(renderDraggableLogo)}
                            </div>
                          )}

                          <div className="flex items-center justify-between gap-4">
                            {/* LOGOS IZQUIERDA */}
                            <div 
                              className="flex items-center justify-start gap-2 shrink-0"
                              style={{ minWidth: `${Math.max(leftWidth, rightWidth)}px` }}
                            >
                              {leftLogos.map(renderDraggableLogo)}
                              {leftLogos.length === 0 && rightLogos.length > 0 && (
                                <div style={{ width: `${rightWidth}px` }} className="invisible" aria-hidden="true" />
                              )}
                            </div>

                            {/* TEXTO DE ENCABEZADO / MEMBRETE */}
                            <div className="flex-1 text-center">
                              {isEditingLastMinute ? (
                                <textarea
                                  value={lastMinuteDoc.encabezado}
                                  onChange={(e) => setLastMinuteDoc(prev => ({ ...prev, encabezado: e.target.value }))}
                                  className="w-full text-center text-xs font-bold border border-amber-300 rounded-lg p-2 outline-none focus:ring-2 focus:ring-amber-400 bg-amber-50/30"
                                  rows={4}
                                />
                              ) : (
                                lastMinuteDoc.encabezado.split("\n").map((line, idx) => (
                                  <p key={idx} className="text-xs sm:text-sm font-bold uppercase tracking-wide leading-tight text-gray-800">
                                    {line}
                                  </p>
                                ))
                              )}
                            </div>

                            {/* LOGOS DERECHA */}
                            <div 
                              className="flex items-center justify-end gap-2 shrink-0"
                              style={{ minWidth: `${Math.max(leftWidth, rightWidth)}px` }}
                            >
                              {rightLogos.map(renderDraggableLogo)}
                              {rightLogos.length === 0 && leftLogos.length > 0 && (
                                <div style={{ width: `${leftWidth}px` }} className="invisible" aria-hidden="true" />
                              )}
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* TÍTULO DEL DOCUMENTO */}
                  <div className="text-center my-8">
                    {isEditingLastMinute ? (
                      <input
                        type="text"
                        value={lastMinuteDoc.titulo}
                        onChange={(e) => setLastMinuteDoc(prev => ({ ...prev, titulo: e.target.value }))}
                        className="w-full text-center text-lg sm:text-xl font-black underline border border-amber-300 rounded-lg p-2 outline-none uppercase bg-amber-50/30"
                      />
                    ) : (
                      <h2 className="text-lg sm:text-xl md:text-2xl font-black uppercase underline tracking-wider text-gray-900">
                        {lastMinuteDoc.titulo}
                      </h2>
                    )}
                  </div>

                  {/* CUERPO DEL DOCUMENTO */}
                  <div className="text-justify my-8 leading-relaxed text-sm sm:text-base space-y-4">
                    {isEditingLastMinute ? (
                      <textarea
                        value={lastMinuteDoc.cuerpo}
                        onChange={(e) => setLastMinuteDoc(prev => ({ ...prev, cuerpo: e.target.value }))}
                        className="w-full text-justify text-sm sm:text-base border border-amber-300 rounded-xl p-4 outline-none focus:ring-2 focus:ring-amber-400 leading-relaxed min-h-[300px] bg-amber-50/30 font-serif"
                      />
                    ) : (
                      lastMinuteDoc.cuerpo.split("\n\n").map((paragraph, pIdx) => (
                        <p key={pIdx} className="indent-8 leading-8 text-gray-900">
                          {paragraph.split(/(\*\*.*?\*\*)/g).map((part, partIdx) => {
                            if (part.startsWith("**") && part.endsWith("**")) {
                              return <strong key={partIdx}>{part.slice(2, -2)}</strong>;
                            }
                            return part;
                          })}
                        </p>
                      ))
                    )}
                  </div>
                </div>

                {/* PIE DE PÁGINA (FIRMAS Y SELLO) */}
                {renderSignatureBlocks(lastMinuteDoc.piePagina, isEditingLastMinute)}

              </div>
            </div>

          </div>
        </div>
      ) : (
        <div className="w-full bg-white rounded-3xl shadow-sm border border-gray-200/80 p-6 md:p-8 flex flex-col gap-6">

          {/* CABECERA DEL GESTOR */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-6">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900">
                Gestor y Editor de Plantillas Oficiales
              </h2>
              <p className="text-xs text-gray-500 font-medium mt-1">
                Configura los documentos institucionales, personaliza la redacción y utiliza palabras clave con 1 clic.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleOpenNewTemplate}
                className="bg-[#5564eb] hover:bg-[#4250d4] text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-md flex items-center gap-2 active:scale-95 cursor-pointer"
              >
                <Plus size={16} /> Crear Nueva Plantilla
              </button>
            </div>
          </div>

          {/* LISTA DE PLANTILLAS GUARDADAS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {templates.map(tpl => (
              <div 
                key={tpl.id}
                className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group hover:border-blue-300"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="font-mono text-[10px] font-black bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg border border-gray-200">
                      {tpl.codigo || "DOC"}
                    </span>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                      {tpl.categoria || "Oficial"}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-base text-gray-900 mb-1.5 group-hover:text-[#5564eb] transition">
                    {tpl.nombre}
                  </h3>

                  <p className="text-xs text-gray-500 line-clamp-2 font-medium mb-4">
                    {tpl.descripcion || tpl.titulo}
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setSelectedTemplateId(tpl.id);
                      setActiveTab("emitir");
                    }}
                    className="text-xs font-bold text-[#5564eb] hover:text-[#4250d4] flex items-center gap-1"
                  >
                    <Eye size={14} /> Usar Plantilla
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditTemplate(tpl)}
                      className="p-2 text-gray-500 hover:text-[#5564eb] hover:bg-blue-50 rounded-xl transition"
                      title="Editar plantilla"
                    >
                      <Edit3 size={15} />
                    </button>

                    <button
                      onClick={() => {
                        setTemplateToDelete(tpl);
                        setDeleteModalOpen(true);
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                      title="Eliminar plantilla"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDITOR DE PLANTILLA (WYSIWYG CON ETIQUETAS DINÁMICAS) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {templateEditorOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-6xl w-full max-h-[92vh] flex flex-col text-left overflow-hidden"
            >
              {/* Encabezado fijo del modal */}
              <div className="p-5 px-6 md:px-8 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 text-[#5564eb] rounded-xl border border-blue-100">
                    <FileText size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900 leading-snug">
                      {editingTemplate ? "Modificar Plantilla de Documento" : "Crear Nueva Plantilla Institucional"}
                    </h3>
                    <p className="text-xs text-gray-500 font-semibold leading-normal mt-0.5">
                      Inserta variables dinámicas con un solo clic para rellenar datos automáticamente.
                    </p>
                  </div>
                </div>
              </div>

              {/* Formulario / Cuerpo con scroll limpio */}
              <div className="p-6 md:p-8 space-y-6 flex-1 overflow-y-auto">
                <form id="template-editor-form" onSubmit={handleSaveTemplate} className="space-y-6">

                  {/* Campos Básicos */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="flex flex-col gap-1 md:col-span-2">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Nombre de la Plantilla *
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Carta de Aceptación, Justificativo de Inasistencia..."
                        value={formTemplate.nombre}
                        onChange={(e) => setFormTemplate(prev => ({ ...prev, nombre: e.target.value }))}
                        className="border border-gray-300 rounded-xl p-3 bg-white text-sm font-bold text-gray-900 outline-none focus:border-[#5564eb] focus:ring-2 focus:ring-[#5564eb]/20 shadow-sm"
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Código / Ref
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: CONST-02"
                        value={formTemplate.codigo}
                        onChange={(e) => setFormTemplate(prev => ({ ...prev, codigo: e.target.value.toUpperCase() }))}
                        className="border border-gray-300 rounded-xl p-3 bg-white text-xs font-mono font-bold text-gray-800 outline-none focus:border-[#5564eb] focus:ring-2 focus:ring-[#5564eb]/20 shadow-sm"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center justify-between">
                        <span>Tamaño Hoja</span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {formTemplate.paperSize === "Carta" ? "216×279" : formTemplate.paperSize === "Oficio" ? "216×356" : "210×297"}
                        </span>
                      </label>
                      <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200">
                        {(["Carta", "Oficio", "A4"] as PaperSize[]).map((sz) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => setFormTemplate(prev => ({ ...prev, paperSize: sz }))}
                            className={`py-2 text-xs font-bold rounded-lg transition-all ${
                              formTemplate.paperSize === sz
                                ? "bg-[#5564eb] text-white shadow-xs font-black"
                                : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                            }`}
                          >
                            {sz}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Título Oficial */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Título Oficial del Documento
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: CONSTANCIA DE ESTUDIO"
                      value={formTemplate.titulo}
                      onChange={(e) => setFormTemplate(prev => ({ ...prev, titulo: e.target.value.toUpperCase() }))}
                      className="border border-gray-300 rounded-xl p-2.5 bg-white text-sm font-black text-gray-900 outline-none focus:border-[#5564eb] focus:ring-2 focus:ring-[#5564eb]/20 shadow-sm"
                    />
                  </div>

                  {/* ========================================================================= */}
                  {/* ÁREA DE TRABAJO EN 2 COLUMNAS: TEXTO A LA IZQUIERDA Y PALABRAS CLAVE AL LADO */}
                  {/* ========================================================================= */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start pt-1">

                    {/* COLUMNA IZQUIERDA: ENCABEZADO, CUERPO Y PIE SEGUIDOS SIN INTERRUPCIÓN */}
                    <div className="lg:col-span-7 space-y-4">

                      {/* 1. ENCABEZADO / MEMBRETE */}
                      <div className={`p-3.5 rounded-2xl border transition-all ${tagTargetField === "encabezado" ? "bg-blue-50/40 border-blue-300 ring-2 ring-[#5564eb]/20" : "bg-white border-gray-200"}`}>
                        <div className="flex flex-wrap items-center justify-between gap-1 mb-1.5">
                          <label className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                            <FileSignature size={14} className="text-[#5564eb]" />
                            Encabezado / Membrete Institucional
                          </label>
                          {tagTargetField === "encabezado" && (
                            <span className="text-[10px] font-bold text-[#5564eb] bg-blue-100/70 px-2 py-0.5 rounded-full">
                              📍 Puntero activo aquí
                            </span>
                          )}
                        </div>

                        {/* Atajos rápidos de palabras clave para Encabezado */}
                        <div className="flex flex-wrap items-center gap-1.5 mb-2">
                          <span className="text-[10px] font-bold uppercase text-gray-400">Insertar rápido:</span>
                          {["[Nombre Plantel]", "[Código DEA]", "[Municipio y Estado]", "[Fecha Actual]"].map(chip => (
                            <button
                              key={chip}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => handleInsertTag(chip, "encabezado")}
                              className="text-[10px] font-bold text-[#5564eb] bg-white hover:bg-[#5564eb] hover:text-white border border-blue-200 px-2 py-0.5 rounded-lg transition shadow-2xs cursor-pointer"
                              title={`Insertar ${chip} en el encabezado`}
                            >
                              + {chip.replace(/[[\]]/g, '')}
                            </button>
                          ))}
                        </div>

                        <textarea
                          ref={encabezadoInputRef}
                          rows={3}
                          value={formTemplate.encabezado}
                          onChange={(e) => {
                            setFormTemplate(prev => ({ ...prev, encabezado: e.target.value }));
                            handleRecordSelection("encabezado", e.target);
                          }}
                          onSelect={(e) => handleRecordSelection("encabezado", e.currentTarget)}
                          onClick={(e) => handleRecordSelection("encabezado", e.currentTarget)}
                          onKeyUp={(e) => handleRecordSelection("encabezado", e.currentTarget)}
                          onFocus={(e) => handleRecordSelection("encabezado", e.currentTarget)}
                          className="w-full border border-gray-300 rounded-xl p-3 bg-white text-xs font-mono font-bold text-gray-800 outline-none focus:border-[#5564eb] focus:ring-1 focus:ring-[#5564eb]/30 shadow-xs"
                          placeholder="REPÚBLICA BOLIVARIANA DE VENEZUELA..."
                        />
                      </div>

                      {/* 2. CUERPO DEL TEXTO PRINCIPAL */}
                      <div className={`p-3.5 rounded-2xl border transition-all ${tagTargetField === "cuerpo" ? "bg-blue-50/40 border-blue-300 ring-2 ring-[#5564eb]/20" : "bg-white border-gray-200"}`}>
                        <div className="flex flex-wrap items-center justify-between gap-1 mb-1.5">
                          <label className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                            <FileText size={14} className="text-[#5564eb]" />
                            Cuerpo del Texto Principal *
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-400 font-medium">**texto** para negrita</span>
                            {tagTargetField === "cuerpo" && (
                              <span className="text-[10px] font-bold text-[#5564eb] bg-blue-100/70 px-2 py-0.5 rounded-full">
                                📍 Puntero activo aquí
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Atajos rápidos de palabras clave para Cuerpo */}
                        <div className="flex flex-wrap items-center gap-1.5 mb-2">
                          <span className="text-[10px] font-bold uppercase text-gray-400">Insertar rápido:</span>
                          {["[Nombre Completo]", "[Cédula Alumno]", "[Grado y Sección]", "[Periodo Escolar]", "[Fecha Actual]"].map(chip => (
                            <button
                              key={chip}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => handleInsertTag(chip, "cuerpo")}
                              className="text-[10px] font-bold text-[#5564eb] bg-white hover:bg-[#5564eb] hover:text-white border border-blue-200 px-2 py-0.5 rounded-lg transition shadow-2xs cursor-pointer"
                              title={`Insertar ${chip} en el cuerpo`}
                            >
                              + {chip.replace(/[[\]]/g, '')}
                            </button>
                          ))}
                        </div>

                        <textarea
                          ref={cuerpoInputRef}
                          rows={8}
                          value={formTemplate.cuerpo}
                          onChange={(e) => {
                            setFormTemplate(prev => ({ ...prev, cuerpo: e.target.value }));
                            handleRecordSelection("cuerpo", e.target);
                          }}
                          onSelect={(e) => handleRecordSelection("cuerpo", e.currentTarget)}
                          onClick={(e) => handleRecordSelection("cuerpo", e.currentTarget)}
                          onKeyUp={(e) => handleRecordSelection("cuerpo", e.currentTarget)}
                          onFocus={(e) => handleRecordSelection("cuerpo", e.currentTarget)}
                          className="w-full border border-gray-300 rounded-xl p-3.5 bg-white text-sm leading-relaxed text-gray-900 outline-none focus:border-[#5564eb] focus:ring-1 focus:ring-[#5564eb]/30 shadow-xs font-sans"
                          placeholder="Redacta el texto base del documento..."
                          required
                        />
                      </div>

                      {/* 3. PIE DE PÁGINA (MÚLTIPLES FIRMAS) */}
                      <div className={`p-4 rounded-2xl border transition-all ${tagTargetField === "piePagina" ? "bg-blue-50/40 border-blue-300 ring-2 ring-[#5564eb]/20" : "bg-white border-gray-200"}`}>
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <FileSignature size={16} className="text-[#5564eb]" />
                            <label className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                              Firmas del Documento (Pie de Página)
                            </label>
                            <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                              {formSignatures.length} {formSignatures.length === 1 ? "firma" : "firmas"}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={handleAddSignature}
                            className="px-3 py-1.5 rounded-xl bg-[#5564eb] hover:bg-[#4250d4] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                          >
                            <Plus size={14} /> Añadir Otra Firma
                          </button>
                        </div>

                        <p className="text-[11px] text-gray-500 font-medium mb-3">
                          Puedes colocar varias firmas y ordenarlas a la <b>Izquierda</b>, <b>Centro</b> o <b>Derecha</b> al igual que los logotipos (ej. Director a la izquierda y Representante a la derecha).
                        </p>

                        {/* Atajos rápidos de palabras clave para Pie de Página */}
                        <div className="flex flex-wrap items-center gap-1.5 mb-3 p-2 bg-gray-50 rounded-xl border border-gray-200/70">
                          <span className="text-[10px] font-bold uppercase text-gray-400">Insertar en firma activa:</span>
                          {["[Nombre Director]", "[Nombre Representante]", "[Cédula Representante]", "[Fecha Actual]", "[Año Actual]"].map(chip => (
                            <button
                              key={chip}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => handleInsertTag(chip, "piePagina")}
                              className="text-[10px] font-bold text-[#5564eb] bg-white hover:bg-[#5564eb] hover:text-white border border-blue-200 px-2 py-0.5 rounded-lg transition shadow-2xs cursor-pointer"
                              title={`Insertar ${chip} en la firma seleccionada`}
                            >
                              + {chip.replace(/[[\]]/g, '')}
                            </button>
                          ))}
                        </div>

                        {/* Lista de bloques de firmas */}
                        <div className="space-y-3">
                          {formSignatures.map((sig, idx) => {
                            const isActive = activeSignatureId === sig.id && tagTargetField === "piePagina";
                            return (
                              <div 
                                key={sig.id}
                                className={`p-3.5 rounded-xl border transition-all ${
                                  isActive ? "bg-white border-[#5564eb] shadow-sm ring-1 ring-[#5564eb]/20" : "bg-gray-50/70 border-gray-200"
                                }`}
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full bg-blue-100 text-[#5564eb] text-[11px] font-black flex items-center justify-center">
                                      {idx + 1}
                                    </span>
                                    <span className="text-xs font-bold text-gray-700">
                                      Firma #{idx + 1}
                                    </span>
                                    {isActive && (
                                      <span className="text-[9px] font-bold text-[#5564eb] bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">
                                        📍 Puntero activo
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-3">
                                    {/* Selector de alineación: Izquierda, Centro, Derecha */}
                                    <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-gray-200 shadow-2xs">
                                      {(["left", "center", "right"] as SignaturePosition[]).map(pos => {
                                        const label = pos === "left" ? "Izquierda" : pos === "center" ? "Centro" : "Derecha";
                                        const isSelected = sig.posicion === pos;
                                        return (
                                          <button
                                            key={pos}
                                            type="button"
                                            onClick={() => handleUpdateSignaturePos(sig.id, pos)}
                                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                                              isSelected 
                                                ? "bg-[#5564eb] text-white shadow-2xs" 
                                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                            }`}
                                          >
                                            {label}
                                          </button>
                                        );
                                      })}
                                    </div>

                                    {formSignatures.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveSignature(sig.id)}
                                        className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 border border-red-200 transition cursor-pointer"
                                        title="Eliminar esta firma"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    )}
                                  </div>
                                </div>

                                <textarea
                                  id={`sig-textarea-${sig.id}`}
                                  rows={3}
                                  value={sig.texto}
                                  onChange={(e) => {
                                    handleUpdateSignatureText(sig.id, e.target.value);
                                    setActiveSignatureId(sig.id);
                                    setTagTargetField("piePagina");
                                    lastActiveTargetRef.current = "piePagina";
                                    lastSelectionRef.current = { start: e.target.selectionStart, end: e.target.selectionEnd };
                                  }}
                                  onSelect={(e) => {
                                    setActiveSignatureId(sig.id);
                                    setTagTargetField("piePagina");
                                    lastActiveTargetRef.current = "piePagina";
                                    lastSelectionRef.current = { start: e.currentTarget.selectionStart, end: e.currentTarget.selectionEnd };
                                  }}
                                  onClick={(e) => {
                                    setActiveSignatureId(sig.id);
                                    setTagTargetField("piePagina");
                                    lastActiveTargetRef.current = "piePagina";
                                    lastSelectionRef.current = { start: e.currentTarget.selectionStart, end: e.currentTarget.selectionEnd };
                                  }}
                                  onFocus={(e) => {
                                    setActiveSignatureId(sig.id);
                                    setTagTargetField("piePagina");
                                    lastActiveTargetRef.current = "piePagina";
                                    lastSelectionRef.current = { start: e.currentTarget.selectionStart, end: e.currentTarget.selectionEnd };
                                  }}
                                  className="w-full border border-gray-300 rounded-xl p-3 bg-white text-xs font-mono font-medium text-gray-800 outline-none focus:border-[#5564eb] focus:ring-1 focus:ring-[#5564eb]/30 shadow-xs"
                                  placeholder="_____________________________\n[Nombre Director]..."
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* 4. CONFIGURACIÓN DE LOGOTIPOS EN MEMBRETE (ACORDEÓN DESPLEGABLE AL FINAL) */}
                      <div className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden shadow-2xs">
                        <button
                          type="button"
                          onClick={() => setTemplateLogoConfigOpen(!templateLogoConfigOpen)}
                          className="w-full p-3.5 px-4 flex items-center justify-between text-left hover:bg-gray-100/80 transition cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <Sliders size={16} className="text-[#5564eb]" />
                            <span className="text-xs font-bold text-gray-800">
                              Configuración de Logotipos en Membrete de esta Plantilla
                            </span>
                            <span className="text-[10px] font-bold text-gray-400 bg-white px-2 py-0.5 rounded border border-gray-200">
                              Opcional
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold">
                            <span>{templateLogoConfigOpen ? "Ocultar ajustes" : "Mostrar ajustes"}</span>
                            {templateLogoConfigOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </div>
                        </button>

                        {templateLogoConfigOpen && (
                          <div className="p-4 pt-2 space-y-4 border-t border-gray-200 bg-white">
                            <p className="text-[11px] text-gray-500 font-medium">
                              Personaliza de forma independiente la activación, posición y tamaño en píxeles de cada logo para este documento.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* LOGO MPPE */}
                              <div className={`p-4 rounded-xl border transition-all ${formTemplate.logoSettings.mppeVisible ? "bg-white border-blue-200 shadow-2xs" : "bg-gray-100/60 border-gray-200 opacity-70"}`}>
                                <div className="flex items-center justify-between mb-3">
                                  <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={formTemplate.logoSettings.mppeVisible}
                                      onChange={(e) => {
                                        const checked = e.target.checked;
                                        setFormTemplate(prev => ({
                                          ...prev,
                                          logoSettings: {
                                            ...prev.logoSettings,
                                            mppeVisible: checked,
                                            mppePosition: checked ? (prev.logoSettings.mppePosition === "none" ? "left" : prev.logoSettings.mppePosition) : "none"
                                          }
                                        }));
                                      }}
                                      className="w-4 h-4 accent-[#5564eb] rounded"
                                    />
                                    <span className="text-xs font-black text-gray-800 flex items-center gap-1">
                                      <span>🇻🇪</span> Logo MPPE / Escudo
                                    </span>
                                  </label>

                                  {formTemplate.logoSettings.mppeVisible && (
                                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                      {formTemplate.logoSettings.mppeSize} px
                                    </span>
                                  )}
                                </div>

                                {formTemplate.logoSettings.mppeVisible && (
                                  <div className="space-y-3 pt-1 border-t border-gray-100">
                                    {/* Selector de Imagen / Cambiar Logo MPPE */}
                                    <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl border border-gray-200">
                                      <div className="w-12 h-12 rounded-lg bg-white border border-gray-200 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                                        <img
                                          src={formTemplate.logoSettings.mppeUrl || mppeLogo}
                                          alt="Logo MPPE"
                                          className="w-full h-full object-contain"
                                        />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <span className="text-[11px] font-bold text-gray-800 block truncate">
                                          Escudo MPPE
                                        </span>
                                        <div className="flex items-center gap-2 mt-1">
                                          <button
                                            type="button"
                                            onClick={() => templateMppeInputRef.current?.click()}
                                            className="px-2.5 py-1 bg-[#5564eb] hover:bg-[#4250d4] text-white text-[10px] font-bold rounded-lg transition flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95"
                                          >
                                            <UploadCloud size={12} /> Cambiar Logo
                                          </button>
                                          {((formTemplate.logoSettings.mppeUrl && formTemplate.logoSettings.mppeUrl !== "./mppe_logo.png") || mppeLogo !== "./mppe_logo.png") && (
                                            <button
                                              type="button"
                                              onClick={handleTemplateResetLogoMppe}
                                              className="px-2 py-1 text-[10px] text-gray-500 hover:text-gray-800 font-semibold cursor-pointer"
                                              title="Restablecer logo oficial MPPE"
                                            >
                                              Restablecer
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    <div>
                                      <span className="text-[10px] font-bold uppercase text-gray-500 block mb-1">Posición:</span>
                                      <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-lg">
                                        {(["left", "center", "right"] as LogoPosition[]).map((pos) => (
                                          <button
                                            key={pos}
                                            type="button"
                                            onClick={() => setFormTemplate(prev => ({
                                              ...prev,
                                              logoSettings: { ...prev.logoSettings, mppePosition: pos }
                                            }))}
                                            className={`py-1 text-xs font-bold rounded-md transition ${formTemplate.logoSettings.mppePosition === pos ? "bg-[#5564eb] text-white shadow-2xs" : "text-gray-600 hover:text-gray-900"}`}
                                          >
                                            {pos === "left" ? "Izquierda" : pos === "center" ? "Centro" : "Derecha"}
                                          </button>
                                        ))}
                                      </div>
                                    </div>

                                    <div>
                                      <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] font-bold uppercase text-gray-500">Tamaño (Escala):</span>
                                        <div className="flex items-center gap-1">
                                          <input
                                            type="number"
                                            min={25}
                                            max={320}
                                            value={formTemplate.logoSettings.mppeSize}
                                            onChange={(e) => {
                                              const val = parseInt(e.target.value, 10);
                                              if (!isNaN(val)) {
                                                setFormTemplate(prev => ({
                                                  ...prev,
                                                  logoSettings: { ...prev.logoSettings, mppeSize: Math.max(25, Math.min(320, val)) }
                                                }));
                                              }
                                            }}
                                            className="w-14 py-0.5 px-1.5 text-xs font-bold text-center text-[#5564eb] bg-blue-50 border border-blue-200 rounded-md outline-none focus:ring-1 focus:ring-[#5564eb]"
                                          />
                                          <span className="text-[10px] text-gray-400 font-bold">px</span>
                                        </div>
                                      </div>
                                      <input
                                        type="range"
                                        min={30}
                                        max={280}
                                        step={2}
                                        value={formTemplate.logoSettings.mppeSize}
                                        onChange={(e) => {
                                          const val = parseInt(e.target.value, 10);
                                          setFormTemplate(prev => ({
                                            ...prev,
                                            logoSettings: { ...prev.logoSettings, mppeSize: val }
                                          }));
                                        }}
                                        className="w-full accent-[#5564eb] cursor-pointer"
                                      />
                                      <div className="flex justify-between text-[9px] text-gray-400 font-bold mt-0.5">
                                        <span className="cursor-pointer hover:text-gray-700" onClick={() => setFormTemplate(prev => ({ ...prev, logoSettings: { ...prev.logoSettings, mppeSize: 60 } }))}>60px</span>
                                        <span className="cursor-pointer hover:text-gray-700" onClick={() => setFormTemplate(prev => ({ ...prev, logoSettings: { ...prev.logoSettings, mppeSize: 80 } }))}>80px (Normal)</span>
                                        <span className="cursor-pointer hover:text-gray-700" onClick={() => setFormTemplate(prev => ({ ...prev, logoSettings: { ...prev.logoSettings, mppeSize: 130 } }))}>130px</span>
                                        <span className="cursor-pointer hover:text-gray-700" onClick={() => setFormTemplate(prev => ({ ...prev, logoSettings: { ...prev.logoSettings, mppeSize: 200 } }))}>200px (Grande)</span>
                                        <span className="cursor-pointer hover:text-gray-700" onClick={() => setFormTemplate(prev => ({ ...prev, logoSettings: { ...prev.logoSettings, mppeSize: 280 } }))}>280px (Máx)</span>
                                      </div>
                                    </div>

                                    {/* Ajuste Vertical / Alto de Hitbox MPPE */}
                                    <div className="pt-2 border-t border-gray-100">
                                      <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] font-bold uppercase text-gray-500">Alto de Hitbox:</span>
                                        <button
                                          type="button"
                                          onClick={() => setFormTemplate(prev => ({
                                            ...prev,
                                            logoSettings: { ...prev.logoSettings, mppeHeight: "auto" }
                                          }))}
                                          className={`px-2 py-0.5 text-[9px] font-bold rounded-md transition ${
                                            formTemplate.logoSettings.mppeHeight === "auto" || !formTemplate.logoSettings.mppeHeight
                                              ? "bg-[#5564eb] text-white shadow-2xs"
                                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                          }`}
                                        >
                                          📐 Ceñido (Auto)
                                        </button>
                                      </div>
                                      <input
                                        type="range"
                                        min={20}
                                        max={280}
                                        step={2}
                                        value={formTemplate.logoSettings.mppeHeight === "auto" || !formTemplate.logoSettings.mppeHeight ? Math.round(formTemplate.logoSettings.mppeSize * 0.35) : formTemplate.logoSettings.mppeHeight}
                                        onChange={(e) => {
                                          const val = parseInt(e.target.value, 10);
                                          setFormTemplate(prev => ({
                                            ...prev,
                                            logoSettings: { ...prev.logoSettings, mppeHeight: val }
                                          }));
                                        }}
                                        className="w-full accent-[#5564eb] cursor-pointer"
                                      />
                                      <div className="flex justify-between text-[9px] text-gray-400 font-bold mt-0.5">
                                        <span className="cursor-pointer hover:text-blue-600 text-blue-500 font-bold" onClick={() => setFormTemplate(prev => ({ ...prev, logoSettings: { ...prev.logoSettings, mppeHeight: "auto" } }))}>Auto</span>
                                        <span className="cursor-pointer hover:text-gray-700" onClick={() => setFormTemplate(prev => ({ ...prev, logoSettings: { ...prev.logoSettings, mppeHeight: 40 } }))}>40px</span>
                                        <span className="cursor-pointer hover:text-gray-700" onClick={() => setFormTemplate(prev => ({ ...prev, logoSettings: { ...prev.logoSettings, mppeHeight: 60 } }))}>60px</span>
                                        <span className="cursor-pointer hover:text-gray-700" onClick={() => setFormTemplate(prev => ({ ...prev, logoSettings: { ...prev.logoSettings, mppeHeight: 80 } }))}>80px</span>
                                        <span className="cursor-pointer hover:text-gray-700" onClick={() => setFormTemplate(prev => ({ ...prev, logoSettings: { ...prev.logoSettings, mppeHeight: 120 } }))}>120px</span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* LOGO INSTITUCIÓN */}
                              <div className={`p-4 rounded-xl border transition-all ${formTemplate.logoSettings.instVisible ? "bg-white border-blue-200 shadow-2xs" : "bg-gray-100/60 border-gray-200 opacity-70"}`}>
                                <div className="flex items-center justify-between mb-3">
                                  <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                      type="checkbox"
                                      checked={formTemplate.logoSettings.instVisible}
                                      onChange={(e) => {
                                        const checked = e.target.checked;
                                        setFormTemplate(prev => ({
                                          ...prev,
                                          logoSettings: {
                                            ...prev.logoSettings,
                                            instVisible: checked,
                                            instPosition: checked ? (prev.logoSettings.instPosition === "none" ? "right" : prev.logoSettings.instPosition) : "none"
                                          }
                                        }));
                                      }}
                                      className="w-4 h-4 accent-[#5564eb] rounded"
                                    />
                                    <span className="text-xs font-black text-gray-800 flex items-center gap-1">
                                      <span>🏫</span> Logo Institución
                                    </span>
                                  </label>

                                  {formTemplate.logoSettings.instVisible && (
                                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                      {formTemplate.logoSettings.instSize} px
                                    </span>
                                  )}
                                </div>

                                {formTemplate.logoSettings.instVisible && (
                                  <div className="space-y-3 pt-1 border-t border-gray-100">
                                    {/* Selector de Imagen / Cambiar Logo Institución */}
                                    <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl border border-gray-200">
                                      <div className="w-12 h-12 rounded-lg bg-white border border-gray-200 p-1 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                                        <img
                                          src={formTemplate.logoSettings.instUrl || instLogo}
                                          alt="Logo Institución"
                                          className="w-full h-full object-contain"
                                        />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <span className="text-[11px] font-bold text-gray-800 block truncate">
                                          Insignia del Plantel
                                        </span>
                                        <div className="flex items-center gap-2 mt-1">
                                          <button
                                            type="button"
                                            onClick={() => templateInstInputRef.current?.click()}
                                            className="px-2.5 py-1 bg-[#5564eb] hover:bg-[#4250d4] text-white text-[10px] font-bold rounded-lg transition flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95"
                                          >
                                            <UploadCloud size={12} /> Cambiar Logo
                                          </button>
                                          {((formTemplate.logoSettings.instUrl && formTemplate.logoSettings.instUrl !== "./logo.png") || instLogo !== "./logo.png") && (
                                            <button
                                              type="button"
                                              onClick={handleTemplateResetLogoInst}
                                              className="px-2 py-1 text-[10px] text-gray-500 hover:text-gray-800 font-semibold cursor-pointer"
                                              title="Restablecer logo institucional"
                                            >
                                              Restablecer
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    <div>
                                      <span className="text-[10px] font-bold uppercase text-gray-500 block mb-1">Posición:</span>
                                      <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-lg">
                                        {(["left", "center", "right"] as LogoPosition[]).map((pos) => (
                                          <button
                                            key={pos}
                                            type="button"
                                            onClick={() => setFormTemplate(prev => ({
                                              ...prev,
                                              logoSettings: { ...prev.logoSettings, instPosition: pos }
                                            }))}
                                            className={`py-1 text-xs font-bold rounded-md transition ${formTemplate.logoSettings.instPosition === pos ? "bg-[#5564eb] text-white shadow-2xs" : "text-gray-600 hover:text-gray-900"}`}
                                          >
                                            {pos === "left" ? "Izquierda" : pos === "center" ? "Centro" : "Derecha"}
                                          </button>
                                        ))}
                                      </div>
                                    </div>

                                    <div>
                                      <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] font-bold uppercase text-gray-500">Tamaño (Escala):</span>
                                        <div className="flex items-center gap-1">
                                          <input
                                            type="number"
                                            min={25}
                                            max={320}
                                            value={formTemplate.logoSettings.instSize}
                                            onChange={(e) => {
                                              const val = parseInt(e.target.value, 10);
                                              if (!isNaN(val)) {
                                                setFormTemplate(prev => ({
                                                  ...prev,
                                                  logoSettings: { ...prev.logoSettings, instSize: Math.max(25, Math.min(320, val)) }
                                                }));
                                              }
                                            }}
                                            className="w-14 py-0.5 px-1.5 text-xs font-bold text-center text-[#5564eb] bg-blue-50 border border-blue-200 rounded-md outline-none focus:ring-1 focus:ring-[#5564eb]"
                                          />
                                          <span className="text-[10px] text-gray-400 font-bold">px</span>
                                        </div>
                                      </div>
                                      <input
                                        type="range"
                                        min={30}
                                        max={280}
                                        step={2}
                                        value={formTemplate.logoSettings.instSize}
                                        onChange={(e) => {
                                          const val = parseInt(e.target.value, 10);
                                          setFormTemplate(prev => ({
                                            ...prev,
                                            logoSettings: { ...prev.logoSettings, instSize: val }
                                          }));
                                        }}
                                        className="w-full accent-[#5564eb] cursor-pointer"
                                      />
                                      <div className="flex justify-between text-[9px] text-gray-400 font-bold mt-0.5">
                                        <span className="cursor-pointer hover:text-gray-700" onClick={() => setFormTemplate(prev => ({ ...prev, logoSettings: { ...prev.logoSettings, instSize: 60 } }))}>60px</span>
                                        <span className="cursor-pointer hover:text-gray-700" onClick={() => setFormTemplate(prev => ({ ...prev, logoSettings: { ...prev.logoSettings, instSize: 80 } }))}>80px (Normal)</span>
                                        <span className="cursor-pointer hover:text-gray-700" onClick={() => setFormTemplate(prev => ({ ...prev, logoSettings: { ...prev.logoSettings, instSize: 130 } }))}>130px</span>
                                        <span className="cursor-pointer hover:text-gray-700" onClick={() => setFormTemplate(prev => ({ ...prev, logoSettings: { ...prev.logoSettings, instSize: 200 } }))}>200px (Grande)</span>
                                        <span className="cursor-pointer hover:text-gray-700" onClick={() => setFormTemplate(prev => ({ ...prev, logoSettings: { ...prev.logoSettings, instSize: 280 } }))}>280px (Máx)</span>
                                      </div>
                                    </div>

                                    {/* Ajuste Vertical / Alto de Hitbox Institución */}
                                    <div className="pt-2 border-t border-gray-100">
                                      <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] font-bold uppercase text-gray-500">Alto de Hitbox:</span>
                                        <button
                                          type="button"
                                          onClick={() => setFormTemplate(prev => ({
                                            ...prev,
                                            logoSettings: { ...prev.logoSettings, instHeight: "auto" }
                                          }))}
                                          className={`px-2 py-0.5 text-[9px] font-bold rounded-md transition ${
                                            formTemplate.logoSettings.instHeight === "auto" || !formTemplate.logoSettings.instHeight
                                              ? "bg-[#5564eb] text-white shadow-2xs"
                                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                          }`}
                                        >
                                          📐 Ceñido (Auto)
                                        </button>
                                      </div>
                                      <input
                                        type="range"
                                        min={20}
                                        max={280}
                                        step={2}
                                        value={formTemplate.logoSettings.instHeight === "auto" || !formTemplate.logoSettings.instHeight ? Math.round(formTemplate.logoSettings.instSize * 0.4) : formTemplate.logoSettings.instHeight}
                                        onChange={(e) => {
                                          const val = parseInt(e.target.value, 10);
                                          setFormTemplate(prev => ({
                                            ...prev,
                                            logoSettings: { ...prev.logoSettings, instHeight: val }
                                          }));
                                        }}
                                        className="w-full accent-[#5564eb] cursor-pointer"
                                      />
                                      <div className="flex justify-between text-[9px] text-gray-400 font-bold mt-0.5">
                                        <span className="cursor-pointer hover:text-blue-600 text-blue-500 font-bold" onClick={() => setFormTemplate(prev => ({ ...prev, logoSettings: { ...prev.logoSettings, instHeight: "auto" } }))}>Auto</span>
                                        <span className="cursor-pointer hover:text-gray-700" onClick={() => setFormTemplate(prev => ({ ...prev, logoSettings: { ...prev.logoSettings, instHeight: 40 } }))}>40px</span>
                                        <span className="cursor-pointer hover:text-gray-700" onClick={() => setFormTemplate(prev => ({ ...prev, logoSettings: { ...prev.logoSettings, instHeight: 60 } }))}>60px</span>
                                        <span className="cursor-pointer hover:text-gray-700" onClick={() => setFormTemplate(prev => ({ ...prev, logoSettings: { ...prev.logoSettings, instHeight: 80 } }))}>80px</span>
                                        <span className="cursor-pointer hover:text-gray-700" onClick={() => setFormTemplate(prev => ({ ...prev, logoSettings: { ...prev.logoSettings, instHeight: 120 } }))}>120px</span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Inputs de archivo ocultos para el editor de plantillas */}
                            <input
                              type="file"
                              ref={templateMppeInputRef}
                              accept="image/png,image/jpeg,image/svg+xml,image/webp"
                              className="hidden"
                              onChange={handleTemplateUploadLogoMppe}
                            />
                            <input
                              type="file"
                              ref={templateInstInputRef}
                              accept="image/png,image/jpeg,image/svg+xml,image/webp"
                              className="hidden"
                              onChange={handleTemplateUploadLogoInst}
                            />

                            {/* Mini Previsualización del Membrete configurado */}
                            <div className="bg-white p-3 rounded-xl border border-gray-200 mt-1">
                              <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-2">
                                Vista Previa Rápida del Membrete:
                              </span>
                              <div className="flex items-center justify-between gap-3 text-center border-t border-gray-100 pt-2">
                                <div className="w-16 shrink-0 flex items-center justify-center">
                                  {formTemplate.logoSettings.mppeVisible && formTemplate.logoSettings.mppePosition === "left" && (
                                    <img src={formTemplate.logoSettings.mppeUrl || mppeLogo} alt="MPPE" style={{ width: `${Math.min(formTemplate.logoSettings.mppeSize, 48)}px` }} className="object-contain" />
                                  )}
                                  {formTemplate.logoSettings.instVisible && formTemplate.logoSettings.instPosition === "left" && (
                                    <img src={formTemplate.logoSettings.instUrl || instLogo} alt="Institución" style={{ width: `${Math.min(formTemplate.logoSettings.instSize, 48)}px` }} className="object-contain" />
                                  )}
                                </div>

                                <div className="flex-1">
                                  <p className="text-[10px] font-bold text-gray-700 leading-tight">
                                    REPÚBLICA BOLIVARIANA DE VENEZUELA
                                  </p>
                                  <p className="text-[9px] text-gray-500">
                                    MINISTERIO DEL PODER POPULAR PARA LA EDUCACIÓN
                                  </p>
                                  <p className="text-[10px] font-extrabold text-gray-800">
                                    U.E. "REPÚBLICA DE CHILE"
                                  </p>
                                </div>

                                <div className="w-16 shrink-0 flex items-center justify-center">
                                  {formTemplate.logoSettings.instVisible && formTemplate.logoSettings.instPosition === "right" && (
                                    <img src={formTemplate.logoSettings.instUrl || instLogo} alt="Institución" style={{ width: `${Math.min(formTemplate.logoSettings.instSize, 48)}px` }} className="object-contain" />
                                  )}
                                  {formTemplate.logoSettings.mppeVisible && formTemplate.logoSettings.mppePosition === "right" && (
                                    <img src={formTemplate.logoSettings.mppeUrl || mppeLogo} alt="MPPE" style={{ width: `${Math.min(formTemplate.logoSettings.mppeSize, 48)}px` }} className="object-contain" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                    </div>

                    {/* COLUMNA DERECHA: PANEL FLOTANTE STICKY DE PALABRAS CLAVE SIEMPRE VISIBLE */}
                    <div className="lg:col-span-5 sticky top-1 space-y-3">
                      <div className="bg-gradient-to-b from-blue-50/90 to-indigo-50/70 border border-blue-200/90 rounded-2xl p-4 shadow-sm space-y-3">
                        <div className="flex items-center justify-between gap-2 border-b border-blue-200/60 pb-2">
                          <div className="flex items-center gap-2">
                            <Sparkles size={16} className="text-[#5564eb]" />
                            <span className="text-xs font-black uppercase tracking-wider text-blue-900">
                              Palabras Clave Disponibles
                            </span>
                          </div>
                        </div>

                        {/* Buscador de variables */}
                        <div className="relative">
                          <Search size={13} className="absolute left-2.5 top-2.5 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Buscar palabra clave..."
                            value={tagSearchTerm}
                            onChange={(e) => setTagSearchTerm(e.target.value)}
                            className="w-full pl-8 pr-7 py-1.5 bg-white border border-blue-200 rounded-xl text-xs font-medium text-gray-800 outline-none focus:border-[#5564eb] shadow-2xs"
                          />
                          {tagSearchTerm && (
                            <button
                              type="button"
                              onClick={() => setTagSearchTerm("")}
                              className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 text-xs cursor-pointer"
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        {/* Selector de campo destino para la palabra clave */}
                        <div className="space-y-1.5 bg-white/90 p-2.5 rounded-xl border border-blue-200 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-black text-gray-500">Insertar en:</span>
                            <span className="text-[10px] font-bold text-[#5564eb]">
                              📍 {tagTargetField === "cuerpo" ? "Cuerpo" : tagTargetField === "encabezado" ? "Encabezado" : "Pie de Página"}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-1 bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setTagTargetField("encabezado");
                                lastActiveTargetRef.current = "encabezado";
                                encabezadoInputRef.current?.focus();
                              }}
                              className={`py-1 text-[11px] font-bold rounded-md transition cursor-pointer ${tagTargetField === "encabezado" ? "bg-[#5564eb] text-white shadow-2xs" : "text-gray-600 hover:text-gray-900"}`}
                            >
                              Encabezado
                            </button>
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setTagTargetField("cuerpo");
                                lastActiveTargetRef.current = "cuerpo";
                                cuerpoInputRef.current?.focus();
                              }}
                              className={`py-1 text-[11px] font-bold rounded-md transition cursor-pointer ${tagTargetField === "cuerpo" ? "bg-[#5564eb] text-white shadow-2xs" : "text-gray-600 hover:text-gray-900"}`}
                            >
                              Cuerpo
                            </button>
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => {
                                setTagTargetField("piePagina");
                                lastActiveTargetRef.current = "piePagina";
                                const targetId = activeSignatureId || formSignatures[0]?.id;
                                if (targetId) {
                                  const el = document.getElementById(`sig-textarea-${targetId}`) as HTMLTextAreaElement | null;
                                  el?.focus();
                                }
                              }}
                              className={`py-1 text-[11px] font-bold rounded-md transition cursor-pointer ${tagTargetField === "piePagina" ? "bg-[#5564eb] text-white shadow-2xs" : "text-gray-600 hover:text-gray-900"}`}
                            >
                              Firmas
                            </button>
                          </div>
                        </div>

                        {/* Filtros por Categoría */}
                        <div className="flex flex-wrap items-center gap-1">
                          {["Todos", "Estudiante", "Académico", "Representante", "Institución"].map(cat => (
                            <button
                              key={cat}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => setActiveTagCategory(cat)}
                              className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg transition cursor-pointer ${activeTagCategory === cat ? "bg-[#5564eb] text-white shadow-xs" : "bg-white text-gray-600 hover:bg-blue-100/60 border border-blue-200/60"}`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>

                        {/* Chips de Palabras Clave con scroll */}
                        <div className="flex flex-wrap gap-1.5 max-h-[46vh] overflow-y-auto pr-1">
                          {DYNAMIC_VARIABLES
                            .filter(v => (activeTagCategory === "Todos" || v.category === activeTagCategory) && (!tagSearchTerm.trim() || v.keyword.toLowerCase().includes(tagSearchTerm.toLowerCase()) || v.key.toLowerCase().includes(tagSearchTerm.toLowerCase())))
                            .map(v => (
                              <button
                                key={v.key}
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => handleInsertTag(v.key, tagTargetField)}
                                className="bg-white hover:bg-[#5564eb] hover:text-white border border-blue-200 text-[#5564eb] text-[11px] font-bold px-2.5 py-1.5 rounded-xl transition shadow-2xs active:scale-95 text-left flex items-center gap-1.5 group cursor-pointer"
                                title={`${v.label} (Ej: ${v.example}) — Clic para insertar en ${tagTargetField}`}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-[#5564eb] group-hover:bg-white transition-colors" />
                                <span>{v.keyword}</span>
                              </button>
                            ))}
                        </div>

                        <p className="text-[10px] text-gray-500 font-medium border-t border-blue-200/50 pt-2">
                          💡 Coloca el cursor en el texto donde quieras la variable y pulsa cualquier palabra clave.
                        </p>
                      </div>
                    </div>

                  </div>
                </form>
              </div>

              {/* Pie Fijo del Modal: SIEMPRE VISIBLE */}
              <div className="p-4 px-6 md:px-8 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/90 backdrop-blur-md shrink-0">
                <button
                  type="button"
                  onClick={() => setTemplateEditorOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs uppercase tracking-wider hover:bg-gray-100 transition active:scale-95"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  form="template-editor-form"
                  className="px-6 py-2.5 rounded-xl bg-[#5564eb] hover:bg-[#4250d4] text-white font-bold text-xs uppercase tracking-wider shadow-md transition active:scale-95 flex items-center gap-2"
                >
                  <Save size={16} /> Guardar Plantilla
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL CONFIRMAR ELIMINAR PLANTILLA */}
      <AnimatePresence>
        {deleteModalOpen && templateToDelete && (
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
                ¿Eliminar Plantilla?
              </h3>

              <p className="text-xs text-gray-500 mb-6 font-medium">
                Estás a punto de eliminar la plantilla <strong className="text-gray-800">"{templateToDelete.nombre}"</strong> ({templateToDelete.codigo}). Esta acción no se puede deshacer.
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
                  onClick={handleConfirmDeleteTemplate}
                  className="px-6 py-2.5 rounded-xl bg-red-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-red-700 shadow-md transition active:scale-95"
                >
                  Sí, Eliminar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: PERSONALIZAR IMÁGENES, POSICIÓN Y TAMAÑO DE LOGOS */}
      <AnimatePresence>
        {logoModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden text-left"
            >
              {/* Encabezado del Modal */}
              <div className="p-5 px-6 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 text-[#5564eb] rounded-xl border border-blue-100">
                    <Sliders size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-gray-900">
                      Configuración de Logotipos del Documento
                    </h3>
                    <p className="text-xs text-gray-500 font-medium">
                      Ajusta la posición (Izquierda, Centro, Derecha), el tamaño en píxeles y la imagen de cada logo.
                    </p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setLogoModalOpen(false)} 
                  className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Contenido con scroll */}
              <div className="p-6 space-y-6 overflow-y-auto">

                {/* LOGO INSTITUCIÓN */}
                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200 flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div 
                        className="bg-white rounded-xl border border-gray-200 flex items-center justify-center p-1.5 shadow-2xs shrink-0"
                        style={{ width: `${Math.min(instSize, 72)}px`, height: `${Math.min(instSize, 72)}px` }}
                      >
                        <img src={instLogo} alt="Logo Institución" className="max-h-full max-w-full object-contain" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-gray-900 uppercase">Logo de la Institución</h4>
                        <p className="text-[11px] text-gray-500 font-medium">U.E. "República de Chile"</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputInstRef.current?.click()}
                        className="px-3.5 py-1.5 bg-white hover:bg-[#5564eb] text-gray-700 hover:text-white border border-gray-300 hover:border-[#5564eb] text-xs font-bold rounded-xl transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <UploadCloud size={14} /> Cambiar Imagen
                      </button>
                    </div>
                  </div>

                  {/* Configuración de Posición y Tamaño */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Selector de Posición */}
                    <div>
                      <label className="text-[10px] font-black uppercase text-gray-500 block mb-1.5">
                        Posición en Encabezado:
                      </label>
                      <div className="grid grid-cols-4 gap-1 bg-white p-1 rounded-xl border border-gray-200">
                        {(["left", "center", "right", "none"] as LogoPosition[]).map((pos) => (
                          <button
                            key={pos}
                            type="button"
                            onClick={() => handleSetInstPosition(pos)}
                            className={`py-1.5 text-xs font-bold rounded-lg transition-all text-center ${
                              instPosition === pos
                                ? "bg-[#5564eb] text-white shadow-xs"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                            }`}
                          >
                            {pos === "left" ? "Izq." : pos === "center" ? "Centro" : pos === "right" ? "Der." : "Ocultar"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Slider de Tamaño */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-black uppercase text-gray-500">
                          Tamaño del Logo (Escala Libre):
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={25}
                            max={320}
                            value={instSize}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              if (!isNaN(val)) handleSetInstSize(Math.max(20, Math.min(320, val)));
                            }}
                            className="w-14 px-1.5 py-0.5 text-xs font-bold text-center text-[#5564eb] bg-blue-50 border border-blue-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
                          />
                          <span className="text-[10px] font-bold text-gray-400">px</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={30}
                          max={280}
                          step={2}
                          value={instSize}
                          onChange={(e) => handleSetInstSize(parseInt(e.target.value, 10))}
                          className="w-full accent-[#5564eb] cursor-pointer"
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-400 font-bold mt-1">
                        <span onClick={() => handleSetInstSize(60)} className="cursor-pointer hover:text-gray-700">60px</span>
                        <span onClick={() => handleSetInstSize(80)} className="cursor-pointer hover:text-gray-700">80px (Normal)</span>
                        <span onClick={() => handleSetInstSize(130)} className="cursor-pointer hover:text-gray-700">130px</span>
                        <span onClick={() => handleSetInstSize(200)} className="cursor-pointer hover:text-gray-700">200px (Grande)</span>
                        <span onClick={() => handleSetInstSize(280)} className="cursor-pointer hover:text-gray-700">280px (Máx)</span>
                      </div>
                    </div>
                  </div>

                  {/* Ajuste Vertical / Alto de Hitbox Institución */}
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] font-black uppercase text-gray-500">
                        Alto de Hitbox / Ajuste Vertical:
                      </label>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSetInstHeight("auto")}
                          className={`px-2.5 py-0.5 text-[10px] font-bold rounded-lg transition ${
                            instHeight === "auto" 
                              ? "bg-[#5564eb] text-white shadow-2xs" 
                              : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-100"
                          }`}
                        >
                          📐 Ceñido al Contorno (Auto)
                        </button>
                        {instHeight !== "auto" && (
                          <span className="text-xs font-bold text-[#5564eb] font-mono bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {instHeight}px
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={20}
                        max={280}
                        step={2}
                        value={instHeight === "auto" ? Math.round(instSize * 0.4) : instHeight}
                        onChange={(e) => handleSetInstHeight(parseInt(e.target.value, 10))}
                        className="w-full accent-[#5564eb] cursor-pointer"
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-400 font-bold mt-1">
                      <span onClick={() => handleSetInstHeight("auto")} className="cursor-pointer hover:text-blue-600 text-blue-500 font-bold">Auto (Ceñido)</span>
                      <span onClick={() => handleSetInstHeight(40)} className="cursor-pointer hover:text-gray-700">40px</span>
                      <span onClick={() => handleSetInstHeight(60)} className="cursor-pointer hover:text-gray-700">60px</span>
                      <span onClick={() => handleSetInstHeight(80)} className="cursor-pointer hover:text-gray-700">80px</span>
                      <span onClick={() => handleSetInstHeight(120)} className="cursor-pointer hover:text-gray-700">120px</span>
                      <span onClick={() => handleSetInstHeight(160)} className="cursor-pointer hover:text-gray-700">160px</span>
                    </div>
                  </div>
                </div>

                {/* LOGO MPPE */}
                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200 flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div 
                        className="bg-white rounded-xl border border-gray-200 flex items-center justify-center p-1.5 shadow-2xs shrink-0"
                        style={{ width: `${Math.min(mppeSize, 72)}px`, height: `${Math.min(mppeSize, 72)}px` }}
                      >
                        <img src={mppeLogo} alt="Logo MPPE" className="max-h-full max-w-full object-contain" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-gray-900 uppercase">Logo del MPPE</h4>
                        <p className="text-[11px] text-gray-500 font-medium">Ministerio del Poder Popular para la Educación</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputMppeRef.current?.click()}
                        className="px-3.5 py-1.5 bg-white hover:bg-[#5564eb] text-gray-700 hover:text-white border border-gray-300 hover:border-[#5564eb] text-xs font-bold rounded-xl transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <UploadCloud size={14} /> Cambiar Imagen
                      </button>
                    </div>
                  </div>

                  {/* Configuración de Posición y Tamaño */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Selector de Posición */}
                    <div>
                      <label className="text-[10px] font-black uppercase text-gray-500 block mb-1.5">
                        Posición en Encabezado:
                      </label>
                      <div className="grid grid-cols-4 gap-1 bg-white p-1 rounded-xl border border-gray-200">
                        {(["left", "center", "right", "none"] as LogoPosition[]).map((pos) => (
                          <button
                            key={pos}
                            type="button"
                            onClick={() => handleSetMppePosition(pos)}
                            className={`py-1.5 text-xs font-bold rounded-lg transition-all text-center ${
                              mppePosition === pos
                                ? "bg-[#5564eb] text-white shadow-xs"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                            }`}
                          >
                            {pos === "left" ? "Izq." : pos === "center" ? "Centro" : pos === "right" ? "Der." : "Ocultar"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Slider de Tamaño */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-black uppercase text-gray-500">
                          Tamaño del Logo (Escala Libre):
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={25}
                            max={320}
                            value={mppeSize}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              if (!isNaN(val)) handleSetMppeSize(Math.max(20, Math.min(320, val)));
                            }}
                            className="w-14 px-1.5 py-0.5 text-xs font-bold text-center text-[#5564eb] bg-blue-50 border border-blue-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
                          />
                          <span className="text-[10px] font-bold text-gray-400">px</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={30}
                          max={280}
                          step={2}
                          value={mppeSize}
                          onChange={(e) => handleSetMppeSize(parseInt(e.target.value, 10))}
                          className="w-full accent-[#5564eb] cursor-pointer"
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-400 font-bold mt-1">
                        <span onClick={() => handleSetMppeSize(60)} className="cursor-pointer hover:text-gray-700">60px</span>
                        <span onClick={() => handleSetMppeSize(80)} className="cursor-pointer hover:text-gray-700">80px (Normal)</span>
                        <span onClick={() => handleSetMppeSize(130)} className="cursor-pointer hover:text-gray-700">130px</span>
                        <span onClick={() => handleSetMppeSize(200)} className="cursor-pointer hover:text-gray-700">200px (Grande)</span>
                        <span onClick={() => handleSetMppeSize(280)} className="cursor-pointer hover:text-gray-700">280px (Máx)</span>
                      </div>
                    </div>
                  </div>

                  {/* Ajuste Vertical / Alto de Hitbox MPPE */}
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] font-black uppercase text-gray-500">
                        Alto de Hitbox / Ajuste Vertical:
                      </label>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSetMppeHeight("auto")}
                          className={`px-2.5 py-0.5 text-[10px] font-bold rounded-lg transition ${
                            mppeHeight === "auto" 
                              ? "bg-[#5564eb] text-white shadow-2xs" 
                              : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-100"
                          }`}
                        >
                          📐 Ceñido al Contorno (Auto)
                        </button>
                        {mppeHeight !== "auto" && (
                          <span className="text-xs font-bold text-[#5564eb] font-mono bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {mppeHeight}px
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={20}
                        max={280}
                        step={2}
                        value={mppeHeight === "auto" ? Math.round(mppeSize * 0.35) : mppeHeight}
                        onChange={(e) => handleSetMppeHeight(parseInt(e.target.value, 10))}
                        className="w-full accent-[#5564eb] cursor-pointer"
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-400 font-bold mt-1">
                      <span onClick={() => handleSetMppeHeight("auto")} className="cursor-pointer hover:text-blue-600 text-blue-500 font-bold">Auto (Ceñido)</span>
                      <span onClick={() => handleSetMppeHeight(40)} className="cursor-pointer hover:text-gray-700">40px</span>
                      <span onClick={() => handleSetMppeHeight(60)} className="cursor-pointer hover:text-gray-700">60px</span>
                      <span onClick={() => handleSetMppeHeight(80)} className="cursor-pointer hover:text-gray-700">80px</span>
                      <span onClick={() => handleSetMppeHeight(120)} className="cursor-pointer hover:text-gray-700">120px</span>
                      <span onClick={() => handleSetMppeHeight(160)} className="cursor-pointer hover:text-gray-700">160px</span>
                    </div>
                  </div>
                </div>

                {/* Inputs de archivo ocultos */}
                <input 
                  type="file" 
                  ref={fileInputInstRef} 
                  accept="image/png,image/jpeg,image/svg+xml,image/webp" 
                  className="hidden" 
                  onChange={handleUploadLogoInst} 
                />
                <input 
                  type="file" 
                  ref={fileInputMppeRef} 
                  accept="image/png,image/jpeg,image/svg+xml,image/webp" 
                  className="hidden" 
                  onChange={handleUploadLogoMppe} 
                />

                {/* Botón de Restaurar a Predeterminados */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleResetLogos}
                    className="w-full py-2.5 px-4 rounded-xl border border-gray-200 bg-white text-gray-600 hover:text-[#5564eb] hover:border-blue-300 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                  >
                    <RotateCcw size={14} /> Restaurar Posiciones, Tamaños y Logos Predeterminados
                  </button>
                </div>
              </div>

              {/* Pie del Modal */}
              <div className="p-4 px-6 border-t border-gray-100 flex justify-end bg-gray-50/80 shrink-0">
                <button
                  type="button"
                  onClick={() => setLogoModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl bg-[#5564eb] hover:bg-[#4250d4] text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer shadow-md active:scale-95"
                >
                  Guardar y Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: VISTA PREVIA INTEGRADA DE IMPRESIÓN Y GENERADOR DE PDF */}
      <AnimatePresence>
        {printPreviewModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-3 sm:p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              className="bg-gray-100 rounded-3xl shadow-2xl border border-gray-300 max-w-5xl w-full h-[94vh] flex flex-col overflow-hidden text-left"
            >
              {/* Barra Superior de la Vista Previa */}
              <div className="p-4 px-6 bg-white border-b border-gray-200 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                    <Eye size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-gray-900">
                      Vista Previa de Impresión y PDF
                    </h3>
                    <p className="text-xs text-gray-500 font-medium">
                      {activeTemplate?.nombre || "Documento Institucional"} • {selectedStudent ? `${selectedStudent.firstName} ${selectedStudent.lastName}` : "Estudiante"}
                    </p>
                  </div>
                </div>

                {/* Acciones de la Barra Superior */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Selector de Tamaño de Hoja */}
                  <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
                    <span className="text-[10px] font-black uppercase text-gray-500 ml-1.5 mr-1 flex items-center gap-1">
                      <FileText size={12} className="text-[#5564eb]" /> Hoja:
                    </span>
                    {(["Carta", "Oficio", "A4"] as PaperSize[]).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => handleSetPaperSize(sz)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          paperSize === sz
                            ? "bg-white text-[#5564eb] shadow-sm font-black"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>

                  {/* Ajustar a Pantalla / Escala 100% */}
                  <button
                    type="button"
                    onClick={() => setPreviewZoomFit(!previewZoomFit)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                      previewZoomFit 
                        ? "bg-slate-700 text-white border-slate-600 shadow-xs" 
                        : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
                    }`}
                    title={previewZoomFit ? "Ver en tamaño 100% real" : "Ajustar hoja completa a la pantalla"}
                  >
                    {previewZoomFit ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                    {previewZoomFit ? "100%" : "Ajustar"}
                  </button>

                  {/* Guardar PDF con diálogo nativo de guardado */}
                  <button
                    type="button"
                    onClick={handleSavePdf}
                    disabled={isGeneratingPdf || isPrinting}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    {isGeneratingPdf ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                    {isGeneratingPdf ? "Generando..." : "Guardar como PDF"}
                  </button>

                  {/* Imprimir Físicamente */}
                  <button
                    type="button"
                    onClick={handlePrintDocument}
                    disabled={isGeneratingPdf || isPrinting}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    {isPrinting ? <Loader2 size={15} className="animate-spin" /> : <Printer size={15} />}
                    {isPrinting ? "Abriendo..." : "Imprimir"}
                  </button>

                  {/* Cerrar modal */}
                  <button 
                    type="button"
                    onClick={() => setPrintPreviewModalOpen(false)} 
                    className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition"
                    title="Cerrar vista previa"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Visor de Hoja Real (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center items-start bg-slate-800/80">
                <div 
                  ref={previewSheetRef}
                  id="preview-document-sheet"
                  className={`bg-white shadow-2xl p-8 sm:p-14 md:p-16 w-full ${
                    paperSize === "Carta" 
                      ? "max-w-[780px] min-h-[1020px]" 
                      : paperSize === "Oficio" 
                      ? "max-w-[780px] min-h-[1350px]" 
                      : "max-w-[740px] min-h-[1100px]"
                  } flex flex-col justify-between text-gray-900 relative transition-all duration-200`}
                  style={{ 
                    fontFamily: "'Times New Roman', Times, serif",
                    transform: previewZoomFit ? (paperSize === "Oficio" ? "scale(0.72)" : "scale(0.82)") : "scale(1)",
                    transformOrigin: "top center",
                    marginBottom: previewZoomFit ? (paperSize === "Oficio" ? "-320px" : "-160px") : "0px"
                  }}
                >
                  {/* Etiqueta de Formato de Hoja en esquina de la hoja */}
                  <div className="absolute top-4 right-4 bg-gray-100 border border-gray-300 text-gray-500 font-mono text-[10px] font-bold px-2 py-0.5 rounded uppercase pointer-events-none select-none">
                    {paperSize === "Carta" ? "Carta (Letter) • 216 × 279 mm" : paperSize === "Oficio" ? "Oficio (Legal) • 216 × 356 mm" : "A4 • 210 × 297 mm"}
                  </div>

                  <div>
                    {/* ENCABEZADO CON LOGOS EXACTAMENTE POSICIONADOS */}
                    <div className="pb-4 mb-6 border-b border-gray-300">
                      {centerLogos.length > 0 && (
                        <div className="flex justify-center items-center gap-4 mb-3">
                          {centerLogos.map((lg) => (
                            <img 
                              key={lg.id}
                              src={lg.src} 
                              alt={lg.alt} 
                              style={{ 
                                maxWidth: `${lg.size}px`, 
                                width: lg.height && lg.height !== "auto" ? "auto" : `${lg.size}px`, 
                                height: lg.height && lg.height !== "auto" ? `${lg.height}px` : "auto", 
                                maxHeight: lg.height && lg.height !== "auto" ? `${lg.height}px` : `${lg.size}px`, 
                                objectFit: "contain",
                                transform: `translate(${lg.offset.x}px, ${lg.offset.y}px)`
                              }}
                              className="object-contain" 
                            />
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-4">
                        {/* LOGOS IZQUIERDA */}
                        <div 
                          className="flex items-center justify-start gap-2 shrink-0"
                          style={{ minWidth: `${Math.max(leftWidth, rightWidth)}px` }}
                        >
                          {leftLogos.map((lg) => (
                            <img 
                              key={lg.id}
                              src={lg.src} 
                              alt={lg.alt} 
                              style={{ 
                                maxWidth: `${lg.size}px`, 
                                width: lg.height && lg.height !== "auto" ? "auto" : `${lg.size}px`, 
                                height: lg.height && lg.height !== "auto" ? `${lg.height}px` : "auto", 
                                maxHeight: lg.height && lg.height !== "auto" ? `${lg.height}px` : `${lg.size}px`, 
                                objectFit: "contain",
                                transform: `translate(${lg.offset.x}px, ${lg.offset.y}px)`
                              }}
                              className="object-contain" 
                            />
                          ))}
                          {leftLogos.length === 0 && rightLogos.length > 0 && (
                            <div style={{ width: `${rightWidth}px` }} className="invisible" aria-hidden="true" />
                          )}
                        </div>

                        {/* MEMBRETE INSTITUCIONAL CENTRADO */}
                        <div className="flex-1 text-center">
                          {lastMinuteDoc.encabezado.split("\n").map((line, idx) => (
                            <p key={idx} className="text-xs sm:text-sm font-bold uppercase tracking-wide leading-tight text-gray-800">
                              {line}
                            </p>
                          ))}
                        </div>

                        {/* LOGOS DERECHA */}
                        <div 
                          className="flex items-center justify-end gap-2 shrink-0"
                          style={{ minWidth: `${Math.max(leftWidth, rightWidth)}px` }}
                        >
                          {rightLogos.map((lg) => (
                            <img 
                              key={lg.id}
                              src={lg.src} 
                              alt={lg.alt} 
                              style={{ 
                                maxWidth: `${lg.size}px`, 
                                width: lg.height && lg.height !== "auto" ? "auto" : `${lg.size}px`, 
                                height: lg.height && lg.height !== "auto" ? `${lg.height}px` : "auto", 
                                maxHeight: lg.height && lg.height !== "auto" ? `${lg.height}px` : `${lg.size}px`, 
                                objectFit: "contain",
                                transform: `translate(${lg.offset.x}px, ${lg.offset.y}px)`
                              }}
                              className="object-contain" 
                            />
                          ))}
                          {rightLogos.length === 0 && leftLogos.length > 0 && (
                            <div style={{ width: `${leftWidth}px` }} className="invisible" aria-hidden="true" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* TÍTULO OFICIAL */}
                    <div className="text-center my-8">
                      <h2 className="text-lg sm:text-xl md:text-2xl font-black uppercase underline tracking-wider text-gray-900">
                        {lastMinuteDoc.titulo}
                      </h2>
                    </div>

                    {/* CUERPO DEL TEXTO */}
                    <div className="text-justify my-8 leading-relaxed text-sm sm:text-base space-y-4">
                      {lastMinuteDoc.cuerpo.split("\n\n").map((paragraph, pIdx) => (
                        <p key={pIdx} className="indent-8 leading-8 text-gray-900">
                          {paragraph.split(/(\*\*.*?\*\*)/g).map((part, partIdx) => {
                            if (part.startsWith("**") && part.endsWith("**")) {
                              return <strong key={partIdx}>{part.slice(2, -2)}</strong>;
                            }
                            return part;
                          })}
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* PIE DE PÁGINA (FIRMAS Y SELLO) */}
                  {renderSignatureBlocks(lastMinuteDoc.piePagina, false)}
                </div>
              </div>

              {/* Pie Informativo de la Vista Previa */}
              <div className="p-3 px-6 bg-white border-t border-gray-200 flex flex-wrap items-center justify-between text-xs text-gray-500 shrink-0">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle size={15} className="text-emerald-500" />
                  Previsualización a escala real. El documento se generará vectorialmente con máxima nitidez.
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPrintPreviewModalOpen(false);
                      setIsEditingLastMinute(true);
                    }}
                    className="text-xs font-bold text-[#5564eb] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 size={13} /> Editar Documento a Última Hora
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={() => setPrintPreviewModalOpen(false)}
                    className="px-4 py-1.5 rounded-xl border border-gray-300 text-gray-700 font-bold text-xs uppercase hover:bg-gray-100 transition"
                  >
                    Volver al Editor
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default DocumentTemplatesGenerator;
