use hdk::prelude::*;
use integrity::*;
use std::collections::HashMap;
use std::f64::consts::PI;

mod integrity;

// Helper trait for to_radians
trait ToRadians {
    fn to_radians(&self) -> f64;
}

impl ToRadians for f64 {
    fn to_radians(&self) -> f64 {
        *self * PI / 180.0
    }
}

use integrity::{Post, PostLocation, PostClap, PostLike, PostComment, PostReport, StickerData, UserBlock, Tamagochi, TamagochiDeath, UserPreferences, Booking, RideRequest, Review, VehicleInfo, ProductComment, AdBanner, Wish, WishHelp, TamagochiVisit, ProfileCover};

#[hdk_extern]
pub fn hello(_: ()) -> ExternResult<String> {
    Ok("Welcome to Red Libre Holochain zome!".to_string())
}

// ========== User Management ==========

#[derive(Serialize, Deserialize, Debug)]
pub struct RegisterInput {
    pub email: String,
    pub password: String,
    pub name: String,
}

#[hdk_extern]
pub fn register_user(input: RegisterInput) -> ExternResult<AgentPubKey> {
    // Validate email format
    if !input.email.contains('@') {
        return Err(wasm_error!(WasmErrorInner::Guest("Invalid email format".into())));
    }

    // Check if user already exists
    let email_hash = hash_email(&input.email)?;
    let existing_user = get_user_by_email(&input.email)?;
    if existing_user.is_some() {
        return Err(wasm_error!(WasmErrorInner::Guest("User already exists".into())));
    }

    // Hash password
    let password_hash = hash_password(&input.password)?;

    // Create user entry
    let user = User {
        email: input.email.clone(),
        password_hash,
        name: input.name,
        rut: None,
        profile_image_hash: None,
        id_card_image_hash: None,
        is_verified: false,
        lat: None,
        lon: None,
        created_at: sys_time()?.as_seconds_since_epoch(),
        ghost_mode: false,
        last_seen: sys_time()?.as_seconds_since_epoch(),
        is_driver: false,
        driver_status: None,
        vehicle_info: None,
    };

    let user_hash = create_entry(EntryTypes::User(user.clone()))?;
    
    // Link email to user for lookup
    let email_tag = LinkTag::new(email_hash.as_bytes().to_vec());
    create_link(
        agent_info()?.agent_latest_pubkey(),
        user_hash,
        LinkTypes::UserToProfileImage,
        email_tag,
    )?;

    Ok(agent_info()?.agent_latest_pubkey())
}

#[derive(Serialize, Deserialize, Debug)]
pub struct LoginInput {
    pub email: String,
    pub password: String,
}

#[hdk_extern]
pub fn login(input: LoginInput) -> ExternResult<AgentPubKey> {
    let user = get_user_by_email(&input.email)?
        .ok_or_else(|| wasm_error!(WasmErrorInner::Guest("User not found".into())))?;

    // Verify password
    if !verify_password(&input.password, &user.password_hash) {
        return Err(wasm_error!(WasmErrorInner::Guest("Invalid password".into())));
    }

    // Return agent pub key (in real implementation, you'd create a session token)
    Ok(agent_info()?.agent_latest_pubkey())
}

#[hdk_extern]
pub fn get_user_profile(_: ()) -> ExternResult<Option<User>> {
    let agent = agent_info()?.agent_latest_pubkey();
    get_user_by_agent(&agent)
}

#[derive(Serialize, Deserialize, Debug)]
pub struct UpdateUserInput {
    pub name: Option<String>,
    pub rut: Option<String>,
    pub lat: Option<f64>,
    pub lon: Option<f64>,
}

#[hdk_extern]
pub fn update_user_profile(input: UpdateUserInput) -> ExternResult<User> {
    let agent = agent_info()?.agent_latest_pubkey();
    let mut user = get_user_by_agent(&agent)?
        .ok_or_else(|| wasm_error!(WasmErrorInner::Guest("User not found".into())))?;

    if let Some(name) = input.name {
        user.name = name;
    }
    if let Some(rut) = input.rut {
        if !validate_rut(&rut) {
            return Err(wasm_error!(WasmErrorInner::Guest("Invalid RUT format".into())));
        }
        user.rut = Some(rut);
    }
    if let Some(lat) = input.lat {
        user.lat = Some(lat);
    }
    if let Some(lon) = input.lon {
        user.lon = Some(lon);
    }

    let user_hash = create_entry(EntryTypes::User(user.clone()))?;
    Ok(user)
}

#[derive(Serialize, Deserialize, Debug)]
pub struct VerifyUserInput {
    pub rut: String,
    pub id_card_image_hash: String,
}

#[hdk_extern]
pub fn verify_user(input: VerifyUserInput) -> ExternResult<User> {
    let agent = agent_info()?.agent_latest_pubkey();
    let mut user = get_user_by_agent(&agent)?
        .ok_or_else(|| wasm_error!(WasmErrorInner::Guest("User not found".into())))?;

    if !validate_rut(&input.rut) {
        return Err(wasm_error!(WasmErrorInner::Guest("Invalid RUT format".into())));
    }

    user.rut = Some(input.rut);
    user.id_card_image_hash = Some(input.id_card_image_hash);
    user.is_verified = true;

    let _user_hash = create_entry(EntryTypes::User(user.clone()))?;
    Ok(user)
}

// ========== Password Reset ==========

#[hdk_extern]
pub fn request_password_reset(email: String) -> ExternResult<String> {
    let user = get_user_by_email(&email)?
        .ok_or_else(|| wasm_error!(WasmErrorInner::Guest("User not found".into())))?;

    // Generate reset token
    let token = generate_reset_token();
    let expires_at = sys_time()?.as_seconds_since_epoch() + 3600; // 1 hour

    let reset_token = PasswordResetToken {
        email: email.clone(),
        token: token.clone(),
        expires_at,
        used: false,
    };

    let _token_hash = create_entry(EntryTypes::PasswordResetToken(reset_token))?;

    // In production, send email here
    // For now, return token (should be sent via email)
    Ok(token)
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ResetPasswordInput {
    pub email: String,
    pub token: String,
    pub new_password: String,
}

#[hdk_extern]
pub fn reset_password(input: ResetPasswordInput) -> ExternResult<()> {
    // Find token entry
    let token_entry = get_reset_token(&input.email, &input.token)?;
    
    if token_entry.is_none() {
        return Err(wasm_error!(WasmErrorInner::Guest("Invalid or expired token".into())));
    }

    let mut token = token_entry.unwrap();
    
    if token.used {
        return Err(wasm_error!(WasmErrorInner::Guest("Token already used".into())));
    }

    let now = sys_time()?.as_seconds_since_epoch();
    if now > token.expires_at {
        return Err(wasm_error!(WasmErrorInner::Guest("Token expired".into())));
    }

    // Update user password
    let mut user = get_user_by_email(&input.email)?
        .ok_or_else(|| wasm_error!(WasmErrorInner::Guest("User not found".into())))?;

    user.password_hash = hash_password(&input.new_password)?;
    let _user_hash = create_entry(EntryTypes::User(user))?;

    // Mark token as used
    token.used = true;
    let _token_hash = create_entry(EntryTypes::PasswordResetToken(token))?;

    Ok(())
}

// ========== Image Management ==========

#[derive(Serialize, Deserialize, Debug)]
pub struct UploadImageInput {
    pub bytes: Vec<u8>,
    pub mime_type: String,
}

#[hdk_extern]
pub fn upload_image(input: UploadImageInput) -> ExternResult<String> {
    // Validate image size (max 5MB)
    if input.bytes.len() > 5 * 1024 * 1024 {
        return Err(wasm_error!(WasmErrorInner::Guest("Image too large (max 5MB)".into())));
    }

    // Calculate hash
    let hash = calculate_image_hash(&input.bytes);

    // Check if image already exists
    if get_image_by_hash(&hash)?.is_some() {
        return Ok(hash);
    }

    // Create image entry
    let image = Image {
        hash: hash.clone(),
        bytes: input.bytes,
        mime_type: input.mime_type,
        created_at: sys_time()?.as_seconds_since_epoch(),
    };

    let _image_hash = create_entry(EntryTypes::Image(image))?;
    Ok(hash)
}

#[hdk_extern]
pub fn get_image(hash: String) -> ExternResult<Option<Image>> {
    get_image_by_hash(&hash)
}

#[hdk_extern]
pub fn set_profile_image(image_hash: String) -> ExternResult<User> {
    let agent = agent_info()?.agent_latest_pubkey();
    let mut user = get_user_by_agent(&agent)?
        .ok_or_else(|| wasm_error!(WasmErrorInner::Guest("User not found".into())))?;

    // Verify image exists
    if get_image_by_hash(&image_hash)?.is_none() {
        return Err(wasm_error!(WasmErrorInner::Guest("Image not found".into())));
    }

    user.profile_image_hash = Some(image_hash);
    let _user_hash = create_entry(EntryTypes::User(user.clone()))?;
    Ok(user)
}

// ========== Products ==========

#[derive(Serialize, Deserialize, Debug)]
pub struct CreateProductInput {
    pub title: String,
    pub description: String,
    pub price: f64,
    pub currency: String,
    pub image_hashes: Vec<String>,
    pub lat: Option<f64>,
    pub lon: Option<f64>,
}

#[hdk_extern]
pub fn create_product(input: CreateProductInput) -> ExternResult<EntryHash> {
    let agent = agent_info()?.agent_latest_pubkey();
    
    let product = Product {
        seller_id: agent,
        title: input.title,
        description: input.description,
        price: input.price,
        currency: input.currency,
        image_hashes: input.image_hashes,
        lat: input.lat,
        lon: input.lon,
        created_at: sys_time()?.as_seconds_since_epoch(),
        sold: false,
    };

    let product_hash = create_entry(EntryTypes::Product(product.clone()))?;
    
    // Link user to product
    create_link(
        agent,
        product_hash,
        LinkTypes::UserToProducts,
        (),
    )?;

    Ok(product_hash)
}

#[hdk_extern]
pub fn get_products(seller_id: Option<AgentPubKey>) -> ExternResult<Vec<Product>> {
    let agent = seller_id.unwrap_or_else(|| agent_info()?.agent_latest_pubkey());
    
    let links = get_links(agent, LinkTypes::UserToProducts, None)?;
    let mut products = Vec::new();

    for link in links {
        let entry_hash = link.target;
        let element = get(entry_hash, GetOptions::default())?
            .ok_or_else(|| wasm_error!(WasmErrorInner::Guest("Product not found".into())))?;
        
        if let Some(Entry::App(entry_bytes)) = element.entry() {
            let product: Product = entry_bytes.try_into()?;
            products.push(product);
        }
    }

    Ok(products)
}

#[hdk_extern]
pub fn comment_on_product(input: (EntryHash, String, Option<EntryHash>)) -> ExternResult<EntryHash> {
    let (product_id, text, parent_comment_hash) = input;
    let author_id = agent_info()?.agent_latest_pubkey();
    
    let comment = ProductComment {
        product_id,
        author_id,
        text,
        parent_comment_hash,
        created_at: sys_time()?.as_seconds_since_epoch(),
    };
    
    let comment_hash = create_entry(EntryTypes::ProductComment(comment.clone()))?;
    
    // Link comment to product
    create_link(
        product_id,
        comment_hash,
        LinkTypes::ProductToComments,
        (),
    )?;
    
    // Link to parent comment if it's a reply
    if let Some(parent_hash) = parent_comment_hash {
        create_link(
            parent_hash,
            comment_hash,
            LinkTypes::CommentToReplies,
            (),
        )?;
    }
    
    Ok(comment_hash)
}

#[hdk_extern]
pub fn get_product_comments(product_id: EntryHash) -> ExternResult<Vec<ProductComment>> {
    let links = get_links(product_id, LinkTypes::ProductToComments, None)?;
    let mut comments = Vec::new();
    
    for link in links {
        let entry_hash = link.target;
        let element = get(entry_hash, GetOptions::default())?
            .ok_or_else(|| wasm_error!(WasmErrorInner::Guest("Comment not found".into())))?;
        
        if let Some(Entry::App(entry_bytes)) = element.entry() {
            let comment: ProductComment = entry_bytes.try_into()?;
            comments.push(comment);
        }
    }
    
    // Sort by created_at
    comments.sort_by_key(|c| c.created_at);
    Ok(comments)
}

#[hdk_extern]
pub fn get_comment_replies(comment_hash: EntryHash) -> ExternResult<Vec<ProductComment>> {
    let links = get_links(comment_hash, LinkTypes::CommentToReplies, None)?;
    let mut replies = Vec::new();
    
    for link in links {
        let entry_hash = link.target;
        let element = get(entry_hash, GetOptions::default())?
            .ok_or_else(|| wasm_error!(WasmErrorInner::Guest("Reply not found".into())))?;
        
        if let Some(Entry::App(entry_bytes)) = element.entry() {
            let reply: ProductComment = entry_bytes.try_into()?;
            replies.push(reply);
        }
    }
    
    replies.sort_by_key(|r| r.created_at);
    Ok(replies)
}

// ========== Ad Banners ==========

#[derive(Serialize, Deserialize, Debug)]
pub struct CreateAdBannerInput {
    pub title: String,
    pub image_hash: Option<String>,
    pub link_url: Option<String>,
    pub start_date: i64,
    pub end_date: i64,
}

#[hdk_extern]
pub fn create_ad_banner(input: CreateAdBannerInput) -> ExternResult<EntryHash> {
    let advertiser_id = agent_info()?.agent_latest_pubkey();
    
    let banner = AdBanner {
        advertiser_id,
        title: input.title,
        image_hash: input.image_hash,
        link_url: input.link_url,
        active: true,
        start_date: input.start_date,
        end_date: input.end_date,
        impressions: 0,
        clicks: 0,
        created_at: sys_time()?.as_seconds_since_epoch(),
    };
    
    let banner_hash = create_entry(EntryTypes::AdBanner(banner.clone()))?;
    
    // Link to banner feed
    create_link(
        agent_info()?.agent_latest_pubkey(),
        banner_hash,
        LinkTypes::Banner,
        (),
    )?;
    
    Ok(banner_hash)
}

#[hdk_extern]
pub fn get_active_banners(_: ()) -> ExternResult<Vec<AdBanner>> {
    // Get all active banners
    // This is simplified - in production, use proper query/index
    let mut banners = Vec::new();
    let now = sys_time()?.as_seconds_since_epoch();
    
    // For now, return empty - will need proper banner index in production
    // This would query all banners where active = true and now >= start_date and now <= end_date
    
    Ok(banners)
}

#[hdk_extern]
pub fn record_banner_impression(banner_hash: EntryHash) -> ExternResult<()> {
    let element = get(banner_hash, GetOptions::default())?
        .ok_or_else(|| wasm_error!(WasmErrorInner::Guest("Banner not found".into())))?;
    
    if let Some(Entry::App(entry_bytes)) = element.entry() {
        let mut banner: AdBanner = entry_bytes.try_into()?;
        banner.impressions += 1;
        let _ = create_entry(EntryTypes::AdBanner(banner))?;
    }
    
    Ok(())
}

#[hdk_extern]
pub fn record_banner_click(banner_hash: EntryHash) -> ExternResult<()> {
    let element = get(banner_hash, GetOptions::default())?
        .ok_or_else(|| wasm_error!(WasmErrorInner::Guest("Banner not found".into())))?;
    
    if let Some(Entry::App(entry_bytes)) = element.entry() {
        let mut banner: AdBanner = entry_bytes.try_into()?;
        banner.clicks += 1;
        let _ = create_entry(EntryTypes::AdBanner(banner))?;
    }
    
    Ok(())
}

// ========== Services ==========

#[derive(Serialize, Deserialize, Debug)]
pub struct CreateServiceInput {
    pub service_type: String,
    pub title: String,
    pub description: String,
    pub price_per_km: Option<f64>,
    pub base_price: Option<f64>,
    pub price_per_night: Option<f64>,
    pub price_per_hour: Option<f64>,
    pub currency: String,
    pub image_hashes: Vec<String>,
    pub video_hashes: Option<Vec<String>>, // Videos para alojamientos
    pub lat: Option<f64>,
    pub lon: Option<f64>,
    pub room_capacity: Option<u32>,
    pub amenities: Vec<String>,
    pub professional_category: Option<String>,
    // Campos adicionales para alojamientos
    pub accommodation_type: Option<String>,
    pub max_guests: Option<u32>,
    pub bedrooms: Option<u32>,
    pub beds: Option<u32>,
    pub bathrooms: Option<u32>,
    pub check_in_time: Option<String>,
    pub check_out_time: Option<String>,
    pub house_rules: Option<String>,
    pub cancellation_policy: Option<String>,
    pub minimum_nights: Option<u32>,
    pub maximum_nights: Option<u32>,
}

#[hdk_extern]
pub fn create_service(input: CreateServiceInput) -> ExternResult<EntryHash> {
    let agent = agent_info()?.agent_latest_pubkey();
    
    let service = Service {
        provider_id: agent,
        service_type: input.service_type,
        title: input.title,
        description: input.description,
        price_per_km: input.price_per_km,
        base_price: input.base_price,
        price_per_night: input.price_per_night,
        price_per_hour: input.price_per_hour,
        currency: input.currency,
        image_hashes: input.image_hashes,
        lat: input.lat,
        lon: input.lon,
        available: true,
        created_at: sys_time()?.as_seconds_since_epoch(),
        room_capacity: input.room_capacity,
        amenities: input.amenities,
        professional_category: input.professional_category,
    };

    let service_hash = create_entry(EntryTypes::Service(service.clone()))?;
    
    // Link user to service
    create_link(
        agent,
        service_hash,
        LinkTypes::UserToServices,
        (),
    )?;

    Ok(service_hash)
}

#[hdk_extern]
pub fn get_services(service_type: Option<String>) -> ExternResult<Vec<Service>> {
    // Get all services (in production, use proper query)
    // For now, return empty vec - will implement proper query later
    Ok(Vec::new())
}

// ========== Messages ==========

#[derive(Serialize, Deserialize, Debug)]
pub struct SendMessageInput {
    pub receiver_id: AgentPubKey,
    pub text: Option<String>,
    pub image_hash: Option<String>,
    pub video_hash: Option<String>,
    pub encrypted_text: Option<String>, // Base64 encoded encrypted text
    pub encryption_key_id: Option<String>, // For key exchange
}

#[hdk_extern]
pub fn send_message(input: SendMessageInput) -> ExternResult<EntryHash> {
    let sender_id = agent_info()?.agent_latest_pubkey();
    let chat_id = format_chat_id(&sender_id, &input.receiver_id);
    
    // Check if receiver has blocked sender (check from receiver's perspective)
    // Note: This is simplified - in production, check from receiver's agent
    // For now, we'll check if sender has blocked receiver (prevent sending to blocked users)
    let sender_has_blocked = {
        let links = get_links(sender_id, LinkTypes::UserToBlocks, None)?;
        let mut blocked = false;
        for link in links {
            let element = get(link.target, GetOptions::default())?;
            if let Some(element) = element {
                if let Some(Entry::App(entry_bytes)) = element.entry() {
                    match EntryTypes::try_from(entry_bytes.clone()) {
                        Ok(EntryTypes::UserBlock(block)) => {
                            if block.blocked_id == input.receiver_id {
                                blocked = true;
                                break;
                            }
                        }
                        _ => {}
                    }
                }
            }
        }
        blocked
    };
    
    if sender_has_blocked {
        return Err(wasm_error!(WasmErrorInner::Guest("Cannot send message to blocked user".into())));
    }
    
    let message = Message {
        sender_id,
        receiver_id: input.receiver_id,
        chat_id: chat_id.clone(),
        text: input.encrypted_text.or(input.text),
        image_hash: input.image_hash,
        video_hash: input.video_hash,
        timestamp: sys_time()?.as_seconds_since_epoch(),
        read: false,
    };

    let message_hash = create_entry(EntryTypes::Message(message.clone()))?;
    
    // Link to chat
    create_link(
        sender_id,
        message_hash,
        LinkTypes::Chat,
        LinkTag::new(chat_id.as_bytes().to_vec()),
    )?;

    Ok(message_hash)
}

#[hdk_extern]
pub fn get_messages(chat_id: String) -> ExternResult<Vec<Message>> {
    let agent = agent_info()?.agent_latest_pubkey();
    let tag = LinkTag::new(chat_id.as_bytes().to_vec());
    
    let links = get_links(agent, LinkTypes::Chat, Some(tag))?;
    let mut messages = Vec::new();

    for link in links {
        let entry_hash = link.target;
        let element = get(entry_hash, GetOptions::default())?
            .ok_or_else(|| wasm_error!(WasmErrorInner::Guest("Message not found".into())))?;
        
        if let Some(Entry::App(entry_bytes)) = element.entry() {
            let message: Message = entry_bytes.try_into()?;
            messages.push(message);
        }
    }

    // Sort by timestamp
    messages.sort_by_key(|m| m.timestamp);
    Ok(messages)
}

#[hdk_extern]
pub fn get_chats(_: ()) -> ExternResult<Vec<AgentPubKey>> {
    let agent = agent_info()?.agent_latest_pubkey();
    
    // Get all unique chat partners
    let mut chat_partners = std::collections::HashSet::new();
    
    // Get messages where user is sender
    let sent_links = get_links(agent, LinkTypes::Chat, None)?;
    for link in sent_links {
        let element = get(link.target, GetOptions::default())?;
        if let Some(element) = element {
            if let Some(Entry::App(entry_bytes)) = element.entry() {
                match EntryTypes::try_from(entry_bytes.clone()) {
                    Ok(EntryTypes::Message(msg)) => {
                        if msg.sender_id == agent {
                            chat_partners.insert(msg.receiver_id);
                        } else if msg.receiver_id == agent {
                            chat_partners.insert(msg.sender_id);
                        }
                    }
                    _ => {}
                }
            }
        }
    }
    
    Ok(chat_partners.into_iter().collect())
}

#[hdk_extern]
pub fn mark_message_read(message_hash: EntryHash) -> ExternResult<()> {
    let agent = agent_info()?.agent_latest_pubkey();
    
    let element = get(message_hash.clone(), GetOptions::default())?
        .ok_or_else(|| wasm_error!(WasmErrorInner::Guest("Message not found".into())))?;
    
    if let Some(Entry::App(entry_bytes)) = element.entry() {
        match EntryTypes::try_from(entry_bytes.clone()) {
            Ok(EntryTypes::Message(mut msg)) => {
                // Only mark as read if user is the receiver
                if msg.receiver_id != agent {
                    return Err(wasm_error!(WasmErrorInner::Guest("Not authorized".into())));
                }
                
                msg.read = true;
                let _updated_hash = create_entry(EntryTypes::Message(msg))?;
                Ok(())
            }
            _ => Err(wasm_error!(WasmErrorInner::Guest("Not a message".into())))
        }
    } else {
        Err(wasm_error!(WasmErrorInner::Guest("Message not found".into())))
    }
}

#[hdk_extern]
pub fn get_unread_count(_: ()) -> ExternResult<u32> {
    let agent = agent_info()?.agent_latest_pubkey();
    let mut unread = 0u32;
    
    // Get all messages where user is receiver
    let links = get_links(agent, LinkTypes::Chat, None)?;
    for link in links {
        let element = get(link.target, GetOptions::default())?;
        if let Some(element) = element {
            if let Some(Entry::App(entry_bytes)) = element.entry() {
                match EntryTypes::try_from(entry_bytes.clone()) {
                    Ok(EntryTypes::Message(msg)) => {
                        if msg.receiver_id == agent && !msg.read {
                            unread += 1;
                        }
                    }
                    _ => {}
                }
            }
        }
    }
    
    Ok(unread)
}

// ========== User Discovery ==========

#[derive(Serialize, Deserialize, Debug)]
pub struct GetUsersNearbyInput {
    pub lat: f64,
    pub lon: f64,
    pub radius_km: f64,
}

#[hdk_extern]
pub fn get_users_nearby(input: GetUsersNearbyInput) -> ExternResult<Vec<User>> {
    // Get all users (in production, use spatial index)
    // For now, return empty vec - will implement proper spatial query later
    Ok(Vec::new())
}

// ========== Posts / Feed ==========

#[derive(Serialize, Deserialize, Debug)]
pub struct CreatePostInput {
    pub text: Option<String>,
    pub image_hashes: Vec<String>,
    pub video_hash: Option<String>,
    pub sticker_data: Vec<StickerData>,
    pub location: Option<PostLocation>,
}

#[hdk_extern]
pub fn create_post(input: CreatePostInput) -> ExternResult<EntryHash> {
    let author_id = agent_info()?.agent_latest_pubkey();
    
    let post = Post {
        author_id,
        text: input.text,
        image_hashes: input.image_hashes,
        video_hash: input.video_hash,
        sticker_data: input.sticker_data,
        created_at: sys_time()?.as_seconds_since_epoch(),
        location: input.location,
    };

    let post_hash = create_entry(EntryTypes::Post(post.clone()))?;
    
    // Link user to their post
    create_link(
        author_id,
        post_hash,
        LinkTypes::UserToPosts,
        (),
    )?;
    
    // Link to global feed
    create_link(
        author_id,
        post_hash,
        LinkTypes::Feed,
        (),
    )?;

    Ok(post_hash)
}

#[hdk_extern]
pub fn get_feed(limit: Option<u32>) -> ExternResult<Vec<Post>> {
    // Get all posts from feed (all users)
    // In production, use proper query with pagination
    let limit = limit.unwrap_or(50);
    
    // Get all links to feed
    let agent = agent_info()?.agent_latest_pubkey();
    let links = get_links(agent, LinkTypes::Feed, None)?;
    
    let mut posts = Vec::new();
    let mut count = 0;
    
    for link in links {
        if count >= limit {
            break;
        }
        
        let entry_hash = link.target;
        let element = get(entry_hash, GetOptions::default())?;
        
        if let Some(element) = element {
            if let Some(Entry::App(entry_bytes)) = element.entry() {
                match EntryTypes::try_from(entry_bytes.clone()) {
                    Ok(EntryTypes::Post(post)) => {
                        posts.push(post);
                        count += 1;
                    }
                    _ => {}
                }
            }
        }
    }
    
    // Sort by created_at descending (newest first)
    posts.sort_by_key(|p| -(p.created_at as i64));
    
    Ok(posts)
}

#[hdk_extern]
pub fn get_user_posts(user_id: AgentPubKey, limit: Option<u32>) -> ExternResult<Vec<Post>> {
    // Get posts from specific user
    let limit = limit.unwrap_or(50);
    
    let links = get_links(user_id, LinkTypes::UserToPosts, None)?;
    let mut posts = Vec::new();
    let mut count = 0;
    
    for link in links {
        if count >= limit {
            break;
        }
        
        let entry_hash = link.target;
        let element = get(entry_hash, GetOptions::default())?;
        
        if let Some(element) = element {
            if let Some(Entry::App(entry_bytes)) = element.entry() {
                match EntryTypes::try_from(entry_bytes.clone()) {
                    Ok(EntryTypes::Post(post)) => {
                        posts.push(post);
                        count += 1;
                    }
                    _ => {}
                }
            }
        }
    }
    
    // Sort by created_at descending (newest first)
    posts.sort_by_key(|p| -(p.created_at as i64));
    
    Ok(posts)
}

#[hdk_extern]
pub fn get_my_posts(limit: Option<u32>) -> ExternResult<Vec<Post>> {
    let agent = agent_info()?.agent_latest_pubkey();
    get_user_posts(agent, limit)
}

// ========== Post Interactions ==========

#[derive(Serialize, Deserialize, Debug)]
pub struct ClapPostInput {
    pub post_hash: EntryHash,
    pub count: u32, // Número de aplausos a agregar (ej: 1, 5, 10)
}

#[hdk_extern]
pub fn clap_post(input: ClapPostInput) -> ExternResult<EntryHash> {
    let user_id = agent_info()?.agent_latest_pubkey();
    
    // Verificar que el post existe
    let _post = get(input.post_hash.clone(), GetOptions::default())?
        .ok_or_else(|| wasm_error!(WasmErrorInner::Guest("Post not found".into())))?;
    
    let clap = PostClap {
        post_hash: input.post_hash.clone(),
        user_id,
        count: input.count,
        created_at: sys_time()?.as_seconds_since_epoch(),
    };
    
    let clap_hash = create_entry(EntryTypes::PostClap(clap))?;
    
    // Link post to clap
    create_link(
        input.post_hash,
        clap_hash,
        LinkTypes::PostToClaps,
        (),
    )?;
    
    Ok(clap_hash)
}

#[hdk_extern]
pub fn get_post_claps(post_hash: EntryHash) -> ExternResult<u32> {
    let links = get_links(post_hash, LinkTypes::PostToClaps, None)?;
    let mut total_claps = 0u32;
    
    for link in links {
        let element = get(link.target, GetOptions::default())?;
        if let Some(element) = element {
            if let Some(Entry::App(entry_bytes)) = element.entry() {
                match EntryTypes::try_from(entry_bytes.clone()) {
                    Ok(EntryTypes::PostClap(clap)) => {
                        total_claps += clap.count;
                    }
                    _ => {}
                }
            }
        }
    }
    
    Ok(total_claps)
}

#[hdk_extern]
pub fn like_post(post_hash: EntryHash) -> ExternResult<EntryHash> {
    let user_id = agent_info()?.agent_latest_pubkey();
    
    // Verificar que el post existe
    let _post = get(post_hash.clone(), GetOptions::default())?
        .ok_or_else(|| wasm_error!(WasmErrorInner::Guest("Post not found".into())))?;
    
    // Verificar si ya dio like
    let existing_likes = get_links(post_hash.clone(), LinkTypes::PostToLikes, None)?;
    for link in existing_likes {
        let element = get(link.target, GetOptions::default())?;
        if let Some(element) = element {
            if let Some(Entry::App(entry_bytes)) = element.entry() {
                match EntryTypes::try_from(entry_bytes.clone()) {
                    Ok(EntryTypes::PostLike(like)) => {
                        if like.user_id == user_id {
                            return Err(wasm_error!(WasmErrorInner::Guest("Already liked".into())));
                        }
                    }
                    _ => {}
                }
            }
        }
    }
    
    let like = PostLike {
        post_hash: post_hash.clone(),
        user_id,
        created_at: sys_time()?.as_seconds_since_epoch(),
    };
    
    let like_hash = create_entry(EntryTypes::PostLike(like))?;
    
    // Link post to like
    create_link(
        post_hash,
        like_hash,
        LinkTypes::PostToLikes,
        (),
    )?;
    
    Ok(like_hash)
}

#[hdk_extern]
pub fn unlike_post(post_hash: EntryHash) -> ExternResult<()> {
    let user_id = agent_info()?.agent_latest_pubkey();
    
    let links = get_links(post_hash.clone(), LinkTypes::PostToLikes, None)?;
    
    for link in links {
        let element = get(link.target, GetOptions::default())?;
        if let Some(element) = element {
            if let Some(Entry::App(entry_bytes)) = element.entry() {
                match EntryTypes::try_from(entry_bytes.clone()) {
                    Ok(EntryTypes::PostLike(like)) => {
                        if like.user_id == user_id {
                            delete_entry(link.target)?;
                            delete_link(link.create_link_hash)?;
                            return Ok(());
                        }
                    }
                    _ => {}
                }
            }
        }
    }
    
    Err(wasm_error!(WasmErrorInner::Guest("Like not found".into())))
}

#[hdk_extern]
pub fn get_post_likes(post_hash: EntryHash) -> ExternResult<u32> {
    let links = get_links(post_hash, LinkTypes::PostToLikes, None)?;
    Ok(links.len() as u32)
}

#[hdk_extern]
pub fn has_user_liked_post(post_hash: EntryHash) -> ExternResult<bool> {
    let user_id = agent_info()?.agent_latest_pubkey();
    
    let links = get_links(post_hash, LinkTypes::PostToLikes, None)?;
    
    for link in links {
        let element = get(link.target, GetOptions::default())?;
        if let Some(element) = element {
            if let Some(Entry::App(entry_bytes)) = element.entry() {
                match EntryTypes::try_from(entry_bytes.clone()) {
                    Ok(EntryTypes::PostLike(like)) => {
                        if like.user_id == user_id {
                            return Ok(true);
                        }
                    }
                    _ => {}
                }
            }
        }
    }
    
    Ok(false)
}

#[derive(Serialize, Deserialize, Debug)]
pub struct CommentPostInput {
    pub post_hash: EntryHash,
    pub text: String,
    pub parent_comment_hash: Option<EntryHash>, // Para respuestas
}

#[hdk_extern]
pub fn comment_post(input: CommentPostInput) -> ExternResult<EntryHash> {
    let author_id = agent_info()?.agent_latest_pubkey();
    
    // Verificar que el post existe
    let _post = get(input.post_hash.clone(), GetOptions::default())?
        .ok_or_else(|| wasm_error!(WasmErrorInner::Guest("Post not found".into())))?;
    
    // Si es respuesta, verificar que el comentario padre existe
    if let Some(parent_hash) = input.parent_comment_hash {
        let _parent = get(parent_hash, GetOptions::default())?
            .ok_or_else(|| wasm_error!(WasmErrorInner::Guest("Parent comment not found".into())))?;
    }
    
    let comment = PostComment {
        post_hash: input.post_hash.clone(),
        author_id,
        text: input.text,
        parent_comment_hash: input.parent_comment_hash,
        created_at: sys_time()?.as_seconds_since_epoch(),
    };
    
    let comment_hash = create_entry(EntryTypes::PostComment(comment.clone()))?;
    
    // Link post to comment
    create_link(
        input.post_hash,
        comment_hash,
        LinkTypes::PostToComments,
        (),
    )?;
    
    // Si es respuesta, link al comentario padre
    if let Some(parent_hash) = input.parent_comment_hash {
        create_link(
            parent_hash,
            comment_hash,
            LinkTypes::CommentToReplies,
            (),
        )?;
    }
    
    Ok(comment_hash)
}

#[hdk_extern]
pub fn get_post_comments(post_hash: EntryHash) -> ExternResult<Vec<PostComment>> {
    let links = get_links(post_hash, LinkTypes::PostToComments, None)?;
    let mut comments = Vec::new();
    
    for link in links {
        let element = get(link.target, GetOptions::default())?;
        if let Some(element) = element {
            if let Some(Entry::App(entry_bytes)) = element.entry() {
                match EntryTypes::try_from(entry_bytes.clone()) {
                    Ok(EntryTypes::PostComment(comment)) => {
                        // Solo comentarios de nivel raíz (sin padre)
                        if comment.parent_comment_hash.is_none() {
                            comments.push(comment);
                        }
                    }
                    _ => {}
                }
            }
        }
    }
    
    // Sort by created_at ascending (oldest first)
    comments.sort_by_key(|c| c.created_at);
    Ok(comments)
}

#[hdk_extern]
pub fn get_comment_replies(comment_hash: EntryHash) -> ExternResult<Vec<PostComment>> {
    let links = get_links(comment_hash, LinkTypes::CommentToReplies, None)?;
    let mut replies = Vec::new();
    
    for link in links {
        let element = get(link.target, GetOptions::default())?;
        if let Some(element) = element {
            if let Some(Entry::App(entry_bytes)) = element.entry() {
                match EntryTypes::try_from(entry_bytes.clone()) {
                    Ok(EntryTypes::PostComment(comment)) => {
                        replies.push(comment);
                    }
                    _ => {}
                }
            }
        }
    }
    
    // Sort by created_at ascending (oldest first)
    replies.sort_by_key(|c| c.created_at);
    Ok(replies)
}

// ========== Post Reports ==========

#[derive(Serialize, Deserialize, Debug)]
pub struct ReportPostInput {
    pub post_hash: EntryHash,
    pub reason: String,
    pub description: Option<String>,
}

#[hdk_extern]
pub fn report_post(input: ReportPostInput) -> ExternResult<EntryHash> {
    let reporter_id = agent_info()?.agent_latest_pubkey();
    
    // Verificar que el post existe
    let _post = get(input.post_hash.clone(), GetOptions::default())?
        .ok_or_else(|| wasm_error!(WasmErrorInner::Guest("Post not found".into())))?;
    
    // Validar razón
    let valid_reasons = vec!["spam", "inappropriate", "violence", "harassment", "other"];
    if !valid_reasons.contains(&input.reason.as_str()) {
        return Err(wasm_error!(WasmErrorInner::Guest("Invalid reason".into())));
    }
    
    let report = PostReport {
        post_hash: input.post_hash.clone(),
        reporter_id,
        reason: input.reason,
        description: input.description,
        created_at: sys_time()?.as_seconds_since_epoch(),
    };
    
    let report_hash = create_entry(EntryTypes::PostReport(report))?;
    
    // Link post to report
    create_link(
        input.post_hash,
        report_hash,
        LinkTypes::PostToReports,
        (),
    )?;
    
    Ok(report_hash)
}

#[hdk_extern]
pub fn get_post_reports(post_hash: EntryHash) -> ExternResult<Vec<PostReport>> {
    let links = get_links(post_hash, LinkTypes::PostToReports, None)?;
    let mut reports = Vec::new();
    
    for link in links {
        let element = get(link.target, GetOptions::default())?;
        if let Some(element) = element {
            if let Some(Entry::App(entry_bytes)) = element.entry() {
                match EntryTypes::try_from(entry_bytes.clone()) {
                    Ok(EntryTypes::PostReport(report)) => {
                        reports.push(report);
                    }
                    _ => {}
                }
            }
        }
    }
    
    // Sort by created_at descending (newest first)
    reports.sort_by_key(|r| -(r.created_at as i64));
    Ok(reports)
}

// ========== Ghost Mode ==========

#[hdk_extern]
pub fn set_ghost_mode(enabled: bool) -> ExternResult<User> {
    let agent = agent_info()?.agent_latest_pubkey();
    let now = sys_time()?.as_seconds_since_epoch();
    
    // Get user entry
    let links = get_links(agent, LinkTypes::UserToProfileImage, None)?;
    let mut user_hash_opt = None;
    for link in links {
        let element = get(link.target, GetOptions::default())?;
        if let Some(element) = element {
            if let Some(Entry::App(entry_bytes)) = element.entry() {
                match EntryTypes::try_from(entry_bytes.clone()) {
                    Ok(EntryTypes::User(_)) => {
                        user_hash_opt = Some(link.target);
                        break;
                    }
                    _ => {}
                }
            }
        }
    }
    
    let user_hash = user_hash_opt.ok_or_else(|| wasm_error!(WasmErrorInner::Guest("User not found".into())))?;
    let element = get(user_hash.clone(), GetOptions::default())?
        .ok_or_else(|| wasm_error!(WasmErrorInner::Guest("User not found".into())))?;
    
    let mut user: User = element.entry()
        .to_app_option()?
        .ok_or_else(|| wasm_error!(WasmErrorInner::Guest("User entry not found".into())))?;
    
    user.ghost_mode = enabled;
    user.last_seen = now;
    
    let updated_hash = create_entry(EntryTypes::User(user.clone()))?;
    
    // Update link
    let links = get_links(agent, LinkTypes::UserToProfileImage, None)?;
    for link in links {
        if link.target == user_hash {
            delete_link(link.create_link_hash)?;
        }
    }
    create_link(agent, updated_hash, LinkTypes::UserToProfileImage, ())?;
    
    Ok(user)
}

#[hdk_extern]
pub fn update_last_seen(_: ()) -> ExternResult<()> {
    let agent = agent_info()?.agent_latest_pubkey();
    let mut user = get_user_by_agent(&agent)?
        .ok_or_else(|| wasm_error!(WasmErrorInner::Guest("User not found".into())))?;
    
    user.last_seen = sys_time()?.as_seconds_since_epoch();
    
    // Update user entry
    let user_hash = hash_entry(&EntryTypes::User(user.clone()))?;
    // In production, need to update existing entry
    let _ = create_entry(EntryTypes::User(user))?;
    
    Ok(())
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ShareLocationInput {
    pub lat: f64,
    pub lon: f64,
    pub share_with: AgentPubKey,
}

#[hdk_extern]
pub fn share_location(input: ShareLocationInput) -> ExternResult<String> {
    let agent = agent_info()?.agent_latest_pubkey();
    
    // Update user location
    let mut user = get_user_by_agent(&agent)?
        .ok_or_else(|| wasm_error!(WasmErrorInner::Guest("User not found".into())))?;
    
    user.lat = Some(input.lat);
    user.lon = Some(input.lon);
    user.last_seen = sys_time()?.as_seconds_since_epoch();
    
    // Update user entry
    let _ = create_entry(EntryTypes::User(user))?;
    
    // Create a location sharing entry (simplified - in production, use proper entry type)
    // For now, we'll use the user's location which is updated in real-time
    
    Ok("Location shared".to_string())
}

#[hdk_extern]
pub fn get_shared_location(user_id: AgentPubKey) -> ExternResult<Option<(f64, f64)>> {
    let user = get_user_by_agent(&user_id)?;
    
    if let Some(u) = user {
        if let (Some(lat), Some(lon)) = (u.lat, u.lon) {
            // Check if location sharing is enabled for this user
            // For now, return location if available
            Ok(Some((lat, lon)))
        } else {
            Ok(None)
        }
    } else {
        Ok(None)
    }
}
    let agent = agent_info()?.agent_latest_pubkey();
    let now = sys_time()?.as_seconds_since_epoch();
    
    // Get user entry
    let links = get_links(agent, LinkTypes::UserToProfileImage, None)?;
    let mut user_hash_opt = None;
    for link in links {
        let element = get(link.target, GetOptions::default())?;
        if let Some(element) = element {
            if let Some(Entry::App(entry_bytes)) = element.entry() {
                match EntryTypes::try_from(entry_bytes.clone()) {
                    Ok(EntryTypes::User(_)) => {
                        user_hash_opt = Some(link.target);
                        break;
                    }
                    _ => {}
                }
            }
        }
    }
    
    let user_hash = user_hash_opt.ok_or_else(|| wasm_error!(WasmErrorInner::Guest("User not found".into())))?;
    let element = get(user_hash.clone(), GetOptions::default())?
        .ok_or_else(|| wasm_error!(WasmErrorInner::Guest("User not found".into())))?;
    
    let mut user: User = element.entry()
        .to_app_option()?
        .ok_or_else(|| wasm_error!(WasmErrorInner::Guest("User entry not found".into())))?;
    
    // Solo actualizar last_seen si no está en modo ghost
    if !user.ghost_mode {
        user.last_seen = now;
        let updated_hash = create_entry(EntryTypes::User(user))?;
        
        // Update link
        let links = get_links(agent, LinkTypes::UserToProfileImage, None)?;
        for link in links {
            if link.target == user_hash {
                delete_link(link.create_link_hash)?;
            }
        }
        create_link(agent, updated_hash, LinkTypes::UserToProfileImage, ())?;
    }
    
    Ok(())
}

// ========== User Blocking ==========

#[hdk_extern]
pub fn block_user(blocked_id: AgentPubKey) -> ExternResult<EntryHash> {
    let blocker_id = agent_info()?.agent_latest_pubkey();
    
    if blocker_id == blocked_id {
        return Err(wasm_error!(WasmErrorInner::Guest("Cannot block yourself".into())));
    }
    
    let block = UserBlock {
        blocker_id,
        blocked_id,
        created_at: sys_time()?.as_seconds_since_epoch(),
    };
    
    let block_hash = create_entry(EntryTypes::UserBlock(block))?;
    
    // Link user to block
    create_link(
        blocker_id,
        block_hash,
        LinkTypes::UserToBlocks,
        (),
    )?;
    
    Ok(block_hash)
}

#[hdk_extern]
pub fn unblock_user(blocked_id: AgentPubKey) -> ExternResult<()> {
    let blocker_id = agent_info()?.agent_latest_pubkey();
    
    let links = get_links(blocker_id, LinkTypes::UserToBlocks, None)?;
    
    for link in links {
        let element = get(link.target, GetOptions::default())?;
        if let Some(element) = element {
            if let Some(Entry::App(entry_bytes)) = element.entry() {
                match EntryTypes::try_from(entry_bytes.clone()) {
                    Ok(EntryTypes::UserBlock(block)) => {
                        if block.blocked_id == blocked_id {
                            delete_entry(link.target)?;
                            delete_link(link.create_link_hash)?;
                            return Ok(());
                        }
                    }
                    _ => {}
                }
            }
        }
    }
    
    Err(wasm_error!(WasmErrorInner::Guest("Block not found".into())))
}

#[hdk_extern]
pub fn is_user_blocked(user_id: AgentPubKey) -> ExternResult<bool> {
    let current_user = agent_info()?.agent_latest_pubkey();
    
    let links = get_links(current_user, LinkTypes::UserToBlocks, None)?;
    
    for link in links {
        let element = get(link.target, GetOptions::default())?;
        if let Some(element) = element {
            if let Some(Entry::App(entry_bytes)) = element.entry() {
                match EntryTypes::try_from(entry_bytes.clone()) {
                    Ok(EntryTypes::UserBlock(block)) => {
                        if block.blocked_id == user_id {
                            return Ok(true);
                        }
                    }
                    _ => {}
                }
            }
        }
    }
    
    Ok(false)
}

#[hdk_extern]
pub fn get_blocked_users(_: ()) -> ExternResult<Vec<AgentPubKey>> {
    let blocker_id = agent_info()?.agent_latest_pubkey();
    let mut blocked = Vec::new();
    
    let links = get_links(blocker_id, LinkTypes::UserToBlocks, None)?;
    
    for link in links {
        let element = get(link.target, GetOptions::default())?;
        if let Some(element) = element {
            if let Some(Entry::App(entry_bytes)) = element.entry() {
                match EntryTypes::try_from(entry_bytes.clone()) {
                    Ok(EntryTypes::UserBlock(block)) => {
                        blocked.push(block.blocked_id);
                    }
                    _ => {}
                }
            }
        }
    }
    
    Ok(blocked)
}

// ========== Tamagochi ==========

#[derive(Serialize, Deserialize, Debug)]
pub struct CreateTamagochiInput {
    pub name: String,
}

#[hdk_extern]
pub fn create_tamagochi(input: CreateTamagochiInput) -> ExternResult<EntryHash> {
    let owner_id = agent_info()?.agent_latest_pubkey();
    let now = sys_time()?.as_seconds_since_epoch();
    
    let tamagochi = Tamagochi {
        owner_id,
        name: input.name,
        stage: "egg".to_string(),
        energy: 100,
        hunger: 100,
        hygiene: 100,
        happiness: 100,
        experience: 0,
        level: 1,
        born_at: now,
        last_fed_at: now,
        last_cleaned_at: now,
        last_played_at: now,
        is_alive: true,
    };
    
    let tamagochi_hash = create_entry(EntryTypes::Tamagochi(tamagochi))?;
    
    // Link user to tamagochi
    create_link(
        owner_id,
        tamagochi_hash,
        LinkTypes::UserToTamagochi,
        (),
    )?;
    
    Ok(tamagochi_hash)
}

#[hdk_extern]
pub fn get_tamagochi(_: ()) -> ExternResult<Option<Tamagochi>> {
    let owner_id = agent_info()?.agent_latest_pubkey();
    
    let links = get_links(owner_id, LinkTypes::UserToTamagochi, None)?;
    
    for link in links {
        let element = get(link.target, GetOptions::default())?;
        if let Some(element) = element {
            if let Some(Entry::App(entry_bytes)) = element.entry() {
                match EntryTypes::try_from(entry_bytes.clone()) {
                    Ok(EntryTypes::Tamagochi(tamagochi)) => {
                        if tamagochi.is_alive {
                            return Ok(Some(tamagochi));
                        }
                    }
                    _ => {}
                }
            }
        }
    }
    
    Ok(None)
}

#[hdk_extern]
pub fn feed_tamagochi(_: ()) -> ExternResult<Tamagochi> {
    let owner_id = agent_info()?.agent_latest_pubkey();
    let now = sys_time()?.as_seconds_since_epoch();
    
    let mut tamagochi = get_tamagochi(())?
        .ok_or_else(|| wasm_error!(WasmErrorInner::Guest("Tamagochi not found".into())))?;
    
    if !tamagochi.is_alive {
        return Err(wasm_error!(WasmErrorInner::Guest("Tamagochi is dead".into())));
    }
    
    tamagochi.hunger = (tamagochi.hunger + 30).min(100);
    tamagochi.happiness = (tamagochi.happiness + 5).min(100);
    tamagochi.last_fed_at = now;
    tamagochi.experience += 5;
    
    check_tamagochi_evolution(&mut tamagochi);
    
    let _hash = create_entry(EntryTypes::Tamagochi(tamagochi.clone()))?;
    Ok(tamagochi)
}

#[hdk_extern]
pub fn clean_tamagochi(_: ()) -> ExternResult<Tamagochi> {
    let owner_id = agent_info()?.agent_latest_pubkey();
    let now = sys_time()?.as_seconds_since_epoch();
    
    let mut tamagochi = get_tamagochi(())?
        .ok_or_else(|| wasm_error!(WasmErrorInner::Guest("Tamagochi not found".into())))?;
    
    if !tamagochi.is_alive {
        return Err(wasm_error!(WasmErrorInner::Guest("Tamagochi is dead".into())));
    }
    
    tamagochi.hygiene = 100;
    tamagochi.happiness = (tamagochi.happiness + 10).min(100);
    tamagochi.last_cleaned_at = now;
    tamagochi.experience += 3;
    
    check_tamagochi_evolution(&mut tamagochi);
    
    let _hash = create_entry(EntryTypes::Tamagochi(tamagochi.clone()))?;
    Ok(tamagochi)
}

#[hdk_extern]
pub fn play_with_tamagochi(_: ()) -> ExternResult<Tamagochi> {
    let owner_id = agent_info()?.agent_latest_pubkey();
    let now = sys_time()?.as_seconds_since_epoch();
    
    let mut tamagochi = get_tamagochi(())?
        .ok_or_else(|| wasm_error!(WasmErrorInner::Guest("Tamagochi not found".into())))?;
    
    if !tamagochi.is_alive {
        return Err(wasm_error!(WasmErrorInner::Guest("Tamagochi is dead".into())));
    }
    
    tamagochi.energy = tamagochi.energy.saturating_sub(10);
    tamagochi.happiness = (tamagochi.happiness + 15).min(100);
    tamagochi.last_played_at = now;
    tamagochi.experience += 10;
    
    check_tamagochi_evolution(&mut tamagochi);
    
    let _hash = create_entry(EntryTypes::Tamagochi(tamagochi.clone()))?;
    Ok(tamagochi)
}

#[hdk_extern]
pub fn kill_tamagochi(_: ()) -> ExternResult<EntryHash> {
    let owner_id = agent_info()?.agent_latest_pubkey();
    let now = sys_time()?.as_seconds_since_epoch();
    
    let mut tamagochi = get_tamagochi(())?
        .ok_or_else(|| wasm_error!(WasmErrorInner::Guest("Tamagochi not found".into())))?;
    
    if !tamagochi.is_alive {
        return Err(wasm_error!(WasmErrorInner::Guest("Tamagochi already dead".into())));
    }
    
    let age = now - tamagochi.born_at;
    tamagochi.is_alive = false;
    
    let _tamagochi_hash = create_entry(EntryTypes::Tamagochi(tamagochi.clone()))?;
    
    // Create death record
    let death = TamagochiDeath {
        owner_id,
        tamagochi_name: tamagochi.name.clone(),
        death_reason: "killed".to_string(),
        died_at: now,
        age_seconds: age,
    };
    
    let death_hash = create_entry(EntryTypes::TamagochiDeath(death))?;
    
    // Link user to death
    create_link(
        owner_id,
        death_hash,
        LinkTypes::UserToDeaths,
        (),
    )?;
    
    Ok(death_hash)
}

#[hdk_extern]
pub fn update_tamagochi_state(_: ()) -> ExternResult<Tamagochi> {
    let mut tamagochi = get_tamagochi(())?
        .ok_or_else(|| wasm_error!(WasmErrorInner::Guest("Tamagochi not found".into())))?;
    
    if !tamagochi.is_alive {
        return Ok(tamagochi);
    }
    
    let now = sys_time()?.as_seconds_since_epoch();
    
    // Decrease stats over time
    let hours_since_fed = (now - tamagochi.last_fed_at) / 3600;
    tamagochi.hunger = tamagochi.hunger.saturating_sub((hours_since_fed * 5) as u32).max(0);
    
    let hours_since_cleaned = (now - tamagochi.last_cleaned_at) / 3600;
    tamagochi.hygiene = tamagochi.hygiene.saturating_sub((hours_since_cleaned * 3) as u32).max(0);
    
    // Energy regenerates slowly
    if tamagochi.energy < 100 {
        tamagochi.energy = (tamagochi.energy + 1).min(100);
    }
    
    // Check for death
    if tamagochi.hunger == 0 {
        tamagochi.is_alive = false;
        let age = now - tamagochi.born_at;
        
        let death = TamagochiDeath {
            owner_id: tamagochi.owner_id,
            tamagochi_name: tamagochi.name.clone(),
            death_reason: "starvation".to_string(),
            died_at: now,
            age_seconds: age,
        };
        
        let death_hash = create_entry(EntryTypes::TamagochiDeath(death))?;
        create_link(
            tamagochi.owner_id,
            death_hash,
            LinkTypes::UserToDeaths,
            (),
        )?;
    }
    
    check_tamagochi_evolution(&mut tamagochi);
    
    let _hash = create_entry(EntryTypes::Tamagochi(tamagochi.clone()))?;
    Ok(tamagochi)
}

#[hdk_extern]
pub fn get_tamagochi_deaths(_: ()) -> ExternResult<Vec<TamagochiDeath>> {
    let owner_id = agent_info()?.agent_latest_pubkey();
    let mut deaths = Vec::new();
    
    let links = get_links(owner_id, LinkTypes::UserToDeaths, None)?;
    
    for link in links {
        let element = get(link.target, GetOptions::default())?;
        if let Some(element) = element {
            if let Some(Entry::App(entry_bytes)) = element.entry() {
                match EntryTypes::try_from(entry_bytes.clone()) {
                    Ok(EntryTypes::TamagochiDeath(death)) => {
                        deaths.push(death);
                    }
                    _ => {}
                }
            }
        }
    }
    
    // Sort by death time (newest first)
    deaths.sort_by_key(|d| -(d.died_at as i64));
    Ok(deaths)
}

fn check_tamagochi_evolution(tamagochi: &mut Tamagochi) {
    let old_stage = tamagochi.stage.clone();
    
    if tamagochi.experience >= 100 && tamagochi.stage == "egg" {
        tamagochi.stage = "baby".to_string();
        tamagochi.level = 2;
    } else if tamagochi.experience >= 300 && tamagochi.stage == "baby" {
        tamagochi.stage = "child".to_string();
        tamagochi.level = 3;
    } else if tamagochi.experience >= 600 && tamagochi.stage == "child" {
        tamagochi.stage = "teen".to_string();
        tamagochi.level = 4;
    } else if tamagochi.experience >= 1000 && tamagochi.stage == "teen" {
        tamagochi.stage = "adult".to_string();
        tamagochi.level = 5;
    }
    
    if old_stage != tamagochi.stage {
        tamagochi.happiness = 100; // Evolution makes them happy
    }
}

#[hdk_extern]
pub fn auto_grow_tamagochi(_: ()) -> ExternResult<Tamagochi> {
    let mut tamagochi = get_tamagochi(())?
        .ok_or_else(|| wasm_error!(WasmErrorInner::Guest("Tamagochi not found".into())))?;
    
    if !tamagochi.is_alive {
        return Ok(tamagochi);
    }
    
    // Auto-grow: increase experience on each app entry
    tamagochi.experience += 10;
    
    // Auto-feed: restore hunger a bit
    tamagochi.hunger = (tamagochi.hunger + 20).min(100);
    
    // Check evolution
    check_tamagochi_evolution(&mut tamagochi);
    
    let _hash = create_entry(EntryTypes::Tamagochi(tamagochi.clone()))?;
    Ok(tamagochi)
}

// ========== Friends System ==========

#[hdk_extern]
pub fn add_friend(friend_id: AgentPubKey) -> ExternResult<String> {
    let agent = agent_info()?.agent_latest_pubkey();
    
    // Check if already friends
    let existing_links = get_links(agent, LinkTypes::UserToFriends, None)?;
    for link in existing_links {
        if link.target == friend_id {
            return Err(wasm_error!(WasmErrorInner::Guest("Already friends".into())));
        }
    }
    
    // Create bidirectional friendship link
    create_link(agent, friend_id, LinkTypes::UserToFriends, LinkTag::new(vec![]))?;
    
    Ok("Friend added".to_string())
}

#[hdk_extern]
pub fn remove_friend(friend_id: AgentPubKey) -> ExternResult<String> {
    let agent = agent_info()?.agent_latest_pubkey();
    
    // Get all friend links
    let links = get_links(agent, LinkTypes::UserToFriends, None)?;
    for link in links {
        if link.target == friend_id {
            delete_link(link.create_link_hash)?;
        }
    }
    
    Ok("Friend removed".to_string())
}

#[hdk_extern]
pub fn get_friends(_: ()) -> ExternResult<Vec<AgentPubKey>> {
    let agent = agent_info()?.agent_latest_pubkey();
    let links = get_links(agent, LinkTypes::UserToFriends, None)?;
    Ok(links.into_iter().map(|l| l.target).collect())
}

#[hdk_extern]
pub fn is_friend(user_id: AgentPubKey) -> ExternResult<bool> {
    let agent = agent_info()?.agent_latest_pubkey();
    let links = get_links(agent, LinkTypes::UserToFriends, None)?;
    Ok(links.iter().any(|l| l.target == user_id))
}

// ========== User Preferences ==========

#[hdk_extern]
pub fn get_user_preferences(_: ()) -> ExternResult<Option<UserPreferences>> {
    let agent = agent_info()?.agent_latest_pubkey();
    
    // Get preferences entry for this user
    // Simplified - in production, need proper agent-to-preferences mapping
    // For now, return default preferences
    Ok(Some(UserPreferences {
        owner_id: agent,
        app_color: "#1f7aec".to_string(),
        tamagochi_enabled: true,
        location_sharing_enabled: false,
        updated_at: sys_time()?.as_seconds_since_epoch(),
    }))
}

#[derive(Serialize, Deserialize, Debug)]
pub struct UpdatePreferencesInput {
    pub app_color: Option<String>,
    pub tamagochi_enabled: Option<bool>,
    pub location_sharing_enabled: Option<bool>,
}

#[hdk_extern]
pub fn update_user_preferences(input: UpdatePreferencesInput) -> ExternResult<UserPreferences> {
    let agent = agent_info()?.agent_latest_pubkey();
    
    // Get existing preferences or create new
    let mut prefs = get_user_preferences(())?.unwrap_or_else(|| UserPreferences {
        owner_id: agent,
        app_color: "#1f7aec".to_string(),
        tamagochi_enabled: true,
        location_sharing_enabled: false,
        updated_at: sys_time()?.as_seconds_since_epoch(),
    });
    
    // Update fields
    if let Some(color) = input.app_color {
        prefs.app_color = color;
    }
    if let Some(enabled) = input.tamagochi_enabled {
        prefs.tamagochi_enabled = enabled;
    }
    if let Some(sharing) = input.location_sharing_enabled {
        prefs.location_sharing_enabled = sharing;
    }
    prefs.updated_at = sys_time()?.as_seconds_since_epoch();
    
    // Create or update entry
    let _hash = create_entry(EntryTypes::UserPreferences(prefs.clone()))?;
    
    Ok(prefs)
}

// ========== Location Sharing ==========

#[hdk_extern]
pub fn get_user_location(user_id: AgentPubKey) -> ExternResult<Option<(f64, f64)>> {
    get_shared_location(user_id)
}

// ========== Driver System ==========

#[derive(Serialize, Deserialize, Debug)]
pub struct RegisterDriverInput {
    pub vehicle_info: integrity::VehicleInfo,
    pub price_per_km: Option<f64>,
    pub base_price: Option<f64>,
    pub currency: String,
}

#[hdk_extern]
pub fn register_as_driver(input: RegisterDriverInput) -> ExternResult<User> {
    let agent = agent_info()?.agent_latest_pubkey();
    let mut user = get_user_by_agent(&agent)?
        .ok_or_else(|| wasm_error!(WasmErrorInner::Guest("User not found".into())))?;
    
    // Update vehicle info with pricing
    let mut vehicle_info = input.vehicle_info;
    vehicle_info.price_per_km = input.price_per_km;
    vehicle_info.base_price = input.base_price;
    vehicle_info.currency = input.currency.clone();
    
    user.is_driver = true;
    user.driver_status = Some("offline".to_string());
    user.vehicle_info = Some(vehicle_info);
    
    let _user_hash = create_entry(EntryTypes::User(user.clone()))?;
    Ok(user)
}

#[derive(Serialize, Deserialize, Debug)]
pub struct UpdateDriverPricingInput {
    pub price_per_km: Option<f64>,
    pub base_price: Option<f64>,
    pub currency: Option<String>,
}

#[hdk_extern]
pub fn update_driver_pricing(input: UpdateDriverPricingInput) -> ExternResult<User> {
    let agent = agent_info()?.agent_latest_pubkey();
    let mut user = get_user_by_agent(&agent)?
        .ok_or_else(|| wasm_error!(WasmErrorInner::Guest("User not found".into())))?;
    
    if !user.is_driver {
        return Err(wasm_error!(WasmErrorInner::Guest("User is not a driver".into())));
    }
    
    if let Some(ref mut vehicle_info) = user.vehicle_info {
        if let Some(price_per_km) = input.price_per_km {
            vehicle_info.price_per_km = Some(price_per_km);
        }
        if let Some(base_price) = input.base_price {
            vehicle_info.base_price = Some(base_price);
        }
        if let Some(currency) = input.currency {
            vehicle_info.currency = currency;
        }
    } else {
        // Create vehicle info if it doesn't exist
        user.vehicle_info = Some(integrity::VehicleInfo {
            make: "".to_string(),
            model: "".to_string(),
            year: None,
            color: None,
            license_plate: None,
            capacity: 4,
            price_per_km: input.price_per_km,
            base_price: input.base_price,
            currency: input.currency.unwrap_or_else(|| "CLP".to_string()),
        });
    }
    
    let _user_hash = create_entry(EntryTypes::User(user.clone()))?;
    Ok(user)
}

#[derive(Serialize, Deserialize, Debug)]
pub struct UpdateDriverStatusInput {
    pub status: String, // "available", "busy", "offline"
    pub lat: Option<f64>,
    pub lon: Option<f64>,
}

#[hdk_extern]
pub fn update_driver_status(input: UpdateDriverStatusInput) -> ExternResult<User> {
    let agent = agent_info()?.agent_latest_pubkey();
    let mut user = get_user_by_agent(&agent)?
        .ok_or_else(|| wasm_error!(WasmErrorInner::Guest("User not found".into())))?;
    
    if !user.is_driver {
        return Err(wasm_error!(WasmErrorInner::Guest("User is not a driver".into())));
    }
    
    if input.status != "available" && input.status != "busy" && input.status != "offline" {
        return Err(wasm_error!(WasmErrorInner::Guest("Invalid driver status".into())));
    }
    
    user.driver_status = Some(input.status.clone());
    
    // Update location if provided
    if let Some(lat) = input.lat {
        user.lat = Some(lat);
    }
    if let Some(lon) = input.lon {
        user.lon = Some(lon);
    }
    
    // Update last_seen when going online
    if input.status == "available" || input.status == "busy" {
        user.last_seen = sys_time()?.as_seconds_since_epoch();
    }
    
    let _user_hash = create_entry(EntryTypes::User(user.clone()))?;
    Ok(user)
}

#[hdk_extern]
pub fn get_available_drivers(_: ()) -> ExternResult<Vec<(AgentPubKey, f64, f64)>> {
    // Get all users who are drivers and available
    // This is simplified - in production, use proper query/index
    let mut drivers = Vec::new();
    
    // For now, return empty - will need proper user index in production
    // This would query all users where is_driver = true and driver_status = "available"
    // and return their agent_id, lat, lon
    
    Ok(drivers)
}

#[hdk_extern]
pub fn get_driver_location(driver_id: AgentPubKey) -> ExternResult<Option<(f64, f64)>> {
    let user = get_user_by_agent(&driver_id)?;
    
    if let Some(u) = user {
        if u.is_driver && u.driver_status.as_ref().map(|s| s.as_str()) == Some("available") {
            if let (Some(lat), Some(lon)) = (u.lat, u.lon) {
                return Ok(Some((lat, lon)));
            }
        }
    }
    
    Ok(None)
}

#[hdk_extern]
pub fn get_all_drivers(_: ()) -> ExternResult<Vec<(AgentPubKey, String, Option<f64>, Option<f64>, Option<String>)>> {
    // Get all drivers with their status and location
    // Returns: (agent_id, status, lat, lon, vehicle_info as JSON string)
    // This is simplified - in production, use proper query/index
    let mut drivers = Vec::new();
    
    // For now, return empty - will need proper user index in production
    Ok(drivers)
}

// ========== Ride Quoting ==========

#[derive(Serialize, Deserialize, Debug)]
pub struct QuoteRideInput {
    pub pickup_lat: f64,
    pub pickup_lon: f64,
    pub dropoff_lat: f64,
    pub dropoff_lon: f64,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct RideQuote {
    pub driver_id: AgentPubKey,
    pub driver_name: String,
    pub distance_km: f64,
    pub estimated_price: f64,
    pub currency: String,
    pub vehicle_info: Option<String>, // JSON string of VehicleInfo
    pub estimated_duration_minutes: Option<u32>,
}

#[hdk_extern]
pub fn quote_ride(input: QuoteRideInput) -> ExternResult<Vec<RideQuote>> {
    // Calculate distance between pickup and dropoff
    let distance_km = calculate_distance(
        input.pickup_lat,
        input.pickup_lon,
        input.dropoff_lat,
        input.dropoff_lon,
    );
    
    // Get all available drivers
    let drivers = get_available_drivers(())?;
    let mut quotes = Vec::new();
    
    for (driver_id, driver_lat, driver_lon) in drivers {
        // Get driver info
        let user = get_user_by_agent(&driver_id)?;
        
        if let Some(driver_user) = user {
            if driver_user.is_driver && driver_user.driver_status.as_ref().map(|s| s.as_str()) == Some("available") {
                // Calculate distance from driver to pickup
                let driver_to_pickup_km = calculate_distance(
                    driver_lat,
                    driver_lon,
                    input.pickup_lat,
                    input.pickup_lon,
                );
                
                // Get vehicle info and pricing
                let mut estimated_price = 0.0;
                let mut currency = "CLP".to_string();
                let vehicle_info_json = None;
                
                if let Some(ref vehicle_info) = driver_user.vehicle_info {
                    currency = vehicle_info.currency.clone();
                    
                    // Calculate price: base_price + (distance_km * price_per_km)
                    if let Some(base) = vehicle_info.base_price {
                        estimated_price += base;
                    }
                    if let Some(price_per_km) = vehicle_info.price_per_km {
                        estimated_price += distance_km * price_per_km;
                    }
                    
                    // Serialize vehicle info to JSON string
                    if let Ok(json) = serde_json::to_string(vehicle_info) {
                        vehicle_info_json = Some(json);
                    }
                }
                
                // Estimate duration (simplified: ~30 km/h average in city)
                let estimated_duration = Some((distance_km / 30.0 * 60.0) as u32);
                
                quotes.push(RideQuote {
                    driver_id,
                    driver_name: driver_user.name,
                    distance_km,
                    estimated_price,
                    currency,
                    vehicle_info: vehicle_info_json,
                    estimated_duration_minutes: estimated_duration,
                });
            }
        }
    }
    
    // Sort by price (lowest first)
    quotes.sort_by(|a, b| a.estimated_price.partial_cmp(&b.estimated_price).unwrap_or(std::cmp::Ordering::Equal));
    
    Ok(quotes)
}

// Calculate distance between two points using Haversine formula (in kilometers)
fn calculate_distance(lat1: f64, lon1: f64, lat2: f64, lon2: f64) -> f64 {
    const EARTH_RADIUS_KM: f64 = 6371.0;
    
    let d_lat = (lat2 - lat1).to_radians();
    let d_lon = (lon2 - lon1).to_radians();
    
    let a = (d_lat / 2.0).sin() * (d_lat / 2.0).sin() +
            lat1.to_radians().cos() * lat2.to_radians().cos() *
            (d_lon / 2.0).sin() * (d_lon / 2.0).sin();
    
    let c = 2.0 * a.sqrt().atan2((1.0 - a).sqrt());
    
    EARTH_RADIUS_KM * c
}

// ========== Wish System ==========

#[derive(Serialize, Deserialize, Debug)]
pub struct CreateWishInput {
    pub text: String,
    pub image_hash: Option<String>,
    pub video_hash: Option<String>,
}

#[hdk_extern]
pub fn create_wish(input: CreateWishInput) -> ExternResult<EntryHash> {
    let author_id = agent_info()?.agent_latest_pubkey();
    
    let wish = Wish {
        author_id,
        text: input.text,
        image_hash: input.image_hash,
        video_hash: input.video_hash,
        fulfilled: false,
        created_at: sys_time()?.as_seconds_since_epoch(),
    };
    
    let wish_hash = create_entry(EntryTypes::Wish(wish.clone()))?;
    
    // Link user to wish
    create_link(
        author_id,
        wish_hash,
        LinkTypes::UserToWishes,
        (),
    )?;
    
    Ok(wish_hash)
}

#[hdk_extern]
pub fn get_wishes(_: ()) -> ExternResult<Vec<Wish>> {
    // Get all wishes (simplified - in production, use proper query/index)
    // For now, return empty - will need proper wish index in production
    let mut wishes = Vec::new();
    Ok(wishes)
}

#[hdk_extern]
pub fn get_user_wishes(user_id: AgentPubKey) -> ExternResult<Vec<Wish>> {
    let links = get_links(user_id, LinkTypes::UserToWishes, None)?;
    let mut wishes = Vec::new();
    
    for link in links {
        let entry_hash = link.target;
        let element = get(entry_hash, GetOptions::default())?
            .ok_or_else(|| wasm_error!(WasmErrorInner::Guest("Wish not found".into())))?;
        
        if let Some(Entry::App(entry_bytes)) = element.entry() {
            let wish: Wish = entry_bytes.try_into()?;
            wishes.push(wish);
        }
    }
    
    // Sort by created_at desc
    wishes.sort_by_key(|w| std::cmp::Reverse(w.created_at));
    Ok(wishes)
}

#[derive(Serialize, Deserialize, Debug)]
pub struct HelpWishInput {
    pub wish_id: EntryHash,
    pub message: Option<String>,
}

#[hdk_extern]
pub fn help_wish(input: HelpWishInput) -> ExternResult<EntryHash> {
    let helper_id = agent_info()?.agent_latest_pubkey();
    
    // Verify wish exists
    let element = get(input.wish_id.clone(), GetOptions::default())?
        .ok_or_else(|| wasm_error!(WasmErrorInner::Guest("Wish not found".into())))?;
    
    let wish: Wish = element.entry()
        .to_app_option()?
        .ok_or_else(|| wasm_error!(WasmErrorInner::Guest("Wish entry not found".into())))?;
    
    if wish.fulfilled {
        return Err(wasm_error!(WasmErrorInner::Guest("Wish already fulfilled".into())));
    }
    
    // Check if already helping
    let existing_links = get_links(input.wish_id.clone(), LinkTypes::WishToHelpers, None)?;
    for link in existing_links {
        let element = get(link.target, GetOptions::default())?;
        if let Some(element) = element {
            if let Some(Entry::App(entry_bytes)) = element.entry() {
                if let Ok(help_entry) = entry_bytes.try_into::<WishHelp>() {
                    if help_entry.helper_id == helper_id && (help_entry.status == "pending" || help_entry.status == "accepted") {
                        return Err(wasm_error!(WasmErrorInner::Guest("Already helping this wish".into())));
                    }
                }
            }
        }
    }
    
    let wish_help = WishHelp {
        wish_id: input.wish_id.clone(),
        helper_id,
        message: input.message,
        status: "pending".to_string(),
        created_at: sys_time()?.as_seconds_since_epoch(),
    };
    
    let help_hash = create_entry(EntryTypes::WishHelp(wish_help.clone()))?;
    
    // Link wish to helper
    create_link(
        input.wish_id,
        help_hash,
        LinkTypes::WishToHelpers,
        (),
    )?;
    
    Ok(help_hash)
}

#[hdk_extern]
pub fn get_wish_helpers(wish_id: EntryHash) -> ExternResult<Vec<WishHelp>> {
    let links = get_links(wish_id, LinkTypes::WishToHelpers, None)?;
    let mut helpers = Vec::new();
    
    for link in links {
        let entry_hash = link.target;
        let element = get(entry_hash, GetOptions::default())?
            .ok_or_else(|| wasm_error!(WasmErrorInner::Guest("WishHelp not found".into())))?;
        
        if let Some(Entry::App(entry_bytes)) = element.entry() {
            let help: WishHelp = entry_bytes.try_into()?;
            helpers.push(help);
        }
    }
    
    helpers.sort_by_key(|h| std::cmp::Reverse(h.created_at));
    Ok(helpers)
}

#[hdk_extern]
pub fn mark_wish_fulfilled(wish_id: EntryHash) -> ExternResult<Wish> {
    let agent = agent_info()?.agent_latest_pubkey();
    
    let element = get(wish_id.clone(), GetOptions::default())?
        .ok_or_else(|| wasm_error!(WasmErrorInner::Guest("Wish not found".into())))?;
    
    let mut wish: Wish = element.entry()
        .to_app_option()?
        .ok_or_else(|| wasm_error!(WasmErrorInner::Guest("Wish entry not found".into())))?;
    
    if wish.author_id != agent {
        return Err(wasm_error!(WasmErrorInner::Guest("Only wish author can mark as fulfilled".into())));
    }
    
    wish.fulfilled = true;
    let _updated_hash = create_entry(EntryTypes::Wish(wish.clone()))?;
    
    Ok(wish)
}

// ========== Tamagochi Visits ==========

#[derive(Serialize, Deserialize, Debug)]
pub struct VisitTamagochiInput {
    pub owner_id: AgentPubKey,
    pub message: Option<String>,
}

#[hdk_extern]
pub fn visit_tamagochi(input: VisitTamagochiInput) -> ExternResult<EntryHash> {
    let visitor_id = agent_info()?.agent_latest_pubkey();
    
    // Verify owner has tamagochi
    let owner_tamagochi = get_tamagochi_for_user_internal(input.owner_id.clone())?;
    if owner_tamagochi.is_none() {
        return Err(wasm_error!(WasmErrorInner::Guest("User doesn't have a tamagochi".into())));
    }
    
    let visit = TamagochiVisit {
        visitor_id,
        tamagochi_owner_id: input.owner_id.clone(),
        message: input.message,
        visited_at: sys_time()?.as_seconds_since_epoch(),
    };
    
    let visit_hash = create_entry(EntryTypes::TamagochiVisit(visit.clone()))?;
    
    // Link visitor to visit
    create_link(
        visitor_id,
        visit_hash,
        LinkTypes::UserToTamagochiVisits,
        (),
    )?;
    
    // Link tamagochi owner to visit
    create_link(
        input.owner_id,
        visit_hash,
        LinkTypes::TamagochiToVisits,
        (),
    )?;
    
    Ok(visit_hash)
}

#[hdk_extern]
pub fn get_tamagochi_visits(owner_id: AgentPubKey) -> ExternResult<Vec<TamagochiVisit>> {
    let links = get_links(owner_id, LinkTypes::TamagochiToVisits, None)?;
    let mut visits = Vec::new();
    
    for link in links {
        let entry_hash = link.target;
        let element = get(entry_hash, GetOptions::default())?
            .ok_or_else(|| wasm_error!(WasmErrorInner::Guest("Visit not found".into())))?;
        
        if let Some(Entry::App(entry_bytes)) = element.entry() {
            let visit: TamagochiVisit = entry_bytes.try_into()?;
            visits.push(visit);
        }
    }
    
    visits.sort_by_key(|v| std::cmp::Reverse(v.visited_at));
    Ok(visits)
}

#[hdk_extern]
pub fn get_tamagochi_for_user(user_id: AgentPubKey) -> ExternResult<Option<Tamagochi>> {
    let links = get_links(user_id, LinkTypes::UserToTamagochi, None)?;
    for link in links {
        let entry_hash = link.target;
        let element = get(entry_hash, GetOptions::default())?;
        if let Some(element) = element {
            if let Some(Entry::App(entry_bytes)) = element.entry() {
                if let Ok(tamagochi) = entry_bytes.try_into::<Tamagochi>() {
                    return Ok(Some(tamagochi));
                }
            }
        }
    }
    Ok(None)
}

fn get_tamagochi_for_user_internal(user_id: AgentPubKey) -> ExternResult<Option<Tamagochi>> {
    get_tamagochi_for_user(user_id)
}

// ========== Profile Cover ==========

#[derive(Serialize, Deserialize, Debug)]
pub struct SetProfileCoverInput {
    pub cover_type: String, // "tamagochi", "image", "video"
    pub image_hash: Option<String>,
    pub video_hash: Option<String>,
}

#[hdk_extern]
pub fn set_profile_cover(input: SetProfileCoverInput) -> ExternResult<EntryHash> {
    let owner_id = agent_info()?.agent_latest_pubkey();
    
    // Delete old cover if exists
    let old_links = get_links(owner_id, LinkTypes::UserToProfileCover, None)?;
    for link in old_links {
        delete_link(link.create_link_hash)?;
    }
    
    let cover = ProfileCover {
        owner_id,
        cover_type: input.cover_type,
        image_hash: input.image_hash,
        video_hash: input.video_hash,
        updated_at: sys_time()?.as_seconds_since_epoch(),
    };
    
    let cover_hash = create_entry(EntryTypes::ProfileCover(cover.clone()))?;
    
    // Link user to cover
    create_link(
        owner_id,
        cover_hash,
        LinkTypes::UserToProfileCover,
        (),
    )?;
    
    Ok(cover_hash)
}

#[hdk_extern]
pub fn get_profile_cover(user_id: AgentPubKey) -> ExternResult<Option<ProfileCover>> {
    let links = get_links(user_id, LinkTypes::UserToProfileCover, None)?;
    for link in links {
        let entry_hash = link.target;
        let element = get(entry_hash, GetOptions::default())?;
        if let Some(element) = element {
            if let Some(Entry::App(entry_bytes)) = element.entry() {
                if let Ok(cover) = entry_bytes.try_into::<ProfileCover>() {
                    return Ok(Some(cover));
                }
            }
        }
    }
    Ok(None)
}

// ========== Helper Functions ==========

fn hash_email(email: &str) -> ExternResult<String> {
    use sha2::{Sha256, Digest};
    let mut hasher = Sha256::new();
    hasher.update(email.as_bytes());
    Ok(hex::encode(hasher.finalize()))
}

fn hash_password(password: &str) -> ExternResult<String> {
    bcrypt::hash(password, bcrypt::DEFAULT_COST)
        .map_err(|e| wasm_error!(WasmErrorInner::Guest(format!("Password hashing failed: {}", e))))
}

fn verify_password(password: &str, hash: &str) -> bool {
    bcrypt::verify(password, hash).unwrap_or(false)
}

fn validate_rut(rut: &str) -> bool {
    let clean = rut.replace(".", "").replace("-", "").to_uppercase();
    if !regex::Regex::new(r"^\d{7,8}[0-9K]$").unwrap().is_match(&clean) {
        return false;
    }
    
    let body = &clean[..clean.len() - 1];
    let dv = &clean[clean.len() - 1..];
    
    let mut sum = 0;
    let mut multiplier = 2;
    for ch in body.chars().rev() {
        sum += ch.to_digit(10).unwrap() as i32 * multiplier;
        multiplier = if multiplier == 7 { 2 } else { multiplier + 1 };
    }
    
    let remainder = 11 - (sum % 11);
    let expected = match remainder {
        11 => "0",
        10 => "K",
        _ => &remainder.to_string(),
    };
    
    dv == expected
}

fn generate_reset_token() -> String {
    use sha2::{Sha256, Digest};
    let mut hasher = Sha256::new();
    hasher.update(format!("{}{}", sys_time().unwrap().as_seconds_since_epoch(), rand::random::<u64>()).as_bytes());
    hex::encode(&hasher.finalize()[..16])
}

fn calculate_image_hash(bytes: &[u8]) -> String {
    use sha2::{Sha256, Digest};
    let mut hasher = Sha256::new();
    hasher.update(bytes);
    hex::encode(hasher.finalize())
}

fn format_chat_id(a: &AgentPubKey, b: &AgentPubKey) -> String {
    let mut ids = vec![a.to_string(), b.to_string()];
    ids.sort();
    format!("chat_{}_{}", ids[0], ids[1])
}

fn get_user_by_email(email: &str) -> ExternResult<Option<User>> {
    let email_hash = hash_email(email)?;
    let tag = LinkTag::new(email_hash.as_bytes().to_vec());
    
    let links = get_links(
        agent_info()?.agent_latest_pubkey(),
        LinkTypes::UserToProfileImage,
        Some(tag),
    )?;
    
    // This is simplified - in production, need proper email index
    Ok(None)
}

fn get_user_by_agent(agent: &AgentPubKey) -> ExternResult<Option<User>> {
    // Get user entry for agent
    // Simplified - in production, need proper agent-to-user mapping
    Ok(None)
}

fn get_image_by_hash(hash: &str) -> ExternResult<Option<Image>> {
    // Query for image by hash
    // Simplified - in production, need proper hash index
    Ok(None)
}

fn get_reset_token(email: &str, token: &str) -> ExternResult<Option<PasswordResetToken>> {
    // Query for reset token
    // Simplified - in production, need proper token index
    Ok(None)
}

fn sys_time() -> ExternResult<Timestamp> {
    hdk::prelude::sys_time()
}
