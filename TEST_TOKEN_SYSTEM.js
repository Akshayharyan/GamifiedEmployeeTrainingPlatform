// Run this in browser DevTools console to test the token system:

// Step 1: Clear old storage
localStorage.clear();
console.log("✅ LocalStorage cleared");

// Step 2: Check what's in storage
console.log({
  accessToken: !!localStorage.getItem("accessToken"),
  refreshToken: !!localStorage.getItem("refreshToken"),
  user: !!localStorage.getItem("user"),
});

// Step 3: Monitor what gets stored on login
const observer = new MutationObserver(() => {
  console.log("📍 Storage Check:", {
    accessToken: !!localStorage.getItem("accessToken"),
    refreshToken: !!localStorage.getItem("refreshToken"),
    user: !!localStorage.getItem("user"),
    token: !!localStorage.getItem("token"), // Should be empty
  });
});

console.log("🔍 Ready to test - login now with abc@gmail.com / abc123");
console.log("Watch console for token storage events");
