resource "kubernetes_deployment_v1" "frontend" {
  depends_on = [null_resource.frontend_image_load]

  metadata {
    name      = "frontend"
    namespace = kubernetes_namespace_v1.minechess.metadata[0].name
    labels    = { app = "frontend" }
  }

  spec {
    replicas = 1

    selector {
      match_labels = { app = "frontend" }
    }

    template {
      metadata {
        labels = { app = "frontend" }
      }

      spec {
        container {
          name              = "frontend"
          image             = "minechess-frontend:local"
          image_pull_policy = "Never"

          port {
            container_port = 80
          }
        }
      }
    }
  }
}

resource "kubernetes_service_v1" "frontend" {
  metadata {
    name      = "frontend"
    namespace = kubernetes_namespace_v1.minechess.metadata[0].name
  }

  spec {
    type = "NodePort"

    selector = { app = "frontend" }

    port {
      port        = 80
      target_port = 80
      node_port   = 30173
    }
  }
}
