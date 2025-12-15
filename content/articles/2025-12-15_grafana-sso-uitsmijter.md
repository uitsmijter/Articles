---
author: Uitsmijter Team
title: "SSO for Grafana: Because Nobody Likes Remembering Another Password"
description: "A short, practical guide to configuring Grafana to use Uitsmijter as your SSO provider. One login to rule them all."
date: 2025-12-15
tags: ["Grafana", "SSO", "OAuth", "Configuration", "Tutorial", "Monitoring"]
thumbnail:
  url: img/grafana.png
  author: ChatGPT
---

If you're reading this, you probably already know what Grafana is, but let's get everyone on the same page: **Grafana** is your friendly neighborhood observability platform. It's the thing that turns your messy metrics, logs, and traces into beautiful dashboards that actually make sense. You know those colorful graphs your DevOps team stares at during incidents? Yeah, that's Grafana. It's like having a command center for your infrastructure—except instead of launching missiles, you're launching alerts about your CPU usage hitting 99%.

Here's the thing though: your team probably already has accounts for Slack, GitHub, Jenkins, Jira, AWS, that weird internal tool Bob built in 2017, and approximately 47 other services. Adding yet another username and password for Grafana is about as appealing as another standup meeting. That's where **Single Sign-On (SSO)** comes to the rescue. With SSO, your team logs in once (to Uitsmijter, in this case), and boom—they're authenticated everywhere. No more password resets. No more "wait, was this the password with the exclamation point or the dollar sign?" No more tears.

## Why Uitsmijter + Grafana?

Uitsmijter is an OAuth2/OIDC-compliant authorization server that plays extremely well with others. It doesn't care where your users live (LDAP, database, JavaScript voodoo—you name it), and it speaks OAuth2 fluently. Grafana? Also speaks OAuth2. Match made in heaven. Before we dive in, make sure you have Uitsmijter up and running (check [docs.uitsmijter.io](https://docs.uitsmijter.io) if you need help), a Tenant configured in Uitsmijter that represents your organization, and Grafana installed (we'll assume you're running it in Kubernetes with Helm, because it's 2025).

First things first: you need to tell Uitsmijter about Grafana by creating a **Client** entity. Here's what that looks like:

```yaml
apiVersion: entities.uitsmijter.io/v1
kind: Client
metadata:
  name: grafana-client
  namespace: your-namespace
spec:
  ident: "249C1059-1181-4666-9D36-8C5F3D3D8E7C"
  tenantname: "your-tenant-name"
  redirect_uri: "https://grafana.yourdomain.com/login/generic_oauth"
  isPkceOnly: true
  scopes:
    - access
```

The `ident` field can be any unique string—UUIDs work great. This becomes your `client_id`. Setting `isPkceOnly: true` enables PKCE-only mode, which means no client_secret is needed. Much more secure! The `redirect_uri` is where Uitsmijter sends users after they log in; for Grafana, it's always `/login/generic_oauth`. The `scopes` array defines what access levels are available—`access` is the basic scope, but you can add more if you need fine-grained permissions.

Now for the fun part: telling Grafana to trust Uitsmijter. If you're using the Grafana Helm chart (and you should be), you'll add this configuration to your `values.yaml`:

```yaml
grafana.ini:
  server:
    root_url: https://grafana.yourdomain.com

  auth.generic_oauth:
    enabled: true
    name: Uitsmijter
    allow_sign_up: true
    auto_login: false
    client_id: 249C1059-1181-4666-9D36-8C5F3D3D8E7C
    scopes: access
    auth_url: https://login.yourdomain.com/authorize
    token_url: https://login.yourdomain.com/token
    api_url: https://login.yourdomain.com/token/info
    email_attribute_path: profile.email
    name_attribute_path: profile.name
    login_attribute_path: user
    role_attribute_path: role
    role_attribute_strict: false
    use_pkce: true
    tls_skip_verify_insecure: false
```

Let's break this down. The `auth_url` is where Grafana sends users to log in (Uitsmijter's `/authorize` endpoint). The `token_url` is where Grafana exchanges the authorization code for an access token, and the `api_url` is where Grafana fetches user information from Uitsmijter's `/token/info` endpoint. When Uitsmijter returns user info, it comes back in a JSON format like this:

```json
{
  "role": "viewer",
  "user": "alice@example.com",
  "profile": {
    "name": "Alice Wonderland",
    "email": "alice@example.com"
  }
}
```

The `*_attribute_path` settings tell Grafana where to find the email, name, and login fields in this response. This is where the magic of role mapping happens too. Uitsmijter returns a `role` field, which maps directly to Grafana roles: `Admin` gives full Grafana admin powers, `Editor` allows creating and editing dashboards, and `Viewer` provides read-only access. Setting `role_attribute_strict: false` allows users without explicit roles to still log in—they'll default to Viewer permissions.

The `use_pkce: true` setting in Grafana, combined with `isPkceOnly: true` in your Uitsmijter Client configuration, enables **PKCE (Proof Key for Code Exchange)**—a security extension to OAuth2 that prevents authorization code interception attacks. Here's why it's awesome: it's more secure because even if someone intercepts the authorization code they can't use it, and it's perfect for public clients like browsers and mobile apps that can't keep secrets secret. The flow works like this: Grafana generates a random `code_verifier`, creates a `code_challenge` (hash of the verifier), Uitsmijter stores the challenge during `/authorize`, and when Grafana calls `/token` it sends the original `code_verifier` which Uitsmijter verifies matches. Bottom line: **Always use PKCE.** There's no good reason not to.

Once you've got your configuration ready, deploy Grafana with:

```bash
helm upgrade --install grafana grafana/grafana -f values.yaml
```

Now visit your Grafana instance and you should see a shiny new "Sign in with Uitsmijter" button (or whatever you named it). Click it, log in through Uitsmijter, and you're in! Of course, there are a few common gotchas to watch out for. If you see a "redirect_uri_mismatch" error, make sure the `redirect_uri` in your Uitsmijter Client exactly matches `https://your-grafana-url/login/generic_oauth`—no trailing slashes, no typos. If users are getting "User has no permissions" errors, check that your JavaScript provider in Uitsmijter is returning a `role` field and that `role_attribute_path` in Grafana is set to `role`.

For TLS certificate issues (the dreaded "x509: certificate signed by unknown authority"), either fix your certificates the right way or set `tls_skip_verify_insecure: true` for development—just remember to set it back to `false` in production! If you set `auto_login: true`, Grafana will skip its login page and go straight to Uitsmijter, which is great for pure SSO setups but terrible if you still need local admin access. Keep it `false` until you're sure. And if PKCE isn't working and you're seeing "invalid_grant" or "code_verifier required" errors, make sure your Uitsmijter Client has `isPkceOnly: true` set, Grafana has `use_pkce: true` enabled, and you're running recent versions of both (Uitsmijter 0.10.0+, Grafana 8.0+).

A few pro tips: test with a non-admin account first so you don't lock yourself out, monitor your auth logs in both Grafana and Uitsmijter to catch issues early, and consider automating role updates in your Uitsmijter provider if your team structure changes frequently. Most importantly, use proper TLS in production—don't skip certificate verification outside of development environments.

So there you have it: register Grafana as an OAuth Client in Uitsmijter with `isPkceOnly: true`, configure `auth.generic_oauth` in Grafana's `values.yaml` with `use_pkce: true`, map user attributes and roles correctly, and deploy. No client_secret needed—PKCE handles security. Your team can now access Grafana with the same credentials they use everywhere else. One less password to remember, one more step toward infrastructure nirvana, and with PKCE, it's more secure than ever.

For more information, check out the [Uitsmijter documentation](https://docs.uitsmijter.io), the [Uitsmijter Client configuration guide](https://docs.uitsmijter.io/configuration/tenant_client_config/), [Grafana's OAuth documentation](https://grafana.com/docs/grafana/latest/setup-grafana/configure-security/configure-authentication/generic-oauth/), the [Uitsmijter GitHub repository](https://github.com/uitsmijter/Uitsmijter), join the discussion at [discourse.uitsmijter.io](https://discourse.uitsmijter.io), or read more about [PKCE](https://oauth.net/2/pkce/).

Now go forth and authenticate! 🚀
