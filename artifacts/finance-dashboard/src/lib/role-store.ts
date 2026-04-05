import { create } from "zustand";
import { persist } from "zustand/middleware";

type Role = "viewer" | "admin";

interface RoleStore {
  role: Role;
  setRole: (role: Role) => void;
}

export const useRoleStore = create<RoleStore>()(
  persist(
    (set) => ({
      role: "viewer",
      setRole: (role) => set({ role }),
    }),
    {
      name: "finance-dashboard-role",
    }
  )
);
