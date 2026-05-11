import express from 'express';
import cors from 'cors';
import modelsRouter from './routes/models.js';
const app = express();
app.use(cors());
app.use(express.json());
app.use("/", modelsRouter);
app.get('/api', (req, res) => {
  res.json({ message: 'Hello from the API!' });
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
// test comment 3