import { z } from "zod";

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .regex(
        /^[A-Za-z][A-Za-z0-9_]*$/,
        "Name must start with a letter and contain only letters, numbers, and underscores",
      ),
    email: z.string().email("Invalid email address"),
    password: z.string().min(4, "Password must have atleast 4 characters"),

    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(4, "Password must have atleast 4 characters"),
});
