---
author: Uitsmijter Team
title: "Uitsmijter 0.10.3: Dynamic Scope Assignment"
description: "Version 0.10.3 introduces provider-driven scope enrichment, enabling authentication providers to assign user-specific permissions dynamically during login."
date: 2025-12-14
draft: false
tags: ["Release", "OAuth", "Scopes", "Authorization", "Security"]
thumbnail:
  url: img/0_10_3.png
  author: ChatGPT
---

# Uitsmijter 0.10.3: Dynamic Scope Assignment

Imagine you're managing a software development platform with hundreds of users across different teams. Some users are project managers who need to view reports and manage team assignments. Others are developers who need to commit code and create issues. Your authentication system knows exactly who has permission to do what, stored in your user database or calculated from group memberships. But here's the problem: how do you get that information into the OAuth tokens your applications use for authorization?

Traditional OAuth implementations force you to make an uncomfortable choice. Either you request the same static set of scopes for everyone and build complex authorization logic into every application, or you create dozens of different OAuth clients with different scope configurations. Neither option feels right. What you really want is for the authentication system that already knows about user permissions to simply tell your applications what each user can do. That's exactly what Uitsmijter 0.10.3 makes possible.

## When Static Scopes Stop Working

OAuth scopes were designed to be straightforward. An application asks for specific permissions like "read your email" or "access your profile," the user sees what's being requested, and those permissions are encoded into a token. This model works beautifully for consumer applications where permissions are relatively simple and uniform. But enterprise applications are different. The same application might need completely different permissions depending on who's logging in. A project management tool doesn't just need "access projects," it needs to know whether you can create, edit, or delete them.

The traditional solution handles this mismatch outside the OAuth flow. Applications request a generic set of scopes during authentication, then make additional API calls to figure out what the user can actually do. They might query a permissions service or check group memberships. This works, but it means every application you build has to implement the same authorization logic. You end up with permissions checks scattered across dozens of services. When someone's role changes, you hope all those systems stay in sync.

Version 0.10.3 takes a different approach. Instead of keeping authentication and authorization logic separate, it lets your JavaScript authentication provider directly communicate user permissions through the OAuth flow. When someone logs in, your provider doesn't just return "this person is authenticated," it returns "this person is authenticated with these specific permissions." Those permissions flow through the OAuth process and end up encoded directly in the JWT token, where every application can see them.

## How Scope Enrichment Works

Your authentication provider knows more about the user than just their password. It knows their role, their group memberships, which projects they're assigned to, and any other information stored in your user directory. With provider scope enrichment, that knowledge continues through to authorization.

When you implement a JavaScript authentication provider in Uitsmijter, you write a class with methods that handle the login process. Version 0.10.3 adds the ability to return scopes. After authenticating credentials, your provider can include a `scopes` property in its response. This might be a simple list based on the user's role, or it might be calculated dynamically by querying a database or checking group memberships.

Consider our software development platform. When a project manager logs in, your provider authenticates their credentials, looks up their role, and returns scopes like `project:manage` and `team:view`. When a developer logs in with the same application, the same authentication code runs but returns `code:commit` and `issue:create` instead. The OAuth client application doesn't need to know anything about roles. It requests the scopes it needs, and Uitsmijter merges those requested scopes with the permissions your provider assigned.

This merging happens automatically and securely. Uitsmijter takes the scopes requested by the client and the scopes returned by your provider, filters both through security controls, and combines them into a final set that appears in the JWT token. Your applications can then make authorization decisions based on that `scope` claim without calling back to any service or implementing role-based logic themselves.

## Security Through Two-Tier Filtering

Allowing authentication providers to assign scopes raises important security questions. What prevents a misconfigured provider from assigning administrative scopes to everyone? How do you ensure that applications only receive the scopes they're supposed to work with? Version 0.10.3 addresses these concerns through a two-tier filtering system.

The first tier is the client scope configuration, which has existed in Uitsmijter since the beginning. When you configure an OAuth client, you specify which scopes that client is allowed to request. If your project management application is configured with scopes like `openid`, `email`, and `profile`, then users can only receive those scopes in their tokens. Even if the application tries to request `admin:all` or your provider tries to assign `delete:everything`, those scopes won't make it into the token because they're not on the client's whitelist.

The second tier is new in version 0.10.3: the `allowedProviderScopes` configuration field. This controls which scopes your authentication provider is permitted to add. When you configure a client with `allowedProviderScopes` set to `user:*` and `project:*`, you're saying this application can receive any user-related or project-related scopes that the provider assigns, but nothing else. If your provider tries to assign `admin:delete`, that scope gets filtered out because it doesn't match the allowed patterns.

Both filters apply independently before the final scope list is assembled. Client-requested scopes pass through the `scopes` whitelist, while provider-assigned scopes pass through the `allowedProviderScopes` whitelist. By default, if you don't configure `allowedProviderScopes` at all, clients simply don't receive any provider-assigned scopes. This ensures secure defaults while making the new capability available when you explicitly enable it.

## Wildcards and Flexible Permission Structures

Managing scope configurations would be tedious if you had to enumerate every possible permission value. In real-world systems, you might have scopes like `project:123:edit` or `team:engineering:manage` based on resource IDs or organizational structures. Maintaining explicit lists of all these possibilities isn't practical.

Both the `scopes` and `allowedProviderScopes` fields support wildcard patterns. When you configure `user:*`, you're allowing any scope that starts with `user:`, regardless of what comes after. The wildcard matching makes it practical to use fine-grained, resource-specific scopes without turning your client configuration into an unmanageable list.

This flexibility is particularly valuable in multi-tenant environments where resource IDs appear in scopes. Your provider can assign scopes that precisely describe what a user can do, like `project:research-alpha:edit` or `department:engineering:budget:view`, and your client configuration can allow entire categories of those scopes with simple wildcard patterns.

## Beyond Scopes: Additional Improvements

While provider scope enrichment is the headline feature, version 0.10.3 includes several other improvements. Traefik 3 is now supported by default, reflecting the latest version of the popular reverse proxy that Uitsmijter integrates with. Traefik 2 continues to work with a simple configuration flag.

The default index page now shows the logged-in user's profile information and includes a logout button. This makes a difference when testing authentication flows or demonstrating the system to stakeholders. You can see at a glance who's logged in and easily sign out to test different user scenarios.

For developers building custom login experiences, the `PageProperties` object available in login templates now includes a `requestedScopes` property. This provides the information needed to build OAuth consent screens where users can review permissions, should your use case require it.

## Getting Started

Adding provider scope enrichment to your deployment is straightforward. Start by updating your JavaScript authentication provider to return a `scopes` property from the login method. This can be as simple as returning a fixed list based on user roles, or as complex as running database queries to calculate permissions.

Next, update your Client resource configurations to include the `allowedProviderScopes` field. Start with specific patterns that match the scopes your provider assigns. If you're returning scopes like `user:list` and `user:create`, configure `allowedProviderScopes: ["user:*"]`. You can refine these patterns over time as you add more scopes.

Here's an example client configuration:

```yaml
apiVersion: uitsmijter.io/v1
kind: Client
metadata:
  name: my-app
spec:
  scopes: ["openid", "email", "profile"]
  allowedProviderScopes: ["user:*", "project:*"]
```

Once configured, scopes will automatically appear in the `scope` claim of JWT tokens. Your applications can read this claim and make authorization decisions based on its contents. Instead of calling back to a permissions API, they can simply check whether the token contains the scope they need.

## Looking Forward

Version 0.10.3 represents an evolution in how Uitsmijter handles authorization. By allowing authentication providers to directly communicate user permissions through the OAuth flow, it eliminates the gap between knowing who someone is and knowing what they're allowed to do. The two-tier filtering system ensures this capability doesn't compromise security while giving providers the flexibility to assign permissions dynamically.

This foundation opens up new possibilities for how you build and integrate applications. Instead of implementing authorization logic in every service, you can centralize permission calculations in your authentication provider. As your organization's permission model evolves, you update the provider logic once rather than modifying dozens of applications. The scope enrichment system in Uitsmijter 0.10.3 makes authorization as dynamic and centralized as authentication has always been.

## Resources

- [Documentation](https://docs.uitsmijter.io/)
- [GitHub Repository](https://github.com/uitsmijter/Uitsmijter)
- [Community Discussion](https://discourse.uitsmijter.io)
