#!/bin/bash
set -e

echo "=== Starting Bishal Travels Fleet & Invoice Platform ==="

# Check if RabbitMQ should be launched locally
if [ -z "$RABBITMQ_URL" ] || [[ "$RABBITMQ_URL" == *"localhost"* ]] || [[ "$RABBITMQ_URL" == *"127.0.0.1"* ]]; then
    echo "Starting internal RabbitMQ message broker daemon with Management Web UI..."
    
    mkdir -p /var/lib/rabbitmq /var/log/rabbitmq /var/run/rabbitmq /etc/rabbitmq
    chown -R rabbitmq:rabbitmq /var/lib/rabbitmq /var/log/rabbitmq /var/run/rabbitmq /etc/rabbitmq 2>/dev/null || true

    ADMIN_USER="${RABBITMQ_ADMIN_USER:-Rahul}"
    ADMIN_PASS="${RABBITMQ_ADMIN_PASS:-Rahul@1998}"

    # Configure Management UI prefix, internal loopback port, and default admin user in rabbitmq.conf
    cat << EOF > /etc/rabbitmq/rabbitmq.conf
management.tcp.port = 15673
management.tcp.ip = 127.0.0.1
management.path_prefix = /rabbitmq
loopback_users = none
default_user = ${ADMIN_USER}
default_pass = ${ADMIN_PASS}
default_user_tags.administrator = true
default_permissions.configure = .*
default_permissions.read = .*
default_permissions.write = .*
EOF

    # Enable RabbitMQ Management Web Plugin
    rabbitmq-plugins enable rabbitmq_management 2>/dev/null || true

    # Start RabbitMQ daemon as rabbitmq user
    su -s /bin/sh rabbitmq -c "rabbitmq-server -detached" 2>/dev/null || service rabbitmq-server start 2>/dev/null || true

    # Wait for RabbitMQ AMQP port 5672 to become active
    echo "Waiting for RabbitMQ broker to bind port 5672..."
    count=0
    while [ $count -lt 30 ]; do
        if timeout 1 bash -c "cat < /dev/null > /dev/tcp/127.0.0.1/5672" 2>/dev/null; then
            echo "RabbitMQ AMQP is ACTIVE and ready on 127.0.0.1:5672!"
            break
        fi
        sleep 1
        count=$((count + 1))
    done

    echo "Configuring RabbitMQ Admin accounts '$ADMIN_USER' and 'admin'..."
    rabbitmqctl add_user "$ADMIN_USER" "$ADMIN_PASS" 2>/dev/null || rabbitmqctl change_password "$ADMIN_USER" "$ADMIN_PASS" 2>/dev/null || true
    rabbitmqctl set_user_tags "$ADMIN_USER" administrator 2>/dev/null || true
    rabbitmqctl set_permissions -p / "$ADMIN_USER" ".*" ".*" ".*" 2>/dev/null || true

    rabbitmqctl add_user "admin" "$ADMIN_PASS" 2>/dev/null || rabbitmqctl change_password "admin" "$ADMIN_PASS" 2>/dev/null || true
    rabbitmqctl set_user_tags "admin" administrator 2>/dev/null || true
    rabbitmqctl set_permissions -p / "admin" ".*" ".*" ".*" 2>/dev/null || true

    export RABBITMQ_URL="amqp://${ADMIN_USER}:${ADMIN_PASS}@127.0.0.1:5672"
    echo "RabbitMQ Management UI is accessible securely at /rabbitmq/ (User: $ADMIN_USER)"
else
    echo "Connected to external RabbitMQ broker via RABBITMQ_URL."
fi

export ASPNETCORE_URLS="http://0.0.0.0:8080;http://0.0.0.0:15672;http://0.0.0.0:10000"
echo "Starting ASP.NET Core Web API on ports 8080, 15672, 10000, ${PORT:-}..."
exec dotnet BishalTravels.Api.dll
