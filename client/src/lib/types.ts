export interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string; // Simulated hash
}

export interface Person {
  id: number;
  userId: number; // Owner of this record
  name: string;
  house_name?: string;
  area?: string;
  ward_no?: string;
  booth_no?: string;
  phone?: string;
  notes?: string;
  is_marked: number; // 0 or 1
  created_at: string;
}

export type PersonFormData = Omit<Person, 'id' | 'userId' | 'created_at' | 'is_marked'>;
