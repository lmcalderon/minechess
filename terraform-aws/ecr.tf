resource "aws_ecr_repository" "backend" {
  name                 = "minechess-backend"
  image_tag_mutability = "MUTABLE"
  force_delete         = true
}

resource "aws_ecr_repository" "frontend" {
  name                 = "minechess-frontend"
  image_tag_mutability = "MUTABLE"
  force_delete         = true
}

data "aws_ecr_authorization_token" "this" {}
