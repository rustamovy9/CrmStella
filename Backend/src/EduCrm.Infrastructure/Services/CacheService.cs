using EduCrm.Application.Interfaces.Services;
using Microsoft.Extensions.Caching.Memory;

namespace EduCrm.Infrastructure.Services;

public class CacheService(IMemoryCache cache) : ICacheService
{
    private static readonly TimeSpan DefaultExpiry = TimeSpan.FromMinutes(10);
    private readonly List<string> _keys = [];

    public Task<T?> GetAsync<T>(string key)
    {
        cache.TryGetValue(key, out T? value);
        return Task.FromResult(value);
    }

    public Task SetAsync<T>(string key, T value, TimeSpan? expiry = null)
    {
        var options = new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = expiry ?? DefaultExpiry
        };

        cache.Set(key, value, options);

        if (!_keys.Contains(key))
            _keys.Add(key);

        return Task.CompletedTask;
    }

    public Task RemoveAsync(string key)
    {
        cache.Remove(key);
        _keys.Remove(key);
        return Task.CompletedTask;
    }

    public Task RemoveByPrefixAsync(string prefix)
    {
        var keysToRemove = _keys
            .Where(x => x.StartsWith(prefix))
            .ToList();

        Console.WriteLine($"Removing {keysToRemove.Count} keys with prefix '{prefix}'");

        foreach (var key in keysToRemove)
        {
            cache.Remove(key);
            _keys.Remove(key);
        }

        return Task.CompletedTask;
    }
}