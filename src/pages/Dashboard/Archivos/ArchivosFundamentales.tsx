import { useState, useEffect, useRef } from "react";
import { UploadCloud, FileText, Trash2, Loader2 } from "lucide-react";

const ArchivosFundamentales = () => {
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    const config = await (window as any).electron.getConfig();
    if (config.documentos_fundamentales) setDocumentos(config.documentos_fundamentales);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== "application/pdf") return;

    setLoading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const res = await (window as any).electron.uploadFundamentalDoc({
          name: file.name,
          base64: reader.result
        });
        if (res.success) setDocumentos(prev => [...prev, res.documento]);
        setLoading(false);
      };
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/*  onClick que activa el input oculto */}
      <div 
        onClick={() => !loading && fileInputRef.current?.click()}
        className="border-2 border-dashed border-green-200 bg-green-50 rounded-2xl p-8 text-center cursor-pointer hover:bg-green-100 transition relative"
      >
        <input 
          type="file" 
          className="hidden" 
          ref={fileInputRef} 
          accept=".pdf"
          onChange={handleUpload}
        />
        <div className="flex flex-col items-center">
          {loading ? <Loader2 className="animate-spin text-green-600" size={48}/> : <UploadCloud size={48} className="text-green-600"/>}
          <p className="font-bold text-green-700 mt-2">Subir Reglamento o PEIC</p>
          <p className="text-xs text-green-600 opacity-70">Formato PDF (Máx. 10MB)</p>
        </div>
      </div>

      <div className="space-y-3">
        {documentos.map((doc) => (
          <div key={doc.id} className="flex items-center justify-between bg-white border p-4 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <FileText className="text-red-500" size={20}/>
              <div>
                <p className="font-semibold text-sm">{doc.nombre}</p>
                <p className="text-[10px] text-gray-400">Fecha: {doc.fecha}</p>
              </div>
            </div>
            <button 
               onClick={(e) => { e.stopPropagation(); /* xD */ }} 
               className="text-gray-400 hover:text-red-500"
            >
              <Trash2 size={18}/>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ArchivosFundamentales;