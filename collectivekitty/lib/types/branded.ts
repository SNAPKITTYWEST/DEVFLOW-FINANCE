/**
 * Branded Types - Type Contract for CollectiveKitty
 * 
 * These types prevent accidental mixing of different ID types and provide
 * compile-time safety across the entire application stack.
 * 
 * @remarks
 * - Backend (Bob): Uses these types in all APIs, database operations, and business logic
 * - Frontend (Edualc): Uses these types in all UI components and state management
 * - These contracts are immutable within a sprint - changes require Presidential approval
 * 
 * @example
 * ```typescript
 * import { ContactId, createContactId } from '@/lib/types/branded';
 * 
 * const id = createContactId('contact_123');
 * // id is now typed as ContactId, not string
 * ```
 */

/**
 * Brand utility type - creates a nominal type from a base type
 * @template T - The base type to brand
 * @template B - The brand identifier (unique string literal)
 */
type Brand<T, B extends string> = T & { readonly __brand: B };

// ============================================================================
// CORE ENTITY IDs
// ============================================================================

/**
 * Unique identifier for a Contact entity
 * @remarks Used across CRM, activities, and relationship tracking
 */
export type ContactId = Brand<string, 'ContactId'>;

/**
 * Unique identifier for a Deal entity
 * @remarks Used in CRM pipeline, revenue tracking, and forecasting
 */
export type DealId = Brand<string, 'DealId'>;

/**
 * Unique identifier for a User entity
 * @remarks Used for authentication, ownership, and audit trails
 */
export type UserId = Brand<string, 'UserId'>;

/**
 * Unique identifier for an Event entity
 * @remarks Used in Bifrost pipeline and audit system
 */
export type EventId = Brand<string, 'EventId'>;

/**
 * Unique identifier for a Trace across the Bifrost pipeline
 * @remarks Tracks event lifecycle from ingestion to completion
 */
export type TraceId = Brand<string, 'TraceId'>;

/**
 * Unique identifier for a Transaction entity
 * @remarks Used in finance, accounting, and reconciliation
 */
export type TransactionId = Brand<string, 'TransactionId'>;

/**
 * Unique identifier for a Vendor entity
 * @remarks Used in procurement and spend management
 */
export type VendorId = Brand<string, 'VendorId'>;

/**
 * Unique identifier for a Requisition entity
 * @remarks Used in procurement approval workflows
 */
export type RequisitionId = Brand<string, 'RequisitionId'>;

/**
 * Unique identifier for a Purchase Order entity
 * @remarks Used in procurement and receiving workflows
 */
export type PurchaseOrderId = Brand<string, 'PurchaseOrderId'>;

/**
 * Unique identifier for an Invoice entity
 * @remarks Used in accounts payable and receivable
 */
export type InvoiceId = Brand<string, 'InvoiceId'>;

/**
 * Unique identifier for a Contract entity
 * @remarks Used in contract management and compliance
 */
export type ContractId = Brand<string, 'ContractId'>;
/**
 * Unique identifier for a Project entity
 * @remarks Used in cost allocation, budget tracking, and resource management
 */
export type ProjectId = Brand<string, 'ProjectId'>;


// ============================================================================
// ENUMS & DISCRIMINATED UNIONS
// ============================================================================

/**
 * Deal stages in the CRM pipeline
 * @remarks
 * - prospecting: Initial contact, qualification phase
 * - active: Engaged, moving through sales process
 * - closed-won: Deal successfully closed
 * - closed-lost: Deal lost to competitor or no decision
 * - at-risk: Active deal showing warning signs
 */
export type DealStage = 
  | 'prospecting' 
  | 'active' 
  | 'closed-won' 
  | 'closed-lost' 
  | 'at-risk';

/**
 * Room identifiers for spatial navigation
 * @remarks
 * - crm: Customer relationship management (Phase 1)
 * - finance: Financial operations and GL (Phase 4 - ignition key)
 * - procurement: Vendor and spend management (Phase 3)
 * - war-room: Strategic planning and decision making (Phase 5)
 * - intelligence: Analytics and insights (Phase 6)
 */
export type RoomId = 
  | 'crm' 
  | 'finance' 
  | 'procurement' 
  | 'war-room' 
  | 'intelligence';

/**
 * Risk levels for scoring and alerting
 * @remarks Used by Bifrost scoring engine and notification system
 */
export type RiskLevel = 
  | 'LOW' 
  | 'MEDIUM' 
  | 'HIGH' 
  | 'CRITICAL';

/**
 * Activity types for the activity feed
 * @remarks Determines icon, color, and behavior in UI
 */
export type ActivityType = 
  | 'call' 
  | 'email' 
  | 'note' 
  | 'deal-created' 
  | 'deal-moved' 
  | 'deal-closed' 
  | 'contact-added' 
  | 'task-completed';

/**
 * Event types following Bifrost standard
 * @remarks Namespaced by domain (crm, finance, procurement, etc.)
 */
export type EventType = 
  | 'deal.created'
  | 'deal.stage_changed'
  | 'deal.closed'
  | 'requisition.created'
  | 'requisition.approved'
  | 'requisition.rejected'
  | 'po.created'
  | 'po.received'
  | 'vendor.added'
  | 'invoice.created'
  | 'payment.sent'
  | 'payment.received'
  | 'spend.logged'
  | 'spend.flagged'
  | 'bifrost.ingested'
  | 'bifrost.scored'
  | 'audit.triggered';

// ============================================================================
// CONSTRUCTOR FUNCTIONS
// ============================================================================

/**
 * Creates a branded ContactId from a string
 * @param id - The raw string identifier
 * @returns Branded ContactId
 */
export function createContactId(id: string): ContactId {
  return id as ContactId;
}

/**
 * Creates a branded DealId from a string
 * @param id - The raw string identifier
 * @returns Branded DealId
 */
export function createDealId(id: string): DealId {
  return id as DealId;
}

/**
 * Creates a branded UserId from a string
 * @param id - The raw string identifier
 * @returns Branded UserId
 */
export function createUserId(id: string): UserId {
  return id as UserId;
}

/**
 * Creates a branded EventId from a string
 * @param id - The raw string identifier
 * @returns Branded EventId
 */
export function createEventId(id: string): EventId {
  return id as EventId;
}

/**
 * Creates a branded TraceId from a string
 * @param id - The raw string identifier
 * @returns Branded TraceId
 */
export function createTraceId(id: string): TraceId {
  return id as TraceId;
}

/**
 * Creates a branded TransactionId from a string
 * @param id - The raw string identifier
 * @returns Branded TransactionId
 */
export function createTransactionId(id: string): TransactionId {
  return id as TransactionId;
}

/**
 * Creates a branded VendorId from a string
 * @param id - The raw string identifier
 * @returns Branded VendorId
 */
export function createVendorId(id: string): VendorId {
  return id as VendorId;
}

/**
 * Creates a branded RequisitionId from a string
 * @param id - The raw string identifier
 * @returns Branded RequisitionId
 */
export function createRequisitionId(id: string): RequisitionId {
  return id as RequisitionId;
}

/**
 * Creates a branded PurchaseOrderId from a string
 * @param id - The raw string identifier
 * @returns Branded PurchaseOrderId
 */
export function createPurchaseOrderId(id: string): PurchaseOrderId {
  return id as PurchaseOrderId;
}

/**
 * Creates a branded InvoiceId from a string
 * @param id - The raw string identifier
 * @returns Branded InvoiceId
 */
export function createInvoiceId(id: string): InvoiceId {
  return id as InvoiceId;
}

/**
 * Creates a branded ContractId from a string
 * @param id - The raw string identifier
 * @returns Branded ContractId
 */
export function createContractId(id: string): ContractId {
  return id as ContractId;
}

/**
 * Creates a branded ProjectId from a string
 * @param id - The raw string identifier
 * @returns Branded ProjectId
 */
export function createProjectId(id: string): ProjectId {
  return id as ProjectId;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if a value is a valid DealStage
 * @param value - Value to check
 * @returns True if value is a valid DealStage
 */
export function isDealStage(value: unknown): value is DealStage {
  return typeof value === 'string' && 
    ['prospecting', 'active', 'closed-won', 'closed-lost', 'at-risk'].includes(value);
}

/**
 * Type guard to check if a value is a valid RoomId
 * @param value - Value to check
 * @returns True if value is a valid RoomId
 */
export function isRoomId(value: unknown): value is RoomId {
  return typeof value === 'string' && 
    ['crm', 'finance', 'procurement', 'war-room', 'intelligence'].includes(value);
}

/**
 * Type guard to check if a value is a valid RiskLevel
 * @param value - Value to check
 * @returns True if value is a valid RiskLevel
 */
export function isRiskLevel(value: unknown): value is RiskLevel {
  return typeof value === 'string' && 
    ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(value);
}

/**
 * Type guard to check if a value is a valid UserId
 * @param value - Value to check
 * @returns True if value is a valid UserId format
 */
export function isUserId(value: unknown): value is UserId {
  return typeof value === 'string' && value.startsWith('usr_');
}

/**
 * Type guard to check if a value is a valid RequisitionId
 * @param value - Value to check
 * @returns True if value is a valid RequisitionId format
 */
export function isRequisitionId(value: unknown): value is RequisitionId {
  return typeof value === 'string' && value.startsWith('req_');
}

/**
 * Type guard to check if a value is a valid ProjectId
 * @param value - Value to check
 * @returns True if value is a valid ProjectId format
 */
export function isProjectId(value: unknown): value is ProjectId {
  return typeof value === 'string' && value.startsWith('prj_');
}

/**
 * Type guard to check if a value is a valid VendorId
 * @param value - Value to check
 * @returns True if value is a valid VendorId format
 */
export function isVendorId(value: unknown): value is VendorId {
  return typeof value === 'string' && value.startsWith('vnd_');
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Extracts the raw string value from a branded type
 * @template T - The branded type to unwrap
 * @remarks Use sparingly - only when interfacing with external systems
 */
export type Unbrand<T> = T extends Brand<infer U, string> ? U : T;

/**
 * Type-safe way to unwrap a branded ID to its raw string
 * @param id - The branded ID to unwrap
 * @returns The raw string value
 * @remarks Use only when necessary (e.g., database queries, external APIs)
 */
export function unwrapId<T extends Brand<string, string>>(id: T): string {
  return id as string;
}

// Made with Bob
