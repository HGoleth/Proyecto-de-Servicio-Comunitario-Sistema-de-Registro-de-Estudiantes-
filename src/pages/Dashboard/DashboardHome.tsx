import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Users, 
  FileText, 
  Settings, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  PlusCircle, 
  UserCheck, 
  LayoutGrid, 
  BookOpen,
  ArrowUpRight,
  Globe,
  Eye, 
  EyeOff,
  BarChart3,
  ChevronRight // ✅ Añadido para el indicador visual
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell 
} from "recharts";

// ✅ INTERFAZ PARA EVITAR EL ERROR 'UNKNOWN'
interface ChartPoint {
  label: string;
  Inscritos?: number;
  Pendientes?: number;
  Retirados?: number;
  Inicial?: number;
  Primaria?: number;
  Secundaria?: number;
  [key: string]: any; 
}

const getPriorPeriod = (periodStr: string): string => {
  const match = (periodStr || "").match(/^(\d{4})-(\d{4})$/);
  if (match) {
    const y1 = parseInt(match[1]) - 1;
    const y2 = parseInt(match[2]) - 1;
    return `${y1}-${y2}`;
  }
  const matchSingle = (periodStr || "").match(/\d{4}/);
  if (matchSingle) {
    const y = parseInt(matchSingle[0]) - 1;
    return `${y}-${y + 1}`;
  }
  return "2024-2025";
};

const DashboardHome = () => {
  const navigate = useNavigate();
  
  const [perspective, setPerspective] = useState<"students" | "academic">("students");
  const [dbStats, setDbStats] = useState({ total: 0, sub1: 0, sub2: 0, sub3: 0, sub4: 0 });
  const [dynamicChart, setDynamicChart] = useState<ChartPoint[]>([]);
  const [dynamicPie, setDynamicPie] = useState<any[]>([]);
  const [seccionesCards, setSeccionesCards] = useState<any[]>([]);
  const [expanded, setExpanded] = useState(false); 
  const [isMounted, setIsMounted] = useState(false);
  // ✅ Inicializado como objeto para soportar filtros múltiples
  const [activeFilters, setActiveFilters] = useState<any>({ charts: [], nivelCard: "Todos" });

  // ✅ Estados para gestión dinámica del período escolar institucional
  const [currentPeriod, setCurrentPeriod] = useState<string>(() => localStorage.getItem("sistema_periodo_activo") || "2025-2026");
  const [selectedPeriod, setSelectedPeriod] = useState<string>(() => localStorage.getItem("sistema_periodo_activo") || "2025-2026");
  const [availablePeriods, setAvailablePeriods] = useState<string[]>(["2025-2026", "2026-2027"]);
  const [rawStudents, setRawStudents] = useState<any[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const processStats = useCallback((
    studentsData: any[],
    periodFilter: string,
    activeYear: string,
    mode: "students" | "academic"
  ) => {
    // Filtrar estudiantes según el período seleccionado
    const filteredStudents = (!periodFilter || periodFilter === "TODOS")
      ? studentsData
      : studentsData.filter((s: any) => {
          const sy = (s.schoolYear || s.periodo || "").toString().trim();
          return sy === periodFilter || sy.includes(periodFilter);
        });

    if (mode === "students") {
      const total = filteredStudents.length;
      const inscritos = filteredStudents.filter((s: any) => (s.status || "").toLowerCase().trim() === "inscrito").length;
      const pendientes = filteredStudents.filter((s: any) => (s.status || "").toLowerCase().trim() === "pendiente").length;
      const retirados = filteredStudents.filter((s: any) => (s.status || "").toLowerCase().trim() === "retirado").length;
      
      setDbStats({ total, sub1: inscritos, sub2: pendientes, sub3: retirados, sub4: 0 });
      
      const pieData = [
        { name: "Inscritos", value: inscritos },
        { name: "Pendientes", value: pendientes },
        { name: "Retirados", value: retirados }
      ];

      setDynamicPie(pieData);

      // ✅ Gráfico Histórico dinámico por períodos escolares
      const relevantPeriods = new Set<string>();
      if (activeYear) relevantPeriods.add(activeYear);
      if (periodFilter && periodFilter !== "TODOS") relevantPeriods.add(periodFilter);

      studentsData.forEach((s: any) => {
        const p = s.schoolYear || s.periodo;
        if (p) relevantPeriods.add(p);
      });

      // Asegurar al menos 2 puntos temporales para trazar el área
      const sortedRelPeriods = Array.from(relevantPeriods).filter(Boolean).sort();
      if (sortedRelPeriods.length === 1) {
        sortedRelPeriods.unshift(getPriorPeriod(sortedRelPeriods[0]));
      } else if (sortedRelPeriods.length === 0) {
        sortedRelPeriods.push(getPriorPeriod(activeYear), activeYear);
      }

      const periodsMap: Record<string, ChartPoint> = {};
      sortedRelPeriods.forEach(p => {
        periodsMap[p] = { label: p, Inscritos: 0, Pendientes: 0, Retirados: 0 };
      });

      studentsData.forEach((s: any) => {
        const p = (s.schoolYear || s.periodo || activeYear || "2025-2026").toString().trim();
        if (!periodsMap[p]) {
          periodsMap[p] = { label: p, Inscritos: 0, Pendientes: 0, Retirados: 0 };
        }
        const status = (s.status || "").toLowerCase().trim();
        if (status === "inscrito") periodsMap[p].Inscritos!++;
        else if (status === "pendiente") periodsMap[p].Pendientes!++;
        else if (status === "retirado") periodsMap[p].Retirados!++;
      });

      const chartData = Object.values(periodsMap).sort((a, b) => a.label.localeCompare(b.label));
      setDynamicChart(chartData);

    } else if (mode === "academic") {
      const activos = filteredStudents.filter((s: any) => (s.status || "").toLowerCase().trim() !== "retirado");
      const inicial = activos.filter((s: any) => (s.nivel || s.level) === "Inicial").length;
      const primaria = activos.filter((s: any) => (s.nivel || s.level || "Primaria") === "Primaria").length;
      const secundaria = activos.filter((s: any) => (s.nivel || s.level) === "Secundaria").length;

      const seccionesActivas = Array.from(new Set(activos.map((s: any) => `${s.grade} ${s.section}`))).filter(Boolean);
      
      setDbStats({ total: seccionesActivas.length, sub1: inicial, sub2: primaria, sub3: secundaria, sub4: 0 });

      const pieData = [
        { name: "Primaria", value: primaria }, 
        { name: "Secundaria", value: secundaria }, 
        { name: "Inicial", value: inicial }
      ].sort((a, b) => b.value - a.value);

      setDynamicPie(pieData);

      // ✅ Carga de tarjetas para el modo académico con los estudiantes del período seleccionado
      const grupos: Record<string, any> = {};
      activos.forEach(est => {
        if (!est.grade) return;
        const key = `${est.nivel || est.level || "Primaria"}-${est.grade}-${est.section}`;
        if (!grupos[key]) {
          grupos[key] = { 
            nivel: est.nivel || est.level || "Primaria", 
            grado: est.grade, 
            seccion: est.section, 
            matricula: 0 
          };
        }
        grupos[key].matricula++;
      });
      setSeccionesCards(Object.values(grupos));

      // Gráfico comparativo académico con los períodos reales
      const prior = getPriorPeriod(activeYear);
      setDynamicChart([
        { label: prior, Primaria: Math.max(0, primaria - 2), Secundaria: Math.max(0, secundaria - 1), Inicial: Math.max(0, inicial - 1) },
        { label: activeYear, Primaria: primaria, Secundaria: secundaria, Inicial: inicial }
      ]);
    }
  }, []);

  const loadRealData = useCallback(async () => {
    try {
      const [configData, studentsData] = await Promise.all([
        (window as any).electron?.getConfig ? (window as any).electron.getConfig() : null,
        (window as any).electron?.getStudents ? (window as any).electron.getStudents() : []
      ]);

      const activeYear = configData?.periodo || localStorage.getItem("sistema_periodo_activo") || "2025-2026";
      setCurrentPeriod(activeYear);
      localStorage.setItem("sistema_periodo_activo", activeYear);

      const sts = Array.isArray(studentsData) ? studentsData : [];
      setRawStudents(sts);

      // Construir conjunto de periodos disponibles
      const periodSet = new Set<string>();
      if (activeYear) periodSet.add(activeYear);
      sts.forEach((s: any) => {
        if (s.schoolYear) periodSet.add(s.schoolYear);
        if (s.periodo) periodSet.add(s.periodo);
      });
      ["2024-2025", "2025-2026", "2026-2027"].forEach(p => periodSet.add(p));
      const sortedPeriods = Array.from(periodSet).filter(Boolean).sort().reverse();
      setAvailablePeriods(sortedPeriods);

      // Usar el período activo si no se ha seleccionado ninguno o si el seleccionado ya no existe
      setSelectedPeriod(prev => {
        const nextPeriod = (prev && (sortedPeriods.includes(prev) || prev === "TODOS")) ? prev : activeYear;
        processStats(sts, nextPeriod, activeYear, perspective);
        return nextPeriod;
      });

    } catch (e: unknown) {
      if (e instanceof Error) console.error("Error BD:", e.message);
    }
  }, [perspective, processStats]);

  useEffect(() => {
    loadRealData();

    // ✅ Escuchar cambios en la configuración institucional en tiempo real
    const handleConfigUpdated = (e: any) => {
      const newPeriod = e.detail?.periodo;
      if (newPeriod) {
        setCurrentPeriod(newPeriod);
        setSelectedPeriod(newPeriod);
        localStorage.setItem("sistema_periodo_activo", newPeriod);
      }
      loadRealData();
    };

    const handleStorage = () => {
      const savedPeriod = localStorage.getItem("sistema_periodo_activo");
      if (savedPeriod) {
        setCurrentPeriod(savedPeriod);
      }
      loadRealData();
    };

    window.addEventListener("config_updated", handleConfigUpdated);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("config_updated", handleConfigUpdated);
      window.removeEventListener("storage", handleStorage);
    };
  }, [loadRealData]);

  // Actualizar estadísticas al cambiar de perspectiva
  useEffect(() => {
    if (rawStudents.length > 0 || currentPeriod) {
      processStats(rawStudents, selectedPeriod, currentPeriod, perspective);
    }
  }, [perspective, selectedPeriod, currentPeriod, rawStudents, processStats]);

  const handlePeriodChange = (newPeriod: string) => {
    setSelectedPeriod(newPeriod);
    processStats(rawStudents, newPeriod, currentPeriod, perspective);
  };

  const toggleFilter = (name: string) => {
    setActiveFilters((prev: any) => ({
      ...prev,
      charts: prev.charts.includes(name) ? prev.charts.filter((f: string) => f !== name) : [...prev.charts, name]
    }));
  };
  
  const handleCardClick = (sec: any) => {
    navigate("/dashboard/archivos/distribucion", { 
      state: { 
        autoOpenGrade: sec.grado, 
        autoOpenSection: sec.seccion,
        autoOpenLevel: sec.nivel 
      } 
    });
  };

  const COLORS = perspective === "students" 
    ? ["#5564eb", "#f59e0b", "#ef4444"] 
    : ["#5564eb", "#8b5cf6", "#ec4899"];

  const statsConfig = perspective === "students" ? [
    { title: "Matrícula Total", value: dbStats.total, icon: <Users size={24}/>, gradient: "from-green-600 to-green-400" },
    { title: "Alumnos Inscritos", value: dbStats.sub1, icon: <CheckCircle2 size={24}/>, gradient: "from-blue-600 to-blue-400" }, 
    { title: "Casos Pendientes", value: dbStats.sub2, icon: <Clock size={24}/>, gradient: "from-orange-500 to-orange-300" },
    { title: "Retirados", value: dbStats.sub3, icon: <TrendingUp size={24}/>, gradient: "from-slate-700 to-slate-500" },
  ] : [
      { title: "Secciones Activas", value: dbStats.total, icon: <LayoutGrid size={24}/>, gradient: "from-blue-700 to-blue-500" },
      { title: "Educación Inicial", value: dbStats.sub1, icon: <Users size={24}/>, gradient: "from-indigo-600 to-indigo-400" },
      { title: "Educación Primaria", value: dbStats.sub2, icon: <BookOpen size={24}/>, gradient: "from-purple-600 to-purple-400" },
      { title: "Media General", value: dbStats.sub3, icon: <TrendingUp size={24}/>, gradient: "from-pink-600 to-pink-400" },
    ];

  const modules = [
    { 
      title: perspective === "students" ? "Inscripción" : "Distribución Académica", 
      icon: perspective === "students" ? <PlusCircle size={26}/> : <LayoutGrid size={26}/>, 
      text: perspective === "students" ? "Nuevos Alumnos" : "Gestión de Aulas", 
      route: perspective === "students" ? "/dashboard/estudiantes" : "/dashboard/archivos/distribucion", 
      color: "text-blue-600", 
      bg: "bg-blue-50" 
    },
    ...(perspective === "students" ? [{ 
      title: "Gestión Estudiantes", 
      icon: <Users size={26}/>, 
      text: "Control Alumnos", 
      route: "/dashboard/estudiantes/administracion", 
      color: "text-green-600", 
      bg: "bg-green-50" 
    }] : []),
    { 
      title: "Notas", 
      icon: <FileText size={26}/>, 
      text: "Calificaciones", 
      route: "/dashboard/notas", 
      color: "text-purple-600", 
      bg: "bg-purple-50" 
    },
   // ✅ TARJETA DE REPORTES PARA EL MODO ACADÉMICO
    ...(perspective === "academic" ? [{
      title: "Reportes",
      icon: <BarChart3 size={26}/>,
      text: "Estadísticas",
      route: "/dashboard/reportes",
      color: "text-indigo-600",
      bg: "bg-indigo-50"
    }] : []),
    { 
      title: perspective === "students" ? "Gestión Representantes" : "Pensum y Materias", 
      icon: perspective === "students" ? <UserCheck size={26}/> : <BookOpen size={26}/>, 
      text: perspective === "students" ? "Padres y Tutores" : "Malla Curricular", 
      route: perspective === "students" ? "/dashboard/representantes" : "/dashboard/pensum", 
      color: "text-orange-600", 
      bg: "bg-orange-50" 
    },
    { 
      title: "Configuración", 
      icon: <Settings size={26}/>, 
      text: "Sistema", 
      route: "/dashboard/archivos", 
      color: "text-slate-600", 
      bg: "bg-slate-100" 
    },
  ];

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <motion.div 
      className="w-full h-full flex flex-col p-8 bg-[#f4f6fb] overflow-y-auto text-left font-['Inter',_sans-serif]"
      initial="hidden"
      animate="show"
    >
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
        <div className="text-left">
          <h1 className="text-3xl font-black text-gray-800 tracking-tighter uppercase italic leading-none">
            {perspective === 'students' ? 'Portal Estudiantil' : 'Consola Académica'}
          </h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mt-2">Sincronización Institucional</p>
        </div>

        <div className="flex items-center gap-4 bg-white p-2 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 px-4 border-r border-gray-100">
             <Globe size={14} className="text-gray-400 animate-pulse" />
             <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Enfoque</span>
          </div>
          
          <div className="flex bg-gray-50 p-1 rounded-2xl relative">
            <motion.div 
              layoutId="hologram"
              className={`absolute h-[85%] rounded-xl z-0 ${perspective === 'students' ? 'bg-green-600 w-[110px]' : 'bg-blue-600 w-[110px]'}`}
              animate={{ x: perspective === 'students' ? 0 : 112 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
            <button onClick={() => setPerspective("students")} className={`relative z-10 w-[110px] py-2 text-[9px] font-black uppercase tracking-widest transition-colors duration-300 ${perspective === 'students' ? 'text-white' : 'text-gray-400'}`}>Estudiantes</button>
            <button onClick={() => setPerspective("academic")} className={`relative z-10 w-[110px] py-2 text-[9px] font-black uppercase tracking-widest transition-colors duration-300 ${perspective === 'academic' ? 'text-white' : 'text-gray-400'}`}>Académico</button>
          </div>

          <div className="relative group ml-2 flex items-center gap-2">
            <div className="relative">
              <select 
                value={selectedPeriod}
                onChange={(e) => handlePeriodChange(e.target.value)}
                className="appearance-none bg-white border border-gray-100 hover:border-green-300 focus:border-green-500 py-2.5 pl-4 pr-10 rounded-2xl text-[9px] font-black text-green-700 uppercase tracking-widest outline-none cursor-pointer shadow-sm transition-all"
              >
                {availablePeriods.map((p) => (
                  <option key={p} value={p}>
                    AÑO ESCOLAR {p} {p === currentPeriod ? "(ACTIVO)" : ""}
                  </option>
                ))}
                <option value="TODOS">TODOS LOS PERIODOS</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-green-600">
                <ChevronRight className="rotate-90" size={13} />
              </div>
            </div>
            {selectedPeriod !== currentPeriod && selectedPeriod !== "TODOS" && (
              <button
                onClick={() => handlePeriodChange(currentPeriod)}
                title="Volver al período institucional activo"
                className="hidden lg:flex items-center gap-1 text-[8px] font-black px-2.5 py-2 rounded-xl bg-green-50 text-green-700 hover:bg-green-100 uppercase tracking-wider transition-all border border-green-200"
              >
                <span>Ver Activo ({currentPeriod})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <AnimatePresence mode="wait">
          {statsConfig.map((stat: any, i) => (
            <motion.div 
              key={`${perspective}-${i}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: i * 0.05 }}
              className={`bg-gradient-to-br ${stat.gradient} rounded-[2.5rem] shadow-xl p-8 text-white group relative overflow-hidden`}
            >
              <div className="relative z-10 text-left">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">{stat.title}</p>
                  <h2 className="text-4xl font-black tracking-tighter mb-5 font-mono">{stat.value}</h2>
                  <div className="bg-white/20 w-fit p-3 rounded-2xl backdrop-blur-md shadow-inner">{stat.icon}</div>
              </div>
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-3xl opacity-50" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-14 text-left">
        <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100 flex flex-col">
          <div className="flex justify-between items-center mb-10">
             <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Distribución Histórica</h3>
             <div className="flex gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
                {dynamicPie.map((cat, idx) => (
                  <button key={cat.name} onClick={() => toggleFilter(cat.name)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all ${activeFilters.charts.length === 0 || activeFilters.charts.includes(cat.name) ? 'bg-white shadow-sm text-gray-800' : 'opacity-40 text-gray-400 grayscale'}`}>
                    <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[idx % COLORS.length]}}/>
                    {cat.name} {(activeFilters.charts.length === 0 || activeFilters.charts.includes(cat.name)) ? <Eye size={10}/> : <EyeOff size={10}/>}
                  </button>
                ))}
             </div>
          </div>

          <div className="w-full min-w-0" style={{ minHeight: "300px", height: "300px", width: "100%", position: "relative" }}>
            {isMounted && dynamicChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={300} minWidth={100} minHeight={100} debounce={50}>
                <AreaChart data={dynamicChart}>
                  <defs>
                    {COLORS.map((color, i) => (
                      <linearGradient key={i} id={`colorGrad${i}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={color} stopOpacity={0.3}/><stop offset="95%" stopColor={color} stopOpacity={0}/></linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                  <XAxis dataKey="label" fontSize={10} fontWeight={900} axisLine={false} tickLine={false} stroke="#cbd5e1" />
                  <YAxis fontSize={10} fontWeight={900} axisLine={false} tickLine={false} stroke="#cbd5e1" />
                  <Tooltip contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  {dynamicPie.map((cat, idx) => (activeFilters.charts.length === 0 || activeFilters.charts.includes(cat.name)) && (
                    <Area key={cat.name} stackId="1" type="monotone" dataKey={cat.name} stroke={COLORS[idx % COLORS.length]} fill={`url(#colorGrad${idx})`} strokeWidth={4} animationDuration={1000} />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-[300px] bg-gray-50/50 rounded-2xl animate-pulse" />
            )}
          </div>
        </div>

        <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100">
           <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-10">Proporción Actual</h3>
           <div className="w-full min-w-0" style={{ minHeight: "200px", height: "200px", width: "100%", position: "relative" }}>
             {isMounted && dynamicPie.length > 0 && dynamicPie.some(d => d.value > 0) ? (
               <ResponsiveContainer width="100%" height={200} minWidth={100} minHeight={100} debounce={50}>
                 <PieChart>
                   <Pie data={dynamicPie} innerRadius={65} outerRadius={85} paddingAngle={8} dataKey="value" cornerRadius={12}>
                     {dynamicPie.map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                   </Pie>
                   <Tooltip />
                 </PieChart>
               </ResponsiveContainer>
             ) : (
               <div className="w-full h-[200px] flex flex-col items-center justify-center text-center p-4 bg-gray-50/40 rounded-2xl border border-dashed border-gray-200">
                 <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-300 shadow-sm mb-2">
                   <Users size={18} />
                 </div>
                 <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Sin matrículas en este período</p>
                 <span className="text-[8px] text-gray-400 font-bold mt-0.5">Período {selectedPeriod}</span>
               </div>
             )}
           </div>
           <div className="mt-8 space-y-3 font-black uppercase text-[10px]">
             {dynamicPie.map((d, i) => (
               <div key={i} className="flex justify-between items-center cursor-pointer" onClick={() => toggleFilter(d.name)}>
                 <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full transition-all ${activeFilters.charts.length === 0 || activeFilters.charts.includes(d.name) ? '' : 'grayscale opacity-30'}`} style={{backgroundColor: COLORS[i]}}/>
                    <span className={(activeFilters.charts.length === 0 || activeFilters.charts.includes(d.name)) ? 'text-gray-400 text-left' : 'text-gray-200 line-through'}>{d.name}</span>
                 </div>
                 <span className={(activeFilters.charts.length === 0 || activeFilters.charts.includes(d.name)) ? 'text-gray-800' : 'text-gray-200'}>{d.value}</span>
               </div>
             ))}
           </div>
        </div>
      </div>

      {/* ✅ SECCIÓN DE TARJETAS ANIMADAS (SOLO VISIBLE EN ENFOQUE ACADÉMICO) */}
      <AnimatePresence>
        {perspective === "academic" && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, height: 0 }}
            className="w-full mb-12"
          >
            <div className="flex flex-col md:flex-row justify-between items-end mb-6 px-4 gap-4">
              <div className="text-left">
                <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1">Distribución por Grados</h3>
                <p className="text-xs font-bold text-green-700 italic uppercase">Estado actual de las aulas</p>
              </div>
              
              <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
                {["Todos", "Primaria", "Secundaria"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setActiveFilters((prev: any) => ({...prev, nivelCard: f}))}
                    className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all ${
                      (activeFilters.nivelCard || "Todos") === f ? "bg-green-600 text-white shadow-md" : "text-gray-400 hover:bg-gray-50"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <AnimatePresence mode="popLayout">
                {seccionesCards.length === 0 ? (
                  <div className="col-span-full py-8 text-center bg-white rounded-[2.5rem] border border-dashed border-gray-200 text-gray-400 text-xs font-bold uppercase p-6">
                    No hay aulas o secciones con alumnos matriculados para el período escolar {selectedPeriod}
                  </div>
                ) : (
                  seccionesCards
                    .filter(sec => (activeFilters.nivelCard === "Todos" || !activeFilters.nivelCard) ? true : sec.nivel === activeFilters.nivelCard)
                    .slice(0, expanded ? seccionesCards.length : 4)
                    .map((sec) => (
                      <motion.div 
                        key={`${sec.grado}-${sec.seccion}`} 
                        layout
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        whileHover={{ translateY: -5 }}
                        onClick={() => handleCardClick(sec)} 
                        className="p-6 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm hover:border-green-300 hover:shadow-xl transition-all text-left relative overflow-hidden group cursor-pointer"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${
                            sec.nivel === "Primaria" ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"
                          }`}>
                            {sec.nivel}
                          </span>
                          <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-green-600 group-hover:text-white transition-all">
                            <ArrowUpRight size={14} />
                          </div>
                        </div>
                        
                        <h4 className="text-xl font-black text-gray-800 leading-none mb-3">
                          {sec.grado} <span className="text-green-600 italic">"{sec.seccion}"</span>
                        </h4>
                        
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min((sec.matricula / 35) * 100, 100)}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className={`h-full rounded-full ${sec.matricula > 30 ? "bg-orange-500" : "bg-green-500"}`} 
                              />
                          </div>
                          <span className="text-[10px] font-black text-gray-400 shrink-0">{sec.matricula} Ests.</span>
                        </div>
                        
                        <div className="absolute -right-2 -bottom-2 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity">
                          <TrendingUp size={80} />
                        </div>
                      </motion.div>
                    ))
                )}
              </AnimatePresence>
            </motion.div>

            {seccionesCards.length > 4 && (
              <div className="flex justify-center mt-12">
                <motion.div
                  onClick={() => setExpanded(!expanded)}
                  className="group cursor-pointer flex flex-col items-center"
                >
                  <span className="text-[10px] font-black text-gray-300 group-hover:text-green-600 uppercase tracking-[0.3em] mb-4 transition-colors">
                    {expanded ? "Contraer Mapa" : "Explorar Secciones"}
                  </span>
                  
                  <div className="relative flex items-center justify-center">
                    <motion.div 
                      animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute w-10 h-10 border border-green-200 rounded-full"
                    />
                    <motion.div 
                      animate={{ y: expanded ? 0 : [0, 4, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className={`w-10 h-10 bg-white border border-gray-100 shadow-sm rounded-2xl flex items-center justify-center text-gray-400 group-hover:text-green-600 transition-all ${expanded ? 'rotate-180' : ''}`}
                    >
                      <ChevronRight className="rotate-90" size={18} />
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mt-4">
        {modules.map((mod, i) => (
          <motion.button 
            key={i} 
            variants={itemVariants} 
            whileHover={{ y: -10 }} 
            onClick={() => navigate(mod.route)} 
            className="bg-white p-7 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-green-200 group transition-all text-left relative overflow-hidden"
          >
            <div className={`p-4 rounded-2xl w-fit mb-4 ${mod.bg} ${mod.color} group-hover:bg-green-600 group-hover:text-white transition-all duration-500 shadow-sm`}>
              {mod.icon}
            </div>
            <h4 className="text-[11px] font-black text-gray-800 uppercase tracking-widest leading-none mb-1">
              {mod.title}
            </h4>
            <ArrowUpRight size={14} className="absolute top-6 right-6 text-gray-300 group-hover:text-green-500 transition-colors" />
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

export default DashboardHome;