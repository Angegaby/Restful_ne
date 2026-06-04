/** Shared OpenAPI 3 components (schemas, parameters, responses) */

export const openapiComponents = {
  securitySchemes: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    },
  },
  parameters: {
    Page: {
      name: 'page',
      in: 'query',
      description: 'Page number (1-based)',
      schema: { type: 'integer', minimum: 1, default: 1 },
    },
    Limit: {
      name: 'limit',
      in: 'query',
      description: 'Items per page (max 100)',
      schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
    },
    UnreadOnly: {
      name: 'unread',
      in: 'query',
      description: 'If true, return only unread notifications',
      schema: { type: 'boolean' },
    },
    UuidPath: {
      name: 'id',
      in: 'path',
      required: true,
      schema: { type: 'string', format: 'uuid' },
    },
    ReportTypePath: {
      name: 'type',
      in: 'path',
      required: true,
      description: 'Report type',
      schema: {
        type: 'string',
        enum: ['inventory', 'inspections', 'compliance', 'maintenance', 'summary'],
      },
    },
    ExportFormat: {
      name: 'format',
      in: 'query',
      required: true,
      schema: { type: 'string', enum: ['pdf', 'csv'] },
    },
  },
  schemas: {
    ErrorResponse: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string' },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              field: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    SuccessEnvelope: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {},
      },
    },
    PaginatedMeta: {
      type: 'object',
      properties: {
        page: { type: 'integer' },
        limit: { type: 'integer' },
        total: { type: 'integer' },
        totalPages: { type: 'integer' },
        hasNext: { type: 'boolean' },
        hasPrev: { type: 'boolean' },
      },
    },
    RegisterBody: {
      type: 'object',
      required: ['firstName', 'lastName', 'email', 'password'],
      properties: {
        firstName: { type: 'string', minLength: 1 },
        lastName: { type: 'string', minLength: 1 },
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 8 },
      },
    },
    LoginBody: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string' },
      },
    },
    VerifyOtpBody: {
      type: 'object',
      required: ['email', 'code'],
      properties: {
        email: { type: 'string', format: 'email' },
        code: { type: 'string', pattern: '^\\d{6}$' },
      },
    },
    ResendOtpBody: {
      type: 'object',
      required: ['email'],
      properties: { email: { type: 'string', format: 'email' } },
    },
    ForgotPasswordBody: {
      type: 'object',
      required: ['email'],
      properties: { email: { type: 'string', format: 'email' } },
    },
    ResetPasswordBody: {
      type: 'object',
      required: ['token', 'password'],
      properties: {
        token: { type: 'string' },
        password: { type: 'string', minLength: 8 },
      },
    },
    RefreshTokenBody: {
      type: 'object',
      required: ['refreshToken'],
      properties: { refreshToken: { type: 'string' } },
    },
    UpdateProfileBody: {
      type: 'object',
      properties: {
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        email: { type: 'string', format: 'email' },
      },
    },
    ChangePasswordBody: {
      type: 'object',
      required: ['currentPassword', 'newPassword'],
      properties: {
        currentPassword: { type: 'string' },
        newPassword: { type: 'string', minLength: 8 },
      },
    },
    AdminCreateUserBody: {
      type: 'object',
      required: ['firstName', 'lastName', 'email', 'password', 'role'],
      properties: {
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 8 },
        role: { type: 'string', enum: ['ADMIN', 'INSPECTOR', 'USER'] },
      },
    },
    AdminUpdateUserBody: {
      type: 'object',
      properties: {
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        email: { type: 'string', format: 'email' },
        role: { type: 'string', enum: ['ADMIN', 'INSPECTOR', 'USER'] },
        password: { type: 'string', minLength: 8 },
      },
    },
    ExtinguisherBody: {
      type: 'object',
      required: ['serialNumber', 'location', 'type', 'size', 'installationDate', 'expiryDate'],
      properties: {
        serialNumber: { type: 'string' },
        location: { type: 'string' },
        type: { type: 'string', enum: ['WATER', 'CO2', 'FOAM', 'DRY_CHEMICAL'] },
        size: { type: 'string', enum: ['LB_1_5', 'LB_5', 'LB_9', 'LB_12'] },
        installationDate: { type: 'string', format: 'date', example: '2024-01-15' },
        expiryDate: { type: 'string', format: 'date', example: '2026-01-15' },
        status: {
          type: 'string',
          enum: ['ACTIVE', 'EXPIRED', 'MAINTENANCE', 'DECOMMISSIONED'],
        },
        assignedInspectorId: { type: 'string', format: 'uuid', nullable: true },
      },
    },
    ScheduleInspectionBody: {
      type: 'object',
      required: ['extinguisherId', 'scheduledDate', 'scheduledTime'],
      properties: {
        extinguisherId: { type: 'string', format: 'uuid' },
        scheduledDate: { type: 'string', format: 'date', example: '2026-06-15' },
        scheduledTime: { type: 'string', example: '10:00', pattern: '^([01]\\d|2[0-3]):[0-5]\\d$' },
        notes: { type: 'string', maxLength: 1000 },
      },
    },
    AssignInspectorBody: {
      type: 'object',
      required: ['assignedInspectorId'],
      properties: {
        assignedInspectorId: { type: 'string', format: 'uuid' },
      },
    },
    CompleteInspectionBody: {
      type: 'object',
      required: ['status'],
      properties: {
        status: { type: 'string', enum: ['COMPLETED'] },
        notes: { type: 'string', maxLength: 1000 },
      },
    },
    MaintenanceBody: {
      type: 'object',
      required: [
        'extinguisherId',
        'actionTaken',
        'maintenanceDate',
        'issuesIdentified',
        'notes',
      ],
      properties: {
        extinguisherId: { type: 'string', format: 'uuid' },
        actionTaken: { type: 'string', maxLength: 500 },
        maintenanceDate: { type: 'string', format: 'date' },
        issuesIdentified: { type: 'string', maxLength: 1000 },
        notes: { type: 'string', maxLength: 2000 },
      },
    },
  },
  responses: {
    Unauthorized: {
      description: 'Missing or invalid JWT',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ErrorResponse' },
        },
      },
    },
    Forbidden: {
      description: 'Insufficient role or scope',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ErrorResponse' },
        },
      },
    },
    NotFound: {
      description: 'Resource not found',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ErrorResponse' },
        },
      },
    },
    ValidationError: {
      description: 'Validation failed',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ErrorResponse' },
        },
      },
    },
    Success: {
      description: 'Success',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/SuccessEnvelope' },
        },
      },
    },
  },
};

const ref = (name: string) => ({ $ref: `#/components/${name}` });

export const paginatedQueryParams = [
  ref('parameters/Page'),
  ref('parameters/Limit'),
];

export const jsonRequest = (schemaRef: string) => ({
  required: true,
  content: {
    'application/json': {
      schema: ref(`schemas/${schemaRef}`),
    },
  },
});

export const standardGet = {
  responses: {
    200: ref('responses/Success'),
    401: ref('responses/Unauthorized'),
  },
};

export const standardMutation = {
  responses: {
    200: ref('responses/Success'),
    201: ref('responses/Success'),
    401: ref('responses/Unauthorized'),
    403: ref('responses/Forbidden'),
    404: ref('responses/NotFound'),
    422: ref('responses/ValidationError'),
  },
};

export const createResponses = {
  201: ref('responses/Success'),
  401: ref('responses/Unauthorized'),
  403: ref('responses/Forbidden'),
  404: ref('responses/NotFound'),
  422: ref('responses/ValidationError'),
};
