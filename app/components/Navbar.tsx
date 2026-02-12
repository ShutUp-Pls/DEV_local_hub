'use client';

import { signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { RjcIndicator, SearchSwitch, ConnectionStatus } from "./NavbarComponents";
import NavbarMenu from "./NavbarMenu";
import styles from './Navbar.module.css';

interface NavbarProps {
  userName?: string | null;
  useLocalSearch: boolean;
  setUseLocalSearch: (value: boolean) => void;
  isInitialized: boolean;
  isLoadingSession: boolean;
}

export default function Navbar({ 
  userName, useLocalSearch, setUseLocalSearch, isInitialized, isLoadingSession 
}: NavbarProps) {
  
  const [rjcStatus, setRjcStatus] = useState<ConnectionStatus>('validating');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const checkConnection = async (isManualRetry = false) => {
    if (isManualRetry) setRjcStatus('loading');
    else {
      setRjcStatus('validating');
      timerRef.current = setTimeout(() => setRjcStatus('loading'), 500);
    }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/check-rjc`);
      if (timerRef.current) clearTimeout(timerRef.current);
      const data = await res.json();
      setRjcStatus(data.status === 'connected' ? 'connected' : 'failed');
    } catch (error) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setRjcStatus('failed');
    }
  };

  useEffect(() => {
    checkConnection();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  return (
    <nav className={styles.nav}>
      <div className={styles.container}>
        <Link href={process.env.NEXT_PUBLIC_PRINCIPAL_URL || '/'} className={styles.logoLink}>
          <h1 className={styles.logoText}>
            Local<span className={styles.logoHub}>HUB</span>
          </h1>
        </Link>
        
        <div className={styles.actions}>
          <div className={`${styles.hiddenSm} ${styles.smBlock}`}>
            <RjcIndicator status={rjcStatus} onRetry={() => checkConnection(true)} />
          </div>

          <div className={`${styles.hiddenMd} ${styles.mdBlock}`}>
            {!isInitialized ? (
              <div className={styles.skeletonSwitch}></div>
            ) : (
              <SearchSwitch useLocalSearch={useLocalSearch} setUseLocalSearch={setUseLocalSearch} />
            )}
          </div>

          <div className={`${styles.divider} ${styles.hiddenLg} ${styles.lgBlock}`}></div>

          <span className={`${styles.switchLabel} ${styles.hiddenLg} ${styles.lgInline}`} style={{ color: '#a1a1aa' }}>
            {isLoadingSession ? (
              <div className={styles.skeletonText}></div>
            ) : (
              userName || "Usuario"
            )}
          </span>

          <button onClick={() => signOut({ callbackUrl: '/' })} className={`${styles.signOutBtn} ${styles.hiddenLg} ${styles.lgBlock}`}>
            Cerrar Sesión
          </button>

          <NavbarMenu 
            userName={userName}
            useLocalSearch={useLocalSearch}
            setUseLocalSearch={setUseLocalSearch}
            rjcStatus={rjcStatus}
            onRetryConnection={() => checkConnection(true)}
            onSignOut={() => signOut({ callbackUrl: '/' })}
          />
        </div>
      </div>
    </nav>
  );
}