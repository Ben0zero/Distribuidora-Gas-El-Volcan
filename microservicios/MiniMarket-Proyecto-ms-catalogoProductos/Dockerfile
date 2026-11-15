# syntax=docker/dockerfile:1
# ============================================================
#  ms-catalogoProductos — imagen multi-etapa (Java 21)
#  1) build: compila con Maven dentro de la imagen (no requiere JDK local)
#  2) final: solo el JRE 21 y el JAR, con un usuario sin privilegios
#  El Wallet de Oracle NO se copia a la imagen: se monta en /wallet como
#  volumen de solo lectura (ver docker-compose.yml y docs/DOCKER.md).
#  Memoria: JAVA_OPTS (por defecto -Xmx384m), configurable desde .env
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
ENV JAVA_OPTS="-Xmx384m" \
    ORACLE_WALLET_DIR=/wallet
EXPOSE 8082
# oracle.net.wallet_location tiene prioridad sobre el sqlnet.ora del Wallet (que puede traer
# "?/network/admin" o una ruta de Windows): así el Wallet montado se usa tal cual, sin modificarlo.
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -Doracle.net.wallet_location=\"(SOURCE=(METHOD=FILE)(METHOD_DATA=(DIRECTORY=$ORACLE_WALLET_DIR)))\" -jar app.jar"]
