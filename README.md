# 🚀 Kubernetes Task App on Minikube
This repository demonstrates a complete, production-grade Kubernetes-based application deployed locally on **Minikube**. It features a multi-tier microservices architecture consisting of an NGINX Frontend, a Flask/Gunicorn Backend API, and a PostgreSQL Database with persistent storage.

## 🏗️ Architecture Overview
```text
Browser -> Ingress -> Frontend -> Backend -> PostgreSQL
```

- Frontend: HTML/JS static app served by NGINX (port 80)
- Backend: Python Flask API running on Gunicorn (port 5000)
- Database: PostgreSQL with state saved to a PersistentVolume (port 5432)
- Ingress: Custom local domain mapping ([http://task.local](http://task.local))

## 📁 Project Structure

```text
project/
|-- backend/
|   |-- app.py
|   |-- Dockerfile
|   `-- requirements.txt
|-- frontend/
|   |-- app.js
|   |-- Dockerfile
|   `-- index.html
`-- k8s/
    |-- backend.yaml
    |-- configmap.yaml
    |-- frontend.yaml
    |-- ingress.yaml
    |-- namespace.yaml
    |-- postgres.yaml
    `-- secret.yaml
```

## 🛠️ Step-by-Step Deployment Guide

1. Start Minikube & Build Images
   ```text
   # Start local Minikube cluster
   minikube start --driver=docker --cpus=2 --memory=4096

    # Build images directly inside Minikube
    minikube image build -t task-backend-lite:v1 ./backend
    minikube image build -t task-frontend-lite:v1 ./frontend
   
2. Apply Kubernetes Manifests
   ```text
   kubectl apply -f k8s/namespace.yaml
    kubectl apply -f k8s/secret.yaml
    kubectl apply -f k8s/configmap.yaml
    kubectl apply -f k8s/postgres.yaml
    kubectl apply -f k8s/backend.yaml
    kubectl apply -f k8s/frontend.yaml
    kubectl apply -f k8s/ingress.yaml
   
3. Setup Local Ingress Routing
   ```text
   # Enable Ingress Addon
    minikube addons enable ingress
    
    # Add to C:\Windows\System32\drivers\etc\hosts (as Admin)
    127.0.0.1 task.local
    
    # Run Tunnel (in Admin Terminal)
    minikube tunnel

## 🐛 Real-World Debugging Case Study


This structure gives several practical benefits:

- Issue: Backend returned `500 Internal Server Error (relation "tasks" does not exist)`.
- Investigation: Executed `kubectl logs -l app=backend -n task-app` and found database table creation was skipped.
- Root Cause: Table creation logic was placed inside `if __name__ == '__main__':`, which WSGI servers (Gunicorn) do not execute.
- Fix: Moved `init_db()` execution to module import time to ensure automatic table verification/creation upon worker launch.


