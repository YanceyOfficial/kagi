/**
 * OpenAPI 3.1.0 specification for the Kagi REST API.
 * Served at GET /api/openapi — no authentication required.
 */

const SCOPES = [
  'categories:read',
  'categories:write',
  'entries:read',
  'entries:write',
  'entries:reveal',
  '2fa:read',
  '2fa:write',
  '2fa:reveal',
  'stats:read',
  'export:read',
  'ai:extract',
  'envs:read',
  'envs:write',
  'envs:reveal'
] as const

export function buildOpenApiSpec(baseUrl: string) {
  const apiUrl = `${baseUrl}/api`

  return {
    openapi: '3.1.0',
    info: {
      title: 'Kagi API',
      version: '1.0.0',
      description:
        'REST API for Kagi — an encrypted secret management system for developers.\n\n' +
        'All endpoints require authentication via an **access key** (`Authorization: Bearer kagi_<token>`).\n' +
        'Create access keys in the app under **Settings → API Keys**.\n\n' +
        'Secret values are **never** returned by list or detail endpoints. ' +
        'Use the dedicated `/reveal` endpoints with the `entries:reveal` or `2fa:reveal` scope.',
      contact: {
        name: 'Kagi on GitHub',
        url: 'https://github.com/YanceyOfficial/kagi'
      },
      license: {
        name: 'MIT',
        url: 'https://github.com/YanceyOfficial/kagi/blob/master/LICENSE'
      }
    },
    servers: [{ url: apiUrl, description: 'Kagi API' }],
    security: [{ bearerAuth: [] }],
    tags: [
      {
        name: 'Categories',
        description: 'Key category definitions (type + format)'
      },
      {
        name: 'Entries',
        description: 'Per-project key instances (encrypted values)'
      },
      { name: '2FA Tokens', description: '2FA recovery token sets' },
      { name: 'Stats', description: 'Dashboard statistics' },
      { name: 'Export', description: 'Vault metadata export' },
      { name: 'AI', description: 'AI-assisted .env file generation' },
      {
        name: 'Access Keys',
        description: 'Manage programmatic API access keys'
      },
      {
        name: 'Env Projects',
        description: 'Encrypted .env file storage per project'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'kagi_<token>',
          description:
            'Access key generated in Settings → API Keys. ' +
            'Format: `kagi_` followed by a 43-character base64url string.'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          required: ['error'],
          properties: {
            error: { type: 'string', example: 'Category not found' }
          }
        },
        KeyType: {
          type: 'string',
          enum: ['simple', 'group', 'ssh', 'json'],
          description:
            '`simple` — single env var string\n' +
            '`group` — multi-field key-value map\n' +
            '`ssh` — SSH private key file content\n' +
            '`json` — JSON credential file content'
        },
        Environment: {
          type: 'string',
          enum: ['production', 'staging', 'development', 'local']
        },
        AccessKeyScope: {
          type: 'string',
          enum: SCOPES,
          description: 'Permission scope for an access key'
        },
        KeyCategory: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string' },
            name: { type: 'string', example: 'OpenAI API' },
            description: { type: 'string', nullable: true },
            iconUrl: { type: 'string', format: 'uri', nullable: true },
            iconSlug: {
              type: 'string',
              nullable: true,
              example: 'openai',
              description: 'Simple Icons slug'
            },
            color: {
              type: 'string',
              nullable: true,
              pattern: '^#[0-9a-fA-F]{6}$',
              example: '#74aa9c'
            },
            keyType: { $ref: '#/components/schemas/KeyType' },
            envVarName: {
              type: 'string',
              nullable: true,
              example: 'OPENAI_API_KEY'
            },
            fieldDefinitions: {
              type: 'array',
              items: { type: 'string' },
              nullable: true,
              description: 'Ordered field names for `group` type'
            },
            entryCount: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        KeyEntry: {
          type: 'object',
          description: 'A per-project instance of a key category. Secret value is never included.',
          properties: {
            id: { type: 'string', format: 'uuid' },
            categoryId: { type: 'string', format: 'uuid' },
            projectName: { type: 'string', example: 'Blog Project' },
            description: { type: 'string', nullable: true },
            environment: { $ref: '#/components/schemas/Environment' },
            fileName: {
              type: 'string',
              nullable: true,
              description: 'Original filename for SSH/JSON entries'
            },
            notes: { type: 'string', nullable: true },
            expiresAt: {
              type: 'string',
              format: 'date-time',
              nullable: true
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        RevealedEntry: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            keyType: { $ref: '#/components/schemas/KeyType' },
            value: {
              oneOf: [
                { type: 'string', description: 'Plaintext value for simple/ssh/json' },
                {
                  type: 'object',
                  additionalProperties: { type: 'string' },
                  description: 'Key-value map for group type'
                }
              ]
            },
            envVarName: { type: 'string', nullable: true },
            fieldDefinitions: {
              type: 'array',
              items: { type: 'string' },
              nullable: true
            },
            fileName: { type: 'string', nullable: true }
          }
        },
        TwoFactorToken: {
          type: 'object',
          description: 'A 2FA recovery token set. Tokens are never included in list/detail responses.',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string' },
            service: { type: 'string', example: 'GitHub' },
            label: { type: 'string', nullable: true },
            totalCount: { type: 'integer', example: 10 },
            usedCount: { type: 'integer', example: 2 },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        AccessKey: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'CI/CD Pipeline' },
            keyPrefix: {
              type: 'string',
              example: 'kagi_ab12cd34',
              description: 'Display prefix for identification — not the full key'
            },
            scopes: {
              type: 'array',
              items: { $ref: '#/components/schemas/AccessKeyScope' }
            },
            lastUsedAt: {
              type: 'string',
              format: 'date-time',
              nullable: true
            },
            expiresAt: {
              type: 'string',
              format: 'date-time',
              nullable: true
            },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        EnvFileType: {
          type: 'string',
          enum: ['env', 'env.local', 'env.production', 'env.development'],
          description: 'The type of .env file'
        },
        EnvProject: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string' },
            name: { type: 'string', example: 'My Next.js App' },
            description: { type: 'string', nullable: true },
            fileCount: { type: 'integer', description: 'Number of env files in this project' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        EnvFile: {
          type: 'object',
          description: 'Env file metadata. Encrypted content is never returned — only via /reveal.',
          properties: {
            id: { type: 'string', format: 'uuid' },
            projectId: { type: 'string', format: 'uuid' },
            userId: { type: 'string' },
            fileType: { $ref: '#/components/schemas/EnvFileType' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        RevealedEnvFile: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            projectId: { type: 'string', format: 'uuid' },
            fileType: { $ref: '#/components/schemas/EnvFileType' },
            content: { type: 'string', description: 'Plaintext .env file content' }
          }
        }
      }
    },
    paths: {
      // ── Categories ─────────────────────────────────────────────────────────
      '/categories': {
        get: {
          tags: ['Categories'],
          summary: 'List categories',
          security: [{ bearerAuth: [] }],
          'x-required-scope': 'categories:read',
          parameters: [
            {
              name: 'search',
              in: 'query',
              schema: { type: 'string' },
              description: 'Case-insensitive search on name and description'
            }
          ],
          responses: {
            200: {
              description: 'List of categories with entry counts',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/KeyCategory' }
                      }
                    }
                  }
                }
              }
            },
            401: { description: 'Unauthorized' },
            403: { description: 'Insufficient scope' }
          }
        },
        post: {
          tags: ['Categories'],
          summary: 'Create a category',
          'x-required-scope': 'categories:write',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'keyType'],
                  properties: {
                    name: { type: 'string', minLength: 1, maxLength: 255 },
                    description: { type: 'string', maxLength: 1000 },
                    iconUrl: { type: 'string', format: 'uri' },
                    iconSlug: { type: 'string', maxLength: 50 },
                    color: {
                      type: 'string',
                      pattern: '^#[0-9a-fA-F]{6}$',
                      example: '#74aa9c'
                    },
                    keyType: { $ref: '#/components/schemas/KeyType' },
                    envVarName: {
                      type: 'string',
                      description: 'Required when `keyType` is `simple`'
                    },
                    fieldDefinitions: {
                      type: 'array',
                      items: { type: 'string' },
                      description: 'Required when `keyType` is `group`'
                    }
                  }
                }
              }
            }
          },
          responses: {
            201: {
              description: 'Created category',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/KeyCategory' }
                    }
                  }
                }
              }
            },
            400: { description: 'Validation error' },
            401: { description: 'Unauthorized' },
            403: { description: 'Insufficient scope' }
          }
        }
      },
      '/categories/{id}': {
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        get: {
          tags: ['Categories'],
          summary: 'Get a category',
          'x-required-scope': 'categories:read',
          responses: {
            200: {
              description: 'Category detail',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { data: { $ref: '#/components/schemas/KeyCategory' } }
                  }
                }
              }
            },
            401: { description: 'Unauthorized' },
            403: { description: 'Insufficient scope' },
            404: { description: 'Not found' }
          }
        },
        put: {
          tags: ['Categories'],
          summary: 'Update a category',
          'x-required-scope': 'categories:write',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', minLength: 1, maxLength: 255 },
                    description: { type: 'string', nullable: true },
                    iconUrl: { type: 'string', format: 'uri', nullable: true },
                    iconSlug: { type: 'string', nullable: true },
                    color: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$', nullable: true },
                    envVarName: { type: 'string', nullable: true },
                    fieldDefinitions: {
                      type: 'array',
                      items: { type: 'string' },
                      nullable: true
                    }
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Updated category',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { data: { $ref: '#/components/schemas/KeyCategory' } }
                  }
                }
              }
            },
            401: { description: 'Unauthorized' },
            403: { description: 'Insufficient scope' },
            404: { description: 'Not found' }
          }
        },
        delete: {
          tags: ['Categories'],
          summary: 'Delete a category',
          description: 'Deletes the category and all of its entries (cascade).',
          'x-required-scope': 'categories:write',
          responses: {
            200: {
              description: 'Deleted',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { data: { type: 'object', properties: { id: { type: 'string' } } } }
                  }
                }
              }
            },
            401: { description: 'Unauthorized' },
            403: { description: 'Insufficient scope' },
            404: { description: 'Not found' }
          }
        }
      },

      // ── Entries ────────────────────────────────────────────────────────────
      '/entries': {
        get: {
          tags: ['Entries'],
          summary: 'List entries',
          description: 'Returns entry metadata. Secret values are never included.',
          'x-required-scope': 'entries:read',
          parameters: [
            {
              name: 'categoryId',
              in: 'query',
              schema: { type: 'string', format: 'uuid' }
            },
            {
              name: 'search',
              in: 'query',
              schema: { type: 'string' },
              description: 'Search on projectName and notes'
            }
          ],
          responses: {
            200: {
              description: 'List of entries with category metadata',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { type: 'array', items: { $ref: '#/components/schemas/KeyEntry' } }
                    }
                  }
                }
              }
            },
            401: { description: 'Unauthorized' },
            403: { description: 'Insufficient scope' }
          }
        },
        post: {
          tags: ['Entries'],
          summary: 'Create an entry',
          description: 'The `value` field is encrypted server-side. Never stored or returned in plaintext.',
          'x-required-scope': 'entries:write',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['categoryId', 'projectName', 'value'],
                  properties: {
                    categoryId: { type: 'string', format: 'uuid' },
                    projectName: { type: 'string', minLength: 1, maxLength: 255 },
                    description: { type: 'string', maxLength: 1000 },
                    environment: { $ref: '#/components/schemas/Environment' },
                    value: {
                      oneOf: [
                        { type: 'string', description: 'Plaintext for simple/ssh/json' },
                        {
                          type: 'object',
                          additionalProperties: { type: 'string' },
                          description: 'Field map for group'
                        }
                      ]
                    },
                    fileName: { type: 'string', maxLength: 255 },
                    notes: { type: 'string', maxLength: 2000 },
                    expiresAt: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          },
          responses: {
            201: {
              description: 'Created entry (no value field)',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { data: { $ref: '#/components/schemas/KeyEntry' } }
                  }
                }
              }
            },
            400: { description: 'Validation error' },
            401: { description: 'Unauthorized' },
            403: { description: 'Insufficient scope' },
            404: { description: 'Category not found' }
          }
        }
      },
      '/entries/{id}': {
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        get: {
          tags: ['Entries'],
          summary: 'Get an entry',
          'x-required-scope': 'entries:read',
          responses: {
            200: {
              description: 'Entry with category',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { data: { $ref: '#/components/schemas/KeyEntry' } }
                  }
                }
              }
            },
            401: { description: 'Unauthorized' },
            403: { description: 'Insufficient scope' },
            404: { description: 'Not found' }
          }
        },
        put: {
          tags: ['Entries'],
          summary: 'Update an entry',
          'x-required-scope': 'entries:write',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    projectName: { type: 'string', minLength: 1, maxLength: 255 },
                    description: { type: 'string', nullable: true },
                    environment: { $ref: '#/components/schemas/Environment' },
                    value: {
                      oneOf: [
                        { type: 'string' },
                        { type: 'object', additionalProperties: { type: 'string' } }
                      ]
                    },
                    fileName: { type: 'string', nullable: true },
                    notes: { type: 'string', nullable: true },
                    expiresAt: { type: 'string', format: 'date-time', nullable: true }
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Updated entry',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { data: { $ref: '#/components/schemas/KeyEntry' } }
                  }
                }
              }
            },
            401: { description: 'Unauthorized' },
            403: { description: 'Insufficient scope' },
            404: { description: 'Not found' }
          }
        },
        delete: {
          tags: ['Entries'],
          summary: 'Delete an entry',
          'x-required-scope': 'entries:write',
          responses: {
            200: {
              description: 'Deleted',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { data: { type: 'object', properties: { id: { type: 'string' } } } }
                  }
                }
              }
            },
            401: { description: 'Unauthorized' },
            403: { description: 'Insufficient scope' },
            404: { description: 'Not found' }
          }
        }
      },
      '/entries/{id}/reveal': {
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        post: {
          tags: ['Entries'],
          summary: 'Reveal plaintext value',
          description:
            'Decrypts and returns the stored secret value. ' +
            'Requires the `entries:reveal` scope. ' +
            'Use deliberately — each call is an intentional secret access.',
          'x-required-scope': 'entries:reveal',
          responses: {
            200: {
              description: 'Decrypted value',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { data: { $ref: '#/components/schemas/RevealedEntry' } }
                  }
                }
              }
            },
            401: { description: 'Unauthorized' },
            403: { description: 'Insufficient scope' },
            404: { description: 'Not found' }
          }
        }
      },

      // ── 2FA Tokens ─────────────────────────────────────────────────────────
      '/2fa': {
        get: {
          tags: ['2FA Tokens'],
          summary: 'List 2FA token sets',
          'x-required-scope': '2fa:read',
          parameters: [
            {
              name: 'search',
              in: 'query',
              schema: { type: 'string' },
              description: 'Search on service name and label'
            }
          ],
          responses: {
            200: {
              description: 'List of token sets (without token values)',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/TwoFactorToken' }
                      }
                    }
                  }
                }
              }
            },
            401: { description: 'Unauthorized' },
            403: { description: 'Insufficient scope' }
          }
        },
        post: {
          tags: ['2FA Tokens'],
          summary: 'Create a 2FA token set',
          'x-required-scope': '2fa:write',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['service', 'tokens'],
                  properties: {
                    service: { type: 'string', minLength: 1, maxLength: 255, example: 'GitHub' },
                    label: { type: 'string', maxLength: 255 },
                    tokens: {
                      type: 'array',
                      items: { type: 'string', minLength: 1 },
                      minItems: 1,
                      description: 'Plaintext recovery tokens — encrypted server-side'
                    }
                  }
                }
              }
            }
          },
          responses: {
            201: {
              description: 'Created token set',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { data: { $ref: '#/components/schemas/TwoFactorToken' } }
                  }
                }
              }
            },
            400: { description: 'Validation error' },
            401: { description: 'Unauthorized' },
            403: { description: 'Insufficient scope' }
          }
        }
      },
      '/2fa/{id}': {
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        put: {
          tags: ['2FA Tokens'],
          summary: 'Update a 2FA token set',
          'x-required-scope': '2fa:write',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    service: { type: 'string', minLength: 1, maxLength: 255 },
                    label: { type: 'string', nullable: true },
                    tokens: { type: 'array', items: { type: 'string' }, minItems: 1 },
                    usedCount: { type: 'integer', minimum: 0 }
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Updated token set',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { data: { $ref: '#/components/schemas/TwoFactorToken' } }
                  }
                }
              }
            },
            401: { description: 'Unauthorized' },
            403: { description: 'Insufficient scope' },
            404: { description: 'Not found' }
          }
        },
        delete: {
          tags: ['2FA Tokens'],
          summary: 'Delete a 2FA token set',
          'x-required-scope': '2fa:write',
          responses: {
            200: {
              description: 'Deleted',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { data: { type: 'object', properties: { id: { type: 'string' } } } }
                  }
                }
              }
            },
            401: { description: 'Unauthorized' },
            403: { description: 'Insufficient scope' },
            404: { description: 'Not found' }
          }
        }
      },
      '/2fa/{id}/reveal': {
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        post: {
          tags: ['2FA Tokens'],
          summary: 'Reveal plaintext recovery tokens',
          'x-required-scope': '2fa:reveal',
          responses: {
            200: {
              description: 'Decrypted recovery tokens',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'object',
                        properties: {
                          id: { type: 'string', format: 'uuid' },
                          service: { type: 'string' },
                          tokens: { type: 'array', items: { type: 'string' } }
                        }
                      }
                    }
                  }
                }
              }
            },
            401: { description: 'Unauthorized' },
            403: { description: 'Insufficient scope' },
            404: { description: 'Not found' }
          }
        }
      },

      // ── Stats ──────────────────────────────────────────────────────────────
      '/stats': {
        get: {
          tags: ['Stats'],
          summary: 'Get dashboard statistics',
          'x-required-scope': 'stats:read',
          responses: {
            200: {
              description: 'Aggregated vault statistics',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'object',
                        properties: {
                          totalCategories: { type: 'integer' },
                          totalEntries: { type: 'integer' },
                          totalTwoFactorSets: { type: 'integer' },
                          keyTypeBreakdown: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                type: { $ref: '#/components/schemas/KeyType' },
                                count: { type: 'integer' }
                              }
                            }
                          },
                          environmentBreakdown: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                environment: { $ref: '#/components/schemas/Environment' },
                                count: { type: 'integer' }
                              }
                            }
                          },
                          recentEntries: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/KeyEntry' }
                          },
                          expiringEntries: {
                            type: 'array',
                            items: { $ref: '#/components/schemas/KeyEntry' }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            401: { description: 'Unauthorized' },
            403: { description: 'Insufficient scope' }
          }
        }
      },

      // ── Export ─────────────────────────────────────────────────────────────
      '/export': {
        get: {
          tags: ['Export'],
          summary: 'Export vault metadata',
          description:
            'Returns a JSON file containing all categories, entries, and 2FA token metadata. ' +
            'Secret values are never included.',
          'x-required-scope': 'export:read',
          responses: {
            200: {
              description: 'JSON export file',
              headers: {
                'Content-Disposition': {
                  schema: {
                    type: 'string',
                    example: 'attachment; filename="kagi-export-2025-01-01.json"'
                  }
                }
              },
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      exportedAt: { type: 'string', format: 'date-time' },
                      version: { type: 'string', example: '1' },
                      user: {
                        type: 'object',
                        properties: {
                          name: { type: 'string' },
                          email: { type: 'string', format: 'email' }
                        }
                      },
                      categories: { type: 'array', items: { type: 'object' } },
                      twoFactorSets: { type: 'array', items: { type: 'object' } }
                    }
                  }
                }
              }
            },
            401: { description: 'Unauthorized' },
            403: { description: 'Insufficient scope' }
          }
        }
      },

      // ── AI Extraction ──────────────────────────────────────────────────────
      '/ai/extract': {
        post: {
          tags: ['AI'],
          summary: 'Generate a .env file with AI',
          description:
            'Describe your project in natural language. ' +
            'The AI selects matching keys from your vault (seeing only names, never values) ' +
            'and the server builds a ready-to-paste `.env` file server-side.',
          'x-required-scope': 'ai:extract',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['prompt'],
                  properties: {
                    prompt: {
                      type: 'string',
                      minLength: 1,
                      maxLength: 2000,
                      example: 'I need all keys for my Next.js blog project'
                    }
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Selected keys and generated .env file',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'object',
                        properties: {
                          selectedKeys: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                entryId: { type: 'string', format: 'uuid' },
                                envVarName: { type: 'string' },
                                reason: { type: 'string' }
                              }
                            }
                          },
                          envContent: {
                            type: 'string',
                            description: 'Ready-to-paste .env file content'
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            400: { description: 'Validation error' },
            401: { description: 'Unauthorized' },
            403: { description: 'Insufficient scope' }
          }
        }
      },

      // ── Access Keys ────────────────────────────────────────────────────────
      '/access-keys': {
        get: {
          tags: ['Access Keys'],
          summary: 'List access keys',
          description:
            'Returns metadata for all your access keys. ' +
            'The full key value is never returned after creation.',
          responses: {
            200: {
              description: 'List of access keys',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/AccessKey' }
                      }
                    }
                  }
                }
              }
            },
            401: { description: 'Unauthorized' }
          }
        },
        post: {
          tags: ['Access Keys'],
          summary: 'Create an access key',
          description:
            'Creates a new access key. The plaintext key is returned **once** in the response ' +
            'and cannot be retrieved again. Store it securely immediately.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'scopes'],
                  properties: {
                    name: {
                      type: 'string',
                      minLength: 1,
                      maxLength: 255,
                      example: 'CI/CD Pipeline'
                    },
                    scopes: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/AccessKeyScope' },
                      minItems: 1,
                      example: ['entries:read', 'entries:reveal']
                    },
                    expiresAt: {
                      type: 'string',
                      format: 'date-time',
                      description: 'Optional expiry. Omit for a non-expiring key.'
                    }
                  }
                }
              }
            }
          },
          responses: {
            201: {
              description: 'Created key — `key` field is only returned here',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        allOf: [
                          { $ref: '#/components/schemas/AccessKey' },
                          {
                            type: 'object',
                            required: ['key'],
                            properties: {
                              key: {
                                type: 'string',
                                example: 'kagi_aBcDeFgH...',
                                description: 'Plaintext key — shown once, not stored'
                              }
                            }
                          }
                        ]
                      }
                    }
                  }
                }
              }
            },
            400: { description: 'Validation error' },
            401: { description: 'Unauthorized' }
          }
        }
      },
      '/access-keys/{id}': {
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        delete: {
          tags: ['Access Keys'],
          summary: 'Revoke an access key',
          description: 'Permanently revokes the access key. Active requests using this key will immediately return 401.',
          responses: {
            200: {
              description: 'Key revoked',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: { type: 'object', properties: { id: { type: 'string' } } }
                    }
                  }
                }
              }
            },
            401: { description: 'Unauthorized' },
            404: { description: 'Not found' }
          }
        }
      },

      // ── Env Projects ───────────────────────────────────────────────────────
      '/envs': {
        get: {
          tags: ['Env Projects'],
          summary: 'List env projects',
          'x-required-scope': 'envs:read',
          parameters: [
            {
              name: 'search',
              in: 'query',
              schema: { type: 'string' },
              description: 'Case-insensitive search on name and description'
            }
          ],
          responses: {
            200: {
              description: 'List of env projects with file counts',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/EnvProject' }
                      }
                    }
                  }
                }
              }
            },
            401: { description: 'Unauthorized' },
            403: { description: 'Insufficient scope' }
          }
        },
        post: {
          tags: ['Env Projects'],
          summary: 'Create an env project',
          'x-required-scope': 'envs:write',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: {
                    name: { type: 'string', minLength: 1, maxLength: 255 },
                    description: { type: 'string', maxLength: 1000 }
                  }
                }
              }
            }
          },
          responses: {
            201: {
              description: 'Created project',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { data: { $ref: '#/components/schemas/EnvProject' } }
                  }
                }
              }
            },
            400: { description: 'Validation error' },
            401: { description: 'Unauthorized' },
            403: { description: 'Insufficient scope' }
          }
        }
      },
      '/envs/{id}': {
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        get: {
          tags: ['Env Projects'],
          summary: 'Get an env project with file metadata',
          'x-required-scope': 'envs:read',
          responses: {
            200: {
              description: 'Project with file metadata list',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        allOf: [
                          { $ref: '#/components/schemas/EnvProject' },
                          {
                            type: 'object',
                            properties: {
                              files: {
                                type: 'array',
                                items: { $ref: '#/components/schemas/EnvFile' }
                              }
                            }
                          }
                        ]
                      }
                    }
                  }
                }
              }
            },
            401: { description: 'Unauthorized' },
            403: { description: 'Insufficient scope' },
            404: { description: 'Not found' }
          }
        },
        put: {
          tags: ['Env Projects'],
          summary: 'Update an env project',
          'x-required-scope': 'envs:write',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', minLength: 1, maxLength: 255 },
                    description: { type: 'string', nullable: true }
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Updated project',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { data: { $ref: '#/components/schemas/EnvProject' } }
                  }
                }
              }
            },
            401: { description: 'Unauthorized' },
            403: { description: 'Insufficient scope' },
            404: { description: 'Not found' }
          }
        },
        delete: {
          tags: ['Env Projects'],
          summary: 'Delete an env project',
          description: 'Deletes the project and all of its env files (cascade).',
          'x-required-scope': 'envs:write',
          responses: {
            200: {
              description: 'Deleted',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { data: { type: 'object', properties: { success: { type: 'boolean' } } } }
                  }
                }
              }
            },
            401: { description: 'Unauthorized' },
            403: { description: 'Insufficient scope' },
            404: { description: 'Not found' }
          }
        }
      },
      '/envs/{id}/files': {
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'Project ID' }
        ],
        get: {
          tags: ['Env Projects'],
          summary: 'List env files for a project',
          'x-required-scope': 'envs:read',
          responses: {
            200: {
              description: 'List of env file metadata',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/EnvFile' }
                      }
                    }
                  }
                }
              }
            },
            401: { description: 'Unauthorized' },
            403: { description: 'Insufficient scope' },
            404: { description: 'Project not found' }
          }
        },
        post: {
          tags: ['Env Projects'],
          summary: 'Save (upsert) an env file',
          description:
            'Creates or replaces the env file for the given `fileType` in the project. ' +
            'Content is encrypted server-side. Only one file per type per project.',
          'x-required-scope': 'envs:write',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['fileType', 'content'],
                  properties: {
                    fileType: { $ref: '#/components/schemas/EnvFileType' },
                    content: {
                      type: 'string',
                      minLength: 1,
                      description: 'Plaintext .env file content — encrypted server-side'
                    }
                  }
                }
              }
            }
          },
          responses: {
            201: {
              description: 'Saved env file metadata',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { data: { $ref: '#/components/schemas/EnvFile' } }
                  }
                }
              }
            },
            400: { description: 'Validation error' },
            401: { description: 'Unauthorized' },
            403: { description: 'Insufficient scope' },
            404: { description: 'Project not found' }
          }
        }
      },
      '/envs/{id}/files/{fileId}': {
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'Project ID' },
          { name: 'fileId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        delete: {
          tags: ['Env Projects'],
          summary: 'Delete an env file',
          'x-required-scope': 'envs:write',
          responses: {
            200: {
              description: 'Deleted',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { data: { type: 'object', properties: { success: { type: 'boolean' } } } }
                  }
                }
              }
            },
            401: { description: 'Unauthorized' },
            403: { description: 'Insufficient scope' },
            404: { description: 'Not found' }
          }
        }
      },
      '/envs/{id}/files/{fileId}/reveal': {
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' }, description: 'Project ID' },
          { name: 'fileId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        post: {
          tags: ['Env Projects'],
          summary: 'Reveal plaintext .env content',
          description:
            'Decrypts and returns the stored .env file content. ' +
            'Requires the `envs:reveal` scope.',
          'x-required-scope': 'envs:reveal',
          responses: {
            200: {
              description: 'Decrypted .env file content',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: { data: { $ref: '#/components/schemas/RevealedEnvFile' } }
                  }
                }
              }
            },
            401: { description: 'Unauthorized' },
            403: { description: 'Insufficient scope' },
            404: { description: 'Not found' }
          }
        }
      }
    }
  }
}
