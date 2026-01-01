resource "kubernetes_namespace" "bot_system" {
  metadata {
    name = "bot-system"
  }
}

resource "kubernetes_secret" "bot_secrets" {
  metadata {
    name      = "bot-secrets"
    namespace = kubernetes_namespace.bot_system.metadata[0].name
  }

  data = {
    BOT_TOKEN                = var.bot_token
    POSTGRES_USER            = var.postgres_user
    POSTGRES_PASSWORD        = var.postgres_password
    POSTGRES_DB              = var.postgres_db
    COMPETITION_START_DATE   = var.competition_start_date
    COMPETITION_END_DATE     = var.competition_end_date
    MB_ENCRYPTION_SECRET_KEY = var.mb_encryption_secret_key
    WEBAPP_URL               = var.webapp_url
  }
}

resource "kubernetes_config_map" "postgres_init_scripts" {
  metadata {
    name      = "postgres-init-scripts"
    namespace = kubernetes_namespace.bot_system.metadata[0].name
  }

  data = {
    "init-databases.sql" = <<EOF
-- Initialize additional databases for the application
-- This script runs only on first database initialization

-- Create metabase database
CREATE DATABASE metabase;
EOF
  }
}

resource "kubernetes_service" "postgres" {
  metadata {
    name      = "postgres"
    namespace = kubernetes_namespace.bot_system.metadata[0].name
  }
  spec {
    selector = {
      app = "postgres"
    }
    port {
      port        = 5432
      target_port = 5432
    }
    type = "ClusterIP"
  }
}

resource "kubernetes_service" "bot" {
  metadata {
    name      = "activity-challenge-bot"
    namespace = kubernetes_namespace.bot_system.metadata[0].name
  }
  spec {
    selector = {
      app = "activity-challenge-bot"
    }
    port {
      name        = "http"
      port        = 3001
      target_port = 3001
    }
    type = "ClusterIP"
  }
}

resource "kubernetes_deployment" "postgres" {
  metadata {
    name      = "postgres"
    namespace = kubernetes_namespace.bot_system.metadata[0].name
    labels = {
      app = "postgres"
    }
  }

  spec {
    replicas = 1
    selector {
      match_labels = {
        app = "postgres"
      }
    }
    template {
      metadata {
        labels = {
          app = "postgres"
        }
      }
      spec {
        container {
          name  = "postgres"
          image = "postgres:15-alpine"
          
          env {
            name = "POSTGRES_USER"
            value_from {
              secret_key_ref {
                name = kubernetes_secret.bot_secrets.metadata[0].name
                key  = "POSTGRES_USER"
              }
            }
          }
          env {
            name = "POSTGRES_PASSWORD"
            value_from {
              secret_key_ref {
                name = kubernetes_secret.bot_secrets.metadata[0].name
                key  = "POSTGRES_PASSWORD"
              }
            }
          }
          env {
            name = "POSTGRES_DB"
            value_from {
              secret_key_ref {
                name = kubernetes_secret.bot_secrets.metadata[0].name
                key  = "POSTGRES_DB"
              }
            }
          }

          port {
            container_port = 5432
          }

          volume_mount {
            name       = "postgres-data"
            mount_path = "/var/lib/postgresql/data"
          }
          volume_mount {
            name       = "init-scripts"
            mount_path = "/docker-entrypoint-initdb.d"
          }

          liveness_probe {
            exec {
              command = ["sh", "-c", "pg_isready -U $POSTGRES_USER"]
            }
            initial_delay_seconds = 10
            period_seconds        = 10
          }
        }

        volume {
          name = "postgres-data"
          empty_dir {}
        }
        volume {
          name = "init-scripts"
          config_map {
            name = kubernetes_config_map.postgres_init_scripts.metadata[0].name
          }
        }
      }
    }
  }
}

resource "kubernetes_deployment" "bot" {
  metadata {
    name      = "activity-challenge-bot"
    namespace = kubernetes_namespace.bot_system.metadata[0].name
    labels = {
      app = "activity-challenge-bot"
    }
  }

  spec {
    replicas = 1
    selector {
      match_labels = {
        app = "activity-challenge-bot"
      }
    }
    template {
      metadata {
        labels = {
          app = "activity-challenge-bot"
        }
      }
      spec {
        container {
          name  = "bot"
          image = var.bot_image
          image_pull_policy = "Always" 

          port {
            container_port = 3001
            name           = "http"
          }

          env {
            name  = "NODE_ENV"
            value = "development"
          }
          env {
            name  = "API_PORT"
            value = "3001"
          }
          env {
            name = "WEBAPP_URL"
            value_from {
              secret_key_ref {
                name = kubernetes_secret.bot_secrets.metadata[0].name
                key  = "WEBAPP_URL"
              }
            }
          }
          env {
            name = "BOT_TOKEN"
            value_from {
              secret_key_ref {
                name = kubernetes_secret.bot_secrets.metadata[0].name
                key  = "BOT_TOKEN"
              }
            }
          }
          env {
            name = "POSTGRES_USER"
            value_from {
              secret_key_ref {
                name = kubernetes_secret.bot_secrets.metadata[0].name
                key  = "POSTGRES_USER"
              }
            }
          }
          env {
            name = "POSTGRES_PASSWORD"
            value_from {
              secret_key_ref {
                name = kubernetes_secret.bot_secrets.metadata[0].name
                key  = "POSTGRES_PASSWORD"
              }
            }
          }
          env {
            name = "POSTGRES_DB"
            value_from {
              secret_key_ref {
                name = kubernetes_secret.bot_secrets.metadata[0].name
                key  = "POSTGRES_DB"
              }
            }
          }
          env {
            name = "DATABASE_URL"
            value = "postgresql://$(POSTGRES_USER):$(POSTGRES_PASSWORD)@postgres:5432/$(POSTGRES_DB)"
          }
          env {
            name = "COMPETITION_START_DATE"
            value_from {
              secret_key_ref {
                name = kubernetes_secret.bot_secrets.metadata[0].name
                key  = "COMPETITION_START_DATE"
              }
            }
          }
          env {
            name = "COMPETITION_END_DATE"
            value_from {
              secret_key_ref {
                name = kubernetes_secret.bot_secrets.metadata[0].name
                key  = "COMPETITION_END_DATE"
              }
            }
          }

          resources {
            requests = {
              cpu    = "100m"
              memory = "128Mi"
            }
            limits = {
              cpu    = "500m"
              memory = "256Mi"
            }
          }
        }
      }
    }
  }
}
