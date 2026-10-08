# Stage 1: Build with Maven
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Runtime image
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080

ENV MONGODB_URI=mongodb://localhost:27017/svboys_hostel
ENV SERVER_PORT=8080

ENTRYPOINT ["java", "-jar", "app.jar"]
