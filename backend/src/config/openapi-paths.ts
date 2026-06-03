/** Supplemental OpenAPI paths merged into Swagger UI */
export const supplementalPaths: Record<string, Record<string, unknown>> = {
  '/health': {
    get: {
      tags: ['System'],
      summary: 'Health check',
      security: [],
      responses: { 200: { description: 'API is running' } },
    },
  },
  '/users': {
    get: {
      tags: ['Users'],
      summary: 'List users (paginated, admin)',
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
      ],
    },
    post: { tags: ['Users'], summary: 'Create user (admin, sends invite email)' },
  },
  '/users/inspectors': {
    get: { tags: ['Users'], summary: 'List inspectors for assignment dropdown (admin)' },
  },
  '/users/me': {
    get: { tags: ['Users'], summary: 'Get own profile' },
    put: { tags: ['Users'], summary: 'Update own profile' },
  },
  '/users/me/password': {
    put: { tags: ['Users'], summary: 'Change own password' },
  },
  '/users/{id}': {
    put: { tags: ['Users'], summary: 'Update user (admin)' },
    delete: { tags: ['Users'], summary: 'Delete user (admin)' },
  },
  '/extinguishers': {
    get: {
      tags: ['Fire Extinguishers'],
      summary: 'List extinguishers (paginated)',
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer' } },
        { name: 'limit', in: 'query', schema: { type: 'integer' } },
      ],
    },
    post: { tags: ['Fire Extinguishers'], summary: 'Register extinguisher (admin)' },
  },
  '/extinguishers/{id}': {
    get: { tags: ['Fire Extinguishers'], summary: 'Get extinguisher by ID' },
    put: { tags: ['Fire Extinguishers'], summary: 'Update extinguisher (admin)' },
    delete: { tags: ['Fire Extinguishers'], summary: 'Delete extinguisher record (admin)' },
  },
  '/inspections': {
    get: {
      tags: ['Inspections'],
      summary: 'List inspections (paginated, role-scoped)',
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer' } },
        { name: 'limit', in: 'query', schema: { type: 'integer' } },
      ],
    },
    post: {
      tags: ['Inspections'],
      summary: 'Request inspection (user only)',
    },
  },
  '/inspections/{id}': {
    get: { tags: ['Inspections'], summary: 'Get inspection by ID' },
  },
  '/inspections/{id}/complete': {
    patch: { tags: ['Inspections'], summary: 'Complete inspection (inspector)' },
  },
  '/maintenance': {
    get: {
      tags: ['Maintenance'],
      summary: 'List maintenance logs (paginated)',
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer' } },
        { name: 'limit', in: 'query', schema: { type: 'integer' } },
      ],
    },
    post: { tags: ['Maintenance'], summary: 'Log maintenance activity (inspector only)' },
  },
  '/maintenance/{id}': {
    get: { tags: ['Maintenance'], summary: 'Get maintenance log by ID' },
  },
  '/reports/dashboard': {
    get: { tags: ['Reports'], summary: 'Dashboard stats and charts' },
  },
  '/reports/summary': {
    get: {
      tags: ['Reports'],
      summary:
        'Comprehensive report: stock totals (daily/monthly/yearly), inspection status, expired units, maintenance history',
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer' } },
        { name: 'limit', in: 'query', schema: { type: 'integer' } },
      ],
    },
  },
  '/reports/summary/export': {
    get: {
      tags: ['Reports'],
      summary: 'Export full comprehensive report as PDF or CSV',
      parameters: [
        { name: 'format', in: 'query', required: true, schema: { enum: ['pdf', 'csv'] } },
      ],
    },
  },
  '/reports/inventory': { get: { tags: ['Reports'], summary: 'Inventory report' } },
  '/reports/inspections': { get: { tags: ['Reports'], summary: 'Inspections report' } },
  '/reports/compliance': { get: { tags: ['Reports'], summary: 'Compliance & expired report' } },
  '/reports/maintenance': { get: { tags: ['Reports'], summary: 'Maintenance history report (paginated)' } },
  '/reports/{type}/export': {
    get: {
      tags: ['Reports'],
      summary: 'Export report PDF or CSV',
      parameters: [
        { name: 'type', in: 'path', required: true },
        { name: 'format', in: 'query', schema: { enum: ['pdf', 'csv'] } },
      ],
    },
  },
  '/notifications': {
    get: {
      tags: ['Notifications'],
      summary: 'List notifications (paginated)',
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer' } },
        { name: 'limit', in: 'query', schema: { type: 'integer' } },
        { name: 'unread', in: 'query', schema: { type: 'boolean' } },
      ],
    },
  },
  '/notifications/{id}/read': {
    patch: { tags: ['Notifications'], summary: 'Mark notification as read' },
  },
};
