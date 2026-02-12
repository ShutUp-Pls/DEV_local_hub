import React from 'react';
import styles from './Navbar.module.css';

export type ConnectionStatus = 'loading' | 'connected' | 'failed' | 'validating';

interface RjcIndicatorProps {
  status: ConnectionStatus;
  onRetry: () => void;
}

interface SearchSwitchProps {
  useLocalSearch: boolean;
  setUseLocalSearch: (val: boolean) => void;
  fullWidth?: boolean;
  reverse?: boolean;
}

export const RjcIndicator = ({ status, onRetry }: RjcIndicatorProps) => {
  return (
    <div className={styles.rjcBadge}>
      {/* 1. RJC siempre en blanco */}
      <span className={styles.rjcLabel}>RJC</span>

      {/* 2. Estados en Azul */}
      {status === 'loading' && (
        <span className={`${styles.statusContainer} ${styles.textBlueDim}`}>
          <span className={`${styles.dot} ${styles.dotConnecting}`}></span>
          Conectando...
        </span>
      )}

      {(status === 'connected' || status === 'validating') && (
        <span className={`${styles.statusContainer} ${styles.textBlueBright}`}>
          <span className={styles.dotConnected}>
            <span className={styles.ping}></span>
            <span className={styles.dot} style={{ backgroundColor: '#3b82f6', position: 'relative' }}></span>
          </span>
          Conectado
        </span>
      )}

      {status === 'failed' && (
        <button onClick={onRetry} className={styles.retryBtn} title="Reintentar conexión">
          <span className={`${styles.dot} ${styles.dotFailed}`}></span>
          Error (Reintentar ↻)
        </button>
      )}
    </div>
  );
};

export const SearchSwitch = ({ useLocalSearch, setUseLocalSearch, fullWidth = false, reverse = false }: SearchSwitchProps) => (
  <div 
    className={`${styles.switchBase} ${fullWidth ? styles.switchFull : ''} ${reverse ? styles.switchReverse : ''}`}
    onClick={() => setUseLocalSearch(!useLocalSearch)}
  >
    {/* Texto activo usa el azul del HUB */}
    <span className={`${styles.switchLabel} ${useLocalSearch ? styles.textActiveBlue : styles.textZinc}`}>
      {useLocalSearch ? 'Búsqueda Local' : 'Búsqueda Web'}
    </span>
    
    {/* Toggle Track usa el azul del HUB */}
    <div className={`${styles.toggleTrack} ${useLocalSearch ? styles.bgBlue : styles.bgZinc}`}>
      <span className={`${styles.toggleThumb} ${useLocalSearch ? styles.translateOn : styles.translateOff}`} />
    </div>
  </div>
);