async function testRedirect() {
  const url = "https://httpbin.org/redirect-to?url=https%3A%2F%2Fexample.com";

  // First test: do not automatically follow redirects
  const manualResponse = await fetch(url, {
    redirect: "manual",
  });

  console.log("\n--- Manual redirect handling ---");
  console.log("Status:", manualResponse.status);
  console.log("Location:", manualResponse.headers.get("location"));

  // Second test: use the default behavior
  const automaticResponse = await fetch(url);

  console.log("\n--- Automatic redirect handling ---");
  console.log("Status:", automaticResponse.status);
  console.log("Final URL:", automaticResponse.url);
}

testRedirect().catch((error) => {
  console.error("Request failed:", error.message);
});
// SSRF via Redirect — Simple Notes
// What is SSRF?

// SSRF happens when an attacker tricks your backend into sending a request to an unwanted URL.

// How does the attack happen?
// 1. The attacker gives your API a URL.
// 2. Your backend checks that the URL is allowed.
// 3. That URL redirects to an internal server.
// 4. If your backend follows the redirect automatically, it may access sensitive data.
// How to prevent it?
// - Allow only trusted URLs.
// - Use redirect: "manual" to stop automatic redirects.
// - Validate every new URL before following a redirect.
// - Block access to internal IP addresses and services.
// Remember: Don't trust a redirect just because the first URL is safe.