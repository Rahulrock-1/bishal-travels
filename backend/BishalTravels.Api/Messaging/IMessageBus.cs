namespace BishalTravels.Api.Messaging;

public interface IMessageBus
{
    Task PublishAsync<T>(string routingKey, T message) where T : class;
    bool IsConnected { get; }
}

public record InvoiceCreatedEvent(
    string InvoiceId,
    string InvoiceNumber,
    string ClientId,
    decimal GrandTotal,
    string BillingMonth,
    DateTime Timestamp
);

public record InvoiceStatusUpdatedEvent(
    string InvoiceId,
    string NewStatus,
    DateTime Timestamp
);

public record DutySlipCreatedEvent(
    string DutySlipId,
    string DutySlipNo,
    string VehicleId,
    string ClientId,
    decimal TotalKm,
    DateTime Timestamp
);
