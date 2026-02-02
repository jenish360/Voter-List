import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import { eq, and, or, ilike } from "drizzle-orm";
import type { User, InsertUser, Person, InsertPerson, UpdatePerson } from "@shared/schema";
import bcrypt from "bcryptjs";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

export interface IStorage {
  // User operations
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  verifyPassword(user: User, password: string): Promise<boolean>;
  
  // Person operations
  getPeopleByUserId(userId: string, searchQuery?: string): Promise<Person[]>;
  getPersonById(id: string, userId: string): Promise<Person | undefined>;
  createPerson(person: InsertPerson, userId: string): Promise<Person>;
  updatePerson(id: string, userId: string, data: UpdatePerson): Promise<Person | undefined>;
  deletePerson(id: string, userId: string): Promise<boolean>;
  toggleMark(id: string, userId: string): Promise<Person | undefined>;
  getStats(userId: string): Promise<{ marked: number; unmarked: number }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password_hash, 10);
    const [user] = await db.insert(schema.users).values({
      ...insertUser,
      password_hash: hashedPassword,
    }).returning();
    return user;
  }

  async verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password_hash);
  }

  // Person operations
  async getPeopleByUserId(userId: string, searchQuery?: string): Promise<Person[]> {
    let query = db.select().from(schema.people).where(eq(schema.people.user_id, userId));
    
    if (searchQuery && searchQuery.trim()) {
      const search = `%${searchQuery}%`;
      const result = await db.select()
        .from(schema.people)
        .where(
          and(
            eq(schema.people.user_id, userId),
            or(
              ilike(schema.people.name, search),
              ilike(schema.people.house_name, search),
              ilike(schema.people.area, search)
            )
          )
        );
      return result;
    }
    
    return query;
  }

  async getPersonById(id: string, userId: string): Promise<Person | undefined> {
    const [person] = await db.select()
      .from(schema.people)
      .where(and(
        eq(schema.people.id, id),
        eq(schema.people.user_id, userId)
      ));
    return person;
  }

  async createPerson(person: InsertPerson, userId: string): Promise<Person> {
    const [newPerson] = await db.insert(schema.people).values({
      ...person,
      user_id: userId,
    }).returning();
    return newPerson;
  }

  async updatePerson(id: string, userId: string, data: UpdatePerson): Promise<Person | undefined> {
    const [updated] = await db.update(schema.people)
      .set(data)
      .where(and(
        eq(schema.people.id, id),
        eq(schema.people.user_id, userId)
      ))
      .returning();
    return updated;
  }

  async deletePerson(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(schema.people)
      .where(and(
        eq(schema.people.id, id),
        eq(schema.people.user_id, userId)
      ));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async toggleMark(id: string, userId: string): Promise<Person | undefined> {
    const person = await this.getPersonById(id, userId);
    if (!person) return undefined;
    
    const newMarkStatus = person.is_marked === 1 ? 0 : 1;
    return this.updatePerson(id, userId, { is_marked: newMarkStatus });
  }

  async getStats(userId: string): Promise<{ marked: number; unmarked: number }> {
    const people = await this.getPeopleByUserId(userId);
    const marked = people.filter(p => p.is_marked === 1).length;
    const unmarked = people.length - marked;
    return { marked, unmarked };
  }
}

export const storage = new DatabaseStorage();
