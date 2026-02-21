import { z } from 'zod/v4';

export const viewportQuerySchema = z.object({
  viewport: z
    .string()
    .refine(
      (val) => {
        const parts = val.split(',').map(Number);
        return parts.length === 4 && parts.every((n) => !isNaN(n));
      },
      { message: 'viewport must be 4 comma-separated numbers: swLat,swLng,neLat,neLng' },
    )
    .transform((val) => {
      const [swLat, swLng, neLat, neLng] = val.split(',').map(Number);
      return { swLat, swLng, neLat, neLng };
    })
    .pipe(
      z.object({
        swLat: z.number().min(-90).max(90),
        swLng: z.number().min(-180).max(180),
        neLat: z.number().min(-90).max(90),
        neLng: z.number().min(-180).max(180),
      }),
    ),
});

export type ViewportQuery = z.infer<typeof viewportQuerySchema>;
