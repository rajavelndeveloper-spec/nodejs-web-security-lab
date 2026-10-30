
function login(username: string, password: string) {
  console.log("Login attempt received");

  if (username === "admin" && password === "correct-password") {
    console.log("Login successful");
    return { success: true };
  }

  console.warn("Login failed");
  return { success: false };
}

login("admin", "wrong-password");
login("admin", "correct-password");
