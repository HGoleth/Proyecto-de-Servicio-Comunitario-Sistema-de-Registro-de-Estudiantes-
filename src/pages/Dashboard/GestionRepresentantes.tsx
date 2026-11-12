import { useState, useEffect } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { useNavigate } from "react-router-dom"; 
import { 
  Users, 
  Search,
  Baby,
  Phone,
  Contact2,
  X,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  ArrowLeft,
  ArrowUpRight,
  Edit,
  Save,
  Camera
} from "lucide-react";

const fadeIn: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const GestionRepresentantes = () => {
  const navigate = useNavigate(); 
  const [representantes, setRepresentantes] = useState<any[]>([]);
  const [repSeleccionado, setRepSeleccionado] = useState<any | null>(null);
  const [repAEditar, setRepAEditar] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // ✅ Estados locales para el manejo del teléfono desglosado
  const [phonePrefix, setPhonePrefix] = useState("0424");
  const [phoneBody, setPhoneBody] = useState("");

  const [modalNotify, setModalNotify] = useState<{ 
    show: boolean; 
    type: "success" | "error" | "warning"; 
    title: string; 
    message: string 
  }>({
    show: false,
    type: "success",
    title: "",
    message: ""
  });

  useEffect(() => {
    cargarRepresentantes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarRepresentantes = async () => {
    try {
      const ests = await (window as any).electron.getStudents();
      if (ests && Array.isArray(ests)) {
        procesarRepresentantes(ests);
      }
    } catch (error) {
      console.error("Error al obtener datos:", error);
    }
  };

  const procesarRepresentantes = (estudiantes: any[]) => {
  const mapaRepresentantes = estudiantes.reduce((acc: any, est: any) => {
    const cedulaReal = est.repCI || est.repCedula;
    // ✅ Prioridad a campos desglosados, respaldo en repName
    const nombreFinal = est.repFirstName ? `${est.repFirstName} ${est.repLastName || ""}` : est.repName;
    
    const ciValida = cedulaReal && cedulaReal !== "S/C" && cedulaReal !== "" ? cedulaReal : null;
    const nombreValido = nombreFinal && nombreFinal !== "Representante Pendiente" && nombreFinal !== "" ? nombreFinal : null;

    if (!ciValida && !nombreValido) return acc;
    const key = ciValida || `TEMP-${nombreValido}`;

    if (!acc[key]) {
      acc[key] = {
        // ✅ Guardamos las partes por separado para el editor
        nombre: nombreFinal || "Representante Pendiente",
        nombreCompleto: nombreFinal || "Representante Pendiente",
        nombres: est.repFirstName || est.repName?.split(' ')[0] || "",
        apellidos: est.repLastName || est.repName?.split(' ').slice(1).join(' ') || "",
        cedula: ciValida || "S/C",
        telefono: est.repPhone || "",
        parentesco: est.relationship || "N/A",
        email: est.repEmail || "",
        foto: est.repPhoto || null,
        hijos: []
      };
    }
      
      const yaExisteHijo = acc[key].hijos.find((h: any) => h.id === est.id);
      if (!yaExisteHijo) {
        acc[key].hijos.push({
          nombre: `${est.firstName} ${est.lastName}`, 
          id: est.id,
          grado: `${est.grade} "${est.section}"`,
          foto: est.studentPhoto,
          datosCompletos: est
        });
      }
      return acc;
    }, {});

    setRepresentantes(Object.values(mapaRepresentantes));
  };

  // ✅ Al abrir el editor, separamos el prefijo del cuerpo del teléfono
  const abrirEditor = (rep: any) => {
    const fullPhone = rep.telefono || "";
    if (fullPhone.length >= 4) {
      setPhonePrefix(fullPhone.substring(0, 4));
      setPhoneBody(fullPhone.substring(4));
    } else {
      setPhonePrefix("0424");
      setPhoneBody("");
    }
    setRepAEditar(rep);
    setRepSeleccionado(null);
  };

  const guardarCambiosRepresentante = async () => {
  if (!repAEditar) return;

  if (phoneBody.length !== 7) {
    setModalNotify({ show: true, type: "error", title: "Error de Validación", message: "El número de teléfono debe tener exactamente 7 dígitos." });
    return;
  }

  try {
    const telefonoFinal = `${phonePrefix}${phoneBody}`;
    for (const hijo of repAEditar.hijos) {
      const datosActualizados = {
        ...hijo.datosCompletos,
        // ✅ Sincronización con los nuevos campos de la matrícula
        repFirstName: repAEditar.nombres,
        repLastName: repAEditar.apellidos,
        repName: `${repAEditar.nombres} ${repAEditar.apellidos}`, // Mantenemos repName por compatibilidad
        repCI: repAEditar.cedula,
        repPhone: telefonoFinal,
        relationship: repAEditar.parentesco,
        repEmail: repAEditar.email,
        repPhoto: repAEditar.foto
      };
      await (window as any).electron.updateStudent(datosActualizados);
    }

    setModalNotify({ show: true, type: "success", title: "Sincronización Exitosa", message: `Datos de ${repAEditar.nombres} actualizados en ${repAEditar.hijos.length} representados.` });
    setRepAEditar(null);
    cargarRepresentantes();
  } catch {
    setModalNotify({ show: true, type: "error", title: "Error", message: "No se pudieron sincronizar los cambios." });
  }
};

  const irAEstudiante = (idEstudiante: string) => {
    if (!idEstudiante) return;
    localStorage.setItem("filterStudentID", idEstudiante);
    navigate("/dashboard/estudiantes/administracion"); 
  };

  const irATodosLosHijos = (cedulaRep: string) => {
    if (!cedulaRep || cedulaRep === "S/C") {
      setModalNotify({ show: true, type: "warning", title: "Dato Incompleto", message: "No hay cédula válida para filtrar." });
      return;
    }
    localStorage.setItem("filterRepIdentidad", cedulaRep);
    navigate("/dashboard/estudiantes/administracion"); 
  };

  const datosFiltrados = representantes.filter(r => 
    (r.nombreCompleto || r.nombre || `${r.nombres} ${r.apellidos}`)?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.cedula?.toString().includes(searchTerm)
  );

  return (
    <motion.div className="p-6 md:p-10 max-w-7xl mx-auto text-left min-h-screen bg-[#f4f6fb]" variants={fadeIn} initial="hidden" animate="visible">
      
      <AnimatePresence>
        {modalNotify.show && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full text-center relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-full h-2 ${modalNotify.type === "success" ? "bg-green-500" : modalNotify.type === "warning" ? "bg-yellow-500" : "bg-red-500"}`} />
              <div className="flex justify-center mb-4">
                {modalNotify.type === "success" ? <CheckCircle className="text-green-500" size={56} /> : <AlertTriangle className={modalNotify.type === "warning" ? "text-yellow-500" : "text-red-500"} size={56} />}
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{modalNotify.title}</h3>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">{modalNotify.message}</p>
              <button onClick={() => setModalNotify({ ...modalNotify, show: false })} className="w-full py-3 rounded-xl bg-gray-800 text-white font-bold hover:bg-gray-900 transition-all shadow-lg uppercase text-[10px] tracking-widest">Entendido</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ✅ MODAL DE EDICIÓN CON VALIDACIONES EN TIEMPO REAL (DESGLOSADO) */}
<AnimatePresence>
  {repAEditar && (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }} 
        exit={{ opacity: 0, scale: 0.9 }} 
        className="bg-white rounded-[3rem] p-10 shadow-2xl max-w-2xl w-full relative text-left overflow-hidden"
      >
        
        {/* CABECERA DEL MODAL */}
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <div>
            <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">Editar Representante</h3>
            <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mt-1 italic">
              Vínculo: {repAEditar.hijos.length} hijos registrados.
            </p>
          </div>
          <button onClick={() => setRepAEditar(null)} className="text-gray-400 hover:text-red-500 transition-colors">
            <X size={28}/>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-black uppercase">
          {/* FOTO */}
          <div className="md:col-span-2 flex justify-center mb-4">
             <div className="relative group">
                <div className="w-32 h-32 rounded-[2rem] overflow-hidden border-4 border-gray-50 shadow-lg bg-gray-100">
                  {repAEditar.foto ? (
                    <img src={repAEditar.foto} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <Contact2 className="w-full h-full p-8 text-gray-300" />
                  )}
                </div>
                <label className="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer rounded-[2rem] backdrop-blur-sm">
                  <Camera size={24} />
                  <span className="text-[8px] mt-1 text-center font-black uppercase">Cambiar Foto Representante</span>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setRepAEditar({...repAEditar, foto: reader.result});
                      reader.readAsDataURL(file);
                    }
                  }} />
                </label>
             </div>
          </div>

          {/* ✅ DESGLOSE DE IDENTIDAD: NOMBRES Y APELLIDOS (CORREGIDO) */}
          <div className="space-y-1">
            <label className="text-[10px] text-gray-400 ml-2 uppercase font-black tracking-widest">Nombres</label>
            <input 
              placeholder="Ej: Josefina"
              value={repAEditar.nombres || ""} 
              onChange={e => {
                const val = e.target.value.replace(/[^a-zA-Z\sñÑáéíóúÁÉÍÓÚüÜ]/g, ""); 
                setRepAEditar({...repAEditar, nombres: val});
              }} 
              className="w-full p-4 bg-gray-50 rounded-2xl border-none shadow-inner text-sm outline-none focus:ring-2 focus:ring-green-500 uppercase font-black" 
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-gray-400 ml-2 uppercase font-black tracking-widest">Apellidos</label>
            <input 
              placeholder="Ej: Perez"
              value={repAEditar.apellidos || ""} 
              onChange={e => {
                const val = e.target.value.replace(/[^a-zA-Z\sñÑáéíóúÁÉÍÓÚüÜ]/g, ""); 
                setRepAEditar({...repAEditar, apellidos: val});
              }} 
              className="w-full p-4 bg-gray-50 rounded-2xl border-none shadow-inner text-sm outline-none focus:ring-2 focus:ring-green-500 uppercase font-black" 
            />
          </div>

          {/* CÉDULA */}
          <div className="space-y-1">
            <label className="text-[10px] text-gray-400 ml-2 uppercase font-black tracking-widest">Cédula de Identidad</label>
            <input 
              value={repAEditar.cedula} 
              onChange={e => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                setRepAEditar({...repAEditar, cedula: val});
              }} 
              className="w-full p-4 bg-gray-50 rounded-2xl border-none shadow-inner text-sm outline-none focus:ring-2 focus:ring-green-500 font-mono font-black" 
            />
          </div>

          {/* PARENTESCO */}
          <div className="space-y-1">
            <label className="text-[10px] text-gray-400 ml-2 uppercase font-black tracking-widest">Parentesco</label>
            <input 
              value={repAEditar.parentesco} 
              onChange={e => {
                const containsNumbers = /\d/.test(e.target.value);
                if (containsNumbers) {
                  setModalNotify({ 
                    show: true, 
                    type: "warning", 
                    title: "Entrada Inválida", 
                    message: "El campo parentesco no permite números." 
                  });
                }
                const val = e.target.value.replace(/[^a-zA-Z\sñÑáéíóúÁÉÍÓÚüÜ]/g, ""); 
                setRepAEditar({...repAEditar, parentesco: val});
              }} 
              className="w-full p-4 bg-gray-50 rounded-2xl border-none shadow-inner text-sm outline-none focus:ring-2 focus:ring-green-500 uppercase font-black" 
            />
          </div>

          {/* TELÉFONO SECCIONADO */}
          <div className="space-y-1">
            <label className="text-[10px] text-gray-400 ml-2 uppercase font-black tracking-widest">Operadora</label>
            <div className="relative">
              <select 
                value={phonePrefix} 
                onChange={e => setPhonePrefix(e.target.value)}
                className="w-full p-4 bg-gray-50 rounded-2xl border-none shadow-inner text-sm outline-none focus:ring-2 focus:ring-green-500 cursor-pointer appearance-none font-black"
              >
                {["0424", "0412", "0426", "0416", "0422", "0414"].map(pref => (
                  <option key={pref} value={pref}>{pref}</option>
                ))}
              </select>
              <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-gray-400 ml-2 uppercase font-black tracking-widest">Número (7 Dígitos)</label>
            <input 
              placeholder="7675645"
              value={phoneBody} 
              onChange={e => setPhoneBody(e.target.value.replace(/\D/g, "").slice(0, 7))} 
              className={`w-full p-4 bg-gray-50 rounded-2xl border-none shadow-inner text-sm outline-none focus:ring-2 font-black ${phoneBody.length > 0 && phoneBody.length < 7 ? 'ring-red-400 border-red-100' : 'focus:ring-green-500'}`} 
            />
            {phoneBody.length > 0 && phoneBody.length < 7 && (
              <p className="text-[8px] text-red-500 font-bold ml-2 italic uppercase">Faltan dígitos</p>
            )}
          </div>
        </div>

        {/* ACCIONES */}
        <div className="mt-10 flex gap-4">
          <button 
            onClick={() => setRepAEditar(null)} 
            className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-200 transition-all active:scale-95 shadow-sm"
          >
            Cancelar
          </button>
          <button 
            onClick={guardarCambiosRepresentante} 
            disabled={phoneBody.length !== 7 || !repAEditar.parentesco || !repAEditar.nombres}
            className="flex-1 py-4 bg-green-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-green-700 transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            <Save size={16}/> Sincronizar Cambios
          </button>
        </div>
      </motion.div>
    </div>
  )}
</AnimatePresence>

      {/* MODAL DE DETALLE (HIJOS) */}
      <AnimatePresence>
        {repSeleccionado && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="bg-white rounded-[2.5rem] p-8 shadow-2xl max-w-lg w-full relative text-left">
              <button onClick={() => setRepSeleccionado(null)} className="absolute top-6 right-6 text-gray-400 hover:text-red-500 transition-all"><X size={28}/></button>
              <div className="mb-6 border-b pb-4">
                <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tighter">Representados de {repSeleccionado.nombreCompleto || repSeleccionado.nombre}</h3>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => irATodosLosHijos(repSeleccionado.cedula)} className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-600 hover:text-white transition-all border border-green-100 shadow-sm">
                    <Users size={14}/> Filtrar Matrícula
                  </button>
                  <button onClick={() => abrirEditor(repSeleccionado)} className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all border border-blue-100 shadow-sm">
                    <Edit size={14}/> Editar Datos
                  </button>
                </div>
              </div>
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                {repSeleccionado.hijos.map((hijo: any) => (
                  <motion.div key={hijo.id} whileHover={{ x: 5 }} onClick={() => irAEstudiante(hijo.id)} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 cursor-pointer hover:bg-green-50 hover:border-green-200 transition-all group">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-200 border border-gray-200">
                      {hijo.foto ? <img src={hijo.foto} className="w-full h-full object-cover" alt="" /> : <Baby className="w-full h-full p-2 text-gray-400" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-700 text-sm group-hover:text-green-700 transition-colors uppercase">{hijo.nombre}</p>
                      <p className="text-[10px] text-green-600 font-bold uppercase tracking-widest">{hijo.grado}</p>
                    </div>
                    <ChevronRight size={18} className="text-gray-300 group-hover:text-green-500" />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CABECERA PRINCIPAL */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-green-600 transition-colors mb-2">
            <ArrowLeft size={16} /> <span className="text-[10px] font-black uppercase tracking-widest">Volver al Home</span>
          </button>
          <h1 className="text-4xl font-black text-green-700 tracking-tight uppercase tracking-tighter">Gestión de Representantes</h1>
          <p className="mt-2 text-gray-500 font-medium italic">Base de datos unificada de tutores legales.</p>
        </div>

        <div className="relative w-full md:w-96">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="BUSCAR REPRESENTANTE O CÉDULA..." 
            className="w-full pl-12 pr-6 py-4 rounded-2xl border border-gray-100 shadow-sm focus:ring-2 focus:ring-green-500 outline-none text-[11px] font-bold uppercase tracking-widest"
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      {/* GRID DE TARJETAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {datosFiltrados.map((rep: any, idx: number) => (
          <motion.div key={idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white border border-gray-100 rounded-[2.5rem] p-6 shadow-sm hover:shadow-xl transition-all group text-left">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white border-2 border-green-50 group-hover:border-green-500 transition-colors shadow-sm">
                {rep.foto ? <img src={rep.foto} className="w-full h-full object-cover" alt="" /> : <Contact2 className="w-full h-full p-3 text-gray-300" />}
              </div>
              <div className="truncate">
                <h4 className="font-black text-gray-800 truncate uppercase tracking-tighter leading-tight mb-1">{rep.nombreCompleto}</h4>
                <div className="flex gap-2 items-center">
                   <span className="text-[9px] font-black bg-green-100 text-green-700 px-2 py-0.5 rounded-lg uppercase">{rep.parentesco}</span>
                   <button onClick={() => abrirEditor(rep)} className="text-gray-300 hover:text-blue-500 transition-colors"><Edit size={12}/></button>
                </div>
              </div>
            </div>
            <div className="space-y-2 mb-6 px-2">
              <p className="text-xs text-gray-500 flex items-center gap-2 font-bold"><Phone size={14} className="text-green-600"/> {rep.telefono || "S/T"}</p>
              <p className="text-[10px] text-gray-400 flex items-center gap-2 font-mono">C.I: {rep.cedula}</p>
            </div>
            <button onClick={() => setRepSeleccionado(rep)} className="w-full py-4 bg-gray-50 text-gray-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-green-600 hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm border border-gray-100">
              Expedientes Vinculados ({rep.hijos.length}) <ArrowUpRight size={14} />
            </button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default GestionRepresentantes;