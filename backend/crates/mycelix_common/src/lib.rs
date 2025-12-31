//! Mycelix Marketplace Common Utilities
//!
//! Shared functionality across all Mycelix zomes to reduce code duplication
//! and ensure consistent behavior.

use hdk::prelude::*;

/// Error handling utilities
pub mod error_handling {
    use super::*;

    /// Centralized error conversion for to_app_option()
    ///
    /// This eliminates the repetitive pattern of:
    /// ```rust
    /// record.entry()
    ///     .to_app_option()
    ///     .map_err(|e| wasm_error!(WasmErrorInner::Guest(format!("Deserialization error: {:?}", e))))?
    ///     .ok_or(wasm_error!(WasmErrorInner::Guest("Could not deserialize entry".into())))?
    /// ```
    pub fn deserialize_entry<T>(record: &Record) -> ExternResult<T>
    where
        T: TryFrom<SerializedBytes, Error = SerializedBytesError>,
    {
        record
            .entry()
            .to_app_option()
            .map_err(|e| {
                wasm_error!(WasmErrorInner::Guest(format!(
                    "Deserialization error: {:?}",
                    e
                )))
            })?
            .ok_or(wasm_error!(WasmErrorInner::Guest(
                "Could not deserialize entry".into()
            )))
    }

    /// Deserialize entry from an Option<Record>
    ///
    /// Returns Ok(None) if record is None, Err if deserialization fails
    pub fn deserialize_optional_entry<T>(record: Option<Record>) -> ExternResult<Option<T>>
    where
        T: TryFrom<SerializedBytes, Error = SerializedBytesError>,
    {
        match record {
            Some(record) => deserialize_entry(&record).map(Some),
            None => Ok(None),
        }
    }
}

/// Remote call utilities
pub mod remote_calls {
    use super::*;

    /// Type-safe remote call wrapper
    ///
    /// Eliminates the repetitive pattern of:
    /// ```rust
    /// let current_agent = agent_info()?.agent_initial_pubkey;
    /// let response = call_remote(
    ///     current_agent.clone(),
    ///     ZomeName::from("zome_name"),
    ///     FunctionName::from("function_name"),
    ///     None,
    ///     input,
    /// )?;
    /// let result: MyType = match response {
    ///     ZomeCallResponse::Ok(extern_io) => extern_io.decode()
    ///         .map_err(|e| wasm_error!(WasmErrorInner::Guest(format!("Failed to decode: {:?}", e))))?,
    ///     _ => return Err(wasm_error!(WasmErrorInner::Guest("Remote call failed".into()))),
    /// };
    /// ```
    pub fn call_zome<I, O>(zome_name: &str, function_name: &str, input: I) -> ExternResult<O>
    where
        I: serde::Serialize + std::fmt::Debug,
        O: serde::de::DeserializeOwned + std::fmt::Debug,
    {
        let current_agent = agent_info()?.agent_initial_pubkey;
        let response = call_remote(
            current_agent,
            ZomeName::from(zome_name),
            FunctionName::from(function_name),
            None,
            input,
        )?;

        match response {
            ZomeCallResponse::Ok(extern_io) => extern_io.decode().map_err(|e| {
                wasm_error!(WasmErrorInner::Guest(format!(
                    "Failed to decode response from {}.{}: {:?}",
                    zome_name, function_name, e
                )))
            }),
            _ => Err(wasm_error!(WasmErrorInner::Guest(
                format!("Remote call to {}.{} failed", zome_name, function_name).into()
            ))),
        }
    }

    /// Call remote zome without expecting a return value
    ///
    /// Useful for fire-and-forget operations like updating MATL scores
    pub fn call_zome_void<I>(zome_name: &str, function_name: &str, input: I) -> ExternResult<()>
    where
        I: serde::Serialize + std::fmt::Debug,
    {
        let current_agent = agent_info()?.agent_initial_pubkey;
        call_remote(
            current_agent,
            ZomeName::from(zome_name),
            FunctionName::from(function_name),
            None,
            input,
        )?;
        Ok(())
    }
}

/// Link query utilities
pub mod link_queries {
    use super::*;

    /// Get all links with the standard Local strategy
    ///
    /// Eliminates the repetitive pattern of:
    /// ```rust
    /// let links = get_links(
    ///     LinkQuery::try_new(base, LinkTypes::X)?,
    ///     GetStrategy::Local,
    /// )?;
    /// ```
    pub fn get_links_local(
        base: impl Into<AnyLinkableHash>,
        link_type: impl TryInto<LinkTypeFilter, Error = WasmError>,
    ) -> ExternResult<Vec<Link>> {
        get_links(LinkQuery::try_new(base, link_type)?, GetStrategy::Local)
    }

    /// Get all links and deserialize their targets as entries
    pub fn get_linked_entries<T>(
        base: impl Into<AnyLinkableHash>,
        link_type: impl TryInto<LinkTypeFilter, Error = WasmError>,
    ) -> ExternResult<Vec<T>>
    where
        T: TryFrom<SerializedBytes, Error = SerializedBytesError>,
    {
        let links = get_links_local(base, link_type)?;
        let mut entries = Vec::new();

        for link in links {
            if let Some(action_hash) = link.target.into_action_hash() {
                if let Some(record) = get(action_hash, GetOptions::default())? {
                    entries.push(crate::error_handling::deserialize_entry(&record)?);
                }
            }
        }

        Ok(entries)
    }
}

/// Validation utilities
pub mod validation {
    use super::*;

    /// Verify that the caller is one of the allowed agents
    pub fn verify_caller_is_one_of(allowed: &[AgentPubKey]) -> ExternResult<AgentPubKey> {
        let agent_info = agent_info()?;
        let caller = agent_info.agent_initial_pubkey;

        if allowed.contains(&caller) {
            Ok(caller)
        } else {
            Err(wasm_error!(WasmErrorInner::Guest(
                "Unauthorized: caller not in allowed list".into()
            )))
        }
    }

    /// Verify that the caller is the expected agent
    pub fn verify_caller_is(expected: &AgentPubKey) -> ExternResult<()> {
        let agent_info = agent_info()?;
        let caller = agent_info.agent_initial_pubkey;

        if caller == *expected {
            Ok(())
        } else {
            Err(wasm_error!(WasmErrorInner::Guest(
                "Unauthorized: caller is not the expected agent".into()
            )))
        }
    }
}

/// Time utilities
pub mod time {
    use super::*;

    /// Get current timestamp as u64 microseconds
    ///
    /// Eliminates the repetitive pattern of:
    /// ```rust
    /// sys_time()?.as_micros() as u64
    /// ```
    pub fn now_micros() -> ExternResult<u64> {
        Ok(sys_time()?.as_micros() as u64)
    }

    /// Get current timestamp
    pub fn now() -> ExternResult<Timestamp> {
        sys_time()
    }
}

/// Common result types and error enums
pub mod types {
    use super::*;

    /// Standard result type for Mycelix zomes
    pub type MResult<T> = Result<T, MError>;

    /// Common error types across Mycelix marketplace
    #[derive(Debug, Serialize, Deserialize)]
    pub enum MError {
        /// Resource not found
        NotFound(String),
        /// Caller not authorized for this operation
        Unauthorized(String),
        /// Invalid input provided
        InvalidInput(String),
        /// Rate limit exceeded
        RateLimited { retry_after: u64 },
        /// Insufficient MATL score for operation
        InsufficientMATL { have: f64, need: f64 },
        /// Internal error
        Internal(String),
    }

    impl From<MError> for WasmError {
        fn from(e: MError) -> Self {
            wasm_error!(WasmErrorInner::Guest(format!("{:?}", e)))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // Note: These are unit tests for non-HDK dependent functions
    // Integration tests would require a Holochain conductor

    #[test]
    fn test_error_types() {
        use types::MError;

        let error = MError::NotFound("test".into());
        assert!(matches!(error, MError::NotFound(_)));

        let error = MError::InsufficientMATL {
            have: 0.5,
            need: 0.7,
        };
        assert!(matches!(error, MError::InsufficientMATL { .. }));
    }
}
