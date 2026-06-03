import { z } from 'zod';
import { pastOrTodayDateSchema } from './dateSchemas';

export const createMaintenanceSchema = z.object({
  extinguisherId: z.string().uuid('Invalid extinguisher ID'),
  actionTaken: z.string().trim().min(1, 'Action taken is required').max(500),
  maintenanceDate: pastOrTodayDateSchema,
  issuesIdentified: z.string().trim().min(1, 'Issues identified is required').max(1000),
  notes: z.string().trim().min(1, 'Notes and recommendations are required').max(2000),
});
