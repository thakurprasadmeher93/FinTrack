import { z } from 'zod';
import { 
  insertUserSchema, 
  insertProfileSchema, 
  insertCategorySchema, 
  insertTransactionSchema, 
  insertBudgetSchema,
  users, profiles, categories, transactions, budgets
} from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  forbidden: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  auth: {
    me: {
      method: 'GET' as const,
      path: '/api/user',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: z.null(),
      },
    },
  },
  profiles: {
    list: {
      method: 'GET' as const,
      path: '/api/profiles',
      responses: {
        200: z.array(z.custom<typeof profiles.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/profiles',
      input: insertProfileSchema,
      responses: {
        201: z.custom<typeof profiles.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/profiles/:id',
      responses: {
        200: z.custom<typeof profiles.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    switch: {
      method: 'POST' as const,
      path: '/api/profiles/:id/switch', // To set active profile in session
      responses: {
        200: z.object({ success: z.boolean() }),
      }
    }
  },
  categories: {
    list: {
      method: 'GET' as const,
      path: '/api/profiles/:profileId/categories',
      responses: {
        200: z.array(z.custom<typeof categories.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/profiles/:profileId/categories',
      input: insertCategorySchema.omit({ profileId: true }),
      responses: {
        201: z.custom<typeof categories.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  transactions: {
    list: {
      method: 'GET' as const,
      path: '/api/profiles/:profileId/transactions',
      input: z.object({
        month: z.coerce.number().optional(),
        year: z.coerce.number().optional(),
        categoryId: z.coerce.number().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof transactions.$inferSelect & { category: typeof categories.$inferSelect | null }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/profiles/:profileId/transactions',
      input: insertTransactionSchema.omit({ profileId: true }),
      responses: {
        201: z.custom<typeof transactions.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/transactions/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  budgets: {
    get: {
      method: 'GET' as const,
      path: '/api/profiles/:profileId/budgets',
      input: z.object({
        month: z.coerce.number(),
        year: z.coerce.number(),
      }),
      responses: {
        200: z.custom<typeof budgets.$inferSelect | null>(),
      },
    },
    set: {
      method: 'POST' as const,
      path: '/api/profiles/:profileId/budgets',
      input: insertBudgetSchema.omit({ profileId: true }),
      responses: {
        200: z.custom<typeof budgets.$inferSelect>(),
      },
    },
  },
  analytics: {
    summary: {
      method: 'GET' as const,
      path: '/api/profiles/:profileId/analytics/summary',
      input: z.object({
        month: z.coerce.number(),
        year: z.coerce.number(),
      }),
      responses: {
        200: z.object({
          income: z.number(),
          expenses: z.number(),
          balance: z.number(),
          remainingBudget: z.number().nullable(),
          budgetStatus: z.enum(['ok', 'warning', 'exceeded']),
        }),
      },
    },
    byCategory: {
      method: 'GET' as const,
      path: '/api/profiles/:profileId/analytics/categories',
      input: z.object({
        month: z.coerce.number(),
        year: z.coerce.number(),
      }),
      responses: {
        200: z.object({
          expenses: z.array(z.object({
            name: z.string(),
            value: z.number(),
            color: z.string().optional(),
            type: z.literal('expense'),
          })),
          income: z.array(z.object({
            name: z.string(),
            value: z.number(),
            color: z.string().optional(),
            type: z.literal('income'),
          })),
        }),
      },
    },
    trend: {
      method: 'GET' as const,
      path: '/api/profiles/:profileId/analytics/trend',
      responses: {
        200: z.array(z.object({
          month: z.string(),
          income: z.number(),
          expenses: z.number(),
        })),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
