# Branded Types Migration Guide

## Why?
To stop passing a `UserId` into a function expecting a `ContactId`. They are both strings at runtime, but TypeScript will block this at compile-time.

## Before vs After

**Before (Unsafe):**
```typescript
function getContact(id: string) { ... }
const userId = 'user_123';
getContact(userId); // ✅ Works, but shouldn't!
```

**After (Safe):**
```typescript
import { ContactId, makeContactId } from '@/lib/types/branded';
function getContact(id: ContactId) { ... }
const userId = 'user_123' as UserId;
getContact(userId); // ❌ Error: UserId is not assignable to ContactId
```

## Creating New Types
1. Add to `lib/types/branded.ts`:
```typescript
export type ProjectId = string & { readonly __brand: 'ProjectId' };
export const makeProjectId = (id: string): ProjectId => id as ProjectId;
```

## Common Mistakes
1. **Raw Casting**: Avoid `as ContactId` in business logic; use `makeContactId()`.
2. **Missing Brand**: Forgetting the `readonly __brand` property makes it a simple alias.
3. **Database Mapping**: Prisma returns raw strings. Map them to branded types at the Repository boundary.
