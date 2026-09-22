import express from 'express';

const app = express();

app.get('/', (req, res) => {
    res.status(200);
});

app.listen(3000, () => {
    console.log('Servidor iniciado en http://localhost:3000');
});