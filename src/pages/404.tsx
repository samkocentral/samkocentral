import React from 'react';
import Link from 'next/link';

export default function Custom404() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b0f19', color: '#fff', fontFamily: 'sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '72px', margin: 0, color: '#f59e0b' }}>404</h1>
        <p style={{ fontSize: '18px', color: '#94a3b8' }}>Page Not Found</p>
        <Link href="/" style={{ color: '#38bdf8', textDecoration: 'underline' }}>Back to Home</Link>
      </div>
    </div>
  );
}
