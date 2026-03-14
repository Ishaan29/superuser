import { Router } from 'express';

const ocrRoutes = Router();

ocrRoutes.post('/', (req, res) => {
    const { image } = req.body;
    res.json({"message": "Stream, hello world"});
});

export { ocrRoutes };