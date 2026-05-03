//! Snapkitty Core - The Sovereign Immutable State Machine
//! 
//! This is the "Vault Door" - the cryptographic sealing layer that ensures
//! every state change in the Snapkitty OS is immutably recorded.
//! 
//! ## Architecture
//! 
//! 1. **FFISeal**: The core data structure representing a sealed event
//! 2. **Chain**: Linked list of seals creating an immutable audit trail
//! 3. **Validation**: Zero-trust schema validation before sealing
//! 4. **Storage**: Content-addressed append-only log
//! 
//! ## Performance Targets
//! 
//! - Seal operation: <2ms
//! - Mirror operation: <10ms
//! - Zero allocations in hot path
//! 
//! ## Mission
//! 
//! "If I pull the plug at 3:01 AM, reconstruct entire company state from log."

pub mod seal;
pub mod chain;
pub mod validate;
pub mod storage;

#[cfg(target_arch = "wasm32")]
pub mod wasm;

pub use seal::{FFISeal, SealError};
pub use chain::{Chain, ChainError};
pub use validate::{validate_payload, ValidationError};
pub use storage::{AppendOnlyLog, StorageError};

/// Re-export commonly used types
pub use uuid::Uuid;
pub use chrono::{DateTime, Utc};

// Made with Bob
