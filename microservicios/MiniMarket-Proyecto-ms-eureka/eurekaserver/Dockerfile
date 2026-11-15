# syntax=docker/dockerfile:1
# ============================================================
#  eureka-server — imagen multi-etapa (Java 21)
#  1) build: compila con Maven dentro de la imagen (no requiere JDK local)
#  2) final: solo el JRE 21 y el JAR, con un usuario sin privilegios
#  No usa base de datos ni secretos.
#  Memoria: JAVA_OPTS (por defecto -Xmx256m), configurable desde .env
# ============================================================

FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build
COPY pom.xml .
COPY src ./src
# La caché de ~/.m2 se reutiliza entre builds (BuildKit). Las pruebas se ejecutan fuera de la imagen.
RUN --mount=type=cache,target=/root/.m2 mvn -B -q -DskipTests package \
    && cp target/*.jar app.jar

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S app && adduser -S -G app app
COPY --from=build /build/app.jar app.jar
USER app
ENV JAVA_OPTS="-Xmx256m"
EXPOSE 8761
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
