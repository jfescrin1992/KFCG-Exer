import React from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, CheckCircle2, Waves, Ruler, Droplets, Ban, PhoneCall } from 'lucide-react';

interface SafetyProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export const SafetyCheck: React.FC<SafetyProps> = ({ onConfirm, onCancel }) => {
  const guidelines = [
    { icon: <Waves size={20} className="text-blue-500" />, title: "Warm-up reminder", desc: "Ensure you've done light stretching." },
    { icon: <ShieldAlert size={20} className="text-orange-500" />, title: "Proper clothing reminder", desc: "Wear athletic attire and shoes." },
    { icon: <Ruler size={20} className="text-green-500" />, title: "Exercise-space requirement", desc: "Clear 2x2 meters of floor area." },
    { icon: <Droplets size={20} className="text-blue-400" />, title: "Hydration reminder", desc: "Keep water nearby." },
    { icon: <Ban size={20} className="text-red-500" />, title: "Stop-exercise instruction", desc: "Stop immediately if you feel dizzy or pain." },
    { icon: <PhoneCall size={20} className="text-red-600" />, title: "Emergency/safety instruction", desc: "Have a phone nearby and know who to call." },
  ];

  return (
    <div className="max-w-2xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white border border-neutral-200 rounded-2xl p-8 shadow-sm"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-red-50 rounded-full">
            <ShieldAlert className="text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 uppercase tracking-wide">Safety Check</h2>
        </div>

        <p className="text-neutral-600 font-medium text-lg mb-8">
          Are you ready to participate in today's physical activity?
        </p>

        <div className="grid gap-4 mb-8">
          {guidelines.map((item, i) => (
            <motion.div 
              key={`safety-guideline-${item.title || i}-${i}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-start gap-4 p-4 bg-neutral-50 rounded-xl"
            >
              <div className="mt-1">{item.icon}</div>
              <div>
                <h3 className="font-semibold text-neutral-800 capitalize">{item.title}</h3>
                <p className="text-sm text-neutral-500">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-500/20"
          >
            <CheckCircle2 size={20} />
            Yes, I am ready to participate
          </button>
          
          <button
            onClick={onCancel}
            className="w-full py-3 bg-white border border-neutral-200 text-neutral-500 font-bold rounded-xl hover:bg-neutral-50 transition-all text-sm"
          >
            No, go back to Home
          </button>
        </div>
      </motion.div>
    </div>
  );
};
