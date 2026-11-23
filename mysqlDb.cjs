const mysql = require('mysql2/promise');

class MySQLDatabase {
  constructor() {
    this.pool = null;
    this.isConnected = false;
    this.config = {
      host: 'localhost',
      user: 'root',
      password: 'admin123',
      database: 'sistema_escolar',
      port: 3306,
      waitForConnections: true,
      connectionLimit: 15,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    };
  }

  async init() {
    try {
      this.pool = mysql.createPool(this.config);
      const conn = await this.pool.getConnection();
      console.log("🟢 Conexión exitosa a MySQL Server 8.0 (sistema_escolar)");
      conn.release();
      this.isConnected = true;
      return true;
    } catch (error) {
      console.warn("⚠️ No se pudo conectar a MySQL Server:", error.message);
      this.isConnected = false;
      return false;
    }
  }

  // ==========================================
  // CONFIGURACIÓN DEL SISTEMA
  // ==========================================
  async getConfig() {
    if (!this.isConnected) return null;
    try {
      const [rows] = await this.pool.query("SELECT * FROM configuracion WHERE id = 1 LIMIT 1");
      if (rows.length === 0) return null;
      const r = rows[0];
      return {
        nombre_colegio: r.nombre_colegio,
        codigo_dea: r.codigo_dea,
        periodo: r.periodo,
        direccion: r.direccion || '',
        telefono: r.telefono || '',
        email: r.email || '',
        director: r.director_nombre || 'Lic. Dirección del Plantel',
        director_ci: r.director_ci || '',
        lapsos: typeof r.lapsos_config === 'string' ? JSON.parse(r.lapsos_config) : (r.lapsos_config || { lapso1: 30, lapso2: 30, lapso3: 40 })
      };
    } catch (e) {
      console.error("Error en getConfig MySQL:", e);
      return null;
    }
  }

  async updateConfig(nuevosDatos) {
    if (!this.isConnected) return { success: false };
    try {
      const current = await this.getConfig() || {};
      const merged = { ...current, ...nuevosDatos };
      await this.pool.query(`
        INSERT INTO configuracion (
          id, nombre_colegio, codigo_dea, periodo, direccion, telefono, email, director_nombre, lapsos_config
        ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          nombre_colegio = VALUES(nombre_colegio),
          codigo_dea = VALUES(codigo_dea),
          periodo = VALUES(periodo),
          direccion = VALUES(direccion),
          telefono = VALUES(telefono),
          email = VALUES(email),
          director_nombre = VALUES(director_nombre),
          lapsos_config = VALUES(lapsos_config)
      `, [
        merged.nombre_colegio || 'Unidad Educativa República de Chile',
        merged.codigo_dea || 'OD01461703',
        merged.periodo || '2025-2026',
        merged.direccion || '',
        merged.telefono || '',
        merged.email || '',
        merged.director || 'Lic. Dirección del Plantel',
        JSON.stringify(merged.lapsos || { lapso1: 30, lapso2: 30, lapso3: 40 })
      ]);
      return { success: true };
    } catch (e) {
      console.error("Error en updateConfig MySQL:", e);
      return { success: false, error: e.message };
    }
  }

  // ==========================================
  // USUARIOS DEL SISTEMA
  // ==========================================
  async getUsuario(identificador) {
    if (!this.isConnected) return null;
    try {
      const [rows] = await this.pool.query(
        "SELECT * FROM usuarios WHERE (username = ? OR email = ?) AND activo = 1 LIMIT 1",
        [identificador, identificador]
      );
      return rows[0] || null;
    } catch (e) {
      console.error("Error en getUsuario MySQL:", e);
      return null;
    }
  }

  async verificarDuplicado(username, email) {
    if (!this.isConnected) return false;
    try {
      const [rows] = await this.pool.query(
        "SELECT id FROM usuarios WHERE username = ? OR email = ? LIMIT 1",
        [username, email]
      );
      return rows.length > 0;
    } catch (e) {
      console.error("Error en verificarDuplicado MySQL:", e);
      return false;
    }
  }

  async crearUsuario(nuevoUsuario) {
    if (!this.isConnected) return null;
    try {
      const id = nuevoUsuario.id || `usr_${Date.now()}`;
      await this.pool.query(`
        INSERT INTO usuarios (id, nombre, username, email, password, rol, activo)
        VALUES (?, ?, ?, ?, ?, ?, 1)
      `, [
        id,
        nuevoUsuario.nombre || nuevoUsuario.username,
        nuevoUsuario.username,
        nuevoUsuario.email,
        nuevoUsuario.password,
        nuevoUsuario.rol || 'administrador'
      ]);
      return { id, ...nuevoUsuario, rol: nuevoUsuario.rol || 'administrador' };
    } catch (e) {
      console.error("Error en crearUsuario MySQL:", e);
      return null;
    }
  }

  async actualizarUsuario(id, datosNuevos) {
    if (!this.isConnected) return { success: false };
    try {
      const updates = [];
      const values = [];
      if (datosNuevos.nombre) { updates.push("nombre = ?"); values.push(datosNuevos.nombre); }
      if (datosNuevos.email) { updates.push("email = ?"); values.push(datosNuevos.email); }
      if (datosNuevos.password) { updates.push("password = ?"); values.push(datosNuevos.password); }
      if (datosNuevos.rol) { updates.push("rol = ?"); values.push(datosNuevos.rol); }

      if (updates.length === 0) return { success: true };
      values.push(id);
      await this.pool.query(`UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`, values);
      return { success: true };
    } catch (e) {
      console.error("Error en actualizarUsuario MySQL:", e);
      return { success: false, error: e.message };
    }
  }

  async recuperarPassword(email) {
    if (!this.isConnected) return { success: false, mensaje: "Base de datos fuera de línea" };
    try {
      const [rows] = await this.pool.query("SELECT email FROM usuarios WHERE email = ? LIMIT 1", [email]);
      if (rows.length > 0) {
        return { success: true, mensaje: "Correo de recuperación procesado" };
      }
      return { success: false, mensaje: "El correo no está registrado en el sistema" };
    } catch (e) {
      return { success: false, mensaje: e.message };
    }
  }

  // ==========================================
  // ESTUDIANTES Y MATRÍCULA
  // ==========================================
  formatearEstudianteFrontend(row) {
    if (!row) return null;
    return {
      id: row.id,
      ci: row.ci || '',
      id_escolar: row.id_escolar || row.id,
      firstName: row.primer_nombre,
      secondName: row.segundo_nombre || '',
      lastName: row.primer_apellido,
      secondLastName: row.segundo_apellido || '',
      nombre: `${row.primer_nombre} ${row.primer_apellido}`,
      birthDate: row.fecha_nacimiento ? (row.fecha_nacimiento.toISOString ? row.fecha_nacimiento.toISOString().split('T')[0] : String(row.fecha_nacimiento).split('T')[0]) : '',
      age: String(row.edad || 0),
      gender: row.genero || 'Femenino',
      placeOfBirth: row.lugar_nacimiento || '',
      entity: row.entidad_nacimiento || '',
      country: row.pais_nacimiento || 'Venezuela',
      address: row.direccion || '',
      municipality: row.municipio || '',
      parish: row.parroquia || '',
      sector: row.sector || '',
      email: row.email || '',
      level: row.nivel,
      nivel: row.nivel,
      grade: row.grado,
      section: row.seccion,
      schoolYear: row.periodo_escolar,
      periodo: row.periodo_escolar,
      status: row.estatus,
      estatus: row.estatus,
      admissionDate: row.fecha_ingreso ? (row.fecha_ingreso.toISOString ? row.fecha_ingreso.toISOString().split('T')[0] : String(row.fecha_ingreso).split('T')[0]) : '',
      previousSchool: row.colegio_procedencia || '',
      deaCode: row.codigo_dea_procedencia || '',
      repeatsYear: row.repite_grado || 'No',
      lastRepeatedGrade: row.ultimo_grado_repetido || '',
      lastRepeatedTerm: row.ultimo_lapso_repetido || '',
      repeatReason: row.motivo_repeticion || '',
      pendingSubjects: row.materias_pendientes || '',
      isTransfer: Boolean(row.es_traslado),
      lastSchoolName: row.colegio_traslado || '',
      lastGradeCompleted: row.grado_traslado || '',
      lastTermCompleted: row.lapso_traslado || '',
      transferObservations: row.observaciones_traslado || '',
      bloodType: row.grupo_sanguineo || '',
      height: row.estatura || '',
      weight: row.peso || '',
      shirtSize: row.talla_camisa || '',
      pantsSize: row.talla_pantalon || '',
      shoeSize: row.talla_calzado || '',
      allergies: row.alergias || '',
      medicalCondition: row.condicion_medica || '',
      representante_id: row.representante_id,
      repName: row.rep_nombre || '',
      repFirstName: row.rep_nombre ? row.rep_nombre.split(' ')[0] : '',
      repLastName: row.rep_nombre ? row.rep_nombre.split(' ').slice(1).join(' ') : '',
      repCI: row.rep_ci || '',
      repCedula: row.rep_ci || '',
      repPhone: row.rep_telefono || '',
      relationship: row.rep_parentesco || '',
      motherName: row.madre_nombre || '',
      motherFirstName: row.madre_nombre ? row.madre_nombre.split(' ')[0] : '',
      motherLastName: row.madre_nombre ? row.madre_nombre.split(' ').slice(1).join(' ') : '',
      motherCI: row.madre_ci || '',
      motherPhone: row.madre_telefono || '',
      fatherName: row.padre_nombre || '',
      fatherFirstName: row.padre_nombre ? row.padre_nombre.split(' ')[0] : '',
      fatherLastName: row.padre_nombre ? row.padre_nombre.split(' ').slice(1).join(' ') : '',
      fatherCI: row.padre_ci || '',
      fatherPhone: row.padre_telefono || '',
      obsPersonal: row.obs_personal || '',
      obsFamiliar: row.obs_familiar || '',
      obsSalud: row.obs_salud || '',
      observations: row.observaciones || '',
      studentPhoto: row.foto_estudiante || null,
      repPhoto: row.foto_representante || null,
      inscriptionFiles: typeof row.archivos_inscripcion === 'string' ? JSON.parse(row.archivos_inscripcion) : (row.archivos_inscripcion || []),
      transferFiles: typeof row.archivos_traslado === 'string' ? JSON.parse(row.archivos_traslado) : (row.archivos_traslado || []),
      creado_en: row.creado_en,
      actualizado_en: row.actualizado_en
    };
  }

  async obtenerEstudiantes() {
    if (!this.isConnected) return [];
    try {
      const [rows] = await this.pool.query("SELECT * FROM estudiantes ORDER BY creado_en DESC");
      return rows.map(r => this.formatearEstudianteFrontend(r));
    } catch (e) {
      console.error("Error en obtenerEstudiantes MySQL:", e);
      return [];
    }
  }

  async contarHermanosPorBase(baseID) {
    if (!this.isConnected) return 0;
    try {
      const [rows] = await this.pool.query(
        "SELECT COUNT(*) AS total FROM estudiantes WHERE id LIKE ?",
        [`${baseID}%`]
      );
      return rows[0].total || 0;
    } catch (e) {
      console.error("Error en contarHermanosPorBase MySQL:", e);
      return 0;
    }
  }

  async guardarEstudiante(est) {
    if (!this.isConnected) return { success: false, mensaje: "Base de datos fuera de línea" };
    try {
      let repId = null;
      const repCI = est.repCI || est.repCedula || null;
      const repFirstName = est.repFirstName || (est.repName ? est.repName.split(' ')[0] : 'Representante');
      const repLastName = est.repLastName || (est.repName ? est.repName.split(' ').slice(1).join(' ') : 'Legal');
      const repFullName = est.repName || `${repFirstName} ${repLastName}`.trim();
      const repPhone = est.repPhone || null;
      const relationship = est.relationship || 'Representante';

      if (repCI || est.repName || est.repFirstName) {
        repId = repCI ? `REP-${repCI.replace(/\D/g, '')}` : `REP-${est.id}`;
        await this.pool.query(`
          INSERT INTO representantes (
            id, ci, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
            nombre_completo, parentesco, telefono, direccion, foto_url
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            primer_nombre = VALUES(primer_nombre),
            primer_apellido = VALUES(primer_apellido),
            nombre_completo = VALUES(nombre_completo),
            parentesco = VALUES(parentesco),
            telefono = VALUES(telefono),
            foto_url = VALUES(foto_url)
        `, [
          repId, repCI, repFirstName, null, repLastName, null,
          repFullName, relationship, repPhone, est.address || null, est.repPhoto || null
        ]);
      }

      const primerNombre = est.firstName || (est.nombre ? est.nombre.split(' ')[0] : 'Estudiante');
      const segundoNombre = est.secondName || (est.nombre && est.nombre.split(' ').length > 1 ? est.nombre.split(' ')[1] : null);
      const primerApellido = est.lastName || (est.apellido ? est.apellido.split(' ')[0] : 'S/A');
      const segundoApellido = est.secondLastName || (est.apellido && est.apellido.split(' ').length > 1 ? est.apellido.split(' ')[1] : null);
      const nombreCompleto = `${primerNombre} ${segundoNombre || ''} ${primerApellido} ${segundoApellido || ''}`.replace(/\s+/g, ' ').trim();

      let fechaNac = null;
      if (est.birthDate && est.birthDate.length >= 8) {
        const parts = est.birthDate.split('-');
        if (parts.length === 3 && parts[0].length === 4) fechaNac = est.birthDate;
      }

      let fechaIngreso = null;
      if (est.admissionDate && est.admissionDate.length >= 8) {
        const p = est.admissionDate.split('T')[0];
        if (p.split('-').length === 3) fechaIngreso = p;
      }

      await this.pool.query(`
        INSERT INTO estudiantes (
          id, ci, id_escolar, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
          nombre_completo, fecha_nacimiento, edad, genero, lugar_nacimiento, entidad_nacimiento,
          pais_nacimiento, direccion, municipio, parroquia, sector, email,
          nivel, grado, seccion, periodo_escolar, estatus, fecha_ingreso,
          colegio_procedencia, codigo_dea_procedencia, repite_grado, materias_pendientes,
          es_traslado, colegio_traslado, grupo_sanguineo, estatura, peso,
          talla_camisa, talla_pantalon, talla_calzado, alergias, condicion_medica,
          representante_id, rep_nombre, rep_ci, rep_telefono, rep_parentesco,
          madre_nombre, madre_ci, madre_telefono, padre_nombre, padre_ci, padre_telefono,
          obs_personal, obs_familiar, obs_salud, observaciones,
          foto_estudiante, foto_representante, archivos_inscripcion, archivos_traslado
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?
        )
        ON DUPLICATE KEY UPDATE
          ci = VALUES(ci),
          primer_nombre = VALUES(primer_nombre),
          segundo_nombre = VALUES(segundo_nombre),
          primer_apellido = VALUES(primer_apellido),
          segundo_apellido = VALUES(segundo_apellido),
          nombre_completo = VALUES(nombre_completo),
          fecha_nacimiento = VALUES(fecha_nacimiento),
          edad = VALUES(edad),
          genero = VALUES(genero),
          lugar_nacimiento = VALUES(lugar_nacimiento),
          direccion = VALUES(direccion),
          nivel = VALUES(nivel),
          grado = VALUES(grado),
          seccion = VALUES(seccion),
          periodo_escolar = VALUES(periodo_escolar),
          estatus = VALUES(estatus),
          grupo_sanguineo = VALUES(grupo_sanguineo),
          estatura = VALUES(estatura),
          peso = VALUES(peso),
          talla_camisa = VALUES(talla_camisa),
          talla_pantalon = VALUES(talla_pantalon),
          talla_calzado = VALUES(talla_calzado),
          alergias = VALUES(alergias),
          condicion_medica = VALUES(condicion_medica),
          representante_id = VALUES(representante_id),
          rep_nombre = VALUES(rep_nombre),
          rep_ci = VALUES(rep_ci),
          rep_telefono = VALUES(rep_telefono),
          rep_parentesco = VALUES(rep_parentesco),
          madre_nombre = VALUES(madre_nombre),
          madre_ci = VALUES(madre_ci),
          madre_telefono = VALUES(madre_telefono),
          padre_nombre = VALUES(padre_nombre),
          padre_ci = VALUES(padre_ci),
          padre_telefono = VALUES(padre_telefono),
          obs_personal = VALUES(obs_personal),
          obs_familiar = VALUES(obs_familiar),
          obs_salud = VALUES(obs_salud),
          observaciones = VALUES(observaciones),
          foto_estudiante = VALUES(foto_estudiante),
          foto_representante = VALUES(foto_representante),
          archivos_inscripcion = VALUES(archivos_inscripcion),
          archivos_traslado = VALUES(archivos_traslado)
      `, [
        est.id,
        est.ci || null,
        est.id_escolar || est.id,
        primerNombre,
        segundoNombre,
        primerApellido,
        segundoApellido,
        nombreCompleto,
        fechaNac,
        parseInt(est.age, 10) || 0,
        est.gender || 'Femenino',
        est.placeOfBirth || null,
        est.entity || null,
        est.country || 'Venezuela',
        est.address || 'El Espinal, Municipio Díaz',
        est.municipality || 'Díaz',
        est.parish || null,
        est.sector || null,
        est.email || null,
        est.nivel || est.level || 'Secundaria',
        est.grade || '1er Año',
        est.section || 'A',
        est.schoolYear || est.periodo || '2025-2026',
        est.status || est.estatus || 'Inscrito',
        fechaIngreso,
        est.previousSchool || 'U.E. República de Chile',
        est.deaCode || 'OD01461703',
        est.repeatsYear || 'No',
        est.pendingSubjects || null,
        est.isTransfer ? 1 : 0,
        est.lastSchoolName || null,
        est.bloodType || null,
        est.height ? String(est.height) : null,
        est.weight ? String(est.weight) : null,
        est.shirtSize || null,
        est.pantsSize || null,
        est.shoeSize || null,
        est.allergies || null,
        est.medicalCondition || null,
        repId,
        repFullName,
        repCI,
        repPhone,
        relationship,
        est.motherName || (est.motherFirstName ? `${est.motherFirstName} ${est.motherLastName || ''}`.trim() : null),
        est.motherCI || null,
        est.motherPhone || null,
        est.fatherName || (est.fatherFirstName ? `${est.fatherFirstName} ${est.fatherLastName || ''}`.trim() : null),
        est.fatherCI || null,
        est.fatherPhone || null,
        est.obsPersonal || null,
        est.obsFamiliar || null,
        est.obsSalud || null,
        est.observations || null,
        est.studentPhoto || null,
        est.repPhoto || null,
        est.inscriptionFiles ? JSON.stringify(est.inscriptionFiles) : null,
        est.transferFiles ? JSON.stringify(est.transferFiles) : null
      ]);

      return { success: true, id: est.id };
    } catch (e) {
      console.error("Error en guardarEstudiante MySQL:", e);
      return { success: false, error: e.message };
    }
  }

  async actualizarEstudiante(id, datosNuevos) {
    if (!this.isConnected) return { success: false };
    return this.guardarEstudiante({ ...datosNuevos, id });
  }

  async eliminarEstudiante(id) {
    if (!this.isConnected) return { success: false };
    try {
      const [result] = await this.pool.query("DELETE FROM estudiantes WHERE id = ?", [id]);
      return { success: result.affectedRows > 0 };
    } catch (e) {
      console.error("Error en eliminarEstudiante MySQL:", e);
      return { success: false, error: e.message };
    }
  }

  // ==========================================
  // PENSUM Y MALLA CURRICULAR (Código de Materia como Clave Única)
  // ==========================================
  async obtenerPensum(filtro = {}) {
    if (!this.isConnected) return [];
    try {
      let query = `
        SELECT id, codigo, nombre, grado, nivel, periodo,
               horas_semanales AS horasSemanales, area,
               otra_area_descripcion AS otraAreaDescripcion, descripcion
        FROM pensum_materias
      `;
      const clauses = [];
      const values = [];

      if (filtro.periodo) {
        clauses.push("periodo = ?");
        values.push(filtro.periodo);
      }
      if (filtro.nivel) {
        clauses.push("nivel = ?");
        values.push(filtro.nivel);
      }
      if (filtro.grado) {
        clauses.push("grado = ?");
        values.push(filtro.grado);
      }

      if (clauses.length > 0) {
        query += " WHERE " + clauses.join(" AND ");
      }
      query += " ORDER BY grado ASC, nombre ASC";

      const [rows] = await this.pool.query(query, values);
      return rows;
    } catch (e) {
      console.error("Error en obtenerPensum MySQL:", e);
      return [];
    }
  }

  async guardarMateriaPensum(m) {
    if (!this.isConnected) return { success: false };
    try {
      const codigoUnico = (m.codigo || m.id || 'MAT').trim().toUpperCase();
      if (m.previousId && m.previousId !== codigoUnico) {
        await this.pool.query("DELETE FROM pensum_materias WHERE id = ? OR codigo = ?", [m.previousId, m.previousId]);
      }
      await this.pool.query(`
        INSERT INTO pensum_materias (
          id, codigo, nombre, grado, nivel, periodo, horas_semanales,
          area, otra_area_descripcion, descripcion
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          codigo = VALUES(codigo),
          nombre = VALUES(nombre),
          grado = VALUES(grado),
          nivel = VALUES(nivel),
          periodo = VALUES(periodo),
          horas_semanales = VALUES(horas_semanales),
          area = VALUES(area),
          otra_area_descripcion = VALUES(otra_area_descripcion),
          descripcion = VALUES(descripcion)
      `, [
        codigoUnico,
        codigoUnico,
        m.nombre,
        m.grado,
        m.nivel || 'Secundaria',
        m.periodo || '2025-2026',
        parseInt(m.horasSemanales, 10) || 4,
        m.area || 'General',
        m.otraAreaDescripcion || null,
        m.descripcion || null
      ]);
      return { success: true, materia: { ...m, id: codigoUnico, codigo: codigoUnico } };
    } catch (e) {
      console.error("Error en guardarMateriaPensum MySQL:", e);
      return { success: false, error: e.message };
    }
  }

  async eliminarMateriaPensum(codigoOrId) {
    if (!this.isConnected) return { success: false };
    try {
      const [res] = await this.pool.query("DELETE FROM pensum_materias WHERE codigo = ? OR id = ?", [codigoOrId, codigoOrId]);
      return { success: res.affectedRows > 0 };
    } catch (e) {
      console.error("Error en eliminarMateriaPensum MySQL:", e);
      return { success: false, error: e.message };
    }
  }

  async clonarPensumPeriodo(periodoOrigen, periodoDestino) {
    if (!this.isConnected) return { success: false };
    try {
      const [origenRows] = await this.pool.query(
        "SELECT * FROM pensum_materias WHERE periodo = ?",
        [periodoOrigen]
      );
      if (origenRows.length === 0) {
        return { success: false, message: `No hay materias registradas en ${periodoOrigen}` };
      }

      await this.pool.query("DELETE FROM pensum_materias WHERE periodo = ?", [periodoDestino]);

      for (let i = 0; i < origenRows.length; i++) {
        const m = origenRows[i];
        const codKey = m.codigo || m.id;
        await this.pool.query(`
          INSERT INTO pensum_materias (
            id, codigo, nombre, grado, nivel, periodo, horas_semanales, area, otra_area_descripcion, descripcion
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          codKey, m.codigo || codKey, m.nombre, m.grado, m.nivel, periodoDestino,
          m.horas_semanales, m.area, m.otra_area_descripcion, m.descripcion
        ]);
      }
      return { success: true, total: origenRows.length };
    } catch (e) {
      console.error("Error en clonarPensumPeriodo MySQL:", e);
      return { success: false, error: e.message };
    }
  }

  // ==========================================
  // REGISTRO DE NOTAS POR SECCIÓN
  // ==========================================
  async guardarNotasSeccion(datos) {
    if (!this.isConnected) return { success: false };
    try {
      const { seccionId, materia, planificacion, notas } = datos;
      const id = `${seccionId}_${materia}`;

      await this.pool.query(`
        INSERT INTO registro_notas_seccion (
          id, seccion_id, materia, planificacion_json, notas_json
        ) VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          planificacion_json = VALUES(planificacion_json),
          notas_json = VALUES(notas_json)
      `, [
        id,
        seccionId,
        materia,
        JSON.stringify(planificacion || {}),
        JSON.stringify(notas || {})
      ]);
      return { success: true };
    } catch (e) {
      console.error("Error en guardarNotasSeccion MySQL:", e);
      return { success: false, error: e.message };
    }
  }

  async obtenerNotasSeccion(seccionId, materia) {
    if (!this.isConnected) return null;
    try {
      const [rows] = await this.pool.query(
        "SELECT * FROM registro_notas_seccion WHERE seccion_id = ? AND materia = ? LIMIT 1",
        [seccionId, materia]
      );
      if (rows.length === 0) return null;
      const r = rows[0];
      return {
        seccionId: r.seccion_id,
        materia: r.materia,
        planificacion: typeof r.planificacion_json === 'string' ? JSON.parse(r.planificacion_json) : r.planificacion_json,
        notas: typeof r.notas_json === 'string' ? JSON.parse(r.notas_json) : r.notas_json,
        ultima_modificacion: r.ultima_modificacion
      };
    } catch (e) {
      console.error("Error en obtenerNotasSeccion MySQL:", e);
      return null;
    }
  }

  // ==========================================
  // PLANTILLAS DE DOCUMENTOS
  // ==========================================
  async obtenerPlantillas() {
    if (!this.isConnected) return [];
    try {
      const [rows] = await this.pool.query("SELECT * FROM plantillas_documentos ORDER BY nombre ASC");
      return rows.map(t => {
        let parsedLogoSettings = null;
        if (t.logo_settings) {
          try {
            parsedLogoSettings = typeof t.logo_settings === 'string' ? JSON.parse(t.logo_settings) : t.logo_settings;
          } catch {}
        }
        return {
          id: t.id,
          codigo: t.codigo || '',
          nombre: t.nombre,
          categoria: t.categoria,
          descripcion: t.descripcion || '',
          encabezado: t.encabezado || '',
          titulo: t.titulo,
          cuerpo: t.cuerpo,
          piePagina: t.pie_pagina || '',
          paperSize: t.paper_size || 'Carta',
          logoSettings: parsedLogoSettings,
          creadoEn: t.creado_en
        };
      });
    } catch (e) {
      console.error("Error en obtenerPlantillas MySQL:", e);
      return [];
    }
  }

  async guardarPlantilla(t) {
    if (!this.isConnected) return { success: false };
    try {
      const id = t.id || `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const logoSettingsStr = t.logoSettings ? JSON.stringify(t.logoSettings) : null;
      const paperSizeVal = t.paperSize || 'Carta';
      await this.pool.query(`
        INSERT INTO plantillas_documentos (
          id, codigo, nombre, categoria, descripcion, encabezado, titulo, cuerpo, pie_pagina, paper_size, logo_settings
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          codigo = VALUES(codigo),
          nombre = VALUES(nombre),
          categoria = VALUES(categoria),
          descripcion = VALUES(descripcion),
          encabezado = VALUES(encabezado),
          titulo = VALUES(titulo),
          cuerpo = VALUES(cuerpo),
          pie_pagina = VALUES(pie_pagina),
          paper_size = VALUES(paper_size),
          logo_settings = VALUES(logo_settings)
      `, [
        id,
        t.codigo || null,
        t.nombre,
        t.categoria || 'Acreditación',
        t.descripcion || null,
        t.encabezado || null,
        t.titulo || 'CONSTANCIA INSTITUCIONAL',
        t.cuerpo,
        t.piePagina || null,
        paperSizeVal,
        logoSettingsStr
      ]);
      return { success: true, plantilla: { ...t, id } };
    } catch (e) {
      console.error("Error en guardarPlantilla MySQL:", e);
      return { success: false, error: e.message };
    }
  }

  async eliminarPlantilla(id) {
    if (!this.isConnected) return { success: false };
    try {
      const [res] = await this.pool.query("DELETE FROM plantillas_documentos WHERE id = ?", [id]);
      return { success: res.affectedRows > 0 };
    } catch (e) {
      console.error("Error en eliminarPlantilla MySQL:", e);
      return { success: false, error: e.message };
    }
  }
}

module.exports = new MySQLDatabase();
