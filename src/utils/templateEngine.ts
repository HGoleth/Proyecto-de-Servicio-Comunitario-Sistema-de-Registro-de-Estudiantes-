import { 
  Document, Paragraph, TextRun, AlignmentType, Packer,
  Table, TableRow, TableCell, ImageRun, WidthType, BorderStyle
} from "docx";
import { Student } from "../types/student";
import { DynamicVariable, SignatureBlock } from "../types/templates";
import { DEFAULT_SCHOOL_INFO } from "../constants/academic";

/**
 * Parsea el contenido del pie de página para obtener los bloques de firmas.
 * Soporta retrocompatibilidad con texto simple (lo convierte en bloque centrado)
 * y con formato estructurado JSON.
 */
export const parseSignatures = (raw?: string): SignatureBlock[] => {
  if (!raw || !raw.trim()) {
    return [{
      id: "sig_1",
      posicion: "center",
      texto: "_____________________________\n[Nombre Director]\nDirector(a) del Plantel\n(Sello Institucional)"
    }];
  }

  const trimmed = raw.trim();
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item, idx) => ({
          id: item.id || `sig_${idx + 1}`,
          posicion: (item.posicion === "left" || item.posicion === "right" || item.posicion === "center") ? item.posicion : "center",
          texto: typeof item.texto === "string" ? item.texto : ""
        }));
      }
    } catch {
      // Continuar como texto plano
    }
  }

  return [{
    id: "sig_1",
    posicion: "center",
    texto: raw
  }];
};

/**
 * Serializa los bloques de firmas a formato JSON para guardado transparente
 */
export const serializeSignatures = (blocks: SignatureBlock[]): string => {
  if (!blocks || blocks.length === 0) return "";
  return JSON.stringify(blocks);
};

export const DYNAMIC_VARIABLES: DynamicVariable[] = [
  // ESTUDIANTE
  { key: "[Nombre Alumno]", keyword: "Nombre Alumno", label: "Nombres del Estudiante", category: "Estudiante", description: "Primer y segundo nombre del estudiante", example: "Juan Carlos" },
  { key: "[Apellido Alumno]", keyword: "Apellido Alumno", label: "Apellidos del Estudiante", category: "Estudiante", description: "Primer y segundo apellido del estudiante", example: "Pérez Gómez" },
  { key: "[Nombre Completo]", keyword: "Nombre Completo", label: "Nombre Completo del Estudiante", category: "Estudiante", description: "Nombres y apellidos completos", example: "Juan Carlos Pérez Gómez" },
  { key: "[Cédula Alumno]", keyword: "Cédula Alumno", label: "Cédula / ID Escolar", category: "Estudiante", description: "Cédula de identidad o código institucional", example: "V-32.145.890" },
  { key: "[Fecha Nacimiento]", keyword: "Fecha Nacimiento", label: "Fecha de Nacimiento", category: "Estudiante", description: "Fecha de nacimiento en formato dd/mm/aaaa", example: "15/04/2012" },
  { key: "[Edad Alumno]", keyword: "Edad Alumno", label: "Edad del Estudiante", category: "Estudiante", description: "Edad calculada en años", example: "14 años" },
  { key: "[Lugar Nacimiento]", keyword: "Lugar Nacimiento", label: "Lugar de Nacimiento", category: "Estudiante", description: "Ciudad o localidad natal del estudiante", example: "Porlamar" },
  { key: "[Género Alumno]", keyword: "Género Alumno", label: "Género del Estudiante", category: "Estudiante", description: "Masculino o Femenino", example: "Masculino" },
  { key: "[Dirección Alumno]", keyword: "Dirección Alumno", label: "Dirección de Habitación", category: "Estudiante", description: "Dirección domiciliaria registrada", example: "Calle Bolívar, Sector El Espinal" },

  // ACADÉMICO
  { key: "[Nivel Académico]", keyword: "Nivel Académico", label: "Nivel Académico", category: "Académico", description: "Inicial, Primaria o Secundaria", example: "Secundaria" },
  { key: "[Grado]", keyword: "Grado", label: "Grado o Año", category: "Académico", description: "Grado escolar actual", example: "1er Año" },
  { key: "[Sección]", keyword: "Sección", label: "Sección", category: "Académico", description: "Letra de sección asignada", example: "A" },
  { key: "[Grado y Sección]", keyword: "Grado y Sección", label: "Grado y Sección Completo", category: "Académico", description: "Grado y sección combinados", example: "1er Año Sección \"A\"" },
  { key: "[Periodo Escolar]", keyword: "Periodo Escolar", label: "Año Escolar / Periodo", category: "Académico", description: "Periodo lectivo actual", example: "2025-2026" },
  { key: "[Condición Académica]", keyword: "Condición Académica", label: "Condición / Estatus", category: "Académico", description: "Estatus escolar en el plantel", example: "Regular" },

  // REPRESENTANTE
  { key: "[Nombre Representante]", keyword: "Nombre Representante", label: "Nombre del Representante", category: "Representante", description: "Nombre completo del tutor o representante legal", example: "María Elena Gómez" },
  { key: "[Cédula Representante]", keyword: "Cédula Representante", label: "Cédula del Representante", category: "Representante", description: "Cédula de identidad del representante", example: "V-14.892.456" },
  { key: "[Parentesco]", keyword: "Parentesco", label: "Parentesco del Representante", category: "Representante", description: "Relación filial (Madre, Padre, Abuelo, Tutor...)", example: "Madre" },
  { key: "[Teléfono Representante]", keyword: "Teléfono Representante", label: "Teléfono del Representante", category: "Representante", description: "Número de teléfono de contacto", example: "0414-1234567" },

  // INSTITUCIÓN Y FECHA
  { key: "[Nombre Plantel]", keyword: "Nombre Plantel", label: "Nombre de la Institución", category: "Institución", description: "Nombre oficial del plantel", example: "U.E. República de Chile" },
  { key: "[Código DEA]", keyword: "Código DEA", label: "Código DEA", category: "Institución", description: "Código oficial ante el MPPE", example: "OD01461703" },
  { key: "[Municipio y Estado]", keyword: "Municipio y Estado", label: "Municipio y Estado", category: "Institución", description: "Ubicación geográfica de la escuela", example: "Municipio Díaz, Estado Nueva Esparta" },
  { key: "[Nombre Director]", keyword: "Nombre Director", label: "Nombre del Director(a)", category: "Institución", description: "Firma y cargo directivo", example: "Lic. Dirección del Plantel" },
  { key: "[Fecha Actual]", keyword: "Fecha Actual", label: "Fecha Actual en Letras", category: "Institución", description: "Fecha de emisión completa", example: "11 de noviembre de 2026" },
  { key: "[Día Actual]", keyword: "Día Actual", label: "Día Actual", category: "Institución", description: "Día del mes en números", example: "11" },
  { key: "[Mes Actual]", keyword: "Mes Actual", label: "Mes Actual", category: "Institución", description: "Nombre del mes actual", example: "noviembre" },
  { key: "[Año Actual]", keyword: "Año Actual", label: "Año Actual", category: "Institución", description: "Año calendario actual", example: "2026" },
];

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
];

export const getFechaVenezolana = (date: Date = new Date()) => {
  const dia = date.getDate();
  const mes = MESES[date.getMonth()];
  const anio = date.getFullYear();
  return {
    fechaCompleta: `${dia} de ${mes} de ${anio}`,
    dia: dia.toString(),
    mes: mes,
    anio: anio.toString()
  };
};

export const renderTemplateText = (
  text: string,
  student?: Partial<Student> | null,
  configCustom?: { director?: string; periodo?: string }
): string => {
  if (!text) return "";
  const fecha = getFechaVenezolana();

  const nombreAlumno = student?.firstName || "ESTUDIANTE EJEMPLO";
  const apellidoAlumno = student?.lastName || "";
  const nombreCompleto = `${nombreAlumno} ${apellidoAlumno}`.trim();
  const cedulaAlumno = student?.ci || student?.id || "V-00.000.000";

  let fechaNac = student?.birthDate || "";
  if (fechaNac && fechaNac.includes("-")) {
    const p = fechaNac.split("-");
    if (p.length === 3) fechaNac = `${p[2]}/${p[1]}/${p[0]}`;
  }

  const edadStr = student?.age ? `${student.age} años` : "Edad sin registrar";
  const nivel = (student as any)?.nivel || student?.level || "Educación Regular";
  const grado = student?.grade || "Grado no asignado";
  const seccion = student?.section && student.section !== "N/A" ? student.section : "U";
  const gradoSeccion = `${grado} Sección "${seccion}"`;
  const periodoEscolar = configCustom?.periodo || student?.schoolYear || DEFAULT_SCHOOL_INFO.schoolYear;

  const repNombre = (student as any)?.repName || 
    `${(student as any)?.repFirstName || ""} ${(student as any)?.repLastName || ""}`.trim() || 
    (student as any)?.motherName || 
    (student as any)?.fatherName || 
    "Representante Legal";

  const repCedula = (student as any)?.repCI || 
    (student as any)?.repCedula || 
    (student as any)?.motherCI || 
    (student as any)?.fatherCI || 
    "V-00.000.000";

  const repParentesco = (student as any)?.relationship || "Representante";
  const repTelefono = (student as any)?.repPhone || 
    (student as any)?.motherPhone || 
    (student as any)?.fatherPhone || 
    "0414-0000000";

  // Mapeo exhaustivo de patrones: soporta corchetes [Palabra Clave], palabras clave directas y llaves históricas {{...}}
  const replacements: { patterns: RegExp[]; value: string }[] = [
    {
      patterns: [
        /\[\s*nombre\s*completo\s*\]/gi,
        /\[\s*nombre_completo\s*\]/gi,
        /\{\{\s*nombre_completo\s*\}\}/gi,
        /\{\{\s*nombre\s*completo\s*\}\}/gi,
        /\{\s*nombre_completo\s*\}/gi,
      ],
      value: nombreCompleto
    },
    {
      patterns: [
        /\[\s*nombres?\s*(?:del)?\s*alumno\s*\]/gi,
        /\[\s*nombres?\s*(?:del)?\s*estudiante\s*\]/gi,
        /\[\s*nombre_alumno\s*\]/gi,
        /\{\{\s*nombre_alumno\s*\}\}/gi,
        /\{\s*nombre_alumno\s*\}/gi,
      ],
      value: nombreAlumno
    },
    {
      patterns: [
        /\[\s*apellidos?\s*(?:del)?\s*alumno\s*\]/gi,
        /\[\s*apellidos?\s*(?:del)?\s*estudiante\s*\]/gi,
        /\[\s*apellido_alumno\s*\]/gi,
        /\{\{\s*apellido_alumno\s*\}\}/gi,
        /\{\s*apellido_alumno\s*\}/gi,
      ],
      value: apellidoAlumno
    },
    {
      patterns: [
        /\[\s*c[eé]dula\s*(?:del)?\s*alumno\s*\]/gi,
        /\[\s*c[eé]dula\s*(?:del)?\s*estudiante\s*\]/gi,
        /\[\s*cedula_alumno\s*\]/gi,
        /\{\{\s*cedula_alumno\s*\}\}/gi,
        /\{\s*cedula_alumno\s*\}/gi,
      ],
      value: cedulaAlumno
    },
    {
      patterns: [
        /\[\s*fecha\s*(?:de)?\s*nacimiento\s*\]/gi,
        /\[\s*fecha_nacimiento\s*\]/gi,
        /\{\{\s*fecha_nacimiento\s*\}\}/gi,
        /\{\s*fecha_nacimiento\s*\}/gi,
      ],
      value: fechaNac || "No registrada"
    },
    {
      patterns: [
        /\[\s*edad\s*(?:del)?\s*alumno\s*\]/gi,
        /\[\s*edad_alumno\s*\]/gi,
        /\{\{\s*edad_alumno\s*\}\}/gi,
        /\{\s*edad_alumno\s*\}/gi,
      ],
      value: edadStr
    },
    {
      patterns: [
        /\[\s*lugar\s*(?:de)?\s*nacimiento\s*\]/gi,
        /\[\s*lugar_nacimiento\s*\]/gi,
        /\{\{\s*lugar_nacimiento\s*\}\}/gi,
        /\{\s*lugar_nacimiento\s*\}/gi,
      ],
      value: (student as any)?.placeOfBirth || "El Espinal"
    },
    {
      patterns: [
        /\[\s*g[eé]nero\s*(?:del)?\s*alumno\s*\]/gi,
        /\[\s*genero_alumno\s*\]/gi,
        /\{\{\s*genero_alumno\s*\}\}/gi,
        /\{\s*genero_alumno\s*\}/gi,
      ],
      value: (student as any)?.gender || "Sin especificar"
    },
    {
      patterns: [
        /\[\s*direcci[oó]n\s*(?:del)?\s*alumno\s*\]/gi,
        /\[\s*direccion_alumno\s*\]/gi,
        /\{\{\s*direccion_alumno\s*\}\}/gi,
        /\{\s*direccion_alumno\s*\}/gi,
      ],
      value: (student as any)?.address || "El Espinal, Municipio Díaz"
    },
    {
      patterns: [
        /\[\s*nivel\s*acad[eé]mico\s*\]/gi,
        /\[\s*nivel_academico\s*\]/gi,
        /\{\{\s*nivel_academico\s*\}\}/gi,
        /\{\s*nivel_academico\s*\}/gi,
      ],
      value: nivel
    },
    {
      patterns: [
        /\[\s*grado\s*y\s*secci[oó]n\s*\]/gi,
        /\[\s*grado_seccion\s*\]/gi,
        /\{\{\s*grado_seccion\s*\}\}/gi,
        /\{\s*grado_seccion\s*\}/gi,
      ],
      value: gradoSeccion
    },
    {
      patterns: [
        /\[\s*grado\s*\]/gi,
        /\{\{\s*grado\s*\}\}/gi,
        /\{\s*grado\s*\}/gi,
      ],
      value: grado
    },
    {
      patterns: [
        /\[\s*secci[oó]n\s*\]/gi,
        /\{\{\s*seccion\s*\}\}/gi,
        /\{\s*seccion\s*\}/gi,
      ],
      value: seccion
    },
    {
      patterns: [
        /\[\s*periodo\s*escolar\s*\]/gi,
        /\[\s*a[nñ]o\s*escolar\s*\]/gi,
        /\[\s*periodo_escolar\s*\]/gi,
        /\{\{\s*periodo_escolar\s*\}\}/gi,
        /\{\s*periodo_escolar\s*\}/gi,
      ],
      value: periodoEscolar
    },
    {
      patterns: [
        /\[\s*condici[oó]n\s*acad[eé]mica\s*\]/gi,
        /\[\s*condicion_academica\s*\]/gi,
        /\{\{\s*condicion_academica\s*\}\}/gi,
        /\{\s*condicion_academica\s*\}/gi,
      ],
      value: (student as any)?.status || "Regular"
    },
    {
      patterns: [
        /\[\s*nombre\s*(?:del)?\s*representante\s*\]/gi,
        /\[\s*nombre_representante\s*\]/gi,
        /\{\{\s*nombre_representante\s*\}\}/gi,
        /\{\s*nombre_representante\s*\}/gi,
      ],
      value: repNombre
    },
    {
      patterns: [
        /\[\s*c[eé]dula\s*(?:del)?\s*representante\s*\]/gi,
        /\[\s*cedula_representante\s*\]/gi,
        /\{\{\s*cedula_representante\s*\}\}/gi,
        /\{\s*cedula_representante\s*\}/gi,
      ],
      value: repCedula
    },
    {
      patterns: [
        /\[\s*parentesco\s*\]/gi,
        /\[\s*parentesco_representante\s*\]/gi,
        /\{\{\s*parentesco_representante\s*\}\}/gi,
        /\{\s*parentesco_representante\s*\}/gi,
      ],
      value: repParentesco
    },
    {
      patterns: [
        /\[\s*tel[eé]fono\s*(?:del)?\s*representante\s*\]/gi,
        /\[\s*telefono_representante\s*\]/gi,
        /\{\{\s*telefono_representante\s*\}\}/gi,
        /\{\s*telefono_representante\s*\}/gi,
      ],
      value: repTelefono
    },
    {
      patterns: [
        /\[\s*nombre\s*(?:del)?\s*plantel\s*\]/gi,
        /\[\s*nombre\s*(?:del)?\s*colegio\s*\]/gi,
        /\[\s*nombre_colegio\s*\]/gi,
        /\{\{\s*nombre_colegio\s*\}\}/gi,
        /\{\s*nombre_colegio\s*\}/gi,
      ],
      value: DEFAULT_SCHOOL_INFO.name
    },
    {
      patterns: [
        /\[\s*c[oó]digo\s*dea\s*\]/gi,
        /\[\s*codigo_dea\s*\]/gi,
        /\{\{\s*codigo_dea\s*\}\}/gi,
        /\{\s*codigo_dea\s*\}/gi,
      ],
      value: DEFAULT_SCHOOL_INFO.deaCode
    },
    {
      patterns: [
        /\[\s*municipio\s*y\s*estado\s*\]/gi,
        /\[\s*municipio_estado\s*\]/gi,
        /\{\{\s*municipio_estado\s*\}\}/gi,
        /\{\s*municipio_estado\s*\}/gi,
      ],
      value: "Municipio Díaz, Estado Nueva Esparta"
    },
    {
      patterns: [
        /\[\s*nombre\s*(?:del)?\s*director\s*\]/gi,
        /\[\s*nombre\s*(?:del)?\s*director\(a\)\s*\]/gi,
        /\[\s*nombre_director\s*\]/gi,
        /\{\{\s*nombre_director\s*\}\}/gi,
        /\{\s*nombre_director\s*\}/gi,
      ],
      value: configCustom?.director || "Lic. Dirección del Plantel"
    },
    {
      patterns: [
        /\[\s*fecha\s*actual\s*\]/gi,
        /\[\s*fecha_actual\s*\]/gi,
        /\{\{\s*fecha_actual\s*\}\}/gi,
        /\{\s*fecha_actual\s*\}/gi,
      ],
      value: fecha.fechaCompleta
    },
    {
      patterns: [
        /\[\s*d[ií]a\s*actual\s*\]/gi,
        /\[\s*dia_actual\s*\]/gi,
        /\{\{\s*dia_actual\s*\}\}/gi,
        /\{\s*dia_actual\s*\}/gi,
      ],
      value: fecha.dia
    },
    {
      patterns: [
        /\[\s*mes\s*actual\s*\]/gi,
        /\[\s*mes_actual\s*\]/gi,
        /\{\{\s*mes_actual\s*\}\}/gi,
        /\{\s*mes_actual\s*\}/gi,
      ],
      value: fecha.mes
    },
    {
      patterns: [
        /\[\s*a[nñ]o\s*actual\s*\]/gi,
        /\[\s*anio_actual\s*\]/gi,
        /\{\{\s*anio_actual\s*\}\}/gi,
        /\{\s*anio_actual\s*\}/gi,
      ],
      value: fecha.anio
    },
  ];

  let rendered = text;
  replacements.forEach(({ patterns, value }) => {
    patterns.forEach(regex => {
      rendered = rendered.replace(regex, value);
    });
  });

  return rendered;
};

async function urlToUint8Array(url?: string): Promise<Uint8Array | null> {
  if (!url) return null;
  try {
    if (url.startsWith("data:")) {
      const parts = url.split(",");
      if (parts.length < 2) return null;
      const base64 = parts[1];
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    }
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    return new Uint8Array(buf);
  } catch (err) {
    console.warn("No se pudo cargar imagen para DOCX:", err);
    return null;
  }
}

// Generador de documento .DOCX compatible con Microsoft Word
export const exportToDocx = async (
  docData: {
    encabezado: string;
    titulo: string;
    cuerpo: string;
    piePagina: string;
    filename?: string;
    logoMode?: "both" | "institucion" | "mppe" | "none";
    instLogoUrl?: string;
    mppeLogoUrl?: string;
    paperSize?: "Carta" | "Oficio" | "A4";
    mppeSize?: number;
    instSize?: number;
    mppeHeight?: number | "auto";
    instHeight?: number | "auto";
    mppePosition?: "left" | "center" | "right" | "none";
    instPosition?: "left" | "center" | "right" | "none";
  }
) => {
  const parseParagraphs = (rawText: string, alignment = AlignmentType.JUSTIFIED, isBold = false) => {
    const lines = rawText.split("\n");
    return lines.map(line => {
      // Si la línea está vacía, devuelve un párrafo con salto
      if (!line.trim()) {
        return new Paragraph({ text: "" });
      }

      // Procesar texto con negritas simples si tiene marcadores **texto**
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const runs: TextRun[] = parts.map(part => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return new TextRun({
            text: part.slice(2, -2),
            bold: true,
            font: "Arial",
            size: 24, // 12pt
          });
        }
        return new TextRun({
          text: part,
          bold: isBold,
          font: "Arial",
          size: 24, // 12pt
        });
      });

      return new Paragraph({
        children: runs,
        alignment: alignment,
        spacing: { after: 200, line: 360 }, // 1.5 interlineado
      });
    });
  };

  const encabezadoParagraphs = docData.encabezado
    .split("\n")
    .filter(Boolean)
    .map(line => new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80, line: 240 },
      children: [
        new TextRun({
          text: line,
          bold: true,
          font: "Arial",
          size: 20, // 10pt
          color: "333333"
        })
      ]
    }));

  const logoMode = docData.logoMode || "both";
  let headerContent: (Paragraph | Table)[] = encabezadoParagraphs;

  if (logoMode !== "none") {
    const needMppe = logoMode === "both" || logoMode === "mppe";
    const needInst = logoMode === "both" || logoMode === "institucion";

    const mppeUrl = docData.mppeLogoUrl || "./mppe_logo.png";
    const instUrl = docData.instLogoUrl || "./logo.png";

    const [mppeBytes, instBytes] = await Promise.all([
      needMppe ? urlToUint8Array(mppeUrl) : Promise.resolve(null),
      needInst ? urlToUint8Array(instUrl) : Promise.resolve(null),
    ]);

    const mppeWidth = Math.round(docData.mppeSize ? (docData.mppeSize * 0.75) : 65);
    const instWidth = Math.round(docData.instSize ? (docData.instSize * 0.75) : 65);

    const mppeHeight = (docData.mppeHeight && docData.mppeHeight !== "auto")
      ? Math.round(docData.mppeHeight * 0.75)
      : Math.round(mppeWidth * 0.38);
    const instHeight = (docData.instHeight && docData.instHeight !== "auto")
      ? Math.round(docData.instHeight * 0.75)
      : instWidth;

    const mppePos = docData.mppePosition || "left";
    const instPos = docData.instPosition || "right";

    if (mppeBytes || instBytes) {
      const mppeRun = (mppeBytes && mppePos !== "none") ? new ImageRun({
        data: mppeBytes,
        transformation: { width: mppeWidth, height: mppeHeight },
      }) : null;

      const instRun = (instBytes && instPos !== "none") ? new ImageRun({
        data: instBytes,
        transformation: { width: instWidth, height: instHeight },
      }) : null;

      const noBorder = {
        top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      };

      const leftRuns: ImageRun[] = [];
      if (mppePos === "left" && mppeRun) leftRuns.push(mppeRun);
      if (instPos === "left" && instRun) leftRuns.push(instRun);

      const rightRuns: ImageRun[] = [];
      if (instPos === "right" && instRun) rightRuns.push(instRun);
      if (mppePos === "right" && mppeRun) rightRuns.push(mppeRun);

      const centerRuns: ImageRun[] = [];
      if (mppePos === "center" && mppeRun) centerRuns.push(mppeRun);
      if (instPos === "center" && instRun) centerRuns.push(instRun);

      const centerParagraphs = [
        ...centerRuns.map(run => new Paragraph({ alignment: AlignmentType.CENTER, children: [run], spacing: { after: 120 } })),
        ...encabezadoParagraphs
      ];

      // Ajuste proporcional de columnas según el tamaño de los logos
      const maxLogoW = Math.max(mppeWidth, instWidth);
      const sideColWidth = maxLogoW > 140 ? 28 : maxLogoW > 95 ? 24 : 20;
      const centerColWidth = 100 - (sideColWidth * 2);

      const table = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: noBorder,
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: sideColWidth, type: WidthType.PERCENTAGE },
                borders: noBorder,
                children: leftRuns.length > 0 
                  ? [new Paragraph({ alignment: AlignmentType.CENTER, children: leftRuns })]
                  : [new Paragraph({ text: "" })],
              }),
              new TableCell({
                width: { size: centerColWidth, type: WidthType.PERCENTAGE },
                borders: noBorder,
                children: centerParagraphs,
              }),
              new TableCell({
                width: { size: sideColWidth, type: WidthType.PERCENTAGE },
                borders: noBorder,
                children: rightRuns.length > 0 
                  ? [new Paragraph({ alignment: AlignmentType.CENTER, children: rightRuns })]
                  : [new Paragraph({ text: "" })],
              }),
            ],
          }),
        ],
      });

      headerContent = [table];
    }
  }

  const tituloParagraphs = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 360, after: 400 },
      children: [
        new TextRun({
          text: docData.titulo,
          bold: true,
          underline: {},
          font: "Arial",
          size: 28, // 14pt
          color: "111111"
        })
      ]
    })
  ];

  const cuerpoParagraphs = parseParagraphs(docData.cuerpo, AlignmentType.JUSTIFIED);

  // Procesar bloques de firmas estructurados (izquierda, centro, derecha)
  const signatures = parseSignatures(docData.piePagina);
  const leftSigs = signatures.filter(s => s.posicion === "left");
  const centerSigs = signatures.filter(s => s.posicion === "center");
  const rightSigs = signatures.filter(s => s.posicion === "right");

  let pieElements: (Paragraph | Table)[] = [];

  if (leftSigs.length > 0 || rightSigs.length > 0) {
    const tableCells: TableCell[] = [];
    const colCount = (leftSigs.length > 0 ? 1 : 0) + (centerSigs.length > 0 ? 1 : 0) + (rightSigs.length > 0 ? 1 : 0);
    const colWidth = Math.floor(100 / Math.max(1, colCount));

    const createSigCell = (sigs: SignatureBlock[]) => {
      const children = sigs.flatMap(s => s.texto.split("\n").map(l => new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
        children: [new TextRun({ text: l, font: "Arial", size: 20, bold: l.includes("Director") || l.includes("Representante") || l.includes("Prof") })]
      })));
      return new TableCell({
        width: { size: colWidth, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
          left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE }
        },
        children: children.length > 0 ? children : [new Paragraph({ text: "" })]
      });
    };

    if (leftSigs.length > 0) tableCells.push(createSigCell(leftSigs));
    if (centerSigs.length > 0) tableCells.push(createSigCell(centerSigs));
    if (rightSigs.length > 0) tableCells.push(createSigCell(rightSigs));

    pieElements = [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [new TableRow({ children: tableCells })]
      })
    ];
  } else {
    // Si solo hay firmas centradas
    pieElements = signatures.flatMap(s => s.texto.split("\n").map(line => new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [
        new TextRun({
          text: line,
          bold: line.includes("Director") || line.includes("Lic.") || line.includes("Representante"),
          font: "Arial",
          size: 22, // 11pt
          color: "222222"
        })
      ]
    })));
  }

  const paper = docData.paperSize || "Carta";
  let pageSizeDimensions = { width: 12240, height: 15840 }; // Carta
  if (paper === "Oficio") {
    pageSizeDimensions = { width: 12240, height: 20160 }; // Oficio
  } else if (paper === "A4") {
    pageSizeDimensions = { width: 11906, height: 16838 }; // A4
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: pageSizeDimensions,
            margin: {
              top: 1440, // 1 pulgada (2.54 cm)
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        children: [
          ...headerContent,
          ...tituloParagraphs,
          ...cuerpoParagraphs,
          new Paragraph({ spacing: { before: 600 } }), // Espaciador de firmas
          ...pieElements
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const safeFilename = (docData.filename || docData.titulo || "Documento_Institucional")
    .replace(/[^a-zA-Z0-9_-]/g, "_");
  a.download = `${safeFilename}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
