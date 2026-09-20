module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"

  cluster_name = local.cluster_name

  cluster_endpoint_public_access = true

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.public_subnets

  eks_managed_node_groups = {
    default = {
      # This is a brand-new AWS account, which restricts On-Demand launches to
      # Free Tier-eligible instance types only (t3.medium is rejected with
      # InvalidParameterCombination). t3.micro is small, so 2 nodes instead of 1
      # to spread the app pods and system daemons across more total headroom.
      instance_types = ["t3.micro"]
      min_size       = 1
      max_size       = 3
      desired_size   = 2

      # Nodes are in public subnets (no NAT gateway for this short-lived demo);
      # they still need a public IP to reach the EKS API/ECR/internet.
      subnet_ids = module.vpc.public_subnets
    }
  }

  enable_cluster_creator_admin_permissions = true
}
