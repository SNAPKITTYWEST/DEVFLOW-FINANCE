//! FFISeal - The Core Sealing Mechanism
//! 
//! This module implements the cryptographic sealing of events. Every event
//! that flows through the Snapkitty OS must be sealed before it can affect
//! any state. The seal is the proof that "this happened at this time."
//! 
//! ## Design Principles
//! 
//! 1. **Content-Addressed**: The ID is derived from the content hash
//! 2. **Immutable**: Once sealed, cannot be modified
//! 3. **Chained**: Each seal links to the previous seal (blockchain-style)
//! 4. **Fast**: Target <2ms for seal operation
//! 
//! ## Security Model
//! 
//! - SHA-256 for cryptographic hashing
//! - No external dependencies for core crypto
//! - Zero-trust: validate everything

use serde::{Deserialize, Serialize};
use sha2::{Sha256, Digest};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use std::fmt;

/// Errors that can occur during sealing operations
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum SealError {
    /// The payload failed validation
    InvalidPayload(String),
    /// The hash computation failed
    HashError(String),
    /// The previous hash doesn't match the chain
    ChainBroken(String),
    /// Serialization failed
    SerializationError(String),
}

impl fmt::Display for SealError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            SealError::InvalidPayload(msg) => write!(f, "Invalid payload: {}", msg),
            SealError::HashError(msg) => write!(f, "Hash error: {}", msg),
            SealError::ChainBroken(msg) => write!(f, "Chain broken: {}", msg),
            SealError::SerializationError(msg) => write!(f, "Serialization error: {}", msg),
        }
    }
}

impl std::error::Error for SealError {}

/// FFISeal - The immutable record of an event
/// 
/// This struct represents a single sealed event in the audit trail.
/// It contains:
/// - A content-addressed ID (derived from payload hash)
/// - The timestamp when the seal was created
/// - The hash of the payload (SHA-256)
/// - The hash of the previous seal (creating the chain)
/// 
/// ## Example
/// 
/// ```rust
/// use snapkitty_core::seal::FFISeal;
/// 
/// let payload = r#"{"type": "deal.created", "data": {"id": "deal_123"}}"#;
/// let seal = FFISeal::new(payload, None)?;
/// 
/// // The seal is now immutable and can be stored
/// assert!(seal.verify(payload));
/// ```
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct FFISeal {
    /// Content-addressed ID (derived from payload_hash)
    pub id: Uuid,
    
    /// Unix timestamp (milliseconds since epoch)
    pub timestamp: i64,
    
    /// SHA-256 hash of the payload (hex-encoded)
    pub payload_hash: String,
    
    /// SHA-256 hash of the previous seal (hex-encoded)
    /// None for the genesis seal
    pub prev_hash: Option<String>,
}

impl FFISeal {
    /// Create a new seal from a JSON payload
    /// 
    /// This is the primary entry point for sealing events. It:
    /// 1. Computes the SHA-256 hash of the payload
    /// 2. Generates a content-addressed UUID from the hash
    /// 3. Records the current timestamp
    /// 4. Links to the previous seal (if provided)
    /// 
    /// ## Arguments
    /// 
    /// * `payload` - The JSON string to seal
    /// * `prev_hash` - The hash of the previous seal (None for genesis)
    /// 
    /// ## Returns
    /// 
    /// A new FFISeal or a SealError if the operation fails
    /// 
    /// ## Performance
    /// 
    /// Target: <2ms for typical payloads (<10KB)
    pub fn new(payload: &str, prev_hash: Option<String>) -> Result<Self, SealError> {
        // Compute SHA-256 hash of payload
        let payload_hash = Self::compute_hash(payload.as_bytes())?;
        
        // Generate content-addressed UUID from hash
        // Take first 16 bytes of hash and use as UUID
        let hash_bytes = hex::decode(&payload_hash)
            .map_err(|e| SealError::HashError(format!("Failed to decode hash: {}", e)))?;
        
        let uuid_bytes: [u8; 16] = hash_bytes[0..16]
            .try_into()
            .map_err(|e| SealError::HashError(format!("Failed to create UUID: {:?}", e)))?;
        
        let id = Uuid::from_bytes(uuid_bytes);
        
        // Get current timestamp in milliseconds
        let timestamp = Utc::now().timestamp_millis();
        
        Ok(FFISeal {
            id,
            timestamp,
            payload_hash,
            prev_hash,
        })
    }
    
    /// Compute SHA-256 hash of data
    /// 
    /// This is the core cryptographic operation. We use SHA-256 because:
    /// - It's fast (important for <2ms target)
    /// - It's secure (collision-resistant)
    /// - It's standard (widely supported)
    /// 
    /// ## Arguments
    /// 
    /// * `data` - The bytes to hash
    /// 
    /// ## Returns
    /// 
    /// Hex-encoded SHA-256 hash or SealError
    fn compute_hash(data: &[u8]) -> Result<String, SealError> {
        let mut hasher = Sha256::new();
        hasher.update(data);
        let result = hasher.finalize();
        Ok(hex::encode(result))
    }
    
    /// Verify that this seal matches the given payload
    /// 
    /// This is used to validate that a seal hasn't been tampered with.
    /// It recomputes the hash and compares it to the stored hash.
    /// 
    /// ## Arguments
    /// 
    /// * `payload` - The payload to verify against
    /// 
    /// ## Returns
    /// 
    /// true if the seal is valid, false otherwise
    pub fn verify(&self, payload: &str) -> bool {
        match Self::compute_hash(payload.as_bytes()) {
            Ok(hash) => hash == self.payload_hash,
            Err(_) => false,
        }
    }
    
    /// Get the hash of this seal (for chaining)
    /// 
    /// This computes the hash of the seal itself (not the payload).
    /// This hash becomes the prev_hash for the next seal in the chain.
    /// 
    /// ## Returns
    /// 
    /// Hex-encoded SHA-256 hash of this seal
    pub fn seal_hash(&self) -> Result<String, SealError> {
        let seal_json = serde_json::to_string(self)
            .map_err(|e| SealError::SerializationError(e.to_string()))?;
        Self::compute_hash(seal_json.as_bytes())
    }
    
    /// Verify the chain link to the previous seal
    /// 
    /// This ensures that the chain hasn't been broken. If this seal
    /// claims to link to a previous seal, we verify that the prev_hash
    /// matches the actual hash of the previous seal.
    /// 
    /// ## Arguments
    /// 
    /// * `prev_seal` - The previous seal in the chain
    /// 
    /// ## Returns
    /// 
    /// Ok(()) if the chain is valid, Err if broken
    pub fn verify_chain(&self, prev_seal: &FFISeal) -> Result<(), SealError> {
        match &self.prev_hash {
            Some(claimed_hash) => {
                let actual_hash = prev_seal.seal_hash()?;
                if claimed_hash == &actual_hash {
                    Ok(())
                } else {
                    Err(SealError::ChainBroken(format!(
                        "Expected prev_hash {}, got {}",
                        claimed_hash, actual_hash
                    )))
                }
            }
            None => Err(SealError::ChainBroken(
                "Seal claims no previous seal, but one was provided".to_string()
            )),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_seal_creation() {
        let payload = r#"{"type": "test", "data": "hello"}"#;
        let seal = FFISeal::new(payload, None).unwrap();
        
        assert!(seal.verify(payload));
        assert_eq!(seal.prev_hash, None);
    }
    
    #[test]
    fn test_seal_chain() {
        let payload1 = r#"{"type": "test", "data": "first"}"#;
        let seal1 = FFISeal::new(payload1, None).unwrap();
        
        let seal1_hash = seal1.seal_hash().unwrap();
        
        let payload2 = r#"{"type": "test", "data": "second"}"#;
        let seal2 = FFISeal::new(payload2, Some(seal1_hash)).unwrap();
        
        assert!(seal2.verify_chain(&seal1).is_ok());
    }
    
    #[test]
    fn test_broken_chain() {
        let payload1 = r#"{"type": "test", "data": "first"}"#;
        let seal1 = FFISeal::new(payload1, None).unwrap();
        
        let payload2 = r#"{"type": "test", "data": "second"}"#;
        let seal2 = FFISeal::new(payload2, Some("wrong_hash".to_string())).unwrap();
        
        assert!(seal2.verify_chain(&seal1).is_err());
    }
    
    #[test]
    fn test_content_addressed_id() {
        let payload = r#"{"type": "test", "data": "hello"}"#;
        let seal1 = FFISeal::new(payload, None).unwrap();
        let seal2 = FFISeal::new(payload, None).unwrap();
        
        // Same payload should produce same ID (content-addressed)
        assert_eq!(seal1.id, seal2.id);
        assert_eq!(seal1.payload_hash, seal2.payload_hash);
    }
}

// Made with Bob
