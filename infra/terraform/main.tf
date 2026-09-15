terraform {
  required_version = ">= 1.9"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Remote state in S3 — bootstrap this bucket manually once before running
  # `terraform init`.  See README for one-time setup instructions.
  backend "s3" {
    bucket         = "kindred-terraform-state"
    key            = "kindred/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "kindred-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "kindred"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# Data sources used across modules
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}
