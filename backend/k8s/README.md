# Kubernetes Deployment Guide

This guide provides commands for deploying and managing the Spendlytic backend on Kubernetes using minikube.

See the [backend README](../README.md) for backend setup and the [project root README](../../README.md) for an overview of the Spendlytic project.

## Prerequisites
- minikube installed
- Docker installed
- kubectl installed

## Setup and Deployment

1. Start minikube:
```bash
minikube start
```

2. Build Docker image:
```bash
docker build -t spendlytic-backend:latest ./backend
```

3. Load image into minikube:
```bash
minikube image load spendlytic-backend:latest
```

4. Apply Kubernetes manifests:
```bash
# Apply secrets
kubectl apply -f backend/k8s/secrets.yaml

# Apply deployment
kubectl apply -f backend/k8s/deployment.yaml

# Apply service
kubectl apply -f backend/k8s/service.yaml
```

## Monitoring and Management

1. Check deployment status:
```bash
# Check pods
kubectl get pods

# Check services
kubectl get services
```

2. Access the service:
```bash
# Open in browser
minikube service spendlytic-backend-service

# Get URL only
minikube service spendlytic-backend-service --url
```

3. View logs:
```bash
# View logs of all pods
kubectl logs -l app=spendlytic-backend

# View logs of specific pod
kubectl logs <pod-name>
```

## Debugging Commands

```bash
# Get detailed pod information
kubectl describe pods

# Get pod events
kubectl get events

# Check pod readiness
kubectl get pods -o wide

# View resource usage
kubectl top pods
```

## Cleanup

1. Delete resources:
```bash
# Delete all resources
kubectl delete -f backend/k8s/

# Or delete specific resources
kubectl delete deployment spendlytic-backend
kubectl delete service spendlytic-backend-service
kubectl delete secret spendlytic-secrets
```

2. Stop minikube:
```bash
minikube stop
```

3. Delete minikube cluster (fresh start):
```bash
minikube delete
```

## API Endpoints

Once the service is running, you can access these endpoints (replace PORT with actual port from service):

- Register: `POST /api/register`
- Login: `POST /api/login`
- Upload receipt: `POST /api/upload`
- Get all bills: `GET /api/bills`
- Get specific bill: `GET /api/bills/<id>`
- Delete bill: `DELETE /api/bills/<id>`

See the [backend README](../README.md) for request/response examples and more details.

## Notes
- Replace placeholder values in `secrets.yaml` with actual values before deployment
- The port number will be different from 80 when running in minikube
- Use `minikube service spendlytic-backend-service --url` to get the correct port
- All API endpoints remain the same, only the port number changes 