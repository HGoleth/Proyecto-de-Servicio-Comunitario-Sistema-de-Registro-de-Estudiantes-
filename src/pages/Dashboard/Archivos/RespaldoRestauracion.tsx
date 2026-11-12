import { ShieldCheck, History, Download } from "lucide-react";

const RespaldoRestauracion = () => {
  const handleBackup = async () => {
    // Necesitarás un handler en Electron que use fs.copyFileSync
    const res = await (window as any).electron.createBackup();
    if (res.success) alert("Respaldo creado en la carpeta 'backups'");
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-green-600 to-green-700 p-6 rounded-2xl text-white shadow-lg">
          <ShieldCheck size={40} className="mb-4 opacity-80" />
          <h3 className="text-xl font-bold mb-2">Crear Respaldo</h3>
          <p className="text-sm text-green-50 text-balance mb-6">Genera una copia de seguridad de todos los estudiantes, usuarios y configuraciones actuales.</p>
          <button 
            onClick={handleBackup}
            className="w-full bg-white text-green-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-50 transition"
          >
            <Download size={20}/> Descargar Backup
          </button>
        </div>

        <div className="bg-white border border-green-100 p-6 rounded-2xl shadow-sm">
          <History size={40} className="text-green-600 mb-4 opacity-80" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">Restaurar Datos</h3>
          <p className="text-sm text-gray-500 mb-6">Importa un archivo de respaldo anterior. Ten cuidado, esto sobrescribirá los datos actuales.</p>
          <button className="w-full border-2 border-green-600 text-green-700 py-3 rounded-xl font-bold hover:bg-green-50 transition">
            Seleccionar Archivo
          </button>
        </div>
      </div>
    </div>
  );
};

export default RespaldoRestauracion;