// API client for backend communication

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Person {
  id: string;
  user_id: string;
  name: string;
  gender: string;
  identity_number?: string | null;
  order_number?: string | null;
  father_name?: string | null;
  age?: number | null;
  house_name?: string | null;
  area?: string | null;
  ward_no?: string | null;
  booth_no?: string | null;
  phone?: string | null;
  notes?: string | null;
  is_marked: number;
  created_at: string;
}

export interface PersonFormData {
  name: string;
  gender: string;
  identity_number?: string;
  order_number?: string;
  father_name?: string;
  age?: number;
  house_name?: string;
  area?: string;
  ward_no?: string;
  booth_no?: string;
  phone?: string;
  notes?: string;
}

export interface Stats {
  marked: number;
  unmarked: number;
}

class API {
  private async fetch(url: string, options?: RequestInit) {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      credentials: 'include', // Important for session cookies
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Auth
  async register(name: string, email: string, password: string): Promise<User> {
    return this.fetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password_hash: password }),
    });
  }

  async login(email: string, password: string): Promise<User> {
    return this.fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout(): Promise<void> {
    await this.fetch('/api/auth/logout', { method: 'POST' });
  }

  async getCurrentUser(): Promise<User> {
    return this.fetch('/api/auth/me');
  }

  // People
  async getPeople(searchQuery?: string): Promise<Person[]> {
    const params = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : '';
    return this.fetch(`/api/people${params}`);
  }

  async getStats(): Promise<Stats> {
    return this.fetch('/api/people/stats');
  }

  async getPerson(id: string): Promise<Person> {
    return this.fetch(`/api/people/${id}`);
  }

  async createPerson(data: PersonFormData): Promise<Person> {
    return this.fetch('/api/people', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePerson(id: string, data: Partial<PersonFormData>): Promise<Person> {
    return this.fetch(`/api/people/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async toggleMark(id: string): Promise<Person> {
    return this.fetch(`/api/people/${id}/toggle`, { method: 'POST' });
  }

  async deletePerson(id: string): Promise<void> {
    await this.fetch(`/api/people/${id}`, { method: 'DELETE' });
  }
}

export const api = new API();
