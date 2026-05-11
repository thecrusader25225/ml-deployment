import fs from "fs";
import path from "path";

export function createLlamaCppDeployment(model) {
  const basePath = "./cluster-config/apps/inference/dev";
  const modelPath = path.join(basePath, model.name);

  fs.mkdirSync(modelPath, { recursive: true });

  // deployment
  const deployment = `
apiVersion: apps/v1
kind: Deployment

metadata:
  name: ${model.name}
  namespace: inference-dev
spec:
  replicas: 1

  selector:
    matchLabels:
      app: ${model.name}

  template:
    metadata:
      labels:
        app: ${model.name}

    spec:
      containers:
      - name: llama

        image: ghcr.io/ggml-org/llama.cpp:server

        command:
          - sh
          - -c
          - |
              mkdir -p /models && \\
              curl -L -o /models/model.gguf ${model.modelUrl} && \\
              /app/llama-server \\
                -m /models/model.gguf \\
                --host 0.0.0.0 \\
                --port 8080

        ports:
        - containerPort: 8080

        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"

          limits:
            memory: "2Gi"
            cpu: "1"
`;

  fs.writeFileSync(
    path.join(modelPath, "deployment.yml"),
    deployment
  );

  // service
  const service = `
apiVersion: v1
kind: Service

metadata:
  name: ${model.name}
  namespace: inference-dev

spec:
  selector:
    app: ${model.name}

  ports:
    - port: 80
      targetPort: 8080
`;

  fs.writeFileSync(
    path.join(modelPath, "service.yml"),
    service
  );

  // kustomization
  const kustomization = `
resources:
  - deployment.yml
  - service.yml
`;

  fs.writeFileSync(
    path.join(modelPath, "kustomization.yml"),
    kustomization
  );
}