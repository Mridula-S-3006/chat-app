// Signup
const signupBtn = document.getElementById("signupBtn");
if (signupBtn) {
  signupBtn.addEventListener("click", async () => {
    const username = document.getElementById("username").value;
    const name = document.getElementById("name").value; // changed from displayName
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      const res = await fetch("http://localhost:8080/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, name, email, password }),
      });

      const text = await res.text();
      alert(text);

      if (text === "Signup successful") {
        // Redirect to login after successful signup
        window.location.href = "login.html";
      }
    } catch (error) {
      console.error("Signup error:", error);
      alert("Signup failed. Check console for details.");
    }
  });
}

// Login
const loginBtn = document.getElementById("loginBtn");
if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      const res = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const text = await res.text();
      alert(text);

      if (text.startsWith("Login successful")) {
        window.location.href = "chat.html";
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed. Check console for details.");
    }
  });
}
