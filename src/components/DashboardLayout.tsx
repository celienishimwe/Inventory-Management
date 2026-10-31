import React, { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function DashboardLayout({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <div className="app-frame">
      <Sidebar />
      <div className="main-wrapper">
        <Topbar title={title} />
        <main className="dashboard-content fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
