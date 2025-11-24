---
author: Uitsmijter Team
title: "From One to Many: Understanding JWT Signing as You Scale"
description: "Follow a startup's journey from simple authentication to distributed systems, learning when and why to switch from HS256 to RS256 JWT signing along the way."
date: 2025-11-24
tags: ["JWT", "Security", "Authentication", "RS256", "HS256", "Architecture", "Microservices"]
thumbnail:
  url: img/jwt-signing-journey.png
  author: ChatGPT
---

Let me tell you a story about Bread and Butter Inc., a small e-commerce startup that learned about JWT signing the hard way—so you don't have to.

## The Beginning: Building Bread and Butter Inc.

Sarah and her team of three developers are building Bread and Butter Inc., an online marketplace for artisan goods. They need authentication—users should log in once and access both the website and the mobile app without entering their password again.

"Just Web Tokens," Sarah's backend developer suggests. "JWT. Everyone uses them."

"Sounds good," Sarah says. "Make it secure."

And that's where our story—and your understanding of JWT signing—begins.

## Chapter 1: One Service, One Secret

In Bread and Butter Inc.'s early days, life is simple. They have one authentication server running Uitsmijter, one Node.js API backend, a React frontend, and an iOS app. The developer sets up HS256, which stands for HMAC with SHA-256, a symmetric signing algorithm.

What does "symmetric" mean in plain English? Imagine you and your best friend have a secret handshake. Only you two know it. When you meet someone who does the handshake correctly, you know they talked to your friend. That's HS256—a shared secret that both signs and verifies tokens. The authentication server creates a token and signs it with the secret. When the API server receives that token, it uses the same secret to verify the signature. If the signature matches, the token is genuine.

```
┌─────────────────────┐                    ┌──────────────────┐
│  Uitsmijter Server  │                    │   API Server     │
│                     │                    │                  │
│   SECRET = "xyz"    │◄────Same Secret───►│  SECRET = "xyz"  │
│                     │                    │                  │
│    Signs JWT with   │─────JWT Token─────►│  Verifies JWT    │
│    secret "xyz"     │                    │  with "xyz"      │
└─────────────────────┘                    └──────────────────┘
```

The configuration is straightforward. Sarah's team creates a tenant configuration file that tells Uitsmijter to use HS256 for signing tokens. They also set up an environment variable containing the secret key. It is a long, random string that both servers share. It's like giving both servers the same password.

```yaml
# tenant.yaml
apiVersion: app.uitsmijter.io/v1
kind: Tenant
metadata:
  name: breadandbutter
spec:
  jwt_algorithm: HS256
  hosts:
    - breadandbutter.com
```

The team also configures the secret as an environment variable on both servers. This secret is precious: anyone who has it can create valid tokens, so they keep it in a secure vault and inject it into their servers at runtime.

```bash
JWT_SECRET=super-secret-key-dont-share-this
```

It works beautifully. When a user logs in, the authentication server creates a JWT containing their user ID and permissions, signs it with the secret, and sends it to the user. The user includes this token in every request to the API. The API server checks the signature using the same secret, and if it matches, it trusts the user information inside. Fast, simple, and perfect for a startup with three developers and one service.

## Chapter 2: The Growing Pains

Six months later, Bread and Butter Inc. is thriving. They've raised a seed round and grown to twelve developers. Their simple architecture has evolved. They now have an authentication server, the main API server, a payment processing service (required for PCI compliance), an inventory management service, a shipping and logistics service, an email notification service, and an analytics service.

Every one of these services needs to verify JWTs. When a request comes in with a token, each service needs to check that it's genuine before trusting it. So Sarah's team does what seems logical: they copy the JWT_SECRET to all seven services.

```
              ┌─────────────────────────────┐
              │  Uitsmijter (Auth Server)   │
              │    SECRET = "xyz"           │
              └──────────┬──────────────────┘
                         │
          ┌──────────────┼──────────────┬──────────────┐
          │              │              │              │
    ┌─────▼────┐   ┌────▼─────┐  ┌────▼─────┐  ┌────▼─────┐
    │ Payment  │   │Inventory │  │ Shipping │  │  Email   │
    │"xyz"     │   │"xyz"     │  │"xyz"     │  │"xyz"     │
    └──────────┘   └──────────┘  └──────────┘  └──────────┘
         ⚠️              ⚠️             ⚠️             ⚠️
```

Then the problems start. One Monday morning, a junior developer accidentally commits the team's .env file to GitHub. The repository is public for about three hours before someone notices. During those three hours, the JWT_SECRET is exposed to the entire internet. The team has to rotate it immediately, which means updating the secret in seven different services, coordinating deploys across multiple teams, and hoping nothing breaks. Several services fail during the rotation because the timing isn't perfect, leading to authentication errors for users.

A few weeks later, Bread and Butter Inc. partners with a fulfillment company that needs to verify tokens to process orders. Now the secret must be shared with an external company. Sarah realizes that if this partner gets breached, Bread and Butter Inc.'s entire authentication system is compromised. The fulfillment company could potentially sign tokens as any Bread and Butter Inc. user.

Then comes the PCI compliance audit. The auditor sits across from Sarah and asks a pointed question: "What happens if one of your services is compromised?"

Sarah has to admit the uncomfortable truth: "If any service is hacked, the attacker can sign tokens as any user. They could create admin tokens, access any account, or impersonate any customer."

The auditor's eyebrows rise. "That's... not ideal for a payment processing system."

Meanwhile, onboarding new developers has become painful. Every new team member needs the JWT secret. It's documented in Slack, buried in old email threads, scattered across various .env files in different repositories. Sarah realizes they have a secret management nightmare. Different developers have different versions of the secret, and nobody's quite sure which one is current.

Late one night, reviewing these issues for the upcoming board meeting, Sarah asks her team: "Isn't there a better way to do this?"

## Chapter 3: The Solution - Asymmetric Signing

The senior developer suggests switching to RS256. "RS what?" Sarah asks, already dreading another complexity to manage.

"RS256. It uses public and private keys instead of a shared secret. Like how SSH keys work," the developer explains. "We've been meaning to do this anyway."

Let me explain the difference with an analogy that makes it crystal clear.

### The Signature vs. The Stamp

HS256 is like a rubber stamp. Anyone with the stamp can create valid documents. If you share the stamp with ten people and one person loses it or someone steals it, every document ever stamped is now suspect. You have no way to know which documents are genuine and which were created by the thief. The only solution is to get a new stamp and re-stamp everything.

RS256 is like your handwritten signature. Only you can create your signature because it requires your private key, which stays with you alone. Anyone can verify it's your signature by comparing it to known samples of your signature, which is the public key. If someone steals a document with your signature on it, they still can't forge new signatures. They can look at your signature all they want, but they can't reproduce it on new documents. Your signing ability remains secure even though your signature is publicly visible.

Here's how it works in practice for Bread and Butter Inc.:

```
┌────────────────────────────────────┐
│      Uitsmijter Auth Server        │
│                                    │
│  Private Key 🔐 (stays secret!)   │  ◄── Only place that can sign tokens
│                                    │
│  Public Key 🔓 (shared via JWKS)  │
└──────────────┬─────────────────────┘
               │
               │ Publishes public keys at:
               │ /.well-known/jwks.json
               │
       ┌───────┴────────┬──────────┬──────────┬──────────┐
       │                │          │          │          │
       ▼                ▼          ▼          ▼          ▼
  ┌─────────┐     ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────┐
  │Payment  │     │Inventory│ │Shipping │ │ Email   │ │Partner   │
  │         │     │         │ │         │ │         │ │Fulfillment│
  │Public🔓 │     │Public🔓 │ │Public🔓 │ │Public🔓 │ │Public🔓  │
  │         │     │         │ │         │ │         │ │          │
  │Verifies │     │Verifies │ │Verifies │ │Verifies │ │Verifies  │
  │tokens ✓ │     │tokens ✓ │ │tokens ✓ │ │tokens ✓ │ │tokens ✓  │
  └─────────┘     └─────────┘ └─────────┘ └─────────┘ └──────────┘
```

The magic of this approach becomes clear when you think about what an attacker could do. Even if the payment service gets hacked, the shipping service gets breached, and the partner fulfillment company's entire database is stolen, the attacker still can't sign new tokens. They only have the public key, which is designed to verify signatures but never create them. It's mathematically impossible to derive the private key from the public key. That's the foundation of public-key cryptography.

### JWKS: The Public Key Distribution System

"But how do all these services get the public key?" Sarah asks, imagining another configuration nightmare.

"That's the elegant part," the developer explains. "JWKS! JSON Web Key Set. Uitsmijter publishes the public keys at a well-known URL. Services fetch them automatically."

When a service needs to verify a token, it follows a simple process. First, it looks at the token's header, which includes a field called kid, short for key ID. This tells the service which public key was used to sign the token. The service then fetches the current set of public keys from the authentication server's JWKS endpoint at a URL like `https://auth.breadandbutter.com/.well-known/jwks.json`. It finds the public key that matches the kid from the token header. Finally, it uses that public key to verify the token's signature.

The JWKS endpoint returns a JSON document containing all current public keys. Here's what it looks like:

```json
{
  "keys": [
    {
      "kty": "RSA",
      "use": "sig",
      "kid": "2025-11-24",
      "alg": "RS256",
      "n": "xGOr-H7A...",
      "e": "AQAB"
    }
  ]
}
```

Services cache these public keys, checking occasionally for updates. When Uitsmijter rotates keys, it keeps the old public keys available in the JWKS for a transition period, so tokens signed with the old key continue working while services gradually refresh their caches. Everything just works, with no coordination required.

## Chapter 4: Bread and Butter Inc. Migrates to RS256

Sarah's team decides to make the switch. With Uitsmijter 0.10.1, the migration is surprisingly simple. The developer who suggested RS256 walks Sarah through the process on a Friday afternoon, promising it won't ruin anyone's weekend.

### Step 1: Update the Tenant Configuration

The first change is a single line in their tenant configuration file. They change `jwt_algorithm` from HS256 to RS256:

```yaml
# tenant.yaml
apiVersion: app.uitsmijter.io/v1
kind: Tenant
metadata:
  name: breadandbutter
spec:
  jwt_algorithm: RS256  # Changed from HS256
  hosts:
    - breadandbutter.com
```

They apply this configuration to Uitsmijter and watch the logs. Within seconds, Uitsmijter generates a 2048-bit RSA key pair, stores the private key securely, and starts publishing the public key via the JWKS endpoint. The developer opens a browser and navigates to `https://auth.breadandbutter.com/.well-known/jwks.json`, where they can see the newly generated public key. The authentication server is now ready to sign tokens with RS256.

### Step 2: Update Services to Use JWKS

Next comes updating the services. The team starts with the payment service as a test case. The old code using HS256 looked like this:

```javascript
// Node.js service with HS256
const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET;

app.use((req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});
```

They replace it with code that fetches public keys from JWKS:

```javascript
// Node.js service with RS256 and JWKS
const { expressjwt: jwt } = require('express-jwt');
const jwksRsa = require('jwks-rsa');

app.use(jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksUri: 'https://auth.breadandbutter.com/.well-known/jwks.json'
  }),
  algorithms: ['RS256']
}));
```

Notice what disappeared: the JWT_SECRET environment variable. The service no longer needs a shared secret. It just needs to know where to find the public keys, and the jwks-rsa library handles everything else, fetching keys, caching them, and refreshing when needed.

The developer deploys the updated payment service on Friday evening and monitors it carefully. Everything works perfectly. Tokens are verified correctly, and response times are identical. Over the weekend, they feel confident enough to update the other services.

### Step 3: Roll Out Across All Services

Monday morning, they update the inventory service. Tuesday afternoon, the shipping service. Wednesday, email and analytics. By Thursday, all services are using RS256. The migration happened with zero downtime and zero customer impact. Old tokens that were signed with HS256 before the switch continued working because Uitsmijter kept supporting HS256 during the transition period. New tokens used RS256. Services handled both seamlessly.

### The Result

Three weeks after the migration, Sarah presents the results to the board. The PCI compliance auditor has approved their setup without reservations. Partner integrations are now secure because Bread and Butter Inc. only shares public keys, which can't be used to forge tokens. Developer onboarding is simpler—new team members don't need any secrets. The security team can rotate keys whenever they want without coordinating deploys across seven different services. And services can now be open-sourced without exposing any signing capability, which opens up possibilities for community contributions.

## Chapter 5: Why Uitsmijter Chose RS256 as Default

Here's where the story comes full circle, and we understand the philosophy behind Uitsmijter's evolution.

When Bread and Butter Inc. was just three developers building one service, HS256 was absolutely the right choice. It's simple to set up, requires minimal configuration, performs slightly faster than RS256, and provides perfectly adequate security for that architecture. Making RS256 the default back then would have been over-engineering—adding complexity without benefit. A startup with one backend service doesn't need asymmetric cryptography.

But as Bread and Butter Inc. scaled to microservices, distributed teams, and third-party integrations, RS256 became not just beneficial but essential. The security model of HS256 simply doesn't fit a distributed architecture. The shared secret becomes a liability rather than a convenience.

We, at the Uitsmijter team, recognized this pattern playing out across countless startups. They saw the same journey repeated: start simple with HS256, scale to microservices, hit security and operational challenges, struggle through a migration to RS256. Every team eventually made the switch, but only after experiencing the pain of managing shared secrets at scale.

So the team made a deliberate, principled choice about defaults. In version 0.10.0, they introduced RS256 support but kept HS256 as the default. This was the migration phase, giving existing users time to prepare, providing comprehensive documentation, and letting teams upgrade on their schedule. The focus was on making the transition smooth and well-documented.

Then came version 0.10.1. After seeing successful migrations across our user base and gathering feedback about the process, we made RS256 the default. Not because HS256 is bad, it's not. But because RS256 is the right default for where teams are headed, not just where they are today.

The configuration remains flexible. If you're building something that genuinely benefits from HS256, perhaps a development tool, an internal system that will never have external integrations, or a single-service application where you're certain the architecture won't change, you can explicitly configure it:

```yaml
# Multi-tenant flexibility in 0.10.1
---
apiVersion: app.uitsmijter.io/v1
kind: Tenant
metadata:
  name: simple-app
spec:
  jwt_algorithm: HS256  # Explicit override for specific needs
  hosts:
    - simple-app.com
---
apiVersion: app.uitsmijter.io/v1
kind: Tenant
metadata:
  name: enterprise-app
spec:
  jwt_algorithm: RS256  # Default, but explicit for clarity
  hosts:
    - enterprise-app.com
```

### The Philosophy: Making Security Easy

The Uitsmijter team's philosophy is simple: default to the most secure option that works at scale. For a team just starting out today, RS256 isn't harder than HS256. It's just a different configuration value, and modern JWT libraries make it just as easy to implement. But it provides security from day one, requires no migration as you scale, follows industry best practices by default, and keeps you compliance-ready from the start.

Think about it from a new developer's perspective. They're starting a project, they read that they need authentication, and they find Uitsmijter. They follow the quickstart guide, which sets up RS256. Their first service verifies tokens using JWKS. Six months later when they add a second service, it also uses JWKS. A year later when they have ten services, they're already following best practices. They never had to have the "should we migrate to RS256?" conversation because they were already there.

And if someone truly needs HS256, perhaps because they're migrating from a legacy system or have specific constraints, they can explicitly configure it. The power to choose remains, but the default guides you toward the choice that will serve you best as you grow.

## Understanding the Technical Details

For those who want to dig deeper into how these algorithms actually work, let's look under the hood.

When Uitsmijter creates a token with HS256, it takes the JWT header (which says it's using HS256) and the payload (which contains your user ID, expiration time, and other claims), combines them, and creates an HMAC-SHA256 hash using the shared secret. This hash becomes the signature. The process is deterministic—given the same input and secret, you always get the same signature. That's why anyone with the secret can both create and verify signatures.

With RS256, the process is different. Uitsmijter takes the header and payload, creates a SHA256 hash, and then signs that hash with the RSA private key. The signature is mathematically tied to the private key through the properties of RSA encryption. When a service wants to verify the token, it uses the public key to check the signature. The public key can confirm that the signature could only have been created by the corresponding private key, but it cannot create signatures itself. This is the mathematical foundation of public-key cryptography, proven secure through decades of use.

Uitsmijter uses RSA-2048, meaning the key is 2048 bits long. This meets the requirements of RFC 7517 and provides strong security. The keys are generated using cryptographically secure random number generation and stored securely in Redis, where they're protected by Redis's authentication and encryption.

Key rotation happens automatically every ninety days. Uitsmijter generates a new RSA key pair and starts signing tokens with it. The new key gets added to the JWKS endpoint, while old keys remain available for verification. This means tokens signed with the old key continue working while services gradually refresh their cached JWKS. After a grace period—longer than the maximum token lifetime—old keys are removed from JWKS and eventually deleted. The entire process happens seamlessly, with zero downtime and zero manual intervention.

## A Practical Guide to Getting Started

If you're ready to use RS256 with Uitsmijter, here's a practical walkthrough of setting everything up.

Start by installing or upgrading Uitsmijter to version 0.10.1 or later. If you're using Helm, you can upgrade with a single command that pulls the latest version and applies it to your cluster. The upgrade process is designed to be seamless—Uitsmijter handles the transition from whatever version you're running to the new version without interrupting service.

```bash
helm upgrade uitsmijter uitsmijter/uitsmijter \
  --version ">=0.10.1" \
  --namespace uitsmijter
```

Next, create or update your tenant configuration. In version 0.10.1, RS256 is the default, but it's good practice to be explicit about your configuration so other developers can see your intentions clearly:

```yaml
apiVersion: app.uitsmijter.io/v1
kind: Tenant
metadata:
  name: your-app
spec:
  jwt_algorithm: RS256  # Default in 0.10.1+, explicit for clarity
  hosts:
    - auth.yourapp.com
```

Apply this configuration to your cluster, and Uitsmijter immediately generates RSA keys and starts publishing them via JWKS.

To verify everything works, start by checking your JWKS endpoint directly. Use curl to fetch it and pipe the output through jq for pretty printing:

```bash
curl https://auth.yourapp.com/.well-known/jwks.json | jq
```

You should see a JSON response containing your public keys. Each key has properties like kty for key type (RSA), use for intended use (sig for signature), kid for key identifier, alg for algorithm (RS256), and the mathematical components n and e that make up the RSA public key.

```json
{
  "keys": [
    {
      "kty": "RSA",
      "use": "sig",
      "kid": "2025-11-24",
      "alg": "RS256",
      "n": "...",
      "e": "AQAB"
    }
  ]
}
```

You can also decode a token to verify it's using the correct algorithm. The header of an RS256 token includes the algorithm specification and the key identifier:

```json
{
  "alg": "RS256",
  "typ": "JWT",
  "kid": "2025-11-24"
}
```

The kid tells services which public key to use for verification. This is crucial for key rotation—when Uitsmijter generates a new key, it assigns a new kid, and services automatically start using the new key for new tokens while still accepting old tokens verified with old keys.
