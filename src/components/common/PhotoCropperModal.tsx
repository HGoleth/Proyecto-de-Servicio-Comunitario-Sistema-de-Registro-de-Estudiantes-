import React, { useState } from "react";
import Cropper, { Area } from "react-easy-crop";
import { Dialog, DialogPanel } from "@headlessui/react";
import { X, CheckCircle } from "lucide-react";
import { getCroppedImg } from "../../utils/fileHelpers";

interface PhotoCropperModalProps {
  open: boolean;
  imageSrc: string;
  onSave: (file: File, preview: string) => void;
  onClose: () => void;
}

export const PhotoCropperModal: React.FC<PhotoCropperModalProps> = ({
  open,
  imageSrc,
  onSave,
  onClose,
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = (_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  };

  const handleSave = async () => {
    if (!croppedAreaPixels || !imageSrc) return;
    try {
      const { file, preview } = await getCroppedImg(imageSrc, croppedAreaPixels);
      onSave(file, preview);
    } catch (e) {
      console.error("Error al recortar imagen:", e);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center mb-4 border-b pb-3">
            <h3 className="font-bold text-gray-800 text-lg">Ajustar Fotografía</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 rounded-lg p-1 hover:bg-gray-100 transition"
            >
              <X size={20} />
            </button>
          </div>

          <div className="relative w-full h-64 bg-gray-900 rounded-xl overflow-hidden shadow-inner">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>

          <div className="mt-5 space-y-2">
            <div className="flex justify-between text-xs text-gray-500 font-bold uppercase">
              <span>Zoom</span>
              <span>{Math.round(zoom * 100)}%</span>
            </div>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
            />
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t pt-4">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 font-medium shadow-lg shadow-green-200 transition flex items-center gap-2"
            >
              <CheckCircle size={18} /> Guardar Recorte
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};
