import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { UpdateUserDto } from './dto/user.dto';
import { RegisterDto } from 'src/auth/dto/register.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async findByPhone(phoneNumber: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { phoneNumber } });
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async createUser(data: RegisterDto): Promise<User> {
    const { phoneNumber, name, role } = data;
    const existingUser = await this.findByPhone(phoneNumber);
    if (existingUser) {
      throw new ConflictException('Phone number already registered');
    }

    const user = this.userRepository.create({
      phoneNumber,
      name,
      role,
    });

    return this.userRepository.save(user);
  }

  async login(phoneNumber: string): Promise<string> {
    let user = await this.findByPhone(phoneNumber);
    user.lastLoginAt = new Date();

    const token = this.jwtService.sign({
      sub: user.id,
      phoneNumber: user.phoneNumber,
    });

    return token;
  }

  async updateUser(userId: string, updateDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(userId);

    // 닉네임 업데이트시 중복 체크
    if (updateDto.nickname) {
      const existingUser = await this.userRepository.findOne({
        where: { name: updateDto.name },
      });
      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException('Nickname already taken');
      }
    }

    Object.assign(user, updateDto);
    return this.userRepository.save(user);
  }
}
