use hdk::prelude::*;
use listings_integrity::*;
use mycelix_common::{error_handling, link_queries, time};

/// Create a new listing
///
/// This function:
/// 1. Sanitizes all user inputs for security
/// 2. Creates the listing entry on the DHT
/// 3. Creates links for discovery (agent, category, status, all)
/// 4. Returns the listing with its action hash
#[hdk_extern]
pub fn create_listing(input: CreateListingInput) -> ExternResult<ListingOutput> {
    let agent_info = agent_info()?;

    // Sanitize inputs to prevent XSS and injection attacks
    let sanitized_title = security::sanitize_user_input(&input.title);
    let sanitized_description = security::sanitize_user_input(&input.description);

    // Validate and sanitize IPFS CIDs
    let mut sanitized_cids = Vec::new();
    for cid in &input.photos_ipfs_cids {
        match security::sanitize_ipfs_cid(cid) {
            Ok(clean_cid) => sanitized_cids.push(clean_cid),
            Err(e) => {
                return Err(wasm_error!(WasmErrorInner::Guest(
                    format!("Invalid IPFS CID: {}", e)
                )));
            }
        }
    }

    // Validate price and quantity
    security::validate_price(input.price_cents).map_err(|e| {
        wasm_error!(WasmErrorInner::Guest(format!(
            "Invalid price: {}",
            e
        )))
    })?;

    security::validate_quantity(input.quantity_available).map_err(|e| {
        wasm_error!(WasmErrorInner::Guest(format!(
            "Invalid quantity: {}",
            e
        )))
    })?;

    // Build listing with Epistemic Charter classification
    let listing = Listing {
        title: sanitized_title,
        description: sanitized_description,
        price_cents: input.price_cents,
        category: input.category,
        photos_ipfs_cids: sanitized_cids,
        quantity_available: input.quantity_available,
        status: ListingStatus::Active,
        epistemic: EpistemicClassification {
            // Seller's testimonial claim
            empirical: EmpiricalLevel::E1Testimonial,
            // Personal claim (seller only)
            normative: NormativeLevel::N0Personal,
            // Temporal - prune when sold
            materiality: MaterialityLevel::M1Temporal,
        },
        created_at: time::now()?,
        updated_at: time::now()?,
    };

    // Create entry on DHT
    let action_hash = create_entry(&EntryTypes::Listing(listing.clone()))?;
    let entry_hash = hash_entry(&listing)?;

    // Create discovery links

    // 1. Agent -> Listing (seller's listings)
    // Clone to avoid move since we use agent_initial_pubkey again later
    let agent_path = agent_info.agent_initial_pubkey.clone();
    create_link(
        agent_path.clone(), // Clone here since we use agent_path again for monitoring
        entry_hash.clone(),
        LinkTypes::AgentToListings,
        (),
    )?;

    // 2. Category -> Listing (browse by category)
    let category_path = Path::from(format!("listings.category.{:?}", listing.category));
    // Note: HDK 0.6.0 - Path.ensure() removed, paths auto-created
    create_link(
        category_path.path_entry_hash()?,
        entry_hash.clone(),
        LinkTypes::CategoryToListings,
        (),
    )?;

    // 3. Status -> Listing (filter by status)
    let status_path = Path::from(format!("listings.status.{:?}", listing.status));
    // Note: HDK 0.6.0 - Path.ensure() removed, paths auto-created
    create_link(
        status_path.path_entry_hash()?,
        entry_hash.clone(),
        LinkTypes::StatusToListings,
        (),
    )?;

    // 4. All Listings anchor
    let all_path = Path::from("all_listings");
    // Note: HDK 0.6.0 - Path.ensure() removed, paths auto-created
    create_link(
        all_path.path_entry_hash()?,
        entry_hash.clone(),
        LinkTypes::AllListings,
        (),
    )?;

    // Emit monitoring metric
    monitoring::emit_metric(
        monitoring::MetricType::ListingCreated,
        1.0,
        Some(agent_path.clone()),
        Some(format!("category:{:?},price:{}", listing.category, listing.price_cents)),
    )?;

    Ok(ListingOutput {
        listing_hash: action_hash.into(),
        listing,
        seller_agent_id: agent_info.agent_initial_pubkey.into(),
    })
}

/// Get a specific listing by hash
#[hdk_extern]
pub fn get_listing(listing_hash: ActionHash) -> ExternResult<Option<ListingOutput>> {
    let record = get(listing_hash.clone(), GetOptions::default())?;

    match record {
        Some(record) => {
            // Use shared utility for deserialization
            let listing: Listing = error_handling::deserialize_entry(&record)?;

            Ok(Some(ListingOutput {
                listing_hash: listing_hash.into(),
                listing,
                seller_agent_id: record.action().author().clone().into(),
            }))
        }
        None => Ok(None),
    }
}

/// Get all listings in the marketplace
#[hdk_extern]
pub fn get_all_listings(_: ()) -> ExternResult<ListingsResponse> {
    let path = Path::from("all_listings");
    // Use shared utility for get_links
    let links = link_queries::get_links_local(path.path_entry_hash()?, LinkTypes::AllListings)?;

    let mut listings = Vec::new();

    for link in links {
        if let Some(action_hash) = link.target.into_action_hash() {
            if let Some(listing_output) = get_listing(action_hash)? {
                // Filter out deleted/inactive if needed
                if listing_output.listing.status != ListingStatus::Deleted {
                    listings.push(listing_output);
                }
            }
        }
    }

    Ok(ListingsResponse { listings })
}

/// Get listings by seller
#[hdk_extern]
pub fn get_listings_by_seller(agent_id: AgentPubKey) -> ExternResult<ListingsResponse> {
    // Use shared utility for get_links
    let links = link_queries::get_links_local(agent_id, LinkTypes::AgentToListings)?;

    let mut listings = Vec::new();

    for link in links {
        if let Some(action_hash) = link.target.into_action_hash() {
            if let Some(listing_output) = get_listing(action_hash)? {
                listings.push(listing_output);
            }
        }
    }

    Ok(ListingsResponse { listings })
}

/// Get my listings (current user)
#[hdk_extern]
pub fn get_my_listings(_: ()) -> ExternResult<ListingsResponse> {
    let agent_info = agent_info()?;
    get_listings_by_seller(agent_info.agent_initial_pubkey)
}

/// Get listings by category
#[hdk_extern]
pub fn get_listings_by_category(category: ListingCategory) -> ExternResult<ListingsResponse> {
    let path = Path::from(format!("listings.category.{:?}", category));
    // Use shared utility for get_links
    let links = link_queries::get_links_local(path.path_entry_hash()?, LinkTypes::CategoryToListings)?;

    let mut listings = Vec::new();

    for link in links {
        if let Some(action_hash) = link.target.into_action_hash() {
            if let Some(listing_output) = get_listing(action_hash)? {
                listings.push(listing_output);
            }
        }
    }

    Ok(ListingsResponse { listings })
}

/// Update a listing
#[hdk_extern]
pub fn update_listing(input: UpdateListingInput) -> ExternResult<ListingOutput> {
    // Get the original listing
    let original_record = get(input.listing_hash.clone(), GetOptions::default())?
        .ok_or(wasm_error!(WasmErrorInner::Guest(
            "Listing not found".into()
        )))?;

    // Use shared utility for deserialization
    let mut listing: Listing = error_handling::deserialize_entry(&original_record)?;

    // Verify ownership
    let agent_info = agent_info()?;
    if original_record.action().author() != &agent_info.agent_initial_pubkey {
        return Err(wasm_error!(WasmErrorInner::Guest(
            "Only the seller can update their listing".into()
        )));
    }

    // Apply updates
    if let Some(title) = input.title {
        listing.title = title;
    }
    if let Some(description) = input.description {
        listing.description = description;
    }
    if let Some(price_cents) = input.price_cents {
        listing.price_cents = price_cents;
    }
    if let Some(category) = input.category {
        listing.category = category;
    }
    if let Some(photos_ipfs_cids) = input.photos_ipfs_cids {
        listing.photos_ipfs_cids = photos_ipfs_cids;
    }
    if let Some(quantity_available) = input.quantity_available {
        listing.quantity_available = quantity_available;
    }
    if let Some(status) = input.status {
        listing.status = status;
    }

    listing.updated_at = time::now()?;

    // Create update
    let action_hash = update_entry(input.listing_hash, &EntryTypes::Listing(listing.clone()))?;

    Ok(ListingOutput {
        listing_hash: action_hash.into(),
        listing,
        seller_agent_id: agent_info.agent_initial_pubkey.into(),
    })
}

/// Delete a listing (soft delete by setting status to Deleted)
#[hdk_extern]
pub fn delete_listing(listing_hash: ActionHash) -> ExternResult<()> {
    update_listing(UpdateListingInput {
        listing_hash,
        title: None,
        description: None,
        price_cents: None,
        category: None,
        photos_ipfs_cids: None,
        quantity_available: None,
        status: Some(ListingStatus::Deleted),
    })?;

    Ok(())
}

/// Search listings by text query (simple implementation)
#[hdk_extern]
pub fn search_listings(query: String) -> ExternResult<ListingsResponse> {
    let all = get_all_listings(())?;
    let query_lower = query.to_lowercase();

    let filtered: Vec<ListingOutput> = all
        .listings
        .into_iter()
        .filter(|output| {
            output.listing.title.to_lowercase().contains(&query_lower)
                || output.listing.description.to_lowercase().contains(&query_lower)
        })
        .collect();

    Ok(ListingsResponse {
        listings: filtered,
    })
}

// ===== Input/Output Types =====

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CreateListingInput {
    pub title: String,
    pub description: String,
    pub price_cents: u64,
    pub category: ListingCategory,
    pub photos_ipfs_cids: Vec<String>,
    pub quantity_available: u32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct UpdateListingInput {
    pub listing_hash: ActionHash,
    pub title: Option<String>,
    pub description: Option<String>,
    pub price_cents: Option<u64>,
    pub category: Option<ListingCategory>,
    pub photos_ipfs_cids: Option<Vec<String>>,
    pub quantity_available: Option<u32>,
    pub status: Option<ListingStatus>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ListingOutput {
    pub listing_hash: ActionHash,
    pub listing: Listing,
    pub seller_agent_id: AgentPubKey,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ListingsResponse {
    pub listings: Vec<ListingOutput>,
}


// ===== Tests =====
#[cfg(test)]
mod tests;
