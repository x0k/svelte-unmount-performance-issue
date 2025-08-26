import type { Schema } from "./core";

export const bigSchema: Schema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "https://example.com/schemas/application-config.json",
  title: "Application Configuration Schema",
  description: "Schema for application deployment and configuration management",
  type: "object",
  required: ["metadata", "application", "environment"],
  properties: {
    metadata: {
      type: "object",
      required: ["name", "version"],
      properties: {
        name: {
          type: "string",
          pattern: "^[a-z][a-z0-9-]*[a-z0-9]$",
          minLength: 3,
          maxLength: 50,
        },
        version: {
          type: "string",
          pattern: "^\\d+\\.\\d+\\.\\d+(-[a-zA-Z0-9]+)?$",
        },
        description: {
          type: "string",
          maxLength: 200,
        },
        tags: {
          type: "array",
          items: {
            type: "string",
            minLength: 1,
            maxLength: 30,
          },
          uniqueItems: true,
          maxItems: 10,
        },
        maintainer: {
          type: "object",
          required: ["name", "email"],
          properties: {
            name: {
              type: "string",
              minLength: 2,
              maxLength: 50,
            },
            email: {
              type: "string",
              format: "email",
            },
            team: {
              type: "string",
              enum: ["frontend", "backend", "devops", "mobile"],
            },
          },
        },
      },
    },
    application: {
      type: "object",
      required: ["type", "runtime", "resources"],
      properties: {
        type: {
          type: "string",
          enum: ["web-service", "api", "worker", "database", "cache"],
        },
        runtime: {
          type: "object",
          required: ["language", "version"],
          properties: {
            language: {
              type: "string",
              enum: ["javascript", "python", "java", "go", "rust", "php"],
            },
            version: {
              type: "string",
            },
            framework: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                },
                version: {
                  type: "string",
                },
                dependencies: {
                  type: "array",
                  items: {
                    type: "object",
                    required: ["name", "version"],
                    properties: {
                      name: {
                        type: "string",
                      },
                      version: {
                        type: "string",
                      },
                      dev: {
                        type: "boolean",
                        default: false,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        resources: {
          type: "object",
          properties: {
            cpu: {
              type: "object",
              properties: {
                request: {
                  type: "string",
                  pattern: "^\\d+(\\.\\d+)?[m]?$",
                },
                limit: {
                  type: "string",
                  pattern: "^\\d+(\\.\\d+)?[m]?$",
                },
              },
            },
            memory: {
              type: "object",
              properties: {
                request: {
                  type: "string",
                  pattern: "^\\d+[KMGT]i?$",
                },
                limit: {
                  type: "string",
                  pattern: "^\\d+[KMGT]i?$",
                },
              },
            },
            storage: {
              type: "array",
              items: {
                type: "object",
                required: ["name", "size"],
                properties: {
                  name: {
                    type: "string",
                  },
                  size: {
                    type: "string",
                    pattern: "^\\d+[KMGT]i?$",
                  },
                  type: {
                    type: "string",
                    enum: ["ssd", "hdd", "nvme"],
                  },
                  persistent: {
                    type: "boolean",
                    default: false,
                  },
                },
              },
            },
          },
        },
        networking: {
          type: "object",
          properties: {
            ports: {
              type: "array",
              items: {
                type: "object",
                required: ["number", "protocol"],
                properties: {
                  number: {
                    type: "integer",
                    minimum: 1,
                    maximum: 65535,
                  },
                  protocol: {
                    type: "string",
                    enum: ["tcp", "udp", "http", "https"],
                  },
                  public: {
                    type: "boolean",
                    default: false,
                  },
                },
              },
            },
            domain: {
              type: "string",
              format: "hostname",
            },
            ssl: {
              type: "object",
              properties: {
                enabled: {
                  type: "boolean",
                  default: true,
                },
                certificate_type: {
                  type: "string",
                  enum: ["self-signed", "letsencrypt", "custom"],
                },
              },
            },
          },
        },
        scaling: {
          type: "object",
          properties: {
            horizontal: {
              type: "object",
              properties: {
                enabled: {
                  type: "boolean",
                  default: false,
                },
                min_replicas: {
                  type: "integer",
                  minimum: 1,
                  default: 1,
                },
                max_replicas: {
                  type: "integer",
                  minimum: 1,
                  default: 5,
                },
                cpu_threshold: {
                  type: "integer",
                  minimum: 1,
                  maximum: 100,
                  default: 70,
                },
              },
            },
          },
        },
      },
    },
    environment: {
      type: "object",
      required: ["stage"],
      properties: {
        stage: {
          type: "string",
          enum: ["development", "staging", "production"],
        },
        variables: {
          type: "object",
          patternProperties: {
            "^[A-Z][A-Z0-9_]*$": {
              oneOf: [
                {
                  type: "string",
                },
                {
                  type: "object",
                  required: ["secret"],
                  properties: {
                    secret: {
                      type: "object",
                      required: ["name", "key"],
                      properties: {
                        name: {
                          type: "string",
                        },
                        key: {
                          type: "string",
                        },
                      },
                    },
                  },
                },
              ],
            },
          },
        },
        database: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["postgresql", "mysql", "mongodb", "redis"],
            },
            version: {
              type: "string",
            },
            connection: {
              type: "object",
              required: ["host", "port"],
              properties: {
                host: {
                  type: "string",
                  format: "hostname",
                },
                port: {
                  type: "integer",
                  minimum: 1,
                  maximum: 65535,
                },
                database: {
                  type: "string",
                },
                ssl: {
                  type: "boolean",
                  default: true,
                },
                pool: {
                  type: "object",
                  properties: {
                    min: {
                      type: "integer",
                      minimum: 0,
                      default: 2,
                    },
                    max: {
                      type: "integer",
                      minimum: 1,
                      default: 10,
                    },
                    idle_timeout: {
                      type: "integer",
                      minimum: 1000,
                      default: 30000,
                    },
                  },
                },
              },
            },
          },
        },
        monitoring: {
          type: "object",
          properties: {
            metrics: {
              type: "object",
              properties: {
                enabled: {
                  type: "boolean",
                  default: true,
                },
                endpoint: {
                  type: "string",
                  pattern: "^/",
                  default: "/metrics",
                },
              },
            },
            logging: {
              type: "object",
              properties: {
                level: {
                  type: "string",
                  enum: ["debug", "info", "warn", "error"],
                  default: "info",
                },
                format: {
                  type: "string",
                  enum: ["json", "text"],
                  default: "json",
                },
              },
            },
            health_checks: {
              type: "array",
              items: {
                type: "object",
                required: ["name", "path"],
                properties: {
                  name: {
                    type: "string",
                  },
                  path: {
                    type: "string",
                    pattern: "^/",
                  },
                  interval: {
                    type: "integer",
                    minimum: 5,
                    maximum: 300,
                    default: 30,
                  },
                  timeout: {
                    type: "integer",
                    minimum: 1,
                    maximum: 60,
                    default: 5,
                  },
                },
              },
            },
          },
        },
        security: {
          type: "object",
          properties: {
            authentication: {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  enum: ["jwt", "oauth2", "basic", "none"],
                },
                config: {
                  type: "object",
                  properties: {
                    secret_key: {
                      type: "string",
                    },
                    expiry: {
                      type: "integer",
                      minimum: 300,
                      default: 3600,
                    },
                    refresh_token: {
                      type: "boolean",
                      default: true,
                    },
                  },
                },
              },
            },
            cors: {
              type: "object",
              properties: {
                enabled: {
                  type: "boolean",
                  default: false,
                },
                origins: {
                  type: "array",
                  items: {
                    type: "string",
                    format: "uri",
                  },
                },
                methods: {
                  type: "array",
                  items: {
                    type: "string",
                    enum: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
                  },
                  default: ["GET", "POST"],
                },
              },
            },
          },
        },
      },
    },
  },
  definitions: {
    semver: {
      type: "string",
      pattern: "^\\d+\\.\\d+\\.\\d+(-[a-zA-Z0-9]+)?$",
    },
    resource_quantity: {
      type: "string",
      pattern: "^\\d+(\\.\\d+)?[KMGT]?i?[Bb]?$",
    },
    duration: {
      type: "string",
      pattern: "^\\d+[smhd]$",
    },
  },
};

export const initialValue = {
  metadata: {
    name: "user-authentication-api",
    version: "2.1.3-beta",
    description:
      "RESTful API service for user authentication and authorization with JWT tokens",
    tags: ["authentication", "api", "microservice", "jwt", "security"],
    maintainer: {
      name: "Sarah Chen",
      email: "sarah.chen@company.com",
      team: "backend",
    },
  },
  application: {
    type: "api",
    runtime: {
      language: "python",
      version: "3.11.5",
      framework: {
        name: "FastAPI",
        version: "0.104.1",
        dependencies: [
          {
            name: "uvicorn",
            version: "0.24.0",
            dev: false,
          },
          {
            name: "pydantic",
            version: "2.4.2",
            dev: false,
          },
          {
            name: "sqlalchemy",
            version: "2.0.23",
            dev: false,
          },
          {
            name: "pytest",
            version: "7.4.3",
            dev: true,
          },
          {
            name: "black",
            version: "23.10.1",
            dev: true,
          },
        ],
      },
    },
    resources: {
      cpu: {
        request: "500m",
        limit: "1000m",
      },
      memory: {
        request: "512Mi",
        limit: "1Gi",
      },
      storage: [
        {
          name: "logs",
          size: "5Gi",
          type: "ssd",
          persistent: true,
        },
        {
          name: "temp-cache",
          size: "1Gi",
          type: "nvme",
          persistent: false,
        },
      ],
    },
    networking: {
      ports: [
        {
          number: 8000,
          protocol: "http",
          public: true,
        },
        {
          number: 8080,
          protocol: "http",
          public: false,
        },
      ],
      domain: "auth-api.company.com",
      ssl: {
        enabled: true,
        certificate_type: "letsencrypt",
      },
    },
    scaling: {
      horizontal: {
        enabled: true,
        min_replicas: 2,
        max_replicas: 8,
        cpu_threshold: 75,
      },
    },
  },
  environment: {
    stage: "production",
    database: {
      type: "postgresql",
      version: "15.4",
      connection: {
        host: "postgres-primary.internal",
        port: 5432,
        database: "auth_db",
        ssl: true,
        pool: {
          min: 5,
          max: 20,
          idle_timeout: 60000,
        },
      },
    },
    monitoring: {
      metrics: {
        enabled: true,
        endpoint: "/metrics",
      },
      logging: {
        level: "info",
        format: "json",
      },
      health_checks: [
        {
          name: "liveness",
          path: "/health/live",
          interval: 30,
          timeout: 5,
        },
        {
          name: "readiness",
          path: "/health/ready",
          interval: 15,
          timeout: 3,
        },
        {
          name: "database-connectivity",
          path: "/health/db",
          interval: 60,
          timeout: 10,
        },
      ],
    },
    security: {
      authentication: {
        type: "jwt",
        config: {
          secret_key: "jwt-signing-key-placeholder",
          expiry: 3600,
          refresh_token: true,
        },
      },
      cors: {
        enabled: true,
        origins: [
          "https://app.company.com",
          "https://admin.company.com",
          "https://dashboard.company.com",
        ],
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      },
    },
    variables: {
      API_VERSION: "v2",
      DEBUG_MODE: "false",
      LOG_LEVEL: "info",
      RATE_LIMIT_PER_MINUTE: "1000",
      JWT_SECRET_KEY: {
        secret: {
          name: "auth-secrets",
          key: "jwt-secret",
        },
      },
      DATABASE_PASSWORD: {
        secret: {
          name: "db-credentials",
          key: "password",
        },
      },
      REDIS_URL: "redis://redis-cluster.internal:6379",
      ALLOWED_ORIGINS: "https://app.company.com,https://admin.company.com",
    },
  },
};
