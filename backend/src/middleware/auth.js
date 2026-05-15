import jwt from 'jsonwebtoken';

export function authenticate(req, res, next) {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token tidak ditemukan.' });
  }

  try {
    const token = header.replace('Bearer ', '');
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Token tidak valid.' });
  }
}

export function requireWriteAccess(req, res, next) {
  if (!['admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Hanya admin dan super admin yang bisa menambah data.' });
  }

  next();
}

export function requireSuperAdmin(req, res, next) {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Hanya super admin yang bisa melakukan aksi ini.' });
  }

  next();
}
