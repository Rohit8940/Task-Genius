// lib/swagger.ts
import swaggerJsdoc from 'swagger-jsdoc';

export const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Task Genius API',
      version: '1.0.0',
      description: 'Auto-generated API docs for your Next.js backend',
    },
    servers: [
      {
        url: 'https://task-genius-henr.onrender.com', // your deployed backend URL
      },
    ],
  },
  apis: ['./app/api/**/*.ts'], // Adjust this to match your API routes
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
