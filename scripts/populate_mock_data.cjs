const mysqlDb = require('../mysqlDb.cjs');
const db = require('../db.cjs');
const fs = require('fs');
const path = require('path');

// ============================================================================
// 1. CONFIGURACIÓN INSTITUCIONAL Y DOCUMENTOS FUNDAMENTALES
// ============================================================================
const CONFIGURACION_PLANTEL = {
  id: 1,
  nombre_colegio: 'Complejo Educativo U.E. "República de Chile"',
  codigo_dea: 'OD01461703',
  codigo_plantel: 'OD01461703',
  periodo: '2026-2027',
  direccion: 'Av. Bolívar c/c Calle Principal El Espinal, Sector El Valle, Municipio Díaz, Estado Nueva Esparta',
  telefono: '0295-2871420 / 0414-7924810',
  email: 'direccion.republicadechile@educacion.gob.ve',
  director_nombre: 'MSc. Beatriz Elena Velásquez de Salazar',
  director: 'MSc. Beatriz Elena Velásquez de Salazar',
  director_ci: 'V-13.642.890',
  lapsos_config: { lapso1: 30, lapso2: 30, lapso3: 40 }
};

const DOCUMENTOS_FUNDAMENTALES = [
  {
    id: "DOC-INST-001",
    nombre: "Proyecto Educativo Integral Comunitario (PEIC 2026-2027).pdf",
    tipo: "PDF",
    categoria: "Proyecto Institucional",
    ruta_archivo: "media://local/institucional/PEIC_2026_2027.pdf",
    tamano: 2450000,
    creado_en: new Date("2026-09-10T08:30:00Z")
  },
  {
    id: "DOC-INST-002",
    nombre: "Acuerdos de Convivencia Escolar y Paz Comunitaria.pdf",
    tipo: "PDF",
    categoria: "Normativa",
    ruta_archivo: "media://local/institucional/Acuerdos_Convivencia_2026.pdf",
    tamano: 1920000,
    creado_en: new Date("2026-09-12T10:15:00Z")
  },
  {
    id: "DOC-INST-003",
    nombre: "Reglamento Interno de Control de Estudios y Evaluación.pdf",
    tipo: "PDF",
    categoria: "Reglamento",
    ruta_archivo: "media://local/institucional/Reglamento_Control_Estudios.pdf",
    tamano: 3150000,
    creado_en: new Date("2026-09-15T14:20:00Z")
  },
  {
    id: "DOC-INST-004",
    nombre: "Cronograma Oficial del Año Escolar 2026-2027 (MPPE).pdf",
    tipo: "PDF",
    categoria: "Planificación",
    ruta_archivo: "media://local/institucional/Cronograma_MPPE_2026_2027.pdf",
    tamano: 1340000,
    creado_en: new Date("2026-09-18T09:00:00Z")
  },
  {
    id: "DOC-INST-005",
    nombre: "Protocolo de Bioseguridad y Salud Estudiantil.pdf",
    tipo: "PDF",
    categoria: "Salud Escolar",
    ruta_archivo: "media://local/institucional/Protocolo_Salud_Escolar.pdf",
    tamano: 1580000,
    creado_en: new Date("2026-09-20T11:45:00Z")
  }
];

// ============================================================================
// 2. PENSUM DE ESTUDIOS COMPLETO (Código Único como Clave Primaria / PK)
// ============================================================================
function construirPensumCompleto(periodo = '2026-2027') {
  const pensum = [];

  // --- EDUCACIÓN INICIAL (4 Grados x 4 Materias = 16 Materias) ---
  const gradosInicial = [
    { grado: "Maternal", sufijo: "MAT" },
    { grado: "1er Grupo", sufijo: "1GR" },
    { grado: "2do Grupo", sufijo: "2GR" },
    { grado: "3er Grupo", sufijo: "3GR" }
  ];
  const baseInicial = [
    { prefijo: "FPS", nombre: "Formación Personal, Social y Comunicación", horas: 6, area: "Desarrollo Personal" },
    { prefijo: "RCA", nombre: "Relación entre los Componentes del Ambiente", horas: 6, area: "Ciencias Naturales y Salud" },
    { prefijo: "EPC", nombre: "Expresión Plástica, Corporal y Musical", horas: 4, area: "Arte y Patrimonio" },
    { prefijo: "EFM", nombre: "Educación Física y Recreación Motriz", horas: 4, area: "Educación Física y Deporte" }
  ];
  gradosInicial.forEach(({ grado, sufijo }) => {
    baseInicial.forEach(m => {
      const codigo = `${m.prefijo}-${sufijo}`;
      pensum.push({
        id: codigo,
        codigo: codigo,
        nombre: m.nombre,
        grado: grado,
        nivel: "Inicial",
        periodo: periodo,
        horasSemanales: m.horas,
        area: m.area,
        otraAreaDescripcion: null,
        descripcion: `Área de aprendizaje de Educación Inicial (${grado}) - Clave única ${codigo}`
      });
    });
  });

  // --- EDUCACIÓN PRIMARIA (6 Grados x 6 Materias = 36 Materias) ---
  const gradosPrimaria = [
    { grado: "1ero", sufijo: "1ERO" },
    { grado: "2do", sufijo: "2DO" },
    { grado: "3ero", sufijo: "3ERO" },
    { grado: "4to", sufijo: "4TO" },
    { grado: "5to", sufijo: "5TO" },
    { grado: "6to", sufijo: "6TO" }
  ];
  const basePrimaria = [
    { prefijo: "CAS", nombre: "Castellano y Literatura", horas: 6, area: "Lengua y Comunicación" },
    { prefijo: "MAT", nombre: "Matemáticas para la Vida", horas: 6, area: "Ciencias y Matemáticas" },
    { prefijo: "NAT", nombre: "Ciencias Naturales y Salud", horas: 4, area: "Ciencias Naturales y Salud" },
    { prefijo: "SOC", nombre: "Ciencias Sociales, Identidad y Soberanía", horas: 4, area: "Ciencias Sociales e Historia" },
    { prefijo: "EST", nombre: "Educación Estética y Cultura", horas: 3, area: "Arte y Patrimonio" },
    { prefijo: "EDF", nombre: "Educación Física, Deporte y Recreación", horas: 3, area: "Educación Física y Deporte" }
  ];
  gradosPrimaria.forEach(({ grado, sufijo }) => {
    basePrimaria.forEach(m => {
      const codigo = `${m.prefijo}-${sufijo}`;
      pensum.push({
        id: codigo,
        codigo: codigo,
        nombre: m.nombre,
        grado: grado,
        nivel: "Primaria",
        periodo: periodo,
        horasSemanales: m.horas,
        area: m.area,
        otraAreaDescripcion: null,
        descripcion: `Asignatura oficial de Educación Primaria (${grado} Grado) - Clave única ${codigo}`
      });
    });
  });

  // --- EDUCACIÓN MEDIA GENERAL / SECUNDARIA (5 Años = 51 Materias) ---
  const configSecundaria = [
    {
      grado: "1er Año",
      sufijo: "1ERANO",
      materias: [
        { prefijo: "CAS", nombre: "Castellano", horas: 4, area: "Lengua y Comunicación" },
        { prefijo: "ING", nombre: "Inglés y Otras Lenguas", horas: 4, area: "Lenguas Extranjeras" },
        { prefijo: "MAT", nombre: "Matemáticas", horas: 4, area: "Ciencias y Matemáticas" },
        { prefijo: "EDF", nombre: "Educación Física", horas: 3, area: "Educación Física y Deporte" },
        { prefijo: "ART", nombre: "Arte y Patrimonio", horas: 3, area: "Arte y Patrimonio" },
        { prefijo: "NAT", nombre: "Ciencias Naturales", horas: 4, area: "Ciencias Naturales y Salud" },
        { prefijo: "GHC", nombre: "Geografía, Historia y Ciudadanía", horas: 4, area: "Ciencias Sociales e Historia" },
        { prefijo: "ORI", nombre: "Orientación y Convivencia", horas: 2, area: "Orientación y Convivencia" },
        { prefijo: "CRP", nombre: "Grupos de Creación, Recreación y Producción", horas: 3, area: "Producción y Cultura" }
      ]
    },
    {
      grado: "2do Año",
      sufijo: "2DOANO",
      materias: [
        { prefijo: "CAS", nombre: "Castellano", horas: 4, area: "Lengua y Comunicación" },
        { prefijo: "ING", nombre: "Inglés y Otras Lenguas", horas: 4, area: "Lenguas Extranjeras" },
        { prefijo: "MAT", nombre: "Matemáticas", horas: 4, area: "Ciencias y Matemáticas" },
        { prefijo: "EDF", nombre: "Educación Física", horas: 3, area: "Educación Física y Deporte" },
        { prefijo: "ART", nombre: "Arte y Patrimonio", horas: 3, area: "Arte y Patrimonio" },
        { prefijo: "NAT", nombre: "Ciencias Naturales", horas: 4, area: "Ciencias Naturales y Salud" },
        { prefijo: "GHC", nombre: "Geografía, Historia y Ciudadanía", horas: 4, area: "Ciencias Sociales e Historia" },
        { prefijo: "ORI", nombre: "Orientación y Convivencia", horas: 2, area: "Orientación y Convivencia" },
        { prefijo: "CRP", nombre: "Grupos de Creación, Recreación y Producción", horas: 3, area: "Producción y Cultura" }
      ]
    },
    {
      grado: "3er Año",
      sufijo: "3ANO",
      materias: [
        { prefijo: "CAS", nombre: "Castellano", horas: 4, area: "Lengua y Comunicación" },
        { prefijo: "ING", nombre: "Inglés y Otras Lenguas", horas: 4, area: "Lenguas Extranjeras" },
        { prefijo: "MAT", nombre: "Matemáticas", horas: 4, area: "Ciencias y Matemáticas" },
        { prefijo: "EDF", nombre: "Educación Física", horas: 3, area: "Educación Física y Deporte" },
        { prefijo: "FIS", nombre: "Física", horas: 4, area: "Ciencias Naturales y Salud" },
        { prefijo: "QUI", nombre: "Química", horas: 4, area: "Ciencias Naturales y Salud" },
        { prefijo: "BIO", nombre: "Biología", horas: 4, area: "Ciencias Naturales y Salud" },
        { prefijo: "GHC", nombre: "Geografía, Historia y Ciudadanía", horas: 4, area: "Ciencias Sociales e Historia" },
        { prefijo: "ORI", nombre: "Orientación y Convivencia", horas: 2, area: "Orientación y Convivencia" },
        { prefijo: "CRP", nombre: "Grupos de Creación, Recreación y Producción", horas: 3, area: "Producción y Cultura" }
      ]
    },
    {
      grado: "4to Año",
      sufijo: "4TOANO",
      materias: [
        { prefijo: "CAS", nombre: "Castellano", horas: 4, area: "Lengua y Comunicación" },
        { prefijo: "ING", nombre: "Inglés y Otras Lenguas", horas: 4, area: "Lenguas Extranjeras" },
        { prefijo: "MAT", nombre: "Matemáticas", horas: 4, area: "Ciencias y Matemáticas" },
        { prefijo: "EDF", nombre: "Educación Física", horas: 3, area: "Educación Física y Deporte" },
        { prefijo: "FIS", nombre: "Física", horas: 4, area: "Ciencias Naturales y Salud" },
        { prefijo: "QUI", nombre: "Química", horas: 4, area: "Ciencias Naturales y Salud" },
        { prefijo: "BIO", nombre: "Biología", horas: 4, area: "Ciencias Naturales y Salud" },
        { prefijo: "GHC", nombre: "Geografía, Historia y Ciudadanía", horas: 4, area: "Ciencias Sociales e Historia" },
        { prefijo: "FSN", nombre: "Formación para la Soberanía Nacional", horas: 3, area: "Ciencias Sociales e Historia" },
        { prefijo: "ORI", nombre: "Orientación y Convivencia", horas: 2, area: "Orientación y Convivencia" },
        { prefijo: "CRP", nombre: "Grupos de Creación, Recreación y Producción", horas: 3, area: "Producción y Cultura" }
      ]
    },
    {
      grado: "5to Año",
      sufijo: "5TOANO",
      materias: [
        { prefijo: "CAS", nombre: "Castellano", horas: 4, area: "Lengua y Comunicación" },
        { prefijo: "ING", nombre: "Inglés y Otras Lenguas", horas: 4, area: "Lenguas Extranjeras" },
        { prefijo: "MAT", nombre: "Matemáticas", horas: 4, area: "Ciencias y Matemáticas" },
        { prefijo: "EDF", nombre: "Educación Física", horas: 3, area: "Educación Física y Deporte" },
        { prefijo: "FIS", nombre: "Física", horas: 4, area: "Ciencias Naturales y Salud" },
        { prefijo: "QUI", nombre: "Química", horas: 4, area: "Ciencias Naturales y Salud" },
        { prefijo: "BIO", nombre: "Biología", horas: 4, area: "Ciencias Naturales y Salud" },
        { prefijo: "CIE", nombre: "Ciencias de la Tierra", horas: 4, area: "Ciencias Naturales y Salud" },
        { prefijo: "GHC", nombre: "Geografía, Historia y Ciudadanía", horas: 4, area: "Ciencias Sociales e Historia" },
        { prefijo: "FSN", nombre: "Formación para la Soberanía Nacional", horas: 3, area: "Ciencias Sociales e Historia" },
        { prefijo: "ORI", nombre: "Orientación y Convivencia", horas: 2, area: "Orientación y Convivencia" },
        { prefijo: "CRP", nombre: "Grupos de Creación, Recreación y Producción", horas: 3, area: "Producción y Cultura" }
      ]
    }
  ];

  configSecundaria.forEach(({ grado, sufijo, materias }) => {
    materias.forEach(m => {
      const codigo = `${m.prefijo}-${sufijo}`;
      pensum.push({
        id: codigo,
        codigo: codigo,
        nombre: m.nombre,
        grado: grado,
        nivel: "Secundaria",
        periodo: periodo,
        horasSemanales: m.horas,
        area: m.area,
        otraAreaDescripcion: null,
        descripcion: `Asignatura oficial de Educación Media General (${grado}) - Clave única ${codigo}`
      });
    });
  });

  return pensum;
}

// ============================================================================
// 3. CATÁLOGOS DE NOMBRES, APELLIDOS, DIRECCIONES Y REPRESENTANTES NUEVOS
// ============================================================================
const NOMBRES_MASC = [
  "Andrés", "Matías", "Benjamín", "Aarón", "Ignacio", "Maximiliano", "Gael", "Thiago",
  "Adrián", "Cristóbal", "Esteban", "Fabián", "Gustavo", "Hernán", "Iván", "Javier",
  "Kevin", "Lorenzo", "Mauricio", "Néstor", "Óscar", "Pablo", "Rafael", "Salvador",
  "Tomás", "Ulises", "Víctor", "Wilmer", "Xavier", "Yorman"
];

const NOMBRES_FEM = [
  "Valeria", "Antonella", "Julieta", "Miranda", "Salomé", "Renata", "Emma", "Regina",
  "Abril", "Bianca", "Celeste", "Diana", "Elisa", "Fernanda", "Génesis", "Helena",
  "Irene", "Jimena", "Karina", "Laura", "Milagros", "Nadia", "Oriana", "Paulina",
  "Raquel", "Sabrina", "Tamara", "Vanessa", "Ximena", "Zulimar"
];

const APELLIDOS_LIST = [
  "Velásquez", "Millán", "Subero", "Villarroel", "Alfonzo", "Marín", "Frontado", "Boadas",
  "Lárez", "Narváez", "Fermín", "Caraballo", "Mata", "Malaver", "Guilarte", "Bellorín",
  "Figueroa", "Lunar", "Penoth", "Rosas", "Ordaz", "Guevara", "Marcano", "Salazar",
  "Vásquez", "Brito", "Cedeño", "Ávila", "Suárez", "Padrón", "Rondón", "Quijada",
  "Sunilde", "Zabala", "Tineo", "Vicent", "Bermúdez", "Cardona", "Espinoza", "Fuentes"
];

const DIRECCIONES_NE = [
  "El Espinal, Av. Principal Sector La Cruz #18, Municipio Díaz",
  "San Juan Bautista, Calle Bolívar #42, Municipio Díaz",
  "La Guardia, Sector El Palotal Calle Marina #11, Municipio Díaz",
  "Las Guevaras, Calle San Rafael #25, Municipio Díaz",
  "El Valle del Espíritu Santo, Calle Las Flores #09, Municipio García",
  "La Asunción, Urb. Santa Isabel Vereda 4 #16, Municipio Arismendi",
  "Porlamar, Urb. Jorge Coll Calle 3 #52, Municipio Maneiro",
  "Villa Rosa, Sector 3 Vereda 12 #07, Municipio García",
  "Carapacho, Calle Principal #33, Municipio Díaz",
  "Fuentidueño, Sector La Montaña #14, Municipio Díaz",
  "Punta de Piedras, Calle Colón #29, Municipio Tubores",
  "Juan Griego, Calle El Sol #61, Municipio Marcano",
  "Pampatar, Sector Los Robles Calle El Cristo #20, Municipio Maneiro",
  "El Tuey, Calle San José #15, Municipio Díaz",
  "Boquerón, Vía Principal San Juan #08, Municipio Díaz"
];

const OCUPACIONES_REP = [
  { ocupacion: "Contadora Pública Colegiada", trabajo: "Escritorio Contable Insular C.A." },
  { ocupacion: "Ingeniero Civil", trabajo: "Constructora Nueva Esparta S.A." },
  { ocupacion: "Enfermera Especialista", trabajo: "Hospital Dr. Luis Ortega de Porlamar" },
  { ocupacion: "Comerciante Independiente", trabajo: "Mercado Municipal de Conejeros" },
  { ocupacion: "Analista de Sistemas", trabajo: "Corporación Tecnológica Margarita" },
  { ocupacion: "Médico Pediatra", trabajo: "Centro Clínico del Caribe" },
  { ocupacion: "Administrador Aduanero", trabajo: "Puerto Internacional El Guamache" },
  { ocupacion: "Artesana y Emprendedora", trabajo: "Paseo Artesanal de San Juan Bautista" },
  { ocupacion: "Técnico Electricista", trabajo: "Corpoelec Nueva Esparta" },
  { ocupacion: "Abogada Litigante", trabajo: "Consultoría Jurídica Arismendi" },
  { ocupacion: "Chef Ejecutivo", trabajo: "Hotel Tibisay Margarita" },
  { ocupacion: "Farmacéutica Regente", trabajo: "Farmacia El Espinal Centro" },
  { ocupacion: "Arquitecto Proyectista", trabajo: "Estudio Urbano Margarita" },
  { ocupacion: "Supervisor de Logística", trabajo: "Distribuidora Insular de Alimentos" },
  { ocupacion: "Odontóloga General", trabajo: "Unidad Odontológica Sonrisa Insular" }
];

const LUGARES_NAC = ["Porlamar", "La Asunción", "San Juan Bautista", "Juan Griego", "El Espinal", "Pampatar"];
const PREFIJOS_MOVIL = ["0414", "0424", "0412", "0416", "0426"];
const GRUPOS_SANGRE = ["O+", "A+", "B+", "O-", "A-", "AB+", "B-", "AB-"];

function generarRepresentantes(total = 75) {
  const reps = [];
  for (let i = 0; i < total; i++) {
    const esFemenino = i % 3 !== 1; // ~67% madres/tías/abuelas, ~33% padres/tíos/abuelos
    const pNombre = esFemenino
      ? NOMBRES_FEM[(i * 2) % NOMBRES_FEM.length]
      : NOMBRES_MASC[(i * 2) % NOMBRES_MASC.length];
    const sNombre = esFemenino
      ? NOMBRES_FEM[(i * 2 + 5) % NOMBRES_FEM.length]
      : NOMBRES_MASC[(i * 2 + 5) % NOMBRES_MASC.length];
    const pApellido = APELLIDOS_LIST[i % APELLIDOS_LIST.length];
    const sApellido = APELLIDOS_LIST[(i + 7) % APELLIDOS_LIST.length];
    const nombreCompleto = `${pNombre} ${sNombre} ${pApellido} ${sApellido}`;

    let parentesco = esFemenino ? "Madre" : "Padre";
    if (i % 11 === 0) parentesco = esFemenino ? "Abuela" : "Abuelo";
    else if (i % 13 === 0) parentesco = esFemenino ? "Tía" : "Tío";

    const ciNum = 13500000 + i * 114283;
    const ci = `V-${ciNum}`;
    const prefijo = PREFIJOS_MOVIL[i % PREFIJOS_MOVIL.length];
    const cuerpoTlf = String(3100000 + i * 54321).slice(0, 7);
    const telefono = `${prefijo}${cuerpoTlf}`;
    const telefonoHab = `0295-${String(2870000 + i * 123).slice(0, 7)}`;
    const ocupInfo = OCUPACIONES_REP[i % OCUPACIONES_REP.length];
    const direccion = DIRECCIONES_NE[i % DIRECCIONES_NE.length];
    const email = `${pNombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}.${pApellido.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}${i + 1}@correo.com`;

    reps.push({
      id: `REP-${ciNum}`,
      ci,
      primer_nombre: pNombre,
      segundo_nombre: sNombre,
      primer_apellido: pApellido,
      segundo_apellido: sApellido,
      nombre_completo: nombreCompleto,
      parentesco,
      telefono,
      telefono_habitacion: telefonoHab,
      email,
      direccion,
      ocupacion: ocupInfo.ocupacion,
      lugar_trabajo: ocupInfo.trabajo,
      foto_url: "",
      observaciones: "Representante legal verificado y solvente en control de estudios."
    });
  }
  return reps;
}

// ============================================================================
// 4. ESTRUCTURA DE LOS 15 GRADOS/AÑOS x 2 SECCIONES (A y B) x 5 ESTUDIANTES = 150
// ============================================================================
const SECCIONES_ESCOLARES = [
  // Inicial (4 grados x 2 secciones = 8 secciones -> 40 estudiantes)
  { nivel: "Inicial", grado: "Maternal", seccion: "A", edadBase: 3, nacYear: 2023 },
  { nivel: "Inicial", grado: "Maternal", seccion: "B", edadBase: 3, nacYear: 2023 },
  { nivel: "Inicial", grado: "1er Grupo", seccion: "A", edadBase: 4, nacYear: 2022 },
  { nivel: "Inicial", grado: "1er Grupo", seccion: "B", edadBase: 4, nacYear: 2022 },
  { nivel: "Inicial", grado: "2do Grupo", seccion: "A", edadBase: 5, nacYear: 2021 },
  { nivel: "Inicial", grado: "2do Grupo", seccion: "B", edadBase: 5, nacYear: 2021 },
  { nivel: "Inicial", grado: "3er Grupo", seccion: "A", edadBase: 6, nacYear: 2020 },
  { nivel: "Inicial", grado: "3er Grupo", seccion: "B", edadBase: 6, nacYear: 2020 },

  // Primaria (6 grados x 2 secciones = 12 secciones -> 60 estudiantes)
  { nivel: "Primaria", grado: "1ero", seccion: "A", edadBase: 6, nacYear: 2020 },
  { nivel: "Primaria", grado: "1ero", seccion: "B", edadBase: 6, nacYear: 2020 },
  { nivel: "Primaria", grado: "2do", seccion: "A", edadBase: 7, nacYear: 2019 },
  { nivel: "Primaria", grado: "2do", seccion: "B", edadBase: 7, nacYear: 2019 },
  { nivel: "Primaria", grado: "3ero", seccion: "A", edadBase: 8, nacYear: 2018 },
  { nivel: "Primaria", grado: "3ero", seccion: "B", edadBase: 8, nacYear: 2018 },
  { nivel: "Primaria", grado: "4to", seccion: "A", edadBase: 9, nacYear: 2017 },
  { nivel: "Primaria", grado: "4to", seccion: "B", edadBase: 9, nacYear: 2017 },
  { nivel: "Primaria", grado: "5to", seccion: "A", edadBase: 10, nacYear: 2016 },
  { nivel: "Primaria", grado: "5to", seccion: "B", edadBase: 10, nacYear: 2016 },
  { nivel: "Primaria", grado: "6to", seccion: "A", edadBase: 11, nacYear: 2015 },
  { nivel: "Primaria", grado: "6to", seccion: "B", edadBase: 11, nacYear: 2015 },

  // Secundaria (5 años x 2 secciones = 10 secciones -> 50 estudiantes)
  { nivel: "Secundaria", grado: "1er Año", seccion: "A", edadBase: 12, nacYear: 2014 },
  { nivel: "Secundaria", grado: "1er Año", seccion: "B", edadBase: 12, nacYear: 2014 },
  { nivel: "Secundaria", grado: "2do Año", seccion: "A", edadBase: 13, nacYear: 2013 },
  { nivel: "Secundaria", grado: "2do Año", seccion: "B", edadBase: 13, nacYear: 2013 },
  { nivel: "Secundaria", grado: "3er Año", seccion: "A", edadBase: 14, nacYear: 2012 },
  { nivel: "Secundaria", grado: "3er Año", seccion: "B", edadBase: 14, nacYear: 2012 },
  { nivel: "Secundaria", grado: "4to Año", seccion: "A", edadBase: 15, nacYear: 2011 },
  { nivel: "Secundaria", grado: "4to Año", seccion: "B", edadBase: 15, nacYear: 2011 },
  { nivel: "Secundaria", grado: "5to Año", seccion: "A", edadBase: 16, nacYear: 2010 },
  { nivel: "Secundaria", grado: "5to Año", seccion: "B", edadBase: 16, nacYear: 2010 }
];

const ESTUDIANTES_POR_SECCION = 5;

async function run() {
  console.log("====================================================================");
  console.log("  CARGA MASIVA DE NUEVOS EJEMPLOS (5 ESTUDIANTES POR GRADO/SECCIÓN)");
  console.log("====================================================================");

  const isConnected = await mysqlDb.init();
  if (!isConnected) {
    console.warn("⚠️ MySQL no disponible, se poblará LocalDB JSON directamente.");
  }

  // 1. LIMPIEZA TOTAL DE DATOS ANTERIORES
  if (isConnected) {
    console.log("[1/7] Eliminando todos los registros antiguos en MySQL...");
    try { await mysqlDb.pool.query("DROP TABLE IF EXISTS asignaciones_docentes"); } catch {}
    try { await mysqlDb.pool.query("DROP TABLE IF EXISTS docentes"); } catch {}
    await mysqlDb.pool.query("DELETE FROM evaluaciones_individuales");
    await mysqlDb.pool.query("DELETE FROM registro_notas_seccion");
    await mysqlDb.pool.query("DELETE FROM estudiantes");
    await mysqlDb.pool.query("DELETE FROM representantes");
    await mysqlDb.pool.query("DELETE FROM pensum_materias");
    await mysqlDb.pool.query("DELETE FROM documentos_institucionales");
  }

  // 2. CONFIGURACIÓN INSTITUCIONAL Y DOCUMENTOS FUNDAMENTALES
  console.log("[2/7] Guardando Configuración Institucional y Documentos Fundamentales...");
  if (isConnected) {
    await mysqlDb.pool.query(`
      INSERT INTO configuracion (
        id, nombre_colegio, codigo_dea, periodo, direccion, telefono, email, director_nombre, director_ci, lapsos_config
      ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        nombre_colegio = VALUES(nombre_colegio),
        codigo_dea = VALUES(codigo_dea),
        periodo = VALUES(periodo),
        direccion = VALUES(direccion),
        telefono = VALUES(telefono),
        email = VALUES(email),
        director_nombre = VALUES(director_nombre),
        director_ci = VALUES(director_ci),
        lapsos_config = VALUES(lapsos_config)
    `, [
      CONFIGURACION_PLANTEL.nombre_colegio,
      CONFIGURACION_PLANTEL.codigo_dea,
      CONFIGURACION_PLANTEL.periodo,
      CONFIGURACION_PLANTEL.direccion,
      CONFIGURACION_PLANTEL.telefono,
      CONFIGURACION_PLANTEL.email,
      CONFIGURACION_PLANTEL.director_nombre,
      CONFIGURACION_PLANTEL.director_ci,
      JSON.stringify(CONFIGURACION_PLANTEL.lapsos_config)
    ]);

    for (const doc of DOCUMENTOS_FUNDAMENTALES) {
      await mysqlDb.pool.query(`
        INSERT INTO documentos_institucionales (id, nombre, tipo, categoria, ruta_archivo, tamano, creado_en)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [doc.id, doc.nombre, doc.tipo, doc.categoria, doc.ruta_archivo, doc.tamano, doc.creado_en]);
    }
  }

  // 3. MATERIAS DEL PENSUM (Código Único como Clave Primaria / PK)
  const pensumCompleto = construirPensumCompleto(CONFIGURACION_PLANTEL.periodo);
  console.log(`[3/7] Registrando ${pensumCompleto.length} Materias con Código Único (PK)...`);
  if (isConnected) {
    for (const m of pensumCompleto) {
      await mysqlDb.guardarMateriaPensum(m);
    }
  }

  // 4. REPRESENTANTES (75 Representantes Nuevos)
  const representantes = generarRepresentantes(75);
  console.log(`[4/7] Registrando ${representantes.length} Representantes...`);
  if (isConnected) {
    for (const r of representantes) {
      await mysqlDb.pool.query(`
        INSERT INTO representantes (
          id, ci, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
          nombre_completo, parentesco, telefono, telefono_habitacion, email, direccion,
          ocupacion, lugar_trabajo, foto_url, observaciones
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        r.id, r.ci, r.primer_nombre, r.segundo_nombre, r.primer_apellido, r.segundo_apellido,
        r.nombre_completo, r.parentesco, r.telefono, r.telefono_habitacion, r.email, r.direccion,
        r.ocupacion, r.lugar_trabajo, r.foto_url, r.observaciones
      ]);
    }
  }

  // 5. ESTUDIANTES (5 Estudiantes por cada Grado, Año y Sección = 150 Estudiantes)
  console.log(`[5/7] Generando 150 Estudiantes (${ESTUDIANTES_POR_SECCION} por cada grado, año y sección A/B)...`);
  const estudiantesMySQL = [];
  const estudiantesFrontend = [];
  let globalIdx = 0;

  for (let sIdx = 0; sIdx < SECCIONES_ESCOLARES.length; sIdx++) {
    const secCfg = SECCIONES_ESCOLARES[sIdx];

    for (let k = 0; k < ESTUDIANTES_POR_SECCION; k++) {
      const idx = globalIdx++;
      const esMasc = (idx + k) % 2 === 0;

      const primerNombre = esMasc
        ? NOMBRES_MASC[(idx * 3 + k) % NOMBRES_MASC.length]
        : NOMBRES_FEM[(idx * 3 + k) % NOMBRES_FEM.length];
      const segundoNombre = esMasc
        ? NOMBRES_MASC[(idx * 3 + k + 7) % NOMBRES_MASC.length]
        : NOMBRES_FEM[(idx * 3 + k + 7) % NOMBRES_FEM.length];

      // Cada par de hermanos comparte representante (75 representantes para 150 estudiantes)
      const rep = representantes[Math.floor(idx / 2) % representantes.length];
      const primerApellido = rep.primer_apellido;
      const segundoApellido = APELLIDOS_LIST[(idx + 11) % APELLIDOS_LIST.length];
      const nombreCompleto = `${primerNombre} ${segundoNombre} ${primerApellido} ${segundoApellido}`;

      const estId = `EST-2026-${String(2001 + idx)}`;
      const repDigits = rep.ci.replace(/\D/g, '');
      const idEscolar = `${ (idx % 2) + 1 }${String(secCfg.nacYear).slice(2)}${repDigits}`;
      const ci = secCfg.edadBase >= 10
        ? `V-${31500000 + idx * 1423}`
        : idEscolar;

      const mesNac = String((idx % 12) + 1).padStart(2, '0');
      const diaNac = String(((idx * 5) % 27) + 1).padStart(2, '0');
      const fechaNac = `${secCfg.nacYear}-${mesNac}-${diaNac}`;
      const lugarNac = LUGARES_NAC[idx % LUGARES_NAC.length];
      const estatus = "Inscrito";
      const periodoEscolar = CONFIGURACION_PLANTEL.periodo;

      // Los 8 documentos obligatorios de auditoría completos
      const filesInsc = [
        { id: "birthCertificate", name: "birthCertificate_Partida_Nacimiento.pdf", path: `media://local/estudiantes/${estId}/birthCertificate_partida.pdf` },
        { id: "studentCI", name: "studentCI_Cedula_Estudiante.pdf", path: `media://local/estudiantes/${estId}/studentCI_cedula.pdf` },
        { id: "medicalCertificate", name: "medicalCertificate_Certificado_Salud.pdf", path: `media://local/estudiantes/${estId}/medicalCertificate_salud.pdf` },
        { id: "vaccinationCard", name: "vaccinationCard_Carnet_Vacunacion.pdf", path: `media://local/estudiantes/${estId}/vaccinationCard_vacunas.pdf` },
        { id: "repCI", name: "repCI_Cedula_Representante.pdf", path: `media://local/estudiantes/${estId}/repCI_representante.pdf` },
        { id: "addressProof", name: "addressProof_Constancia_Residencia.pdf", path: `media://local/estudiantes/${estId}/addressProof_domicilio.pdf` },
        { id: "reportCard", name: "reportCard_Boletin_Anterior.pdf", path: `media://local/estudiantes/${estId}/reportCard_boletin.pdf` },
        { id: "conductLetter", name: "conductLetter_Carta_Buena_Conducta.pdf", path: `media://local/estudiantes/${estId}/conductLetter_conducta.pdf` }
      ];

      const estatura = (0.95 + (secCfg.edadBase * 0.045) + (k * 0.01)).toFixed(2);
      const peso = (15 + (secCfg.edadBase * 2.9) + (k * 0.6)).toFixed(1);
      const tallaCamisa = secCfg.edadBase <= 5 ? "4" : secCfg.edadBase <= 8 ? "8" : secCfg.edadBase <= 11 ? "12" : secCfg.edadBase <= 14 ? "16" : "S";
      const tallaPantalon = tallaCamisa;
      const tallaCalzado = String(Math.min(41, 25 + Math.round(secCfg.edadBase * 1.05)));
      const grupoSanguineo = GRUPOS_SANGRE[idx % GRUPOS_SANGRE.length];
      const alergias = idx % 9 === 0 ? "Alergia leve al polvo y cambios de clima" : "Ninguna conocida";
      const condicionMedica = idx % 14 === 0 ? "Control oftalmológico anual (uso de lentes)" : "Sano - Apto para actividades deportivas";

      const madreNombre = rep.parentesco === "Madre"
        ? rep.nombre_completo
        : `${NOMBRES_FEM[(idx + 4) % NOMBRES_FEM.length]} ${segundoApellido} de ${primerApellido}`;
      const madreCI = rep.parentesco === "Madre" ? rep.ci : `V-${15200000 + idx * 319}`;
      const madreTelefono = rep.parentesco === "Madre" ? rep.telefono : `0414${String(4100000 + idx * 811).slice(0, 7)}`;

      const padreNombre = rep.parentesco === "Padre"
        ? rep.nombre_completo
        : `${NOMBRES_MASC[(idx + 6) % NOMBRES_MASC.length]} ${primerApellido} ${APELLIDOS_LIST[(idx + 3) % APELLIDOS_LIST.length]}`;
      const padreCI = rep.parentesco === "Padre" ? rep.ci : `V-${14100000 + idx * 421}`;
      const padreTelefono = rep.parentesco === "Padre" ? rep.telefono : `0424${String(5200000 + idx * 733).slice(0, 7)}`;

      const emailEst = `${primerNombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}.${primerApellido.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}${idx + 1}@est.republicadechile.edu.ve`;

      const studentRow = {
        id: estId,
        ci: ci,
        id_escolar: idEscolar,
        primer_nombre: primerNombre,
        segundo_nombre: segundoNombre,
        primer_apellido: primerApellido,
        segundo_apellido: segundoApellido,
        nombre_completo: nombreCompleto,
        fecha_nacimiento: fechaNac,
        edad: secCfg.edadBase,
        genero: esMasc ? "Masculino" : "Femenino",
        lugar_nacimiento: lugarNac,
        entidad_nacimiento: "Nueva Esparta",
        pais_nacimiento: "Venezuela",
        direccion: rep.direccion,
        municipio: "Díaz",
        parroquia: "San Juan Bautista",
        sector: "El Espinal",
        email: emailEst,
        nivel: secCfg.nivel,
        grado: secCfg.grado,
        seccion: secCfg.seccion,
        periodo_escolar: periodoEscolar,
        estatus: estatus,
        fecha_ingreso: "2026-09-16",
        colegio_procedencia: 'Complejo Educativo U.E. "República de Chile"',
        codigo_dea_procedencia: "OD01461703",
        repite_grado: "No",
        grupo_sanguineo: grupoSanguineo,
        estatura: estatura,
        peso: peso,
        talla_camisa: tallaCamisa,
        talla_pantalon: tallaPantalon,
        talla_calzado: tallaCalzado,
        alergias: alergias,
        condicion_medica: condicionMedica,
        representante_id: rep.id,
        rep_nombre: rep.nombre_completo,
        rep_ci: rep.ci,
        rep_telefono: rep.telefono,
        rep_parentesco: rep.parentesco,
        madre_nombre: madreNombre,
        madre_ci: madreCI,
        madre_telefono: madreTelefono,
        padre_nombre: padreNombre,
        padre_ci: padreCI,
        padre_telefono: padreTelefono,
        obs_personal: "Estudiante puntual, participativo y con excelente integración grupal.",
        obs_familiar: "Representante comprometido con las actividades académicas del plantel.",
        obs_salud: "Evaluación médica e inmunizaciones al día.",
        observaciones: "Expediente verificado por Control de Estudios para el período 2026-2027.",
        foto_estudiante: null,
        foto_representante: null,
        archivos_inscripcion: JSON.stringify(filesInsc),
        archivos_traslado: JSON.stringify([])
      };

      if (isConnected) {
        await mysqlDb.pool.query(`
          INSERT INTO estudiantes (
            id, ci, id_escolar, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
            nombre_completo, fecha_nacimiento, edad, genero, lugar_nacimiento, entidad_nacimiento,
            pais_nacimiento, direccion, municipio, parroquia, sector, email,
            nivel, grado, seccion, periodo_escolar, estatus, fecha_ingreso,
            colegio_procedencia, codigo_dea_procedencia, repite_grado, grupo_sanguineo,
            estatura, peso, talla_camisa, talla_pantalon, talla_calzado, alergias, condicion_medica,
            representante_id, rep_nombre, rep_ci, rep_telefono, rep_parentesco,
            madre_nombre, madre_ci, madre_telefono, padre_nombre, padre_ci, padre_telefono,
            obs_personal, obs_familiar, obs_salud, observaciones, foto_estudiante, foto_representante,
            archivos_inscripcion, archivos_traslado
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, Object.values(studentRow));
      }

      estudiantesMySQL.push(studentRow);

      estudiantesFrontend.push({
        ...studentRow,
        firstName: studentRow.primer_nombre,
        secondName: studentRow.segundo_nombre,
        lastName: studentRow.primer_apellido,
        secondLastName: studentRow.segundo_apellido,
        nombre: `${studentRow.primer_nombre} ${studentRow.primer_apellido}`,
        birthDate: studentRow.fecha_nacimiento,
        age: String(studentRow.edad),
        gender: studentRow.genero,
        placeOfBirth: studentRow.lugar_nacimiento,
        entity: studentRow.entidad_nacimiento,
        country: studentRow.pais_nacimiento,
        address: studentRow.direccion,
        municipality: studentRow.municipio,
        parish: studentRow.parroquia,
        level: studentRow.nivel,
        grade: studentRow.grado,
        section: studentRow.seccion,
        schoolYear: studentRow.periodo_escolar,
        periodo: studentRow.periodo_escolar,
        status: studentRow.estatus,
        admissionDate: studentRow.fecha_ingreso,
        previousSchool: studentRow.colegio_procedencia,
        deaCode: studentRow.codigo_dea_procedencia,
        repeatsYear: studentRow.repite_grado,
        bloodType: studentRow.grupo_sanguineo,
        height: studentRow.estatura,
        weight: studentRow.peso,
        shirtSize: studentRow.talla_camisa,
        pantsSize: studentRow.talla_pantalon,
        shoeSize: studentRow.talla_calzado,
        allergies: studentRow.alergias,
        medicalCondition: studentRow.condicion_medica,
        repName: studentRow.rep_nombre,
        repFirstName: rep.primer_nombre,
        repLastName: `${rep.primer_apellido} ${rep.segundo_apellido}`.trim(),
        repCI: studentRow.rep_ci,
        repCedula: studentRow.rep_ci,
        repPhone: studentRow.rep_telefono,
        repEmail: rep.email,
        relationship: studentRow.rep_parentesco,
        motherName: studentRow.madre_nombre,
        motherFirstName: studentRow.madre_nombre.split(' ')[0],
        motherLastName: studentRow.madre_nombre.split(' ').slice(1).join(' '),
        motherCI: studentRow.madre_ci,
        motherPhone: studentRow.madre_telefono,
        fatherName: studentRow.padre_nombre,
        fatherFirstName: studentRow.padre_nombre.split(' ')[0],
        fatherLastName: studentRow.padre_nombre.split(' ').slice(1).join(' '),
        fatherCI: studentRow.padre_ci,
        fatherPhone: studentRow.padre_telefono,
        obsPersonal: studentRow.obs_personal,
        obsFamiliar: studentRow.obs_familiar,
        obsSalud: studentRow.obs_salud,
        observations: studentRow.observaciones,
        studentPhoto: null,
        repPhoto: null,
        inscriptionFiles: filesInsc,
        transferFiles: []
      });
    }
  }

  // 6. CALIFICACIONES Y PLANIFICACIONES PARA TODAS LAS SECCIONES Y MATERIAS
  console.log("[6/7] Generando Planificaciones y Calificaciones para todas las secciones y materias...");
  const planificacionBase = {
    "1": [
      { id: 101, peso: 25, nombre: "Evaluación Escrita / Taller Práctico" },
      { id: 102, peso: 25, nombre: "Exposición y Defensa de Proyecto" },
      { id: 103, peso: 25, nombre: "Producción Escrita y Cuaderno" },
      { id: 104, peso: 25, nombre: "Rasgos Personales y Convivencia" }
    ],
    "2": [
      { id: 201, peso: 25, nombre: "Investigación Documental" },
      { id: 202, peso: 25, nombre: "Prueba Objetiva Integral" },
      { id: 203, peso: 25, nombre: "Laboratorio / Demostración Pedagógica" },
      { id: 204, peso: 25, nombre: "Participación y Responsabilidad" }
    ],
    "3": [
      { id: 301, peso: 25, nombre: "Seminario / Ensayo Analítico" },
      { id: 302, peso: 25, nombre: "Cierre de Proyecto de Aprendizaje" },
      { id: 303, peso: 25, nombre: "Evaluación Final de Lapso" },
      { id: 304, peso: 25, nombre: "Autoevaluación y Coevaluación" }
    ]
  };

  const registrosNotas = [];
  const seccionesCalificables = SECCIONES_ESCOLARES.filter(s => s.nivel === "Primaria" || s.nivel === "Secundaria");

  for (const sec of seccionesCalificables) {
    const seccionId = `${sec.grado}-${sec.seccion}-${sec.nivel}`;
    const estsSeccion = estudiantesFrontend.filter(
      e => e.nivel === sec.nivel && e.grade === sec.grado && e.section === sec.seccion
    );
    const materiasDeGrado = pensumCompleto.filter(
      m => m.nivel === sec.nivel && m.grado === sec.grado
    );

    for (let mIdx = 0; mIdx < materiasDeGrado.length; mIdx++) {
      const mat = materiasDeGrado[mIdx];
      const notasObj = {};

      estsSeccion.forEach((est, eIdx) => {
        if (sec.nivel === "Primaria") {
          const letras = ["A", "A", "B", "A", "B", "C"];
          const l1 = letras[(eIdx + mIdx) % 5];
          const l2 = letras[(eIdx + mIdx + 1) % 5];
          const l3 = letras[(eIdx + mIdx + 2) % 5];
          notasObj[est.id] = {
            "101": l1, "102": l1, "103": l2, "104": "A",
            "201": l2, "202": l1, "203": l2, "204": "A",
            "301": l1, "302": l3, "303": l1, "304": "A"
          };
        } else {
          const base = 14 + ((eIdx + mIdx) % 6); // Entre 14 y 19
          notasObj[est.id] = {
            "101": String(Math.min(20, base)),
            "102": String(Math.min(20, base + 1)),
            "103": String(Math.max(12, base - 1)),
            "104": String(Math.min(20, base + 2)),
            "201": String(Math.min(20, base + 1)),
            "202": String(Math.min(20, base)),
            "203": String(Math.max(13, base - 1)),
            "204": "19",
            "301": String(Math.min(20, base + 1)),
            "302": String(Math.min(20, base + 2)),
            "303": String(Math.min(20, base)),
            "304": "20"
          };
        }
      });

      const regId = `${seccionId}_${mat.nombre}`;
      if (isConnected) {
        await mysqlDb.pool.query(`
          INSERT INTO registro_notas_seccion (id, seccion_id, materia, planificacion_json, notas_json)
          VALUES (?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            planificacion_json = VALUES(planificacion_json),
            notas_json = VALUES(notas_json)
        `, [regId, seccionId, mat.nombre, JSON.stringify(planificacionBase), JSON.stringify(notasObj)]);
      }

      registrosNotas.push({
        id: regId,
        seccionId: seccionId,
        materia: mat.nombre,
        codigoMateria: mat.codigo,
        planificacion: planificacionBase,
        notas: notasObj,
        ultima_modificacion: new Date().toISOString()
      });
    }
  }

  // 7. GENERAR Y GUARDAR ARCHIVO .JSON DE RESPALDO Y PROBAR RESTAURACIÓN
  console.log("[7/7] Construyendo archivo .JSON de respaldo y verificando restauración...");
  const plantillasBase = db.generarPlantillasBase();

  const respaldoCompletoJSON = {
    meta: {
      sistema: "Sistema de Registro de Estudiantes SC",
      version: "2.0.0",
      fecha_respaldo: new Date().toISOString(),
      periodo_activo: CONFIGURACION_PLANTEL.periodo,
      descripcion: "Respaldo integral con 150 estudiantes (5 por cada grado, año y sección A y B), 75 representantes, 103 materias con código único (PK) y 174 planillas de calificaciones.",
      estadisticas: {
        total_estudiantes: estudiantesFrontend.length,
        estudiantes_por_seccion: ESTUDIANTES_POR_SECCION,
        total_secciones: SECCIONES_ESCOLARES.length,
        total_representantes: representantes.length,
        total_materias: pensumCompleto.length,
        total_secciones_notas: registrosNotas.length,
        total_plantillas: plantillasBase.length
      }
    },
    configuracion: {
      ...CONFIGURACION_PLANTEL,
      lapsos: CONFIGURACION_PLANTEL.lapsos_config,
      documentos_fundamentales: DOCUMENTOS_FUNDAMENTALES.map(d => ({
        id: d.id,
        nombre: d.nombre,
        tipo: d.tipo,
        categoria: d.categoria,
        ruta: d.ruta_archivo,
        tamano: d.tamano,
        fecha: d.creado_en.toISOString().split('T')[0]
      }))
    },
    usuarios: [
      {
        id: "usr_admin",
        nombre: "Administrador General",
        username: "admin",
        email: "admin@escuela.com",
        password: "admin123",
        rol: "director"
      }
    ],
    representantes: representantes,
    estudiantes: estudiantesFrontend,
    pensum: pensumCompleto,
    materias: pensumCompleto,
    registro_notas: registrosNotas,
    plantillas: plantillasBase
  };

  const jsonContent = JSON.stringify(respaldoCompletoJSON, null, 2);

  // Rutas donde guardar el archivo .json de respaldo y la DB local
  const appData = process.env.APPDATA || path.join(process.env.HOME || '.', '.config');
  const rutasDestino = [
    path.resolve(__dirname, '..', 'respaldo_sistema_escolar.json'),
    path.resolve(__dirname, '..', '..', 'respaldo_sistema_escolar.json'),
    path.join(appData, 'Electron', 'sistema_escolar_db.json'),
    path.join(appData, 'frontend_institucion', 'sistema_escolar_db.json'),
    path.join(appData, 'sistema-registro-estudiantes-sc', 'sistema_escolar_db.json')
  ];

  for (const destino of rutasDestino) {
    try {
      const dir = path.dirname(destino);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(destino, jsonContent, 'utf-8');
      console.log(`  ✅ Archivo JSON guardado en: ${destino}`);
    } catch (e) {
      console.warn(`  ⚠️ No se pudo escribir en ${destino}: ${e.message}`);
    }
  }

  // PRUEBA AUTOMÁTICA DE LECTURA Y RESTAURACIÓN DESDE EL ARCHIVO .JSON
  console.log("\n=== PRUEBA DE FUNCIONAMIENTO DEL RESPALDO .JSON ===");
  const backupFilePath = path.resolve(__dirname, '..', 'respaldo_sistema_escolar.json');
  const rawRead = fs.readFileSync(backupFilePath, 'utf-8');
  const parsedRead = JSON.parse(rawRead);

  const restoreResult = await db.restaurarRespaldoCompleto(parsedRead);
  if (!restoreResult || !restoreResult.success) {
    throw new Error("La prueba de restauración del archivo .json falló.");
  }

  const verifyStudents = await db.obtenerEstudiantes();
  const verifyPensum = await db.obtenerPensum({});
  const verifyConfig = await db.getConfig();

  console.log(`  ✅ Prueba de restauración JSON exitosa:`, restoreResult.stats);
  console.log(`  ✅ Estudiantes verificados tras restaurar: ${verifyStudents.length} (5 por cada una de las ${SECCIONES_ESCOLARES.length} secciones)`);
  console.log(`  ✅ Materias verificadas con Código Único (PK): ${verifyPensum.length}`);
  console.log(`  ✅ Plantel verificado: ${verifyConfig.nombre_colegio} (${verifyConfig.periodo})`);
  console.log("====================================================================");
  process.exit(0);
}

run().catch(err => {
  console.error("❌ Error durante la carga y prueba de datos:", err);
  process.exit(1);
});
