import { Router } from "express";
import {
  validateProduct,
  type CreateProductInput,
} from "./product.validation.js";
import { validatePagination } from "./pagination.validation.js";
import { validateUserUpdate } from "./user-update.validation.js";

const router = Router();

const mockUser = {
  id: 1,
  name: "Arun",
  email: "arun@example.com",
  role: "user",
  isVerified: false,
};

router.post("/products", (req, res) => {
  const errors = validateProduct(req.body);

  if (errors.length > 0) {
    return res.status(400).json({
      message: "Validation failed",
      errors,
    });
  }

  const product = req.body as CreateProductInput;

  return res.status(201).json({
    message: "Product created successfully",
    product,
  });
});

router.get("/pagination-test", (req, res) => {
  const pagination = validatePagination(
    req.query.page,
    req.query.limit
  );

  if (!pagination) {
    return res.status(400).json({
      message: "Invalid pagination parameters",
      allowedLimit: "1–100",
    });
  }

  return res.status(200).json({
    message: "Pagination parameters accepted",
    ...pagination,
  });
});

router.patch("/users/:id", (req, res) => {
  const userId = Number(req.params.id);

  if (userId !== mockUser.id) {
    return res.status(404).json({
      message: "User not found",
    });
  }

  const result = validateUserUpdate(req.body);

  if (result.errors) {
    return res.status(400).json({
      message: "Validation failed",
      errors: result.errors,
    });
  }

  Object.assign(mockUser, result.data);

  return res.status(200).json({
    message: "User updated successfully",
    user: mockUser,
  });
});

export default router;