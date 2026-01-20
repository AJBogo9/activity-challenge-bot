variable "bot_token" {
  description = "Telegram Bot Token"
  type        = string
  default     = "123456789:ABCdefGHIjklMNOpqrsTUVwxyz" # Dummy token
}

variable "postgres_user" {
  description = "Postgres User"
  type        = string
  default     = "postgres"
}

variable "postgres_password" {
  description = "Postgres Password"
  type        = string
  default     = "postgres"
}

variable "postgres_db" {
  description = "Postgres Database"
  type        = string
  default     = "activity_challenge_bot"
}

variable "competition_start_date" {
  description = "Competition Start Date"
  type        = string
  default     = "2024-01-01T00:00:00Z"
}

variable "competition_end_date" {
  description = "Competition End Date"
  type        = string
  default     = "2025-12-31T23:59:59Z"
}

variable "webapp_url" {
  description = "Mini App URL"
  type        = string
  default     = "http://localhost:3001"
}

variable "bot_image" {
  description = "Docker image for the bot"
  type        = string
  default     = "localhost:5000/activity-challenge-bot:local"
}
