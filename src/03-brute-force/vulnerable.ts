
import { Router } from "express";

const router = Router();

// Dummy account for local security testing only.
const demoUser = {
  username: "alice",
  password: "Demo-Password-123!",
};

router.post("/login", (req, res) => {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.ENABLE_VULNERABLE_POC !== "true"
  ) {
    return res.sendStatus(404);
  }

  const { username, password } = req.body;

  if (
    typeof username !== "string" ||
    typeof password !== "string"
  ) {
    return res.status(400).json({
      message: "Invalid input",
    });
  }

  const authenticated =
    username === demoUser.username &&
    password === demoUser.password;

  if (!authenticated) {
    return res.status(401).json({
      authenticated: false,
      message: "Invalid credentials",
    });
  }

  return res.json({
    authenticated: true,
    message: "Login successful",
  });
});

export default router;
