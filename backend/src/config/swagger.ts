import swaggerJsdoc from 'swagger-jsdoc';
import { openapiComponents } from './openapi-components';
import { supplementalPaths } from './openapi-paths';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Fire Extinguisher Management System API',
      version: '1.0.0',
      description:
        'RESTful API for TZW LTD (FEMS). Use **Authorize** with a Bearer access token from `POST /auth/login` or `POST /auth/verify-otp`. Public routes: health, register, login, OTP, password reset.',
    },
    servers: [{ url: '/api', description: 'API base path' }],
    components: openapiComponents,
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'System', description: 'Health and status' },
      { name: 'Authentication', description: 'Registration, login, OTP, password reset' },
      { name: 'Users', description: 'Profile and admin user management' },
      { name: 'Fire Extinguishers', description: 'Inventory CRUD and inspector assignment' },
      { name: 'Inspections', description: 'Request, assign inspector, complete' },
      { name: 'Maintenance', description: 'Maintenance logging (inspector)' },
      { name: 'Reports', description: 'Reports and PDF/CSV export' },
      { name: 'Notifications', description: 'In-app notifications' },
    ],
  },
  apis: ['./src/modules/**/*.routes.ts'],
};

const generated = swaggerJsdoc(options) as {
  paths?: Record<string, unknown>;
  components?: Record<string, unknown>;
};

/** Supplemental paths override sparse JSDoc from route files */
export const swaggerSpec = {
  ...generated,
  paths: supplementalPaths,
  components: {
    ...(generated.components ?? {}),
    ...openapiComponents,
  },
};
