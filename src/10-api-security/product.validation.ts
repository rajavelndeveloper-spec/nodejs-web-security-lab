export interface CreateProductInput {
  name: string;
  price: number;
  quantity: number;
}

export function validateProduct(
  body: unknown
): string[] {
  const errors: string[] = [];

  if (
    typeof body !== "object" ||
    body === null ||
    Array.isArray(body)
  ) {
    return ["Request body must be an object"];
  }

  const product = body as Record<string, unknown>;

  if (
    typeof product.name !== "string" ||
    product.name.trim().length < 3 ||
    product.name.trim().length > 100
  ) {
    errors.push("Name must contain 3–100 characters");
  }

  if (
    typeof product.price !== "number" ||
    !Number.isFinite(product.price) ||
    product.price <= 0
  ) {
    errors.push("Price must be a positive number");
  }

  if (
    !Number.isInteger(product.quantity) ||
    typeof product.quantity !== "number" ||
    product.quantity < 1 ||
    product.quantity > 1000
  ) {
    errors.push("Quantity must be an integer between 1 and 1000");
  }

  return errors;
}