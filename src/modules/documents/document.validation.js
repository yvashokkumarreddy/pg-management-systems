import { z } from "zod";

export const documentTypeSchema = z.enum([
  "AADHAAR_FRONT",
  "AADHAAR_BACK",
  "PHOTO",
  "APPLICATION_FORM"
]);
