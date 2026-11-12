const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const mysqlDb = require('./mysqlDb.cjs');

class LocalDB {
  constructor() {
    const userDataPath = app && typeof app.getPath === 'function' 
      ? app.getPath('userData') 
      : path.join(process.env.APPDATA || process.env.HOME || '.', 'Electron');
    this.path = path.join(userDataPath, 'sistema_escolar_db.json');
    this.data = null;
    this.mysql = mysqlDb;
  }

  async init() {
    console.log(" Iniciando base de datos en:", this.path);
    
    // Iniciar conexión con MySQL Server 8.0
    try {
      await this.mysql.init();
    } catch (e) {
      console.warn("⚠️ MySQL no disponible al iniciar LocalDB:", e.message);
    }
    
    if (!fs.existsSync(this.path)) {
      const defaultData = {
        configuracion: { 
          nombre_colegio: 'Unidad Educativa República de Chile', 
          periodo: '2025-2026',
          direccion: '',
          telefono: '',
          email: ''
        },
        usuarios: [],
        estudiantes: [],
        docentes: []
      };
      this.guardarEnDisco(defaultData);
    }

    try {
        const fileContent = fs.readFileSync(this.path, 'utf-8');
        this.data = JSON.parse(fileContent);
    } catch (error) {
        console.error(" Error al leer DB, restaurando estructura segura", error);
        this.data = { configuracion: {}, usuarios: [], estudiantes: [], docentes: [] };
    }

    if (!this.data.docentes) this.data.docentes = [];
    if (!this.data.estudiantes) this.data.estudiantes = [];
    if (!this.data.usuarios) this.data.usuarios = [];
    if (!this.data.pensum) this.data.pensum = this.generarPensumBase('2025-2026');
    if (!this.data.plantillas || this.data.plantillas.length === 0) {
      this.data.plantillas = this.generarPlantillasBase();
    }
    
    this.guardarEnDisco();
    this.crearAdminPorDefecto();
  }

  generarPlantillasBase() {
    return [
      {
        id: "tpl_constancia_estudio",
        nombre: "Constancia de Estudio",
        codigo: "CONST-EST",
        categoria: "Acreditación",
        descripcion: "Certifica que el estudiante cursa activamente en el plantel durante el año lectivo.",
        encabezado: "REPÚBLICA BOLIVARIANA DE VENEZUELA\nMINISTERIO DEL PODER POPULAR PARA LA EDUCACIÓN\nUNIDAD EDUCATIVA \"REPÚBLICA DE CHILE\"\nEL ESPINAL - MUNICIPIO DÍAZ - ESTADO NUEVA ESPARTA\nCÓDIGO DEA: OD01461703",
        titulo: "CONSTANCIA DE ESTUDIO",
        cuerpo: "Quien suscribe, Director(a) de la Unidad Educativa \"República de Chile\", ubicada en El Espinal, Municipio Díaz del Estado Nueva Esparta, por medio de la presente hace constar que el (la) estudiante: [Nombre Completo], titular de la Cédula de Identidad / ID Escolar N° [Cédula Alumno], nacido(a) en fecha [Fecha Nacimiento], cursa en esta institución el [Grado y Sección] de Educación [Nivel Académico], durante el Año Escolar [Periodo Escolar], demostrando puntual asistencia, disciplina y dedicación a sus actividades escolares.\n\nConstancia que se expide a petición de la parte interesada para los fines legales que estime pertinentes, en la ciudad de El Espinal, a los [Día Actual] días del mes de [Mes Actual] del año [Año Actual].",
        piePagina: "_____________________________\n[Nombre Director]\nDirector(a) del Plantel\nUnidad Educativa \"República de Chile\"\n(Sello Institucional)",
        creadoEn: new Date().toISOString()
      },
      {
        id: "tpl_buena_conducta",
        nombre: "Carta de Buena Conducta",
        codigo: "COND-01",
        categoria: "Disciplinaria",
        descripcion: "Acredita el intachable comportamiento y apego a las normas del estudiante.",
        encabezado: "REPÚBLICA BOLIVARIANA DE VENEZUELA\nMINISTERIO DEL PODER POPULAR PARA LA EDUCACIÓN\nUNIDAD EDUCATIVA \"REPÚBLICA DE CHILE\"\nEL ESPINAL - MUNICIPIO DÍAZ - ESTADO NUEVA ESPARTA\nCÓDIGO DEA: OD01461703",
        titulo: "CARTA DE BUENA CONDUCTA",
        cuerpo: "Quien suscribe, Director(a) de la Unidad Educativa \"República de Chile\", hace constar por medio de la presente que el (la) estudiante: [Nombre Completo], titular de la Cédula de Identidad / ID Escolar N° [Cédula Alumno], cursante del [Grado y Sección] de Educación [Nivel Académico] durante el periodo lectivo [Periodo Escolar], ha observado durante su permanencia en esta institución una INTACHABLE CONDUCTA, caracterizándose por su alto sentido de responsabilidad, respeto a las autoridades educativas, compañerismo y apego a las normas de convivencia escolar.\n\nConstancia que se expide a solicitud de su representante legal, ciudadano(a) [Nombre Representante], portador(a) de la C.I. N° [Cédula Representante], para los fines legales que considere convenientes, en El Espinal a los [Día Actual] días del mes de [Mes Actual] de [Año Actual].",
        piePagina: "_____________________________\n[Nombre Director]\nDirector(a) del Plantel\nUnidad Educativa \"República de Chile\"\n(Sello Institucional)",
        creadoEn: new Date().toISOString()
      },
      {
        id: "tpl_inscripcion_prosecucion",
        nombre: "Constancia de Inscripción y Prosecución",
        codigo: "INSC-PROS",
        categoria: "Inscripción",
        descripcion: "Certifica la formalización de la matrícula y prosecución escolar del alumno.",
        encabezado: "REPÚBLICA BOLIVARIANA DE VENEZUELA\nMINISTERIO DEL PODER POPULAR PARA LA EDUCACIÓN\nUNIDAD EDUCATIVA \"REPÚBLICA DE CHILE\"\nEL ESPINAL - MUNICIPIO DÍAZ - ESTADO NUEVA ESPARTA\nCÓDIGO DEA: OD01461703",
        titulo: "CONSTANCIA DE INSCRIPCIÓN Y PROSECUCIÓN ESCOLAR",
        cuerpo: "La Dirección de la Unidad Educativa \"República de Chile\", por medio del presente documento deja constancia formal de que el (la) alumno(a) [Nombre Completo], con Cédula de Identidad / ID Escolar N° [Cédula Alumno], ha formalizado con éxito su proceso de INSCRIPCIÓN Y PROSECUCIÓN para cursar el [Grado y Sección] de Educación [Nivel Académico] correspondiente al Periodo Escolar [Periodo Escolar].\n\nConsta en nuestros expedientes que su representante legal es el (la) ciudadano(a) [Nombre Representante], titular de la C.I. N° [Cédula Representante], con teléfono de contacto [Teléfono Representante] y domicilio declarado en [Dirección Alumno].\n\nDocumento oficial que se expide para los fines consiguientes en El Espinal, en fecha [Fecha Actual].",
        piePagina: "_____________________________\n[Nombre Director]\nDirector(a) del Plantel\nUnidad Educativa \"República de Chile\"\n(Sello Institucional)",
        creadoEn: new Date().toISOString()
      },
      {
        id: "tpl_retiro_traslado",
        nombre: "Constancia de Retiro y Traslado",
        codigo: "RET-TRAS",
        categoria: "Administrativa",
        descripcion: "Notificación oficial de desincorporación y solvencia para traslado de plantel.",
        encabezado: "REPÚBLICA BOLIVARIANA DE VENEZUELA\nMINISTERIO DEL PODER POPULAR PARA LA EDUCACIÓN\nUNIDAD EDUCATIVA \"REPÚBLICA DE CHILE\"\nEL ESPINAL - MUNICIPIO DÍAZ - ESTADO NUEVA ESPARTA\nCÓDIGO DEA: OD01461703",
        titulo: "CONSTANCIA DE RETIRO Y TRASLADO",
        cuerpo: "Por medio de la presente se hace constar formalmente el RETIRO de esta institución educativa del (la) estudiante: [Nombre Completo], titular de la Cédula / ID Escolar N° [Cédula Alumno], quien se encontraba matriculado(a) en el [Grado y Sección] de Educación [Nivel Académico] durante el año escolar [Periodo Escolar].\n\nDicho retiro se efectúa a solicitud de su representante legal, ciudadano(a) [Nombre Representante], portador(a) de la C.I. N° [Cédula Representante], por motivo de traslado de domicilio / cambio de plantel.\n\nSe deja constancia de que el estudiante se encuentra solvente en sus obligaciones administrativas y académicas ante este centro educativo.\n\nExpedida en El Espinal, Municipio Díaz, a los [Día Actual] días del mes de [Mes Actual] de [Año Actual].",
        piePagina: "_____________________________\n[Nombre Director]\nDirector(a) del Plantel\nUnidad Educativa \"República de Chile\"\n(Sello Institucional)",
        creadoEn: new Date().toISOString()
      },
      {
        id: "tpl_citacion_representante",
        nombre: "Citación Formal al Representante",
        codigo: "CIT-REP",
        categoria: "Convocatoria",
        descripcion: "Convocatoria institucional para entrevista presencial con la directiva o docentes.",
        encabezado: "REPÚBLICA BOLIVARIANA DE VENEZUELA\nMINISTERIO DEL PODER POPULAR PARA LA EDUCACIÓN\nUNIDAD EDUCATIVA \"REPÚBLICA DE CHILE\"\nEL ESPINAL - MUNICIPIO DÍAZ - ESTADO NUEVA ESPARTA\nCÓDIGO DEA: OD01461703",
        titulo: "CITACIÓN AL REPRESENTANTE",
        cuerpo: "Se convoca con carácter formal al (a la) ciudadano(a): [Nombre Representante], titular de la Cédula de Identidad N° [Cédula Representante], en su condición de representante legal del (la) estudiante: [Nombre Completo], cursante del [Grado y Sección] de Educación [Nivel Académico].\n\nMotivo de la citación: Tratar asuntos inherentes al rendimiento académico, asistencia y desenvolvimiento escolar de su representado(a).\n\nLugar y Horario: Sede de la institución, en horario de atención matutina (8:00 AM a 12:00 PM) ante la Dirección o Coordinación Pedagógica.\n\nAgradeciendo de antemano su puntual y obligatoria asistencia en cumplimiento de la corresponsabilidad en el proceso educativo.\n\nEmitida en El Espinal, en fecha [Fecha Actual].",
        piePagina: "_____________________________\n[Nombre Director]\nDirector(a) del Plantel\nFirma del Representante: _____________________\nC.I.: _____________________ Fecha: ___/___/______",
        creadoEn: new Date().toISOString()
      }
    ];
  }

  generarPensumBase(periodo = '2025-2026') {
    const pensum = [];
    let idCounter = 1;

    // INICIAL
    const gradosInicial = ["Maternal", "1er Grupo", "2do Grupo", "3er Grupo"];
    const materiasInicial = [
      { nombre: "Formación Personal, Social y Comunicación", codigo: "FPS", horas: 6, area: "Desarrollo Personal" },
      { nombre: "Relación entre los Componentes del Ambiente", codigo: "RCA", horas: 6, area: "Ciencias y Ambiente" },
      { nombre: "Expresión Plástica, Corporal y Musical", codigo: "EPC", horas: 4, area: "Arte y Recreación" },
      { nombre: "Educación Física y Recreación Motriz", codigo: "EFM", horas: 4, area: "Educación Física" },
    ];
    gradosInicial.forEach(g => {
      materiasInicial.forEach(m => {
        pensum.push({
          id: `pen_${idCounter++}_${Date.now()}`,
          nombre: m.nombre,
          codigo: `${m.codigo}-${g.replace(/\s+/g, '').substring(0, 3).toUpperCase()}`,
          grado: g,
          nivel: "Inicial",
          periodo: periodo,
          horasSemanales: m.horas,
          area: m.area,
          descripcion: "Área curricular de Educación Inicial"
        });
      });
    });

    // PRIMARIA
    const gradosPrimaria = ["1ero", "2do", "3ero", "4to", "5to", "6to"];
    const materiasPrimaria = [
      { nombre: "Castellano y Literatura", codigo: "CAS", horas: 6, area: "Lengua y Comunicación" },
      { nombre: "Matemáticas para la Vida", codigo: "MAT", horas: 6, area: "Ciencias y Matemáticas" },
      { nombre: "Ciencias Naturales y Salud", codigo: "NAT", horas: 4, area: "Ciencias Naturales" },
      { nombre: "Ciencias Sociales, Identidad y Soberanía", codigo: "SOC", horas: 4, area: "Ciencias Sociales" },
      { nombre: "Educación Estética y Cultura", codigo: "EST", horas: 3, area: "Arte y Patrimonio" },
      { nombre: "Educación Física, Deporte y Recreación", codigo: "EDF", horas: 3, area: "Educación Física" },
    ];
    gradosPrimaria.forEach(g => {
      materiasPrimaria.forEach(m => {
        pensum.push({
          id: `pen_${idCounter++}_${Date.now()}`,
          nombre: m.nombre,
          codigo: `${m.codigo}-${g.toUpperCase()}`,
          grado: g,
          nivel: "Primaria",
          periodo: periodo,
          horasSemanales: m.horas,
          area: m.area,
          descripcion: "Área de formación de Educación Primaria"
        });
      });
    });

    // SECUNDARIA (1er y 2do Año)
    const secundaria1y2 = [
      { nombre: "Castellano", codigo: "CAS", horas: 4, area: "Lengua y Comunicación" },
      { nombre: "Inglés y Otras Lenguas", codigo: "ING", horas: 4, area: "Lenguas Extranjeras" },
      { nombre: "Matemáticas", codigo: "MAT", horas: 4, area: "Ciencias y Matemáticas" },
      { nombre: "Educación Física", codigo: "EDF", horas: 3, area: "Educación Física" },
      { nombre: "Arte y Patrimonio", codigo: "ART", horas: 3, area: "Arte y Patrimonio" },
      { nombre: "Ciencias Naturales", codigo: "NAT", horas: 4, area: "Ciencias Naturales" },
      { nombre: "Geografía, Historia y Ciudadanía", codigo: "GHC", horas: 4, area: "Ciencias Sociales" },
      { nombre: "Orientación y Convivencia", codigo: "ORI", horas: 2, area: "Orientación" },
      { nombre: "Grupos de Creación, Recreación y Producción", codigo: "CRP", horas: 3, area: "Producción y Cultura" }
    ];
    ["1er Año", "2do Año"].forEach(g => {
      secundaria1y2.forEach(m => {
        pensum.push({
          id: `pen_${idCounter++}_${Date.now()}`,
          nombre: m.nombre,
          codigo: `${m.codigo}-${g.replace(/\s+/g, '').toUpperCase()}`,
          grado: g,
          nivel: "Secundaria",
          periodo: periodo,
          horasSemanales: m.horas,
          area: m.area,
          descripcion: "Área de formación de Educación Media General"
        });
      });
    });

    // SECUNDARIA (3er Año)
    const secundaria3 = [
      { nombre: "Castellano", codigo: "CAS", horas: 4, area: "Lengua y Comunicación" },
      { nombre: "Inglés y Otras Lenguas", codigo: "ING", horas: 4, area: "Lenguas Extranjeras" },
      { nombre: "Matemáticas", codigo: "MAT", horas: 4, area: "Ciencias y Matemáticas" },
      { nombre: "Educación Física", codigo: "EDF", horas: 3, area: "Educación Física" },
      { nombre: "Física", codigo: "FIS", horas: 4, area: "Ciencias Naturales" },
      { nombre: "Química", codigo: "QUI", horas: 4, area: "Ciencias Naturales" },
      { nombre: "Biología", codigo: "BIO", horas: 4, area: "Ciencias Naturales" },
      { nombre: "Geografía, Historia y Ciudadanía", codigo: "GHC", horas: 4, area: "Ciencias Sociales" },
      { nombre: "Orientación y Convivencia", codigo: "ORI", horas: 2, area: "Orientación" },
      { nombre: "Grupos de Creación, Recreación y Producción", codigo: "CRP", horas: 3, area: "Producción y Cultura" }
    ];
    secundaria3.forEach(m => {
      pensum.push({
        id: `pen_${idCounter++}_${Date.now()}`,
        nombre: m.nombre,
        codigo: `${m.codigo}-3ANO`,
        grado: "3er Año",
        nivel: "Secundaria",
        periodo: periodo,
        horasSemanales: m.horas,
        area: m.area,
        descripcion: "Área de formación de Educación Media General"
      });
    });

    // SECUNDARIA (4to y 5to Año)
    const secundaria4y5 = (grado) => [
      { nombre: "Castellano", codigo: "CAS", horas: 4, area: "Lengua y Comunicación" },
      { nombre: "Inglés y Otras Lenguas", codigo: "ING", horas: 4, area: "Lenguas Extranjeras" },
      { nombre: "Matemáticas", codigo: "MAT", horas: 4, area: "Ciencias y Matemáticas" },
      { nombre: "Educación Física", codigo: "EDF", horas: 3, area: "Educación Física" },
      { nombre: "Física", codigo: "FIS", horas: 4, area: "Ciencias Naturales" },
      { nombre: "Química", codigo: "QUI", horas: 4, area: "Ciencias Naturales" },
      { nombre: "Biología", codigo: "BIO", horas: 4, area: "Ciencias Naturales" },
      ...(grado === "5to Año" ? [{ nombre: "Ciencias de la Tierra", codigo: "CIE", horas: 4, area: "Ciencias Naturales" }] : []),
      { nombre: "Geografía, Historia y Ciudadanía", codigo: "GHC", horas: 4, area: "Ciencias Sociales" },
      { nombre: "Formación para la Soberanía Nacional", codigo: "FSN", horas: 3, area: "Ciencias Sociales" },
      { nombre: "Orientación y Convivencia", codigo: "ORI", horas: 2, area: "Orientación" },
      { nombre: "Grupos de Creación, Recreación y Producción", codigo: "CRP", horas: 3, area: "Producción y Cultura" }
    ];
    ["4to Año", "5to Año"].forEach(g => {
      secundaria4y5(g).forEach(m => {
        pensum.push({
          id: `pen_${idCounter++}_${Date.now()}`,
          nombre: m.nombre,
          codigo: `${m.codigo}-${g.replace(/\s+/g, '').toUpperCase()}`,
          grado: g,
          nivel: "Secundaria",
          periodo: periodo,
          horasSemanales: m.horas,
          area: m.area,
          descripcion: "Área de formación de Educación Media General"
        });
      });
    });

    return pensum;
  }

  guardarEnDisco(data = this.data) {
    try {
      fs.writeFileSync(this.path, JSON.stringify(data, null, 2), 'utf-8');
      console.log(" Datos sincronizados físicamente.");
    } catch (err) {
      console.error(" Error crítico al escribir en el disco:", err);
    }
  }

  crearAdminPorDefecto() {
    if (!this.data.usuarios) this.data.usuarios = [];
    const admin = this.data.usuarios.find(u => u.username === 'admin');
    if (!admin) {
      this.data.usuarios.push({
        id: 'usr_admin',
        nombre: 'Administrador',
        username: 'admin',
        email: 'admin@escuela.com',
        password: 'admin123',
        rol: 'director'
      });
      this.guardarEnDisco();
    }
  }

  async getConfig() {
    if (this.mysql.isConnected) {
      const mysqlCfg = await this.mysql.getConfig();
      if (mysqlCfg) return mysqlCfg;
    }
    if (!this.data) this.init();
    return this.data.configuracion || {};
  }

  async updateConfig(nuevosDatos) {
    if (this.mysql.isConnected) {
      await this.mysql.updateConfig(nuevosDatos);
    }
    if (!this.data) this.init();
    this.data.configuracion = { ...this.data.configuracion, ...nuevosDatos };
    this.guardarEnDisco();
    return { success: true };
  }

  async getUsuario(identificador) {
    if (this.mysql.isConnected) {
      const user = await this.mysql.getUsuario(identificador);
      if (user) return user;
    }
    if (!this.data) this.init();
    return this.data.usuarios.find(u => u.username === identificador || u.email === identificador);
  }

  async verificarDuplicado(username, email) {
    if (this.mysql.isConnected) {
      return await this.mysql.verificarDuplicado(username, email);
    }
    if (!this.data) this.init();
    return this.data.usuarios.some(u => u.username === username || u.email === email);
  }

  async crearUsuario(nuevoUsuario) {
    if (this.mysql.isConnected) {
      await this.mysql.crearUsuario(nuevoUsuario);
    }
    if (!this.data) this.init();
    const usuarioAGuardar = { id: `usr_${Date.now()}`, rol: 'docente', ...nuevoUsuario };
    this.data.usuarios.push(usuarioAGuardar);
    this.guardarEnDisco();
    return usuarioAGuardar;
  }

  async actualizarUsuario(id, datosNuevos) {
    if (this.mysql.isConnected) {
      await this.mysql.actualizarUsuario(id, datosNuevos);
    }
    if (!this.data) this.init();
    const index = this.data.usuarios.findIndex(u => u.id === id || u.username === id || u.email === id);
    if (index !== -1) {
      const u = this.data.usuarios[index];
      if (datosNuevos.nombre) u.nombre = datosNuevos.nombre;
      if (datosNuevos.email) u.email = datosNuevos.email;
      if (datosNuevos.password) u.password = datosNuevos.password;
      this.data.usuarios[index] = u;
      this.guardarEnDisco();
      return { success: true, usuario: u };
    }
    return { success: false, mensaje: "Usuario no encontrado" };
  }

  async recuperarPassword(email) {
    if (this.mysql.isConnected) {
      return await this.mysql.recuperarPassword(email);
    }
    if (!this.data) this.init();
    const u = this.data.usuarios.find(user => user.email === email);
    if (u) {
      return { success: true, mensaje: "Se ha verificado el correo electrónico." };
    }
    return { success: false, mensaje: "Correo electrónico no registrado en el sistema." };
  }

  async crearEstudiante(datosEstudiante) {
    if (this.mysql.isConnected) {
      await this.mysql.guardarEstudiante(datosEstudiante);
    }
    if (!this.data) this.init();
    
    const estudianteGuardar = { 
      fecha_registro: new Date().toISOString(), 
      estatus: "Inscrito", 
      ...datosEstudiante
    };

    const idx = this.data.estudiantes.findIndex(e => e.id === datosEstudiante.id);
    if (idx !== -1) {
      this.data.estudiantes[idx] = { ...this.data.estudiantes[idx], ...estudianteGuardar };
    } else {
      this.data.estudiantes.push(estudianteGuardar);
    }
    this.guardarEnDisco();
    
    return { success: true, id: datosEstudiante.id };
  }

  async obtenerEstudiantes() {
    if (this.mysql.isConnected) {
      const rows = await this.mysql.obtenerEstudiantes();
      if (rows && rows.length >= 0) return rows;
    }
    if (!this.data) this.init();
    return this.data.estudiantes || [];
  }

  async actualizarEstudiante(id, datosNuevos) {
    if (this.mysql.isConnected) {
      await this.mysql.actualizarEstudiante(id, datosNuevos);
    }
    if (!this.data) this.init();
    const index = this.data.estudiantes.findIndex(e => e.id === id);
    if (index !== -1) {
      this.data.estudiantes[index] = { ...this.data.estudiantes[index], ...datosNuevos };
      this.guardarEnDisco();
      return { success: true };
    }
    return { success: false };
  }

  async eliminarEstudiante(id) {
    if (this.mysql.isConnected) {
      await this.mysql.eliminarEstudiante(id);
    }
    if (!this.data) this.init();
    const inicial = this.data.estudiantes.length;
    this.data.estudiantes = this.data.estudiantes.filter(est => est.id !== id);
    if (this.data.estudiantes.length < inicial) {
      this.guardarEnDisco();
      return { success: true };
    }
    return { success: false };
  }

  async crearDocente(datosDocente) {
    const nuevoId = datosDocente.id || `DOC-${Date.now()}`;
    const payload = { ...datosDocente, id: nuevoId };
    if (this.mysql.isConnected) {
      await this.mysql.guardarDocente(payload);
    }
    if (!this.data) this.init();
    const docenteGuardar = {
      ...payload,
      fecha_ingreso: new Date().toISOString(),
      estatus: datosDocente.estatus || "Activo"
    };
    this.data.docentes.push(docenteGuardar);
    this.guardarEnDisco();
    return { success: true, id: nuevoId };
  }

  async obtenerDocentes() {
    if (this.mysql.isConnected) {
      const rows = await this.mysql.obtenerDocentes();
      if (rows && rows.length >= 0) return rows;
    }
    if (!this.data) this.init();
    return this.data.docentes || [];
  }

  async actualizarDocente(id, datosNuevos) {
    if (this.mysql.isConnected) {
      await this.mysql.actualizarDocente(id, datosNuevos);
    }
    if (!this.data) this.init();
    const index = this.data.docentes.findIndex(d => d.id === id);
    if (index !== -1) {
      this.data.docentes[index] = { 
        ...this.data.docentes[index], 
        ...datosNuevos,
        id: id 
      };
      this.guardarEnDisco();
      return { success: true };
    }
    return { success: false };
  }

  async eliminarDocente(id) {
    if (this.mysql.isConnected) {
      await this.mysql.eliminarDocente(id);
    }
    if (!this.data) this.init();
    const totalAntes = this.data.docentes.length;
    this.data.docentes = this.data.docentes.filter(d => d.id !== id);
    if (this.data.docentes.length < totalAntes) {
      this.guardarEnDisco();
      return { success: true };
    }
    return { success: false };
  }

  async contarHermanosPorBase(baseID) {
    if (this.mysql.isConnected) {
      return await this.mysql.contarHermanosPorBase(baseID);
    }
    if (!this.data) this.init();
    const hermanos = this.data.estudiantes.filter(est => 
      est.ci && est.ci.toString().startsWith(baseID)
    );
    return hermanos.length;
  }

  // Configura los pesos de los lapsos (Ej: L1: 30, L2: 30, L3: 40)
  actualizarConfiguracionLapsos(datos) {
    if (!this.data) this.init();
    this.data.configuracion.lapsos = datos; // { lapso1: 30, lapso2: 30, lapso3: 40 }
    this.guardarEnDisco();
    return { success: true };
  }

  // Registra una evaluación individual con su peso porcentual
  crearEvaluacion(notaData) {
    if (!this.data) this.init();
    if (!this.data.notas) this.data.notas = [];
    
    const nuevaNota = {
      id: `NOTA-${Date.now()}`,
      fecha: new Date().toISOString(),
      ...notaData // estudiante_id, materia_id, lapso, porcentaje, valor_nota, tipo (cualitativa/cuantitativa)
    };
    
    this.data.notas.push(nuevaNota);
    this.guardarEnDisco();
    return { success: true, id: nuevaNota.id };
  }

  obtenerNotasDetalladas(estudianteId) {
    if (!this.data) this.init();
    return (this.data.notas || []).filter(n => n.estudiante_id === estudianteId);
  }

  // ✅ ASEGÚRATE QUE ESTÉ ASÍ:
  obtenerMaterias() {
    if (!this.data) this.init();
    // Si no hay materias, devolvemos unas por defecto para que el programa no explote
    if (!this.data.materias || this.data.materias.length === 0) {
      return [
        { id: '1', nombre: 'MATEMÁTICAS' },
        { id: '2', nombre: 'CASTELLANO' },
        { id: '3', nombre: 'CIENCIAS' }
      ];
    }
    return this.data.materias;
  }

  // db.cjs - Reemplaza la función guardarNotasSeccion
async guardarNotasSeccion(datos) {
  if (this.mysql.isConnected) {
    await this.mysql.guardarNotasSeccion(datos);
  }
  if (!this.data) this.init();
  if (!this.data.registro_notas) this.data.registro_notas = [];

  const { seccionId, materia, planificacion, notas } = datos;

  // Buscamos si ya existe para esta sección y materia específica
  const index = this.data.registro_notas.findIndex(
    r => r.seccionId === seccionId && r.materia === materia
  );

  const nuevoRegistro = {
    seccionId,
    materia,
    planificacion, // Aquí se guardan los nombres de las tareas y %
    notas,         // Aquí se guardan los números de los cuadritos
    ultima_modificacion: new Date().toISOString()
  };

  if (index !== -1) {
    this.data.registro_notas[index] = nuevoRegistro;
  } else {
    this.data.registro_notas.push(nuevoRegistro);
  }

  this.guardarEnDisco();
  console.log(`✅ Registro resguardado físicamente para ${materia}`);
  return { success: true };
}

async obtenerNotasSeccion(seccionId, materia) {
  if (this.mysql.isConnected) {
    const r = await this.mysql.obtenerNotasSeccion(seccionId, materia);
    if (r) return r;
  }
  if (!this.data) this.init();
  if (!this.data.registro_notas) return null;

  return this.data.registro_notas.find(
    r => r.seccionId === seccionId && r.materia === materia
  ) || null;
}

// ==========================================
// MÉTODOS DEL PENSUM Y PLAN CURRICULAR
// ==========================================

async obtenerPensum(filtro = {}) {
  if (this.mysql.isConnected) {
    const rows = await this.mysql.obtenerPensum(filtro);
    if (rows && rows.length > 0) return rows;
  }
  if (!this.data) this.init();
  if (!this.data.pensum) this.data.pensum = this.generarPensumBase('2025-2026');

  let resultado = [...this.data.pensum];

  if (filtro.periodo) {
    resultado = resultado.filter(m => m.periodo === filtro.periodo);
  }
  if (filtro.nivel) {
    resultado = resultado.filter(m => m.nivel === filtro.nivel);
  }
  if (filtro.grado) {
    resultado = resultado.filter(m => m.grado === filtro.grado);
  }

  return resultado;
}

async guardarMateriaPensum(materiaData) {
  if (this.mysql.isConnected) {
    await this.mysql.guardarMateriaPensum(materiaData);
  }
  if (!this.data) this.init();
  if (!this.data.pensum) this.data.pensum = [];

  if (materiaData.id) {
    // Actualizar existente
    const index = this.data.pensum.findIndex(m => m.id === materiaData.id);
    if (index !== -1) {
      this.data.pensum[index] = {
        ...this.data.pensum[index],
        ...materiaData,
        actualizadoEn: new Date().toISOString()
      };
      this.guardarEnDisco();
      return { success: true, materia: this.data.pensum[index] };
    }
  }

  // Nueva materia
  const nuevaMateria = {
    ...materiaData,
    id: materiaData.id || `mat_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    creadoEn: new Date().toISOString()
  };

  this.data.pensum.push(nuevaMateria);
  this.guardarEnDisco();
  return { success: true, materia: nuevaMateria };
}

async eliminarMateriaPensum(id) {
  if (this.mysql.isConnected) {
    await this.mysql.eliminarMateriaPensum(id);
  }
  if (!this.data) this.init();
  if (!this.data.pensum) return { success: false, message: "Pensum no inicializado" };

  const antes = this.data.pensum.length;
  this.data.pensum = this.data.pensum.filter(m => m.id !== id);
  const eliminada = this.data.pensum.length < antes;

  if (eliminada) {
    this.guardarEnDisco();
    return { success: true };
  }
  return { success: false, message: "Materia no encontrada" };
}

async clonarPensumPeriodo(periodoOrigen, periodoDestino) {
  if (this.mysql.isConnected) {
    await this.mysql.clonarPensumPeriodo(periodoOrigen, periodoDestino);
  }
  if (!this.data) this.init();
  if (!this.data.pensum) this.data.pensum = [];

  const materiasOrigen = this.data.pensum.filter(m => m.periodo === periodoOrigen);
  if (materiasOrigen.length === 0) {
    return { success: false, message: `No hay materias registradas en el periodo ${periodoOrigen}` };
  }

  // Eliminar las que ya existan en destino para evitar duplicados
  this.data.pensum = this.data.pensum.filter(m => m.periodo !== periodoDestino);

  // Clonar asignando nuevo id y periodo
  const clonadas = materiasOrigen.map((m, idx) => ({
    ...m,
    id: `pen_clone_${Date.now()}_${idx}`,
    periodo: periodoDestino,
    creadoEn: new Date().toISOString()
  }));

  this.data.pensum.push(...clonadas);
  this.guardarEnDisco();
  return { success: true, total: clonadas.length };
}

async generarPensumPorDefecto(periodo = '2025-2026') {
  if (!this.data) this.init();
  if (!this.data.pensum) this.data.pensum = [];

  // Eliminar materias de ese periodo si existen
  this.data.pensum = this.data.pensum.filter(m => m.periodo !== periodo);

  const base = this.generarPensumBase(periodo);
  this.data.pensum.push(...base);
  this.guardarEnDisco();
  return { success: true, total: base.length };
}

// ==========================================
// MÉTODOS DE PLANTILLAS DE DOCUMENTOS
// ==========================================

limpiarLlavesPlantilla(str) {
  if (!str) return str;
  return str
    .replace(/\{\{\s*nombre_completo\s*\}\}/gi, '[Nombre Completo]')
    .replace(/\{\{\s*nombre_alumno\s*\}\}/gi, '[Nombre Alumno]')
    .replace(/\{\{\s*apellido_alumno\s*\}\}/gi, '[Apellido Alumno]')
    .replace(/\{\{\s*cedula_alumno\s*\}\}/gi, '[Cédula Alumno]')
    .replace(/\{\{\s*fecha_nacimiento\s*\}\}/gi, '[Fecha Nacimiento]')
    .replace(/\{\{\s*edad_alumno\s*\}\}/gi, '[Edad Alumno]')
    .replace(/\{\{\s*lugar_nacimiento\s*\}\}/gi, '[Lugar Nacimiento]')
    .replace(/\{\{\s*genero_alumno\s*\}\}/gi, '[Género Alumno]')
    .replace(/\{\{\s*direccion_alumno\s*\}\}/gi, '[Dirección Alumno]')
    .replace(/\{\{\s*nivel_academico\s*\}\}/gi, '[Nivel Académico]')
    .replace(/\{\{\s*grado_seccion\s*\}\}/gi, '[Grado y Sección]')
    .replace(/\{\{\s*grado\s*\}\}/gi, '[Grado]')
    .replace(/\{\{\s*seccion\s*\}\}/gi, '[Sección]')
    .replace(/\{\{\s*periodo_escolar\s*\}\}/gi, '[Periodo Escolar]')
    .replace(/\{\{\s*condicion_academica\s*\}\}/gi, '[Condición Académica]')
    .replace(/\{\{\s*nombre_representante\s*\}\}/gi, '[Nombre Representante]')
    .replace(/\{\{\s*cedula_representante\s*\}\}/gi, '[Cédula Representante]')
    .replace(/\{\{\s*parentesco_representante\s*\}\}/gi, '[Parentesco]')
    .replace(/\{\{\s*telefono_representante\s*\}\}/gi, '[Teléfono Representante]')
    .replace(/\{\{\s*nombre_colegio\s*\}\}/gi, '[Nombre Plantel]')
    .replace(/\{\{\s*codigo_dea\s*\}\}/gi, '[Código DEA]')
    .replace(/\{\{\s*municipio_estado\s*\}\}/gi, '[Municipio y Estado]')
    .replace(/\{\{\s*nombre_director\s*\}\}/gi, '[Nombre Director]')
    .replace(/\{\{\s*fecha_actual\s*\}\}/gi, '[Fecha Actual]')
    .replace(/\{\{\s*dia_actual\s*\}\}/gi, '[Día Actual]')
    .replace(/\{\{\s*mes_actual\s*\}\}/gi, '[Mes Actual]')
    .replace(/\{\{\s*anio_actual\s*\}\}/gi, '[Año Actual]');
}

async obtenerPlantillas() {
  if (this.mysql.isConnected) {
    const rows = await this.mysql.obtenerPlantillas();
    if (rows && rows.length > 0) return rows;
  }
  if (!this.data) this.init();
  if (!this.data.plantillas || this.data.plantillas.length === 0) {
    this.data.plantillas = this.generarPlantillasBase();
    this.guardarEnDisco();
  } else {
    let huboCambios = false;
    this.data.plantillas = this.data.plantillas.map(tpl => {
      const c = this.limpiarLlavesPlantilla(tpl.cuerpo);
      const e = this.limpiarLlavesPlantilla(tpl.encabezado);
      const p = this.limpiarLlavesPlantilla(tpl.piePagina);
      if (c !== tpl.cuerpo || e !== tpl.encabezado || p !== tpl.piePagina) {
        huboCambios = true;
        return { ...tpl, cuerpo: c, encabezado: e, piePagina: p };
      }
      return tpl;
    });
    if (huboCambios) {
      this.guardarEnDisco();
    }
  }
  return this.data.plantillas;
}

async guardarPlantilla(plantillaData) {
  if (this.mysql.isConnected) {
    await this.mysql.guardarPlantilla(plantillaData);
  }
  if (!this.data) this.init();
  if (!this.data.plantillas) this.data.plantillas = [];

  if (plantillaData.id) {
    const index = this.data.plantillas.findIndex(p => p.id === plantillaData.id);
    if (index !== -1) {
      this.data.plantillas[index] = {
        ...this.data.plantillas[index],
        ...plantillaData,
        actualizadoEn: new Date().toISOString()
      };
      this.guardarEnDisco();
      return { success: true, plantilla: this.data.plantillas[index] };
    }
  }

  const nuevaPlantilla = {
    ...plantillaData,
    id: plantillaData.id || `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    creadoEn: new Date().toISOString()
  };

  this.data.plantillas.push(nuevaPlantilla);
  this.guardarEnDisco();
  return { success: true, plantilla: nuevaPlantilla };
}

async eliminarPlantilla(id) {
  if (this.mysql.isConnected) {
    await this.mysql.eliminarPlantilla(id);
  }
  if (!this.data) this.init();
  if (!this.data.plantillas) return { success: false, message: "No hay plantillas registradas" };

  const antes = this.data.plantillas.length;
  this.data.plantillas = this.data.plantillas.filter(p => p.id !== id);
  const eliminada = this.data.plantillas.length < antes;

  if (eliminada) {
    this.guardarEnDisco();
    return { success: true };
  }
  return { success: false, message: "Plantilla no encontrada" };
}

resetearPlantillasDefecto() {
  if (!this.data) this.init();
  this.data.plantillas = this.generarPlantillasBase();
  this.guardarEnDisco();
  return { success: true, total: this.data.plantillas.length };
}

}

module.exports = new LocalDB();