import {
    registerDecorator,
    ValidationOptions,
    ValidationArguments,
} from 'class-validator';

export function ConfirmPassword(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string): void {
        registerDecorator({
            name: 'confirmPassword',
            target: object.constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(value: unknown, args: ValidationArguments): boolean {
                    const password = (args.object as Record<string, unknown>)
                        .password;

                    return typeof password === 'string' && value === password;
                },

                defaultMessage(): string {
                    return `password confirmation failed`;
                },
            },
        });
    };
}
