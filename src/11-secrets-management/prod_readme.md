# Lesson 11 — Production Secrets Management

## 1. What is Production Secrets Management?

Production secrets management means securely storing, accessing, monitoring, and updating sensitive credentials used by a live application.

Examples include:
- Database credentials
- JWT signing secrets
- API keys
- Cloud provider credentials
- Encryption keys

## 2. Why is it important?

If an attacker obtains production secrets, they may access databases, impersonate users, or use cloud resources without permission.

Production applications need stronger protection than simply storing secrets in a local `.env` file.

## 3. Best Practices

### 1. Use a Secrets Manager

Store production secrets in a dedicated service instead of hardcoding them or committing them to Git.

Examples:
- AWS Secrets Manager
- AWS Systems Manager Parameter Store (SecureString)
- Azure Key Vault
- Google Cloud Secret Manager
- HashiCorp Vault

### 2. Use Least Privilege

Give each application or service access only to the secrets it needs.

For example, a reporting service should not automatically receive administrator database credentials.

### 3. Use Managed Identity or IAM Roles

When deploying on AWS, prefer IAM roles and temporary credentials where supported instead of storing long-lived AWS access keys in application code.

### 4. Rotate Secrets

Change secrets periodically when required by your security policy, and immediately if they are exposed or suspected to be compromised.

Rotation must be planned so the application can transition safely to the new secret.

### 5. Never Log Secrets

Do not print passwords, API keys, database URLs, access tokens, or private keys in application logs or error responses.

### 6. Protect Production Configuration

- Keep `.env` files out of Git.
- Use deployment platform environment variables or a secrets manager.
- Restrict who can view and change production secrets.
- Separate development, testing, and production credentials.
- Use HTTPS to protect secrets while they are transmitted.

### 7. Validate Secrets at Startup

Check that required configuration values exist before accepting requests.

Fail safely if a critical secret is missing. Never use a weak hardcoded fallback in production.

### 8. Monitor Secret Access

Use audit logs and alerts to identify unexpected access, changes, or suspicious usage of secrets.

### 9. Handle Secret Exposure

If a secret is exposed:
1. Revoke or rotate it immediately.
2. Investigate how it was exposed.
3. Check audit logs for suspicious activity.
4. Remove the exposure where possible.
5. Update affected applications and verify they work with the replacement secret.

Deleting a secret from a source file alone does not invalidate it.

## 4. Example Production Architecture

```text
Node.js Application
        |
        | Authenticated request
        v
Secrets Manager
        |
        | Returns authorized secret
        v
Application uses database credentials
        |
        v
Production Database
```

The application should authenticate to the secrets manager using an appropriate identity mechanism, such as an IAM role, and retrieve only the secrets it is authorized to access.

## 5. Local vs Production

| Local development | Production |
|---|---|
| `.env` file can be used | Prefer a dedicated secrets manager or secure deployment configuration |
| Local development credentials | Separate production credentials |
| Developer-controlled access | Restricted, audited access |
| Manual updates may be suitable | Controlled rotation and incident response |

## 6. Important Security Rules

- Never commit real secrets to GitHub.
- Never expose backend secrets in frontend code.
- Never send secrets in API responses.
- Avoid long-lived credentials when temporary credentials are available.
- Apply least privilege.
- Rotate compromised secrets immediately.
- Review secret access and audit logs.

## Conclusion

Production secrets management protects the credentials that connect an application to databases, APIs, and cloud services. Use secure storage, restricted access, appropriate rotation, audit logging, and a clear response process for exposed secrets.

**Remember:** A secret is protected only when its storage, access, usage, and lifecycle are all handled securely.