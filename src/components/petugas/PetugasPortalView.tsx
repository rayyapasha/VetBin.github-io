import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { PetugasSidebar } from './PetugasSidebar';
import { PetugasBerandaView } from './PetugasBerandaView';
import { PetugasLaporView } from './PetugasLaporView';
import { PetugasPetaRuteView } from './PetugasPetaRuteView';
import { PetugasNotifikasiView } from './PetugasNotifikasiView';

export const PetugasPortalView: React.FC = () => {
  const { petugasTab } = useApp();

  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-screen bg-[#F8F9F5]">
      <PetugasSidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-10 max-w-7xl w-full overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={petugasTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
          >
            {petugasTab === 'beranda' && <PetugasBerandaView />}
            {petugasTab === 'lapor' && <PetugasLaporView />}
            {petugasTab === 'peta-tong' && <PetugasPetaRuteView />}
            {petugasTab === 'notifikasi' && <PetugasNotifikasiView />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};
