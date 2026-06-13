import 'reflect-metadata';
import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/server/app.module';
import { createServer as createViteServer } from 'vite';
import { NotFoundExceptionFilter } from './src/server/not-found.filter';
import { DatabaseBackupService } from './src/server/services/database-backup.service';

dotenv.config();

async function bootstrap() {
  console.log('BOOT STEP 1 START: DATABASE BACKUP PROCESS');
  // Execute database backup before startup
  DatabaseBackupService.backupSync();
  console.log('BOOT STEP 1 COMPLETE: DATABASE BACKUP PROCESS');

  const PORT = 3000;

  console.log('BOOT STEP 2 START: NESTFACTORY INSTANTIATION');
  // Initialize the enterprise NestJS framework
  const app = await NestFactory.create(AppModule);
  console.log('BOOT STEP 2 COMPLETE: NESTFACTORY INSTANTIATION');

  // Set the unified api route prefix for the angular/react web portals
  app.setGlobalPrefix('api');

  // Enable secure cross-origin queries
  app.enableCors({
    origin: function (origin, callback) {
      if (!origin || 
          origin.startsWith('https://bhakor.vercel.app') || 
          origin.includes('localhost') || 
          origin.includes('127.0.0.1') ||
          origin.includes('.run.app') ||
          origin.includes('.vercel.app')
      ) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true
  });

  // Register JSON and URL encoders on the native Express instance
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.use(express.json());
  expressApp.use(express.urlencoded({ extended: true }));

  // Register our custom global exception filter to handle client-side SPA route fallbacks cleanly
  app.useGlobalFilters(new NotFoundExceptionFilter());

  // Configure Vite Development middleware or static asset pipelines BEFORE NestJS routing
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    
    // Mount Vite middleware only for non-API requests (so API routes can fall through to NestJS)
    app.use((req: any, res: any, next: any) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      vite.middlewares(req, res, next);
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    // Serve build artifacts for CSS/JS/images first
    app.use(express.static(distPath));
  }

  console.log('BOOT STEP 3 START: NESTJS LIFE CYCLE APP INIT');
  // Construct NestJS instance and compile routes
  await app.init();
  console.log('BOOT STEP 3 COMPLETE: NESTJS LIFE CYCLE APP INIT');

  console.log('BOOT STEP 4 START: BIND PORT AND LISTEN');
  // Bind to port 3000 and 0.0.0.0 required router host
  await app.listen(PORT, '0.0.0.0', () => {
    console.log(`[OOMS] NestJS Enterprise application running successfully on http://0.0.0.0:${PORT}`);
  });
  console.log('BOOT STEP 4 COMPLETE: PORT BOUND SUCCESS');
}

bootstrap();

