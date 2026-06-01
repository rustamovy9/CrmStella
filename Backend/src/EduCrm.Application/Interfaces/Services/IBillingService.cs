using EduCrm.Application.Common;
using EduCrm.Application.DTOs.Billing.Response;

namespace EduCrm.Application.Interfaces.Services;

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