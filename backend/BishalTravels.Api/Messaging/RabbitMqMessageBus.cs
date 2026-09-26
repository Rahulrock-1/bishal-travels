using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace BishalTravels.Api.Messaging;

public class RabbitMqMessageBus : IMessageBus, IAsyncDisposable
{
    private readonly IConfiguration _config;
    private readonly ILogger<RabbitMqMessageBus> _logger;
    private IConnection? _connection;
    private IChannel? _channel;
    private readonly SemaphoreSlim _lock = new(1, 1);
    private bool _attemptedConnection;
    private bool _isConnected;

    public const string ExchangeName = "bishal_travels.events";
    public const string MainQueueName = "bishal_travels.event_processing_queue";

    public bool IsConnected => _isConnected;

    public RabbitMqMessageBus(IConfiguration config, ILogger<RabbitMqMessageBus> logger)
    {
        _config = config;
        _logger = logger;
    }

    private async Task<bool> EnsureConnectionAsync()
    {
        if (_isConnected && _channel != null) return true;

        await _lock.WaitAsync();
        try
        {
            if (_isConnected && _channel != null) return true;
            if (_attemptedConnection && !_isConnected) return false;

            _attemptedConnection = true;

            var rabbitUri = _config.GetConnectionString("RabbitMQ")
                ?? Environment.GetEnvironmentVariable("RABBITMQ_URL")
                ?? _config["RabbitMQ:HostName"];

            if (string.IsNullOrWhiteSpace(rabbitUri))
            {
                _logger.LogInformation("RabbitMQ URL not configured. Operating in resilient In-Memory Event Bus mode.");
                return false;
            }

            var factory = new ConnectionFactory();
            if (rabbitUri.StartsWith("amqp://", StringComparison.OrdinalIgnoreCase) || 
                rabbitUri.StartsWith("amqps://", StringComparison.OrdinalIgnoreCase))
            {
                factory.Uri = new Uri(rabbitUri);
            }
            else
            {
                factory.HostName = rabbitUri;
            }

            factory.ClientProvidedName = "BishalTravels_Api_Publisher";

            _connection = await factory.CreateConnectionAsync();
            _channel = await _connection.CreateChannelAsync();

            await _channel.ExchangeDeclareAsync(
                exchange: ExchangeName,
                type: ExchangeType.Topic,
                durable: true,
                autoDelete: false);

            await _channel.QueueDeclareAsync(
                queue: MainQueueName,
                durable: true,
                exclusive: false,
                autoDelete: false);

            await _channel.QueueBindAsync(
                queue: MainQueueName,
                exchange: ExchangeName,
                routingKey: "#");

            _isConnected = true;
            _logger.LogInformation("Successfully established connection to RabbitMQ Exchange '{Exchange}' and Queue '{Queue}'.", ExchangeName, MainQueueName);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to connect to RabbitMQ broker. Falling back gracefully to in-process event logging.");
            _isConnected = false;
            return false;
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task PublishAsync<T>(string routingKey, T message) where T : class
    {
        var json = JsonSerializer.Serialize(message, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
        var payloadBytes = Encoding.UTF8.GetBytes(json);

        var connected = await EnsureConnectionAsync();
        if (connected && _channel != null)
        {
            try
            {
                await _channel.BasicPublishAsync(
                    exchange: ExchangeName,
                    routingKey: routingKey,
                    mandatory: false,
                    body: payloadBytes);

                _logger.LogInformation("[RabbitMQ Published] RoutingKey: '{RoutingKey}' | Event: {EventName} | Payload: {Payload}", 
                    routingKey, typeof(T).Name, json);
                return;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while publishing to RabbitMQ channel. Event logged to resilient fallback.");
            }
        }

        // Resilient Fallback Logging
        _logger.LogInformation("[Resilient EventBus Local] RoutingKey: '{RoutingKey}' | Event: {EventName} | Payload: {Payload}", 
            routingKey, typeof(T).Name, json);
    }

    public async ValueTask DisposeAsync()
    {
        try
        {
            if (_channel != null) await _channel.CloseAsync();
            if (_connection != null) await _connection.CloseAsync();
        }
        catch
        {
            // Ignore on shutdown
        }
    }
}

// Background Consumer Service
public class RabbitMqEventConsumer : BackgroundService
{
    private readonly IConfiguration _config;
    private readonly ILogger<RabbitMqEventConsumer> _logger;

    public RabbitMqEventConsumer(IConfiguration config, ILogger<RabbitMqEventConsumer> logger)
    {
        _config = config;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var rabbitUri = _config.GetConnectionString("RabbitMQ")
            ?? Environment.GetEnvironmentVariable("RABBITMQ_URL")
            ?? _config["RabbitMQ:HostName"];

        if (string.IsNullOrWhiteSpace(rabbitUri))
        {
            _logger.LogInformation("RabbitMQ URL not configured. Background consumer standing by.");
            return;
        }

        try
        {
            var factory = new ConnectionFactory();
            if (rabbitUri.StartsWith("amqp://", StringComparison.OrdinalIgnoreCase) || 
                rabbitUri.StartsWith("amqps://", StringComparison.OrdinalIgnoreCase))
            {
                factory.Uri = new Uri(rabbitUri);
            }
            else
            {
                factory.HostName = rabbitUri;
            }

            factory.ClientProvidedName = "BishalTravels_Event_Consumer";

            var connection = await factory.CreateConnectionAsync(stoppingToken);
            var channel = await connection.CreateChannelAsync(cancellationToken: stoppingToken);

            await channel.QueueDeclareAsync(
                queue: RabbitMqMessageBus.MainQueueName,
                durable: true,
                exclusive: false,
                autoDelete: false,
                cancellationToken: stoppingToken);

            var consumer = new AsyncEventingBasicConsumer(channel);
            consumer.ReceivedAsync += async (model, ea) =>
            {
                try
                {
                    var body = ea.Body.ToArray();
                    var message = Encoding.UTF8.GetString(body);
                    var routingKey = ea.RoutingKey;

                    _logger.LogInformation("[RabbitMQ Consumed] RoutingKey: {RoutingKey} | Message: {Message}", routingKey, message);

                    // Simulated event processing (e.g. PDF receipt preparation, audit tracking, external CRM notification)
                    await Task.Delay(10, stoppingToken);

                    await channel.BasicAckAsync(deliveryTag: ea.DeliveryTag, multiple: false);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to process message from RabbitMQ queue.");
                    await channel.BasicNackAsync(deliveryTag: ea.DeliveryTag, multiple: false, requeue: true);
                }
            };

            await channel.BasicConsumeAsync(
                queue: RabbitMqMessageBus.MainQueueName,
                autoAck: false,
                consumer: consumer,
                cancellationToken: stoppingToken);

            _logger.LogInformation("RabbitMQ Event Consumer actively listening on queue '{Queue}'.", RabbitMqMessageBus.MainQueueName);

            // Keep alive while token is active
            await Task.Delay(Timeout.Infinite, stoppingToken);
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("RabbitMQ Event Consumer stopping gracefully.");
        }
        catch (Exception ex)
        {
            _logger.LogWarning("RabbitMQ Consumer could not connect to broker: {Message}. Background consumer standing by.", ex.Message);
        }
    }
}
