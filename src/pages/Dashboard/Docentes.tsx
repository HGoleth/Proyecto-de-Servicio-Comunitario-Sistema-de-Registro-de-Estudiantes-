import { useState, useEffect } from "react";
import DocenteEditModal from "../../components/docentes/DocenteEditModal";
import ConfirmDeleteModal from "../../components/students/ConfirmDeleteModal";
import { motion, AnimatePresence } from "framer-motion";
// ✅ Se añade useNavigate para la navegación
import { useNavigate } from "react-router-dom"; 
import { 
  Search, UserPlus, Trash2,
  UserSquare2, BookOpen,
  ArrowLeft 
} from "lucide-react";

const PLAN_ESTUDIO: Record<string, string[]> = {
  "1ero": ["Castellano", "Matemáticas", "Ciencias Naturales", "Ciencias Sociales", "Estética", "Educación Física"],
  "2do": ["Castellano", "Matemáticas", "Ciencias Naturales", "Ciencias Sociales", "Estética", "Educación Física"],
  "3ero": ["Castellano", "Matemáticas", "Ciencias Naturales", "Ciencias Sociales", "Estética", "Educación Física"],
  "4to": ["Castellano", "Matemáticas", "Ciencias Naturales", "Ciencias Sociales", "Estética", "Educación Física"],
  "5to": ["Castellano", "Matemáticas", "Ciencias Naturales", "Ciencias Sociales", "Estética", "Educación Física"],
  "6to": ["Castellano", "Matemáticas", "Ciencias Naturales", "Ciencias Sociales", "Estética", "Educación Física"],
  "1er Año": ["Castellano", "Inglés y Otras Lenguas", "Matemáticas", "Educación Física", "Arte y Patrimonio", "Ciencias Naturales", "Geografía, Historia y Ciudadanía", "Orientación y Convivencia", "Grupos de Creación y Producción"],
  "2do Año": ["Castellano", "Inglés y Otras Lenguas", "Matemáticas", "Educación Física", "Arte y Patrimonio", "Ciencias Naturales", "Geografía, Historia y Ciudadanía", "Orientación y Convivencia", "Grupos de Creación y Producción"],
  "3er Año": ["Castellano", "Inglés y Otras Lenguas", "Matemáticas", "Educación Física", "Física", "Química", "Biología", "Geografía, Historia y Ciudadanía", "Orientación y Convivencia", "Grupos de Creación y Producción"],
  "4to Año": ["Castellano", "Inglés y Otras Lenguas", "Matemáticas", "Educación Física", "Física", "Química", "Biología", "Geografía, Historia y Ciudadanía", "Formación para la Soberanía", "Orientación y Convivencia", "Grupos de Creación y Producción"],
  "5to Año": ["Castellano", "Inglés y Otras Lenguas", "Matemáticas", "Educación Física", "Física", "Química", "Biología", "Ciencias de la Tierra", "Geografía, Historia y Ciudadanía", "Formación para la Soberanía", "Orientación y Convivencia", "Grupos de Creación y Producción"],
};

const SECCIONES = ["A", "B", "C", "D", "U"];

const Docentes = () => {
  const navigate = useNavigate();
  const [docentes, setDocentes] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [docenteToDelete, setDocenteToDelete] = useState<string | null>(null);
  const [filterNivel, setFilterNivel] = useState("Primaria");

  const [notification, setNotification] = useState<{ show: boolean, type: 'success' | 'error', message: string }>({
    show: false, type: 'success', message: ''
  });

  const [selectedDocente, setSelectedDocente] = useState<any>({
    nivel: "Primaria", 
    nombre: "", 
    apellido: "", 
    ci: "", 
    email: "", 
    telefono: "", 
    materias: [], 
    grado_asignado: "", 
    seccion_asignada: "", 
    estatus: "Activo",
    es_especialista: false //  Nuevo campo para educación especial
  });

  const showNotify = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
  };

  const validateForm = () => {
    if (!selectedDocente.nombre.trim() || !selectedDocente.apellido.trim()) return "El nombre y apellido son obligatorios.";
    
    // ✅ VALIDACIÓN DE CÉDULA ÚNICA
    if (!selectedDocente.ci || selectedDocente.ci.length < 7) return "La cédula debe tener al menos 7 dígitos.";
    
    const cedulaDuplicada = docentes.find(d => 
      d.ci === selectedDocente.ci && d.id !== selectedDocente.id
    );

    if (cedulaDuplicada) {
      return `La cédula V-${selectedDocente.ci} ya pertenece al docente ${cedulaDuplicada.nombre} ${cedulaDuplicada.apellido}.`;
    }

    if (selectedDocente.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(selectedDocente.email)) return "El formato del correo electrónico es inválido.";
    if (selectedDocente.telefono && selectedDocente.telefono.length < 11) return "El teléfono debe tener exactamente 11 dígitos.";
    
    if (!selectedDocente.grado_asignado) return "Debe asignar un grado o año.";
    if (!selectedDocente.seccion_asignada) return "Debe asignar una sección.";
    if (selectedDocente.materias.length === 0) return "Debe seleccionar al menos una materia.";
    
    return null;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "ci" || name === "telefono") {
      if (value !== "" && !/^\d+$/.test(value)) return;
      if (name === "ci" && value.length > 9) return;
      if (name === "telefono" && value.length > 11) return;
    }
    if (name === "nombre" || name === "apellido") {
      if (value !== "" && !/^[a-zA-Z\sñÑáéíóúÁÉÍÓÚüÜ]*$/.test(value)) return;
    }
    setSelectedDocente((prev: any) => ({ ...prev, [name]: value }));
  };

  const fetchDocentes = async () => {
    setLoading(true);
    try {
      const data = await (window as any).electron.getDocentes();
      setDocentes(data || []);
    } catch (e) { console.error("Error al cargar docentes:", e); }
    setLoading(false);
  };

  useEffect(() => { fetchDocentes(); }, []);

  const abrirEditor = (docente: any = null) => {
    if (docente) {
      setSelectedDocente({ 
        ...docente, 
        nivel: docente.nivel || "Primaria", 
        materias: Array.isArray(docente.materias) ? docente.materias : [],
        es_especialista: docente.es_especialista || false 
      });
    } else {
      setSelectedDocente({ 
        nivel: filterNivel, 
        nombre: "", 
        apellido: "", 
        ci: "", 
        email: "", 
        telefono: "", 
        materias: [], 
        grado_asignado: "", 
        seccion_asignada: "", 
        estatus: "Activo",
        es_especialista: false 
      });
    }
    setIsModalOpen(true);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedDocente((prev: any) => ({ ...prev, foto: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const toggleMateria = (materia: string) => {
    const actuales = selectedDocente.materias || [];
    setSelectedDocente((prev: any) => ({
      ...prev,
      materias: actuales.includes(materia) ? actuales.filter((m: string) => m !== materia) : [...actuales, materia]
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
  e.preventDefault();
  const error = validateForm();
  if (error) {
    showNotify(error, "error");
    return;
  }

  try {
    // El objeto selectedDocente ya incluye .nivel ("Primaria" o "Secundaria")
    let res;
    if (selectedDocente.id) {
      res = await (window as any).electron.updateDocente(selectedDocente.id, selectedDocente);
    } else {
      res = await (window as any).electron.registerDocente(selectedDocente);
    }

    if (res && res.success) {
      setIsModalOpen(false);
      await fetchDocentes();
      showNotify(selectedDocente.id ? "Perfil actualizado" : "Docente registrado");
    }
  } catch {
    showNotify("Error al sincronizar con el servidor", "error");
  }
};

  const handleDelete = async () => {
    if (!docenteToDelete) return;
    try {
      const res = await (window as any).electron.deleteDocente(docenteToDelete);
      setIsDeleteOpen(false);
      if (res?.success) {
        await fetchDocentes();
        showNotify("Docente eliminado");
      }
    } catch { showNotify("Error de conexión", "error"); }
  };

  const filteredDocentes = docentes.filter(d => 
    (d.nivel === filterNivel) &&
    ((d.nombre?.toLowerCase() || "").includes(searchTerm.toLowerCase()) || (d.ci || "").includes(searchTerm))
  );

  return (
    <motion.div className="p-6 md:p-10 bg-gray-50 min-h-screen relative text-left" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      
      {/* 1. Mantenemos el AnimatePresence de notificaciones igual */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-5 right-5 z-50 p-4 rounded-xl shadow-lg text-white font-bold text-sm ${
              notification.type === 'success' ? 'bg-[#5564eb]' : 'bg-red-600'
            }`}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* CABECERA CON NAVEGACIÓN */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <button 
              onClick={() => navigate("/dashboard")} 
              className="flex items-center gap-2 text-gray-400 hover:text-[#5564eb] transition-colors mb-2 group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
              <span className="text-[10px] font-black uppercase tracking-widest">Volver al Home</span>
            </button>
            
            <h1 className="text-4xl font-black text-[#5564eb] tracking-tighter uppercase">
              Gestión De Docentes
            </h1>
            <p className="text-gray-500 font-medium italic">Administración de Personal {filterNivel}</p>
          </div>

          <button 
            onClick={() => abrirEditor()} 
            className="flex items-center gap-2 bg-[#5564eb] text-white px-8 py-4 rounded-[1.5rem] shadow-xl hover:bg-[#4353d8] transition-all active:scale-95 font-black uppercase text-[11px] tracking-widest shadow-blue-200"
          >
            <UserPlus size={18} /> Nuevo Registro
          </button>
        </div>

      <div className="flex gap-4 mb-6 border-b border-gray-200">
        {["Primaria", "Secundaria"].map(nivel => (
          <button key={nivel} onClick={() => setFilterNivel(nivel)} className={`pb-2 px-4 font-bold uppercase tracking-widest text-xs transition-all ${filterNivel === nivel ? "border-b-4 border-[#5564eb] text-[#5564eb]" : "text-gray-400"}`}>{nivel}</button>
        ))}
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 relative">
        <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input type="text" placeholder={`Buscar en ${filterNivel}...`} className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 outline-none transition focus:ring-2 focus:ring-[#5564eb]" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {!loading && filteredDocentes.map((docente) => (
          <motion.div key={docente.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-md transition-all relative group">
            <button onClick={() => { setDocenteToDelete(docente.id); setIsDeleteOpen(true); }} className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 rounded-xl transition-all"><Trash2 size={16}/></button>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 overflow-hidden border-2 border-blue-100 flex-shrink-0">
                {docente.foto ? <img src={docente.foto} className="w-full h-full object-cover" /> : <UserSquare2 className="w-full h-full p-3 text-[#5564eb]" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-800 text-lg truncate">{docente.nombre} {docente.apellido}</h3>
                <div className="flex gap-2 items-center">
                  <p className="text-[10px] text-[#5564eb] font-black uppercase tracking-widest">{docente.grado_asignado || 'Sin Año'}</p>
                  {/*  Badge visual de Especialista */}
                  {docente.es_especialista && (
                    <span className="bg-purple-100 text-purple-700 text-[8px] px-2 py-0.5 rounded-full font-black uppercase border border-purple-200">
                      Especialista
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-2 mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-700"><BookOpen size={14} className="text-blue-500"/> {docente.grado_asignado} - "{docente.seccion_asignada}"</div>
            </div>
            <button onClick={() => abrirEditor(docente)} className="w-full py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-[#5564eb] hover:text-white transition-all">Editar Perfil</button>
          </motion.div>
        ))}
      </div>

      <DocenteEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedDocente={selectedDocente}
        setSelectedDocente={setSelectedDocente}
        docentes={docentes}
        onSave={handleSave}
        onInputChange={handleInputChange}
        onPhotoChange={handlePhotoChange}
        toggleMateria={toggleMateria}
        planEstudio={PLAN_ESTUDIO}
        secciones={SECCIONES}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="¿Eliminar Docente?"
        message="¿Está seguro de que desea eliminar este docente del sistema?"
      />
    </motion.div>
  );
};

export default Docentes;