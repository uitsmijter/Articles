---
author: Uitsmijter Team
title: "Uitsmijter 0.10: Enterprise-Grade JWT Signing with JWKS Support"
description: "Introducing RS256 asymmetric signing, automatic key rotation, and RFC 7517-compliant JWKS endpoints. Uitsmijter 0.10 brings production-ready JWT management with zero-downtime migration from HS256."
date: 2025-11-08
draft: false
tags: ["Release", "Security", "JWKS", "RS256", "JWT", "OpenID-Connect"]
thumbnail:
  url: img/jwt.png
  author: ChatGPT
---

One of the most requested features for production deployments is finally here: **JSON Web Key Set (JWKS) support with RS256 asymmetric signing**. Uitsmijter 0.10 brings enterprise-grade JWT token management that scales seamlessly with Kubernetes horizontal pod autoscaling, includes automatic key rotation, and provides a zero-downtime migration path from HS256.

If you're running Uitsmijter in production—especially in a microservices architecture or multi-tenant environment—this release fundamentally changes how you manage JWT security.

## Why JWKS Matters for Production

### The Challenge with HS256 (Symmetric Signing)

When using HS256 (HMAC-SHA256), you share a **single secret key** between your authorization server and every resource server. This creates several operational challenges:

- **Secret Distribution**: Every microservice needs the JWT secret, increasing exposure
- **Rotation Complexity**: Changing the secret requires coordinated updates across all services
- **Security Risk**: Compromise of any single service exposes your signing key
- **Compliance Gaps**: Many security frameworks require asymmetric cryptography

For development environments, HS256 is perfectly adequate. But production deployments deserve better.

### The RS256 Advantage (Asymmetric Signing)

RS256 (RSA-SHA256) uses **public-key cryptography**:

- **Private keys never leave** the authorization server
- **Public keys distributed safely** via the JWKS endpoint
- **Seamless key rotation** without coordinating service updates
- **Standards-based security** that works with all OAuth/OIDC libraries
- **Compliance-ready** for enterprise security requirements

Resource servers automatically fetch public keys from your `/.well-known/jwks.json` endpoint. When you rotate keys, they automatically discover the new ones. No secret management, no coordination headaches.

## What's New in Uitsmijter 0.10

### 1. RFC 7517-Compliant JWKS Implementation

Uitsmijter now generates and manages **2048-bit RSA key pairs** according to RFC 7517 (JSON Web Key) and RFC 7518 (JSON Web Algorithms) specifications.

**Multi-key support**: Manages multiple keys simultaneously during rotation periods

### 2. Automatic Key Rotation

Security best practices recommend regular key rotation. Uitsmijter 0.10 automates this:

**90-Day Default Lifecycle**:
- Keys are automatically rotated when they reach 90 days old
- Old keys remain in the JWKS during a grace period (for token validation)
- New tokens are signed with the current key
- Zero-downtime rotation—no service interruption

**Operational Excellence**:
- Automatic cleanup of expired keys after grace period
- Metadata tracking: key ID, creation timestamp, active status
- Health checks for Redis connectivity
- Graceful key generation if storage is empty

### 3. Zero-Downtime Migration from HS256

Worried about migrating existing deployments? We've made it painless.

**Simple Configuration Change**:

```yaml
environment:
  - name: JWT_ALGORITHM
    value: "RS256"
```

**Migration Strategy**:

1. **Update resource servers** to fetch JWKS (most libraries do this automatically)
2. **Switch Uitsmijter** to `JWT_ALGORITHM=RS256`
3. **Wait for old tokens to expire** (typically 2 hours)
4. **Optionally remove** HS256 support after migration

**Backward Compatibility**:

During migration, SignerManager verifies **both HS256 and RS256 tokens**. This means:
- Existing tokens remain valid until expiration
- New tokens use RS256
- Resource servers work with both formats
- Full rollback capability if needed

No downtime. No service disruption. Just better security.

### 4. OpenID Connect Discovery Integration

Uitsmijter's OIDC Discovery endpoint (`/.well-known/openid-configuration`) now advertises your JWKS endpoint automatically.

**Multi-Tenant Support**:
- Tenant-specific issuer URLs
- Aggregated scopes and grant types per tenant
- Complete isolation between tenants

**Performance Optimizations**:
- HTTP caching headers (`Cache-Control: public, max-age=3600`)
- Clients cache public keys for 1 hour
- Reduced network overhead

**Standards Compliance**:

Works seamlessly with every major OAuth/OIDC library:
- `oidc-client-ts` (JavaScript/TypeScript)
- `jwks-rsa` (Node.js)
- `PyJWT` (Python)
- `golang-jwt` (Go)
- All standard implementations auto-discover and validate


## Technical Deep Dive

### Key Generation Specifications

Uitsmijter generates cryptographically strong RSA keys:

- **Key Size**: 2048-bit (RFC 7517 minimum, suitable for production)
- **Public Exponent**: 65537 (RSA_F4, industry standard)
- **Cryptographic Backend**: BoringSSL via Swift JWTKit
- **Format**: PKCS#8 for private keys, SPKI for public keys
- **Encoding**: Base64url encoding for JWK `n` (modulus) and `e` (exponent)


## Getting Started

### For New Deployments

Start with RS256 from day one:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: uitsmijter
spec:
  template:
    spec:
      containers:
      - name: uitsmijter
        image: uitsmijter/uitsmijter:0.10.0
        env:
        - name: JWT_ALGORITHM
          value: "RS256"
        - name: REDIS_HOST
          value: "redis-service"
        - name: ENVIRONMENT
          value: "production"
```

### Migrating Existing Deployments

**Step 1: Update Resource Servers**

Most libraries support JWKS automatically. For example, with `oidc-client-ts`:

```typescript
import { UserManager } from 'oidc-client-ts';

const userManager = new UserManager({
  authority: 'https://auth.example.com',
  client_id: 'your-client-id',
  // JWKS is auto-discovered from /.well-known/openid-configuration
});
```

**Step 2: Switch Uitsmijter to RS256**

Update your deployment configuration:

```bash
kubectl set env deployment/uitsmijter JWT_ALGORITHM=RS256
```

**Step 3: Monitor and Verify**

Check logs for successful key generation:

```
[INFO] Active key 2025-11-08 is being used for signing
[DEBUG] Signed token with RS256 using kid: 2025-11-08
```

Verify JWKS endpoint:

```bash
curl https://auth.example.com/.well-known/jwks.json
```

**Step 4: (Optional) Remove HS256 Support**

After all old tokens expire (2 hours by default), you can remove `JWT_SECRET` from your configuration.

### Resource Server Examples

**Node.js with jwks-rsa**:

```javascript
const jwksClient = require('jwks-rsa');
const jwt = require('jsonwebtoken');

const client = jwksClient({
  jwksUri: 'https://auth.example.com/.well-known/jwks.json',
  cache: true,
  cacheMaxAge: 3600000 // 1 hour
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    callback(null, key.getPublicKey());
  });
}

jwt.verify(token, getKey, options, (err, decoded) => {
  // Token is verified
});
```

**Python with PyJWT**:

```python
import jwt
from jwt import PyJWKClient

jwks_client = PyJWKClient('https://auth.example.com/.well-known/jwks.json')

def verify_token(token):
    signing_key = jwks_client.get_signing_key_from_jwt(token)
    data = jwt.decode(
        token,
        signing_key.key,
        algorithms=["RS256"],
        audience="your-client-id"
    )
    return data
```

## What's Next

JWKS and RS256 support is just one part of Uitsmijter 0.10. We're also working on:

- **Advanced rotation policies**: Custom rotation intervals and grace periods
- **Metrics integration**: Prometheus metrics for key usage and rotation events

Check out the [full 0.10 roadmap](https://articles.uitsmijter.io/2025-10-27_uitsmijter-0-10-roadmap/) for details.

## Resources & Community

Ready to upgrade? Here are the resources you need:

- 📚 **[JWT Algorithms Guide](https://docs.uitsmijter.io/configuration/jwt_algorithms/)** - Complete migration documentation
- 🔧 **[JWKS Endpoint Reference](https://docs.uitsmijter.io/oauth/endpoints/)** - Technical specifications
- 💬 **[Discuss on Discourse](http://discourse.uitsmijter.io)** - Ask questions and share experiences
- 🐙 **[GitHub Repository](https://github.com/uitsmijter/uitsmijter)** - Source code and issue tracking
- 🏠 **[Main Documentation](https://docs.uitsmijter.io)** - Complete guide to Uitsmijter

## Acknowledgments

Implementing JWKS support required deep integration across multiple RFCs and standards:

- **RFC 7517** (JSON Web Key) - Key format specifications
- **RFC 7518** (JSON Web Algorithms) - Cryptographic algorithms
- **RFC 8414** (OAuth 2.0 Authorization Server Metadata) - Discovery integration
- **OpenID Connect Discovery** - Automatic endpoint advertisement

Special thanks to:

- **Early adopters** who tested RS256 in production and provided feedback
- **Contributors** who reviewed the architecture and Redis schema design
- **The Swift community** for making Swift a excelent expirience 

This feature represents months of careful engineering to ensure production-grade reliability, security, and performance. We're committed to making Uitsmijter the most secure and scalable open-source OAuth/OIDC server.

---

**Uitsmijter 0.10 is available soon.** Release candidates are available via the `--devel` flad in helm:
```
$ helm search repo uitsmijter --versions --devel
uitsmijter/uitsmijter    0.10.0-rc54      rc-ce-0.10.0    
uitsmijter/uitsmijter    0.9.7            ce-0.9.7
``` 

Questions? Join the conversation on [Discourse](http://discourse.uitsmijter.io) or open an issue on [GitHub](https://github.com/uitsmijter/uitsmijter).
