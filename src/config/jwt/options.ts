import { ConfigService } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';

/**
 * `expiresIn` is typed as a template-literal union ("60s", "2 days", ...)
 * rather than plain string, which no value read from the environment can
 * satisfy statically. JwtVariables validates it at boot instead.
 */
type ExpiresIn = NonNullable<JwtModuleOptions['signOptions']>['expiresIn'];

/**
 * Built lazily from ConfigService for the same reason as the database
 * options: `.env` is only loaded once ConfigModule.forRoot() has run.
 */
export default function jwtOptions(config: ConfigService): JwtModuleOptions {
    return {
        secret: config.getOrThrow<string>('JWT_SECRET_KEY'),
        signOptions: {
            expiresIn: config.getOrThrow<string>('JWT_EXPIRES_IN') as ExpiresIn,
        },
    };
}
