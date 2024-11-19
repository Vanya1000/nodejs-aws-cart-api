import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { User } from '../models';

@Injectable()
export class UsersRepository {
  constructor(@Inject('PG_POOL') private readonly pool: Pool) {}

  async findUserByName(name: string): Promise<User | null> {
    const query = `
      SELECT id, name, password
      FROM users
      WHERE name = $1
    `;
    try {
      const result = await this.pool.query(query, [name]);
      if (result.rows.length === 0) {
        return null;
      }
      return result.rows[0] as User;
    } catch (error) {
      console.error(`Error finding user with name ${name}:`, error);
      throw new Error('Error retrieving user. Please try again later.');
    }
  }

  async createUser(name: string, password: string): Promise<User> {
    const query = `
      INSERT INTO users (name, password, created_at, updated_at)
      VALUES ($1, $2, NOW(), NOW())
      RETURNING id, name, password
    `;
    try {
      const result = await this.pool.query(query, [name, password]);
      return result.rows[0] as User;
    } catch (error) {
      console.error(`Error creating user with name ${name}:`, error);
      throw new Error('Error creating user. Please try again later.');
    }
  }
}
