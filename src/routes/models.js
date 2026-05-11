import express from 'express';
import { models } from '../services/modelStore.js';
import { createModelDeployment, updateRootKustomization } from "../utils/generateYaml.js";
import { createLlamaCppDeployment } from '../utils/generateLlamaCpp.js';
import simpleGit from 'simple-git';
import fs from 'fs';
const REPO_DIR = './cluster-config';
const token = process.env.GH_PAT;
if (!fs.existsSync(REPO_DIR)) {
  const git = simpleGit();

  await git.clone(
    `https://${token}@github.com/thecrusader25225/cluster-config.git`,
    REPO_DIR
  );
  console.log('Repository cloned successfully');
}

const git = simpleGit(REPO_DIR);
const router = express.Router();

router.post('/models', async(req, res) => {
  try{const { name, modelUrl, runtime } = req.body;
    if (!name || !modelUrl || !runtime) {
    return res.status(400).json({ error: 'Name, modelUrl, and runtime are required' });
    }
    const model = { name, modelUrl, runtime };
    models.push(model);

    if (runtime === 'llama.cpp') {
      createLlamaCppDeployment(model);
    } else {
      createModelDeployment({ name, modelUrl, runtime });
    }
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
 try{ console.log('Committing changes to Git...');
  await git.addConfig('user.name', 'platform-bot');
  await git.addConfig('user.email', 'bot@platform.dev');
  await git.add(".");
  console.log('Changes added to staging area');
  await git.commit(`deploy model ${modelName}`);
  console.log('Changes committed');
  await git.push();
  console.log('Changes pushed to remote repository');}
 catch(error){
  console.error('Error committing changes:', error);
 }
}
export default router;