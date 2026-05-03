//! Validation - Zero-Trust Schema Validation
//! 
//! This module implements the "Defense in Depth" validation strategy.
//! Even though TypeScript validates at the boundary, we re-validate
//! in Rust because TypeScript can be bypassed.
//! 
//! ## Security Model
//! 
//! - Never trust input from TypeScript layer
//! - Validate schema before sealing
//! - Reject invalid payloads immediately
//! - Log all rejections for audit

use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::fmt;

/// Errors that can occur during validation
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ValidationError {
    /// The payload is not valid JSON
    InvalidJson(String),
    /// Required field is missing
    MissingField(String),
    /// Field has wrong type
    WrongType(String),
    /// Field value is invalid
    InvalidValue(String),
}

impl fmt::Display for ValidationError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ValidationError::InvalidJson(msg) => write!(f, "Invalid JSON: {}", msg),
            ValidationError::MissingField(field) => write!(f, "Missing required field: {}", field),
            ValidationError::WrongType(msg) => write!(f, "Wrong type: {}", msg),
            ValidationError::InvalidValue(msg) => write!(f, "Invalid value: {}", msg),
        }
    }
}

impl std::error::Error for ValidationError {}

/// FFIPayload - The expected structure of all payloads
/// 
/// Every payload that flows through Bifrost must have this structure:
/// - type: The event type (e.g., "deal.created")
/// - room: The room this event belongs to (e.g., "crm", "finance")
/// - data: The event-specific data
/// - metadata: Optional metadata (timestamp, user, etc.)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FFIPayload {
    /// Event type (e.g., "deal.created", "payment.received")
    #[serde(rename = "type")]
    pub event_type: String,
    
    /// Room identifier (e.g., "crm", "finance", "procurement")
    pub room: String,
    
    /// Event-specific data
    pub data: Value,
    
    /// Optional metadata
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<Value>,
}

/// Validate a JSON payload against the FFIPayload schema
/// 
/// This is the primary validation function. It:
/// 1. Parses the JSON string
/// 2. Validates the structure matches FFIPayload
/// 3. Validates required fields are present
/// 4. Validates field types are correct
/// 
/// ## Arguments
/// 
/// * `payload` - The JSON string to validate
/// 
/// ## Returns
/// 
/// The parsed FFIPayload or a ValidationError
/// 
/// ## Example
/// 
/// ```rust
/// use snapkitty_core::validate::validate_payload;
/// 
/// let payload = r#"{
///     "type": "deal.created",
///     "room": "crm",
///     "data": {"id": "deal_123", "value": 50000}
/// }"#;
/// 
/// let validated = validate_payload(payload)?;
/// assert_eq!(validated.event_type, "deal.created");
/// assert_eq!(validated.room, "crm");
/// ```
pub fn validate_payload(payload: &str) -> Result<FFIPayload, ValidationError> {
    // Parse JSON
    let parsed: FFIPayload = serde_json::from_str(payload)
        .map_err(|e| ValidationError::InvalidJson(e.to_string()))?;
    
    // Validate event type is not empty
    if parsed.event_type.is_empty() {
        return Err(ValidationError::InvalidValue(
            "Event type cannot be empty".to_string()
        ));
    }
    
    // Validate room is not empty
    if parsed.room.is_empty() {
        return Err(ValidationError::InvalidValue(
            "Room cannot be empty".to_string()
        ));
    }
    
    // Validate room is a known room
    let valid_rooms = ["crm", "finance", "procurement", "war-room", "intelligence"];
    if !valid_rooms.contains(&parsed.room.as_str()) {
        return Err(ValidationError::InvalidValue(
            format!("Unknown room: {}. Valid rooms: {:?}", parsed.room, valid_rooms)
        ));
    }
    
    // Validate event type format (should be "domain.action")
    if !parsed.event_type.contains('.') {
        return Err(ValidationError::InvalidValue(
            format!("Event type must be in format 'domain.action', got: {}", parsed.event_type)
        ));
    }
    
    Ok(parsed)
}

/// Validate a specific event type's data structure
/// 
/// This is a more specific validation that checks the data field
/// matches the expected structure for a given event type.
/// 
/// ## Arguments
/// 
/// * `payload` - The validated FFIPayload
/// * `expected_fields` - List of required field names in data
/// 
/// ## Returns
/// 
/// Ok(()) if valid, Err if any required field is missing
pub fn validate_event_data(
    payload: &FFIPayload,
    expected_fields: &[&str]
) -> Result<(), ValidationError> {
    let data_obj = payload.data.as_object()
        .ok_or_else(|| ValidationError::WrongType(
            "Event data must be an object".to_string()
        ))?;
    
    for field in expected_fields {
        if !data_obj.contains_key(*field) {
            return Err(ValidationError::MissingField(
                format!("Required field '{}' missing in event data", field)
            ));
        }
    }
    
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_valid_payload() {
        let payload = r#"{
            "type": "deal.created",
            "room": "crm",
            "data": {"id": "deal_123", "value": 50000}
        }"#;
        
        let validated = validate_payload(payload).unwrap();
        assert_eq!(validated.event_type, "deal.created");
        assert_eq!(validated.room, "crm");
    }
    
    #[test]
    fn test_invalid_json() {
        let payload = r#"{"type": "deal.created", "room": "crm""#; // Missing closing brace
        
        let result = validate_payload(payload);
        assert!(matches!(result, Err(ValidationError::InvalidJson(_))));
    }
    
    #[test]
    fn test_missing_type() {
        let payload = r#"{
            "room": "crm",
            "data": {"id": "deal_123"}
        }"#;
        
        let result = validate_payload(payload);
        assert!(result.is_err());
    }
    
    #[test]
    fn test_empty_type() {
        let payload = r#"{
            "type": "",
            "room": "crm",
            "data": {"id": "deal_123"}
        }"#;
        
        let result = validate_payload(payload);
        assert!(matches!(result, Err(ValidationError::InvalidValue(_))));
    }
    
    #[test]
    fn test_invalid_room() {
        let payload = r#"{
            "type": "deal.created",
            "room": "invalid_room",
            "data": {"id": "deal_123"}
        }"#;
        
        let result = validate_payload(payload);
        assert!(matches!(result, Err(ValidationError::InvalidValue(_))));
    }
    
    #[test]
    fn test_invalid_event_type_format() {
        let payload = r#"{
            "type": "dealcreated",
            "room": "crm",
            "data": {"id": "deal_123"}
        }"#;
        
        let result = validate_payload(payload);
        assert!(matches!(result, Err(ValidationError::InvalidValue(_))));
    }
    
    #[test]
    fn test_validate_event_data() {
        let payload = r#"{
            "type": "deal.created",
            "room": "crm",
            "data": {"id": "deal_123", "value": 50000}
        }"#;
        
        let validated = validate_payload(payload).unwrap();
        
        // Should pass with required fields present
        assert!(validate_event_data(&validated, &["id", "value"]).is_ok());
        
        // Should fail with missing field
        assert!(validate_event_data(&validated, &["id", "value", "missing"]).is_err());
    }
}

// Made with Bob
