// ================================
// Conexión base de datos
// ================================
const db = require('./db.cjs');

// ================================
// Configuración principal de Electron
// ================================
const { app, BrowserWindow, ipcMain, protocol, dialog, shell } = require("electron");
const path = require("path");
const fs = require("fs");

// ========================================================
// Configuración de Chromium: Renderizado y prevención de tearing
// ========================================================
app.commandLine.appendSwitch('enable-print-preview');
// Desactivar oclusión nativa en Windows que desincroniza el refresco y produce rayas/desgarro al scrollear
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');
// Forzar rasterización GPU fluida y sincronizada
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('force_high_performance_gpu');

let mainWindow;

// ========================================================
//  HELPER: GUARDAR ARCHIVOS FÍSICAMENTE (Fotos y PDFs)
// ========================================================
function guardarArchivoFisico(base64Data, nombreBase, subcarpeta = "") {
  if (!base64Data) return null;

  try {
    // 1. Definir carpeta (AppData/Roaming/nombre-app/uploads/...)
    const uploadDir = path.join(app.getPath('userData'), 'uploads', subcarpeta);
    
    // 2. Crear si no existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // 3. Limpiar cabecera base64
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return base64Data; 
    }

    const buffer = Buffer.from(matches[2], 'base64');
    const extension = matches[1].split('/')[1]; 
    const nombreArchivo = `${nombreBase}-${Date.now()}.${extension}`;
    const rutaCompleta = path.join(uploadDir, nombreArchivo);

    // 4. Escribir disco
    fs.writeFileSync(rutaCompleta, buffer);
    console.log(" Archivo guardado en:", rutaCompleta);

    // 5. Retornar ruta con protocolo personalizado
    return `media://local/${rutaCompleta.replace(/\\/g, "/")}`;
  } catch (error) {
    console.error("Error saving file:", error);
    return null;
  }
}

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    show: false,
    transparent: false,
    frame: false,
    resizable: true,
    hasShadow: true,
    backgroundColor: "#f8fafc",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
      backgroundThrottling: false,
      devTools: true
    },
  });

  mainWindow.loadFile(path.join(__dirname, "dist", "index.html"));

  if (process.env.OPEN_DEVTOOLS === "true") {
    mainWindow.webContents.openDevTools({ mode: "detach" });
  }

  // Permitir abrir/cerrar las herramientas de desarrollador (Modo Dev) con F12 o Ctrl+Shift+I
  // y abrir/cerrar el Manual de Usuario Oficial con F10
  mainWindow.webContents.on("before-input-event", (event, input) => {
    if (
      input.type === "keyDown" &&
      (input.key === "F12" || (input.control && input.shift && input.key.toLowerCase() === "i"))
    ) {
      event.preventDefault();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.toggleDevTools();
      }
      return;
    }

    if (input.type === "keyDown" && input.key === "F10") {
      event.preventDefault();
      if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
        mainWindow.webContents.send("toggle-user-manual");
      }
    }
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  // Notificar cambios de estado maximizado al frontend de forma segura
  const sendWindowState = (isMax) => {
    try {
      if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
        mainWindow.webContents.send("window-maximized-state", isMax);
      }
    } catch (err) {
      console.error("Error enviando estado de ventana:", err);
    }
  };

  mainWindow.on("maximize", () => sendWindowState(true));
  mainWindow.on("unmaximize", () => sendWindowState(false));
  mainWindow.on("restore", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      sendWindowState(mainWindow.isMaximized());
    }
  });

  ipcMain.handle("window-minimize", () => {
    try {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.minimize();
        return true;
      }
    } catch (err) {
      console.error("Error al minimizar:", err);
    }
    return false;
  });

  ipcMain.handle("window-maximize", () => {
    try {
      if (!mainWindow || mainWindow.isDestroyed()) return false;
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
        return false;
      } else {
        mainWindow.maximize();
        return true;
      }
    } catch (err) {
      console.error("Error al maximizar:", err);
    }
    return false;
  });

  ipcMain.handle("window-is-maximized", () => {
    try {
      if (!mainWindow || mainWindow.isDestroyed()) return false;
      return mainWindow.isMaximized();
    } catch (err) {
      console.error("Error en isMaximized:", err);
    }
    return false;
  });

  ipcMain.handle("window-close", () => {
    try {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.close();
      }
    } catch (err) {
      console.error("Error al cerrar:", err);
    }
  });
  ipcMain.handle("set-click-through", (_, state) => {
    if (mainWindow) mainWindow.setIgnoreMouseEvents(state, { forward: true });
  });
  ipcMain.on("set-ignore-mouse-events", (_, state) => {
    if (mainWindow) mainWindow.setIgnoreMouseEvents(state, { forward: true });
  });
};

// ================================
//  PROTOCOLO DE SEGURIDAD (MEDIA)
// ================================
protocol.registerSchemesAsPrivileged([
  { scheme: 'media', privileges: { secure: true, standard: true, supportFetchAPI: true, bypassCSP: true } }
]);

app.whenReady().then(async () => {
  // Manejador del protocolo media://
  protocol.handle('media', (request) => {
    let p = request.url.replace('media://local/', '');
    p = decodeURIComponent(p);
    const rutaAbsoluta = path.normalize(p);

    try {
        const data = fs.readFileSync(rutaAbsoluta);
        const ext = path.extname(rutaAbsoluta).toLowerCase();
        let mimeType = 'image/jpeg';
        if (ext === '.png') mimeType = 'image/png';
        if (ext === '.pdf') mimeType = 'application/pdf';

        return new Response(data, {
            headers: { 'content-type': mimeType }
        });
    } catch (error) {
        console.error(" Error leyendo archivo:", rutaAbsoluta);
        return new Response("Archivo no encontrado", { status: 404 });
    }
  });

  await db.init();
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// ================================
//  HANDLERS IPC (COMUNICACIÓN)
// ================================

// --- 1. CONFIGURACIÓN Y BACKUP ---
ipcMain.handle('get-config', async () => db.getConfig());
ipcMain.handle('update-config', async (event, data) => db.updateConfig(data));

ipcMain.handle('create-backup', async () => {
  try {
    const payload = await db.exportarRespaldoCompleto();
    const jsonStr = JSON.stringify(payload, null, 2);

    const backupDir = path.join(app.getPath('userData'), 'backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    const defaultFileName = `respaldo_sistema_escolar_${new Date().toISOString().split('T')[0]}.json`;
    const localBackupPath = path.join(backupDir, `backup_${Date.now()}.json`);
    fs.writeFileSync(localBackupPath, jsonStr, 'utf-8');

    // Guardar también copia directa en la carpeta del proyecto
    const projectBackupPath = path.join(__dirname, 'respaldo_sistema_escolar.json');
    try {
      fs.writeFileSync(projectBackupPath, jsonStr, 'utf-8');
    } catch {}

    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Guardar Respaldo del Sistema (.JSON)',
      defaultPath: path.join(__dirname, defaultFileName),
      filters: [{ name: 'Respaldo JSON (*.json)', extensions: ['json'] }]
    });

    if (!canceled && filePath) {
      fs.writeFileSync(filePath, jsonStr, 'utf-8');
      try {
        shell.showItemInFolder(filePath);
      } catch {}
      return {
        success: true,
        path: filePath,
        stats: payload.meta?.estadisticas
      };
    }

    return {
      success: true,
      path: projectBackupPath,
      stats: payload.meta?.estadisticas
    };
  } catch (error) {
    console.error("Error creando respaldo:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('restore-backup', async (event, backupData) => {
  try {
    const parsed = typeof backupData === 'string' ? JSON.parse(backupData) : backupData;
    return await db.restaurarRespaldoCompleto(parsed);
  } catch (error) {
    console.error("Error restaurando respaldo:", error);
    return { success: false, message: error.message };
  }
});

// --- 2. DOCUMENTOS INSTITUCIONALES ---
ipcMain.handle('upload-fundamental-doc', async (event, fileData) => {
  try {
    const pathRef = guardarArchivoFisico(fileData.base64, fileData.name.replace(/\.[^/.]+$/, ""), "institucional");
    if (!pathRef) return { success: false };

    const config = await db.getConfig();
    const nuevosDocumentos = config.documentos_fundamentales || [];
    const nuevoDoc = {
      id: Date.now(),
      nombre: fileData.name,
      ruta: pathRef,
      fecha: new Date().toLocaleDateString()
    };

    nuevosDocumentos.push(nuevoDoc);
    await db.updateConfig({ documentos_fundamentales: nuevosDocumentos });

    return { success: true, documento: nuevoDoc };
  } catch (error) {
    return { success: false };
  }
});

ipcMain.handle('delete-fundamental-doc', async (event, docId) => {
  try {
    const config = await db.getConfig();
    const filtrados = (config.documentos_fundamentales || []).filter(d => d.id !== docId);
    await db.updateConfig({ documentos_fundamentales: filtrados });
    return { success: true };
  } catch (error) {
    return { success: false };
  }
});

// --- 3. GESTIÓN DE USUARIOS ---
ipcMain.handle('login-request', async (event, credentials) => {
    const { usuario, password } = credentials;
    const userFound = await db.getUsuario(usuario);
    if (!userFound) return { success: false, mensaje: 'Usuario no encontrado' };
    if (String(userFound.password).trim() === String(password).trim()) {
      return {
        success: true,
        id: userFound.id || 'usr_admin',
        rol: userFound.rol,
        usuario: userFound.username,
        nombre: userFound.nombre || 'Administrador',
        email: userFound.email || 'admin@escuela.com'
      };
    }
    return { success: false, mensaje: 'Contraseña incorrecta' };
});

ipcMain.handle('register-request', async (event, datos) => {
    if (await db.verificarDuplicado(datos.username, datos.email)) return { success: false, mensaje: 'Ya existe' };
    await db.crearUsuario(datos);
    return { success: true };
});

ipcMain.handle('recover-password', async (event, email) => {
    return db.recuperarPassword(email);
});

ipcMain.handle('update-user', async (event, data) => {
    return db.actualizarUsuario(data.id || data.usuario || 'admin', data);
});

// --- 4. GESTIÓN DE ESTUDIANTES ---

ipcMain.handle('check-duplicate-student-id', async (event, baseID) => {
    try {
        return db.contarHermanosPorBase(baseID);
    } catch (error) {
        console.error("Error al contar hermanos:", error);
        return 0;
    }
});

ipcMain.handle('register-student', async (event, studentData) => {
    try {
        // 1. Generación de ID interno del sistema
        const idEst = `EST-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`;
        
        // 2. Definir la ruta de la carpeta específica para este estudiante
        // Esto creará una carpeta única: AppData/Roaming/nombre-app/uploads/estudiantes/EST-XXXX
        const carpetaEstudiante = path.join("estudiantes", idEst);

        // 3. Procesamiento de imágenes (Estudiante y Representante) en la carpeta del alumno
        const fotoEst = guardarArchivoFisico(studentData.studentPhoto, `foto_perfil`, carpetaEstudiante);
        const fotoRep = guardarArchivoFisico(studentData.repPhoto, `foto_representante`, carpetaEstudiante);

        // 4. Procesamiento de documentos de inscripción individualizados
        const docsInsc = (studentData.inscriptionFiles || []).map((doc) => {
          // Extraemos el ID del documento (ej: birthCertificate o customDoc-...) del nombre temporal del archivo
          const [docId, ...rest] = (doc.name || '').split('_');
          const originalName = rest.length > 0 ? rest.join('_') : (doc.name || 'documento');

          return {
            id: doc.id || docId,
            label: doc.label || null,
            name: doc.name || originalName, 
            path: doc.data ? guardarArchivoFisico(doc.data, docId, carpetaEstudiante) : doc.path 
          };
        });

        // 5. Procesamiento de documentos de traslado en la misma carpeta
        const docsTrans = (studentData.transferFiles || []).map((doc, i) => {
            if (!doc) return null;
            return {
              name: doc.name || `traslado_${i}`,
              path: doc.data ? guardarArchivoFisico(doc.data, `traslado_${i}`, carpetaEstudiante) : doc.path
            };
        }).filter(Boolean);

        // 6. Consolidación de datos finales para la base de datos
        const datosFinales = {
            ...studentData,
            id: idEst,
            studentPhoto: fotoEst,
            repPhoto: fotoRep,
            inscriptionFiles: docsInsc,
            transferFiles: docsTrans 
        };

        return db.crearEstudiante(datosFinales);
    } catch (error) {
        console.error("Error en register-student:", error);
        return { success: false, mensaje: 'Error al procesar registro y crear expediente' };
    }
});

// Handlers originales mantenidos
ipcMain.handle('get-students', async () => db.obtenerEstudiantes());
ipcMain.handle('delete-student', async (_, id) => db.eliminarEstudiante(id));
ipcMain.handle('update-student', async (_, data) => db.actualizarEstudiante(data.id, data));

//  Handler para eliminar documentos físicamente y de la DB
ipcMain.handle('delete-student-doc', async (event, { studentId, filePath }) => {
  try {
    // 1. Extraer la ruta real del protocolo media://
    let rutaLimpia = filePath.replace('media://local/', '');
    rutaLimpia = decodeURIComponent(rutaLimpia);
    const rutaAbsoluta = path.normalize(rutaLimpia);

    // 2. Eliminar archivo físico si existe
    if (fs.existsSync(rutaAbsoluta)) {
      fs.unlinkSync(rutaAbsoluta);
    }

    // 3. Actualizar la base de datos
    const estudiantes = await db.obtenerEstudiantes();
    const estudiante = estudiantes.find(e => e.id === studentId);
    
    if (estudiante) {
      const nuevosDocs = (estudiante.inscriptionFiles || []).filter(d => d.path !== filePath);
      await db.actualizarEstudiante(studentId, { inscriptionFiles: nuevosDocs });
    }

    return { success: true };
  } catch (error) {
    console.error("Error eliminando documento:", error);
    return { success: false };
  }
});

// Handler corregido en electron.cjs para guardar en la carpeta específica del estudiante
ipcMain.handle('upload-student-doc', async (event, { studentId, fileData }) => {
  try {
    // 1. Definimos la subcarpeta específica igual que en el registro inicial
    const carpetaEstudiante = path.join("estudiantes", studentId);

    // 2. Extraemos el docId del nombre enviado (ej: "birthCertificate_archivo.pdf")
    // Esto asegura que el archivo físico se nombre correctamente (ej: birthCertificate-1738...)
    const [docId] = fileData.name.split('_'); 
    
    const pathRef = guardarArchivoFisico(fileData.data, docId, carpetaEstudiante);
    if (!pathRef) return { success: false };

    // 3. Actualizamos la base de datos
    const estudiantes = await db.obtenerEstudiantes();
    const estudiante = estudiantes.find(e => e.id === studentId);
    
    if (estudiante) {
      // ✅ Lógica de limpieza: Si ya existe un documento de este tipo, lo filtramos antes de añadir el nuevo
      // Esto evita que se acumulen múltiples "Cédulas" o "Partidas" en la lista de la base de datos
      const nuevosDocs = (estudiante.inscriptionFiles || []).filter(d => 
        !(d.name || '').toLowerCase().startsWith(docId.toLowerCase()) &&
        !(d.id || '').toLowerCase().startsWith(docId.toLowerCase())
      );
      
      nuevosDocs.push({
        id: fileData.docId || docId,
        label: fileData.label || null,
        name: fileData.name,
        path: pathRef
      });
      
      // Persistimos el cambio en la base de datos
      await db.actualizarEstudiante(studentId, { inscriptionFiles: nuevosDocs });
    }

    return { success: true, path: pathRef };
  } catch (error) {
    console.error(" Error en upload-student-doc:", error);
    return { success: false };
  }
});

// ==========================================
// ✅ NUEVOS HANDLERS PARA EL MÓDULO DE NOTAS
// ==========================================

// Handler para obtener la lista de materias (Necesario para el selector en Notas.tsx)
ipcMain.handle('get-materias', async () => {
  return db.obtenerMaterias(); 
});

// Handler para configurar los pesos de los lapsos (Cerebro del sistema)
ipcMain.handle('update-lapsos-config', async (event, data) => {
  return db.actualizarConfiguracionLapsos(data);
});

// Handler para registrar evaluaciones individuales
ipcMain.handle('save-evaluacion', async (event, data) => {
  return db.crearEvaluacion(data);
});

// Handler para obtener el historial detallado de un estudiante
ipcMain.handle('get-detailed-notes', async (event, estudianteId) => {
  return db.obtenerNotasDetalladas(estudianteId);
});

ipcMain.handle('guardar-notas-seccion', async (e, d) => db.guardarNotasSeccion(d));

// electron.cjs - Añadir junto a los otros handlers de notas
ipcMain.handle('obtener-notas-seccion', async (event, { seccionId, materia }) => {
  return db.obtenerNotasSeccion(seccionId, materia);
});

// Handlers para el Pensum por Grado y Periodo Escolar
ipcMain.handle('get-pensum', async (event, filtro) => {
  return db.obtenerPensum(filtro);
});

ipcMain.handle('save-pensum-materia', async (event, data) => {
  return db.guardarMateriaPensum(data);
});

ipcMain.handle('delete-pensum-materia', async (event, id) => {
  return db.eliminarMateriaPensum(id);
});

ipcMain.handle('clonar-pensum', async (event, { origen, destino }) => {
  return db.clonarPensumPeriodo(origen, destino);
});

ipcMain.handle('reset-pensum-defecto', async (event, periodo) => {
  return db.generarPensumPorDefecto(periodo);
});

// Handlers para el Generador Automático de Plantillas de Documentos
ipcMain.handle('get-plantillas', async () => {
  return db.obtenerPlantillas();
});

ipcMain.handle('save-plantilla', async (event, data) => {
  return db.guardarPlantilla(data);
});

ipcMain.handle('delete-plantilla', async (event, id) => {
  return db.eliminarPlantilla(id);
});

ipcMain.handle('reset-plantillas-defecto', async () => {
  return db.resetearPlantillasDefecto();
});

ipcMain.handle('guardar-documento-pdf', async (event, options = {}) => {
  try {
    const rawSize = options.pageSize || 'Carta';
    const pageSize = rawSize === 'Carta' ? 'Letter' : rawSize === 'Oficio' ? 'Legal' : rawSize;
    const defaultFileName = (options.filename || `Documento_${Date.now()}`)
      .replace(/[^a-zA-Z0-9_\-\.]/g, '_') + '.pdf';

    // No pasar win para evitar bloqueos en ventanas frameless en Windows
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Guardar Documento como PDF',
      defaultPath: path.join(app.getPath('downloads'), defaultFileName),
      filters: [
        { name: 'Documentos PDF (*.pdf)', extensions: ['pdf'] }
      ]
    });

    if (canceled || !filePath) {
      return { success: false, canceled: true };
    }

    // Si el frontend envía los datos binarios del PDF ya procesados
    if (options.pdfBase64) {
      const cleanBase64 = options.pdfBase64.replace(/^data:application\/pdf;base64,/, '');
      fs.writeFileSync(filePath, Buffer.from(cleanBase64, 'base64'));
      try {
        shell.showItemInFolder(filePath);
      } catch {}
      return { success: true, filePath };
    }

    const win = BrowserWindow.fromWebContents(event.sender);
    const pdfBuffer = await win.webContents.printToPDF({
      landscape: options.landscape || false,
      printBackground: true,
      pageSize: pageSize,
      margins: {
        top: 0.3,
        bottom: 0.3,
        left: 0.3,
        right: 0.3
      }
    });

    fs.writeFileSync(filePath, pdfBuffer);

    try {
      shell.showItemInFolder(filePath);
    } catch {}

    return { success: true, filePath };
  } catch (error) {
    console.error('Error generando PDF:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('imprimir-documento-directo', async (event, options = {}) => {
  try {
    const defaultFileName = `Impresion_${Date.now()}.pdf`;
    const tempDir = app.getPath('temp');
    const tempPath = path.join(tempDir, defaultFileName);

    // Si viene el PDF en base64, guardarlo en temp y abrirlo con el visor de Windows para impresión nativa sin errores de Chromium
    if (options.pdfBase64) {
      const cleanBase64 = options.pdfBase64.replace(/^data:application\/pdf;base64,/, '');
      fs.writeFileSync(tempPath, Buffer.from(cleanBase64, 'base64'));
      await shell.openPath(tempPath);
      return { success: true, tempPath };
    }

    const win = BrowserWindow.fromWebContents(event.sender);
    const rawSize = options.pageSize || 'Carta';
    const pageSize = rawSize === 'Carta' ? 'Letter' : rawSize === 'Oficio' ? 'Legal' : rawSize;

    const pdfBuffer = await win.webContents.printToPDF({
      landscape: options.landscape || false,
      printBackground: true,
      pageSize: pageSize
    });
    fs.writeFileSync(tempPath, pdfBuffer);
    await shell.openPath(tempPath);
    return { success: true, tempPath };
  } catch (error) {
    console.error('Error al imprimir:', error);
    return { success: false, failureReason: error.message };
  }
});