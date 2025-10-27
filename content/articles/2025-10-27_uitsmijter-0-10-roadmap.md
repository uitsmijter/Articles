---
author: Uitsmijter Team
title: "Uitsmijter 0.10.0: Foundation for the Future"
description: A major update bringing OpenID Connect Discovery, Swift 6.2, Redis High Availability, and a modernized architecture ready for advanced features. Building the foundation for next-generation OAuth2 capabilities.
date: 2025-10-27
draft: false
tags: ["release", "roadmap", "open-source", "swift-6", "openid-connect"]
thumbnail:
  url:
  author:
---

# Uitsmijter 0.10.0: Foundation for the Future

We're excited to announce Uitsmijter 0.10.0 - a transformative release that lays the groundwork for powerful new capabilities. Over the past month, we've modernized our entire codebase, implemented highly requested features, and prepared the architecture to support advanced authentication and authorization features.

## Building on Solid Ground

This release represents a significant milestone in Uitsmijter's evolution. We've invested heavily in modernizing the foundation - migrating to Swift 6.2, refactoring for scalability, and implementing production-ready infrastructure. This isn't just about what's in 0.10.0; it's about what this foundation enables us to build next.

**Why this matters:** The architectural improvements in 0.10.0 create a robust platform ready to integrate advanced features. Your feedback has shaped our priorities, and we're building the foundation to deliver what you need.

## What's Coming in 0.10.0

### OpenID Connect Discovery 1.0

One of the most requested features is finally here! With full OpenID Connect Discovery support, your applications can now automatically discover Uitsmijter's capabilities and endpoints. No more manual configuration - just point your OAuth2 client to `/.well-known/openid-configuration` and you're ready to go.

**Multi-tenant support built-in from day one.** Each tenant gets its own discovery configuration, making it perfect for SaaS applications serving multiple organizations.

### Swift 6.2: Performance Meets Safety

We've completed a full migration to Swift 6.2, bringing significant improvements to both performance and safety. **Better concurrency** is achieved through actor isolation, which ensures thread-safe operations without the traditional performance overhead of locks and semaphores. The actor model in Swift 6.2 allows us to write concurrent code that's both fast and safe, eliminating entire classes of bugs that plague traditional multi-threaded applications.

**Improved reliability** comes from Swift 6's strict concurrency checking, which catches potential race conditions at compile time rather than at runtime. This means you'll never encounter those hard-to-reproduce bugs that only show up under heavy load in production. The compiler ensures that data races are impossible, giving you confidence that your authentication system will behave predictably even under concurrent access from thousands of users.

**Faster execution** is the result of modern Swift optimizations that make your authentication flows complete quicker. Swift 6.2's enhanced optimizer understands actor isolation and can generate more efficient code for async operations. The result is lower latency for token generation, faster session validation, and quicker response times for your users. This isn't just about using the latest technology - it's about providing you with a robust, production-ready system that scales with your needs.

### Redis High Availability

Session management is critical for any authentication system. When your session storage goes down, your users can't log in, and active sessions become invalid - causing widespread disruption. That's why we've upgraded to Redis 8.2.2 with Sentinel support, bringing enterprise-grade reliability to Uitsmijter.

**Automatic failover** ensures your sessions survive Redis crashes without any manual intervention. Redis Sentinel continuously monitors your Redis instances and automatically promotes a replica to master when failures occur. Your users won't even notice the transition - active sessions remain valid, and new logins continue to work seamlessly. This means no more 3 AM emergency calls because Redis went down.

**Zero startup blocking** is crucial for modern cloud deployments where pods are constantly being created and destroyed. The connection pool never blocks your application startup, even if Redis is temporarily unreachable. Uitsmijter starts immediately and establishes Redis connections in the background, ensuring your authentication service responds quickly to health checks and begins serving traffic without delay. This is essential for auto-scaling scenarios and rolling deployments.

**Graceful degradation** means DNS resolution failures are handled elegantly. In Kubernetes environments where DNS can be temporarily unavailable during network reconfigurations, Uitsmijter continues to operate using cached connections. The system logs the issue for debugging but doesn't crash or refuse to start.

**Memory-Only** as default Sentinel configuration makes installation simple and fast. You don't need to provision persistent volumes or configure Redis snapshots to get started. The default setup works out of the box for development and testing, while still supporting persistent storage configurations for production environments that require session durability across complete cluster restarts.


### Cloud-Native Architecture

Uitsmijter is built from the ground up for modern cloud environments:

**Kubernetes Integration**

Uitsmijter speaks Kubernetes natively. **Custom Resource Definitions (CRDs)** allow you to manage tenants and clients as native Kubernetes resources, integrating seamlessly with your GitOps workflows. Define your authentication configuration in YAML alongside your other Kubernetes manifests, and let your CI/CD pipeline handle deployment. This means your authentication configuration is versioned, auditable, and deployed using the same tools and processes as the rest of your infrastructure.

**Automatic retry logic** ensures reliable configuration loading even in challenging network conditions. When Uitsmijter starts up or watches for configuration changes, it automatically retries failed operations with exponential backoff. This is crucial during cluster initialization when the Kubernetes API server might be under heavy load, or during network partitions when communication is temporarily disrupted. Your authentication service will eventually become consistent without manual intervention.

**Hot-reload capabilities** mean configuration changes happen without restarts. When you update a tenant's login template or modify a client's redirect URIs, Uitsmijter detects the change and reloads only the affected configuration. Running sessions remain valid, active logins aren't interrupted, and there's no service disruption. This is essential for multi-tenant SaaS platforms where different customers need configuration updates at different times.

**Production-ready deployment** comes through comprehensive Helm charts that encode best practices for running Uitsmijter in production. The charts include sensible defaults for resource limits, health checks, security contexts, and scaling configurations. You can deploy a production-ready authentication system with a single `helm install` command, then customize the configuration to match your specific requirements.

**Observability & Operations**

Understanding what's happening in your authentication system is crucial for maintaining reliability. **Prometheus metrics** provide comprehensive monitoring of all critical aspects of Uitsmijter's operation. Track authentication success rates, token generation latency, session counts, Redis connection health, and JavaScript provider execution times. These metrics integrate seamlessly with your existing Prometheus infrastructure, allowing you to create dashboards, set up alerts, and understand usage patterns. When something goes wrong, you'll know immediately - and you'll have the data to diagnose the problem.

**NDJSON structured logging** ensures your logs work seamlessly with modern log aggregation tools like Elasticsearch, Loki, or CloudWatch. Each log entry is a valid JSON object containing structured fields for correlation IDs, tenant information, user identifiers, and error details. This means you can search for "all failed login attempts for tenant X in the last hour" or "all errors from the JavaScript provider" with simple queries. No more parsing unstructured log messages with brittle regular expressions.

**Health checks** enable proper orchestrator integration, whether you're using Kubernetes, Docker Swarm, or another container orchestrator. Uitsmijter exposes both liveness and readiness probes that accurately reflect the service's health. The readiness probe ensures traffic isn't routed to an instance until Redis connectivity is established and configuration is loaded. The liveness probe detects deadlocks or resource exhaustion and triggers automatic restarts. This integration ensures your load balancer only sends traffic to healthy instances.

**Graceful degradation** means the system continues to operate as best it can during failure scenarios. If Redis becomes temporarily unreachable, Uitsmijter logs the issue and continues processing requests that don't require session storage. If a tenant's JavaScript provider script has errors, only that tenant is affected while others continue to work normally. If S3 template loading fails, Uitsmijter falls back to default templates. This fault isolation prevents cascading failures and maintains availability even during partial system degradation.

**Storage Flexibility**

Different deployment scenarios require different storage strategies, and Uitsmijter supports them all. **S3-compatible storage** enables you to store custom login templates in object storage, making them accessible across all instances without shared filesystem requirements. Upload a new template to S3, and all Uitsmijter instances automatically use it within seconds. This works with Amazon S3, MinIO, Google Cloud Storage, Azure Blob Storage, or any S3-compatible service. It's perfect for multi-region deployments where you need consistent templates across geographical locations.

**File-based configurations** support traditional deployments where you prefer to manage configuration files directly on disk. Mount your configuration directory via ConfigMaps in Kubernetes, or use traditional file systems in VM-based deployments. This approach works well for simpler deployments, development environments, or when you already have file distribution infrastructure in place. Changes are detected automatically through file system monitoring, triggering hot-reloads without service restarts.

**Redis Sentinel** provides high-availability session management that survives individual Redis instance failures. Your session data is replicated across multiple Redis instances, and Sentinel automatically handles failover when problems occur. This eliminates the single point of failure that session storage typically represents. Combined with Redis persistence options, you can ensure session durability across complete cluster restarts if needed.

**Multi-tenant architecture** scales from a single tenant to thousands without architectural changes. Each tenant has isolated configuration, custom templates, and separate authentication flows. Add new tenants dynamically without redeployment. The architecture handles variable load across tenants efficiently - a small tenant doesn't impact a large tenant's performance, and you can scale horizontally by adding more instances as your tenant count grows.

Whether you're running on AWS, GCP, Azure, or your own Kubernetes cluster, Uitsmijter adapts to your infrastructure.

---

## For Production Users

### Upgrading to 0.10.0

**What You Get:**

**Rock-solid stability** comes from 170+ commits dedicated to hardening and bug fixes. We've eliminated race conditions in S3 template loading, resolved MainActor deadlocks in entity loading, improved PKCE validation flow, and enhanced error handling throughout the codebase. The test suite has been expanded and stabilized, catching edge cases before they reach production. This isn't just about adding features - it's about ensuring the features you already rely on work flawlessly under all conditions.

**Performance improvements** are woven throughout the codebase thanks to Swift 6.2 optimizations. Token generation is faster, session validation has lower latency, and concurrent request handling is more efficient. The actor-based architecture eliminates lock contention that previously caused slowdowns under high load. JavaScript provider execution benefits from improved memory management and caching strategies. Your users will notice the difference - faster logins, quicker redirects, and more responsive authentication flows.

**Enhanced capabilities** bring professional-grade features to your authentication infrastructure. OpenID Connect Discovery eliminates manual configuration for OAuth2 clients. Redis High Availability ensures sessions survive infrastructure failures. Comprehensive monitoring through Prometheus metrics gives you visibility into every aspect of system operation. Structured logging makes troubleshooting straightforward. These aren't optional extras - they're production essentials that come standard with Uitsmijter 0.10.0.

**Future-ready architecture** means the foundation is prepared for advanced features. The migration to Swift 6.2 with full concurrency support enables us to implement sophisticated features like distributed tracing, policy-as-code authorization, and zero-trust patterns. The actor-based design allows for advanced caching strategies and performance optimizations. The modular structure makes it straightforward to add new authentication methods like WebAuthn and passkeys. This release isn't just about today - it's about having a platform that grows with your needs.

**Migration Path:**
Uitsmijter 0.10.0 maintains backward compatibility with existing configurations. Your tenant and client definitions work as-is, with optional new features available when you need them.

### Why Choose Uitsmijter

**For SaaS Platforms:**

If you're building a SaaS platform serving multiple customers, Uitsmijter's multi-tenant architecture is built-in from day one - not retrofitted as an afterthought. Each tenant gets complete isolation: their own login pages, their own authentication flows, their own branding, and their own security configuration. You can offer white-label authentication where each customer sees only their own branding, never yours.

Per-tenant customization means each customer can have login pages that match their brand identity perfectly. Custom HTML templates, CSS styling, JavaScript behavior - all configurable per tenant. One customer might want a simple username/password form, another might need multi-factor authentication with SMS codes, and a third might require SAML federation with their corporate directory. Uitsmijter handles all these scenarios simultaneously without configuration conflicts or security boundaries being crossed.

Isolation and security between tenants is enforced at the architectural level, not just through configuration. Tenant A's users can never authenticate as Tenant B's users. Session data is segregated. Configuration changes for one tenant can't affect another. A security vulnerability in Tenant A's custom JavaScript provider doesn't expose Tenant B's users. This isolation is critical for maintaining trust in multi-tenant environments.

Scale from one to thousands of tenants without architectural changes or performance degradation. Add new tenants dynamically through the API or CRDs - no deployment required. The system handles the variable load efficiently: a small tenant with 10 users doesn't subsidize a large tenant with 100,000 users. Horizontal scaling works naturally: add more Uitsmijter instances, and they'll automatically serve all tenants through shared Redis session storage and configuration loading.

**For Kubernetes Environments:**

Uitsmijter embraces Kubernetes as a first-class deployment target. Native CRD support means you define tenants and clients as Kubernetes resources using `kubectl apply`. This integrates perfectly with GitOps workflows using tools like ArgoCD or Flux. Your authentication configuration lives in git alongside your application manifests, gets reviewed through pull requests, and deploys through your existing CI/CD pipelines. Rollback a bad configuration change? Just `kubectl rollback`. Want to know who changed what and when? Check your git history.

Helm charts provide production deployment best practices out of the box. Resource limits prevent runaway memory usage. Security contexts follow the principle of least privilege. Health checks ensure traffic only routes to ready instances. Pod disruption budgets maintain availability during cluster maintenance. Anti-affinity rules spread instances across nodes for fault tolerance. You don't need to be a Kubernetes expert to deploy Uitsmijter securely - the charts encode that expertise for you.

Horizontal scaling with session replication works seamlessly. Set your desired replica count, and Kubernetes maintains that many instances. All instances share session state through Redis, so users can be load-balanced across instances without sticky sessions. Scale up to handle traffic spikes, scale down to save resources during quiet periods. The stateless architecture means new instances are immediately ready to serve traffic - no warm-up period required.

Cloud-provider agnostic design means you're not locked into a specific platform. Deploy on AWS EKS, Google GKE, Azure AKS, DigitalOcean Kubernetes, or self-managed clusters - Uitsmijter works the same everywhere. Use your cloud provider's load balancer, object storage, and Redis offerings, or bring your own. This flexibility protects you from vendor lock-in and allows you to optimize costs by choosing the best infrastructure for your needs.

**For Security-Conscious Organizations:**

Security through transparency is fundamental to Uitsmijter's design. Open source means you can audit every line of code - no black boxes, no hidden backdoors, no proprietary algorithms you have to trust blindly. Your security team can review the authentication flows, verify the cryptographic implementations, and understand exactly how tokens are generated and validated. When a security researcher discovers a vulnerability, you can see the fix and understand its implications before deploying. Compliance audits become straightforward when auditors can examine the source code directly.

Modern OAuth2 and OpenID Connect standards ensure you're following industry best practices for authentication. We implement the latest security recommendations including PKCE for authorization code flows, proper state parameter handling to prevent CSRF attacks, and secure token storage. OpenID Connect Discovery makes it easy to integrate with standard-compliant OAuth2 clients without custom configuration. Support for multiple token types (access tokens, refresh tokens, ID tokens) gives you flexibility in implementing appropriate security models for different use cases.

The extensible provider system integrates with your existing user database without forcing you to migrate data. Whether you use PostgreSQL, MongoDB, LDAP, Active Directory, or a custom REST API for user authentication, Uitsmijter connects through JavaScript providers you control. Your credentials stay in your database, protected by your existing security controls. You can implement custom authentication logic like checking if accounts are locked, enforcing password complexity, or requiring additional verification steps - all through provider scripts you write and audit.

Active security maintenance means vulnerabilities get fixed quickly and transparently. When dependencies have security updates, we update promptly and communicate the changes. The release notes clearly describe security-relevant changes so you can assess impact. The community reports issues through public GitHub issues, allowing transparent discussion of security concerns and fixes. Regular updates keep you protected against emerging threats without waiting for vendor support cycles.

---

## For Developers

### Improved Development Experience

**Test Filtering Made Easy**
```bash
# Run specific unit tests
./tooling.sh test ServerTests

# Filter e2e tests by scenario
./tooling.sh e2e --filter "login"

# Combine with fast mode for rapid iteration
./tooling.sh e2e --dirty --fast --filter "OAuth"
```

**Better Documentation**

Documentation makes the difference between a system you can maintain and one that becomes a black box over time. Comprehensive DocC comments throughout the codebase explain not just what code does, but why it's implemented that way. When you're debugging an issue at 2 AM, these comments help you understand the context and reasoning behind design decisions without needing to reverse-engineer the entire system.

Understanding the "why" behind architectural decisions helps you extend Uitsmijter safely. Why do we use actors for JavaScriptProvider? Because JavaScript execution isn't thread-safe. Why does EntityStorage use a singleton pattern? Because we need consistent entity state across all request handlers. Why do we reload templates on file changes? Because hot-reload eliminates deployment cycles during template development. This context prevents well-intentioned changes that break subtle invariants.

API documentation generated from source stays in sync with the code because it is the code. Add a new parameter to a function? The documentation updates automatically. Change a return type? The docs reflect it immediately. No more documentation that describes code from three versions ago. Developers can trust the documentation because it's generated from the same source code they're working with.

Developer guides for common tasks accelerate onboarding and reduce mistakes. How do you add a new OAuth2 flow? There's a guide. Need to implement a custom provider? Follow the step-by-step instructions. Want to add metrics for a new subsystem? The guide shows you the pattern. These guides capture tribal knowledge that otherwise lives only in senior developers' heads, making the entire team more productive.

**Enhanced Tooling**

Developer velocity matters. Faster incremental builds mean the compile-test-debug cycle completes quickly, keeping you in flow state rather than waiting for compilation. We've optimized module boundaries to minimize rebuild cascades - changing a test file doesn't trigger a complete rebuild of the entire project. Docker layer caching ensures container builds reuse unchanged layers. The `--dirty` flag for local development skips unnecessary rebuild steps, getting you from code change to running system in seconds rather than minutes.

Improved test isolation eliminates frustrating flaky tests that pass individually but fail in the suite. Tests no longer depend on execution order or shared global state. Each test gets clean fixtures and teardown cleans up properly. The test filtering system lets you run just the tests relevant to your changes, making TDD practical even in a large test suite. Parallel execution means the full test suite completes quickly, encouraging developers to run tests frequently.

CI-friendly reproducible builds give you confidence that passing tests locally will pass in CI. The build process is deterministic - same inputs always produce the same outputs. Docker-based builds ensure consistent tooling versions across all environments. The build doesn't depend on global state or ambient configuration. Integration with GitHub Actions provides clear test reports and failure messages. This reliability eliminates "works on my machine" scenarios and makes CI/CD trustworthy.

Comprehensive test coverage ensures changes don't inadvertently break existing functionality. Unit tests validate individual components in isolation. Integration tests verify subsystems work together correctly. End-to-end tests confirm complete authentication flows work from a user's perspective. The test suite catches regressions before they reach production, giving you confidence to refactor and improve code without fear of breaking things.

### Technical Deep Dive

For those who love the details, here's what's happening under the hood:

**Architecture Modernization**

The shift to actor-based concurrency represents a fundamental improvement in system reliability. **JavaScriptProvider** has been converted to an actor, ensuring thread-safe execution of JavaScript code. Previously, concurrent requests could interfere with each other's JavaScript context, causing subtle bugs that were nearly impossible to reproduce. Now, the actor model guarantees each JavaScript execution happens in isolation, with Swift's compiler enforcing these boundaries. This eliminates entire classes of race conditions without the performance overhead of traditional locks.

**AuthCodeStorage** is now an actor with improved garbage collection of expired authorization codes and sessions. The previous implementation could experience race conditions during cleanup operations, occasionally causing valid sessions to be removed prematurely or expired sessions to linger. The actor-based design ensures cleanup operations serialize properly with storage and retrieval operations. Metrics collection happens asynchronously without blocking storage operations, improving throughput under high load.

Full Swift 6.2 concurrency adoption means we're using async/await throughout the codebase instead of callback-based patterns. This makes code dramatically more readable - authentication flows read like procedural code rather than nested callbacks. Error handling is straightforward with try/catch rather than result type propagation. The compiler's strict concurrency checking catches data races at compile time, preventing bugs that would only show up under heavy production load. This isn't just cleaner code - it's more reliable code.

Zero compiler warnings and zero SwiftLint violations demonstrate our commitment to code quality. Every warning represents a potential bug or maintenance issue. We've addressed every single one, either fixing the underlying issue or explicitly documenting why the code is correct. SwiftLint enforces consistent style and catches common mistakes like force unwrapping optionals without nil checks. This discipline makes the codebase easier to maintain and reduces cognitive load when reading code - you can focus on business logic rather than deciphering different coding styles.

**Stability Improvements** (170+ commits)

Stability comes from addressing the subtle bugs that only appear under production load. We fixed race conditions in S3 template loading where multiple instances could simultaneously attempt to download the same template, causing connection pool exhaustion and timeouts. The fix introduces request coalescing - when multiple requests need the same template, only one download happens and all requests share the result. This dramatically reduces S3 API calls and eliminates the race condition.

We resolved MainActor deadlocks in entity loading that caused the application to hang during startup when configuration contained circular references or when the Kubernetes API was slow to respond. The issue stemmed from entity loading code trying to update UI-related state on the MainActor while also performing blocking network operations. The fix separates network operations (which can block) from state updates (which must be quick) and ensures proper async boundaries. Now entity loading completes reliably even under challenging conditions.

Improved PKCE validation flow addresses a subtle timing issue where valid PKCE challenges could be rejected if the token request arrived within milliseconds of the authorization code being issued. The problem was a race condition in how we stored and retrieved PKCE verifiers. The fix uses atomic operations and proper sequencing to ensure the verifier is always available when needed, eliminating spurious authentication failures that confused users and degraded the login experience.

Eliminated flaky tests through better isolation, ensuring the test suite provides reliable signals about code quality. We identified tests that relied on shared global state or timing assumptions, then refactored them to use proper fixtures and explicit synchronization. Tests that were intermittently failing due to parallel execution now pass consistently. This means CI/CD pipelines are trustworthy - a test failure indicates a real problem, not a flaky test that will pass on retry.

Enhanced error handling throughout the codebase means errors are caught early, logged with context, and handled gracefully. Instead of crashing on unexpected input, Uitsmijter logs the error with relevant details (tenant ID, client ID, request ID) and returns an appropriate error response to the client. This makes debugging production issues straightforward - the logs contain everything needed to understand what went wrong - and prevents cascading failures where one component's error crashes the entire system.

## The Road Ahead

With the foundation in place, we're ready to build powerful new capabilities. 
Please [discuss](http://discourse.uitsmijter.io) with us your needs

## We Need Your Input

Here's how you can help shape Uitsmijter's roadmap:

1. **Tell us your use case**: What are you trying to solve? What's missing?
2. **Share your pain points**: What's hard? What's confusing?
3. **Contribute**: Code, documentation, bug reports - all welcome
4. **Spread the word**: Help others discover open-source OAuth2 that actually works

## Getting Started with 0.10.0

Ready to try it? Here's the quickest path:

```bash
# Clone the repository
git clone https://github.com/uitsmijter/uitsmijter-ce
cd uitsmijter-ce

# Run it locally
./tooling.sh run

# Or deploy to Kubernetes
helm install uitsmijter ./Deployment/helm/uitsmijter
```

Full documentation available at [docs.uitsmijter.io](https://docs.uitsmijter.io)
The official helm charts are available at [https://charts.uitsmijter.io](https://charts.uitsmijter.io)

## A Note of Gratitude

This release represents countless hours of work, testing, and refinement. We want to thank:
- **Our early adopters**: Your bug reports and feedback shaped this release
- **Contributors**: Every PR, no matter how small, makes a difference
- **The Swift community**: Standing on the shoulders of Vapor, SwiftNIO, and amazing open-source tools
- **Our Enterprise customes** to adress useful funcionallity and work with us implementing them.

## Join the Conversation

- **GitHub**: [github.com/uitsmijter/uitsmijter-ce](https://github.com/uitsmijter/uitsmijter-ce)
- **Documentation**: [docs.uitsmijter.io](https://docs.uitsmijter.io)
- **Issues & Feature Requests**: [GitHub Issues](https://github.com/uitsmijter/uitsmijter-ce/issues)

---

*Uitsmijter 0.10.0 will be released in the coming weeks. Follow our GitHub repository for updates and release announcements.*
