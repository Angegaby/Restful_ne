import swaggerJsdoc from 'swagger-jsdoc';
import { supplementalPaths } from './openapi-paths';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Fire Extinguisher Management System API',
      version: '1.0.0',
      description:
        'RESTful API for TZW LTD - modular microservices architecture (User, Auth, Extinguisher, Inspection, Maintenance, Reporting, Notification)',
    },
    servers: [{ url: '/api', description: 'API base path' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'System', description: 'Health and status' },
      { name: 'Authentication', description: 'User registration and login' },
      { name: 'Users', description: 'Profile and admin user management' },
      { name: 'Fire Extinguishers', description: 'Extinguisher inventory CRUD' },
      { name: 'Inspections', description: 'Inspection scheduling and completion' },
      { name: 'Maintenance', description: 'Maintenance logging' },
      { name: 'Reports', description: 'Real-time reports and exports' },
      { name: 'Notifications', description: 'Personnel notifications' },
    ],
  },
  apis: ['./src/modules/**/*.routes.ts'],
};

const generated = swaggerJsdoc(options) as { paths?: Record<string, unknown> };

export const swaggerSpec = {
  ...generated,
  paths: {
    ...(generated.paths ?? {}),
    ...supplementalPaths,
  },
};
