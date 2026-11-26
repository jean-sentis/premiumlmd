import { z } from "zod";

export const accountRegistrationSchema = z.object({
  firstName: z.string().trim().min(1, "Indiquez votre prénom."),
  lastName: z.string().trim().min(1, "Indiquez votre nom."),
  email: z.string().trim().email("Indiquez une adresse e-mail valide."),
  password: z.string().min(8, "Le mot de passe doit comporter au moins 8 caractères.")
    .regex(/[A-Z]/, "Ajoutez une majuscule.")
    .regex(/[0-9]/, "Ajoutez un chiffre.")
    .regex(/[^a-zA-Z0-9]/, "Ajoutez un caractère spécial."),
  confirmPassword: z.string(),
  terms: z.literal(true, { errorMap: () => ({ message: "Acceptez les conditions pour créer votre compte." }) }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas.", path: ["confirmPassword"],
});