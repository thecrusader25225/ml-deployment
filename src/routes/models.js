import express from 'express';
import { models } from '../services/modelStore.js';
import { createModelDeployment, updateRootKustomization } from "../utils/generateYaml.js";
import { createLlamaCppDeployment } from '../utils/generateLlamaCpp.js';
import simpleGit from 'simple-git';
import fs from 'fs';
const token = process.env.GH_PAT;
const router = express.Router();

router.post('/models', async(req, res) => {
  const REPO_DIR = './cluster-config';
  if (!fs.existsSync(REPO_DIR)) {
    const git = simpleGit();

    await git.clone(
      `https://${token}@github.com/thecrusader25225/cluster-config.git`,
      REPO_DIR
    );
    console.log('Repository cloned successfully');
  }
  const repoGit = simpleGit(REPO_DIR);
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
    
    await commitChanges(repoGit, name);

    fs.rmSync(REPO_DIR, {
      recursive: true,
      force: true
    });

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

router.post('/models/:name/infer', async (req, res) => {
  try {
    const { name } = req.params;

    const response = await fetch(
      `http://${name}.inference-dev.svc.cluster.local/completion`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: req.body.prompt,
          n_predict: req.body.n_predict || 64
        })
      }
    );

    const data = await response.json();

    res.json(data);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: 'Inference failed'
    });
  }
});

export async function commitChanges(repoGit, modelName) {
 try{ console.log('Committing changes to Git...');
  await repoGit.addConfig('user.name', 'platform-bot');
  await repoGit.addConfig('user.email', 'bot@platform.dev');
  // await repoGit.pull('origin', 'main');
  await repoGit.add(".");
  console.log('Changes added to staging area');
  await repoGit.commit(`deploy model ${modelName}`);
  console.log('Changes committed');
  await repoGits.push();
  console.log('Changes pushed to remote repository');}
 catch(error){
  console.error('Error committing changes:', error);
 }
}
export default router;