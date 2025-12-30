# ============================================================================
# Production Environment Configuration
# ============================================================================

environment = "prod"
aws_region  = "eu-north-1" # Stockholm - GDPR compliant EU region

# Networking - full 3 AZ setup
vpc_cidr              = "10.0.0.0/16"
public_subnet_cidrs   = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
private_subnet_cidrs  = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
database_subnet_cidrs = ["10.0.21.0/24", "10.0.22.0/24", "10.0.23.0/24"]

# Database - production sized with Multi-AZ
db_instance_class        = "db.r6g.large"
db_allocated_storage     = 100
db_max_allocated_storage = 500

# Redis - production node
redis_node_type = "cache.r6g.large"

# ECS - production capacity
backend_cpu           = 1024
backend_memory        = 2048
backend_desired_count = 3
backend_min_count     = 2
backend_max_count     = 10

# Domain - set your production domain
domain_name         = ""
create_route53_zone = false

additional_tags = {
  CostCenter  = "Production"
  Compliance  = "GDPR"
  DataClass   = "PHI"
}
