import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID || 'missing_client_id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'missing_client_secret',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'https://liguaversa-1.onrender.com/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any> {
    const { name, emails, photos } = profile;
    const user = {
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      picture: photos[0].value,
    };
    
    try {
      // Find or create user in our DB
      const dbUser = await this.authService.validateOAuthLogin(user);
      done(null, dbUser);
    } catch (err) {
      done(err, false);
    }
  }
}
