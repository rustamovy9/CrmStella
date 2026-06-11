using CrmStella.Application.Interfaces.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace CrmStella.Infrastructure.BackgroundJobs;

public class BillingJob(
    IServiceProvider services,
    ILogger<BillingJob> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = services.CreateScope();
                var billing = scope.ServiceProvider.GetRequiredService<IBillingService>();

                var result = await billing.ProcessDueBillingsAsync(stoppingToken);

                logger.LogInformation(
                    "BillingJob ran: {Count} students processed",
                    result.Data);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "BillingJob failed");
            }

            // Ждём 24 часа до следующего прогона
            await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
        }
    }
}