#!/bin/bash
set -e

echo "Applying secrets..."
kubectl apply -f secrets.yaml

echo "Applying backend deployment and service..."
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml


echo "Applying Horizontal Pod Autoscaler..."
kubectl apply -f hpa.yaml

echo "All resources applied!" 