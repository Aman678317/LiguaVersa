import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  async register(data: any) {
    const { email, password, firstName, lastName } = data;
    
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new BadRequestException('User with this email already exists');
    }

    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(password, salt);

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash: hash,
        profile: {
          create: {
            firstName: firstName || email.split('@')[0],
            lastName: lastName || '',
          }
        }
      }
    });

    return this.login(user);
  }

  async login(userOrData: any) {
    let user = userOrData;
    
    if (userOrData.password) {
      user = await this.prisma.user.findUnique({ where: { email: userOrData.email } });
      if (!user || !user.passwordHash) {
        throw new UnauthorizedException('Invalid credentials');
      }
      const isMatch = await bcrypt.compare(userOrData.password, user.passwordHash);
      if (!isMatch) {
        throw new UnauthorizedException('Invalid credentials');
      }
    }

    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email
      }
    };
  }

  async validateOAuthLogin(profile: any) {
    let user = await this.prisma.user.findUnique({ where: { email: profile.email } });
    
    if (!user) {
      // Create new user from OAuth profile
      user = await this.prisma.user.create({
        data: {
          email: profile.email,
          // authProvider: 'google', // Assuming schema updates or generic field
          // isEmailVerified: true,
          profile: {
            create: {
              firstName: profile.firstName,
              lastName: profile.lastName,
              // avatarUrl: profile.picture
            }
          }
        },
        include: { profile: true }
      });
    }

    // Generate JWT
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload)
    };
  }
}
