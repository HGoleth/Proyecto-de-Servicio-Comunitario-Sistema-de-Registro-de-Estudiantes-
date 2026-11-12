import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MdAlternateEmail, MdErrorOutline, MdCheckCircle, MdPersonOutline } from "react-icons/md";
import { FaFingerprint, FaUser } from "react-icons/fa"; 
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import WindowControls from "./common/WindowControls";

// --- DEFINICIÓN DE TIPOS PARA ELECTRON ---
interface ElectronAPI {
  login: (credentials: { usuario: string; password: string }) => Promise<{ success: boolean; mensaje?: string; rol?: string; usuario?: string; nombre?: string }>;
  register: (data: { nombre: string; username: string; email: string; password: string }) => Promise<{ success: boolean; mensaje?: string }>;
  recoverPassword: (email: string) => Promise<{ success: boolean; mensaje?: string }>;
  minimize: () => void;
  close: () => void;
  setClickThrough: (enabled: boolean) => void;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false); // ✅ Nuevo estado para ver clave en registro
  const [screen, setScreen] = useState<"login" | "register" | "forgot">("login");
  const navigate = useNavigate();

  // --- ESTADOS LOGIN ---
  const [loginInput, setLoginInput] = useState(""); 
  const [password, setPassword] = useState("");
  
  // --- ESTADOS REGISTRO ---
  const [regName, setRegName] = useState("");
  const [regUser, setRegUser] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPass, setRegPass] = useState("");

  // --- ESTADOS RECUPERACIÓN ---
  const [forgotEmail, setForgotEmail] = useState("");

  // --- ESTADOS UI ---
  const [notification, setNotification] = useState({ show: false, type: "", msg: "" });
  const [isLoading, setIsLoading] = useState(false);

  const togglePasswordView = () => setShowPassword(!showPassword);
  const toggleRegPasswordView = () => setShowRegPassword(!showRegPassword); // ✅ Helper para registro

  // Helper
  const showToast = (type: string, msg: string) => {
    setNotification({ show: true, type, msg });
    setTimeout(() => {
        setNotification({ show: false, type: "", msg: "" });
    }, 4000);
  };

  // --- VALIDACIONES ---
  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // --- VALIDACIONES ACTUALIZADAS ---
const validatePassword = (pass: string) => {
  // Entre 8 y 12 caracteres, al menos una mayúscula, una minúscula, un número y un carácter especial
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,12}$/;
  return re.test(pass);
};

  const validateUsername = (user: string) => {
    // Solo letras y números, min 4 caracteres, sin espacios
    const re = /^[a-zA-Z0-9]{4,}$/;
    return re.test(user);
  };

  // --- FUNCIÓN DE LOGIN ---
  const handleLogin = async () => {
    if (!loginInput || !password) {
      showToast("error", "Ingresa tu usuario/correo y contraseña");
      return;
    }

    setIsLoading(true);

    try {
      if (!window.electron?.login) {
        const mockUser = { success: true, usuario: loginInput || "admin", rol: "director", nombre: "Administrador", email: "admin@escuela.com" };
        localStorage.setItem("usuario_actual", JSON.stringify(mockUser));
        navigate("/dashboard", { replace: true });
        return;
      }
      const resultado = await window.electron.login({ usuario: loginInput, password });
      
      if (resultado.success) {
        console.log("Login correcto:", resultado.usuario);
        
        // GUARDAMOS EL USUARIO PARA EL DASHBOARD
        localStorage.setItem("usuario_actual", JSON.stringify(resultado));

        navigate("/dashboard", { replace: true });
      } else {
        showToast("error", resultado.mensaje || "Error desconocido");
      }
    } catch {
      showToast("error", "Error de conexión");
    } finally {
      setIsLoading(false);
    }
  };

  // --- FUNCIÓN DE REGISTRO ---
  const handleRegister = async () => {
    // Validaciones
    if (!regName.trim() || !regUser.trim() || !regEmail.trim() || !regPass.trim()) {
        showToast("error", "Todos los campos son obligatorios");
        return;
    }
    if (!validateUsername(regUser)) {
        showToast("error", "Usuario: mín 4 letras/números, sin espacios.");
        return;
    }
    if (!validateEmail(regEmail)) {
        showToast("error", "El formato del correo no es válido.");
        return;
    }
    if (!validatePassword(regPass)) {
    showToast(
      "error", 
      "Contraseña inválida: debe tener entre 8 y 12 caracteres, incluir una mayúscula, una minúscula, un número y un carácter especial."
    ); 
    return;
    }

    setIsLoading(true);

    try {
        const resultado = await window.electron.register({
            nombre: regName,
            username: regUser,
            email: regEmail,
            password: regPass
        });

        if (resultado.success) {
            showToast("success", "¡Cuenta creada! Inicia sesión.");
            // Limpiar formulario
            setRegName(""); setRegUser(""); setRegEmail(""); setRegPass("");
            setTimeout(() => setScreen("login"), 2000);
        } else {
            showToast("error", resultado.mensaje || "Error al registrar");
        }
    } catch {
        showToast("error", "Error al intentar registrar");
    } finally {
        setIsLoading(false);
    }
  };

  // --- FUNCIÓN RECUPERAR CLAVE ---
  const handleRecover = async () => {
    if (!forgotEmail.trim()) {
        showToast("error", "Por favor ingresa tu correo electrónico.");
        return;
    }
    if (!validateEmail(forgotEmail)) {
        showToast("error", "Ingresa un correo electrónico válido.");
        return;
    }

    setIsLoading(true);

    try {
        const resultado = await window.electron.recoverPassword(forgotEmail);

        if (resultado.success) {
            showToast("success", "Enlace enviado a tu correo.");
            setForgotEmail("");
            setTimeout(() => setScreen("login"), 3000);
        } else {
            showToast("error", resultado.mensaje || "Error al verificar correo");
        }
    } catch {
        showToast("error", "Error de comunicación");
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    if (window.electron) window.electron.setClickThrough(false);
  }, []);

  return (
    <div className="w-full h-screen flex items-center justify-center bg-transparent pointer-events-none">
      <motion.div
        id="login-modal"
        className="w-[90%] max-w-5xl h-[80vh] bg-white rounded-3xl shadow-2xl flex overflow-hidden relative pointer-events-auto"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* NOTIFICACIÓN TOAST */}
        <AnimatePresence>
          {notification.show && (
            <motion.div
              key="toast"
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className={`absolute top-14 right-6 z-50 flex items-center gap-3 bg-white pl-4 pr-6 py-3 rounded-lg shadow-xl border-l-4 ${
                  notification.type === "error" ? "border-red-500" : "border-green-500"
              }`}
            >
              <div className={`p-1.5 rounded-full ${
                  notification.type === "error" ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
              }`}>
                {notification.type === "error" ? <MdErrorOutline className="text-xl" /> : <MdCheckCircle className="text-xl" />}
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

        {/* Barra superior con controles de ventana */}
        <div className="absolute top-0 left-0 w-full h-11 flex justify-end items-center px-4 z-50 select-none" style={{ WebkitAppRegion: "drag" as any }}>
          <WindowControls />
        </div>

        {/* LADO IZQUIERDO */}
        <div className="w-1/2 hidden md:flex flex-col justify-center items-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-800 via-green-600 to-green-400 animate-wave" style={{ clipPath: "polygon(0 0, 100% 0, 80% 100%, 0% 100%)", opacity: 0.95 }} />
          <motion.div className="relative z-10 flex flex-col justify-center items-center text-white p-10" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.8 }}>
            <img src="./logo.png" alt="logo" className="w-40 md:w-44 mb-6 drop-shadow-[0_0_22px_rgba(255,255,255,0.45)] object-contain" />
            <h1 className="text-2xl md:text-3xl font-bold mb-4 drop-shadow-md text-center">U.E. "REPÚBLICA DE CHILE"</h1>
            <p className="text-center text-white/90 text-sm leading-relaxed max-w-sm"></p>
            <div className="absolute bottom-6 text-xs text-white/70">© 2025 Todos los derechos reservados.</div>
          </motion.div>
        </div>

        {/* LADO DERECHO */}
        <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-10 bg-white relative z-10">
          <AnimatePresence mode="wait">
            
            {/* ================= LOGIN ================= */}
            {screen === "login" && (
              <motion.div key="login" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -40 }} transition={{ duration: 0.45 }} className="w-full flex flex-col items-center">
                <div className="flex flex-col items-center">
                  <h2 className="text-2xl md:text-3xl font-bold text-green-700 mb-3">¡Bienvenido!</h2>
                  <p className="text-gray-500 text-sm mb-6"></p>
                </div>

                <div className="w-full max-w-sm flex flex-col gap-4">
                  <div className="flex items-center gap-2 bg-gray-100 p-3 rounded-xl border border-gray-200 focus-within:border-green-500 transition">
                    <FaUser className="text-green-600" />
                    <input 
                        type="text" 
                        placeholder="Usuario o Correo" 
                        className="bg-transparent border-0 outline-none w-full text-gray-700" 
                        value={loginInput} 
                        onChange={(e) => setLoginInput(e.target.value)} 
                    />
                  </div>
                  <div className="flex items-center gap-2 bg-gray-100 p-3 rounded-xl border border-gray-200 relative focus-within:border-green-500 transition">
                    <FaFingerprint className="text-green-600" />
                    <input type={showPassword ? "text" : "password"} placeholder="Contraseña" className="bg-transparent border-0 outline-none w-full text-gray-700" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
                    <div onClick={togglePasswordView} className="absolute right-5 cursor-pointer text-gray-500 hover:text-green-600 transition">
                        {showPassword ? <FaRegEyeSlash /> : <FaRegEye />}
                    </div>
                  </div>
                  
                  <div className="w-full text-right mt-1">
                    <button className="text-xs text-green-600 hover:underline font-medium" onClick={() => setScreen("forgot")}>¿Olvidaste tu contraseña?</button>
                  </div>
                  <button onClick={handleLogin} disabled={isLoading} className={`w-full p-3 bg-green-600 text-white rounded-xl font-semibold transition-all shadow-md ${isLoading ? 'opacity-70' : 'hover:bg-green-700 hover:shadow-lg'}`}>
                    {isLoading ? "Verificando..." : "Iniciar sesión"}
                  </button>
                </div>
                <div className="mt-8 text-xs text-gray-500">¿No tienes una cuenta? <span className="text-green-600 cursor-pointer hover:underline" onClick={() => setScreen("register")}>Regístrate</span></div>
              </motion.div>
            )}

            {/* ================= REGISTRO ================= */}
            {screen === "register" && (
              <motion.div 
                key="register" 
                initial={{ opacity: 0, x: 80 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -80 }} 
                transition={{ duration: 0.45 }} 
                className="w-full flex flex-col items-center"
              >
                <h2 className="text-2xl md:text-3xl font-bold text-green-700 mb-3">Crear cuenta</h2>
                <p className="text-gray-500 text-sm mb-6">Completa los campos para registrarte</p>
                
                <div className="w-full max-w-sm flex flex-col gap-3">
                  {/* Nombre Completo */}
                  <div className="flex items-center gap-2 bg-gray-100 p-3 rounded-xl border border-gray-200 focus-within:border-green-500 transition">
                    <MdPersonOutline className="text-green-600 text-lg" />
                    <input 
                      type="text" 
                      placeholder="Nombre completo" 
                      className="bg-transparent border-0 outline-none w-full text-sm font-medium" 
                      value={regName} 
                      onChange={(e) => setRegName(e.target.value)} 
                    />
                  </div>

                  {/* Usuario */}
                  <div className="flex items-center gap-2 bg-gray-100 p-3 rounded-xl border border-gray-200 focus-within:border-green-500 transition">
                    <FaUser className="text-green-600 text-sm" />
                    <input 
                      type="text" 
                      placeholder="Usuario (ej. juan123)" 
                      className="bg-transparent border-0 outline-none w-full text-sm font-medium" 
                      value={regUser} 
                      onChange={(e) => setRegUser(e.target.value)} 
                    />
                  </div>

                  {/* Correo con Formato Solicitado */}
                  <div className="flex items-center gap-2 bg-gray-100 p-3 rounded-xl border border-gray-200 focus-within:border-green-500 transition">
                    <MdAlternateEmail className="text-green-600 text-lg" />
                    <input 
                      type="email" 
                      placeholder="Correo electrónico (xxxx@xxxxx.com)" 
                      className="bg-transparent border-0 outline-none w-full text-sm font-medium" 
                      value={regEmail} 
                      onChange={(e) => setRegEmail(e.target.value)} 
                    />
                  </div>

                  {/* Contraseña con Requisitos y Visibilidad */}
                  <div className="flex items-center gap-2 bg-gray-100 p-3 rounded-xl border border-gray-200 relative focus-within:border-green-500 transition">
                    <FaFingerprint className="text-green-600 text-sm" />
                    <input 
                      type={showRegPassword ? "text" : "password"} 
                      placeholder="Contraseña (8-12 carac., Mayús, Núm, Especial)" 
                      className="bg-transparent border-0 outline-none w-full text-sm font-medium" 
                      value={regPass} 
                      onChange={(e) => setRegPass(e.target.value)} 
                    />
                    <div 
                      onClick={toggleRegPasswordView} 
                      className="absolute right-5 cursor-pointer text-gray-500 hover:text-green-600 transition"
                    >
                      {showRegPassword ? <FaRegEyeSlash /> : <FaRegEye />}
                    </div>
                  </div>

                  <button 
                    onClick={handleRegister} 
                    disabled={isLoading} 
                    className={`w-full p-3 bg-green-600 text-white rounded-xl font-semibold transition-all shadow-md mt-2 ${
                      isLoading ? 'opacity-70' : 'hover:bg-green-700 hover:shadow-lg'
                    }`}
                  >
                    {isLoading ? "Registrando..." : "Registrarse"}
                  </button>
                </div>
                <div className="mt-4 text-xs text-gray-500">
                  ¿Ya tienes una cuenta?{" "}
                  <span 
                    className="text-green-600 cursor-pointer hover:underline" 
                    onClick={() => setScreen("login")}
                  >
                    Inicia sesión
                  </span>
                </div>
              </motion.div>
            )}

            {/* ================= RECUPERAR CONTRASEÑA ================= */}
            {screen === "forgot" && (
              <motion.div key="forgot" initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }} className="w-full flex flex-col items-center text-center">
                <h2 className="text-2xl md:text-3xl font-bold text-green-700 mb-3">Recuperar contraseña</h2>
                <p className="text-gray-600 text-sm mb-6 max-w-xs">Ingresa tu correo y te enviaremos un enlace.</p>
                <div className="w-full max-w-sm flex flex-col gap-4">
                    <div className="flex items-center gap-2 bg-gray-100 p-3 rounded-xl border border-gray-200 focus-within:border-green-500 transition">
                        <MdAlternateEmail className="text-green-600" />
                        <input 
                            type="email" 
                            placeholder="Correo electrónico" 
                            className="bg-transparent border-0 outline-none w-full text-gray-700 font-medium"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                        />
                    </div>
                    <button onClick={handleRecover} disabled={isLoading} className={`w-full p-3 bg-green-600 text-white rounded-xl font-semibold shadow-md transition-all ${isLoading ? 'opacity-70' : 'hover:bg-green-700 hover:shadow-lg'}`}>
                        {isLoading ? "Enviando..." : "Enviar enlace"}
                    </button>
                </div>
                <div className="mt-5 text-xs text-gray-500">¿Recordaste tu contraseña? <span className="text-green-600 cursor-pointer hover:underline" onClick={() => setScreen("login")}>Inicia sesión</span></div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;