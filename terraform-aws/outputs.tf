output "backend_url" {
  value = "http://${kubernetes_service_v1.backend.status[0].load_balancer[0].ingress[0].hostname}:3000"
}

output "frontend_url" {
  value = "http://${kubernetes_service_v1.frontend.status[0].load_balancer[0].ingress[0].hostname}"
}
