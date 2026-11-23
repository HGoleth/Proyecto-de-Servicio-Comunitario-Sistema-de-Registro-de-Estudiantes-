import { useState, useEffect } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { FaUser, FaEnvelope, FaLock, FaSave, FaUserCircle } from "react-icons/fa";
import { MdVerified, MdErrorOutline } from "react-icons/md";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1, 
    transition: { type: "spring" as const, stiffness: 100 } 
  }
};

const ProfileSettings = () => {
  const [user, setUser] = useState<any>(null);
  
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: "", msg: "" });

  useEffect(() => {
    const stored = localStorage.getItem("usuario_actual");
    if (stored) {
      const parsedUser = JSON.parse(stored);
      setUser(parsedUser);
      setNombre(parsedUser.nombre || "");
      setEmail(parsedUser.email || "");
    }
  }, []);

  const showToast = (type: "success" | "error", msg: string) => {
    setNotification({ show: true, type, msg });
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password && password !== confirmPass) {
      showToast("error", "Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    try {
      const resultado = await (window as any).electron.updateUser({
        id: user?.id || user?.usuario || "admin",
        usuario: user?.usuario || "admin",
        nombre,
        email,
        password 
      });

      if (resultado.success) {
        showToast("success", "Perfil actualizado correctamente");
        
        const nuevoUsuario = { ...user, ...resultado.usuario };
        localStorage.setItem("usuario_actual", JSON.stringify(nuevoUsuario));
        setUser(nuevoUsuario);
        window.dispatchEvent(new CustomEvent("user_updated", { detail: nuevoUsuario }));
        window.dispatchEvent(new Event("storage"));
        
        setPassword("");
        setConfirmPass("");
      } else {
        showToast("error", resultado.mensaje || "Error al actualizar");
      }
    } catch {
      showToast("error", "Error de comunicación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-5xl mx-auto space-y-8 pb-10 relative"
    >
      {/* === NOTIFICACIÓN FLOTANTE === */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={`fixed top-24 right-10 z-50 flex items-center gap-3 bg-white pl-4 pr-6 py-3 rounded-lg shadow-2xl border-l-4 ${
                notification.type === "error" ? "border-red-500" : "border-green-500"
            }`}
          >
            <div className={`p-1.5 rounded-full ${
                notification.type === "error" ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
            }`}>
              {/* CORRECCIÓN: Usamos MdVerified aquí para el éxito */}
              {notification.type === "error" ? <MdErrorOutline className="text-xl" /> : <MdVerified className="text-xl" />}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-gray-800">
                  {notification.type === "error" ? "Atención" : "Éxito"}
              </span>
              <span className="text-xs text-gray-500 font-medium">{notification.msg}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-extrabold text-green-700 tracking-tight">Configuración de Perfil</h1>
        <p className="text-gray-500 mt-1">Administra tu información personal y seguridad de la cuenta.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* TARJETA IZQUIERDA */}
        <motion.div variants={itemVariants} className="md:col-span-1">
          <div className="bg-white p-8 rounded-3xl shadow-lg shadow-green-900/5 border border-green-50 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-green-50 to-transparent opacity-50" />
            
            <div className="relative w-28 h-28 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-5 text-6xl font-bold border-4 border-white shadow-sm">
                {user?.nombre ? user.nombre.charAt(0).toUpperCase() : <FaUserCircle />}
            </div>
            
            <h2 className="text-xl font-bold text-gray-800">{user?.nombre || "Usuario"}</h2>
            <p className="text-sm text-gray-500 mb-4">@{user?.usuario || "user"}</p>
            
            <span className="bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
              {user?.rol || "Rol"}
            </span>
          </div>
        </motion.div>

        {/* FORMULARIO */}
        <motion.div variants={itemVariants} className="md:col-span-2">
          <form onSubmit={handleUpdate} className="bg-white p-8 rounded-3xl shadow-lg shadow-green-900/5 border border-green-50 space-y-8">
            
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2 border-b border-gray-100 pb-2">
                <FaUser className="text-green-600" /> Información Básica
              </h3>
              <div className="grid grid-cols-1 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2 ml-1">Nombre Completo</label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-gray-700"
                    placeholder="Tu nombre"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2 ml-1">Correo Electrónico</label>
                  <div className="relative">
                    <FaEnvelope className="absolute left-4 top-4 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-11 p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-gray-700"
                      placeholder="correo@ejemplo.com"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-5 flex items-center gap-2 border-b border-gray-100 pb-2">
                <FaLock className="text-green-600" /> Seguridad
              </h3>
              <div className="bg-orange-50/50 p-3 rounded-lg border border-orange-100 mb-5">
                 <p className="text-xs text-orange-600 font-medium">⚠️ Solo llena estos campos si deseas cambiar tu contraseña actual.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2 ml-1">Nueva Contraseña</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-gray-700"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2 ml-1">Confirmar Contraseña</label>
                  <input
                    type="password"
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-gray-700"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={loading}
                className={`flex items-center gap-2 px-8 py-3.5 bg-green-600 text-white rounded-xl font-bold shadow-lg shadow-green-600/20 transition-all hover:bg-green-700 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                <FaSave />
                {loading ? "Guardando..." : "Guardar Cambios"}
              </motion.button>
            </div>

          </form>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ProfileSettings;