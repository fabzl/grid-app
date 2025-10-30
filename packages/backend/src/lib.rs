use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
pub struct HelloGrip {
    pub message: String,
}

pub fn hello() -> HelloGrip {
    HelloGrip {
        message: "Welcome to Grip Holochain skeleton".to_string(),
    }
}


