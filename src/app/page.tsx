import React, { Suspense } from 'react';
import VisitorView from '@/components/VisitorView';

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748B',
            background: '#F8FAFC',
          }}
        >
          Loading Impact Tank...
        </div>
      }
    >
      <VisitorView />
    </Suspense>
  );
}
