import { Router } from 'express';
const router = Router();

router.post('/example', async (req, res) => {
    try {
        const { name, age } = req.body; // Retrieve input from request body
        // ... Use the input to update, post, or get data ...
        res.status(200).send({ message: 'Data received', name, age });
    } catch (error) {
        res.status(400).send({ error: 'Error processing request' });
    }
});

router.get('/example', async (req, res) => {
    try {
        const { name, age } = req.query; // Retrieve input from query parameters
        // ... Use the input to update, post, or get data ...
        res.status(200).send({ message: 'Data received', name, age });
    } catch (error) {
        res.status(400).send({ error: 'Error processing request' });
    }
});

router.get('/example/:name/:age', async (req, res) => {
    try {
        const { name, age } = req.params; // Retrieve input from URL parameters
        // ... Use the input to update, post, or get data ...
        res.status(200).send({ message: 'Data received', name, age });
    } catch (error) {
        res.status(400).send({ error: 'Error processing request' });
    }
});

export default router;
