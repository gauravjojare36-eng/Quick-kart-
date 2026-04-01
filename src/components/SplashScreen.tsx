import { motion } from 'motion/react';
import { Crown } from 'lucide-react';

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 bg-[#0A0A0A] flex flex-col items-center justify-center z-[9999] overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(to right, #333 1px, transparent 1px), linear-gradient(to bottom, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative flex flex-col items-center"
      >
        {/* Angular Icon Container */}
        <motion.div
          animate={{ rotate: [0, 5, 0, -5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="relative backdrop-blur-xl bg-white/5 p-10 border border-white/20 shadow-2xl"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 opacity-90 shadow-[0_0_40px_rgba(168,85,247,0.4)]" />
          
          {/* Angular Pulse */}
          <motion.div
            animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute inset-0 border-2 border-white/30"
          />
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-16 text-center"
        >
          <h1 className="text-5xl font-light text-white tracking-[0.25em] uppercase">
            Stay<span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Raw</span>
          </h1>
          <p className="mt-4 text-gray-400 font-light tracking-[0.4em] uppercase text-[11px]">
            Curated Excellence
          </p>
        </motion.div>
      </motion.div>

      {/* Modern Progress Bar */}
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: "240px" }}
        transition={{ delay: 0.5, duration: 2, ease: "easeInOut" }}
        className="mt-24 h-[4px] bg-white/10 overflow-hidden"
      >
        <motion.div
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-full h-full bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500"
        />
      </motion.div>
    </div>
  );
}
