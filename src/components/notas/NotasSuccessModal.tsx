import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, X } from "lucide-react";

interface NotasSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotasSuccessModal: React.FC<NotasSuccessModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 no-print">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-[3rem] p-10 max-w-sm w-full text-center shadow-2xl relative border border-blue-100"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-[#5564eb]" />
            </div>
            <h3 className="text-xl font-black text-gray-800 uppercase italic mb-2">
              ¡Sincronizado!
            </h3>
            <p className="text-[10px] text-gray-400 font-bold mb-8 uppercase tracking-widest">
              Información resguardada en disco.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full bg-[#5564eb] hover:bg-[#4353d8] text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all"
            >
              Continuar
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default NotasSuccessModal;
