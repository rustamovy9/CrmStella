using CrmStella.Application.Common;
using CrmStella.Application.DTOs.Billing.Response;

namespace CrmStella.Application.Interfaces.Services;

public interface IBillingService
{
    Task<Result<BillingResultResponse>> ChargeMonthlyAsync(
        int studentId,
        int groupId,
        CancellationToken ct = default);

    Task<Result<int>> ProcessDueBillingsAsync(CancellationToken ct = default);

    Task<Result<BillingResultResponse>> ChargeOnEnrollmentAsync(
        int studentId,
        int groupId,
        CancellationToken ct = default);
}