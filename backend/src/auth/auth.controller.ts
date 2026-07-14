import { Controller, Post, Body, HttpCode, HttpStatus, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body) {
    return this.authService.register(body);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() body) {
    return this.authService.login(body);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {
    // Initiates the Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(@Req() req, @Res() res) {
    // Req.user contains the JWT and user info returned from validateOAuthLogin
    const token = req.user.access_token;
    
    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'https://ligua-versa-rlroyx4la-priyanshu0707july-arts-projects.vercel.app';
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  }
}
