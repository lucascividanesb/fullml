'use client';

import { useDashboard } from '../dashboard/layout';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * RoleGuard Component
 * Usage:
 * <RoleGuard allowedRoles={['admin', 'operador']}>
 *   <ComponentWithRestrictedAccess />
 * </RoleGuard>
 */
export default function RoleGuard({ children, allowedRoles = ['admin'] }) {
  const { user } = useDashboard();
  const router = useRouter();

  useEffect(() => {
    // If user object is loaded but role is not allowed, redirect to generic dashboard
    if (user && !allowedRoles.includes(user.role)) {
      router.push('/dashboard');
    }
  }, [user, allowedRoles, router]);

  // If user is null (still loading) or not allowed, render null or loading state
  if (!user || !allowedRoles.includes(user.role)) {
    return <div style={{ padding: '20px', color: 'var(--text-muted)' }}>Validando permissões...</div>;
  }

  return children;
}
