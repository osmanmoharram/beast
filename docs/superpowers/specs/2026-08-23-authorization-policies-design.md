# Authorization Policies

Design for the `policies` item in `mission.md`.

Branch: `feature/add-policies`, off `main` at `20c58ec`.

## Problem

Every mutating route in the API is reachable by any authenticated user,
against any other user's data. The `AuthGuard` answers "is this a valid
token" and nothing else, so authentication is enforced and authorization
is absent.

| Route | Ownership check today |
| --- | --- |
| `PATCH`/`DELETE /posts/:id` | none |
| `PATCH`/`DELETE /posts/:postId/comments/:id` | none |
| `PATCH /profiles/:id` | none |
| `PATCH`/`DELETE /users/:id` | none |

The last row is an account takeover, not just a data-integrity gap.
`UpdateUserDto` extends `PartialType(CreateUserDto)` and therefore carries
`password`; `UsersController.update` passes the body to
`UsersService.update`, which hashes the new password and saves it. Any
authenticated user can set any other user's password, or delete the
account outright. Closing this is the priority within this work.

## Decisions

Each of these was chosen deliberately; the rejected alternative is
recorded so a later reader does not relitigate it.

**Ownership only, no roles.** A rule expresses "you may mutate what you
own". No `role` column, no migration, no first-admin bootstrap. This is
the smallest change that closes every gap above. Roles can be layered on
later without redoing any of it.

**A guard plus a decorator, not service-level assertions.** The check is
declarative and lives at the route, rather than being threaded through
every service method as an extra `userId` parameter. The cost is one
additional database read per guarded request, because the guard loads the
row to inspect its owner and the service then loads it again. Accepted
knowingly.

**403 for a resource that exists but is not yours; 404 when it does not
exist.** Every one of these resources is already readable by any
authenticated user through its `GET` route, so collapsing both cases into
404 would hide nothing from an attacker while making ordinary debugging
harder.

## Design

### The decorator

```ts
// src/common/policies/owns.decorator.ts
export const OWNERSHIP_KEY = 'ownership';

export type OwnershipRule = {
    entity: EntityTarget<ObjectLiteral>;
    path: string;
    param: string;
};

export function Owns(
    entity: EntityTarget<ObjectLiteral>,
    path: string,
    param = 'id',
) {
    return applyDecorators(
        SetMetadata(OWNERSHIP_KEY, { entity, path, param }),
        UseGuards(PolicyGuard),
    );
}
```

Bundling `UseGuards` into the decorator is a correctness requirement, not
a convenience. Nest runs globally registered guards before route-scoped
ones, so binding `PolicyGuard` at the route guarantees `AuthGuard` has
already populated `request.user`. Registering `PolicyGuard` as a second
`APP_GUARD` would instead make that ordering depend on module import
order, which breaks silently and at a distance.

### The guard

```ts
// src/common/policies/policy.guard.ts
@Injectable()
export class PolicyGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        @InjectDataSource() private readonly dataSource: DataSource,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> { ... }
}
```

Resolving the repository through `DataSource.getRepository(rule.entity)`
means the entity named in the decorator *is* the lookup. There is no
resource-to-repository registry to keep in sync.

Algorithm:

1. Read the `OwnershipRule` off the handler, then the class. No rule
   means the route is unguarded — return `true`.
2. Take the caller's id from `request.user.sub`.
3. Parse `request.params[rule.param]` as an integer. A non-integer is a
   `NotFoundException`, so a garbage id never reaches the database.
4. Split `rule.path` on `.`. Two segments (`author.id`) means load that
   relation and read its `id`. One segment (`id`) means read the column
   directly, for the case where the row is its own owner.
5. Load the row. `null` is a `NotFoundException`.
6. Compare the resolved owner id to the caller's. A mismatch is a
   `ForbiddenException`.

`PolicyGuard` is listed in the `providers` array of each module whose
controller uses it. Its dependencies — `Reflector`, and the `DataSource`
that `TypeOrmModule.forRootAsync` exposes globally — may well resolve
without that entry, but relying on it would make instantiation depend on
which module context Nest happens to build the guard in. Four explicit
lines are worth more than that ambiguity.

### Application

| Route | Decorator |
| --- | --- |
| `PATCH`/`DELETE /posts/:id` | `@Owns(Post, 'author.id')` |
| `PATCH`/`DELETE /posts/:postId/comments/:id` | `@Owns(Comment, 'author.id')` |
| `PATCH /profiles/:id` | `@Owns(Profile, 'user.id')` |
| `PATCH`/`DELETE /users/:id` | `@Owns(User, 'id')` |

`GET` routes are untouched: reads stay open, which is how the API already
behaves. `POST` routes need nothing, since a caller cannot fail to own a
resource that does not exist yet.

### Files

New:

- `src/common/policies/owns.decorator.ts`
- `src/common/policies/policy.guard.ts`

Modified:

- `src/posts/posts.controller.ts`, `src/posts/posts.module.ts`
- `src/comments/comments.controller.ts`, `src/comments/comments.module.ts`
- `src/profiles/profiles.controller.ts`, `src/profiles/profiles.module.ts`
- `src/users/users.controller.ts`, `src/users/users.module.ts`
- `mission.md` — drop the `policies` heading

### Existing checks are kept

`CommentsService.assertCommentBelongsToPost` stays. It guards the
`postId`/`id` pairing that the nested URL claims, which is a different
question from ownership and one the guard does not answer.

The `NotFoundException`s already in the services also stay. The guard
makes them unreachable on guarded routes, but those service methods
remain callable from elsewhere and must not be safe only by coincidence
of a guard having run first.

## Out of scope

- Roles and administrative override.
- Field-level rules, such as forbidding `password` in `PATCH /users/:id`
  from anyone, including its owner.
- The three items still open from the profiles work: `GET /profiles`
  exposing `user.email`; register nesting a profile in its response while
  login does not; and `UpdateUserDto` inheriting validators that reject a
  user's own unchanged `username` or `email`.

## Verification

Two registered users. Each attempts every mutating route against the
other's resources, expecting `403`, and against their own, expecting
success. Missing ids expected to return `404`. Run against the live API,
as with the rest of this session's work.

This is a smoke script, not a regression net. The repository has no test
suite, which for an authorization layer is a genuine weakness: a silent
break here is a security bug and nothing would catch it. Adding tests is
proposed as the mission following this one rather than bolted on here.

## Risks

- **The extra read is a real cost** on hot mutating routes. If it ever
  matters, the fix is to fold ownership into the service's own query, at
  the price of the declarative form.
- **A route can be left undecorated.** Nothing forces `@Owns` onto a new
  mutating route; forgetting it fails open. Tests would catch this, which
  is a further argument for the mission after this one.
