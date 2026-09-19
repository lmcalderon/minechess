resource "kind_cluster" "this" {
  name           = "minechess"
  wait_for_ready = true

  kind_config {
    kind        = "Cluster"
    api_version = "kind.x-k8s.io/v1alpha4"

    node {
      role = "control-plane"

      extra_port_mappings {
        container_port = 30300
        host_port      = 3000
      }
      extra_port_mappings {
        container_port = 30173
        host_port      = 5173
      }
    }
  }
}
