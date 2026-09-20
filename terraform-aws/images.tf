locals {
  repo_root = "${path.module}/.."

  backend_hash = sha1(join("", [
    for f in sort(concat(
      [for f in fileset(local.repo_root, "apps/backend/src/**") : "${local.repo_root}/${f}"],
      [
        "${local.repo_root}/apps/backend/package.json",
        "${local.repo_root}/apps/backend/tsconfig.json",
        "${local.repo_root}/apps/backend/Dockerfile",
        "${local.repo_root}/pnpm-lock.yaml",
      ],
    )) : filesha1(f)
  ]))

  frontend_hash = sha1(join("", [
    for f in sort(concat(
      [for f in fileset(local.repo_root, "apps/frontend/src/**") : "${local.repo_root}/${f}"],
      [
        "${local.repo_root}/apps/frontend/package.json",
        "${local.repo_root}/apps/frontend/index.html",
        "${local.repo_root}/apps/frontend/vite.config.ts",
        "${local.repo_root}/apps/frontend/Dockerfile",
        "${local.repo_root}/apps/frontend/nginx.conf",
        "${local.repo_root}/pnpm-lock.yaml",
      ],
    )) : filesha1(f)
  ]))

  ecr_password = data.aws_ecr_authorization_token.this.password
  ecr_registry = data.aws_ecr_authorization_token.this.proxy_endpoint
}

resource "null_resource" "backend_image" {
  triggers = { source_hash = local.backend_hash }

  provisioner "local-exec" {
    working_dir = local.repo_root
    command     = <<-EOT
      set -e
      echo "${local.ecr_password}" | docker login --username AWS --password-stdin ${local.ecr_registry}
      docker buildx build --platform linux/amd64 --push \
        -f apps/backend/Dockerfile -t ${aws_ecr_repository.backend.repository_url}:${local.backend_hash} .
    EOT
  }
}

resource "null_resource" "frontend_image" {
  depends_on = [kubernetes_service_v1.backend]
  triggers = {
    source_hash = local.frontend_hash
    backend_url = "http://${kubernetes_service_v1.backend.status[0].load_balancer[0].ingress[0].hostname}:3000"
  }

  provisioner "local-exec" {
    working_dir = local.repo_root
    command     = <<-EOT
      set -e
      echo "${local.ecr_password}" | docker login --username AWS --password-stdin ${local.ecr_registry}
      docker buildx build --platform linux/amd64 --push \
        -f apps/frontend/Dockerfile \
        --build-arg VITE_API_BASE_URL=http://${kubernetes_service_v1.backend.status[0].load_balancer[0].ingress[0].hostname}:3000 \
        -t ${aws_ecr_repository.frontend.repository_url}:${local.frontend_hash} .
    EOT
  }
}
