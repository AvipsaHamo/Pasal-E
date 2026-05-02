// admin-frontend/src/app/core/interceptors/admin-jwt.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AdminAuthService } from '../services/admin-auth.service';

export const adminJwtInterceptor: HttpInterceptorFn = (req, next) => {
  const auth  = inject(AdminAuthService);
  const token = auth.token();
  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req);
};
