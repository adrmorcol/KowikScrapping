export function manejarErrores(err, req, res, next) {
    console.log(err);
    res.status(500)({ error: err.message || 'Error interno del servidor' });
}