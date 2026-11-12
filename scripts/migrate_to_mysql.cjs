const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: 'admin123',
  database: 'sistema_escolar',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10
};

async function migrate() {
  console.log("=== INICIANDO MIGRACIÓN JSON A MYSQL ===");
  
  const jsonPath = path.join(process.env.APPDATA, 'Electron', 'sistema_escolar_db.json');
  if (!fs.existsSync(jsonPath)) {
    console.error("No se encontró el archivo JSON en:", jsonPath);
    process.exit(1);
  }

  const raw = fs.readFileSync(jsonPath, 'utf-8');
  const data = JSON.parse(raw);
  console.log("Archivo JSON cargado exitosamente.");

  const pool = mysql.createPool(DB_CONFIG);

  try {
    const conn = await pool.getConnection();
    console.log("✅ Conexión establecida con MySQL Server 8.0 en sistema_escolar.");
    conn.release();

    // 1. CONFIGURACIÓN
    console.log("\n[1/6] Migrando Configuración...");
    const cfg = data.configuracion || {};
    await pool.query(`
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
      cfg.nombre_colegio || 'Unidad Educativa República de Chile',
      cfg.codigo_dea || 'OD01461703',
      cfg.periodo || '2025-2026',
      cfg.direccion || '',
      cfg.telefono || '',
      cfg.email || '',
      cfg.director || 'Lic. Dirección del Plantel',
      JSON.stringify(cfg.lapsos || { lapso1: 30, lapso2: 30, lapso3: 40 })
    ]);
    console.log("✅ Configuración guardada en MySQL.");

    // 2. USUARIOS
    console.log("\n[2/6] Migrando Usuarios...");
    const usuarios = data.usuarios || [];
    for (const u of usuarios) {
      await pool.query(`
        INSERT INTO usuarios (id, nombre, username, email, password, rol, activo)
        VALUES (?, ?, ?, ?, ?, ?, 1)
        ON DUPLICATE KEY UPDATE
          nombre = VALUES(nombre),
          email = VALUES(email),
          password = VALUES(password),
          rol = VALUES(rol)
      `, [
        u.id || `usr_${Date.now()}`,
        u.nombre || 'Usuario',
        u.username,
        u.email || `${u.username}@escuela.com`,
        u.password,
        u.rol || 'director'
      ]);
    }
    console.log(`✅ ${usuarios.length} usuario(s) migrado(s).`);

    // 3. DOCENTES
    console.log("\n[3/6] Migrando Docentes...");
    const docentes = data.docentes || [];
    for (const d of docentes) {
      await pool.query(`
        INSERT INTO docentes (
          id, usuario_id, ci, nombre, apellido, email, telefono, direccion,
          nivel, grado_asignado, seccion_asignada, especialidad, es_especialista,
          estatus, materias_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          nombre = VALUES(nombre),
          apellido = VALUES(apellido),
          email = VALUES(email),
          telefono = VALUES(telefono),
          nivel = VALUES(nivel),
          grado_asignado = VALUES(grado_asignado),
          seccion_asignada = VALUES(seccion_asignada),
          estatus = VALUES(estatus),
          materias_json = VALUES(materias_json)
      `, [
        d.id,
        d.usuario_id || null,
        d.ci,
        d.nombre,
        d.apellido,
        d.email || null,
        d.telefono || null,
        d.direccion || null,
        d.nivel || 'Primaria',
        d.grado_asignado || null,
        d.seccion_asignada || null,
        d.especialidad || null,
        d.es_especialista ? 1 : 0,
        d.estatus || 'Activo',
        d.materias ? JSON.stringify(d.materias) : null
      ]);
    }
    console.log(`✅ ${docentes.length} docente(s) migrado(s).`);

    // 4. ESTUDIANTES Y REPRESENTANTES
    console.log("\n[4/6] Migrando Estudiantes y Representantes...");
    const estudiantes = data.estudiantes || [];
    let repCount = 0;

    for (const est of estudiantes) {
      let repId = null;

      // Extraer datos del representante
      const repCI = est.repCI || est.repCedula || null;
      const repFirstName = est.repFirstName || (est.repName ? est.repName.split(' ')[0] : 'Representante');
      const repLastName = est.repLastName || (est.repName ? est.repName.split(' ').slice(1).join(' ') : 'Legal');
      const repFullName = est.repName || `${repFirstName} ${repLastName}`.trim();
      const repPhone = est.repPhone || null;
      const relationship = est.relationship || 'Representante';

      if (repCI || est.repName || est.repFirstName) {
        repId = repCI ? `REP-${repCI.replace(/\D/g, '')}` : `REP-${est.id}`;
        
        await pool.query(`
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
          repId,
          repCI,
          repFirstName,
          null,
          repLastName,
          null,
          repFullName,
          relationship,
          repPhone,
          est.address || null,
          est.repPhoto || null
        ]);
        repCount++;
      }

      // Nombres de estudiante
      const primerNombre = est.firstName || (est.nombre ? est.nombre.split(' ')[0] : 'Estudiante');
      const segundoNombre = est.secondName || (est.nombre && est.nombre.split(' ').length > 1 ? est.nombre.split(' ')[1] : null);
      const primerApellido = est.lastName || (est.apellido ? est.apellido.split(' ')[0] : 'S/A');
      const segundoApellido = est.secondLastName || (est.apellido && est.apellido.split(' ').length > 1 ? est.apellido.split(' ')[1] : null);
      const nombreCompleto = `${primerNombre} ${segundoNombre || ''} ${primerApellido} ${segundoApellido || ''}`.replace(/\s+/g, ' ').trim();

      // Formato fecha nacimiento seguro
      let fechaNac = null;
      if (est.birthDate && est.birthDate.length >= 8) {
        const parts = est.birthDate.split('-');
        if (parts.length === 3 && parts[0].length === 4) {
          fechaNac = est.birthDate;
        }
      }

      let fechaIngreso = null;
      if (est.admissionDate && est.admissionDate.length >= 8) {
        const p = est.admissionDate.split('T')[0];
        if (p.split('-').length === 3) fechaIngreso = p;
      }

      await pool.query(`
        INSERT INTO estudiantes (
          id, ci, id_escolar, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
          nombre_completo, fecha_nacimiento, edad, genero, lugar_nacimiento, entidad_nacimiento,
          pais_nacimiento, direccion, municipio, parroquia, sector, email,
          nivel, grado, seccion, periodo_escolar, estatus, fecha_ingreso, docente_guia,
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
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?
        )
        ON DUPLICATE KEY UPDATE
          primer_nombre = VALUES(primer_nombre),
          primer_apellido = VALUES(primer_apellido),
          nombre_completo = VALUES(nombre_completo),
          ci = VALUES(ci),
          nivel = VALUES(nivel),
          grado = VALUES(grado),
          seccion = VALUES(seccion),
          periodo_escolar = VALUES(periodo_escolar),
          estatus = VALUES(estatus),
          representante_id = VALUES(representante_id),
          foto_estudiante = VALUES(foto_estudiante)
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
        est.guideTeacher || null,
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
    }
    console.log(`✅ ${estudiantes.length} estudiante(s) y ${repCount} representante(s) migrado(s).`);

    // 5. PENSUM
    console.log("\n[5/6] Migrando Malla Curricular (Pensum)...");
    const pensum = data.pensum || [];
    for (const m of pensum) {
      await pool.query(`
        INSERT INTO pensum_materias (
          id, codigo, nombre, grado, nivel, periodo, horas_semanales,
          area, otra_area_descripcion, descripcion
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          nombre = VALUES(nombre),
          codigo = VALUES(codigo),
          grado = VALUES(grado),
          nivel = VALUES(nivel),
          periodo = VALUES(periodo),
          horas_semanales = VALUES(horas_semanales),
          area = VALUES(area),
          otra_area_descripcion = VALUES(otra_area_descripcion),
          descripcion = VALUES(descripcion)
      `, [
        m.id,
        m.codigo || 'MAT',
        m.nombre,
        m.grado,
        m.nivel || 'Secundaria',
        m.periodo || '2025-2026',
        parseInt(m.horasSemanales, 10) || 4,
        m.area || 'General',
        m.otraAreaDescripcion || null,
        m.descripcion || null
      ]);
    }
    console.log(`✅ ${pensum.length} asignaturas del pensum migradas.`);

    // 6. PLANTILLAS DE DOCUMENTOS
    console.log("\n[6/6] Migrando Plantillas Institucionales...");
    const plantillas = data.plantillas || [];
    for (const t of plantillas) {
      await pool.query(`
        INSERT INTO plantillas_documentos (
          id, codigo, nombre, categoria, descripcion, encabezado, titulo, cuerpo, pie_pagina
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          nombre = VALUES(nombre),
          codigo = VALUES(codigo),
          categoria = VALUES(categoria),
          descripcion = VALUES(descripcion),
          encabezado = VALUES(encabezado),
          titulo = VALUES(titulo),
          cuerpo = VALUES(cuerpo),
          pie_pagina = VALUES(pie_pagina)
      `, [
        t.id,
        t.codigo || null,
        t.nombre,
        t.categoria || 'Acreditación',
        t.descripcion || null,
        t.encabezado || null,
        t.titulo || 'CONSTANCIA INSTITUCIONAL',
        t.cuerpo,
        t.piePagina || null
      ]);
    }
    console.log(`✅ ${plantillas.length} plantilla(s) migrada(s).`);

    // 7. REGISTRO DE NOTAS POR SECCIÓN (si existen)
    if (data.registro_notas && data.registro_notas.length > 0) {
      console.log("\nMigrando Registros de Notas por Sección...");
      for (const rn of data.registro_notas) {
        const id = `${rn.seccionId}_${rn.materia}`;
        await pool.query(`
          INSERT INTO registro_notas_seccion (
            id, seccion_id, materia, planificacion_json, notas_json
          ) VALUES (?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            planificacion_json = VALUES(planificacion_json),
            notas_json = VALUES(notas_json)
        `, [
          id,
          rn.seccionId,
          rn.materia,
          JSON.stringify(rn.planificacion || {}),
          JSON.stringify(rn.notas || {})
        ]);
      }
      console.log(`✅ ${data.registro_notas.length} registro(s) de notas de sección migrado(s).`);
    }

    console.log("\n=== MIGRACIÓN A MYSQL COMPLETADA CON ÉXITO ===");
  } catch (err) {
    console.error("❌ Error durante la migración a MySQL:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
