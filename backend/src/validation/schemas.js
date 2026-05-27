const { z } = require('zod');

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

const idSchema = z
  .string()
  .trim()
  .min(1, 'subject must be a valid id');

const createTaskSchema = z.object({
  subject: idSchema,
  title: z.string().trim().min(3, 'title must have at least 3 characters'),
  dueDate: z.coerce
    .date({ invalid_type_error: 'dueDate must be a valid date' })
    .refine((value) => value >= startOfToday(), {
      message: 'dueDate must be today or in the future',
    }),
  status: z.enum(['pendiente', 'en_progreso', 'en progreso', 'entregada']).optional(),
  isProject: z.boolean().optional(),
  description: z.string().trim().optional(),
});

const createExamSchema = z
  .object({
    subject: idSchema,
    date: z.coerce.date({ invalid_type_error: 'date must be a valid date' }),
    maxScore: z.coerce.number().positive('maxScore must be greater than 0').optional(),
    score: z.coerce.number().optional(),
    // Optional system scale. If omitted, score is accepted in 0..100.
    scoreScale: z.union([z.literal(10), z.literal(100)]).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.score === undefined || data.score === null) {
      return;
    }

    const maxScale = data.scoreScale || (data.maxScore && data.maxScore <= 10 ? 10 : 100);
    if (data.score < 0 || data.score > maxScale) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['score'],
        message: `score must be between 0 and ${maxScale}`,
      });
    }
  });

const colorHexSchema = z
  .string()
  .trim()
  .regex(/^#([0-9A-Fa-f]{6})$/, 'color must be a valid HEX color (#rrggbb)');

const createSubjectSchema = z.object({
  name: z.string().trim().min(2, 'name must have at least 2 characters'),
  teacher: z.string().trim().optional(),
  color: colorHexSchema,
});

const updateSubjectSchema = z
  .object({
    name: z.string().trim().min(2, 'name must have at least 2 characters').optional(),
    teacher: z.string().trim().optional(),
    color: colorHexSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, 'at least one field is required');

const loginSchema = z.object({
  email: z.string().trim().email('email must be valid'),
  password: z.string().min(6, 'password must have at least 6 characters'),
});

module.exports = {
  createTaskSchema,
  createExamSchema,
  createSubjectSchema,
  updateSubjectSchema,
  loginSchema,
};
