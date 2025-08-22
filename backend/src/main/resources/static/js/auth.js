// Signup
const signupBtn = document.getElementById("signupBtn");
if (signupBtn) {
  signupBtn.addEventListener("click", async () => {
    const username = document.getElementById("username").value;
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, name, email, password }),
      });

      const text = await res.text();
      alert(text);

      if (text === "Signup successful") {
        const loginRes = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        if (loginRes.ok) {
          window.location.href = "chat.html";
        } else {
          alert("Signup succeeded but auto-login failed. Please login manually.");
          window.location.href = "login.html";
        }
      }
    } catch (error) {
      console.error("Signup error:", error);
      alert("Signup failed. Check console for details.");
    }
  });
}

const loginBtn = document.getElementById("loginBtn");
if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        window.location.href = "chat.html";
      } else {
        const text = await res.text();
        alert(text);
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed. Check console for details.");
    }
  });
}
