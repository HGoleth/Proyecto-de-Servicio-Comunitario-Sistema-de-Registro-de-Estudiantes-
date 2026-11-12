export interface ElectronAPI {
  [key: string]: any;
  // Ventana
  setClickThrough: (enabled: boolean) => void;
  minimize: () => Promise<void> | void;
  maximize: () => Promise<boolean> | boolean;
  isMaximized: () => Promise<boolean>;
  close: () => Promise<void> | void;
  onWindowStateChange?: (callback: (isMaximized: boolean) => void) => () => void;

  // Estudiantes
  getStudents: () => Promise<any[]>;
  registerStudent: (data: any) => Promise<any>;
  deleteStudent: (id: string) => Promise<any>;
  updateStudent: (data: any) => Promise<any>;
  checkDuplicateStudentID: (baseID: string) => Promise<number>;

  // ✅ Módulo de Notas (Los que causan tu error)
  obtenerMaterias: () => Promise<any[]>;
  actualizarConfiguracionLapsos: (datos: any) => Promise<{ success: boolean }>;
  guardarEvaluacion: (datos: any) => Promise<{ success: boolean; id: string }>;
  obtenerNotasDetalladas: (estudianteId: string) => Promise<any[]>;

  // Otros
  getConfig: () => Promise<any>;
  updateConfig: (data: any) => Promise<any>;

  // Plantillas y Documentos
  getPlantillas: () => Promise<any[]>;
  savePlantilla: (data: any) => Promise<{ success: boolean; message?: string }>;
  deletePlantilla: (id: string) => Promise<{ success: boolean; message?: string }>;
  resetPlantillasDefecto: () => Promise<{ success: boolean }>;
  guardarDocumentoPdf: (options: { pageSize: string; filename?: string; pdfBase64?: string }) => Promise<{ success: boolean; filePath?: string; canceled?: boolean }>;
  imprimirDocumentoDirecto: (options: { pageSize: string; pdfBase64?: string }) => Promise<{ success: boolean }>;
}

declare global {
  interface Window {
    // Vinculamos el objeto window.electron al tipo ElectronAPI
    electron: ElectronAPI;
  }
}