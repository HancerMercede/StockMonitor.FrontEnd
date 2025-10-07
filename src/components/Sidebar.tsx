import React from 'react';
import Watchlist from './Watchlist';
import BySymbol from './BySymbol';
import ByType from './ByType';
import type { AlertStats, Alert } from '../types';

interface SidebarProps {
  stats: AlertStats | null;
  alerts?: Alert[];
}

const Sidebar = ({ stats, alerts }: SidebarProps) => {
  return (
    <div className="space-y-4">
      <Watchlist alerts={alerts} />
      <BySymbol stats={stats} />
      <ByType stats={stats} />
    </div>
  );
};

export default Sidebar;