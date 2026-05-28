using EduCrm.Application.Interfaces.Services;
using Microsoft.Extensions.Caching.Memory;

namespace EduCrm.Infrastructure.Services;

public class CacheService(IMemoryCache cache) : ICacheService
{
    private static readonly TimeSpan DefaultExpiry = TimeSpan.FromMinutes(10);

    // ✅ Static - один список для всех экземпляров
    private static readonly HashSet<string> _keys = [];
    // HashSet быстрее List для поиска и удаления дубликатов

    // ✅ Лок для thread-safety
    private static readonly object _lock = new();

    public Task<T?> GetAsync<T>(string key)
    {
        cache.TryGetValue(key, out T? value);
        return Task.FromResult(value);
    }

    public Task SetAsync<T>(string key, T value, TimeSpan? expiry = null)
    {
        var options = new MemoryCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = expiry ?? DefaultExpiry,
            // ✅ Автоматически удаляем из _keys когда кэш истекает
            PostEvictionCallbacks =
            {
                new PostEvictionCallbackRegistration
                {
                    EvictionCallback = (k, _, _, _) =>
                    {
                        lock (_lock)
                        {
                            _keys.Remove(k.ToString()!);
                        }
                    }
                }
            }
        };

        cache.Set(key, value, options);

        lock (_lock)
        {
            _keys.Add(key);
        }

        return Task.CompletedTask;
    }

    public Task RemoveAsync(string key)
    {
        cache.Remove(key);

        lock (_lock)
        {
            _keys.Remove(key);
        }

        return Task.CompletedTask;
    }

    public Task RemoveByPrefixAsync(string prefix)
    {
        List<string> keysToRemove;

        lock (_lock)
        {
            keysToRemove = _keys
                .Where(x => x.StartsWith(prefix))
                .ToList();
        }

        foreach (var key in keysToRemove)
        {
            cache.Remove(key);

            lock (_lock)
            {
                _keys.Remove(key);
            }
        }

        return Task.CompletedTask;
    }
}