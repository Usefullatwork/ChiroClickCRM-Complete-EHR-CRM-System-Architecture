# ============================================================================
# Development Environment Configuration
# ============================================================================

environment = "dev"
aws_region  = "eu-north-1"

# Networking - smaller for dev
vpc_cidr              = "10.0.0.0/16"
public_subnet_cidrs   = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs  = ["10.0.11.0/24", "10.0.12.0/24"]
database_subnet_cidrs = ["10.0.21.0/24", "10.0.22.0/24"]

# Database - smaller instance for dev
db_instance_class        = "db.t3.micro"
db_allocated_storage     = 20
db_max_allocated_storage = 50

# Redis - smallest instance
redis_node_type = "cache.t3.micro"

# ECS - minimal resources
backend_cpu           = 256
backend_memory        = 512
backend_desired_count = 1
backend_min_count     = 1
backend_max_count     = 2

# Domain - typically empty for dev
domain_name = ""

additional_tags = {
  CostCenter = "Development"
}
