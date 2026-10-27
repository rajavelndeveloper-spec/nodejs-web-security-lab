interface UpdateUserInput {
  name?: string;
  email?: string;
}

export function validateUserUpdate(
  body: unknown
): { data?: UpdateUserInput; errors?: string[] } {
  if (
    typeof body !== "object" ||
    body === null ||
    Array.isArray(body)
  ) {
    return { errors: ["Request body must be an object"] };
  }

  const input = body as Record<string, unknown>;
  const data: UpdateUserInput = {};
  const errors: string[] = [];

  if ("name" in input) {
    if (
      typeof input.name !== "string" ||
      input.name.trim().length < 3 ||
      input.name.trim().length > 100
    ) {
      errors.push("Name must contain 3–100 characters");
    } else {
      data.name = input.name.trim();
    }
  }

  if ("email" in input) {
    if (
      typeof input.email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)
    ) {
      errors.push("Invalid email address");
    } else {
      data.email = input.email;
    }
  }

  if (Object.keys(input).length === 0) {
    errors.push("Provide at least one field to update");
  }

  return errors.length > 0 ? { errors } : { data };
}