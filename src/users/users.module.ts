import { Module } from '@nestjs/common';

import { UsersService } from './services';
import { UsersRepository } from 'src/users/repositories/users.repository';

@Module({
  providers: [UsersService, UsersRepository],
  exports: [UsersService],
})
export class UsersModule {}
