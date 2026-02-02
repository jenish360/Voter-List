import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Person, PersonFormData, User } from './types';

interface WardState {
  // Auth State
  users: User[];
  currentUser: User | null;
  login: (email: string, password: string) => boolean;
  register: (name: string, email: string, password: string) => boolean;
  logout: () => void;

  // App State (filtered by currentUser automatically in getters, but storage holds all)
  people: Person[];
  addPerson: (data: PersonFormData) => void;
  updatePerson: (id: number, data: Partial<Person>) => void;
  deletePerson: (id: number) => void;
  toggleMark: (id: number) => void;
  getPerson: (id: number) => Person | undefined;
  searchPeople: (query: string) => Person[];
  getStats: () => { marked: number; unmarked: number };
}

// Simple hash function for simulation
const simpleHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
};

export const useWardStore = create<WardState>()(
  persist(
    (set, get) => ({
      users: [],
      currentUser: null,
      people: [], // Start empty, data is user-specific now

      login: (email, password) => {
        const { users } = get();
        const user = users.find(u => u.email === email && u.password_hash === simpleHash(password));
        if (user) {
          set({ currentUser: user });
          return true;
        }
        return false;
      },

      register: (name, email, password) => {
        const { users } = get();
        if (users.some(u => u.email === email)) {
          return false; // Email exists
        }
        const newUser: User = {
          id: Date.now(),
          name,
          email,
          password_hash: simpleHash(password)
        };
        set({ users: [...users, newUser], currentUser: newUser }); // Auto login after register
        return true;
      },

      logout: () => set({ currentUser: null }),
      
      addPerson: (data) => set((state) => {
        if (!state.currentUser) return state;
        const newPerson: Person = {
          ...data,
          id: Date.now(),
          userId: state.currentUser.id,
          is_marked: 0,
          created_at: new Date().toISOString()
        };
        return { people: [...state.people, newPerson] };
      }),

      updatePerson: (id, data) => set((state) => ({
        people: state.people.map((p) => (p.id === id && p.userId === state.currentUser?.id ? { ...p, ...data } : p))
      })),

      deletePerson: (id) => set((state) => ({
        people: state.people.filter((p) => !(p.id === id && p.userId === state.currentUser?.id))
      })),

      toggleMark: (id) => set((state) => ({
        people: state.people.map((p) => 
          (p.id === id && p.userId === state.currentUser?.id) ? { ...p, is_marked: p.is_marked === 1 ? 0 : 1 } : p
        )
      })),

      getPerson: (id) => {
        const { people, currentUser } = get();
        if (!currentUser) return undefined;
        return people.find((p) => p.id === id && p.userId === currentUser.id);
      },

      searchPeople: (query) => {
        const { people, currentUser } = get();
        if (!currentUser) return [];
        
        // Filter by user first
        const userPeople = people.filter(p => p.userId === currentUser.id);

        if (!query.trim()) return userPeople;
        
        const lowerQuery = query.toLowerCase();
        return userPeople.filter((p) => 
          p.name.toLowerCase().includes(lowerQuery) || 
          (p.house_name && p.house_name.toLowerCase().includes(lowerQuery)) || 
          (p.area && p.area.toLowerCase().includes(lowerQuery))
        );
      },

      getStats: () => {
        const { people, currentUser } = get();
        if (!currentUser) return { marked: 0, unmarked: 0 };

        const userPeople = people.filter(p => p.userId === currentUser.id);
        const marked = userPeople.filter(p => p.is_marked === 1).length;
        const unmarked = userPeople.length - marked;
        return { marked, unmarked };
      }
    }),
    {
      name: 'ward-data-storage-v2', // Changed version to reset data structure
    }
  )
);
