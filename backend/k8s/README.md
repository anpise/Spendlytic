# Kubernetes & Autoscaling Deployment Guide

This guide explains how to deploy and manage the Spendlytic backend on Kubernetes, including autoscaling with the Horizontal Pod Autoscaler (HPA).

## Directory Overview

- `deployment.yaml`: Main backend Deployment manifest
- `service.yaml`: Service manifest for backend exposure
- `secrets.yaml`: Kubernetes secrets for environment variables
- `hpa.yaml`: Horizontal Pod Autoscaler (HPA) for dynamic scaling
- `prometheus-deployment.yaml`, `prometheus-config.yaml`, `prometheus-service.yaml`: Prometheus monitoring setup
- `spendlytic-pod.yaml`, `spendlytic-service.yaml`: Example pod/service manifests
- `deploy-all.sh`: Script to deploy all resources

## Prerequisites
- minikube or a Kubernetes cluster
- Docker
- kubectl
- (Optional) Metrics server for HPA: install with `kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml`

## Deployment Steps

1. **Start minikube:**
   ```bash
   minikube start
   ```
2. **Build and load Docker image:**
   ```bash
   docker build -t spendlytic-backend:latest ../../backend
   minikube image load spendlytic-backend:latest
   ```
3. **Apply Kubernetes manifests:**
   ```bash
   kubectl apply -f secrets.yaml
   kubectl apply -f deployment.yaml
   kubectl apply -f service.yaml
   ```
4. **(Optional) Deploy Prometheus for monitoring:**
   ```bash
   kubectl apply -f prometheus-config.yaml
   kubectl apply -f prometheus-deployment.yaml
   kubectl apply -f prometheus-service.yaml
   ```
5. **Apply the HPA (Horizontal Pod Autoscaler):**
   ```bash
   kubectl apply -f hpa.yaml
   ```
   This will enable autoscaling of the backend pods based on CPU and memory utilization.

## HPA (Horizontal Pod Autoscaler) Details

- **File:** `hpa.yaml`
- **What it does:**
  - Automatically scales the number of backend pods between 1 and 6 based on CPU and memory usage.
  - Target utilization is set to 70% for both CPU and memory.
  - Includes stabilization windows and scaling policies for smooth scaling.
- **Requirements:**
  - The Kubernetes metrics server must be running for HPA to function.
- **Monitoring HPA:**
   ```bash
   kubectl get hpa
   kubectl describe hpa spendlytic-backend-hpa
   kubectl top pods
   ```
- **Troubleshooting:**
  - If HPA does not scale, ensure the metrics server is installed and running.
  - Check pod resource requests/limits are set in `deployment.yaml`.
  - Use `kubectl describe hpa` for detailed status and events.

## Cleanup

To remove all resources:
```bash
kubectl delete -f .
```

## Best Practices
- Always set resource requests and limits for your containers.
- Monitor autoscaling behavior under load.
- Tune HPA parameters as needed for your workload.

For more details, see the main [backend README](../README.md).

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