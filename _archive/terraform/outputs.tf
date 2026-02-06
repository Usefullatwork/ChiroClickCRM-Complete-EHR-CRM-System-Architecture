# ============================================================================
# ChiroClickCRM - Terraform Outputs
# ============================================================================

# ============================================================================
# NETWORKING
# ============================================================================

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.vpc.private_subnets
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.vpc.public_subnets
}

# ============================================================================
# DATABASE
# ============================================================================

output "database_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = aws_db_instance.postgres.endpoint
  sensitive   = true
}

output "database_port" {
  description = "RDS PostgreSQL port"
  value       = aws_db_instance.postgres.port
}

output "database_name" {
  description = "Database name"
  value       = aws_db_instance.postgres.db_name
}

output "database_credentials_secret_arn" {
  description = "ARN of the database credentials secret"
  value       = aws_secretsmanager_secret.db_credentials.arn
}

# ============================================================================
# REDIS
# ============================================================================

output "redis_endpoint" {
  description = "ElastiCache Redis endpoint"
  value       = aws_elasticache_cluster.redis.cache_nodes[0].address
}

output "redis_port" {
  description = "ElastiCache Redis port"
  value       = aws_elasticache_cluster.redis.port
}

# ============================================================================
# S3
# ============================================================================

output "documents_bucket_name" {
  description = "S3 bucket name for documents"
  value       = aws_s3_bucket.documents.id
}

output "documents_bucket_arn" {
  description = "S3 bucket ARN for documents"
  value       = aws_s3_bucket.documents.arn
}

# ============================================================================
# ECR
# ============================================================================

output "ecr_repository_url" {
  description = "ECR repository URL for backend"
  value       = aws_ecr_repository.backend.repository_url
}

# ============================================================================
# ECS
# ============================================================================

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "ecs_cluster_arn" {
  description = "ECS cluster ARN"
  value       = aws_ecs_cluster.main.arn
}

# ============================================================================
# SECRETS
# ============================================================================

output "app_secrets_arn" {
  description = "ARN of the application secrets"
  value       = aws_secretsmanager_secret.app_secrets.arn
}

# ============================================================================
# SECURITY GROUPS
# ============================================================================

output "alb_security_group_id" {
  description = "ALB security group ID"
  value       = aws_security_group.alb.id
}

output "backend_security_group_id" {
  description = "Backend security group ID"
  value       = aws_security_group.backend.id
}

output "database_security_group_id" {
  description = "Database security group ID"
  value       = aws_security_group.database.id
}

output "redis_security_group_id" {
  description = "Redis security group ID"
  value       = aws_security_group.redis.id
}

# ============================================================================
# CONNECTION STRINGS (for local development reference)
# ============================================================================

output "local_dev_connection_hint" {
  description = "Hint for local development"
  value       = <<-EOT
    For local development, use docker-compose.yml instead of these AWS resources.

    To connect to AWS resources from local machine (if needed):
    - Set up AWS SSM Session Manager or bastion host
    - Use the secrets from AWS Secrets Manager

    Database credentials are stored in: ${aws_secretsmanager_secret.db_credentials.name}
    Application secrets are stored in: ${aws_secretsmanager_secret.app_secrets.name}
  EOT
}
