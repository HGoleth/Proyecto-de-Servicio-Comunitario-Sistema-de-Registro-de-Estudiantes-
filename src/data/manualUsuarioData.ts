export interface ManualWorkflowStep {
  paso: number;
  titulo: string;
  detalle: string;
}

export interface ManualWorkflow {
  id: string;
  nombre: string;
  objetivo: string;
  pasos: ManualWorkflowStep[];
  resultadoEsperado: string;
}

export interface ManualSection {
  id: string;
  categoria: string;
  titulo: string;
  rutaAcceso: string;
  icono: string;
  resumen: string;
  funcionalidades: string[];
  reglasNegocio: string[];
  flujosTrabajo: ManualWorkflow[];
}

export interface ManualShortcut {
  tecla: string;
  accion: string;
  alcance: string;
}

export interface ManualChangelogEntry {
  version: string;
  fecha: string;
  cambios: string[];
}

export const MANUAL_METADATA = {
  titulo: "Manual Oficial de Usuario y Flujos de Trabajo",
  institucion: "U.E. República de Chile — Sistema de Registro de Estudiantes SC",
  versionActual: "v2.5.0",
  ultimaActualizacion: "23 de Noviembre de 2026",
  atajoPrincipal: "F10",
};

export const ATAJOS_TECLADO: ManualShortcut[] = [
  {
    tecla: "F10",
    accion: "Abrir / Cerrar el Manual de Usuario y Flujos de Trabajo",
    alcance: "Global (en cualquier pantalla del sistema)",
  },
  {
    tecla: "F12  ó  Ctrl + Shift + I",
    accion: "Abrir / Cerrar el Modo Desarrollador (DevTools de Chromium/Electron)",
    alcance: "Global (en toda la aplicación)",
  },
  {
    tecla: "Esc",
    accion: "Cerrar el Manual de Usuario o ventanas modales emergentes activas",
    alcance: "Modales y vistas previas",
  },
];

export const HISTORIAL_ACTUALIZACIONES_MANUAL: ManualChangelogEntry[] = [
  {
    version: "v2.5.0",
    fecha: "23/11/2026",
    cambios: [
      "Incorporación del Manual de Usuario interactivo global activado mediante la tecla F10.",
      "Habilitación de la tecla F12 (y Ctrl+Shift+I) para abrir/cerrar el Modo Desarrollador (DevTools).",
      "Condición automática de promoción ('Pasó de Año / Pasó de Grado') o 'Repitiente' en Control de Notas y Boletines una vez cargadas todas las calificaciones de los 3 lapsos.",
      "Sincronización automática del estado de repitencia en el expediente del estudiante desde el Control de Notas.",
      "Opción '+ Agregar Documento' en Inscripción y Edición de Estudiantes solicitando únicamente el título del documento y archivando físicamente el archivo subido.",
      "Inclusión completa de Educación Inicial (Maternal, 1er Grupo, 2do Grupo y 3er Grupo) en Control de Notas, Reportes Académicos, Formatos Oficiales y Estadísticas.",
      "Modal de confirmación '¿Está seguro de que desea avanzar?' en el formulario de inscripción cuando faltan campos sugeridos, permitiendo avanzar bajo confirmación.",
      "Corrección de hitbox en botones flotantes de cierre/impresión y resaltado único en la barra lateral de navegación.",
    ],
  },
];

export const SECCIONES_MANUAL: ManualSection[] = [
  {
    id: "acceso-navegacion",
    categoria: "1. Acceso y Entorno General",
    titulo: "Inicio de Sesión, Barra Superior y Navegación Lateral",
    rutaAcceso: "Pantalla de Login (/login) y Barra Lateral (/dashboard)",
    icono: "LayoutDashboard",
    resumen:
      "Controla la autenticación de usuarios autorizados, los controles de ventana nativa sin bordes (minimizar, maximizar, cerrar), los atajos globales (F10 y F12) y la navegación entre todos los módulos académicos y administrativos.",
    funcionalidades: [
      "Inicio de sesión con validación de credenciales contra base de datos Local JSON o MySQL (XAMPP).",
      "Recuperación y actualización de credenciales desde el módulo de Configuración de Perfil.",
      "Barra lateral izquierda con resaltado inteligente de ruta activa (nunca marca dos secciones al mismo tiempo).",
      "Barra superior limpia con botón de acceso rápido al Manual de Usuario (F10) y controles de ventana nativa (Minimizar, Maximizar/Restaurar, Cerrar).",
      "Soporte global de teclas rápidas: F10 para este Manual de Usuario y F12 para el Modo Desarrollador (DevTools).",
    ],
    reglasNegocio: [
      "Los botones interactivos y flotantes cuentan con protección '-webkit-app-region: no-drag' para garantizar una hitbox 100% clicable sin interferir con el arrastre de la ventana.",
    ],
    flujosTrabajo: [
      {
        id: "wf-login",
        nombre: "Flujo 1.1: Autenticación e Ingreso al Sistema",
        objetivo: "Iniciar sesión de manera segura en la plataforma institucional.",
        pasos: [
          {
            paso: 1,
            titulo: "Ingresar credenciales",
            detalle: "En la pantalla de acceso, introduzca su correo o usuario institucional y su contraseña.",
          },
          {
            paso: 2,
            titulo: "Validar acceso",
            detalle: "Presione 'Iniciar Sesión'. El sistema verificará las credenciales en el motor de base de datos activo.",
          },
          {
            paso: 3,
            titulo: "Acceder al Panel Principal",
            detalle: "Una vez autenticado, será redirigido automáticamente al Dashboard principal con las métricas actualizadas.",
          },
        ],
        resultadoEsperado: "Sesión activa y acceso habilitado a todos los módulos de la barra lateral.",
      },
      {
        id: "wf-atajos",
        nombre: "Flujo 1.2: Uso de Atajos Globales (F10 y F12)",
        objetivo: "Consultar documentación en vivo o inspeccionar el entorno técnico.",
        pasos: [
          {
            paso: 1,
            titulo: "Abrir Manual de Usuario (F10)",
            detalle: "Presione la tecla F10 en cualquier pantalla para desplegar u ocultar este manual interactivo.",
          },
          {
            paso: 2,
            titulo: "Abrir Modo Desarrollador (F12)",
            detalle: "Presione la tecla F12 (o Ctrl + Shift + I) para abrir o cerrar la consola DevTools de Electron.",
          },
        ],
        resultadoEsperado: "Apertura instantánea de la herramienta solicitada sin perder el progreso en la pantalla actual.",
      },
    ],
  },
  {
    id: "dashboard-home",
    categoria: "2. Resumen Institucional",
    titulo: "Panel Principal (Dashboard Home)",
    rutaAcceso: "Menú Lateral → Inicio (/dashboard)",
    icono: "Home",
    resumen:
      "Muestra en tiempo real las métricas generales de la institución: matrícula total activa, distribución por niveles educativos (Educación Inicial / Maternal, Primaria y Media General), secciones habilitadas y accesos directos.",
    funcionalidades: [
      "Tarjetas de indicadores clave (KPIs): Total de Estudiantes Inscritos, Representantes Registrados, Asignaturas del Pénsum y Período Escolar Activo.",
      "Gráficos de distribución de matrícula por Nivel Educativo (incluyendo Maternal y Grupos de Inicial, 1er a 6to Grado de Primaria, y 1er a 5to Año de Media General).",
      "Accesos rápidos a Inscripción de Estudiantes, Control de Notas, Boletines y Respaldo del Sistema.",
    ],
    reglasNegocio: [
      "Las estadísticas contabilizan dinámicamente a todos los alumnos activos de Educación Inicial (Maternal, 1er, 2do y 3er Grupo), Primaria y Secundaria.",
    ],
    flujosTrabajo: [
      {
        id: "wf-dashboard-consulta",
        nombre: "Flujo 2.1: Monitoreo de Matrícula y Navegación Rápida",
        objetivo: "Verificar el estado general del plantel al iniciar la jornada.",
        pasos: [
          {
            paso: 1,
            titulo: "Revisar indicadores superiores",
            detalle: "Observe las tarjetas superiores para confirmar el total de alumnos, representantes y período escolar vigente.",
          },
          {
            paso: 2,
            titulo: "Inspeccionar gráficas por nivel",
            detalle: "Verifique la proporción de alumnos en Inicial (Maternal a 3er Grupo), Primaria y Media General.",
          },
          {
            paso: 3,
            titulo: "Usar accesos rápidos",
            detalle: "Haga clic en cualquiera de los botones de acción rápida para saltar directamente al módulo deseado.",
          },
        ],
        resultadoEsperado: "Visualización clara del estado del plantel y acceso inmediato a las tareas frecuentes.",
      },
    ],
  },
  {
    id: "inscripcion-estudiantes",
    categoria: "3. Admisión y Matrícula",
    titulo: "Inscripción de Estudiantes (Inicial, Primaria y Media General)",
    rutaAcceso: "Menú Lateral → Inscripción (/dashboard/estudiantes)",
    icono: "UserPlus",
    resumen:
      "Sistema guiado en 4 pasos para inscribir alumnos en Educación Inicial (Maternal, 1er, 2do y 3er Grupo), Educación Primaria (1er a 6to Grado) o Educación Media General (1er a 5to Año), con archivo físico de expediente digital y documentos personalizados.",
    funcionalidades: [
      "Selector de nivel educativo con formularios adaptados para Educación Inicial, Primaria y Media General.",
      "Paso 1 (Datos del Estudiante): Cálculo automático de edad al ingresar fecha de nacimiento y generación automática de Cédula Escolar / ID institucional para menores sin cédula.",
      "Paso 2 (Información del Representante): Búsqueda y autocompletado automático si el representante ya tiene otro hijo inscrito en el plantel, más carga de foto del representante.",
      "Paso 3 (Información Médica): Registro de tipo de sangre, talla, peso, alergias, condiciones médicas y contacto de emergencia.",
      "Paso 4 (Información Académica y Expediente Digital): Asignación de Grado/Grupo, Sección ('A' o 'B'), año escolar, condición de repitencia, carga de los 5 recaudos base y botón '+ Agregar Documento' para anexar documentos adicionales con sólo escribir su título.",
      "Avance flexible con confirmación: Si falta algún campo al pulsar 'Siguiente', el sistema muestra una ventana de confirmación ('¿Está seguro de que desea avanzar?') permitiendo continuar si el usuario lo confirma.",
    ],
    reglasNegocio: [
      "Todos los documentos subidos (tanto los 5 recaudos obligatorios como los documentos personalizados añadidos con '+ Agregar Documento') se archivan físicamente en la carpeta segura del sistema bajo el protocolo 'media://local/' y quedan vinculados al expediente del alumno.",
      "La validación no bloquea forzosamente el avance: advierte qué campos están pendientes y permite avanzar tras confirmar.",
    ],
    flujosTrabajo: [
      {
        id: "wf-inscripcion-completa",
        nombre: "Flujo 3.1: Inscribir un Nuevo Estudiante Paso a Paso",
        objetivo: "Registrar a un alumno nuevo en cualquier nivel (Maternal/Inicial, Primaria o Secundaria).",
        pasos: [
          {
            paso: 1,
            titulo: "Seleccionar Nivel Educativo",
            detalle: "En 'Inscripción', elija entre Educación Inicial (Maternal a 3er Grupo), Educación Primaria (1er a 6to Grado) o Media General (1er a 5to Año).",
          },
          {
            paso: 2,
            titulo: "Completar Paso 1: Datos del Estudiante",
            detalle: "Ingrese nombres, apellidos, fecha de nacimiento (la edad se calcula sola), lugar de nacimiento, género, dirección y foto opcional. Si tiene menos de 9 años o no posee C.I., el sistema asignará el ID Escolar automático.",
          },
          {
            paso: 3,
            titulo: "Avanzar con o sin confirmación",
            detalle: "Presione 'Siguiente Paso'. Si dejó algún campo vacío a propósito, aparecerá el diálogo '¿Está seguro de que desea avanzar?'; pulse 'Sí, avanzar' para continuar.",
          },
          {
            paso: 4,
            titulo: "Completar Paso 2: Información del Representante",
            detalle: "Ingrese la Cédula del Representante (si ya existe en la base de datos, sus datos se autocompletarán), nombres, apellidos, parentesco, teléfonos, correo, dirección laboral y foto.",
          },
          {
            paso: 5,
            titulo: "Completar Paso 3: Información Médica",
            detalle: "Indique si posee alguna condición especial, tipo de sangre, peso, talla, alergias o medicación.",
          },
          {
            paso: 6,
            titulo: "Completar Paso 4: Datos Académicos y Expediente Digital",
            detalle: "Seleccione el Grado/Grupo, la Sección ('A' o 'B'), plantel de procedencia y suba los recaudos digitales (Partida de Nacimiento, Certificado Médico, Carnet de Vacunación, Cédula del Representante, Constancia de Domicilio).",
          },
          {
            paso: 7,
            titulo: "Finalizar Inscripción",
            detalle: "Presione 'Completar Inscripción'. El alumno quedará registrado en la base de datos y disponible inmediatamente en su sección, control de notas y boletines.",
          },
        ],
        resultadoEsperado: "Estudiante inscrito con su expediente digital archivado y asignado a su grado y sección.",
      },
      {
        id: "wf-agregar-doc-personalizado",
        nombre: "Flujo 3.2: Agregar un Documento Personalizado al Expediente",
        objetivo: "Subir y archivar un documento adicional definiendo únicamente su título.",
        pasos: [
          {
            paso: 1,
            titulo: "Ubicar sección Expediente Digital",
            detalle: "En el Paso 4 de la inscripción (o en la pestaña 'Académico y Docs' al editar un estudiante), ubique el encabezado 'EXPEDIENTE DIGITAL OBLIGATORIO'.",
          },
          {
            paso: 2,
            titulo: "Pulsar '+ Agregar Documento'",
            detalle: "Haga clic en el botón '+ Agregar Documento' situado en la esquina superior derecha de la sección.",
          },
          {
            paso: 3,
            titulo: "Escribir el Título del Documento",
            detalle: "Escriba únicamente el título del documento (por ejemplo: 'Boleta de Retiro', 'Informe Psicopedagógico', 'Autorización Cultural') y pulse 'Crear' (o Enter).",
          },
          {
            paso: 4,
            titulo: "Subir el archivo físico",
            detalle: "En la nueva tarjeta creada con ese título, presione el botón 'SUBIR' y seleccione el archivo PDF o imagen desde su computador. El archivo quedará archivado exactamente igual que los documentos principales.",
          },
        ],
        resultadoEsperado: "Documento personalizado archivado físicamente en disco y visible en la ficha del estudiante.",
      },
    ],
  },
  {
    id: "directorio-estudiantes",
    categoria: "4. Gestión Estudiantil",
    titulo: "Administración y Directorio de Estudiantes",
    rutaAcceso: "Menú Lateral → Gestión de Estudiantes (/dashboard/estudiantes/administracion)",
    icono: "Users",
    resumen:
      "Permite consultar, filtrar, paginar, visualizar expedientes completos, descargar documentos archivados, editar datos o eliminar registros de los estudiantes de todos los niveles.",
    funcionalidades: [
      "Buscador instantáneo por Nombres, Apellidos o Cédula / Código Escolar.",
      "Filtros combinables por Nivel Educativo (Todos, Inicial, Primaria, Secundaria), Grado/Año (incluyendo Maternal y 1er a 3er Grupo) y Sección ('A' o 'B').",
      "Paginación optimizada en cliente para navegar fluidamente entre cientos de registros sin retrasos.",
      "Modal 'Ver Expediente' (icono de ojo): Muestra ficha integral del alumno, datos del representante, ficha médica, estado académico y visor de todos los documentos archivados (obligatorios y adicionales).",
      "Modal 'Editar Estudiante' (icono de lápiz): Permite actualizar cualquier dato en 4 pestañas y añadir nuevos documentos con '+ Agregar Documento'.",
      "Eliminación segura de estudiante con diálogo de confirmación.",
    ],
    reglasNegocio: [
      "Al actualizar la condición académica o las notas del estudiante desde Control de Notas, su estado de repitencia ('Sí' / 'No') y observaciones se reflejan automáticamente en esta ficha.",
    ],
    flujosTrabajo: [
      {
        id: "wf-buscar-ver-estudiante",
        nombre: "Flujo 4.1: Consultar Expediente y Documentos Archivados de un Alumno",
        objetivo: "Revisar la ficha completa y abrir los documentos digitales de un estudiante.",
        pasos: [
          {
            paso: 1,
            titulo: "Filtrar o buscar al estudiante",
            detalle: "Escriba el nombre o cédula en el buscador superior, o filtre por Nivel, Grado (ej. Maternal, 1er Grado, 3er Año) y Sección.",
          },
          {
            paso: 2,
            titulo: "Abrir vista de expediente",
            detalle: "En la fila del estudiante, haga clic en el botón azul 'Ver' (icono de ojo).",
          },
          {
            paso: 3,
            titulo: "Inspeccionar datos y documentos",
            detalle: "Revise la información personal, médica, representante y haga clic en 'Ver Archivo' sobre cualquier documento obligatorio o documento adicional para visualizarlo.",
          },
        ],
        resultadoEsperado: "Visualización completa de la ficha estudiantil y apertura de sus archivos digitales.",
      },
      {
        id: "wf-editar-estudiante",
        nombre: "Flujo 4.2: Editar Datos o Anexar Nuevos Documentos a un Alumno Inscrito",
        objetivo: "Modificar información o subir documentos pendientes a un alumno existente.",
        pasos: [
          {
            paso: 1,
            titulo: "Abrir ventana de edición",
            detalle: "En la tabla de Gestión de Estudiantes, pulse el botón 'Editar' (icono de lápiz) del alumno correspondiente.",
          },
          {
            paso: 2,
            titulo: "Navegar por las 4 pestañas",
            detalle: "Seleccione entre '1. Estudiante', '2. Representante', '3. Ficha Médica' o '4. Académico y Docs'.",
          },
          {
            paso: 3,
            titulo: "Subir o agregar documentos",
            detalle: "En la pestaña '4. Académico y Docs', puede subir recaudos pendientes o pulsar '+ Agregar Documento', ingresar el título y adjuntar el archivo.",
          },
          {
            paso: 4,
            titulo: "Guardar Cambios",
            detalle: "Presione 'Guardar Cambios' en la esquina inferior derecha para persistir la actualización en la base de datos.",
          },
        ],
        resultadoEsperado: "Expediente del estudiante actualizado inmediatamente en todo el sistema.",
      },
    ],
  },
  {
    id: "gestion-representantes",
    categoria: "5. Comunidad Educativa",
    titulo: "Directorio y Gestión de Representantes",
    rutaAcceso: "Menú Lateral → Representantes (/dashboard/representantes)",
    icono: "UserCheck",
    resumen:
      "Centraliza la información de los padres, madres o representantes legales, mostrando cuántos y cuáles estudiantes están bajo su representación y permitiendo actualizar sus datos de contacto.",
    funcionalidades: [
      "Agrupación automática por número de Cédula de Identidad del representante (un representante puede tener 1 o varios alumnos asociados).",
      "Buscador en tiempo real por nombre, apellido, cédula, teléfono o correo electrónico.",
      "Visualización detallada de los estudiantes representados (con su respectivo nivel, grado y sección).",
      "Edición sincronizada: Al actualizar el teléfono, dirección o correo de un representante, se actualiza en todos sus representados.",
    ],
    reglasNegocio: [
      "La cédula del representante actúa como identificador único para evitar duplicados cuando una familia inscribe a varios hermanos.",
    ],
    flujosTrabajo: [
      {
        id: "wf-representantes-consulta",
        nombre: "Flujo 5.1: Consultar y Actualizar Datos de un Representante",
        objetivo: "Localizar al representante de uno o más alumnos y actualizar su contacto.",
        pasos: [
          {
            paso: 1,
            titulo: "Buscar representante",
            detalle: "Ingrese la cédula o apellido del representante en la barra de búsqueda superior.",
          },
          {
            paso: 2,
            titulo: "Ver alumnos asociados",
            detalle: "Seleccione la tarjeta o fila del representante para ver la lista de todos los estudiantes que representa en el plantel.",
          },
          {
            paso: 3,
            titulo: "Editar datos de contacto",
            detalle: "Pulse 'Editar', modifique el teléfono, correo o dirección de habitación/trabajo y guarde los cambios.",
          },
        ],
        resultadoEsperado: "Datos del representante actualizados y sincronizados en las fichas de todos sus representados.",
      },
    ],
  },
  {
    id: "pensum-estudios",
    categoria: "6. Planificación Curricular",
    titulo: "Pénsum de Estudios y Asignaturas (Código PK)",
    rutaAcceso: "Menú Lateral → Pénsum de Estudios (/dashboard/pensum)",
    icono: "BookOpen",
    resumen:
      "Administra el plan curricular oficial de la institución para Educación Inicial (Maternal, 1er–3er Grupo), Educación Primaria (1er–6to Grado) y Media General (1er–5to Año). Cada asignatura se identifica de forma única por su Código de Materia (Primary Key).",
    funcionalidades: [
      "Filtro curricular por Nivel Educativo (Educación Inicial, Primaria, Media General) y por Grado / Grupo / Año.",
      "Código de Materia como Primary Key (PK) único e irrepetible (ej. 'INI-MAT-01', 'PRI-1G-LEN', 'CAS-1ERO').",
      "Creación, edición y eliminación de asignaturas indicando Código (PK), Nombre de la Asignatura, Área de Formación, Horas Semanales y Nivel/Grado.",
      "Clonación de pénsum entre períodos escolares y restauración del pénsum oficial por defecto del MPPE.",
    ],
    reglasNegocio: [
      "El sistema no posee módulo de profesores; cada materia se gestiona exclusivamente a través de su Código único (PK), su área de formación y el grado/año al que pertenece.",
    ],
    flujosTrabajo: [
      {
        id: "wf-crear-materia",
        nombre: "Flujo 6.1: Registrar o Editar una Asignatura en el Pénsum",
        objetivo: "Añadir una nueva materia con su Código PK único a un grado o año.",
        pasos: [
          {
            paso: 1,
            titulo: "Seleccionar Nivel y Grado/Año",
            detalle: "En 'Pénsum de Estudios', elija el nivel (Inicial, Primaria o Media General) y el grado o grupo correspondiente.",
          },
          {
            paso: 2,
            titulo: "Pulsar 'Nueva Asignatura'",
            detalle: "Haga clic en el botón para agregar materia.",
          },
          {
            paso: 3,
            titulo: "Definir Código PK y Datos Curriculares",
            detalle: "Ingrese el Código único (PK) de la materia, el nombre oficial, el área de formación y la carga horaria semanal.",
          },
          {
            paso: 4,
            titulo: "Guardar Asignatura",
            detalle: "Confirme el guardado. La materia aparecerá automáticamente en Distribución Académica, Control de Notas y Boletines de ese grado.",
          },
        ],
        resultadoEsperado: "Asignatura incorporada al plan de estudios con su Código PK único.",
      },
    ],
  },
  {
    id: "distribucion-academica",
    categoria: "7. Organización Escolar",
    titulo: "Distribución Académica por Grados y Secciones",
    rutaAcceso: "Menú Lateral → Distribución Académica (/dashboard/archivos/distribucion)",
    icono: "Layers",
    resumen:
      "Permite visualizar todas las secciones ('A' y 'B') desde Maternal hasta 5to Año, consultando en una sola ventana las asignaturas que cursa el grupo y la nómina completa de alumnos inscritos en esa sección.",
    funcionalidades: [
      "Tarjetas organizadas por nivel y grado (Maternal, 1er a 3er Grupo, 1er a 6to Grado, 1er a 5to Año) con conteo de matrícula por sección.",
      "Modal de detalle de sección ('Plan de Estudios y Matrícula del Grupo'): Muestra en la columna izquierda las asignaturas del grado con su Código PK y horas semanales, y en la columna derecha la nómina de estudiantes inscritos.",
      "Interfaz limpia con botón único 'Cerrar Vista' en la parte inferior del modal.",
    ],
    reglasNegocio: [
      "Se eliminó el botón 'X' redundante de la esquina superior del modal de sección para evitar duplicidad visual, manteniendo el botón dedicado 'Cerrar Vista'.",
    ],
    flujosTrabajo: [
      {
        id: "wf-ver-seccion",
        nombre: "Flujo 7.1: Inspeccionar Plan de Estudios y Nómina de una Sección",
        objetivo: "Verificar qué materias y qué alumnos pertenecen a un grado y sección específicos.",
        pasos: [
          {
            paso: 1,
            titulo: "Filtrar por Nivel Educativo",
            detalle: "Seleccione Educación Inicial, Primaria o Media General en las pestañas superiores.",
          },
          {
            paso: 2,
            titulo: "Seleccionar la tarjeta de la Sección",
            detalle: "Haga clic sobre la tarjeta del grado y sección deseada (ej. 'Maternal - Sección A' o '1ero - Sección A').",
          },
          {
            paso: 3,
            titulo: "Revisar Materias y Matrícula",
            detalle: "Consulte las asignaturas asignadas al grado y los alumnos inscritos. Al finalizar, pulse el botón 'Cerrar Vista'.",
          },
        ],
        resultadoEsperado: "Consulta rápida de la carga académica y matrícula de la sección seleccionada.",
      },
    ],
  },
  {
    id: "control-notas",
    categoria: "8. Evaluación y Calificaciones",
    titulo: "Control de Notas y Condición de Promoción / Repitencia",
    rutaAcceso: "Menú Lateral → Control de Notas (/dashboard/notas)",
    icono: "ClipboardCheck",
    resumen:
      "Libro electrónico de calificaciones para Educación Inicial (Maternal a 3er Grupo), Primaria (1er a 6to Grado) y Media General (1er a 5to Año). Calcula definitivas por lapso y anuales, y evalúa automáticamente si el estudiante 'Pasó de Año / Grado' o quedó 'Repitiente' al completarse todas sus notas de los 3 lapsos.",
    funcionalidades: [
      "Selectores jerárquicos de Nivel Educativo (Educación Inicial, Primaria, Media General), Grado/Grupo/Año, Sección ('A' o 'B'), Asignatura (con su Código PK) y Momento Pedagógico (1er, 2do y 3er Lapso).",
      "Modalidad Cualitativa (Literales A, B, C, D, E) automática para Educación Inicial y Primaria.",
      "Modalidad Cuantitativa (Escala numérica de 0 a 20 puntos) automática para Educación Media General / Secundaria.",
      "Configuración dinámica de Evaluaciones por cada Lapso (agregar evaluación, editar título y ponderación, o eliminar evaluación).",
      "Evaluación Automática de Condición Final ('Pasó de Año / Grado' vs 'Repitiente'): Verifica si el estudiante ya tiene cargadas TODAS las evaluaciones de los 3 lapsos (1er, 2do y 3er Lapso).",
      "Columna 'Condición Final / Estado Anual' en la tabla con insignia verde ('Pasó de Año' o 'Pasó de Grado'), roja ('Repitiente') o ámbar ('Faltan Notas').",
      "Tarjeta superior 'Condición de la Sección' que contabiliza en vivo cuántos alumnos Pasaron, cuántos están Repitientes y a cuántos les Faltan Notas.",
      "Botón 'Sincronizar Registro Académico': Guarda las calificaciones del libro de notas y actualiza automáticamente la ficha del estudiante en la base de datos (marcando 'repeatsYear: No' si aprobó o 'repeatsYear: Sí' si quedó repitiente).",
      "Botón 'Ver Planilla Oficial': Abre el acta oficial imprimible con la columna CONDICIÓN incluida y botones flotantes de Imprimir y Cerrar.",
    ],
    reglasNegocio: [
      "Condición de Notas Completas: Un estudiante sólo recibe la condición de promovido o repitiente cuando TODAS las evaluaciones de los Lapsos 1, 2 y 3 tienen nota registrada. Si falta al menos una nota en cualquier lapso, su estado es 'Faltan Notas' (EN_CURSO).",
      "Criterio de Aprobación en Inicial y Primaria (Escala A–E): Literal definitivo anual 'A', 'B' o 'C' → 'Pasó de Grado' (PROMOVIDO). Literal definitivo anual 'D' o 'E' → 'Repitiente' (REPITIENTE).",
      "Criterio de Aprobación en Media General / Secundaria (Escala 0–20): Promedio definitivo anual >= 10.0 puntos → 'Pasó de Año' (PROMOVIDO). Promedio definitivo anual < 10.0 puntos → 'Repitiente' (REPITIENTE).",
    ],
    flujosTrabajo: [
      {
        id: "wf-cargar-notas-lapsos",
        nombre: "Flujo 8.1: Cargar Calificaciones de los 3 Lapsos y Determinar si Pasó de Año o Repite",
        objetivo: "Registrar las notas de un grupo en los 3 lapsos y obtener la condición automática de promoción o repitencia.",
        pasos: [
          {
            paso: 1,
            titulo: "Seleccionar Nivel, Grado, Sección y Materia",
            detalle: "En 'Control de Notas', elija el Nivel (Inicial, Primaria o Secundaria), el Grado (desde Maternal hasta 5to Año), la Sección ('A' o 'B') y la Asignatura.",
          },
          {
            paso: 2,
            titulo: "Cargar notas del 1er, 2do y 3er Lapso",
            detalle: "Seleccione '1er Lapso' e ingrese las calificaciones (A-E en Inicial/Primaria o 0-20 en Secundaria) en cada evaluación. Repita el proceso cambiando el selector a '2do Lapso' y luego a '3er Lapso'.",
          },
          {
            paso: 3,
            titulo: "Verificar columna 'Condición Final / Estado Anual'",
            detalle: "Al completarse la última nota del 3er Lapso de un estudiante, la columna derecha cambiará automáticamente de 'Faltan Notas' a 'Pasó de Año / Pasó de Grado' (verde) o 'Repitiente' (rojo) según su promedio definitivo.",
          },
          {
            paso: 4,
            titulo: "Sincronizar Registro Académico",
            detalle: "Haga clic en el botón 'Sincronizar Registro Académico'. El sistema guardará la planilla en la base de datos y actualizará automáticamente el expediente de cada estudiante con su condición final (Promovido o Repitiente).",
          },
        ],
        resultadoEsperado: "Calificaciones guardadas en los 3 lapsos y condición de promoción/repitencia actualizada en el expediente del alumno.",
      },
      {
        id: "wf-imprimir-planilla-notas",
        nombre: "Flujo 8.2: Generar e Imprimir la Planilla Oficial de Control de Notas",
        objetivo: "Obtener el acta impresa de calificaciones de la sección con su columna de Condición Final.",
        pasos: [
          {
            paso: 1,
            titulo: "Abrir Vista Previa de Planilla",
            detalle: "Con la sección y materia seleccionadas en Control de Notas, pulse el botón 'Ver Planilla Oficial'.",
          },
          {
            paso: 2,
            titulo: "Revisar el Acta Oficial",
            detalle: "Verifique en la hoja tamaño carta el membrete institucional, el Código (PK) de la materia, las evaluaciones, la nota definitiva de lapso y ciclo, y la columna 'CONDICIÓN' (Pasó de Año/Grado, Repitiente o Faltan Notas).",
          },
          {
            paso: 3,
            titulo: "Imprimir o Cerrar",
            detalle: "Utilice el botón circular azul flotante (esquina superior derecha) para imprimir la planilla, o el botón circular rojo 'X' para cerrar la vista previa.",
          },
        ],
        resultadoEsperado: "Planilla oficial impresa o exportada en formato institucional.",
      },
    ],
  },
  {
    id: "reportes-boletines",
    categoria: "9. Documentación Académica",
    titulo: "Reportes Académicos y Boletines de Calificaciones",
    rutaAcceso: "Menú Lateral → Reportes Académicos (/dashboard/reportes)",
    icono: "FileSpreadsheet",
    resumen:
      "Genera el Boletín Oficial de Calificaciones individual para cada estudiante de Educación Inicial (incluyendo Maternal y Grupos 1 al 3), Primaria y Media General, integrando todas las asignaturas del grado, notas de los 3 lapsos, promedio anual y Condición Final.",
    funcionalidades: [
      "Filtros por Nivel Educativo (Inicial, Primaria, Secundaria), Grado/Grupo/Año y Sección ('A' o 'B').",
      "Lista lateral de estudiantes de la sección con selección instantánea.",
      "Boletín Oficial formato Carta con membrete configurable, Código (PK) de cada asignatura, calificaciones de Lapso 1, Lapso 2, Lapso 3 y Definitiva.",
      "Recuadro 'Resumen Académico' con Modalidad (Cualitativa o Cuantitativa), Promedio Anual y 'Condición Final' ('PASÓ DE AÑO / GRADO (PROMOVIDO)', 'REPITIENTE' o 'En Curso (Faltan Notas)').",
      "Impresión directa del boletín en formato oficial.",
    ],
    reglasNegocio: [
      "El boletín consolida automáticamente las notas registradas en todas las asignaturas del grado/año del alumno y determina su condición anual con las mismas reglas oficiales del Control de Notas.",
    ],
    flujosTrabajo: [
      {
        id: "wf-emitir-boletin",
        nombre: "Flujo 9.1: Generar e Imprimir el Boletín Oficial de un Estudiante",
        objetivo: "Emitir el boletín anual de calificaciones con condición de promoción o repitencia.",
        pasos: [
          {
            paso: 1,
            titulo: "Seleccionar Nivel, Grado y Sección",
            detalle: "En 'Reportes Académicos', elija el Nivel (Inicial, Primaria o Secundaria), el Grado (ej. Maternal, 1er Grado, 5to Año) y la Sección.",
          },
          {
            paso: 2,
            titulo: "Seleccionar al Estudiante",
            detalle: "Haga clic sobre el nombre del alumno en el listado izquierdo para cargar su boletín consolidado.",
          },
          {
            paso: 3,
            titulo: "Verificar Calificaciones y Condición Final",
            detalle: "Revise la tabla de asignaturas (Lap 1, Lap 2, Lap 3, Definitiva) y confirme en el recuadro 'Resumen Académico' el Promedio Anual y la 'Condición Final' (Promovido, Repitiente o En Curso).",
          },
          {
            paso: 4,
            titulo: "Imprimir Boletín",
            detalle: "Presione el botón 'Imprimir Boletín Oficial' para enviar el documento a la impresora o guardarlo como PDF.",
          },
        ],
        resultadoEsperado: "Boletín oficial impreso con sello, firmas, notas de los 3 lapsos y condición anual.",
      },
    ],
  },
  {
    id: "formatos-constancias",
    categoria: "10. Constancias y Plantillas",
    titulo: "Formatos Oficiales y Generador de Constancias",
    rutaAcceso: "Menú Lateral → Archivos → Formatos Oficiales (/dashboard/archivos/formatos)",
    icono: "FileText",
    resumen:
      "Emite documentos oficiales listos para firma y sello (Constancia de Inscripción, Constancia de Estudios, Constancia de Buena Conducta y Boletín Informativo) para cualquier estudiante inscrito desde Maternal hasta 5to Año.",
    funcionalidades: [
      "Selector de tipo de documento oficial: Constancia de Inscripción, Constancia de Estudios, Constancia de Buena Conducta y Boletín Informativo.",
      "Filtros por Nivel (Inicial, Primaria, Secundaria), Grado/Grupo y Sección para localizar rápidamente al alumno.",
      "Autocompletado automático de los datos oficiales del estudiante, su representante, cédula/código escolar, grado, sección y período escolar.",
      "Vista previa en hoja tamaño carta con botones flotantes de Imprimir y Cerrar.",
    ],
    reglasNegocio: [
      "Incluye soporte completo para los alumnos de Educación Inicial (Maternal, 1er, 2do y 3er Grupo) además de Primaria y Secundaria.",
    ],
    flujosTrabajo: [
      {
        id: "wf-generar-constancia",
        nombre: "Flujo 10.1: Emitir e Imprimir una Constancia Oficial",
        objetivo: "Generar una constancia institucional personalizada para un alumno.",
        pasos: [
          {
            paso: 1,
            titulo: "Elegir el Tipo de Constancia",
            detalle: "En 'Formatos Oficiales', seleccione el documento requerido (Inscripción, Estudios, Buena Conducta, etc.).",
          },
          {
            paso: 2,
            titulo: "Buscar y Seleccionar al Estudiante",
            detalle: "Filtre por nivel/grado o busque por nombre/cédula y haga clic sobre el estudiante.",
          },
          {
            paso: 3,
            titulo: "Previsualizar e Imprimir",
            detalle: "Verifique el documento generado en pantalla y presione el botón azul de impresión en la esquina superior derecha.",
          },
        ],
        resultadoEsperado: "Constancia oficial redactada e impresa con membrete y datos exactos del estudiante.",
      },
    ],
  },
  {
    id: "archivos-configuracion-bd",
    categoria: "11. Administración del Sistema y Respaldos",
    titulo: "Archivos Generales, Configuración de Impresión, Base de Datos y Respaldos (.JSON)",
    rutaAcceso: "Menú Lateral → Archivos y Configuración (/dashboard/archivos y /dashboard/configuracion)",
    icono: "Settings",
    resumen:
      "Gestiona el repositorio de documentos institucionales, el membrete oficial de impresión, el motor de base de datos híbrido (Local JSON o MySQL en XAMPP), las copias de seguridad (.json) y el perfil del usuario administrador.",
    funcionalidades: [
      "Archivos Generales (/dashboard/archivos/generales): Subida, categorización, visualización y descarga de documentos normativos e institucionales del plantel.",
      "Configuración de Impresión (/dashboard/archivos/impresion): Personalización de las líneas del membrete oficial (Ministerio, Nombre del Plantel, Código DEA, Ubicación y Director/a).",
      "Configuración del Sistema (/dashboard/archivos/sistema): Selección del Período Escolar Activo (ej. 2025-2026), alternancia en caliente entre Base de Datos Local (JSON) y MySQL (XAMPP), creación de Respaldo Completo (.json) y Restauración de Respaldo (.json).",
      "Configuración de Perfil (/dashboard/configuracion): Actualización de nombre de usuario, correo institucional y contraseña de acceso.",
    ],
    reglasNegocio: [
      "El archivo de respaldo (.json) incluye la totalidad de los estudiantes (150+ registros en los 15 grados/años), representantes, pénsum de materias con Código PK, libros de notas de todos los niveles (incluyendo Maternal e Inicial), plantillas y configuración institucional.",
      "La restauración de respaldo sincroniza automáticamente tanto el almacenamiento local como las tablas relacionales en MySQL si XAMPP está activo.",
    ],
    flujosTrabajo: [
      {
        id: "wf-crear-restaurar-backup",
        nombre: "Flujo 11.1: Exportar o Restaurar una Copia de Seguridad Completa (.JSON)",
        objetivo: "Resguardar toda la base de datos institucional o restaurarla desde un archivo .json.",
        pasos: [
          {
            paso: 1,
            titulo: "Ingresar a Configuración del Sistema",
            detalle: "Vaya a 'Archivos' en el menú lateral y seleccione 'Configuración del Sistema'.",
          },
          {
            paso: 2,
            titulo: "Exportar Respaldo (.JSON)",
            detalle: "Haga clic en 'Crear Respaldo / Exportar JSON'. El sistema descargará un archivo .json con todos los estudiantes, representantes, materias, notas y configuraciones.",
          },
          {
            paso: 3,
            titulo: "Restaurar Respaldo (.JSON)",
            detalle: "Para restaurar datos, haga clic en 'Restaurar Respaldo', seleccione el archivo .json previamente exportado (o 'respaldo_sistema_escolar.json') y confirme la operación.",
          },
        ],
        resultadoEsperado: "Base de datos respaldada o restaurada íntegramente sin pérdida de información.",
      },
      {
        id: "wf-cambiar-motor-bd",
        nombre: "Flujo 11.2: Alternar entre Modo Local (JSON) y Servidor MySQL (XAMPP)",
        objetivo: "Configurar dónde se almacenan y consultan los datos del sistema.",
        pasos: [
          {
            paso: 1,
            titulo: "Abrir Configuración del Sistema",
            detalle: "Acceda a 'Archivos' → 'Configuración del Sistema'.",
          },
          {
            paso: 2,
            titulo: "Seleccionar Modo de Base de Datos",
            detalle: "Elija 'Local (Archivo JSON)' para funcionamiento portátil sin servidores externos, o 'MySQL (XAMPP)' indicando Host, Usuario, Contraseña y Nombre de Base de Datos.",
          },
          {
            paso: 3,
            titulo: "Guardar Configuración",
            detalle: "Presione 'Guardar Configuración'. El sistema aplicará el motor seleccionado de inmediato.",
          },
        ],
        resultadoEsperado: "Motor de almacenamiento configurado y operativo.",
      },
    ],
  },
];
