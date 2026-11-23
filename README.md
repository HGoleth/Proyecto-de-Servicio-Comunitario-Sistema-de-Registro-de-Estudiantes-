# Sistema de Registro de Estudiantes SC 🎓

Sistema institucional de gestión escolar, registro académico y emisión automatizada de documentos para la **Unidad Educativa "República de Chile"** (El Espinal - Municipio Díaz - Estado Nueva Esparta, Código DEA: OD01461703).

Desarrollado como proyecto de **Servicio Comunitario (PSM)** por **HGoleth**.

---

## 🚀 Características Principales

### 1. 🔐 Autenticación y Perfiles
- Inicio de sesión seguro con roles administrativos y de dirección.
- Interfaz interactiva y moderna con personalización de perfil de usuario en tiempo real.

### 2. 📊 Panel de Control (Dashboard)
- Métricas e indicadores en tiempo real: total de estudiantes, representantes, secciones activas y distribución por nivel.
- Gráficas estadísticas de matrícula por nivel (Inicial, Primaria y Secundaria).
- Sincronización instantánea del período escolar activo en todo el sistema.

### 3. 📝 Gestión de Estudiantes y Representantes
- **Inscripción modular**: Registro por niveles (Inicial, Primaria, Secundaria) con datos médicos, académicos y familiares.
- **Expediente digital**: Consulta del historial completo, notas y condición académica del alumno.
- **Directorio de Representantes**: Búsqueda inteligente por nombre o cédula y vinculación directa con estudiantes matriculados.

### 4. 📚 Pensum de Estudios, Distribución Académica y Calificaciones
- **Pensum de Estudios**: Gestión de materias con el **Código de Materia como clave única (`PK`)**, área de formación y horas semanales.
- **Distribución Académica**: Organización de secciones por grado y consulta de malla curricular y nómina estudiantil.
- **Calificaciones**: Registro de evaluaciones cuantitativas (0-20) y cualitativas (A, B, C, D, E) con cálculo automático de promedios y actas oficiales.

### 5. 📄 Generador Automático de Documentos y Gestor de Plantillas
- **Emisión en un clic**: Generación instantánea de Constancias de Estudio, Cartas de Buena Conducta y Justificativos con datos reales del alumno.
- **Variables dinámicas**: Inserción de palabras clave inteligentes (`[Nombre Completo]`, `[Cédula Alumno]`, `[Grado y Sección]`, `[Periodo Escolar]`, etc.).
- **Membrete institucional personalizable**:
  - Posicionamiento libre de logotipos (Izquierda, Centro, Derecha o arrastre libre con puntero).
  - Escala libre y **ajuste de hitbox ceñido** (`height: auto`) al contorno real del logotipo para evitar solapamientos.
  - Subida y reemplazo personalizado de logotipos (MPPE / Escudo e Institución).
- **Múltiples firmas configurables**: Distribución de firmas a la izquierda, centro o derecha.
- **Formatos de hoja**: Carta (Letter), Oficio (Legal) y A4.
- **Exportación versátil**: Descarga directa en **Word editable (.DOCX)** y **PDF** con previsualización de impresión idéntica.

---

## 🛠️ Tecnologías Utilizadas

- **Entorno de Escritorio**: [Electron](https://www.electronjs.org/) (con aceleración por GPU y renderizado de alto rendimiento).
- **Frontend**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/).
- **Estilos y Animaciones**: [TailwindCSS](https://tailwindcss.com/) + [Framer Motion](https://www.framer.com/motion/).
- **Componentes e Iconografía**: [Lucide React](https://lucide.dev/), [React Icons](https://react-icons.github.io/react-icons/), Headless UI.
- **Generación de Documentos**: [docx](https://docx.js.org/), [jspdf](https://parall.ax/products/jspdf), html2canvas.
- **Persistencia de Datos**: [Lowdb](https://github.com/typicode/lowdb) (almacenamiento local JSON estructurado en AppData) y compatibilidad MySQL.

---

## 📦 Instalación y Puesta en Marcha

### Prerrequisitos
- [Node.js](https://nodejs.org/) (versión 18 o superior).
- npm (incluido con Node.js).

### Pasos

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/HGoleth/Sistema-de-Registro-de-Estudiantes-SC.git
   cd Sistema-de-Registro-de-Estudiantes-SC
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **(Opcional) Poblar la base de datos con datos de prueba**:
   ```bash
   npm run seed
   ```

4. **Ejecutar en modo escritorio (Electron + React)**:
   ```bash
   npm run electron:dev
   ```

5. **O ejecutar solo en modo web**:
   ```bash
   npm run dev
   ```

---

## 📜 Scripts Disponibles

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor de desarrollo Vite |
| `npm run build` | Compila la aplicación frontend con TypeScript y Vite |
| `npm run electron` | Abre la aplicación de escritorio en Electron |
| `npm run electron:dev` | Compila y lanza la aplicación Electron en caliente |
| `npm run seed` | Carga estudiantes, representantes y notas ficticias |
| `npm run lint` | Ejecuta el linter ESLint |
| `npm run package` | Empaqueta la aplicación para distribución con Electron Forge |

---

## 👤 Autor

- **HGoleth** - [GitHub](https://github.com/HGoleth)
- Servicio Comunitario PSM - Unidad Educativa "República de Chile"
