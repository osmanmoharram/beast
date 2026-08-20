import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
} from 'class-validator';

/**
 * Passes when the decorated property equals another property on the same
 * object, e.g. @Match('password') on confirm.
 *
 * Built on class-validator's registerDecorator rather than Nest's
 * createParamDecorator: the latter produces a ParameterDecorator meant for
 * controller arguments, which cannot be applied to a DTO property.
 */
export function Match(property: string, validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string): void {
        registerDecorator({
            name: 'match',
            target: object.constructor,
            propertyName,
            constraints: [property],
            options: validationOptions,
            validator: {
                validate(value: unknown, args: ValidationArguments): boolean {
                    const [relatedProperty] = args.constraints as [string];
                    const related = (args.object as Record<string, unknown>)[
                        relatedProperty
                    ];

                    return value === related;
                },
                defaultMessage(args: ValidationArguments): string {
                    const [relatedProperty] = args.constraints as [string];

                    return `${args.property} must match ${relatedProperty}`;
                },
            },
        });
    };
}
