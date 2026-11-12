// ============================================================================
//                     CONSTANTES ACADÉMICAS Y DEL PLANTEL
// ============================================================================

export const DEFAULT_SCHOOL_INFO = {
  name: 'U.E. "REPÚBLICA DE CHILE"',
  deaCode: "OD01461703",
  schoolYear: "2025-2026",
  location: "EL ESPINAL - MUNICIPIO DÍAZ",
};

export const ACADEMIC_LEVELS = ["Inicial", "Primaria", "Secundaria"] as const;
export type AcademicLevel = typeof ACADEMIC_LEVELS[number];

export const GRADES_BY_LEVEL: Record<AcademicLevel, string[]> = {
  Inicial: ["Maternal", "1er Grupo", "2do Grupo", "3er Grupo"],
  Primaria: ["1ero", "2do", "3ero", "4to", "5to", "6to"],
  Secundaria: ["1er Año", "2do Año", "3er Año", "4to Año", "5to Año"],
};

export const SECTIONS = ["A", "B", "C", "D", "U"] as const;

export const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

export interface RequiredDocument {
  id: string;
  label: string;
  category: "Estudiante" | "Salud" | "Representante" | "Académico";
}

export const REQUIRED_DOCUMENTS: RequiredDocument[] = [
  { id: "birthCertificate", label: "Partida de Nacimiento", category: "Estudiante" },
  { id: "studentCI", label: "Cédula del Estudiante", category: "Estudiante" },
  { id: "medicalCertificate", label: "Certificado Médico", category: "Salud" },
  { id: "vaccinationCard", label: "Carnet de Vacunación", category: "Salud" },
  { id: "repCI", label: "Cédula del Representante", category: "Representante" },
  { id: "addressProof", label: "Constancia de Domicilio", category: "Representante" },
  { id: "reportCard", label: "Boletín Año Anterior", category: "Académico" },
  { id: "conductLetter", label: "Constancia de Conducta", category: "Académico" },
];

export const AREAS_FORMACION = [
  "Lengua y Comunicación",
  "Lenguas Extranjeras",
  "Ciencias y Matemáticas",
  "Ciencias Naturales y Salud",
  "Ciencias Sociales e Historia",
  "Arte y Patrimonio",
  "Educación Física y Deporte",
  "Orientación y Convivencia",
  "Producción y Cultura",
  "Desarrollo Personal",
  "Otra Área"
] as const;

export const PERIODOS_ESCOLARES = [
  "2023-2024",
  "2024-2025",
  "2025-2026",
  "2026-2027",
  "2027-2028"
];

