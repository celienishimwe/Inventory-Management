import React, { useState } from 'react';
import { Search, Bell, SlidersHorizontal, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface TopbarProps {
  title?: string;
}

export default function Topbar({ title }: TopbarProps) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const displayName = user?.firstName || (user?.fullName ? user.fullName.split(' ')[0] : '') || user?.email?.split('@')[0] || '';
  const greeting = displayName ? `Welcome ${displayName} !` : 'Welcome !';

  return (
    <header className="dashboard-topbar">
      {/* Title */}
      <div>
        <h1 className="dashboard-title">
          {title || greeting}
        </h1>
      </div>

      {/* Right controls */}
      <div className="topbar-right">
        {/* Search pill */}
        <div className="search-pill">
          <input
            type="text"
            placeholder="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="button" className="search-btn" title="Search">
            <Search size={14} />
          </button>
        </div>

        {/* Filter button */}
        <button type="button" className="topbar-icon-btn" title="Filters">
          <SlidersHorizontal size={15} />
        </button>

        {/* Notification bell */}
        <button type="button" className="topbar-icon-btn" title="Notifications">
          <Bell size={15} />
          <span className="notification-badge" />
        </button>

        {/* User button */}
        <button type="button" className="topbar-icon-btn" title="Profile">
          <UserIcon size={15} />
        </button>
      </div>
    </header>
  );
}
