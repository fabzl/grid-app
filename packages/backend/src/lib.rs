use hdk::prelude::*;
use serde::{Deserialize, Serialize};

#[hdk_entry_defs]
#[unit_enum(UnitEntryTypes)]
pub enum EntryTypes {
    #[entry_def(required_validations = 5, visibility = "public")]
    User(UserEntry),
    #[entry_def(required_validations = 5, visibility = "public")]
    Product(ProductEntry),
    #[entry_def(required_validations = 5, visibility = "public")]
    Service(ServiceEntry),
}

#[hdk_link_types]
pub enum LinkTypes {
    UserToUser,
    UserToProduct,
    UserToService,
    ProductToLocation,
    ServiceToLocation,
}

#[derive(Serialize, Deserialize, Debug, Clone, EntryDefRegistration)]
#[serde(rename_all = "camelCase")]
pub struct UserEntry {
    pub name: String,
    pub rut: Option<String>,
    pub is_verified: bool,
    pub lat: Option<f64>,
    pub lon: Option<f64>,
    pub created_at: Timestamp,
}

#[derive(Serialize, Deserialize, Debug, Clone, EntryDefRegistration)]
#[serde(rename_all = "camelCase")]
pub struct ProductEntry {
    pub seller_hash: ActionHash,
    pub title: String,
    pub description: String,
    pub price: u64,
    pub currency: String,
    pub lat: Option<f64>,
    pub lon: Option<f64>,
    pub sold: bool,
    pub created_at: Timestamp,
}

#[derive(Serialize, Deserialize, Debug, Clone, EntryDefRegistration)]
#[serde(rename_all = "camelCase")]
pub struct ServiceEntry {
    pub provider_hash: ActionHash,
    pub service_type: String, // "taxi", "delivery", "room_rental", "professional"
    pub title: String,
    pub description: String,
    pub price_per_km: Option<u64>,
    pub base_price: Option<u64>,
    pub price_per_night: Option<u64>,
    pub price_per_hour: Option<u64>,
    pub currency: String,
    pub lat: Option<f64>,
    pub lon: Option<f64>,
    pub available: bool,
    pub room_capacity: Option<u32>,
    pub professional_category: Option<String>,
    pub created_at: Timestamp,
}

#[hdk_extern]
pub fn create_user(name: String) -> ExternResult<ActionHash> {
    let user = UserEntry {
        name,
        rut: None,
        is_verified: false,
        lat: None,
        lon: None,
        created_at: sys_time()?,
    };
    let action_hash = create_entry(EntryTypes::User(user))?;
    Ok(action_hash)
}

#[hdk_extern]
pub fn get_user(user_hash: ActionHash) -> ExternResult<Option<UserEntry>> {
    let record = get(user_hash, GetOptions::default())?;
    match record {
        Some(record) => {
            let entry = record.entry().to_app_option::<EntryTypes>()?;
            match entry {
                Some(EntryTypes::User(user)) => Ok(Some(user)),
                _ => Ok(None),
            }
        }
        None => Ok(None),
    }
}

#[hdk_extern]
pub fn update_user_location(user_hash: ActionHash, lat: f64, lon: f64) -> ExternResult<ActionHash> {
    let record = get(user_hash, GetOptions::default())?
        .ok_or(wasm_error!(WasmErrorInner::Guest("User not found".into())))?;
    
    let entry = record.entry().to_app_option::<EntryTypes>()?
        .ok_or(wasm_error!(WasmErrorInner::Guest("Invalid entry".into())))?;
    
    let user = match entry {
        EntryTypes::User(u) => u,
        _ => return Err(wasm_error!(WasmErrorInner::Guest("Expected User entry".into()))),
    };
    
    let mut updated = user.clone();
    updated.lat = Some(lat);
    updated.lon = Some(lon);
    
    let original_action = record.action_address().clone();
    update_entry(original_action, EntryTypes::User(updated))?;
    Ok(original_action)
}

#[hdk_extern]
pub fn verify_user(user_hash: ActionHash, rut: String) -> ExternResult<ActionHash> {
    let record = get(user_hash, GetOptions::default())?
        .ok_or(wasm_error!(WasmErrorInner::Guest("User not found".into())))?;
    
    let entry = record.entry().to_app_option::<EntryTypes>()?
        .ok_or(wasm_error!(WasmErrorInner::Guest("Invalid entry".into())))?;
    
    let user = match entry {
        EntryTypes::User(u) => u,
        _ => return Err(wasm_error!(WasmErrorInner::Guest("Expected User entry".into()))),
    };
    
    let mut updated = user.clone();
    updated.rut = Some(rut);
    updated.is_verified = true;
    
    let original_action = record.action_address().clone();
    update_entry(original_action, EntryTypes::User(updated))?;
    Ok(original_action)
}

#[hdk_extern]
pub fn list_users_nearby(_lat: f64, _lon: f64) -> ExternResult<Vec<(ActionHash, UserEntry)>> {
    // TODO: Implement distance-based query with links
    Ok(Vec::new())
}

#[hdk_extern]
pub fn create_product(
    seller_hash: ActionHash,
    title: String,
    description: String,
    price: u64,
    currency: String,
) -> ExternResult<ActionHash> {
    let product = ProductEntry {
        seller_hash,
        title,
        description,
        price,
        currency,
        lat: None,
        lon: None,
        sold: false,
        created_at: sys_time()?,
    };
    let action_hash = create_entry(EntryTypes::Product(product))?;
    Ok(action_hash)
}

#[hdk_extern]
pub fn create_service(
    provider_hash: ActionHash,
    service_type: String,
    title: String,
    description: String,
    currency: String,
    price_per_km: Option<u64>,
    base_price: Option<u64>,
    price_per_night: Option<u64>,
    price_per_hour: Option<u64>,
) -> ExternResult<ActionHash> {
    let service = ServiceEntry {
        provider_hash,
        service_type,
        title,
        description,
        price_per_km,
        base_price,
        price_per_night,
        price_per_hour,
        currency,
        lat: None,
        lon: None,
        available: true,
        room_capacity: None,
        professional_category: None,
        created_at: sys_time()?,
    };
    let action_hash = create_entry(EntryTypes::Service(service))?;
    Ok(action_hash)
}

#[hdk_extern]
pub fn get_product(product_hash: ActionHash) -> ExternResult<Option<ProductEntry>> {
    let record = get(product_hash, GetOptions::default())?;
    match record {
        Some(record) => {
            let entry = record.entry().to_app_option::<EntryTypes>()?;
            match entry {
                Some(EntryTypes::Product(product)) => Ok(Some(product)),
                _ => Ok(None),
            }
        }
        None => Ok(None),
    }
}

#[hdk_extern]
pub fn get_service(service_hash: ActionHash) -> ExternResult<Option<ServiceEntry>> {
    let record = get(service_hash, GetOptions::default())?;
    match record {
        Some(record) => {
            let entry = record.entry().to_app_option::<EntryTypes>()?;
            match entry {
                Some(EntryTypes::Service(service)) => Ok(Some(service)),
                _ => Ok(None),
            }
        }
        None => Ok(None),
    }
}

#[hdk_extern]
pub fn hello(_: ()) -> ExternResult<String> {
    Ok("Welcome to Grip Holochain zome!".to_string())
}
