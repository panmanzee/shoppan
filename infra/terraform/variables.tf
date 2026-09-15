variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment (staging | production)"
  type        = string
  default     = "production"

  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "environment must be staging or production"
  }
}

variable "project" {
  description = "Project name used as a prefix for all resource names"
  type        = string
  default     = "kindred"
}

# --- Networking ---

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

# --- Database ---

variable "db_instance_class" {
  description = "RDS instance size"
  type        = string
  default     = "db.t4g.micro" # ~$13/mo; scale up for production
}

variable "db_name" {
  description = "Postgres database name"
  type        = string
  default     = "kindred"
}

variable "db_username" {
  description = "Postgres master username"
  type        = string
  default     = "kindred"
  sensitive   = true
}

variable "db_password" {
  description = "Postgres master password — set via TF_VAR_db_password env var, never hardcode"
  type        = string
  sensitive   = true
}

# --- ECS ---

variable "api_image" {
  description = "Docker image for the API service (ECR URI with tag)"
  type        = string
  # Example: 123456789012.dkr.ecr.us-east-1.amazonaws.com/kindred-api:latest
}

variable "web_image" {
  description = "Docker image for the web service (ECR URI with tag)"
  type        = string
}

variable "api_cpu" {
  description = "Fargate CPU units for the API task (256 = 0.25 vCPU)"
  type        = number
  default     = 512
}

variable "api_memory" {
  description = "Fargate memory (MiB) for the API task"
  type        = number
  default     = 1024
}

variable "web_cpu" {
  description = "Fargate CPU units for the web task"
  type        = number
  default     = 512
}

variable "web_memory" {
  description = "Fargate memory (MiB) for the web task"
  type        = number
  default     = 1024
}

variable "api_desired_count" {
  description = "Desired number of API task replicas"
  type        = number
  default     = 2
}

variable "web_desired_count" {
  description = "Desired number of web task replicas"
  type        = number
  default     = 2
}

# --- Secrets (passed to ECS task env) ---

variable "jwt_secret" {
  description = "JWT signing secret"
  type        = string
  sensitive   = true
}

variable "stripe_secret_key" {
  description = "Stripe secret API key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "stripe_webhook_secret" {
  description = "Stripe webhook signing secret"
  type        = string
  sensitive   = true
  default     = ""
}

variable "openai_api_key" {
  description = "OpenAI API key for embeddings"
  type        = string
  sensitive   = true
  default     = ""
}
