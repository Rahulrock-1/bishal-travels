#!/bin/bash
set -e

echo "=== Starting Bishal Travels Fleet & Invoice Platform ==="

# Check if RabbitMQ should be launched locally
if [ -z "$RABBITMQ_URL" ] || [[ "$RABBITMQ_URL" == *"localhost"* ]] || [[ "$RABBITMQ_URL" == *"127.0.0.1"* ]]; then
    echo "Starting internal RabbitMQ message broker daemon with Management Web UI..."
    
    mkdir -p /var/lib/rabbitmq /var/log/rabbitmq /var/run/rabbitmq /etc/rabbitmq
    chown -R rabbitmq:rabbitmq /var/lib/rabbitmq /var/log/rabbitmq /var/run/rabbitmq /etc/rabbitmq 2>/dev/null || true

    # Configure Management UI prefix so it serves cleanly at /rabbitmq/ behind reverse proxy
    cat << 'EOF' > /etc/rabbitmq/rabbitmq.conf
management.path_prefix = /rabbitmq
loopback_users = none
EOF

    # Enable RabbitMQ Management Web Plugin
    rabbitmq-plugins enable rabbitmq_management 2>/dev/null || true

    # Start RabbitMQ daemon as rabbitmq user
    su -s /bin/sh rabbitmq -c "rabbitmq-server -detached" 2>/dev/null || service rabbitmq-server start 2>/dev/null || true

    # Wait for RabbitMQ AMQP port 5672 to become active
    echo "Waiting for RabbitMQ broker to bind port 5672..."
    for i in {1..25}; do
        if timeout 1 bash -c "cat < /dev/null > /dev/tcp/127.0.0.1/5672" 2>/dev/null; then
            echo "RabbitMQ AMQP is ACTIVE and ready on 127.0.0.1:5672!"
            break
        fi
        sleep 1
    done

    # Setup Secure Admin User for Management UI
    ADMIN_USER="${RABBITMQ_ADMIN_USER:-Rahul}"
    ADMIN_PASS="${RABBITMQ_ADMIN_PASS:-Rahul@1998}"

    echo "Configuring RabbitMQ Admin account '$ADMIN_USER'..."
    rabbitmqctl add_user "$ADMIN_USER" "$ADMIN_PASS" 2>/dev/null || rabbitmqctl change_password "$ADMIN_USER" "$ADMIN_PASS" 2>/dev/null || true
    rabbitmqctl set_user_tags "$ADMIN_USER" administrator 2>/dev/null || true
    rabbitmqctl set_permissions -p / "$ADMIN_USER" ".*" ".*" ".*" 2>/dev/null || true

    # Also configure fallback admin user
    rabbitmqctl add_user "admin" "$ADMIN_PASS" 2>/dev/null || rabbitmqctl change_password "admin" "$ADMIN_PASS" 2>/dev/null || true
    rabbitmqctl set_user_tags "admin" administrator 2>/dev/null || true
    rabbitmqctl set_permissions -p / "admin" ".*" ".*" ".*" 2>/dev/null || true

    export RABBITMQ_URL="amqp://${ADMIN_USER}:${ADMIN_PASS}@127.0.0.1:5672"
    echo "RabbitMQ Management UI is accessible securely at /rabbitmq/ (User: $ADMIN_USER)"
else
    echo "Connected to external RabbitMQ broker via RABBITMQ_URL."
fi

echo "Starting ASP.NET Core Web API on port ${PORT:-8080}..."
exec dotnet BishalTravels.Api.dll
