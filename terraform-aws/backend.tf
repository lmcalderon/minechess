resource "kubernetes_namespace_v1" "minechess" {
  metadata {
    name = "minechess"
  }

  depends_on = [module.eks]
}

resource "kubernetes_secret_v1" "backend" {
  metadata {
    name      = "backend-secrets"
    namespace = kubernetes_namespace_v1.minechess.metadata[0].name
  }

  data = {
    OPENAI_API_KEY = var.openai_api_key
  }
}

resource "kubernetes_service_v1" "backend" {
  metadata {
    name      = "backend"
    namespace = kubernetes_namespace_v1.minechess.metadata[0].name
  }

  spec {
    type = "LoadBalancer"

    selector = { app = "backend" }

    port {
      port        = 3000
      target_port = 3000
    }
  }
}

resource "kubernetes_deployment_v1" "backend" {
  depends_on = [null_resource.backend_image]

  metadata {
    name      = "backend"
    namespace = kubernetes_namespace_v1.minechess.metadata[0].name
    labels    = { app = "backend" }
  }

  spec {
    replicas = 1

    selector {
      match_labels = { app = "backend" }
    }

    template {
      metadata {
        labels = { app = "backend" }
      }

      spec {
        container {
          name  = "backend"
          image = "${aws_ecr_repository.backend.repository_url}:${local.backend_hash}"

          port {
            container_port = 3000
          }

          env {
            name = "OPENAI_API_KEY"
            value_from {
              secret_key_ref {
                name = kubernetes_secret_v1.backend.metadata[0].name
                key  = "OPENAI_API_KEY"
              }
            }
          }

          env {
            name  = "OPENAI_MODEL"
            value = var.openai_model
          }

          env {
            name  = "PORT"
            value = "3000"
          }
        }
      }
    }
  }
}
