import { AcademicLevel } from "../constants/academic";

export interface MateriaPensum {
  id: string;
  nombre: string;
  codigo?: string;
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
