const mysqlDb = require('./frontend_institucion/mysqlDb.cjs');
const fs = require('fs');
const path = require('path');

const SEED_DATA = {
  configuracion: {
    id: 1,
    nombre_colegio: 'Complejo Educativo U.E. "República de Chile"',
    codigo_dea: 'OD01461703',
    periodo: '2026-2027',
    direccion: 'Av. Bolívar c/c Calle Principal El Espinal, Sector El Valle, Municipio Díaz, Estado Nueva Esparta, Isla de Margarita',
    telefono: '0295-2871234 / 0414-7894561',
    email: 'ue.republicadechile@educacion.gob.ve',
    director_nombre: 'Dr. Alejandro José Marcano Salazar',
    director_ci: 'V-12.458.963',
    lapsos_config: { lapso1: 30, lapso2: 30, lapso3: 40 }
  },

  documentosFundamentales: [
    {
      id: "doc_fund_1",
      nombre: "Proyecto Educativo Integral Comunitario (PEIC) 2026-2027.pdf",
      tipo: "application/pdf",
      categoria: "PEIC",
      ruta_archivo: "documentos/PEIC_2026_2027.pdf",
      tamano: 2458900,
      creado_en: new Date("2026-09-15T08:00:00Z")
    },
    {
      id: "doc_fund_2",
      nombre: "Manual de Convivencia Escolar y Normativa Interna MPPE.pdf",
      tipo: "application/pdf",
      categoria: "Normativa",
      ruta_archivo: "documentos/Manual_Convivencia_Escolar.pdf",
      tamano: 1856400,
      creado_en: new Date("2026-09-18T10:30:00Z")
    },
    {
      id: "doc_fund_3",
      nombre: "Acta Constitutiva y Registro del Consejo Educativo.pdf",
      tipo: "application/pdf",
      categoria: "Consejo Educativo",
      ruta_archivo: "documentos/Acta_Consejo_Educativo.pdf",
      tamano: 980200,
      creado_en: new Date("2026-10-02T14:15:00Z")
    },
    {
      id: "doc_fund_4",
      nombre: "Plan de Seguridad, Emergencia y Evacuación Institucional.pdf",
      tipo: "application/pdf",
      categoria: "Seguridad",
      ruta_archivo: "documentos/Plan_Evacuacion_Institucional.pdf",
      tamano: 1420500,
      creado_en: new Date("2026-10-10T11:00:00Z")
    }
  ],

  docentes: [
    // --- INICIAL ---
    {
      id: "DOC-INI-01",
      ci: "V-16.782.341",
      nombre: "Carmen Elena",
      apellido: "Rodríguez Velásquez",
      email: "carmen.rodriguez@chile.edu.ve",
      telefono: "0414-8765432",
      direccion: "Calle Principal El Espinal, Casa #14",
      nivel: "Inicial",
      grado_asignado: "Maternal",
      seccion_asignada: "A",
      especialidad: "Educación Preescolar",
      es_especialista: 0,
      estatus: "Activo",
      materias: ["Formación Personal y Social", "Relación con el Ambiente"]
    },
    {
      id: "DOC-INI-02",
      ci: "V-18.432.109",
      nombre: "Laura Sofía",
      apellido: "Navarro Hernández",
      email: "laura.navarro@chile.edu.ve",
      telefono: "0424-9123456",
      direccion: "Sector Las Barrancas, Calle Bolívar #22",
      nivel: "Inicial",
      grado_asignado: "3er Grupo",
      seccion_asignada: "A",
      especialidad: "Educación Inicial",
      es_especialista: 0,
      estatus: "Activo",
      materias: ["Comunicación y Expresión", "Educación Física y Recreación Motriz"]
    },

    // --- PRIMARIA ---
    {
      id: "DOC-PRI-01",
      ci: "V-14.852.147",
      nombre: "María Eugenia",
      apellido: "Gómez Salazar",
      email: "maria.gomez@chile.edu.ve",
      telefono: "0414-1234567",
      direccion: "La Asunción, Calle El Sol #12",
      nivel: "Primaria",
      grado_asignado: "1ero",
      seccion_asignada: "A",
      especialidad: "Educación Integral",
      es_especialista: 0,
      estatus: "Activo",
      materias: ["Castellano", "Matemáticas", "Ciencias Naturales", "Ciencias Sociales"]
    },
    {
      id: "DOC-PRI-02",
      ci: "V-15.632.418",
      nombre: "Patricia Valentina",
      apellido: "Ramos Brito",
      email: "patricia.ramos@chile.edu.ve",
      telefono: "0424-2345678",
      direccion: "San Juan Bautista, Calle Comercio #5",
      nivel: "Primaria",
      grado_asignado: "1ero",
      seccion_asignada: "B",
      especialidad: "Educación Integral",
      es_especialista: 0,
      estatus: "Activo",
      materias: ["Castellano", "Matemáticas", "Ciencias Naturales", "Ciencias Sociales"]
    },
    {
      id: "DOC-PRI-03",
      ci: "V-17.124.985",
      nombre: "Ana Gabriela",
      apellido: "Castillo Marcano",
      email: "ana.castillo@chile.edu.ve",
      telefono: "0416-3456789",
      direccion: "El Espinal, Sector La Plaza #8",
      nivel: "Primaria",
      grado_asignado: "2do",
      seccion_asignada: "A",
      especialidad: "Educación Integral",
      es_especialista: 0,
      estatus: "Activo",
      materias: ["Castellano", "Matemáticas", "Ciencias Naturales", "Ciencias Sociales"]
    },
    {
      id: "DOC-PRI-04",
      ci: "V-13.987.412",
      nombre: "Carlos Eduardo",
      apellido: "Méndez Fuentes",
      email: "carlos.mendez@chile.edu.ve",
      telefono: "0412-4567890",
      direccion: "Villa Rosa, Manzana D Casa #15",
      nivel: "Primaria",
      grado_asignado: "2do",
      seccion_asignada: "B",
      especialidad: "Educación Integral",
      es_especialista: 0,
      estatus: "Activo",
      materias: ["Castellano", "Matemáticas", "Ciencias Naturales", "Ciencias Sociales"]
    },
    {
      id: "DOC-PRI-05",
      ci: "V-18.254.789",
      nombre: "Daniela Alejandra",
      apellido: "Rivas Moreno",
      email: "daniela.rivas@chile.edu.ve",
      telefono: "0414-5678901",
      direccion: "Cotoperiz, Urbanización Los Pinos #4",
      nivel: "Primaria",
      grado_asignado: "3ero",
      seccion_asignada: "A",
      especialidad: "Educación Integral",
      es_especialista: 0,
      estatus: "Activo",
      materias: ["Castellano", "Matemáticas", "Ciencias Naturales", "Ciencias Sociales"]
    },
    {
      id: "DOC-PRI-06",
      ci: "V-12.874.125",
      nombre: "José Gregorio",
      apellido: "Hernández Gil",
      email: "jose.hernandez@chile.edu.ve",
      telefono: "0424-6789012",
      direccion: "Las Barrancas, Calle La Marina #10",
      nivel: "Primaria",
      grado_asignado: "3ero",
      seccion_asignada: "B",
      especialidad: "Educación Integral",
      es_especialista: 0,
      estatus: "Activo",
      materias: ["Castellano", "Matemáticas", "Ciencias Naturales", "Ciencias Sociales"]
    },
    {
      id: "DOC-PRI-07",
      ci: "V-16.321.458",
      nombre: "Beatriz Coromoto",
      apellido: "Díaz López",
      email: "beatriz.diaz@chile.edu.ve",
      telefono: "0416-7890123",
      direccion: "El Valle del Espíritu Santo #33",
      nivel: "Primaria",
      grado_asignado: "4to",
      seccion_asignada: "A",
      especialidad: "Educación Integral",
      es_especialista: 0,
      estatus: "Activo",
      materias: ["Castellano", "Matemáticas", "Ciencias Naturales", "Ciencias Sociales"]
    },
    {
      id: "DOC-PRI-08",
      ci: "V-14.258.963",
      nombre: "Roberto Antonio",
      apellido: "Silva Marín",
      email: "roberto.silva@chile.edu.ve",
      telefono: "0412-8901234",
      direccion: "Porlamar, Av. 4 de Mayo Res. El Parque",
      nivel: "Primaria",
      grado_asignado: "4to",
      seccion_asignada: "B",
      especialidad: "Educación Integral",
      es_especialista: 0,
      estatus: "Activo",
      materias: ["Castellano", "Matemáticas", "Ciencias Naturales", "Ciencias Sociales"]
    },
    {
      id: "DOC-PRI-09",
      ci: "V-17.896.321",
      nombre: "Lucía Isabel",
      apellido: "Quintero Suárez",
      email: "lucia.quintero@chile.edu.ve",
      telefono: "0414-9012345",
      direccion: "El Espinal, Sector Banco Obrero Casa #7",
      nivel: "Primaria",
      grado_asignado: "5to",
      seccion_asignada: "A",
      especialidad: "Educación Integral",
      es_especialista: 0,
      estatus: "Activo",
      materias: ["Castellano", "Matemáticas", "Ciencias Naturales", "Ciencias Sociales"]
    },
    {
      id: "DOC-PRI-10",
      ci: "V-15.412.369",
      nombre: "Marcos Aurelio",
      apellido: "Peña Briceño",
      email: "marcos.pena@chile.edu.ve",
      telefono: "0424-0123456",
      direccion: "San Juan Bautista, Calle Sucre #19",
      nivel: "Primaria",
      grado_asignado: "5to",
      seccion_asignada: "B",
      especialidad: "Educación Integral",
      es_especialista: 0,
      estatus: "Activo",
      materias: ["Castellano", "Matemáticas", "Ciencias Naturales", "Ciencias Sociales"]
    },
    {
      id: "DOC-PRI-11",
      ci: "V-16.985.214",
      nombre: "Elena Teresa",
      apellido: "Morales Campos",
      email: "elena.morales@chile.edu.ve",
      telefono: "0416-1234560",
      direccion: "La Guardia, Sector El Palito",
      nivel: "Primaria",
      grado_asignado: "6to",
      seccion_asignada: "A",
      especialidad: "Educación Integral",
      es_especialista: 0,
      estatus: "Activo",
      materias: ["Castellano", "Matemáticas", "Ciencias Naturales", "Ciencias Sociales"]
    },
    {
      id: "DOC-PRI-12",
      ci: "V-13.654.789",
      nombre: "Fernando Javier",
      apellido: "Torres Alfonzo",
      email: "fernando.torres@chile.edu.ve",
      telefono: "0412-2345671",
      direccion: "El Espinal Centro, Calle Nueva #3",
      nivel: "Primaria",
      grado_asignado: "6to",
      seccion_asignada: "B",
      especialidad: "Educación Integral",
      es_especialista: 0,
      estatus: "Activo",
      materias: ["Castellano", "Matemáticas", "Ciencias Naturales", "Ciencias Sociales"]
    },

    // --- SECUNDARIA ---
    {
      id: "DOC-SEC-01",
      ci: "V-11.874.521",
      nombre: "Ricardo Andrés",
      apellido: "Velásquez Marval",
      email: "ricardo.velasquez@chile.edu.ve",
      telefono: "0414-3456782",
      direccion: "Porlamar, Urb. Costa Azul Edif. Coral",
      nivel: "Secundaria",
      grado_asignado: "5to Año",
      seccion_asignada: "A",
      especialidad: "Matemáticas y Física",
      es_especialista: 0,
      estatus: "Activo",
      materias: ["Matemáticas", "Física"]
    },
    {
      id: "DOC-SEC-02",
      ci: "V-14.325.698",
      nombre: "Verónica del Valle",
      apellido: "Salazar Guerra",
      email: "veronica.salazar@chile.edu.ve",
      telefono: "0424-4567893",
      direccion: "El Valle, Sector Toporo Casa #2",
      nivel: "Secundaria",
      grado_asignado: "4to Año",
      seccion_asignada: "A",
      especialidad: "Castellano y Literatura",
      es_especialista: 0,
      estatus: "Activo",
      materias: ["Castellano", "Orientación y Convivencia"]
    },
    {
      id: "DOC-SEC-03",
      ci: "V-15.987.123",
      nombre: "Luis Alberto",
      apellido: "Martínez Rivas",
      email: "luis.martinez@chile.edu.ve",
      telefono: "0416-5678904",
      direccion: "Pampatar, Calle Maneiro #8",
      nivel: "Secundaria",
      grado_asignado: "3er Año",
      seccion_asignada: "A",
      especialidad: "Biología y Química",
      es_especialista: 0,
      estatus: "Activo",
      materias: ["Biología", "Química", "Ciencias Naturales"]
    },
    {
      id: "DOC-SEC-04",
      ci: "V-16.541.236",
      nombre: "Sandra Carolina",
      apellido: "Marcano Cedeño",
      email: "sandra.marcano@chile.edu.ve",
      telefono: "0412-6789015",
      direccion: "El Espinal, Sector Los Cocos #18",
      nivel: "Secundaria",
      grado_asignado: "2do Año",
      seccion_asignada: "A",
      especialidad: "Ciencias Sociales y GHC",
      es_especialista: 0,
      estatus: "Activo",
      materias: ["Geografía, Historia y Ciudadanía", "Formación para la Soberanía"]
    },
    {
      id: "DOC-SEC-05",
      ci: "V-18.741.258",
      nombre: "Diego Alejandro",
      apellido: "Vargas Millán",
      email: "diego.vargas@chile.edu.ve",
      telefono: "0414-7890126",
      direccion: "San Juan Bautista, Calle El Pozo",
      nivel: "Secundaria",
      grado_asignado: "1er Año",
      seccion_asignada: "A",
      especialidad: "Inglés y Lenguas Extranjeras",
      es_especialista: 0,
      estatus: "Activo",
      materias: ["Inglés y Otras Lenguas"]
    },
    {
      id: "DOC-SEC-06",
      ci: "V-13.258.741",
      nombre: "Héctor Ramón",
      apellido: "Romero Patiño",
      email: "hector.romero@chile.edu.ve",
      telefono: "0424-8901237",
      direccion: "Los Robles, Calle Principal #40",
      nivel: "Secundaria",
      grado_asignado: "5to Año",
      seccion_asignada: "B",
      especialidad: "Educación Física y Deporte",
      es_especialista: 0,
      estatus: "Activo",
      materias: ["Educación Física"]
    },

    // --- AULA ESPECIAL ---
    {
      id: "DOC-ESP-01",
      ci: "V-15.123.456",
      nombre: "Yelitza Josefina",
      apellido: "Marín Fermín",
      email: "yelitza.marin@chile.edu.ve",
      telefono: "0414-9012348",
      direccion: "El Espinal, Sector Sabana Grande #11",
      nivel: "Primaria",
      grado_asignado: "Aula Especial",
      seccion_asignada: "U",
      especialidad: "Dificultades del Aprendizaje",
      es_especialista: 1,
      estatus: "Activo",
      materias: ["Atención Psicopedagógica Integral", "Desarrollo de Habilidades"]
    }
  ],

  representantes: [
    {
      id: "REP-001",
      ci: "V-13.456.789",
      primer_nombre: "Juan",
      segundo_nombre: "Carlos",
      primer_apellido: "Aguilera",
      segundo_apellido: "Morales",
      nombre_completo: "Juan Carlos Aguilera Morales",
      parentesco: "Padre",
      telefono: "0424-8521479",
      telefono_habitacion: "0295-2874125",
      email: "juan.aguilera@gmail.com",
      direccion: "El Espinal, Calle Miranda Casa #45, Municipio Díaz",
      ocupacion: "Ingeniero Civil",
      lugar_trabajo: "Constructora Insular, Porlamar",
      observaciones: "Representante principal, acude puntualmente a citaciones."
    },
    {
      id: "REP-002",
      ci: "V-15.789.123",
      primer_nombre: "María",
      segundo_nombre: "Esperanza",
      primer_apellido: "González",
      segundo_apellido: "Prieto",
      nombre_completo: "María Esperanza González Prieto",
      parentesco: "Madre",
      telefono: "0414-7412589",
      telefono_habitacion: "0295-2871122",
      email: "maria.gonzalez@outlook.com",
      direccion: "Las Barrancas, Sector El Muelle Casa #12",
      ocupacion: "Licenciada en Enfermería",
      lugar_trabajo: "Hospital Luis Ortega, Porlamar",
      observaciones: "Disponible para actividades del Consejo Educativo."
    },
    {
      id: "REP-003",
      ci: "V-16.987.456",
      primer_nombre: "José",
      segundo_nombre: "Gregorio",
      primer_apellido: "Martínez",
      segundo_apellido: "Cedeño",
      nombre_completo: "José Gregorio Martínez Cedeño",
      parentesco: "Padre",
      telefono: "0416-9632587",
      telefono_habitacion: "0295-2873344",
      email: "jose.martinez.ced@gmail.com",
      direccion: "San Juan Bautista, Calle Comercio Casa #78",
      ocupacion: "Comerciante Independiente",
      lugar_trabajo: "Mercado Municipal de Conejeros",
      observaciones: "Solvente en colaboración escolar."
    },
    {
      id: "REP-004",
      ci: "V-17.456.123",
      primer_nombre: "Carmen",
      segundo_nombre: "Rosa",
      primer_apellido: "Díaz",
      segundo_apellido: "Vásquez",
      nombre_completo: "Carmen Rosa Díaz Vásquez",
      parentesco: "Madre",
      telefono: "0412-1478523",
      telefono_habitacion: "0295-2875566",
      email: "carmen.diaz.vasquez@gmail.com",
      direccion: "El Valle, Sector El Convento Casa #19",
      ocupacion: "Contadora Pública",
      lugar_trabajo: "Consultores Financieros Margarita",
      observaciones: "Representante comprometida con el rendimiento escolar."
    },
    {
      id: "REP-005",
      ci: "V-14.123.789",
      primer_nombre: "Pedro",
      segundo_nombre: "Antonio",
      primer_apellido: "Navarro",
      segundo_apellido: "Salazar",
      nombre_completo: "Pedro Antonio Navarro Salazar",
      parentesco: "Padre",
      telefono: "0424-2589631",
      telefono_habitacion: "0295-2877788",
      email: "pedro.navarro.sal@hotmail.com",
      direccion: "Cotoperiz, Urb. Los Mangos Calle 3 #15",
      ocupacion: "Mecánico Automotriz",
      lugar_trabajo: "Taller Mecánico Central",
      observaciones: "Contacto secundario con la madre."
    },
    {
      id: "REP-006",
      ci: "V-18.369.852",
      primer_nombre: "Ana",
      segundo_nombre: "Carolina",
      primer_apellido: "Rondón",
      segundo_apellido: "Marcano",
      nombre_completo: "Ana Carolina Rondón Marcano",
      parentesco: "Madre",
      telefono: "0414-3698521",
      telefono_habitacion: "0295-2879900",
      email: "ana.rondon@gmail.com",
      direccion: "El Espinal, Sector Las Casitas #30",
      ocupacion: "Docente de Primaria",
      lugar_trabajo: "U.E. Bolivariana El Valle",
      observaciones: "Mantiene comunicación constante vía WhatsApp."
    },
    {
      id: "REP-007",
      ci: "V-15.258.963",
      primer_nombre: "Luis",
      segundo_nombre: "Manuel",
      primer_apellido: "Castillo",
      segundo_apellido: "Padrón",
      nombre_completo: "Luis Manuel Castillo Padrón",
      parentesco: "Padre",
      telefono: "0416-8523691",
      telefono_habitacion: "0295-2872233",
      email: "luis.castillo.padron@yahoo.es",
      direccion: "La Asunción, Calle Independencia #54",
      ocupacion: "Abogado",
      lugar_trabajo: "Bufete Jurídico Nueva Esparta",
      observaciones: "Representante legal formal."
    },
    {
      id: "REP-008",
      ci: "V-19.147.258",
      primer_nombre: "Gabriela",
      segundo_nombre: "Alejandra",
      primer_apellido: "Rivas",
      segundo_apellido: "Brito",
      nombre_completo: "Gabriela Alejandra Rivas Brito",
      parentesco: "Tía",
      telefono: "0412-7418529",
      telefono_habitacion: "0295-2874455",
      email: "gaby.rivas.brito@gmail.com",
      direccion: "El Espinal Centro, Calle Sucre #67",
      ocupacion: "Diseñadora Gráfica",
      lugar_trabajo: "Agencia Creativa Insular",
      observaciones: "Posee poder notariado de tutela para trámites escolares."
    },
    {
      id: "REP-009",
      ci: "V-12.987.654",
      primer_nombre: "Héctor",
      segundo_nombre: "José",
      primer_apellido: "Morales",
      segundo_apellido: "Peña",
      nombre_completo: "Héctor José Morales Peña",
      parentesco: "Abuelo",
      telefono: "0424-9517532",
      telefono_habitacion: "0295-2876677",
      email: "hector.morales.p@gmail.com",
      direccion: "San Juan Bautista, Sector Los Bagres #14",
      ocupacion: "Jubilado / Pescador Artesanal",
      lugar_trabajo: "Jubilado",
      observaciones: "Tutor responsable con autorización materna."
    },
    {
      id: "REP-010",
      ci: "V-17.852.369",
      primer_nombre: "Patricia",
      segundo_nombre: "Elena",
      primer_apellido: "Quintero",
      segundo_apellido: "Torres",
      nombre_completo: "Patricia Elena Quintero Torres",
      parentesco: "Madre",
      telefono: "0414-1593574",
      telefono_habitacion: "0295-2878899",
      email: "patricia.quintero@gmail.com",
      direccion: "El Espinal, Urb. Guayacán Norte #28",
      ocupacion: "Administradora de Empresas",
      lugar_trabajo: "Hotel Bella Vista, Porlamar",
      observaciones: "Activa y puntual en todas las asambleas."
    }
  ]
};

// Generador de estudiantes organizados
const NOMBRES_MASC = [
  "Alejandro", "Gabriel", "Mateo", "Santiago", "Sebastián", "Diego", "Samuel",
  "Daniel", "Nicolás", "Leonardo", "David", "Lucas", "Emiliano", "Joaquín", "Carlos"
];

const NOMBRES_FEM = [
  "Sofía", "Valentina", "Camila", "Isabella", "Lucía", "Victoria", "Mariana",
  "Daniela", "Gabriela", "Natalia", "Paula", "Elena", "Valeria", "Andrea", "Samantha"
];

const APELLIDOS = [
  "Aguilera", "González", "Martínez", "Rodríguez", "Pérez", "Hernández", "Díaz",
  "Salazar", "Castillo", "Ramos", "Navarro", "Gómez", "Rivas", "Morales", "Peña",
  "Quintero", "Méndez", "Brito", "Silva", "Flores", "Cedeño", "Torres", "Vásquez"
];

const GRADOS_CONFIG = [
  // Inicial (6)
  { nivel: 'Inicial', grado: 'Maternal', seccion: 'A', edad: 3, nacYear: 2023 },
  { nivel: 'Inicial', grado: '1er Grupo', seccion: 'A', edad: 4, nacYear: 2022 },
  { nivel: 'Inicial', grado: '2do Grupo', seccion: 'A', edad: 5, nacYear: 2021 },
  { nivel: 'Inicial', grado: '2do Grupo', seccion: 'B', edad: 5, nacYear: 2021 },
  { nivel: 'Inicial', grado: '3er Grupo', seccion: 'A', edad: 6, nacYear: 2020 },
  { nivel: 'Inicial', grado: '3er Grupo', seccion: 'B', edad: 6, nacYear: 2020 },

  // Primaria (24)
  { nivel: 'Primaria', grado: '1ero', seccion: 'A', edad: 6, nacYear: 2020 },
  { nivel: 'Primaria', grado: '1ero', seccion: 'A', edad: 7, nacYear: 2019 },
  { nivel: 'Primaria', grado: '1ero', seccion: 'B', edad: 6, nacYear: 2020 },
  { nivel: 'Primaria', grado: '1ero', seccion: 'B', edad: 7, nacYear: 2019 },

  { nivel: 'Primaria', grado: '2do', seccion: 'A', edad: 7, nacYear: 2019 },
  { nivel: 'Primaria', grado: '2do', seccion: 'A', edad: 8, nacYear: 2018 },
  { nivel: 'Primaria', grado: '2do', seccion: 'B', edad: 8, nacYear: 2018 },
  { nivel: 'Primaria', grado: '2do', seccion: 'B', edad: 8, nacYear: 2018 },

  { nivel: 'Primaria', grado: '3ero', seccion: 'A', edad: 8, nacYear: 2018 },
  { nivel: 'Primaria', grado: '3ero', seccion: 'A', edad: 9, nacYear: 2017 },
  { nivel: 'Primaria', grado: '3ero', seccion: 'B', edad: 9, nacYear: 2017 },
  { nivel: 'Primaria', grado: '3ero', seccion: 'B', edad: 9, nacYear: 2017 },

  { nivel: 'Primaria', grado: '4to', seccion: 'A', edad: 9, nacYear: 2017 },
  { nivel: 'Primaria', grado: '4to', seccion: 'A', edad: 10, nacYear: 2016 },
  { nivel: 'Primaria', grado: '4to', seccion: 'B', edad: 10, nacYear: 2016 },
  { nivel: 'Primaria', grado: '4to', seccion: 'B', edad: 10, nacYear: 2016 },

  { nivel: 'Primaria', grado: '5to', seccion: 'A', edad: 10, nacYear: 2016 },
  { nivel: 'Primaria', grado: '5to', seccion: 'A', edad: 11, nacYear: 2015 },
  { nivel: 'Primaria', grado: '5to', seccion: 'B', edad: 11, nacYear: 2015 },
  { nivel: 'Primaria', grado: '5to', seccion: 'B', edad: 11, nacYear: 2015 },

  { nivel: 'Primaria', grado: '6to', seccion: 'A', edad: 11, nacYear: 2015 },
  { nivel: 'Primaria', grado: '6to', seccion: 'A', edad: 12, nacYear: 2014 },
  { nivel: 'Primaria', grado: '6to', seccion: 'B', edad: 12, nacYear: 2014 },
  { nivel: 'Primaria', grado: '6to', seccion: 'B', edad: 12, nacYear: 2014 },

  // Secundaria (18)
  { nivel: 'Secundaria', grado: '1er Año', seccion: 'A', edad: 12, nacYear: 2014 },
  { nivel: 'Secundaria', grado: '1er Año', seccion: 'A', edad: 13, nacYear: 2013 },
  { nivel: 'Secundaria', grado: '1er Año', seccion: 'B', edad: 13, nacYear: 2013 },
  { nivel: 'Secundaria', grado: '1er Año', seccion: 'B', edad: 13, nacYear: 2013 },

  { nivel: 'Secundaria', grado: '2do Año', seccion: 'A', edad: 13, nacYear: 2013 },
  { nivel: 'Secundaria', grado: '2do Año', seccion: 'A', edad: 14, nacYear: 2012 },
  { nivel: 'Secundaria', grado: '2do Año', seccion: 'B', edad: 14, nacYear: 2012 },

  { nivel: 'Secundaria', grado: '3er Año', seccion: 'A', edad: 14, nacYear: 2012 },
  { nivel: 'Secundaria', grado: '3er Año', seccion: 'A', edad: 15, nacYear: 2011 },
  { nivel: 'Secundaria', grado: '3er Año', seccion: 'B', edad: 15, nacYear: 2011 },

  { nivel: 'Secundaria', grado: '4to Año', seccion: 'A', edad: 15, nacYear: 2011 },
  { nivel: 'Secundaria', grado: '4to Año', seccion: 'A', edad: 16, nacYear: 2010 },
  { nivel: 'Secundaria', grado: '4to Año', seccion: 'B', edad: 16, nacYear: 2010 },
  { nivel: 'Secundaria', grado: '4to Año', seccion: 'B', edad: 16, nacYear: 2010 },

  { nivel: 'Secundaria', grado: '5to Año', seccion: 'A', edad: 16, nacYear: 2010 },
  { nivel: 'Secundaria', grado: '5to Año', seccion: 'A', edad: 17, nacYear: 2009 },
  { nivel: 'Secundaria', grado: '5to Año', seccion: 'B', edad: 17, nacYear: 2009 },
  { nivel: 'Secundaria', grado: '5to Año', seccion: 'B', edad: 17, nacYear: 2009 }
];

async function run() {
  console.log("Iniciando generación de datos ficticios...");
  const isConnected = await mysqlDb.init();
  if (!isConnected) {
    console.error("No se pudo conectar a MySQL.");
    process.exit(1);
  }

  // 1. Limpieza de tablas dependientes manteniendo pensum_materias y usuarios
  console.log("Limpiando tablas para carga limpia de pruebas...");
  await mysqlDb.pool.query("DELETE FROM asignaciones_docentes");
  await mysqlDb.pool.query("DELETE FROM evaluaciones_individuales");
  await mysqlDb.pool.query("DELETE FROM registro_notas_seccion");
  await mysqlDb.pool.query("DELETE FROM estudiantes");
  await mysqlDb.pool.query("DELETE FROM representantes");
  await mysqlDb.pool.query("DELETE FROM docentes");
  await mysqlDb.pool.query("DELETE FROM documentos_institucionales");

  // 2. Insertar Configuración Institucional
  console.log("Actualizando Información del Complejo...");
  const cfg = SEED_DATA.configuracion;
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
    cfg.nombre_colegio,
    cfg.codigo_dea,
    cfg.periodo,
    cfg.direccion,
    cfg.telefono,
    cfg.email,
    cfg.director_nombre,
    cfg.director_ci,
    JSON.stringify(cfg.lapsos_config)
  ]);

  // 3. Insertar Documentos Fundamentales
  console.log("Registrando Documentos Fundamentales...");
  for (const doc of SEED_DATA.documentosFundamentales) {
    await mysqlDb.pool.query(`
      INSERT INTO documentos_institucionales (id, nombre, tipo, categoria, ruta_archivo, tamano, creado_en)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [doc.id, doc.nombre, doc.tipo, doc.categoria, doc.ruta_archivo, doc.tamano, doc.creado_en]);
  }

  // 4. Insertar Representantes
  console.log("Registrando Representantes...");
  for (const r of SEED_DATA.representantes) {
    await mysqlDb.pool.query(`
      INSERT INTO representantes (
        id, ci, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
        nombre_completo, parentesco, telefono, telefono_habitacion, email, direccion,
        ocupacion, lugar_trabajo, foto_url, observaciones
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      r.id, r.ci, r.primer_nombre, r.segundo_nombre, r.primer_apellido, r.segundo_apellido,
      r.nombre_completo, r.parentesco, r.telefono, r.telefono_habitacion, r.email, r.direccion,
      r.ocupacion, r.lugar_trabajo, r.foto_url || '', r.observaciones
    ]);
  }

  // 5. Insertar Docentes
  console.log("Registrando Docentes y Profesores...");
  for (const d of SEED_DATA.docentes) {
    await mysqlDb.pool.query(`
      INSERT INTO docentes (
        id, usuario_id, ci, nombre, apellido, email, telefono, direccion,
        nivel, grado_asignado, seccion_asignada, especialidad, es_especialista,
        estatus, materias_json
      ) VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      d.id, d.ci, d.nombre, d.apellido, d.email, d.telefono, d.direccion,
      d.nivel, d.grado_asignado, d.seccion_asignada, d.especialidad, d.es_especialista,
      d.estatus, JSON.stringify(d.materias)
    ]);
  }

  // 6. Generar Estudiantes
  console.log("Generando y Registrando Estudiantes...");
  const mockStudents = [];
  const statusOptions = ["Inscrito", "Inscrito", "Inscrito", "Inscrito", "Pendiente", "Retirado"];
  const periodos = ["2026-2027", "2026-2027", "2026-2027", "2025-2026", "2024-2025"];
  const gruposSangre = ["O+", "A+", "B+", "AB+", "O-", "A-"];

  for (let i = 0; i < GRADOS_CONFIG.length; i++) {
    const gc = GRADOS_CONFIG[i];
    const isMasc = i % 2 === 0;
    const primerNombre = isMasc 
      ? NOMBRES_MASC[i % NOMBRES_MASC.length] 
      : NOMBRES_FEM[i % NOMBRES_FEM.length];
    const segundoNombre = isMasc
      ? NOMBRES_MASC[(i + 3) % NOMBRES_MASC.length]
      : NOMBRES_FEM[(i + 3) % NOMBRES_FEM.length];
    const primerApellido = APELLIDOS[i % APELLIDOS.length];
    const segundoApellido = APELLIDOS[(i + 4) % APELLIDOS.length];
    const nombreCompleto = `${primerNombre} ${segundoNombre} ${primerApellido} ${segundoApellido}`;

    const estId = `EST-2026-${(1001 + i).toString()}`;
    const idEscolar = `2${String(gc.nacYear).slice(2)}${String(30000000 + i * 147)}`;
    const ci = gc.edad >= 10 ? `V-${32000000 + i * 154}` : idEscolar;

    const rep = SEED_DATA.representantes[i % SEED_DATA.representantes.length];
    const estatus = (i === 5 || i === 18) ? "Pendiente" : (i === 12 ? "Retirado" : "Inscrito");
    
    // Período escolar distribuido
    let periodoEscolar = "2026-2027";
    if (i >= 38) periodoEscolar = "2025-2026";
    if (i === 46 || i === 47) periodoEscolar = "2024-2025";

    const mesNac = ((i % 12) + 1).toString().padStart(2, '0');
    const diaNac = (((i * 3) % 27) + 1).toString().padStart(2, '0');
    const fechaNac = `${gc.nacYear}-${mesNac}-${diaNac}`;

    const filesInsc = [
      { id: "birthCertificate", name: "Partida de Nacimiento.pdf", path: `media://estudiantes/${estId}/partida_nacimiento.pdf` },
      { id: "studentCI", name: "Cédula de Identidad del Alumno.pdf", path: `media://estudiantes/${estId}/cedula_alumno.pdf` },
      { id: "repCI", name: "Cédula de Identidad del Representante.pdf", path: `media://estudiantes/${estId}/cedula_representante.pdf` },
      { id: "medicalCertificate", name: "Certificado de Salud Escolar y Vacunas.pdf", path: `media://estudiantes/${estId}/certificado_medico.pdf` },
      { id: "addressProof", name: "Constancia de Residencia Díaz.pdf", path: `media://estudiantes/${estId}/constancia_residencia.pdf` }
    ];

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
      edad: gc.edad,
      genero: isMasc ? 'Masculino' : 'Femenino',
      lugar_nacimiento: 'Porlamar',
      entidad_nacimiento: 'Nueva Esparta',
      pais_nacimiento: 'Venezuela',
      direccion: rep.direccion,
      municipio: 'Díaz',
      parroquia: 'Zabala',
      sector: 'El Espinal',
      email: `${primerNombre.toLowerCase()}.${primerApellido.toLowerCase()}@estudiante.edu.ve`,
      nivel: gc.nivel,
      grado: gc.grado,
      seccion: gc.seccion,
      periodo_escolar: periodoEscolar,
      estatus: estatus,
      fecha_ingreso: `${periodoEscolar.split('-')[0]}-09-16`,
      docente_guia: 'Prof. Carmen Elena Rodríguez',
      colegio_procedencia: 'U.E. República de Chile',
      codigo_dea_procedencia: 'OD01461703',
      repite_grado: 'No',
      grupo_sanguineo: gruposSangre[i % gruposSangre.length],
      estatura: (1.05 + (gc.edad * 0.045)).toFixed(2),
      peso: (18 + (gc.edad * 2.8)).toFixed(1),
      talla_camisa: gc.edad <= 6 ? '4' : gc.edad <= 10 ? '8' : gc.edad <= 13 ? '12' : '16',
      talla_pantalon: gc.edad <= 6 ? '4' : gc.edad <= 10 ? '8' : gc.edad <= 13 ? '12' : '16',
      talla_calzado: (26 + Math.min(gc.edad * 1.2, 16)).toFixed(0),
      alergias: i % 4 === 0 ? 'Alergia a la penicilina' : 'Ninguna conocida',
      condicion_medica: i % 8 === 0 ? 'Asma bronquial leve controlada' : 'Apto para actividades físicas regulares',
      representante_id: rep.id,
      rep_nombre: rep.nombre_completo,
      rep_ci: rep.ci,
      rep_telefono: rep.telefono,
      rep_parentesco: rep.parentesco,
      madre_nombre: `${NOMBRES_FEM[(i+1)%NOMBRES_FEM.length]} ${APELLIDOS[(i+1)%APELLIDOS.length]}`,
      madre_ci: `V-${16000000 + i * 231}`,
      madre_telefono: '0414-7891234',
      padre_nombre: `${NOMBRES_MASC[(i+2)%NOMBRES_MASC.length]} ${APELLIDOS[(i+2)%APELLIDOS.length]}`,
      padre_ci: `V-${14000000 + i * 312}`,
      padre_telefono: '0424-6549871',
      obs_personal: 'Estudiante participativo y respetuoso de las normas escolares.',
      obs_familiar: 'Familia colaboradora y comprometida con el proceso de aprendizaje.',
      obs_salud: 'Constancia médica actualizada al día.',
      observaciones: 'Promovido con rendimiento académico satisfactorio.',
      foto_estudiante: null,
      foto_representante: null,
      archivos_inscripcion: JSON.stringify(filesInsc),
      archivos_traslado: JSON.stringify([])
    };

    await mysqlDb.pool.query(`
      INSERT INTO estudiantes (
        id, ci, id_escolar, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
        nombre_completo, fecha_nacimiento, edad, genero, lugar_nacimiento, entidad_nacimiento,
        pais_nacimiento, direccion, municipio, parroquia, sector, email,
        nivel, grado, seccion, periodo_escolar, estatus, fecha_ingreso, docente_guia,
        colegio_procedencia, codigo_dea_procedencia, repite_grado, grupo_sanguineo,
        estatura, peso, talla_camisa, talla_pantalon, talla_calzado, alergias, condicion_medica,
        representante_id, rep_nombre, rep_ci, rep_telefono, rep_parentesco,
        madre_nombre, madre_ci, madre_telefono, padre_nombre, padre_ci, padre_telefono,
        obs_personal, obs_familiar, obs_salud, observaciones, foto_estudiante, foto_representante,
        archivos_inscripcion, archivos_traslado
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, Object.values(studentRow));

    mockStudents.push(studentRow);
  }

  // 7. Clonar Pensum para 2026-2027 si aún no está
  console.log("Verificando Pensum para 2026-2027...");
  const [pensumDest] = await mysqlDb.pool.query("SELECT COUNT(*) as c FROM pensum_materias WHERE periodo = '2026-2027'");
  if (pensumDest[0].c === 0) {
    console.log("Clonando pensum para el período activo 2026-2027...");
    await mysqlDb.clonarPensumPeriodo('2025-2026', '2026-2027');
  }

  // 8. Crear Asignaciones Docentes
  console.log("Creando Asignaciones Docentes a Secciones y Materias...");
  const [materiasPensum] = await mysqlDb.pool.query("SELECT id, nombre, grado, nivel, periodo FROM pensum_materias WHERE periodo = '2026-2027'");
  for (const doc of SEED_DATA.docentes) {
    if (doc.materias && doc.materias.length > 0) {
      for (const matNombre of doc.materias) {
        const mat = materiasPensum.find(m => m.grado === doc.grado_asignado && m.nombre.toLowerCase().includes(matNombre.toLowerCase()));
        if (mat) {
          const asigId = `asig_${doc.id}_${mat.id}_${doc.seccion_asignada}`;
          await mysqlDb.pool.query(`
            INSERT INTO asignaciones_docentes (id, docente_id, materia_id, materia_nombre, grado, seccion, periodo)
            VALUES (?, ?, ?, ?, ?, ?, '2026-2027')
            ON DUPLICATE KEY UPDATE materia_nombre = VALUES(materia_nombre)
          `, [asigId, doc.id, mat.id, mat.nombre, doc.grado_asignado, doc.seccion_asignada]);
        }
      }
    }
  }

  // 9. Crear Registros de Notas para Secciones Clave
  console.log("Generando Calificaciones y Planificaciones de Notas...");
  const sampleSections = [
    { seccionId: "1ero-A-Primaria", grado: "1ero", seccion: "A", nivel: "Primaria", materia: "Aula Regular" },
    { seccionId: "5to-A-Primaria", grado: "5to", seccion: "A", nivel: "Primaria", materia: "Aula Regular" },
    { seccionId: "5to Año-A-Secundaria", grado: "5to Año", seccion: "A", nivel: "Secundaria", materia: "Biología" },
    { seccionId: "5to Año-A-Secundaria", grado: "5to Año", seccion: "A", nivel: "Secundaria", materia: "Matemáticas" },
    { seccionId: "3er Año-A-Secundaria", grado: "3er Año", seccion: "A", nivel: "Secundaria", materia: "Química" },
    { seccionId: "1er Año-A-Secundaria", grado: "1er Año", seccion: "A", nivel: "Secundaria", materia: "Castellano" }
  ];

  for (const s of sampleSections) {
    const regId = `${s.seccionId}_${s.materia}`;
    const planificacion = {
      "1": [
        { id: 101, peso: 25, nombre: "Taller Diagnóstico / Cuaderno" },
        { id: 102, peso: 25, nombre: "Prueba Escrita Parcial" },
        { id: 103, peso: 25, nombre: "Exposición / Defensa de Proyecto" },
        { id: 104, peso: 25, nombre: "Rasgos Personales y Asistencia" }
      ],
      "2": [
        { id: 201, peso: 25, nombre: "Investigación Bibliográfica" },
        { id: 202, peso: 25, nombre: "Prueba Objetiva de Lapso" },
        { id: 203, peso: 25, nombre: "Práctica / Laboratorio Experimental" },
        { id: 204, peso: 25, nombre: "Responsabilidad y Convivencia" }
      ],
      "3": [
        { id: 301, peso: 25, nombre: "Producción Escrita / Ensayo" },
        { id: 302, peso: 25, nombre: "Evaluación Final Integral" },
        { id: 303, peso: 25, nombre: "Feria de Ciencias y Saberes" },
        { id: 304, peso: 25, nombre: "Autoevaluación y Coevaluación" }
      ]
    };

    // Asignar notas a los estudiantes de esa sección
    const estsDeSeccion = mockStudents.filter(e => e.grado === s.grado && e.seccion === s.seccion);
    const notasObj = {};

    estsDeSeccion.forEach((e, idx) => {
      // Notas realistas entre 12 y 20
      const base = 14 + (idx % 6);
      notasObj[e.id] = {
        "101": String(Math.min(20, base)),
        "102": String(Math.min(20, base - 1)),
        "103": String(Math.min(20, base + 1)),
        "104": String(Math.min(20, base + 2)),
        "201": String(Math.min(20, base + 1)),
        "202": String(Math.min(20, base)),
        "203": String(Math.min(20, Math.max(12, base - 2))),
        "204": "19",
        "301": String(Math.min(20, base)),
        "302": String(Math.min(20, base + 2)),
        "303": String(Math.min(20, base + 1)),
        "304": "20"
      };
    });

    await mysqlDb.pool.query(`
      INSERT INTO registro_notas_seccion (id, seccion_id, materia, planificacion_json, notas_json)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        planificacion_json = VALUES(planificacion_json),
        notas_json = VALUES(notas_json)
    `, [regId, s.seccionId, s.materia, JSON.stringify(planificacion), JSON.stringify(notasObj)]);
  }

  // 10. Sincronización Espejo con LocalDB JSON
  console.log("Guardando respaldo espejo en LocalDB JSON...");
  const appData = process.env.APPDATA || path.join(process.env.HOME || '.', '.config');
  const targetJsonPath = path.join(appData, 'Electron', 'sistema_escolar_db.json');

  const fullDataJson = {
    configuracion: {
      ...SEED_DATA.configuracion,
      documentos_fundamentales: SEED_DATA.documentosFundamentales.map(d => ({
        id: d.id,
        nombre: d.nombre,
        ruta: d.ruta_archivo,
        fecha: d.creado_en.toISOString().split('T')[0]
      }))
    },
    docentes: SEED_DATA.docentes,
    representantes: SEED_DATA.representantes,
    estudiantes: mockStudents.map(e => ({
      ...e,
      schoolYear: e.periodo_escolar,
      periodo: e.periodo_escolar,
      firstName: e.primer_nombre,
      secondName: e.segundo_nombre,
      lastName: e.primer_apellido,
      secondLastName: e.segundo_apellido,
      repName: e.rep_nombre,
      repFirstName: e.rep_nombre.split(' ')[0],
      repLastName: e.rep_nombre.split(' ').slice(1).join(' '),
      repCI: e.rep_ci,
      repCedula: e.rep_ci,
      repPhone: e.rep_telefono,
      relationship: e.rep_parentesco,
      bloodType: e.grupo_sanguineo,
      height: e.estatura,
      weight: e.peso,
      shirtSize: e.talla_camisa,
      pantsSize: e.talla_pantalon,
      shoeSize: e.talla_calzado,
      birthDate: e.fecha_nacimiento,
      placeOfBirth: e.lugar_nacimiento,
      entity: e.entidad_nacimiento,
      country: e.pais_nacimiento,
      guideTeacher: e.docente_guia,
      previousSchool: e.colegio_procedencia,
      deaCode: e.codigo_dea_procedencia,
      repeatsYear: e.repite_grado,
      inscriptionFiles: JSON.parse(e.archivos_inscripcion)
    })),
    pensum: materiasPensum
  };

  try {
    const electronDir = path.dirname(targetJsonPath);
    if (!fs.existsSync(electronDir)) fs.mkdirSync(electronDir, { recursive: true });
    fs.writeFileSync(targetJsonPath, JSON.stringify(fullDataJson, null, 2), 'utf-8');
    console.log(`Espejo JSON actualizado exitosamente en: ${targetJsonPath}`);
  } catch (err) {
    console.warn("Aviso al guardar espejo JSON:", err.message);
  }

  console.log("¡Carga masiva de datos ficticios completada con éxito!");
  process.exit(0);
}

run().catch(err => {
  console.error("Error durante la carga de datos:", err);
  process.exit(1);
});
