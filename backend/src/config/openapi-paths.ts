/**
 * Complete OpenAPI path definitions for Swagger UI.
 * Merged over auto-generated paths from route JSDoc comments.
 */
import {
  jsonRequest,
  paginatedQueryParams,
  createResponses,
  standardGet,
  standardMutation,
} from './openapi-components';

const bearer = [{ bearerAuth: [] }];
const noAuth: { security: [] } = { security: [] };

const pathId = { $ref: '#/components/parameters/UuidPath' };

export const supplementalPaths: Record<string, Record<string, unknown>> = {
  '/health': {
    get: {
      tags: ['System'],
      summary: 'Health check',
      description: 'Returns API status (no authentication required).',
      ...noAuth,
      responses: {
        200: {
          description: 'API is running',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'FEMS API is running' },
                },
              },
            },
          },
        },
      },
    },
  },

  '/auth/register': {
    post: {
      tags: ['Authentication'],
      summary: 'Register a new user',
      description: 'Creates account and sends email OTP for verification.',
      ...noAuth,
      requestBody: jsonRequest('RegisterBody'),
      responses: {
        ...createResponses,
        409: { $ref: '#/components/responses/ValidationError' },
      },
    },
  },
  '/auth/login': {
    post: {
      tags: ['Authentication'],
      summary: 'User login',
      ...noAuth,
      requestBody: jsonRequest('LoginBody'),
      responses: {
        200: { $ref: '#/components/responses/Success' },
        401: { $ref: '#/components/responses/Unauthorized' },
        422: { $ref: '#/components/responses/ValidationError' },
      },
    },
  },
  '/auth/verify-otp': {
    post: {
      tags: ['Authentication'],
      summary: 'Verify email with OTP',
      ...noAuth,
      requestBody: jsonRequest('VerifyOtpBody'),
      responses: standardMutation.responses,
    },
  },
  '/auth/resend-otp': {
    post: {
      tags: ['Authentication'],
      summary: 'Resend verification OTP',
      ...noAuth,
      requestBody: jsonRequest('ResendOtpBody'),
      responses: standardMutation.responses,
    },
  },
  '/auth/logout': {
    post: {
      tags: ['Authentication'],
      summary: 'Logout (invalidate refresh token)',
      ...noAuth,
      requestBody: jsonRequest('RefreshTokenBody'),
      responses: standardMutation.responses,
    },
  },
  '/auth/forgot-password': {
    post: {
      tags: ['Authentication'],
      summary: 'Request password reset email',
      ...noAuth,
      requestBody: jsonRequest('ForgotPasswordBody'),
      responses: standardMutation.responses,
    },
  },
  '/auth/reset-password': {
    post: {
      tags: ['Authentication'],
      summary: 'Reset password with token from email',
      ...noAuth,
      requestBody: jsonRequest('ResetPasswordBody'),
      responses: standardMutation.responses,
    },
  },
  '/auth/me': {
    get: {
      tags: ['Authentication'],
      summary: 'Get current authenticated user',
      security: bearer,
      responses: {
        ...standardGet.responses,
        403: { $ref: '#/components/responses/Forbidden' },
      },
    },
  },

  '/users': {
    get: {
      tags: ['Users'],
      summary: 'List users (paginated, admin only)',
      security: bearer,
      parameters: paginatedQueryParams,
      responses: {
        ...standardGet.responses,
        403: { $ref: '#/components/responses/Forbidden' },
      },
    },
    post: {
      tags: ['Users'],
      summary: 'Create user (admin, sends invite email)',
      security: bearer,
      requestBody: jsonRequest('AdminCreateUserBody'),
      responses: createResponses,
    },
  },
  '/users/inspectors': {
    get: {
      tags: ['Users'],
      summary: 'List inspectors for assignment dropdown (admin only)',
      security: bearer,
      responses: {
        ...standardGet.responses,
        403: { $ref: '#/components/responses/Forbidden' },
      },
    },
  },
  '/users/me': {
    get: {
      tags: ['Users'],
      summary: 'Get own profile',
      security: bearer,
      responses: standardGet.responses,
    },
    put: {
      tags: ['Users'],
      summary: 'Update own profile',
      security: bearer,
      requestBody: jsonRequest('UpdateProfileBody'),
      responses: standardMutation.responses,
    },
  },
  '/users/me/password': {
    put: {
      tags: ['Users'],
      summary: 'Change own password',
      security: bearer,
      requestBody: jsonRequest('ChangePasswordBody'),
      responses: standardMutation.responses,
    },
  },
  '/users/{id}': {
    put: {
      tags: ['Users'],
      summary: 'Update user (admin only)',
      security: bearer,
      parameters: [pathId],
      requestBody: jsonRequest('AdminUpdateUserBody'),
      responses: standardMutation.responses,
    },
    delete: {
      tags: ['Users'],
      summary: 'Delete user (admin only)',
      security: bearer,
      parameters: [pathId],
      responses: standardMutation.responses,
    },
  },

  '/extinguishers': {
    get: {
      tags: ['Fire Extinguishers'],
      summary: 'List fire extinguishers (paginated, role-scoped)',
      security: bearer,
      parameters: paginatedQueryParams,
      responses: standardGet.responses,
    },
    post: {
      tags: ['Fire Extinguishers'],
      summary: 'Register fire extinguisher (admin only)',
      security: bearer,
      requestBody: jsonRequest('ExtinguisherBody'),
      responses: createResponses,
    },
  },
  '/extinguishers/{id}': {
    get: {
      tags: ['Fire Extinguishers'],
      summary: 'Get extinguisher by ID',
      security: bearer,
      parameters: [pathId],
      responses: standardMutation.responses,
    },
    put: {
      tags: ['Fire Extinguishers'],
      summary: 'Update extinguisher (admin only)',
      security: bearer,
      parameters: [pathId],
      requestBody: jsonRequest('ExtinguisherBody'),
      responses: standardMutation.responses,
    },
    delete: {
      tags: ['Fire Extinguishers'],
      summary: 'Delete extinguisher (admin only)',
      security: bearer,
      parameters: [pathId],
      responses: standardMutation.responses,
    },
  },

  '/inspections': {
    get: {
      tags: ['Inspections'],
      summary: 'List inspections (paginated, role-scoped)',
      security: bearer,
      parameters: paginatedQueryParams,
      responses: standardGet.responses,
    },
    post: {
      tags: ['Inspections'],
      summary: 'Request inspection (user only)',
      description: 'Notifies admins; notifies assigned inspector if already assigned.',
      security: bearer,
      requestBody: jsonRequest('ScheduleInspectionBody'),
      responses: createResponses,
    },
  },
  '/inspections/{id}': {
    get: {
      tags: ['Inspections'],
      summary: 'Get inspection by ID',
      security: bearer,
      parameters: [pathId],
      responses: standardMutation.responses,
    },
  },
  '/inspections/{id}/assign-inspector': {
    patch: {
      tags: ['Inspections'],
      summary: 'Assign inspector to inspection extinguisher (admin only)',
      description: 'Updates extinguisher assignment and notifies inspector and requester.',
      security: bearer,
      parameters: [pathId],
      requestBody: jsonRequest('AssignInspectorBody'),
      responses: standardMutation.responses,
    },
  },
  '/inspections/{id}/complete': {
    patch: {
      tags: ['Inspections'],
      summary: 'Complete inspection (inspector only)',
      security: bearer,
      parameters: [pathId],
      requestBody: jsonRequest('CompleteInspectionBody'),
      responses: standardMutation.responses,
    },
  },

  '/maintenance': {
    get: {
      tags: ['Maintenance'],
      summary: 'List maintenance logs (paginated, role-scoped)',
      security: bearer,
      parameters: paginatedQueryParams,
      responses: standardGet.responses,
    },
    post: {
      tags: ['Maintenance'],
      summary: 'Log maintenance activity (inspector only)',
      security: bearer,
      requestBody: jsonRequest('MaintenanceBody'),
      responses: createResponses,
    },
  },
  '/maintenance/{id}': {
    get: {
      tags: ['Maintenance'],
      summary: 'Get maintenance log by ID',
      security: bearer,
      parameters: [pathId],
      responses: standardMutation.responses,
    },
  },

  '/reports/dashboard': {
    get: {
      tags: ['Reports'],
      summary: 'Dashboard stats and charts',
      security: bearer,
      responses: standardGet.responses,
    },
  },
  '/reports/inventory': {
    get: {
      tags: ['Reports'],
      summary: 'Inventory report',
      security: bearer,
      responses: standardGet.responses,
    },
  },
  '/reports/inspections': {
    get: {
      tags: ['Reports'],
      summary: 'Inspections report',
      security: bearer,
      responses: standardGet.responses,
    },
  },
  '/reports/compliance': {
    get: {
      tags: ['Reports'],
      summary: 'Compliance and expired extinguishers report',
      security: bearer,
      responses: standardGet.responses,
    },
  },
  '/reports/maintenance': {
    get: {
      tags: ['Reports'],
      summary: 'Maintenance history report (paginated)',
      security: bearer,
      parameters: paginatedQueryParams,
      responses: standardGet.responses,
    },
  },
  '/reports/summary': {
    get: {
      tags: ['Reports'],
      summary: 'Comprehensive summary report',
      description:
        'Stock totals (daily/monthly/yearly), inspection status, expired units, maintenance history.',
      security: bearer,
      parameters: paginatedQueryParams,
      responses: standardGet.responses,
    },
  },
  '/reports/summary/export': {
    get: {
      tags: ['Reports'],
      summary: 'Export comprehensive report (PDF or CSV)',
      security: bearer,
      parameters: [{ $ref: '#/components/parameters/ExportFormat' }],
      responses: {
        200: {
          description: 'File download (application/pdf or text/csv)',
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        422: { $ref: '#/components/responses/ValidationError' },
      },
    },
  },
  '/reports/{type}/export': {
    get: {
      tags: ['Reports'],
      summary: 'Export single report type as PDF or CSV',
      security: bearer,
      parameters: [
        { $ref: '#/components/parameters/ReportTypePath' },
        { $ref: '#/components/parameters/ExportFormat' },
      ],
      responses: {
        200: { description: 'File download' },
        401: { $ref: '#/components/responses/Unauthorized' },
        422: { $ref: '#/components/responses/ValidationError' },
      },
    },
  },

  '/notifications/unread-count': {
    get: {
      tags: ['Notifications'],
      summary: 'Get unread notification count',
      security: bearer,
      responses: {
        200: {
          description: 'Unread count',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'object',
                    properties: { count: { type: 'integer' } },
                  },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/Unauthorized' },
      },
    },
  },
  '/notifications': {
    get: {
      tags: ['Notifications'],
      summary: 'List notifications (paginated)',
      security: bearer,
      parameters: [
        ...paginatedQueryParams,
        { $ref: '#/components/parameters/UnreadOnly' },
      ],
      responses: standardGet.responses,
    },
  },
  '/notifications/{id}/read': {
    patch: {
      tags: ['Notifications'],
      summary: 'Mark notification as read',
      security: bearer,
      parameters: [pathId],
      responses: standardMutation.responses,
    },
  },
};
