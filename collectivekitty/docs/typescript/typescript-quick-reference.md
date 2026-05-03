# TypeScript Quick Reference (90s Read)

## Branded Types
Use for domain identifiers to prevent accidental mixing of IDs.
```typescript
type ContactId = string & { readonly __brand: 'ContactId' };
const id = '123' as ContactId;
```

## Pattern: Exhaustive Checks
Always use `never` in switch-case to ensure all unions are handled.
```typescript
type Status = 'idle' | 'busy';
switch (status) {
  case 'idle': ...
  case 'busy': ...
  default: const _exhaustive: never = status;
}
```

## Component Props
Interface over Type for public APIs (better IDE tooltips and extendability).
```typescript
interface ButtonProps {
  label: string;
  onClick: () => void;
}
```
