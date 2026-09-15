# ── RDS PostgreSQL with pgvector ───────────────────────────────────────────────
# Uses the pgvector-enabled parameter group and the db subnet group created here.
# Multi-AZ is disabled by default to save cost — enable for production.

resource "aws_db_subnet_group" "main" {
  name        = "${var.project}-db-subnet-group"
  description = "DB subnets for ${var.project}"
  subnet_ids  = aws_subnet.db[*].id
}

# Custom parameter group that enables the pgvector extension on startup.
resource "aws_db_parameter_group" "postgres16" {
  name        = "${var.project}-pg16"
  family      = "postgres16"
  description = "Kindred Postgres 16 — pgvector enabled"

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }
}

resource "aws_db_instance" "main" {
  identifier        = "${var.project}-db"
  engine            = "postgres"
  engine_version    = "16.3"
  instance_class    = var.db_instance_class
  allocated_storage = 20
  storage_type      = "gp3"
  storage_encrypted = true

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  parameter_group_name   = aws_db_parameter_group.postgres16.name

  # pgvector is available in RDS for PostgreSQL 15+.
  # Run `CREATE EXTENSION IF NOT EXISTS vector;` once after provisioning
  # (Prisma migration 20260821000000_add_pgvector_embedding handles this).
  deletion_protection = var.environment == "production"
  skip_final_snapshot = var.environment != "production"
  multi_az            = var.environment == "production"

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:00-sun:05:00"

  tags = { Name = "${var.project}-db" }
}
