import fs from "fs";
import path from "path";

export function createModelDeployment(model) {
  const basePath = "../cluster-config/apps/inference";
  const modelPath = path.join(basePath, model.name);

  fs.mkdirSync(modelPath, { recursive: true });

  // Deployment
  const deployment = `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${model.name}
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
      - name: inference
        image: your-inference-image
        env:
        - name: MODEL_URL
          value: "${model.modelUrl}"
        ports:
        - containerPort: 8000
`;

  fs.writeFileSync(path.join(modelPath, "deployment.yaml"), deployment);

  // Service
  const service = `
apiVersion: v1
kind: Service
metadata:
  name: ${model.name}
spec:
  selector:
    app: ${model.name}
  ports:
    - port: 80
      targetPort: 8000
`;

  fs.writeFileSync(path.join(modelPath, "service.yaml"), service);

  // Kustomization
  const kustomization = `
resources:
  - deployment.yaml
  - service.yaml
`;

  fs.writeFileSync(path.join(modelPath, "kustomization.yaml"), kustomization);
}

export function updateRootKustomization(modelName) {
  const file = "../cluster-config/apps/inference/kustomization.yaml";

  let content = fs.readFileSync(file, "utf-8");

  if (!content.includes(modelName)) {
    content += `\n  - ${modelName}`;
  }

  fs.writeFileSync(file, content);
}