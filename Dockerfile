# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project files and restore dependencies
COPY ["backend/BishalTravels.Api/BishalTravels.Api.csproj", "backend/BishalTravels.Api/"]
RUN dotnet restore "backend/BishalTravels.Api/BishalTravels.Api.csproj"

# Copy source code and build
COPY backend/ backend/
WORKDIR "/src/backend/BishalTravels.Api"
RUN dotnet build "BishalTravels.Api.csproj" -c Release -o /app/build

# Publish Stage
FROM build AS publish
RUN dotnet publish "BishalTravels.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Final Runtime Stage with Integrated RabbitMQ Server
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# Install RabbitMQ server and networking tools
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
        rabbitmq-server \
        curl \
        procps \
        net-tools && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

COPY --from=publish /app/publish .
COPY entrypoint.sh .
RUN sed -i 's/\r$//' entrypoint.sh && chmod +x entrypoint.sh

# Default port for Render Web API
ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["./entrypoint.sh"]
