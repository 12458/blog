---
title: "Deploying Vaultwarden on K3s"
date: 2025-07-05T23:05:04+00:00
tags: ["k3s", "vaultwarden", "kubernetes"]
author: "Shang En Sim"
showToc: false
TocOpen: false
draft: true
hidemeta: false
comments: true
description: "How I Self-Hosted a Bitwarden-Compatible Password Manager on a $1/mo VPS"
ShowBreadCrumbs: true
ShowPostNavLinks: true
ShowRssButtonInSectionTermList: true
UseHugoToc: true
---

Running your own password manager allows you to control the security of your passwords.  Here is how I set up [Vaultwarden](https://github.com/dani-garcia/vaultwarden) (a Bitwarden-compatible server) on K3s, using just a budget VPS with 1 vCPU and 2GB RAM. Everything works smoothly, and the cost is about \$2 a month.

## Why Vaultwarden and K3s?

[Vaultwarden](https://github.com/dani-garcia/vaultwarden) is what Bitwarden could be if it were built for simplicity and efficiency. It is written in Rust, fully compatible with Bitwarden clients, and skips all the complexity of the official Bitwarden setup. You do not need Docker Compose with ten containers or a ton of memory. Vaultwarden runs as a single binary with barely any dependencies.

[K3s](https://k3s.io/), Rancher's lightweight Kubernetes, fits right in for this kind of deployment. My whole stack runs comfortably on a low-end VPS with Ubuntu 24.04.

## The Stack

Here is the main lineup:

* [**Vaultwarden**](https://github.com/dani-garcia/vaultwarden): Handles all vault operations.
* [**K3s**](https://k3s.io/): The Kubernetes platform, light enough for a single VPS.
* [**NeonDB**](https://neon.com/): Free managed PostgreSQL in the cloud. (SQLite also works, but Postgres allows you to scale in the future + backups are easier)
* [**Cloudflare Tunnel**](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/): No public IP required. You get DDoS protection and CDN performance at zero cost.

All requests go through Cloudflare, then a secure tunnel, land on your VPS, and finally hit Vaultwarden. Passwords are stored on your VPS disk, and all other metadata sits in NeonDB.

```mermaid
flowchart TD
    A[Internet] --> B[Cloudflare Tunnel]
    B --> C[VPS NodePort]
    C --> D[K3s Service]
    D --> E[Vaultwarden Pod]
    E --> F[hostPath Storage<br/>/opt/vaultwarden-data]
    E --> G[External Database<br/>(NeonDB PostgreSQL)]
```

## Storage

For single-node setups, simple is best. I use hostPath volumes so Vaultwarden writes directly to a local folder on the VPS. Backups are as easy as copying that folder. The only tradeoff is that the pod is tied to this node, but in a single-node cluster this is exactly what you want.

## Networking

I use a NodePort service. No need for an Ingress controller since Cloudflare handles SSL and all public access. Cloudflare Tunnel means nothing is exposed publicly, and your server’s IP stays private.

## The Kubernetes YAML You’ll Use

**PersistentVolume**

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: vaultwarden-pv
spec:
  capacity:
    storage: 2Gi
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  hostPath:
    path: /opt/vaultwarden-data
    type: DirectoryOrCreate
```

**PersistentVolumeClaim**

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: vaultwarden-data
  namespace: vaultwarden
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 2Gi
  storageClassName: ""
  selector:
    matchLabels:
      app: vaultwarden
```

**Secrets**

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: vaultwarden-secrets
  namespace: vaultwarden
type: Opaque
stringData:
  DATABASE_URL: "postgresql://user:pass@your.neon.db.url/vaultwarden?sslmode=require"
  DOMAIN: "https://vault.yourdomain.tld"
```

**Deployment**
Keep `replicas: 1` and use `Recreate` as the strategy. Make sure the folder on your VPS is owned by user 1000 and group 1000, which matches Vaultwarden’s container defaults.

## Step-by-Step Setup

1. **Prepare the VPS:**

   ```bash
   sudo mkdir -p /opt/vaultwarden-data
   sudo chown 1000:1000 /opt/vaultwarden-data
   sudo chmod 755 /opt/vaultwarden-data
   ```
2. **Apply manifests in order:**

   ```bash
   kubectl apply -f namespace.yaml
   kubectl apply -f pv.yaml
   kubectl apply -f pvc.yaml
   kubectl apply -f secret.yaml
   kubectl apply -f deployment.yaml
   kubectl apply -f service.yaml
   ```
3. **Check that it’s running:**

   ```bash
   kubectl get pods -n vaultwarden -w
   kubectl logs -n vaultwarden deployment/vaultwarden
   ```

## Maintenance

* **Update Vaultwarden:**

  ```bash
  kubectl set image deployment/vaultwarden vaultwarden=vaultwarden/server:1.XX.X -n vaultwarden
  kubectl rollout status deployment/vaultwarden -n vaultwarden
  ```
* **Monitor:**

  ```bash
  kubectl get pods -n vaultwarden
  kubectl top pods -n vaultwarden
  kubectl logs -n vaultwarden deployment/vaultwarden --tail=50
  ```

## What Does It Cost?

| Item             | Monthly Cost    |
| ---------------- | --------------- |
| VPS (1vCPU, 2GB) | \$1             |
| Domain           | \$1             |
| NeonDB           | \$0 (free tier) |
| Cloudflare       | \$0             |

You get a Bitwarden-compatible setup for about \$2 per month.

## Final Thoughts

Self-hosting Vaultwarden with K3s is a straightforward project that pays off. You have full control, hardly spend anything, and keep all your passwords in your hands. If you enjoy tech projects and want to own your credentials, this is a fun and practical weekend build.

Comment below if you tried it out!
