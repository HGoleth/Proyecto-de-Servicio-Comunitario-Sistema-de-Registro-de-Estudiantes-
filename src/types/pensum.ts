import { AcademicLevel } from "../constants/academic";

export interface MateriaPensum {
  id: string;
  codigo: string; // Clave única de la materia
  nombre: string;
  grado: string;
  nivel: AcademicLevel;
  periodo: string;
  horasSemanales?: number;
  area?: string;
  otraAreaDescripcion?: string;
  descripcion?: string;
  creadoEn?: string;
  actualizadoEn?: string;
}

export interface PensumFiltro {
  periodo?: string;
  nivel?: AcademicLevel;
  grado?: string;
}
