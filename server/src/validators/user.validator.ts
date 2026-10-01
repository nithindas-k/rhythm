import { z } from 'zod';

export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username may only contain letters, numbers, and underscores')
    .optional(),
  avatarUrl: z.string().url('avatarUrl must be a valid URL').optional(),
});

export const updateThemeSchema = z.object({
  theme: z.enum(['green', 'blue', 'purple', 'pink', 'orange'], {
    error: 'Theme must be one of: green, blue, purple, pink, orange',
  }),
});

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
export type UpdateThemeDto = z.infer<typeof updateThemeSchema>;
