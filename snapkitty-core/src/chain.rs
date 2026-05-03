//! Chain - The Immutable Audit Trail
//! 
//! This module manages the chain of seals. Each seal links to the previous
//! seal, creating an immutable audit trail. If any seal is tampered with,
//! the chain breaks and we know immediately.
//! 
//! ## Design
//! 
//! The chain is a linked list where each node is a seal. The chain maintains:
//! - The genesis seal (first seal, no previous)
//! - The current head (most recent seal)
//! - The total length (number of seals)
//! 
//! ## Invariants
//! 
//! 1. The genesis seal has no prev_hash
//! 2. Every other seal must have a valid prev_hash
//! 3. The chain is append-only (no deletions, no modifications)
//! 4. Every seal must verify against its payload

use crate::seal::{FFISeal, SealError};
use serde::{Deserialize, Serialize};
use std::fmt;

/// Errors that can occur during chain operations
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ChainError {
    /// The chain is empty
    EmptyChain,
    /// The seal doesn't link to the current head
    InvalidLink(String),
    /// The chain verification failed
    VerificationFailed(String),
    /// Seal error occurred
    SealError(SealError),
}

impl fmt::Display for ChainError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ChainError::EmptyChain => write!(f, "Chain is empty"),
            ChainError::InvalidLink(msg) => write!(f, "Invalid link: {}", msg),
            ChainError::VerificationFailed(msg) => write!(f, "Verification failed: {}", msg),
            ChainError::SealError(e) => write!(f, "Seal error: {}", e),
        }
    }
}

impl std::error::Error for ChainError {}

impl From<SealError> for ChainError {
    fn from(e: SealError) -> Self {
        ChainError::SealError(e)
    }
}

/// Chain - The immutable audit trail
/// 
/// This struct manages the chain of seals. It ensures that:
/// - Every seal links correctly to the previous seal
/// - The chain can be verified at any time
/// - The chain is append-only
/// 
/// ## Example
/// 
/// ```rust
/// use snapkitty_core::chain::Chain;
/// 
/// let mut chain = Chain::new();
/// 
/// let payload1 = r#"{"type": "deal.created", "data": {"id": "deal_123"}}"#;
/// chain.append(payload1)?;
/// 
/// let payload2 = r#"{"type": "deal.updated", "data": {"id": "deal_123"}}"#;
/// chain.append(payload2)?;
/// 
/// assert_eq!(chain.length(), 2);
/// assert!(chain.verify().is_ok());
/// ```
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Chain {
    /// The genesis seal (first seal in the chain)
    genesis: Option<FFISeal>,
    
    /// The current head (most recent seal)
    head: Option<FFISeal>,
    
    /// Total number of seals in the chain
    length: usize,
    
    /// All seals in the chain (for verification)
    /// In production, this would be stored in the append-only log
    /// and loaded on demand. For now, we keep them in memory.
    seals: Vec<FFISeal>,
}

impl Chain {
    /// Create a new empty chain
    pub fn new() -> Self {
        Chain {
            genesis: None,
            head: None,
            length: 0,
            seals: Vec::new(),
        }
    }
    
    /// Append a new seal to the chain
    /// 
    /// This is the primary operation for adding events to the audit trail.
    /// It:
    /// 1. Creates a new seal from the payload
    /// 2. Links it to the current head (or None for genesis)
    /// 3. Verifies the link is valid
    /// 4. Updates the chain state
    /// 
    /// ## Arguments
    /// 
    /// * `payload` - The JSON string to seal and append
    /// 
    /// ## Returns
    /// 
    /// The new seal or a ChainError if the operation fails
    /// 
    /// ## Performance
    /// 
    /// Target: <2ms for seal creation + chain update
    pub fn append(&mut self, payload: &str) -> Result<FFISeal, ChainError> {
        // Get the hash of the current head (if any)
        let prev_hash = match &self.head {
            Some(head) => Some(head.seal_hash()?),
            None => None,
        };
        
        // Create new seal
        let seal = FFISeal::new(payload, prev_hash)?;
        
        // Verify the seal is valid
        if !seal.verify(payload) {
            return Err(ChainError::VerificationFailed(
                "Seal verification failed".to_string()
            ));
        }
        
        // If this isn't the genesis seal, verify the chain link
        if let Some(head) = &self.head {
            seal.verify_chain(head)?;
        }
        
        // Update chain state
        if self.genesis.is_none() {
            self.genesis = Some(seal.clone());
        }
        
        self.head = Some(seal.clone());
        self.length += 1;
        self.seals.push(seal.clone());
        
        Ok(seal)
    }
    
    /// Get the current head of the chain
    pub fn head(&self) -> Option<&FFISeal> {
        self.head.as_ref()
    }
    
    /// Get the genesis seal
    pub fn genesis(&self) -> Option<&FFISeal> {
        self.genesis.as_ref()
    }
    
    /// Get the length of the chain
    pub fn length(&self) -> usize {
        self.length
    }
    
    /// Check if the chain is empty
    pub fn is_empty(&self) -> bool {
        self.length == 0
    }
    
    /// Verify the entire chain
    /// 
    /// This walks through the entire chain and verifies:
    /// 1. Every seal links correctly to the previous seal
    /// 2. The genesis seal has no prev_hash
    /// 3. Every other seal has a valid prev_hash
    /// 
    /// ## Returns
    /// 
    /// Ok(()) if the chain is valid, Err if any seal is invalid
    /// 
    /// ## Performance
    /// 
    /// O(n) where n is the length of the chain
    /// For a chain of 10,000 seals, this should take <100ms
    pub fn verify(&self) -> Result<(), ChainError> {
        if self.is_empty() {
            return Ok(());
        }
        
        // Verify genesis seal has no prev_hash
        if let Some(genesis) = &self.genesis {
            if genesis.prev_hash.is_some() {
                return Err(ChainError::VerificationFailed(
                    "Genesis seal should not have prev_hash".to_string()
                ));
            }
        }
        
        // Verify each seal links to the previous seal
        for i in 1..self.seals.len() {
            let prev_seal = &self.seals[i - 1];
            let curr_seal = &self.seals[i];
            
            curr_seal.verify_chain(prev_seal)?;
        }
        
        Ok(())
    }
    
    /// Get a seal by index
    /// 
    /// ## Arguments
    /// 
    /// * `index` - The index of the seal (0-based)
    /// 
    /// ## Returns
    /// 
    /// The seal at the given index or None if out of bounds
    pub fn get(&self, index: usize) -> Option<&FFISeal> {
        self.seals.get(index)
    }
    
    /// Get all seals in the chain
    /// 
    /// ## Returns
    /// 
    /// A slice of all seals in the chain
    pub fn seals(&self) -> &[FFISeal] {
        &self.seals
    }
}

impl Default for Chain {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_empty_chain() {
        let chain = Chain::new();
        assert!(chain.is_empty());
        assert_eq!(chain.length(), 0);
        assert!(chain.head().is_none());
        assert!(chain.genesis().is_none());
    }
    
    #[test]
    fn test_append_genesis() {
        let mut chain = Chain::new();
        let payload = r#"{"type": "test", "data": "genesis"}"#;
        
        let seal = chain.append(payload).unwrap();
        
        assert_eq!(chain.length(), 1);
        assert!(chain.genesis().is_some());
        assert!(chain.head().is_some());
        assert_eq!(chain.genesis().unwrap().id, seal.id);
        assert_eq!(chain.head().unwrap().id, seal.id);
    }
    
    #[test]
    fn test_append_multiple() {
        let mut chain = Chain::new();
        
        let payload1 = r#"{"type": "test", "data": "first"}"#;
        let seal1 = chain.append(payload1).unwrap();
        
        let payload2 = r#"{"type": "test", "data": "second"}"#;
        let seal2 = chain.append(payload2).unwrap();
        
        let payload3 = r#"{"type": "test", "data": "third"}"#;
        let seal3 = chain.append(payload3).unwrap();
        
        assert_eq!(chain.length(), 3);
        assert_eq!(chain.genesis().unwrap().id, seal1.id);
        assert_eq!(chain.head().unwrap().id, seal3.id);
    }
    
    #[test]
    fn test_chain_verification() {
        let mut chain = Chain::new();
        
        chain.append(r#"{"type": "test", "data": "first"}"#).unwrap();
        chain.append(r#"{"type": "test", "data": "second"}"#).unwrap();
        chain.append(r#"{"type": "test", "data": "third"}"#).unwrap();
        
        assert!(chain.verify().is_ok());
    }
    
    #[test]
    fn test_get_seal() {
        let mut chain = Chain::new();
        
        let payload1 = r#"{"type": "test", "data": "first"}"#;
        let seal1 = chain.append(payload1).unwrap();
        
        let payload2 = r#"{"type": "test", "data": "second"}"#;
        let seal2 = chain.append(payload2).unwrap();
        
        assert_eq!(chain.get(0).unwrap().id, seal1.id);
        assert_eq!(chain.get(1).unwrap().id, seal2.id);
        assert!(chain.get(2).is_none());
    }
}

// Made with Bob
