const jwt = require("jsonwebtoken");

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).json({ error: "Token requerido" });
  }

  const token = header.split(" ")[1]; // "Bearer xxx"
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}

function role(required) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== required) {
      return res.status(403).json({ error: "No autorizado" });
    }
    next();
  };
}

module.exports = { auth, role };
