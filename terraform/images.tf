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
}

resource "null_resource" "backend_image" {
  triggers = { source_hash = local.backend_hash }

  provisioner "local-exec" {
    working_dir = local.repo_root
    command     = "docker build -f apps/backend/Dockerfile -t minechess-backend:local ."
  }
}

resource "null_resource" "backend_image_load" {
  depends_on = [null_resource.backend_image, kind_cluster.this]
  triggers   = { source_hash = local.backend_hash }

  provisioner "local-exec" {
    command = "kind load docker-image minechess-backend:local --name ${kind_cluster.this.name}"
  }
}

resource "null_resource" "frontend_image" {
  triggers = { source_hash = local.frontend_hash }

  provisioner "local-exec" {
    working_dir = local.repo_root
    command     = "docker build -f apps/frontend/Dockerfile -t minechess-frontend:local ."
  }
}

resource "null_resource" "frontend_image_load" {
  depends_on = [null_resource.frontend_image, kind_cluster.this]
  triggers   = { source_hash = local.frontend_hash }

  provisioner "local-exec" {
    command = "kind load docker-image minechess-frontend:local --name ${kind_cluster.this.name}"
  }
}
