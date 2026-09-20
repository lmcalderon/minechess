resource "kubernetes_service_v1" "frontend" {
  metadata {
    name      = "frontend"
    namespace = kubernetes_namespace_v1.minechess.metadata[0].name
  }

  spec {
    type = "LoadBalancer"

    selector = { app = "frontend" }

    port {
      port        = 80
      target_port = 80
    }
  }
}

resource "kubernetes_deployment_v1" "frontend" {
  depends_on = [null_resource.frontend_image]

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
          name  = "frontend"
          image = "${aws_ecr_repository.frontend.repository_url}:${local.frontend_hash}"

          port {
            container_port = 80
          }
        }
      }
    }
  }
}
