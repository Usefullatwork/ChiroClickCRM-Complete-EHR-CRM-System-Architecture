/**
 * API Documentation Routes
 * Serves OpenAPI specification and Swagger UI
 */

import express from 'express';
import openApiSpec from '../docs/openapi.js';

const router = express.Router();

/**
 * @route   GET /api/docs/openapi.json
 * @desc    Get OpenAPI specification
 * @access  Public
 */
router.get('/openapi.json', (req, res) => {
  res.json(openApiSpec);
});

/**
 * @route   GET /api/docs
 * @desc    Serve Swagger UI
 * @access  Public
 */
router.get('/', (req, res) => {
  const swaggerUiHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ChiroClickCRM API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
  <style>
    body {
      margin: 0;
      padding: 0;
    }
    .swagger-ui .topbar {
      background-color: #1a365d;
    }
    .swagger-ui .topbar .download-url-wrapper input[type=text] {
      border-color: #2d3748;
    }
    .swagger-ui .info .title {
      color: #1a365d;
    }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({
        url: '/api/docs/openapi.json',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: 'StandaloneLayout',
        persistAuthorization: true,
        tryItOutEnabled: true
      });
    };
  </script>
</body>
</html>
  `;
  res.type('html').send(swaggerUiHtml);
});

export default router;
