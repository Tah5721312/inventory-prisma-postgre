'use client';

import { createContext, useContext, ReactNode, useMemo } from 'react';
import { AppAbility, AbilityRule, createAbilityFromRules } from '@/lib/ability';

const AbilityContext = createContext<AppAbility | undefined>(undefined);

export function AbilityProvider({ 
  children, 
  rules 
}: { 
  children: ReactNode; 
  rules: AbilityRule[] 
}) {
  const ability = useMemo(() => createAbilityFromRules(rules), [rules]);

  return (
    <AbilityContext.Provider value={ability}>
      {children}
    </AbilityContext.Provider>
  );
}

export function useAbility() {
  const context = useContext(AbilityContext);
  if (!context) {
    throw new Error('useAbility must be used within AbilityProvider');
  }
  return context;
}