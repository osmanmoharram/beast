import { DefaultNamingStrategy, NamingStrategyInterface } from 'typeorm';

const IRREGULAR: Record<string, string> = {
    person: 'people',
    child: 'children',
    man: 'men',
    woman: 'women',
    tooth: 'teeth',
    foot: 'feet',
    mouse: 'mice',
    goose: 'geese',
};

/**
 * English pluralisation for the common cases only. Anything unusual is better
 * spelled out with @Entity('name'), which this strategy leaves untouched.
 */
function pluralize(word: string): string {
    const lower = word.toLowerCase();
    if (IRREGULAR[lower]) return IRREGULAR[lower];
    if (/(s|x|z|ch|sh)$/.test(lower)) return `${word}es`;
    if (/[^aeiou]y$/.test(lower)) return `${word.slice(0, -1)}ies`;
    return `${word}s`;
}

/**
 * Pluralises table names derived from entity class names, so `User` becomes
 * `users` and `UserProfile` becomes `user_profiles`. A name passed explicitly
 * to @Entity() always wins.
 */
export class PluralNamingStrategy
    extends DefaultNamingStrategy
    implements NamingStrategyInterface
{
    tableName(
        targetName: string,
        userSpecifiedName: string | undefined,
    ): string {
        if (userSpecifiedName) return userSpecifiedName;

        const snakeCased = super.tableName(targetName, undefined);
        const parts = snakeCased.split('_');
        parts[parts.length - 1] = pluralize(parts[parts.length - 1]);

        return parts.join('_');
    }
}
