FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app

COPY pom.xml .
RUN mvn -B -U -DskipTests \
    -Dmaven.wagon.http.retryHandler.count=5 \
    -Dmaven.wagon.http.pool=false \
    -Dhttp.keepAlive=false \
    -Dhttps.protocols=TLSv1.2 \
    dependency:go-offline
COPY src ./src

RUN /bin/sh -lc 'set -e; for i in 1 2 3; do mvn -B -U -DskipTests -Dmaven.wagon.http.retryHandler.count=5 -Dmaven.wagon.http.pool=false -Dhttp.keepAlive=false -Dhttps.protocols=TLSv1.2 clean package && exit 0 || { echo "Retry $i/3"; sleep 5; }; done; exit 1'

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8081
ENTRYPOINT ["java","-jar","app.jar"]
