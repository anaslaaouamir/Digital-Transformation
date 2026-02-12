FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -B -q -ntp -DskipTests dependency:go-offline
COPY src ./src
RUN mvn -B -q -ntp -DskipTests package

FROM eclipse-temurin:17-jre
WORKDIR /app
ENV JAVA_OPTS=
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["sh","-c","java $JAVA_OPTS -jar app.jar"]
