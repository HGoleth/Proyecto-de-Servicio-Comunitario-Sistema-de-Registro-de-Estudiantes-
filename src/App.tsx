import { lazy, Suspense } from "react";
import "./App.css";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";

// Componentes estáticos base
import Login from "./components/Login";
import Dashboard from "./pages/Dashboard";
import Loader from "./components/Loader";
import UserManualModal from "./components/common/UserManualModal";

// Páginas del Dashboard diferidas (Code Splitting / Lazy Loading)
const DashboardHome = lazy(() => import("./pages/Dashboard/DashboardHome"));
const GestionEstudiantes = lazy(() => import("./pages/Dashboard/GestionEstudiantes"));
const Estudiantes = lazy(() => import("./pages/Dashboard/Estudiantes"));
const StudentRegistrationInitial = lazy(() => import("./pages/Dashboard/StudentRegistrationInitial"));
const StudentRegistrationPrimary = lazy(() => import("./pages/Dashboard/StudentRegistrationPrimary"));
const StudentRegistrationSecondary = lazy(() => import("./pages/Dashboard/StudentRegistrationSecondary"));
const StudentAdministration = lazy(() => import("./pages/Dashboard/StudentAdministration"));
const Reportes = lazy(() => import("./pages/Dashboard/Reportes"));
const ProfileSettings = lazy(() => import("./pages/Dashboard/ProfileSettings"));
const DistribucionAcademica = lazy(() => import("./pages/Dashboard/DistribucionAcademica"));
const GestionRepresentantes = lazy(() => import("./pages/Dashboard/GestionRepresentantes"));
const Notas = lazy(() => import("./pages/Dashboard/Notas"));
const PensumEstudios = lazy(() => import("./pages/Dashboard/PensumEstudios"));
const DocumentTemplatesGenerator = lazy(() => import("./pages/Dashboard/DocumentTemplatesGenerator"));

// Sub-módulos de Archivos
const Archivos = lazy(() => import("./pages/Dashboard/Archivos/Archivos"));
const ConfigSistema = lazy(() => import("./pages/Dashboard/Archivos/ConfigSistema"));
const FormatosValores = lazy(() => import("./pages/Dashboard/Archivos/FormatosValores"));
const ArchivosGenerales = lazy(() => import("./pages/Dashboard/Archivos/ArchivosGenerales"));
const ConfigImpresion = lazy(() => import("./pages/Dashboard/Archivos/ConfigImpresion"));

function App() {
  return (
    <HashRouter>
      <div className="w-full h-screen">
        <Suspense fallback={<Loader />}>
          <Routes>
            {/* ENTRADA DIRECTA AL MENÚ PRINCIPAL */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />

            {/* DASHBOARD (LAYOUT PRINCIPAL) */}
            <Route path="/dashboard" element={<Dashboard />}>
              {/* INICIO */}
              <Route index element={<DashboardHome />} />

              {/* ARCHIVOS Y CONFIGURACIÓN */}
              <Route path="archivos" element={<Archivos />} />
              <Route path="archivos/sistema" element={<ConfigSistema />} />
              <Route path="archivos/formatos" element={<FormatosValores />} />
              <Route path="archivos/generales" element={<ArchivosGenerales />} />
              <Route path="archivos/impresion" element={<ConfigImpresion />} />

              {/* INSCRIPCIÓN POR NIVELES */}
              <Route path="estudiantes" element={<Estudiantes />} />
              <Route path="estudiantes/inicial" element={<StudentRegistrationInitial />} />
              <Route path="estudiantes/primaria" element={<StudentRegistrationPrimary />} />
              <Route path="estudiantes/secundaria" element={<StudentRegistrationSecondary />} />

              {/* ADMINISTRACIÓN DE ESTUDIANTES */}
              <Route path="estudiantes/administracion" element={<StudentAdministration />} />
            
              {/* DISTRIBUCIÓN ACADÉMICA */}
              <Route path="archivos/distribucion" element={<DistribucionAcademica />} />

              {/* REPORTES */}
              <Route path="reportes" element={<Reportes />} />

              {/* CONFIGURACIÓN DE PERFIL */}
              <Route path="configuracion" element={<ProfileSettings />} />

              {/* GESTIÓN DE REPRESENTANTES */}
              <Route path="representantes" element={<GestionRepresentantes />} />

              {/* CONTROL DE NOTAS */}
              <Route path="notas" element={<Notas />} />

              {/* PENSUM Y PLAN CURRICULAR */}
              <Route path="pensum" element={<PensumEstudios />} />

              {/* GENERADOR DE PLANTILLAS Y DOCUMENTOS */}
              <Route path="documentos" element={<DocumentTemplatesGenerator />} />

              {/* GESTIÓN ESTUDIANTES (COMPATIBILIDAD) */}
              <Route path="gestion-estudiantes" element={<GestionEstudiantes />} />
            </Route>

            {/* RUTA POR DEFECTO / REDIRECCIÓN */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
        {/* MANUAL DE USUARIO GLOBAL (ACTIVADO CON F10) */}
        <UserManualModal />
      </div>
    </HashRouter>
  );
}

export default App;
