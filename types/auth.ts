export type UserRole = "biller" | "admin" | "super_admin";

export type Profile = {
  id: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
};
