import express from 'express';
import modelRoutes from './routes/models.js';
import cors from 'cors';
const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', modelRoutes);

app.listen(5000, () => {
  console.log('Server is running on port 5000');
});