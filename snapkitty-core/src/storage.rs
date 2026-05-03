//! Storage - The Append-Only Log
//! 
//! This module implements the local append-only file storage for seals.
//! Every seal is written to disk immediately after creation. The file
//! is append-only - no deletions, no modifications.
//! 
//! ## Design
//! 
//! - Each seal is written as a single line of JSON
//! - The file is opened in append mode
//! - Writes are synchronous (fsync) to ensure durability
//! - Every 100 entries, a checkpoint hash is computed
//! 
//! ## File Format
//! 
//! ```text
//! {"id":"...","timestamp":...,"payload_hash":"...","prev_hash":"..."}
//! {"id":"...","timestamp":...,"payload_hash":"...","prev_hash":"..."}
//! ...
//! ```
//! 
//! ## Recovery
//! 
//! If the system crashes, we can reconstruct the entire state by:
//! 1. Reading the append-only log from disk
//! 2. Replaying each seal in order
//! 3. Verifying the chain is intact

use crate::seal::FFISeal;
use std::fs::{File, OpenOptions};
use std::io::{self, Write, BufRead, BufReader};
use std::path::{Path, PathBuf};
use std::fmt;

/// Errors that can occur during storage operations
#[derive(Debug)]
pub enum StorageError {
    /// IO error occurred
    IoError(io::Error),
    /// Serialization error
    SerializationError(String),
    /// Deserialization error
    DeserializationError(String),
    /// File not found
    FileNotFound(String),
}

impl fmt::Display for StorageError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            StorageError::IoError(e) => write!(f, "IO error: {}", e),
            StorageError::SerializationError(msg) => write!(f, "Serialization error: {}", msg),
            StorageError::DeserializationError(msg) => write!(f, "Deserialization error: {}", msg),
            StorageError::FileNotFound(path) => write!(f, "File not found: {}", path),
        }
    }
}

impl std::error::Error for StorageError {}

impl From<io::Error> for StorageError {
    fn from(e: io::Error) -> Self {
        StorageError::IoError(e)
    }
}

/// AppendOnlyLog - The persistent storage for seals
/// 
/// This struct manages the append-only log file. It ensures that:
/// - Every seal is written to disk immediately
/// - Writes are durable (fsync)
/// - The file can be read back for recovery
/// - Checkpoint hashes are computed every 100 entries
/// 
/// ## Example
/// 
/// ```rust
/// use snapkitty_core::storage::AppendOnlyLog;
/// use snapkitty_core::seal::FFISeal;
/// 
/// let mut log = AppendOnlyLog::new("./seals.log")?;
/// 
/// let payload = r#"{"type": "deal.created", "room": "crm", "data": {"id": "deal_123"}}"#;
/// let seal = FFISeal::new(payload, None)?;
/// 
/// log.append(&seal)?;
/// 
/// // The seal is now on disk and will survive a crash
/// ```
pub struct AppendOnlyLog {
    /// Path to the log file
    path: PathBuf,
    
    /// File handle (kept open for performance)
    file: File,
    
    /// Number of entries written
    entry_count: usize,
    
    /// Checkpoint interval (entries between checkpoints)
    checkpoint_interval: usize,
}

impl AppendOnlyLog {
    /// Create a new append-only log
    /// 
    /// This opens (or creates) the log file in append mode.
    /// 
    /// ## Arguments
    /// 
    /// * `path` - Path to the log file
    /// 
    /// ## Returns
    /// 
    /// A new AppendOnlyLog or a StorageError
    pub fn new<P: AsRef<Path>>(path: P) -> Result<Self, StorageError> {
        let path = path.as_ref().to_path_buf();
        
        let file = OpenOptions::new()
            .create(true)
            .append(true)
            .open(&path)?;
        
        // Count existing entries
        let entry_count = Self::count_entries(&path)?;
        
        Ok(AppendOnlyLog {
            path,
            file,
            entry_count,
            checkpoint_interval: 100,
        })
    }
    
    /// Append a seal to the log
    /// 
    /// This writes the seal to disk as a single line of JSON.
    /// The write is synchronous (fsync) to ensure durability.
    /// 
    /// ## Arguments
    /// 
    /// * `seal` - The seal to append
    /// 
    /// ## Returns
    /// 
    /// Ok(()) if successful, Err if write fails
    /// 
    /// ## Performance
    /// 
    /// Target: <1ms for write + fsync on SSD
    pub fn append(&mut self, seal: &FFISeal) -> Result<(), StorageError> {
        // Serialize seal to JSON
        let json = serde_json::to_string(seal)
            .map_err(|e| StorageError::SerializationError(e.to_string()))?;
        
        // Write to file with newline
        writeln!(self.file, "{}", json)?;
        
        // Sync to disk (durability guarantee)
        self.file.sync_all()?;
        
        self.entry_count += 1;
        
        // Check if we need a checkpoint
        if self.entry_count % self.checkpoint_interval == 0 {
            self.create_checkpoint()?;
        }
        
        Ok(())
    }
    
    /// Read all seals from the log
    /// 
    /// This reads the entire log file and deserializes each seal.
    /// Used for recovery after a crash.
    /// 
    /// ## Returns
    /// 
    /// A vector of all seals in the log
    pub fn read_all(&self) -> Result<Vec<FFISeal>, StorageError> {
        let file = File::open(&self.path)?;
        let reader = BufReader::new(file);
        
        let mut seals = Vec::new();
        
        for line in reader.lines() {
            let line = line?;
            if line.trim().is_empty() {
                continue;
            }
            
            let seal: FFISeal = serde_json::from_str(&line)
                .map_err(|e| StorageError::DeserializationError(e.to_string()))?;
            
            seals.push(seal);
        }
        
        Ok(seals)
    }
    
    /// Count entries in the log file
    fn count_entries<P: AsRef<Path>>(path: P) -> Result<usize, StorageError> {
        if !path.as_ref().exists() {
            return Ok(0);
        }
        
        let file = File::open(path)?;
        let reader = BufReader::new(file);
        
        let count = reader.lines()
            .filter_map(|line| line.ok())
            .filter(|line| !line.trim().is_empty())
            .count();
        
        Ok(count)
    }
    
    /// Create a checkpoint hash
    /// 
    /// Every 100 entries, we compute a hash of the entire log.
    /// This hash can be stored in a WORM database for redundancy.
    /// 
    /// ## Returns
    /// 
    /// Ok(()) if checkpoint created successfully
    fn create_checkpoint(&self) -> Result<(), StorageError> {
        // Read all seals
        let seals = self.read_all()?;
        
        // Compute checkpoint hash (hash of all seal hashes)
        let mut checkpoint_data = String::new();
        for seal in &seals {
            checkpoint_data.push_str(&seal.payload_hash);
        }
        
        // In production, this hash would be stored in WORM database
        // For now, we just log it
        let checkpoint_hash = sha2::Sha256::digest(checkpoint_data.as_bytes());
        let checkpoint_hex = hex::encode(checkpoint_hash);
        
        eprintln!("CHECKPOINT at entry {}: {}", self.entry_count, checkpoint_hex);
        
        Ok(())
    }
    
    /// Get the number of entries in the log
    pub fn entry_count(&self) -> usize {
        self.entry_count
    }
    
    /// Get the path to the log file
    pub fn path(&self) -> &Path {
        &self.path
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::seal::FFISeal;
    use std::fs;
    
    #[test]
    fn test_append_and_read() {
        let temp_path = "./test_seals.log";
        
        // Clean up any existing test file
        let _ = fs::remove_file(temp_path);
        
        {
            let mut log = AppendOnlyLog::new(temp_path).unwrap();
            
            let payload1 = r#"{"type": "test.event", "room": "crm", "data": {"id": "1"}}"#;
            let seal1 = FFISeal::new(payload1, None).unwrap();
            log.append(&seal1).unwrap();
            
            let payload2 = r#"{"type": "test.event", "room": "crm", "data": {"id": "2"}}"#;
            let seal2 = FFISeal::new(payload2, Some(seal1.seal_hash().unwrap())).unwrap();
            log.append(&seal2).unwrap();
            
            assert_eq!(log.entry_count(), 2);
        }
        
        // Read back
        let log = AppendOnlyLog::new(temp_path).unwrap();
        let seals = log.read_all().unwrap();
        
        assert_eq!(seals.len(), 2);
        assert_eq!(log.entry_count(), 2);
        
        // Clean up
        fs::remove_file(temp_path).unwrap();
    }
    
    #[test]
    fn test_checkpoint() {
        let temp_path = "./test_checkpoint.log";
        
        // Clean up any existing test file
        let _ = fs::remove_file(temp_path);
        
        {
            let mut log = AppendOnlyLog::new(temp_path).unwrap();
            
            // Write 100 entries to trigger checkpoint
            for i in 0..100 {
                let payload = format!(r#"{{"type": "test.event", "room": "crm", "data": {{"id": "{}"}}}}"#, i);
                let prev_hash = if i == 0 {
                    None
                } else {
                    Some(format!("prev_{}", i - 1))
                };
                let seal = FFISeal::new(&payload, prev_hash).unwrap();
                log.append(&seal).unwrap();
            }
            
            assert_eq!(log.entry_count(), 100);
        }
        
        // Clean up
        fs::remove_file(temp_path).unwrap();
    }
}

// Made with Bob
