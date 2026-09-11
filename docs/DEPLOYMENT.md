# Deployment

Use `docker-compose.yml` for local orchestration of MongoDB, backend, frontend, and ML service. Ollama is documented as host-based by default because local model acceleration varies by machine.

Never deploy with the development JWT secret. Do not expose uploads as public static files.
