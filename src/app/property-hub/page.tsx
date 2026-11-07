'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PropertyHubPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/settings?tab=cms-property-hub');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground text-sm">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
        Redirecting to Property Data &amp; Setup CMS...
      </div>
    </div>
  );
}



