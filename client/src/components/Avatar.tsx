type AvatarProps = {
    src: string;
    name: string;
    size?: number;
};

/**
 * `src` is never empty — the API substitutes a generated Gravatar for a
 * profile that has not uploaded anything — so there is no placeholder branch.
 */
export function Avatar({ src, name, size = 40 }: AvatarProps) {
    return (
        <img
            className="avatar"
            src={src}
            alt={`${name}'s avatar`}
            width={size}
            height={size}
            loading="lazy"
        />
    );
}
