export function manejarErrores(err, req, res, next) {
    console.error(err, err.cause);
    res.status(500).json({ error: err.message || 'Error interno del servidor' });
}