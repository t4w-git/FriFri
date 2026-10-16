import swaggerJsdoc from 'swagger-jsdoc';

const swaggerDefinition: any = {
  openapi: '3.0.0',
  info: {
    title: 'Frifri API',
    version: '1.0.0',
    description: 'Enterprise-level REST API for Frifri game platform with poems, sponsors, and prize codes',
    contact: {
      name: 'Frifri Team',
      url: 'https://frifri.example.com',
      email: 'support@frifri.example.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server',
      variables: {
        scheme: {
          default: 'http',
        },
      },
    },
    {
      url: 'https://api.frifri.example.com',
      description: 'Production server',
      variables: {
        scheme: {
          default: 'https',
        },
      },
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Poem: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'poem-123' },
          title: { type: 'string', example: 'La Vita' },
          text: { type: 'string', example: 'Vivere è un arte...' },
          author: { type: 'string', example: 'Dante Alighieri' },
          audioUrl: { type: 'string', format: 'uri', nullable: true },
          thumbnailUrl: { type: 'string', format: 'uri', nullable: true },
          publishedDate: { type: 'string', format: 'date-time', nullable: true },
          excerpt: { type: 'string', nullable: true },
          active: { type: 'boolean', default: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'title', 'text', 'active', 'createdAt', 'updatedAt'],
      },
      Sponsor: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'sponsor-123' },
          name: { type: 'string', example: 'Azienda XYZ' },
          logoUrl: { type: 'string', format: 'uri', nullable: true },
          description: { type: 'string', nullable: true },
          link: { type: 'string', format: 'uri', nullable: true },
          tier: { type: 'string', enum: ['base', 'premium', 'gold'] },
          prizeDescription: { type: 'string', nullable: true },
          gameType: {
            type: 'string',
            enum: ['gioco_poesie', 'fortuna_italiana', 'fortuna_montelupo'],
          },
          active: { type: 'boolean', default: true },
          views: { type: 'integer', default: 0 },
          plays: { type: 'integer', default: 0 },
          redemptions: { type: 'integer', default: 0 },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'name', 'tier', 'gameType', 'active', 'createdAt', 'updatedAt'],
      },
      PrizeCode: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          code: { type: 'string', example: 'PRIZE123ABC', pattern: '^[A-Z0-9]{6,50}$' },
          sponsorId: { type: 'string' },
          sponsorName: { type: 'string' },
          gameType: { type: 'string', enum: ['gioco_poesie', 'fortuna_italiana', 'fortuna_montelupo'], nullable: true },
          playerEmail: { type: 'string', format: 'email', nullable: true },
          prizeDescription: { type: 'string', nullable: true },
          redeemed: { type: 'boolean', default: false },
          redeemedDate: { type: 'string', format: 'date-time', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'code', 'sponsorId', 'redeemed', 'createdAt', 'updatedAt'],
      },
      GameSession: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          gameType: { type: 'string', enum: ['gioco_poesie', 'fortuna_italiana', 'fortuna_montelupo'] },
          playerEmail: { type: 'string', format: 'email' },
          result: { type: 'string', enum: ['win', 'lose'] },
          prizeCode: { type: 'string', nullable: true },
          sponsorId: { type: 'string', nullable: true },
          playedDate: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'gameType', 'playerEmail', 'result', 'playedDate', 'createdAt', 'updatedAt'],
      },
      NewsletterSubscriber: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string', format: 'email' },
          active: { type: 'boolean', default: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'email', 'active', 'createdAt', 'updatedAt'],
      },
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string', example: 'Invalid request data' },
            },
          },
        },
        required: ['error'],
      },
      PaginatedResponse: {
        type: 'object',
        properties: {
          data: { type: 'array' },
          total: { type: 'integer' },
          limit: { type: 'integer' },
          offset: { type: 'integer' },
        },
      },
    },
  },
  paths: {
    '/api/v1/poems': {
      get: {
        summary: 'List poems',
        tags: ['Poems'],
        parameters: [
          {
            name: 'active',
            in: 'query',
            schema: { type: 'string', enum: ['true', 'false'] },
          },
          { name: 'author', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
          { name: 'sortBy', in: 'query', schema: { type: 'string', default: 'createdAt' } },
          { name: 'sortOrder', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' } },
        ],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Poems list',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/PaginatedResponse' },
                    { properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Poem' } } } },
                  ],
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
        },
      },
      post: {
        summary: 'Create poem',
        tags: ['Poems'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  text: { type: 'string' },
                  author: { type: 'string' },
                  audioUrl: { type: 'string', format: 'uri' },
                  thumbnailUrl: { type: 'string', format: 'uri' },
                  publishedDate: { type: 'string', format: 'date-time' },
                  excerpt: { type: 'string' },
                },
                required: ['title', 'text'],
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Poem created',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Poem' } } },
          },
          400: { description: 'Validation error' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/api/v1/poems/{id}': {
      get: {
        summary: 'Get poem by ID',
        tags: ['Poems'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Poem details',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Poem' } } },
          },
          404: { description: 'Poem not found' },
        },
      },
      put: {
        summary: 'Update poem',
        tags: ['Poems'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  text: { type: 'string' },
                  author: { type: 'string' },
                  active: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Poem updated',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Poem' } } },
          },
          404: { description: 'Poem not found' },
        },
      },
      delete: {
        summary: 'Delete poem',
        tags: ['Poems'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        security: [{ bearerAuth: [] }],
        responses: {
          204: { description: 'Poem deleted' },
          404: { description: 'Poem not found' },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
};

export const swaggerOptions = {
  definition: swaggerDefinition,
  apis: ['./src/routes/**/*.ts', './src/server.ts'],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
