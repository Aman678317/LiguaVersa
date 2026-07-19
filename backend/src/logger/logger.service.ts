import { WinstonModule, utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';

const piiMasker = winston.format((info) => {
  // Deep clone to prevent mutating original object
  const clone = JSON.parse(JSON.stringify(info));
  
  const maskPii = (obj: any) => {
    if (!obj || typeof obj !== 'object') return;
    for (const key of Object.keys(obj)) {
      const lowerKey = key.toLowerCase();
      if (typeof obj[key] === 'string') {
        if (lowerKey.includes('email') || lowerKey.includes('password') || lowerKey.includes('token') || lowerKey.includes('secret')) {
          obj[key] = '***MASKED***';
        }
      } else if (typeof obj[key] === 'object') {
        maskPii(obj[key]);
      }
    }
  };

  maskPii(clone);
  return clone;
});

export const WinstonConfig = WinstonModule.createLogger({
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.ms(),
        piiMasker(),
        nestWinstonModuleUtilities.format.nestLike('LinguaVersaAI', {
          colors: true,
          prettyPrint: true,
        }),
      ),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        piiMasker(),
        winston.format.json()
      )
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        piiMasker(),
        winston.format.json()
      )
    }),
  ],
});
