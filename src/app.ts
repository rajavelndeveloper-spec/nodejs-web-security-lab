import express from 'express';
import helmet from 'helmet';

const app = express();

app.use(helmet());
app.use(express.json())

app.get("/", (_req, res) => {
  res.json({
    message: "Node.js Web Security Lab",
    status: "running"
  });
});

export default app;