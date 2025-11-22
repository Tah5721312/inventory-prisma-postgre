'use client';

import { useAbility } from '@/contexts/AbilityContext';
import { Actions, Subjects } from '@/lib/ability';
import { ReactNode } from 'react';

interface CanProps {
  do: Actions;
  on: Subjects;
  children: ReactNode;
  fallback?: ReactNode;
}

export function Can({ do: action, on: subject, children, fallback = null }: CanProps) {
  const ability = useAbility();

  const allowed = ability.can(action, subject) || ability.can('manage', subject);

  if (allowed) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}