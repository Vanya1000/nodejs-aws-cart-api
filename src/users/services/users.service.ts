import { Injectable } from '@nestjs/common';
import { User } from 'src/users/models';
import { UsersRepository } from 'src/users/repositories/users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findOne(name: string): Promise<User | null> {
    return await this.usersRepository.findUserByName(name);
  }

  async createOne({
    name,
    password,
  }: {
    name: string;
    password: string;
  }): Promise<User> {
    return await this.usersRepository.createUser(name, password);
  }
}
