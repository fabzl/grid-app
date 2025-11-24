use hdi::prelude::*;
use serde::{Serialize, Deserialize};

#[hdk_entry_defs]
#[unit_enum(UnitEntryTypes)]
pub enum EntryTypes {
    #[entry_def(required_validations = 5, visibility = "public")]
    User(User),
    #[entry_def(required_validations = 5, visibility = "public")]
    Product(Product),
    #[entry_def(required_validations = 5, visibility = "public")]
    Service(Service),
    #[entry_def(required_validations = 5, visibility = "public")]
    Message(Message),
    #[entry_def(required_validations = 5, visibility = "public")]
    Image(Image),
    #[entry_def(required_validations = 5, visibility = "public")]
    PasswordResetToken(PasswordResetToken),
    #[entry_def(required_validations = 5, visibility = "public")]
    Post(Post),
    #[entry_def(required_validations = 5, visibility = "public")]
    PostClap(PostClap),
    #[entry_def(required_validations = 5, visibility = "public")]
    PostLike(PostLike),
    #[entry_def(required_validations = 5, visibility = "public")]
    PostComment(PostComment),
    #[entry_def(required_validations = 5, visibility = "public")]
    PostReport(PostReport),
    #[entry_def(required_validations = 5, visibility = "public")]
    UserBlock(UserBlock),
    #[entry_def(required_validations = 5, visibility = "public")]
    Tamagochi(Tamagochi),
    #[entry_def(required_validations = 5, visibility = "public")]
    TamagochiDeath(TamagochiDeath),
    #[entry_def(required_validations = 5, visibility = "public")]
    UserPreferences(UserPreferences),
    #[entry_def(required_validations = 5, visibility = "public")]
    Booking(Booking),
    #[entry_def(required_validations = 5, visibility = "public")]
    RideRequest(RideRequest),
    #[entry_def(required_validations = 5, visibility = "public")]
    Review(Review),
    #[entry_def(required_validations = 5, visibility = "public")]
    ProductComment(ProductComment),
    #[entry_def(required_validations = 5, visibility = "public")]
    AdBanner(AdBanner),
    #[entry_def(required_validations = 5, visibility = "public")]
    Wish(Wish),
    #[entry_def(required_validations = 5, visibility = "public")]
    WishHelp(WishHelp),
    #[entry_def(required_validations = 5, visibility = "public")]
    TamagochiVisit(TamagochiVisit),
    #[entry_def(required_validations = 5, visibility = "public")]
    ProfileCover(ProfileCover),
}

#[hdk_link_types]
pub enum LinkTypes {
    UserToProfileImage,
    UserToIdCardImage,
    UserToProducts,
    UserToServices,
    UserToMessages,
    ProductToImages,
    ServiceToImages,
    MessageToImage,
    Chat,
    UserToPosts,
    Feed,
    PostToClaps,
    PostToLikes,
    PostToComments,
    CommentToReplies,
    PostToReports,
    UserToBlocks,
    UserToTamagochi,
    UserToDeaths,
    UserToFriends,
    ProductToBookings,
    ServiceToBookings,
    ServiceToRides,
    UserToReviews,
    ProductToReviews,
    ServiceToReviews,
    ProductToComments,
    CommentToReplies,
    Banner,
    UserToWishes,
    WishToHelpers,
    WishToImages,
    UserToTamagochiVisits,
    TamagochiToVisits,
    UserToProfileCover,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(tag = "type")]
pub enum UnitEntryTypes {
    #[serde(rename = "user")]
    User,
    #[serde(rename = "product")]
    Product,
    #[serde(rename = "service")]
    Service,
    #[serde(rename = "message")]
    Message,
    #[serde(rename = "image")]
    Image,
    #[serde(rename = "password_reset_token")]
    PasswordResetToken,
    #[serde(rename = "post")]
    Post,
    #[serde(rename = "post_clap")]
    PostClap,
    #[serde(rename = "post_like")]
    PostLike,
    #[serde(rename = "post_comment")]
    PostComment,
    #[serde(rename = "post_report")]
    PostReport,
    #[serde(rename = "user_block")]
    UserBlock,
    #[serde(rename = "tamagochi")]
    Tamagochi,
    #[serde(rename = "tamagochi_death")]
    TamagochiDeath,
    #[serde(rename = "user_preferences")]
    UserPreferences,
    #[serde(rename = "booking")]
    Booking,
    #[serde(rename = "ride_request")]
    RideRequest,
    #[serde(rename = "review")]
    Review,
    #[serde(rename = "product_comment")]
    ProductComment,
    #[serde(rename = "ad_banner")]
    AdBanner,
    #[serde(rename = "wish")]
    Wish,
    #[serde(rename = "wish_help")]
    WishHelp,
    #[serde(rename = "tamagochi_visit")]
    TamagochiVisit,
    #[serde(rename = "profile_cover")]
    ProfileCover,
}

#[derive(Serialize, Deserialize, Debug, Clone, EntryDefRegistration)]
pub struct User {
    pub email: String,
    pub password_hash: String,
    pub name: String,
    pub rut: Option<String>,
    pub profile_image_hash: Option<String>,
    pub id_card_image_hash: Option<String>,
    pub is_verified: bool,
    pub lat: Option<f64>,
    pub lon: Option<f64>,
    pub created_at: i64,
    pub ghost_mode: bool, // Si está en modo ghost, no aparece como conectado
    pub last_seen: i64, // Última vez que se vio activo
    pub is_driver: bool, // Si es conductor
    pub driver_status: Option<String>, // "available", "busy", "offline"
    pub vehicle_info: Option<VehicleInfo>, // Información del vehículo
}

#[derive(Serialize, Deserialize, Debug, Clone, EntryDefRegistration)]
pub struct Product {
    pub seller_id: AgentPubKey,
    pub title: String,
    pub description: String,
    pub price: f64,
    pub currency: String,
    pub image_hashes: Vec<String>,
    pub lat: Option<f64>,
    pub lon: Option<f64>,
    pub created_at: i64,
    pub sold: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone, EntryDefRegistration)]
pub struct Service {
    pub provider_id: AgentPubKey,
    pub service_type: String, // "taxi" | "delivery" | "room_rental" | "accommodation" | "professional" | "other"
    pub title: String,
    pub description: String,
    pub price_per_km: Option<f64>,
    pub base_price: Option<f64>,
    pub price_per_night: Option<f64>,
    pub price_per_hour: Option<f64>,
    pub currency: String,
    pub image_hashes: Vec<String>,
    pub video_hashes: Vec<String>, // Videos para alojamientos
    pub lat: Option<f64>,
    pub lon: Option<f64>,
    pub available: bool,
    pub created_at: i64,
    pub room_capacity: Option<u32>,
    pub amenities: Vec<String>,
    pub professional_category: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone, EntryDefRegistration)]
pub struct Message {
    pub sender_id: AgentPubKey,
    pub receiver_id: AgentPubKey,
    pub chat_id: String,
    pub text: Option<String>,
    pub image_hash: Option<String>,
    pub video_hash: Option<String>,
    pub timestamp: i64,
    pub read: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone, EntryDefRegistration)]
pub struct Image {
    pub hash: String,
    pub bytes: Vec<u8>,
    pub mime_type: String,
    pub created_at: i64,
}

#[derive(Serialize, Deserialize, Debug, Clone, EntryDefRegistration)]
pub struct PasswordResetToken {
    pub email: String,
    pub token: String,
    pub expires_at: i64,
    pub used: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone, EntryDefRegistration)]
pub struct Post {
    pub author_id: AgentPubKey,
    pub text: Option<String>,
    pub image_hashes: Vec<String>,
    pub video_hash: Option<String>,
    pub sticker_data: Vec<StickerData>, // Stickers sobre la imagen/video
    pub created_at: i64,
    pub location: Option<PostLocation>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct StickerData {
    pub sticker_type: String, // "emoji", "image", "text"
    pub content: String, // Emoji, URL de imagen, o texto
    pub x: f64, // Posición X (0-1)
    pub y: f64, // Posición Y (0-1)
    pub scale: f64, // Escala del sticker
    pub rotation: f64, // Rotación en grados
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PostLocation {
    pub lat: f64,
    pub lon: f64,
    pub address: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone, EntryDefRegistration)]
pub struct PostReport {
    pub post_hash: EntryHash,
    pub reporter_id: AgentPubKey,
    pub reason: String, // "spam", "inappropriate", "violence", "harassment", "other"
    pub description: Option<String>,
    pub created_at: i64,
}

#[derive(Serialize, Deserialize, Debug, Clone, EntryDefRegistration)]
pub struct UserBlock {
    pub blocker_id: AgentPubKey,
    pub blocked_id: AgentPubKey,
    pub created_at: i64,
}

#[derive(Serialize, Deserialize, Debug, Clone, EntryDefRegistration)]
pub struct Tamagochi {
    pub owner_id: AgentPubKey,
    pub name: String,
    pub stage: String, // "egg", "baby", "child", "teen", "adult"
    pub energy: u32, // 0-100
    pub hunger: u32, // 0-100 (100 = full, 0 = starving)
    pub hygiene: u32, // 0-100 (100 = clean, 0 = dirty)
    pub happiness: u32, // 0-100
    pub experience: u32,
    pub level: u32,
    pub born_at: i64,
    pub last_fed_at: i64,
    pub last_cleaned_at: i64,
    pub last_played_at: i64,
    pub is_alive: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone, EntryDefRegistration)]
pub struct TamagochiDeath {
    pub owner_id: AgentPubKey,
    pub tamagochi_name: String,
    pub death_reason: String, // "starvation", "neglect", "old_age", "killed"
    pub died_at: i64,
    pub age_seconds: i64,
}

#[derive(Serialize, Deserialize, Debug, Clone, EntryDefRegistration)]
pub struct UserPreferences {
    pub owner_id: AgentPubKey,
    pub app_color: String, // Color principal de la app (hex)
    pub tamagochi_enabled: bool,
    pub location_sharing_enabled: bool, // Si permite que otros vean su ubicación
    pub updated_at: i64,
}

#[derive(Serialize, Deserialize, Debug, Clone, EntryDefRegistration)]
pub struct Booking {
    pub booker_id: AgentPubKey,
    pub service_id: EntryHash, // Service or Product entry hash
    pub booking_type: String, // "product", "room_rental", "professional"
    pub start_date: Option<i64>, // For room rentals
    pub end_date: Option<i64>, // For room rentals
    pub status: String, // "pending", "confirmed", "completed", "cancelled"
    pub total_price: f64,
    pub currency: String,
    pub created_at: i64,
    pub notes: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone, EntryDefRegistration)]
pub struct RideRequest {
    pub requester_id: AgentPubKey,
    pub driver_id: Option<AgentPubKey>, // Assigned driver
    pub pickup_lat: f64,
    pub pickup_lon: f64,
    pub pickup_address: Option<String>,
    pub dropoff_lat: f64,
    pub dropoff_lon: f64,
    pub dropoff_address: Option<String>,
    pub status: String, // "requested", "accepted", "in_progress", "completed", "cancelled"
    pub estimated_price: Option<f64>,
    pub final_price: Option<f64>,
    pub currency: String,
    pub created_at: i64,
    pub started_at: Option<i64>,
    pub completed_at: Option<i64>,
}

#[derive(Serialize, Deserialize, Debug, Clone, EntryDefRegistration)]
pub struct Review {
    pub reviewer_id: AgentPubKey,
    pub reviewee_id: AgentPubKey, // User being reviewed
    pub target_type: String, // "user", "product", "service"
    pub target_id: Option<EntryHash>, // Product or Service entry hash if applicable
    pub rating: u8, // 1-5 stars
    pub comment: Option<String>,
    pub created_at: i64,
}

#[derive(Serialize, Deserialize, Debug, Clone, EntryDefRegistration)]
pub struct ProductComment {
    pub product_id: EntryHash,
    pub author_id: AgentPubKey,
    pub text: String,
    pub parent_comment_hash: Option<EntryHash>, // For replies
    pub created_at: i64,
}

#[derive(Serialize, Deserialize, Debug, Clone, EntryDefRegistration)]
pub struct AdBanner {
    pub advertiser_id: AgentPubKey, // User/company paying for the ad
    pub title: String,
    pub image_hash: Option<String>,
    pub link_url: Option<String>,
    pub active: bool,
    pub start_date: i64,
    pub end_date: i64,
    pub impressions: u32, // Number of times shown
    pub clicks: u32, // Number of times clicked
    pub created_at: i64,
}

#[derive(Serialize, Deserialize, Debug, Clone, EntryDefRegistration)]
pub struct Wish {
    pub author_id: AgentPubKey,
    pub text: String,
    pub image_hash: Option<String>,
    pub video_hash: Option<String>,
    pub fulfilled: bool, // Si el deseo ya fue cumplido
    pub created_at: i64,
}

#[derive(Serialize, Deserialize, Debug, Clone, EntryDefRegistration)]
pub struct WishHelp {
    pub wish_id: EntryHash,
    pub helper_id: AgentPubKey, // Usuario que quiere ayudar
    pub message: Option<String>, // Mensaje opcional del ayudante
    pub status: String, // "pending", "accepted", "completed", "cancelled"
    pub created_at: i64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct VehicleInfo {
    pub make: String, // Marca del vehículo
    pub model: String, // Modelo
    pub year: Option<u32>, // Año
    pub color: Option<String>, // Color
    pub license_plate: Option<String>, // Patente
    pub capacity: u32, // Capacidad de pasajeros
    pub price_per_km: Option<f64>, // Tarifa por kilómetro
    pub base_price: Option<f64>, // Tarifa base
    pub currency: String, // Moneda (ej: "CLP", "USD")
}

