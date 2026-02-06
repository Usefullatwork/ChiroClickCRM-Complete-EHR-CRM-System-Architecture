# ChiroClickCRM - Terraform Infrastructure

## Overview

This directory contains Terraform configurations for deploying ChiroClickCRM to AWS.

**IMPORTANT**: This is OPTIONAL. For local development and self-hosted installations, use `docker-compose.yml` in the root directory.

## When to Use Terraform

Use these Terraform configurations when:

- Deploying to AWS for production/staging
- Need managed database (RDS) with automatic backups
- Require high availability across multiple AZs
- Want auto-scaling capabilities
- Need professional monitoring and logging

## Local Development (Recommended)

For local development, simply use Docker Compose:

```bash
# From project root
docker-compose up -d
```

This gives you:

- PostgreSQL database
- Redis cache
- Ollama (local AI)
- MinIO (S3-compatible storage)
- All services preconfigured

## AWS Deployment

### Prerequisites

1. AWS CLI configured with appropriate credentials
2. Terraform >= 1.0.0 installed
3. S3 bucket for Terraform state (optional but recommended)

### Quick Start

```bash
# Navigate to terraform directory
cd terraform

# Initialize Terraform
terraform init

# Choose environment (dev or prod)
terraform workspace new dev  # or prod

# Plan the deployment
terraform plan -var-file="environments/dev/terraform.tfvars"

# Apply the configuration
terraform apply -var-file="environments/dev/terraform.tfvars"
```

### Environment-Specific Deployment

#### Development

```bash
terraform plan -var-file="environments/dev/terraform.tfvars"
terraform apply -var-file="environments/dev/terraform.tfvars"
```

#### Production

```bash
terraform plan -var-file="environments/prod/terraform.tfvars"
terraform apply -var-file="environments/prod/terraform.tfvars"
```

## Resources Created

| Resource          | Description                                                |
| ----------------- | ---------------------------------------------------------- |
| VPC               | Private network with public, private, and database subnets |
| RDS PostgreSQL    | Managed PostgreSQL 15 with RLS support                     |
| ElastiCache Redis | Managed Redis for caching and sessions                     |
| S3 Bucket         | Document storage with encryption and versioning            |
| ECR Repository    | Container registry for backend images                      |
| ECS Cluster       | Fargate cluster for running containers                     |
| Secrets Manager   | Secure storage for database credentials                    |
| Security Groups   | Network security for all components                        |

## Cost Estimates

### Development (~$50-100/month)

- db.t3.micro RDS
- cache.t3.micro Redis
- Minimal ECS (256 CPU, 512MB)
- Single NAT Gateway

### Production (~$500-1000/month)

- db.r6g.large RDS with Multi-AZ
- cache.r6g.large Redis
- ECS with auto-scaling
- Multiple NAT Gateways for HA

## Security Features

- All data encrypted at rest (RDS, S3, ElastiCache)
- VPC with private subnets for database
- Security groups limit network access
- Secrets stored in AWS Secrets Manager
- S3 bucket blocks all public access
- RDS not publicly accessible

## GDPR Compliance

- Region: eu-north-1 (Stockholm) - EU data residency
- Encryption: AES-256 for all data at rest
- Backup retention: 30 days (prod)
- Audit logging: CloudWatch Logs
- S3 lifecycle: Automatic archival to Glacier

## Connecting Your Application

After deployment, get connection details:

```bash
# Get database endpoint
terraform output database_endpoint

# Get Redis endpoint
terraform output redis_endpoint

# Get S3 bucket name
terraform output documents_bucket_name
```

Configure your backend environment:

```bash
# Get credentials from Secrets Manager
aws secretsmanager get-secret-value \
  --secret-id chiroclickcrm-dev/database/credentials \
  --query SecretString --output text | jq
```

## Cleanup

To destroy all resources:

```bash
terraform destroy -var-file="environments/dev/terraform.tfvars"
```

**WARNING**: This will delete all data including databases and S3 buckets.

## Support

For local development issues, see the main README.md.
For AWS deployment issues, check CloudWatch Logs and AWS Console.
