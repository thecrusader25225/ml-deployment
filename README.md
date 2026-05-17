## Kubernetes-Native ML Deployment Platform

A platform for dynamically deploying GGUF-based LLM inference workloads onto [this K8s cluster](https://github.com/thecrusader25225/cluster-config) using GitOps workflows.

---

## Platform Architecture

<img width="1204" height="1306" alt="architecture" src="https://github.com/user-attachments/assets/33cc1012-ebc9-4113-898d-c7bbeff7fe7b" />

This application acts as the orchestration layer responsible for:

- Generating Kubernetes manifests
- Managing model deployment lifecycles
- Updating GitOps repositories
- Triggering infrastructure reconciliation
- Exposing inference APIs through a unified frontend

---

## Deployment Workflow

```text
User uploads GGUF model
          ↓
Frontend sends deployment request
          ↓
Backend validates + sanitizes model
          ↓
Deployment manifests generated
          ↓
Kustomization resources updated
          ↓
Changes committed to GitOps repo
          ↓
ArgoCD reconciles cluster state
          ↓
Inference pod deployed
          ↓
Model becomes available in UI
```

---

## Features

### Dynamic Model Deployment

Models can be deployed dynamically at runtime through the API.

The backend automatically:

- Generates Deployment manifests
- Generates Service manifests
- Generates Kustomization resources
- Updates GitOps repository state
- Pushes deployment commits to GitHub
- Triggers Kubernetes reconciliation through ArgoCD

---

### Runtime Inference APIs

Each deployed model is exposed internally through Kubernetes services.

Example:

```text
tinyllama-chat.inference-dev.svc.cluster.local
```

Inference requests are routed through the backend API.

---

## Repository Structure

```text
.
├── frontend/
│   ├── src/
│   └── Dockerfile
│
├── src/
│   ├── routes/
│   ├── services/
│   └── utils/
│
├── .github/workflows/
│   ├── backend-ci.yml
│   └── frontend-ci.yml
│
├── Dockerfile
├── package.json
└── README.md
```
---

### GitOps Integration

This project follows a GitOps deployment workflow.

Instead of directly mutating Kubernetes resources, the backend:

1. Updates declarative manifests
2. Pushes changes to GitHub
3. Allows ArgoCD to reconcile cluster state

This keeps infrastructure state version-controlled and reproducible.

---

### Frontend Dashboard

The frontend provides:

- Model deployment interface
- Available model listing
- Chat interface per model
- Persistent local chat history
- Runtime inference interaction

---

## Backend Architecture

### Routes

#### `src/routes/models.js`

Handles:

- Model registration
- Inference requests
- GitOps deployment workflow
- Dynamic manifest orchestration

---

### Utilities

#### `generateLlamaCpp.js`

Dynamically generates:

- Deployment manifests
- Service manifests
- Kustomization files

for `llama.cpp` inference workloads.

---

#### `generateYaml.js`

Handles:

- Kustomization resource updates
- Manifest generation utilities

---

### Services

#### `modelStore.js`

Maintains runtime model metadata.

---

## CI/CD

### Frontend CI

- Builds frontend image
- Pushes image to Docker Hub
- Updates deployment image tags
- Pushes changes to GitOps repository

---

### Backend CI

- Builds backend image
- Pushes image to Docker Hub
- Updates deployment manifests
- Triggers infrastructure reconciliation

---

## Tech Stack

| Category | Technologies |
|---|---|
| Frontend | React, Vite |
| Backend | Node.js, Express |
| AI / Inference | llama.cpp, ONNX Runtime, Python |
| Containerization | Docker |
| Orchestration | Kubernetes |
| GitOps / CD | ArgoCD |
| CI | GitHub Actions |
| Networking | Ingress NGINX |
| Configuration | Kustomize |
| Infrastructure | Google Cloud Compute Engine |

---

## Example API Usage

### Register Model

```bash
curl -X POST http://<platform-url>/api/models \
  -H "Content-Type: application/json" \
  -d '{
    "name":"tinyllama-chat",
    "modelUrl":"https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q2_K.gguf",
    "runtime":"llama.cpp"
  }'
```

---

### Inference Request

```bash
curl -X POST http://<platform-url>/api/models/tinyllama-chat/infer \
  -H "Content-Type: application/json" \
  -d '{
    "prompt":"What is Kubernetes?",
    "n_predict":16
  }'
```

---
## License
[MIT](LICENSE)

