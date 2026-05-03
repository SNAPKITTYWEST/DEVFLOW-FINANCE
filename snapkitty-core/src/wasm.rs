//! WASM Bridge - TypeScript Interface
//! 
//! This module provides the WASM bindings for the TypeScript layer.
//! It exposes the Rust functions as JavaScript functions that can be
//! called from Node.js or the browser.
//! 
//! ## Functions Exposed
//! 
//! - `seal_payload`: Create a seal from a JSON payload
//! - `verify_seal`: Verify a seal against a payload
//! - `verify_chain_link`: Verify a seal links to previous seal
//! 
//! ## Usage from TypeScript
//! 
//! ```typescript
//! import { seal_payload, verify_seal } from 'snapkitty-core';
//! 
//! const payload = JSON.stringify({
///   type: 'deal.created',
///   room: 'crm',
///   data: { id: 'deal_123', value: 50000 }
/// });
/// 
/// const seal = seal_payload(payload, null);
/// console.log('Sealed:', seal);
/// 
/// const isValid = verify_seal(seal, payload);
/// console.log('Valid:', isValid);
/// ```

use wasm_bindgen::prelude::*;
use crate::seal::FFISeal;
use crate::validate::validate_payload;

/// Seal a JSON payload
/// 
/// This is the primary entry point from TypeScript. It:
/// 1. Validates the payload schema
/// 2. Creates a seal
/// 3. Returns the seal as JSON
/// 
/// ## Arguments
/// 
/// * `payload` - JSON string to seal
/// * `prev_hash` - Optional previous seal hash (null for genesis)
/// 
/// ## Returns
/// 
/// JSON string containing the seal or error
#[wasm_bindgen]
pub fn seal_payload(payload: &str, prev_hash: Option<String>) -> Result<String, JsValue> {
    // Validate payload schema
    validate_payload(payload)
        .map_err(|e| JsValue::from_str(&format!("Validation error: {}", e)))?;
    
    // Create seal
    let seal = FFISeal::new(payload, prev_hash)
        .map_err(|e| JsValue::from_str(&format!("Seal error: {}", e)))?;
    
    // Serialize to JSON
    serde_json::to_string(&seal)
        .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
}

/// Verify a seal against a payload
/// 
/// ## Arguments
/// 
/// * `seal_json` - JSON string containing the seal
/// * `payload` - JSON string to verify against
/// 
/// ## Returns
/// 
/// true if valid, false otherwise
#[wasm_bindgen]
pub fn verify_seal(seal_json: &str, payload: &str) -> Result<bool, JsValue> {
    // Deserialize seal
    let seal: FFISeal = serde_json::from_str(seal_json)
        .map_err(|e| JsValue::from_str(&format!("Deserialization error: {}", e)))?;
    
    // Verify
    Ok(seal.verify(payload))
}

/// Verify a seal links to the previous seal
/// 
/// ## Arguments
/// 
/// * `seal_json` - JSON string containing the current seal
/// * `prev_seal_json` - JSON string containing the previous seal
/// 
/// ## Returns
/// 
/// true if chain is valid, false otherwise
#[wasm_bindgen]
pub fn verify_chain_link(seal_json: &str, prev_seal_json: &str) -> Result<bool, JsValue> {
    // Deserialize seals
    let seal: FFISeal = serde_json::from_str(seal_json)
        .map_err(|e| JsValue::from_str(&format!("Deserialization error: {}", e)))?;
    
    let prev_seal: FFISeal = serde_json::from_str(prev_seal_json)
        .map_err(|e| JsValue::from_str(&format!("Deserialization error: {}", e)))?;
    
    // Verify chain
    match seal.verify_chain(&prev_seal) {
        Ok(()) => Ok(true),
        Err(_) => Ok(false),
    }
}

/// Get the hash of a seal (for chaining)
/// 
/// ## Arguments
/// 
/// * `seal_json` - JSON string containing the seal
/// 
/// ## Returns
/// 
/// Hex-encoded hash of the seal
#[wasm_bindgen]
pub fn get_seal_hash(seal_json: &str) -> Result<String, JsValue> {
    // Deserialize seal
    let seal: FFISeal = serde_json::from_str(seal_json)
        .map_err(|e| JsValue::from_str(&format!("Deserialization error: {}", e)))?;
    
    // Get hash
    seal.seal_hash()
        .map_err(|e| JsValue::from_str(&format!("Hash error: {}", e)))
}

// Made with Bob
