export type DocumentLogoMode = "both" | "institucion" | "mppe" | "none";
export type PaperSize = "Carta" | "Oficio" | "A4";
export type LogoPosition = "left" | "center" | "right" | "none";
export type SignaturePosition = "left" | "center" | "right";

export interface SignatureBlock {
  id: string;
  posicion: SignaturePosition;
  texto: string;
}

export interface LogoSettings {
  mppeVisible: boolean;
  mppePosition: LogoPosition;
  mppeSize: number; // px (ancho / escala)
  mppeHeight?: number | "auto"; // px o auto (alto de hitbox)
  mppeUrl?: string;
  mppeX?: number; // Desplazamiento libre horizontal (px)
  mppeY?: number; // Desplazamiento libre vertical (px)

  instVisible: boolean;
  instPosition: LogoPosition;
  instSize: number; // px (ancho / escala)
  instHeight?: number | "auto"; // px o auto (alto de hitbox)
  instUrl?: string;
  instX?: number; // Desplazamiento libre horizontal (px)
  instY?: number; // Desplazamiento libre vertical (px)
}

export interface DocumentTemplate {
  id: string;
  nombre: string;
  codigo?: string;
  categoria: string;
  descripcion?: string;
  encabezado: string;
  titulo: string;
  cuerpo: string;
  piePagina: string;
  logoMode?: DocumentLogoMode;
  paperSize?: PaperSize;
  logoSettings?: Partial<LogoSettings>;
  creadoEn?: string;
  actualizadoEn?: string;
}

export interface DynamicVariable {
  key: string;
  keyword: string;
  label: string;
  category: "Estudiante" | "Académico" | "Representante" | "Institución" | "Institución y Fecha";
  description: string;
  example: string;
}

export interface GeneratedDocument {
  studentId: string;
  studentName: string;
  studentCI: string;
  grade: string;
  section: string;
  templateId: string;
  templateName: string;
  encabezado: string;
  titulo: string;
  cuerpo: string;
  piePagina: string;
  fechaEmision: string;
}
