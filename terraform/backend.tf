resource "kubernetes_namespace_v1" "minechess" {
  metadata {
    name = "minechess"
  }

  depends_on = [kind_cluster.this]
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

resource "kubernetes_deployment_v1" "backend" {
  depends_on = [null_resource.backend_image_load]

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
          name              = "backend"
          image             = "minechess-backend:local"
          image_pull_policy = "Never"

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

resource "kubernetes_service_v1" "backend" {
  metadata {
    name      = "backend"
    namespace = kubernetes_namespace_v1.minechess.metadata[0].name
  }

  spec {
    type = "NodePort"

    selector = { app = "backend" }

    port {
      port        = 3000
      target_port = 3000
      node_port   = 30300
    }
  }
}
