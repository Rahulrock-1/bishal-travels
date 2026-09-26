#!/bin/bash
set -e

echo "=== Starting Bishal Travels Fleet & Invoice Platform ==="

# Check if RabbitMQ should be launched locally
if [ -z "$RABBITMQ_URL" ] || [[ "$RABBITMQ_URL" == *"localhost"* ]] || [[ "$RABBITMQ_URL" == *"127.0.0.1"* ]]; then
    echo "Starting internal RabbitMQ message broker daemon..."
    
    mkdir -p /var/lib/rabbitmq /var/log/rabbitmq /var/run/rabbitmq
    chown -R rabbitmq:rabbitmq /var/lib/rabbitmq /var/log/rabbitmq /var/run/rabbitmq 2>/dev/null || true

    # Start RabbitMQ daemon as rabbitmq user
    su -s /bin/sh rabbitmq -c "rabbitmq-server -detached" 2>/dev/null || service rabbitmq-server start 2>/dev/null || true

    # Wait for RabbitMQ port 5672 to become active
    echo "Waiting for RabbitMQ broker to bind port 5672..."
    for i in {1..20}; do
        if timeout 1 bash -c "cat < /dev/null > /dev/tcp/127.0.0.1/5672" 2>/dev/null; then
            echo "RabbitMQ is ACTIVE and ready on 127.0.0.1:5672!"
            break
        fi
        sleep 1
    done

    export RABBITMQ_URL="amqp://guest:guest@127.0.0.1:5672"
else
    echo "Connected to external RabbitMQ broker via RABBITMQ_URL."
fi

echo "Starting ASP.NET Core Web API on port ${PORT:-8080}..."
exec dotnet BishalTravels.Api.dll
