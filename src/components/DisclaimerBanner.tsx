import React from 'react';
import { Info } from 'lucide-react';

const DisclaimerBanner: React.FC = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 border-t border-slate-600/50 shadow-xl backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-center space-x-3">
            <Info className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <p className="text-xs text-slate-300 text-center font-medium">
              <span className="text-slate-200 font-semibold">Aviso Importante:</span> El trading en mercados financieros implica un alto nivel de riesgo y puede no ser adecuado para todos los inversores. Antes de invertir, considere su experiencia, objetivos y tolerancia al riesgo.
            </p>
            <Info className="w-4 h-4 text-slate-400 flex-shrink-0" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisclaimerBanner;
