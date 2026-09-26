using System.Reflection;
using Microsoft.Extensions.DependencyInjection;

namespace BishalTravels.Api.Common;

// 1. Marker Interfaces for CQRS
public interface IRequest<out TResponse> { }

public interface ICommand<out TResponse> : IRequest<TResponse> { }

public interface IQuery<out TResponse> : IRequest<TResponse> { }

// 2. Handler Interface
public interface IRequestHandler<in TRequest, TResponse> where TRequest : IRequest<TResponse>
{
    Task<TResponse> HandleAsync(TRequest request, CancellationToken cancellationToken = default);
}

// 3. Mediator Interface
public interface IMediator
{
    Task<TResponse> Send<TResponse>(IRequest<TResponse> request, CancellationToken cancellationToken = default);
}

// 4. In-Memory Mediator Implementation
public class Mediator : IMediator
{
    private readonly IServiceProvider _serviceProvider;

    public Mediator(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public async Task<TResponse> Send<TResponse>(IRequest<TResponse> request, CancellationToken cancellationToken = default)
    {
        if (request == null) throw new ArgumentNullException(nameof(request));

        var requestType = request.GetType();
        var handlerType = typeof(IRequestHandler<,>).MakeGenericType(requestType, typeof(TResponse));

        var handler = _serviceProvider.GetService(handlerType);
        if (handler == null)
        {
            throw new InvalidOperationException($"No handler registered for request type '{requestType.Name}' with response type '{typeof(TResponse).Name}'.");
        }

        var handleMethod = handlerType.GetMethod("HandleAsync");
        if (handleMethod == null)
        {
            throw new InvalidOperationException($"Handler for '{requestType.Name}' does not have a HandleAsync method.");
        }

        var task = (Task<TResponse>)handleMethod.Invoke(handler, new object[] { request, cancellationToken })!;
        return await task;
    }
}

// 5. Dependency Injection Registration
public static class CqrsServiceCollectionExtensions
{
    public static IServiceCollection AddCqrs(this IServiceCollection services, Assembly assembly)
    {
        services.AddScoped<IMediator, Mediator>();

        var handlerTypes = assembly.GetTypes()
            .Where(t => !t.IsAbstract && !t.IsInterface)
            .SelectMany(t => t.GetInterfaces(), (t, i) => new { Implementation = t, Interface = i })
            .Where(x => x.Interface.IsGenericType && x.Interface.GetGenericTypeDefinition() == typeof(IRequestHandler<,>));

        foreach (var handler in handlerTypes)
        {
            services.AddScoped(handler.Interface, handler.Implementation);
        }

        return services;
    }
}
