---
author: Uitsmijter Team
title: "Uitsmijter 0.10.0: Foundation for the Future"
description: A major update bringing OpenID Connect Discovery, Swift 6.2, Redis High Availability, and a modernized architecture ready for advanced features. Building the foundation for next-generation OAuth2 capabilities.
date: 2025-10-27
draft: false
tags: ["release", "roadmap", "open-source", "swift-6", "openid-connect"]
thumbnail:
  url: img/0_10_0.png
  author: ChatGPT
---

# Uitsmijter 0.10.0: Foundation for the Future

**We're excited to announce Uitsmijter 0.10.0 - a release that lays the groundwork for powerful new capabilities. Over the past month, we've modernized our entire codebase, implemented highly requested features, and prepared the architecture to support advanced authentication and authorization features.**

## Building on Solid Ground

This release represents a significant milestone in Uitsmijter's evolution. We've invested heavily in modernizing the foundation - migrating to Swift 6.2, refactoring for scalability, and implementing production-ready infrastructure.

**Why this matters:** The architectural improvements in 0.10.0 create a robust platform ready to integrate advanced features. Your feedback has shaped our priorities, and we're building the foundation to deliver what you need.

## What's Coming in 0.10.0

### OpenID Connect Discovery 1.0

One of the most requested features is finally here! With full OpenID Connect Discovery support, your applications can now automatically discover Uitsmijter's capabilities and endpoints. No more manual configuration - just point your OAuth2 client to `/.well-known/openid-configuration` and you're ready to go.

**Multi-tenant support is built-in from day one.** Each tenant gets its own discovery configuration, making it perfect for SaaS applications serving multiple organizations.

### Swift 6.2: Performance Meets Safety

We've completed a full migration to Swift 6.2, bringing significant improvements to both performance and safety. **Better concurrency** is achieved through actor isolation, which ensures thread-safe operations without the traditional performance overhead of locks and semaphores. The actor model in Swift 6.2 allows us to write concurrent code that's both fast and safe, eliminating entire classes of bugs that plague traditional multi-threaded applications.

**Improved reliability** comes from Swift 6's strict concurrency checking, which catches potential race conditions at compile time rather than at runtime. This means you'll never encounter those hard-to-reproduce bugs that only show up under heavy load in production. The compiler ensures that data races are impossible, giving us confidence that our authentication system will behave predictably even under concurrent access from thousands of users.

**Faster execution** is the result of modern Swift optimizations that make your authentication flows complete quicker. Swift 6.2's enhanced optimizer understands actor isolation and can generate more efficient code for async operations. The result is lower latency for token generation, faster session validation, and quicker response times for your users. This isn't just about using the latest technology - it's about providing you with a robust, production-ready system that scales with your needs.

### Redis High Availability

Session management is critical for any authentication system. When your session storage goes down, your users can't log in, and active sessions become invalid - causing widespread disruption. That's why we've upgraded to Redis 8.2.2 with Sentinel support, bringing enterprise-grade reliability to Uitsmijter.

**Automatic failover** ensures your sessions survive Redis crashes without any manual intervention. Redis Sentinel continuously monitors your Redis instances and automatically promotes a replica to master when failures occur. Your users won't even notice the transition - active sessions remain valid, and new logins continue to work seamlessly.

**Zero startup blocking** is crucial for modern cloud deployments where pods are constantly being created and destroyed. The connection pool never blocks your application startup, even if Redis is temporarily unreachable. Uitsmijter starts immediately and establishes Redis connections in the background, ensuring your authentication service responds quickly to health checks and begins serving traffic without delay. This is essential for auto-scaling scenarios and rolling deployments.

**Graceful degradation** means DNS resolution failures are handled elegantly. In Kubernetes environments where DNS can be temporarily unavailable during network reconfigurations, Uitsmijter continues to operate using cached connections. The system logs the issue for debugging but doesn't crash or refuse to start.

**Memory-Only** as default Sentinel configuration makes installation simple and fast. You don't need to provision persistent volumes or configure Redis snapshots to get started. The default setup works out of the box for development and testing, while still supporting persistent storage configurations for production environments that require session durability across complete cluster restarts.

**Redis Sentinel** provides high-availability session management that survives individual Redis instance failures. Your session data is replicated across multiple Redis instances, and Sentinel automatically handles failover when problems occur. This eliminates the single point of failure that session storage typically represents. Combined with Redis persistence options, you can ensure session durability across complete cluster restarts if needed.


### Cloud-Native Architecture

Uitsmijter is built from the ground up for modern cloud environments:

**Kubernetes Integration**

Uitsmijter speaks Kubernetes natively. **Custom Resource Definitions (CRDs)** allow you to manage tenants and clients as native Kubernetes resources, integrating seamlessly with your GitOps workflows. Define your authentication configuration in YAML alongside your other Kubernetes manifests, and let your CI/CD pipeline handle deployment. This means your authentication configuration is versioned, auditable, and deployed using the same tools and processes as the rest of your infrastructure.

**Automatic retry logic** ensures reliable configuration loading even in challenging network conditions. When Uitsmijter starts up or watches for configuration changes, it automatically retries failed operations with exponential backoff. This is crucial during cluster initialization when the Kubernetes API server might be under heavy load, or during network partitions when communication is temporarily disrupted. Your authentication service will eventually become consistent without manual intervention.

**Hot-reload capabilities** mean configuration changes happen without restarts. When you update a tenant's login template or modify a client's redirect URIs, Uitsmijter detects the change and reloads only the affected configuration. Running sessions remain valid, active logins aren't interrupted, and there's no service disruption. This is essential for multi-tenant SaaS platforms where different customers need configuration updates at different times.

**Production-ready deployment** comes through comprehensive Helm charts that encode best practices for running Uitsmijter in production. The charts include sensible defaults for resource limits, health checks, security contexts, and scaling configurations. You can deploy a production-ready authentication system with a single `helm install` command, then customize the configuration to match your specific requirements. Visit the [helm charts](https://charts.uitsmijter.io)

**Observability & Operations**

Understanding what's happening in your authentication system is crucial for maintaining reliability. **Prometheus metrics** provide comprehensive monitoring of all critical aspects of Uitsmijter's operation. Track authentication success rates, token generation latency, session counts, Redis connection health, and JavaScript provider execution times. These metrics integrate seamlessly with your existing Prometheus infrastructure, allowing you to create dashboards, set up alerts, and understand usage patterns. When something goes wrong, you'll know immediately - and you'll have the data to diagnose the problem.

**NDJSON structured logging** ensures your logs work seamlessly with modern log aggregation tools like Elasticsearch, Loki, or CloudWatch. Each log entry is a valid JSON object containing structured fields for correlation IDs, tenant information, user identifiers, and error details. This means you can search for "all failed login attempts for tenant X in the last hour" or "all errors from the JavaScript provider" with simple queries. No more parsing unstructured log messages with brittle regular expressions.

**Health checks** enable proper orchestrator integration, whether you're using Kubernetes, Docker Swarm, or another container orchestrator. Uitsmijter exposes both liveness and readiness probes that accurately reflect the service's health. The readiness probe ensures traffic isn't routed to an instance until Redis connectivity is established and configuration is loaded. The liveness probe detects deadlocks or resource exhaustion and triggers automatic restarts. This integration ensures your load balancer only sends traffic to healthy instances.

**Graceful degradation** means the system continues to operate as best it can during failure scenarios. If Redis becomes temporarily unreachable, Uitsmijter logs the issue and continues processing requests that don't require session storage. If a tenant's JavaScript provider script has errors, only that tenant is affected while others continue to work normally. If S3 template loading fails, Uitsmijter falls back to default templates. This fault isolation prevents cascading failures and maintains availability even during partial system degradation.

**Storage Flexibility**

Different deployment scenarios require different storage strategies, and Uitsmijter supports them all. **S3-compatible storage** enables you to store custom login templates in object storage, making them accessible across all instances without shared filesystem requirements. Upload a new template to S3, and all Uitsmijter instances automatically use it within seconds. This works with Amazon S3, MinIO, Google Cloud Storage, Azure Blob Storage, or any S3-compatible service. It's perfect for multi-region deployments where you need consistent templates across geographical locations.

**File-based configurations** support traditional deployments where you prefer to manage configuration files directly on disk. Mount your configuration directory via ConfigMaps in Kubernetes, or use traditional file systems in VM-based deployments. This approach works well for simpler deployments, development environments, or when you already have file distribution infrastructure in place. Changes are detected automatically through file system monitoring, triggering hot-reloads without service restarts.

**Multi-tenant architecture** scales from a single tenant to thousands without architectural changes. Each tenant has isolated configuration, custom templates, and separate authentication flows. Add new tenants dynamically without redeployment. The architecture handles variable load across tenants efficiently - a small tenant doesn't impact a large tenant's performance, and you can scale horizontally by adding more instances as your tenant count grows.

Whether you're running on AWS, GCP, Azure, or your own Kubernetes cluster, Uitsmijter adapts to your infrastructure.

---

## For Production Users

### Upgrading to 0.10.0

**What You Get:**

**Rock-solid stability** comes from 170+ commits dedicated to hardening and bug fixes. We've eliminated race conditions in S3 template loading, resolved MainActor deadlocks in entity loading, improved PKCE validation flow, and enhanced error handling throughout the codebase. The test suite has been expanded and stabilized, catching edge cases before they reach production.

**Performance improvements** are woven throughout the codebase thanks to Swift 6.2 optimizations. Token generation is faster, session validation has lower latency, and concurrent request handling is more efficient. The actor-based architecture eliminates lock contention that previously caused slowdowns under high load. JavaScript provider execution benefits from improved memory management and caching strategies. Your users will notice the difference - faster logins, quicker redirects, and more responsive authentication flows.

**Enhanced capabilities** bring professional-grade features to your authentication infrastructure. OpenID Connect Discovery eliminates manual configuration for OAuth2 clients. Redis High Availability ensures sessions survive infrastructure failures. Comprehensive monitoring through Prometheus metrics gives you visibility into every aspect of system operation. Structured logging makes troubleshooting straightforward.

**Future-ready architecture** means the foundation is prepared for advanced features. The migration to Swift 6.2 with full concurrency support enables us to implement sophisticated features. The application structure makes it straightforward to add new authentication methods.

**Migration Path:**
Uitsmijter 0.10.0 maintains backward compatibility with existing configurations. Your tenant and client definitions work as-is, with optional new features available when you need them.


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

Full documentation available at [docs.uitsmijter.io](https://docs.uitsmijter.io)
The official helm charts are available at [https://charts.uitsmijter.io](https://charts.uitsmijter.io)

[The release branch will soon be publicly available](https://github.com/uitsmijter/uitsmijter)!

## A Note of Gratitude

This release represents countless hours of work, testing, and refinement. We want to thank:
- **Our early adopters**: Your bug reports and feedback shaped this release
- **Contributors**: Every PR, no matter how small, makes a difference
- **The Swift community**: Standing on the shoulders of Vapor, SwiftNIO, and amazing open-source tools
- **Our corporate customers** turn to us to discuss useful features and work with us to implement them.

## Join the Conversation

- **GitHub**: [github.com/uitsmijter/uitsmijter](https://github.com/uitsmijter/uitsmijter)
- **Documentation**: [docs.uitsmijter.io](https://docs.uitsmijter.io)
- **Issues & Feature Requests**: [GitHub Issues](https://github.com/uitsmijter/uitsmijter/issues)

---

*Uitsmijter 0.10.0 will be released in the coming weeks. Follow our GitHub repository for updates and release announcements.*
