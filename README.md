# Kubernetes Task App on Minikube

This project demonstrates a complete Kubernetes-based application running on Minikube. It includes a frontend, a Flask backend API, and a PostgreSQL database, all deployed with Kubernetes manifests.

The goal of this project is to practice real DevOps concepts in a small but complete setup:

- Containerizing applications with Docker
- Deploying multi-tier services on Kubernetes
- Managing configuration with `ConfigMap` and `Secret`
- Using persistent storage with `PersistentVolumeClaim`
- Exposing services with `Service`, `Ingress`, and `minikube tunnel`
- Debugging real deployment issues

## Project Structure

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

We separate the application code from the Kubernetes configuration so the project stays clean, easier to explain, and easier to maintain.

## Architecture Overview

```text
Browser -> Ingress -> Frontend -> Backend -> PostgreSQL
```

Flow:

1. The user opens the frontend in the browser.
2. The frontend sends API requests to the backend.
3. The backend processes the request and connects to PostgreSQL.
4. PostgreSQL stores and returns the task data.

## Why This Structure Is Useful

This structure gives several practical benefits:

- `frontend/` is isolated from backend logic, so UI changes do not affect database code.
- `backend/` contains API and database logic in one place, making debugging easier.
- `k8s/` keeps infrastructure as code, so deployments are repeatable and version-controlled.
- `Secret` keeps database credentials out of application code.
- `ConfigMap` keeps runtime configuration flexible.
- `PersistentVolumeClaim` keeps PostgreSQL data even if the pod restarts.
- `Ingress` gives one clean entry point instead of exposing multiple ports manually.

## Technologies Used

- Kubernetes
- Minikube
- Docker
- Flask
- Gunicorn
- PostgreSQL
- Nginx
- HTML / JavaScript

## Application Files Explanation

### Backend

#### `backend/app.py`

This is the backend API built with Flask.

It does the following:

- Connects to PostgreSQL
- Creates the `tasks` table if it does not exist
- Exposes health and readiness endpoints
- Exposes task APIs for listing, creating, and toggling tasks

Important note:

- A real issue happened earlier when the table creation logic was only inside the main block.
- Gunicorn does not run the app the same way as the Flask development server.
- Because of that, the table initialization code did not run and the backend returned database errors.
- The fix was to ensure `init_db()` runs when the module is loaded.

#### `backend/requirements.txt`

Defines the Python dependencies:

- `flask`
- `psycopg2-binary`
- `gunicorn`

#### `backend/Dockerfile`

Builds the backend container by:

1. Starting from `python:3.11-slim`
2. Installing Python dependencies
3. Copying the application code
4. Running the app with Gunicorn on port `5000`

### Frontend

#### `frontend/index.html`

This is the user interface for the task app. It provides:

- A title
- A task input box
- A button to add tasks
- A list that displays saved tasks

#### `frontend/app.js`

This file uses `fetch()` to call the backend API.

It does the following:

- Loads all tasks from `/api/tasks`
- Creates new tasks with `POST /api/tasks`
- Toggles tasks with `PATCH /api/tasks/:id/toggle`

#### `frontend/Dockerfile`

This builds the frontend container using `nginx:alpine` and serves the static files on port `80`.

## Kubernetes Files Explanation

The `k8s/` folder contains YAML files that define the desired state of the system.

### `k8s/namespace.yaml`

Creates the namespace `task-app` to isolate all project resources.

Benefit:

- Keeps the application separated from other cluster workloads

### `k8s/secret.yaml`

Stores PostgreSQL credentials securely:

- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`

Benefit:

- Sensitive values are not hardcoded into the app source

### `k8s/configmap.yaml`

Stores backend configuration such as:

- `DB_HOST`
- `DB_PORT`

Benefit:

- Environment-specific values can be changed without rebuilding images

### `k8s/postgres.yaml`

Creates the PostgreSQL database system and includes:

- `PersistentVolumeClaim`
- `Deployment`
- `Service`

Benefit:

- The PVC keeps database data persistent
- The Service gives stable internal access using `postgres-service`

### `k8s/backend.yaml`

Deploys the Flask backend and includes:

- `Deployment`
- `Service`
- `ConfigMap` references
- `Secret` references
- Readiness and liveness probes

Benefit:

- Kubernetes can check whether the backend is healthy and ready

### `k8s/frontend.yaml`

Deploys the Nginx frontend and exposes it internally through `frontend-service`.

### `k8s/ingress.yaml`

Defines external HTTP routing:

- `http://task.local/` -> frontend
- `http://task.local/api` -> backend

Benefit:

- One domain can route traffic to multiple internal services

## Prerequisites

Before running this project, make sure you have:

- Docker installed
- Minikube installed
- `kubectl` installed
- PowerShell or a terminal that can run the commands below

## Step-by-Step Deployment Guide

### 1. Start the Kubernetes Cluster

```powershell
minikube start --driver=docker --cpus=2 --memory=4096
```

What it does:

- Starts a local Kubernetes cluster
- Uses Docker as the driver
- Allocates 2 CPUs and 4 GB memory

### 2. Verify the Cluster

```powershell
kubectl get nodes
```

What it does:

- Verifies that the cluster is running and ready

### 3. Build Docker Images Inside Minikube

```powershell
minikube image build -t task-backend-lite:v1 ./backend
minikube image build -t task-frontend-lite:v1 ./frontend
```

What it does:

- Builds the backend image directly inside Minikube
- Builds the frontend image directly inside Minikube
- Avoids pushing images to Docker Hub for local testing

### 4. Apply Kubernetes Resources in Order

```powershell
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml
```

What it does:

- Creates all required Kubernetes resources step by step
- Deploys database first, then backend, then frontend

### 5. Check Deployment Status

```powershell
kubectl get pods -n task-app
kubectl get svc -n task-app
kubectl get pvc -n task-app
```

What it does:

- Shows pod status
- Shows internal services
- Verifies persistent storage was created

## Testing the Application

### 6. Test the Backend with Port Forwarding

Start the port-forward:

```powershell
kubectl port-forward svc/backend-service 5000:5000 -n task-app
```

In another terminal, test the API:

```powershell
curl http://localhost:5000/health
curl http://localhost:5000/ready
curl http://localhost:5000/api/tasks
```

Optional create test:

```powershell
curl.exe -X POST http://localhost:5000/api/tasks -H "Content-Type: application/json" -d "{\"title\":\"Learn Kubernetes\"}"
```

What it does:

- Verifies the backend is healthy
- Verifies the backend can connect to PostgreSQL
- Verifies task APIs are working

### 7. Test the Frontend with Port Forwarding

Start the port-forward:

```powershell
kubectl port-forward svc/frontend-service 8080:80 -n task-app
```

Then open:

```text
http://localhost:8080
```

What it does:

- Confirms the frontend is loading correctly before ingress is configured

## Ingress Setup

### 8. Enable the Ingress Addon

```powershell
minikube addons enable ingress
```

What it does:

- Installs the NGINX Ingress controller in Minikube

### 9. Verify the Ingress Controller

```powershell
kubectl get pods -n ingress-nginx
```

What it does:

- Confirms that the ingress controller is running

### 10. Apply the Ingress Resource

```powershell
kubectl apply -f k8s/ingress.yaml
kubectl get ingress -n task-app
```

What it does:

- Creates the ingress routing rules
- Verifies the ingress exists

### 11. Add the Local Domain

Add this entry to your hosts file:

```text
127.0.0.1 task.local
```

On Windows, the hosts file is usually:

```text
C:\Windows\System32\drivers\etc\hosts
```

What it does:

- Maps `task.local` to your local machine

### 12. Start the Minikube Tunnel

```powershell
minikube tunnel
```

What it does:

- Exposes Kubernetes services externally on your machine
- Allows ingress traffic to reach the cluster

### 13. Final Test

Open:

```text
http://task.local
```

Expected result:

- The frontend loads
- The frontend calls the backend through ingress
- The backend stores and retrieves tasks from PostgreSQL

## Useful Debugging Commands

Check all pods:

```powershell
kubectl get pods -n task-app
```

Check backend logs:

```powershell
kubectl logs -l app=backend -n task-app
```

Check PostgreSQL logs:

```powershell
kubectl logs -l app=postgres -n task-app
```

Describe a pod:

```powershell
kubectl describe pod <pod-name> -n task-app
```

Restart a deployment:

```powershell
kubectl rollout restart deployment/backend -n task-app
kubectl rollout restart deployment/frontend -n task-app
```

## Real Debugging Story

One real issue in this project was a backend `500 Internal Server Error`.

Command used to investigate:

```powershell
kubectl logs -l app=backend -n task-app
```

The issue found:

```text
relation "tasks" does not exist
```

Reason:

- The database table creation logic did not run under Gunicorn in the earlier version

Fix:

- Ensure the initialization code runs when the application module is loaded
