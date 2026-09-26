# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project files and restore dependencies
COPY ["BishalTravels.Api/BishalTravels.Api.csproj", "BishalTravels.Api/"]
RUN dotnet restore "BishalTravels.Api/BishalTravels.Api.csproj"

# Copy source code and build
COPY . .
WORKDIR "/src/BishalTravels.Api"
RUN dotnet build "BishalTravels.Api.csproj" -c Release -o /app/build

# Publish Stage
FROM build AS publish
RUN dotnet publish "BishalTravels.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Final Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Default port for Render (Render injects $PORT at runtime, our Program.cs listens on $PORT)
ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "BishalTravels.Api.dll"]
