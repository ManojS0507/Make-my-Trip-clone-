# MyTrip backend

Spring Boot 3.2 REST API on Java 17, using Spring Data JPA, Spring Security, JWT, and MySQL 8.

## Run

For the complete local or production stack, use the Docker Compose instructions in the repository [README](../README.md).

To run the API directly, configure `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`, and `APP_JWT_SECRET` in the environment, then run:

```sh
mvn clean verify
mvn spring-boot:run
```

Never put database passwords or JWT secrets in `application.properties`.

## API documentation

The OpenAPI description is in `src/main/resources/api-docs.yaml`. The API is served under `/api`.

## Container

The backend `Dockerfile` is used by the root Docker Compose files. Review the root [deployment guide](../README.md) before exposing the API publicly.
