---
author: Uitsmijter Team
title: "Built Cloud-Native from Day One: Why We Rewrote SSO from Scratch"
description: "After decades in IT, a few years ago we broke the cardinal rule and built an SSO server from the ground up. Here's why existing solutions didn't fit our needs, and what we learned from rethinking authentication for the Kubernetes-era."
date: 2025-11-27
draft: false
tags: ["Kubernetes", "Cloud-Native", "Architecture", "DevOps", "SSO"]
thumbnail:
  url: img/easy.png
  author: Uitsmijter
---

## Why We Built This from Scratch

Here's something unusual: after decades in IT and software development, you learn one cardinal rule: **don't reinvent the wheel**. Use existing solutions. Stand on the shoulders of giants. Build with proven libraries and frameworks.

So why did we build an SSO server from the ground up?

Because when we looked at the landscape of existing solutions, we couldn't find what we needed. Every option we evaluated was designed in the pre-CNCF era, before Kubernetes became the infrastructure standard, before GitOps workflows, before the cloud-native patterns we now expect from production systems.

The existing solutions were built for a different world. One where authentication meant proprietary admin panels, custom monitoring dashboards, and integration APIs that felt like afterthoughts. They were trying to retrofit cloud-native capabilities onto architectures designed for a bygone era. You can't truly think cloud-native when your foundation was laid before the CNCF existed.

We needed to rethink everything. Not just the OAuth flows or the JWT signing algorithms, but the entire philosophy of what an SSO server should be in a Kubernetes-first world.

That meant making hard decisions that went against conventional wisdom. Like not building a UI. Like making kubectl the primary interface. Like forcing ourselves (and our users) to treat the console and CI/CD pipelines as first-class citizens, not nice-to-haves.

With Uitsmijter 0.10.2's **native Kubernetes tenant status monitoring**, you can see why those decisions matter.

## What Cloud-Native SSO Looks Like

When we set out to rebuild SSO from scratch, we had a clear goal: authentication should work like any other Kubernetes workload. No complex dashboards. No custom monitoring tools. Just integration with the platform you're already using.

Have you ever tried to configure most SSO solutions in an automated CI/CD pipeline? It's painful. Installing plugins through custom package managers. Patching resources with proprietary scripts. Managing realms via REST APIs that weren't designed for declarative configuration. Maintaining separate Terraform modules or Bicep scripts just to keep your authentication infrastructure in sync with your application deployments.

We wanted something simpler. Configuration in Kubernetes YAML. Deployments through the same GitOps workflows we use for applications. Monitoring through the same kubectl commands we already know. No special tooling, no proprietary CLIs, no custom scripts.

This isn't a feature request or a nice-to-have. It's a fundamental architectural principle that shapes every line of code we write.

## Before: The Visibility Gap

Managing multi-tenant SSO in Kubernetes meant working blind. You could see that your tenants existed, but critical operational questions went unanswered:

```bash
$ kubectl get tenants
NAME   AGE
acme   5d
shop   3d
api    2d
```

How many users are logged in to each tenant? Which tenants have active sessions? How many OAuth clients does each tenant serve? You'd need custom scripts, external monitoring tools, or database queries to answer basic operational questions.

This isn't what cloud-native should feel like. In this case, we were falling short of our own vision. Until now.

## After: Operational Clarity

Now, the information you need is right where you expect it:

```bash
$ kubectl get tenants
NAME   STATUS   CLIENTS   SESSIONS   AGE
acme   Ready    3         42         5d
shop   Ready    1         8          3d
api    Ready    5         0          2d
```

Everything you need at a glance. Active sessions tell you real usage. Client counts show your OAuth ecosystem. Status indicates health. All standard Kubernetes with no custom tools required.

Want details? Use the same commands you already know:

```bash
$ kubectl describe tenant acme
Name:         acme
Namespace:    production
Status:
  Phase:            Ready
  Client Count:     3
  Active Sessions:  42
  Last Updated:     2025-11-26T11:42:15Z
```

This Before/After transformation? It shipped in a single, focused pull request. When your foundation is designed for Kubernetes from the start, these kinds of additions become much more straightforward.

When your foundation is Kubernetes CRDs, when your data model aligns with platform primitives, when you're not fighting against legacy decisions made 15 years ago, adding features like this becomes straightforward. We didn't need to refactor a web UI, update proprietary APIs, or maintain backward compatibility with five different configuration formats.

We extended the CRD schema, added status update logic, and shipped. Clean. Fast. Testable.

Compare that to adding native kubectl status monitoring to a system that wasn't designed for it. You'd need to retrofit the architecture, expose internal state through new APIs, build adapters and translators. A project measured in months, not days.

Starting with the right foundation means we can iterate quickly. Small, focused changes that add real value instead of fighting architectural debt.

## Real-Time, Automatic Updates

The status isn't static. It reflects your SSO infrastructure as it operates:

- **User logs in** → Session count increases immediately
- **Token refreshes** → Session tracked and counted
- **User logs out** → Session count decreases in real-time
- **Client added** → Client count updates automatically

This works for both OAuth flows and Interceptor mode authentication. Every login method, every tenant, every namespace: tracked seamlessly.

## Cloud-Native by Design, Not Retrofitted

Look at what competitors offer: proprietary admin dashboards, separate monitoring portals, REST APIs that feel like they were added after the fact (because they were). These systems were designed when "high availability" meant clustering VMs, not horizontal pod autoscaling. When "configuration management" meant editing XML files, not GitOps workflows with CRDs.

You can't retrofit that kind of thinking. You can add Kubernetes support, sure. You can run in containers. But you can't fundamentally change an architecture that was designed before cloud-native patterns existed.

We built differently:

**Standard Kubernetes CRD status subresources** mean no custom APIs to learn. If you know kubectl, you already know how to monitor your tenants and clients.

**Namespace-scoped visibility** respects your Kubernetes RBAC boundaries. Teams see their tenants, not the entire cluster. Multi-tenancy isn't an add-on; it's in the DNA.

**Works with existing tools** like kubectl plugins, Kubernetes dashboards, and gitops workflows. No integration needed. No proprietary protocols. No vendor lock-in.

Most existing solutions can't easily add this kind of integration. Their architectures were finalized before the CNCF existed, before Kubernetes became the standard platform. Retrofitting these patterns is possible, but it's not straightforward.

## The Console is the Interface

We get asked frequently: "Where's the admin UI?"

The answer is: **you're looking at it**.

This was one of our most controversial decisions. Every SSO solution has a web-based admin panel. It's expected. It's conventional. Users demand it.

> We said: **no**.

Not because we couldn't build one. Not because we're against graphical interfaces. But because we knew that if we built a UI first, the console would become an afterthought. The API would be designed to serve the dashboard, not the other way around. GitOps workflows would feel bolted-on. CI/CD integration would be a secondary concern.

We've seen this pattern play out across the industry. Projects that started with UIs treat their CLIs as lesser tools. The API becomes whatever the UI needs, not what automation needs. Documentation focuses on clicking through screens, not on declarative configuration.

By forcing ourselves to make kubectl the primary interface, we had to get it right. We had to make CRDs that were clean, intuitive, and powerful. We had to ensure that everything you might want to do (create tenants, configure clients, monitor status) worked beautifully from the command line and in GitOps workflows.

The result? Our users manage Uitsmijter the same way they manage everything else in Kubernetes. Same tools. Same workflows. Same RBAC. Same GitOps patterns. The console isn't a fallback for power users. It's the primary interface for everyone.

And if you want to build a WebUI on top of Uitsmijter? Go for it. The API is straightforward. If you know Kubernetes APIs, you probably already know how to work with ours.

## Why This Matters

This tenant status feature might seem small: just adding a few columns to kubectl output. But it represents something larger: the payoff of rebuilding from scratch with cloud-native principles.

Authentication is critical infrastructure. You need to know it's working, who's using it, and when something changes. But you shouldn't need special tools to get that visibility.

Every decision we made (not building a UI, not forcing our own user database on you, using CRDs as the primary configuration method, making kubectl the primary interface) led to this moment. You bring your own user store, we make it easy to attach. Where monitoring your SSO infrastructure is as simple as:

```bash
kubectl get tenants
```

No proprietary dashboards. No custom monitoring stacks. No integration APIs. Just standard Kubernetes commands showing you what matters.

Building for Kubernetes from the ground up means features like this can exist. Making the console first-class from day one means it actually works well.

---

*Uitsmijter 0.10.2 is available december 2025. Upgrade your CRDs with `kubectl apply` and start seeing your SSO metrics immediately. No configuration required.*
