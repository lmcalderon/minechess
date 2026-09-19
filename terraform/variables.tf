variable "openai_api_key" {
  description = "OpenAI API key, injected into the backend as a Kubernetes secret."
  type        = string
  sensitive   = true
}

variable "openai_model" {
  description = "OpenAI model for the backend to use."
  type        = string
  default     = "gpt-4o-mini"
}
