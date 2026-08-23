import { ClassConstructor, plainToInstance } from 'class-transformer';
import { getMetadataStorage, validateSync } from 'class-validator';
import { DatabaseVariables } from './database/schema';
import { EnvironmentVariables } from './app/schema';
import { JwtVariables } from './jwt/schema';
import { UploadsVariables } from './uploads/schema';

const schemas: ClassConstructor<object>[] = [
    EnvironmentVariables,
    DatabaseVariables,
    JwtVariables,
    UploadsVariables,
];

/**
 * Properties a schema actually declares. `plainToInstance` copies unknown keys
 * through untransformed, so merging a whole instance would let one schema
 * overwrite another's converted values with the raw strings.
 */
function declaredKeys(schema: ClassConstructor<object>): string[] {
    const metadata = getMetadataStorage().getTargetValidationMetadatas(
        schema,
        schema.name,
        true,
        false,
    );

    return [...new Set(metadata.map((entry) => entry.propertyName))];
}

export default function validate(
    config: Record<string, unknown>,
): Record<string, unknown> {
    const validated = schemas.map((schema) => {
        const instance = plainToInstance(schema, config, {
            enableImplicitConversion: false,
        });
        const errors = validateSync(instance, { skipMissingProperties: false });
        return {
            schema,
            instance: instance as Record<string, unknown>,
            errors,
        };
    });

    const errors = validated.flatMap((v) => v.errors);
    if (errors.length > 0) {
        throw new Error(
            `Invalid environment configuration:\n${errors.join('\n')}`,
        );
    }

    const merged: Record<string, unknown> = { ...config };
    for (const { schema, instance } of validated) {
        for (const key of declaredKeys(schema)) {
            merged[key] = instance[key];
        }
    }

    return merged;
}
