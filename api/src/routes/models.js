import express from 'express';
import { models } from '../services/modelStore.js';
import { createModelDeployment, updateRootKustomization } from "../utils/generateYaml.js";
import simpleGit from 'simple-git';

const git = simpleGit("../cluster-config");

const router = express.Router();

router.post('/models', async(req, res) => {
  try{const { name, modelUrl } = req.body;
    if (!name || !modelUrl) {
    return res.status(400).json({ error: 'Name and modelUrl are required' });
    }
    const model = { name, modelUrl };
    models.push(model);

    createModelDeployment({ name, modelUrl });
    updateRootKustomization(name);
    
    await commitChanges(name);

    console.log('Model registered:', model);
    res.status(200).json(model);}
  catch(error){
    console.error('Error registering model:', error);
    res.status(500).json({ error: 'Failed to register model' });
  }
});

router.get('/models', (req, res) => {
  res.json(models);
});

export async function commitChanges(modelName) {
  await git.add(".");
  await git.commit(`deploy model ${modelName}`);
  await git.push();
}
export default router;