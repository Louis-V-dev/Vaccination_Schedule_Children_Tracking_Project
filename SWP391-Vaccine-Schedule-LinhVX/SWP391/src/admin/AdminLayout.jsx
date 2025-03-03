import React from 'react';
import Sidebar from '../components/Sidebar';
import '../css/admin.css';

function AdminLayout({ children }) {
  return (
    <div className="admin-layout">
      <Sidebar className="admin-sidebar" />
      <div className="admin-main-content">
        {children}
      </div>
    </div>
  );
}

export default AdminLayout; 