import React from "react";
import { Dialog, DialogTitle } from "@headlessui/react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2 } from "lucide-react";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  accentColor?: "red" | "orange";
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Eliminar permanentemente",
  cancelText = "Cancelar",
  accentColor = "red",
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog
          open={true}
          onClose={onClose}
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-[2.5rem] w-full max-w-sm p-10 shadow-2xl border border-red-50 text-center relative overflow-hidden"
          >
            <div
              className={`absolute top-0 left-0 w-full h-2 ${
                accentColor === "orange" ? "bg-orange-500" : "bg-red-600"
              }`}
            />

            <div
              className={`w-20 h-20 ${
                accentColor === "orange" ? "bg-orange-50 text-orange-600" : "bg-red-100 text-red-600"
              } rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner`}
            >
              <Trash2 size={40} />
            </div>

            <DialogTitle className="text-xl font-black text-gray-800 mb-2 uppercase tracking-tighter">
              {title}
            </DialogTitle>

            <div className="text-xs text-gray-500 font-medium mb-8 leading-relaxed px-2 text-center uppercase">
              {message}
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={onConfirm}
                className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-red-100 hover:bg-red-700 transition-all active:scale-95"
              >
                {confirmText}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-4 bg-gray-100 text-gray-600 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-gray-200 transition-all active:scale-95"
              >
                {cancelText}
              </button>
            </div>
          </motion.div>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default ConfirmDeleteModal;
