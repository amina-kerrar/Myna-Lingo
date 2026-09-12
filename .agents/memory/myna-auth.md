---
name: Myna Lingo auth transport
description: The authentication transport decision for the Myna Lingo web app.
---

Myna Lingo uses Clerk for web authentication. Browser requests rely on Clerk's same-origin session cookies; do not add bearer-token handling or a second local authentication system to the web app.

**Why:** The supported Clerk web setup keeps session handling in the browser SDK and Express middleware, while explicit token injection is intended for mobile clients without a browser cookie jar.

**How to apply:** Keep protected API checks on the server with Clerk middleware and keep frontend API calls same-origin. Use the app's branded Clerk routes for sign-in and sign-up.