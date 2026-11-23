const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  // Login
  login: (credentials) => ipcRenderer.invoke('login-request', credentials),
  
  // Registro de usuario sistema
  register: (data) => ipcRenderer.invoke('register-request', data),

  // Recuperación
  recoverPassword: (email) => ipcRenderer.invoke('recover-password', email),

  // Actualizar usuario sistema
  updateUser: (data) => ipcRenderer.invoke('update-user', data),

  // Registro de ESTUDIANTE (Formulario inscripción)
  registerStudent: (data) => ipcRenderer.invoke('register-student', data),
  checkDuplicateStudentID: (baseID) => ipcRenderer.invoke("check-duplicate-student-id", baseID),

  //  Obtener lista de ESTUDIANTES (Tabla administración)
  getStudents: () => ipcRenderer.invoke('get-students'),

  deleteStudent: (id) => ipcRenderer.invoke('delete-student', id),
  updateStudent: (data) => ipcRenderer.invoke('update-student', data),

  // Añadir esto en preload.cjs
  uploadFundamentalDoc: (data) => ipcRenderer.invoke('upload-fundamental-doc', data),
  deleteFundamentalDoc: (id) => ipcRenderer.invoke('delete-fundamental-doc', id),

  getConfig: () => ipcRenderer.invoke('get-config'),
  updateConfig: (data) => ipcRenderer.invoke('update-config', data),
  createBackup: () => ipcRenderer.invoke('create-backup'),

  // Control de Ventana
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  close: () => ipcRenderer.invoke('window-close'),
  onWindowStateChange: (callback) => {
    const handler = (_, isMax) => callback(isMax);
    ipcRenderer.on('window-maximized-state', handler);
    return () => ipcRenderer.removeListener('window-maximized-state', handler);
  },
  setClickThrough: (ignore) => ipcRenderer.invoke('set-click-through', ignore),

   // Subir y eliminar Archivos en distribucion
  uploadStudentDoc: (data) => ipcRenderer.invoke('upload-student-doc', data),
  deleteStudentDoc: (data) => ipcRenderer.invoke('delete-student-doc', data),

  // Notas
  obtenerMaterias: () => ipcRenderer.invoke('get-materias'), 
  actualizarConfiguracionLapsos: (datos) => ipcRenderer.invoke('update-lapsos-config', datos),
  guardarEvaluacion: (datos) => ipcRenderer.invoke('save-evaluacion', datos),
  obtenerNotasDetalladas: (estudianteId) => ipcRenderer.invoke('get-detailed-notes', estudianteId),
  guardarNotasSeccion: (d) => ipcRenderer.invoke('guardar-notas-seccion', d),
  obtenerNotasSeccion: (seccionId, materia) => ipcRenderer.invoke('obtener-notas-seccion', { seccionId, materia }),

  // Pensum y Plan Curricular
  getPensum: (filtro) => ipcRenderer.invoke('get-pensum', filtro),
  savePensumMateria: (data) => ipcRenderer.invoke('save-pensum-materia', data),
  deletePensumMateria: (id) => ipcRenderer.invoke('delete-pensum-materia', id),
  clonarPensum: (origen, destino) => ipcRenderer.invoke('clonar-pensum', { origen, destino }),
  resetPensumDefecto: (periodo) => ipcRenderer.invoke('reset-pensum-defecto', periodo),

  // Plantillas de Documentos y PDF / Impresión
  getPlantillas: () => ipcRenderer.invoke('get-plantillas'),
  savePlantilla: (data) => ipcRenderer.invoke('save-plantilla', data),
  deletePlantilla: (id) => ipcRenderer.invoke('delete-plantilla', id),
  resetPlantillasDefecto: () => ipcRenderer.invoke('reset-plantillas-defecto'),
  guardarDocumentoPdf: (options) => ipcRenderer.invoke('guardar-documento-pdf', options),
  imprimirDocumentoDirecto: (options) => ipcRenderer.invoke('imprimir-documento-directo', options),
});