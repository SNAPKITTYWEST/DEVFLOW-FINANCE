/**
 * Branded Types for Collective Kitty
 * Ensuring type safety across the domain.
 */

export type ContactId = string & { readonly __brand: 'ContactId' };
export type DealId = string & { readonly __brand: 'DealId' };
export type UserId = string & { readonly __brand: 'UserId' };

export type DealStage =
  | 'PROSPECTING'
  | 'QUALIFIED'
  | 'PROPOSAL'
  | 'NEGOTIATION'
  | 'CLOSED_WON'
  | 'CLOSED_LOST';

export const makeContactId = (id: string): ContactId => id as ContactId;
export const makeDealId = (id: string): DealId => id as DealId;
export const makeUserId = (id: string): UserId => id as UserId;
