import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import './Layout.css';

/**
 * Main Layout component that wraps the application
 * @param {Object} props - Component props
 * @returns {JSX.Element} - Layout component
 */
const Layout = ({ children, showSidebar = true, showHeader = true }) => {
  return (
    <div className="layout">
      {showSidebar && <Sidebar />}
      
      <div className="layout__main">
        {showHeader && <Header />}
        
        <main className="layout__content">
          <div className="layout__container">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;