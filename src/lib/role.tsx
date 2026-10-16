import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

/** Kas naudoja šį telefoną. */
export type Role = 'senior' | 'helper';

export const ROLE_STORAGE_KEY = 'askartu.role';

type RoleState = {
  /** `undefined`, kol dar skaitoma iš telefono atminties; `null`, jei dar nepasirinkta. */
  role: Role | null | undefined;
  setRole: (role: Role) => Promise<void>;
  clearRole: () => Promise<void>;
};

const RoleContext = createContext<RoleState | null>(null);

function isRole(value: unknown): value is Role {
  return value === 'senior' || value === 'helper';
}

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(ROLE_STORAGE_KEY)
      .then((stored) => {
        if (active) setRoleState(isRole(stored) ? stored : null);
      })
      .catch(() => {
        if (active) setRoleState(null);
      });
    return () => {
      active = false;
    };
  }, []);

  const setRole = useCallback(async (next: Role) => {
    setRoleState(next);
    await AsyncStorage.setItem(ROLE_STORAGE_KEY, next);
  }, []);

  const clearRole = useCallback(async () => {
    setRoleState(null);
    await AsyncStorage.removeItem(ROLE_STORAGE_KEY);
  }, []);

  return <RoleContext.Provider value={{ role, setRole, clearRole }}>{children}</RoleContext.Provider>;
}

export function useRole(): RoleState {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole turi būti naudojamas RoleProvider viduje');
  return ctx;
}
