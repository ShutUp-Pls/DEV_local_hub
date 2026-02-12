// NavbarMenu.tsx
'use client';
import { useState } from "react";
import { RjcIndicator, SearchSwitch, ConnectionStatus } from "./NavbarComponents";
import styles from './Navbar.module.css';

interface NavbarMenuProps {
  userName?: string | null;
  useLocalSearch: boolean;
  setUseLocalSearch: (value: boolean) => void;
  rjcStatus: ConnectionStatus;
  onRetryConnection: () => void;
  onSignOut: () => void;
}

export default function NavbarMenu({
  userName, useLocalSearch, setUseLocalSearch, rjcStatus, onRetryConnection, onSignOut
}: NavbarMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`${styles.menuContainer} ${styles.lgHidden}`}>
      <button onClick={() => setIsOpen(!isOpen)} className={styles.menuBtn}>
        <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {isOpen && (
        <div className={`${styles.dropdown} ${styles.w56}`}>
          
          <div className={`${styles.dropdownDivider} ${styles.lgHidden}`} style={{ display: 'flex', alignItems: 'center' }}>
             {/* 1. RJC Indicator primero (Izquierda) */}
             <div className={styles.smHidden} style={{ marginRight: '0.5rem' }}>
                <RjcIndicator status={rjcStatus} onRetry={onRetryConnection} />
             </div>

             {/* 2. Saludo después (Derecha) */}
             {/* marginLeft: 'auto' fuerza al texto a irse al final del contenedor, 
                 independientemente de si el RJC está visible o no */}
             <p style={{ fontSize: '0.875rem', color: '#a1a1aa', margin: '0 0 0 auto', whiteSpace: 'nowrap' }}>
                Hola, <span style={{ color: '#fff', fontWeight: 500 }}>{userName || "Usuario"}</span>
             </p>
          </div>

          <div className={`${styles.dropdownDivider} ${styles.mdHidden}`}>
             <SearchSwitch useLocalSearch={useLocalSearch} setUseLocalSearch={setUseLocalSearch} fullWidth={true} />
          </div>

          <div className={styles.lgHidden} style={{ marginTop: 'auto' }}>
             <button onClick={onSignOut} className={styles.signOutBtn} style={{ width: '100%', textAlign: 'center' }}>
                Cerrar Sesión
              </button>
          </div>
        </div>
      )}
    </div>
  );
}