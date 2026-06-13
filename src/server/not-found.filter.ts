import { ExceptionFilter, Catch, ArgumentsHost, NotFoundException } from '@nestjs/common';
import { Request, Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';

@Catch(NotFoundException)
export class NotFoundExceptionFilter implements ExceptionFilter {
  catch(exception: NotFoundException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // If it's an API route, return standard NestJS 404 JSON response
    if (request.path.startsWith('/api')) {
      return response.status(404).json({
        statusCode: 404,
        message: `Cannot ${request.method} ${request.path}`,
        error: 'Not Found',
      });
    }

    // Serve the compiled index.html for client-side React Router routes
    const distPath = path.join(process.cwd(), 'dist');
    const indexPath = path.join(distPath, 'index.html');
    
    if (fs.existsSync(indexPath)) {
      return response.sendFile(indexPath);
    }

    // Fallback if index.html is missing
    return response.status(404).json({
      statusCode: 404,
      message: `Cannot ${request.method} ${request.path} (Aesthetic fallback: index.html not found)`,
      error: 'Not Found',
    });
  }
}
