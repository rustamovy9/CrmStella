using EduCrm.Application.Common;
using EduCrm.Application.DTOs.Billing.Response;
using EduCrm.Application.DTOs.Notification.Request;
using EduCrm.Application.Interfaces.Repositories;
using EduCrm.Application.Interfaces.Services;
using EduCrm.Domain.Constants;
using EduCrm.Domain.Entities;
using EduCrm.Domain.Enums;
using Microsoft.Extensions.Logging;

namespace EduCrm.Application.Services;

public class BillingService(
    IUnitOfWork unitOfWork,
    ICacheService cache,
    IAuditLogService auditLogService,
    INotificationService notificationService,
    ILogger<BillingService> logger) : IBillingService
{
    public async Task<Result<BillingResultResponse>> ChargeMonthlyAsync(
        int studentId, int groupId, CancellationToken ct = default)
    {
        var student = await unitOfWork.Students.GetByIdAsync(studentId);
        if (student is null)
            return Result<BillingResultResponse>.Fail("Student not found");

        var group = await unitOfWork.Groups.GetByIdAsync(groupId);
        if (group is null)
            return Result<BillingResultResponse>.Fail("Group not found");

        if (group.Status != GroupStatus.Active)
            return Result<BillingResultResponse>.Fail(
                "Курс завершён — списание невозможно", ErrorType.Conflict);

        if (group.EndDate.HasValue && group.EndDate.Value < DateTime.UtcNow)
            return Result<BillingResultResponse>.Fail(
                "Срок обучения завершён — списание невозможно", ErrorType.Conflict);

        var enrollment = await unitOfWork.GroupStudents
            .GetByGroupAndStudentAsync(groupId, studentId, ct);

        if (enrollment is null || !enrollment.IsActive || enrollment.LeftAt.HasValue)
            return Result<BillingResultResponse>.Fail(
                "Студент больше не учится в этой группе — списание невозможно",
                ErrorType.Conflict);

        if (enrollment.NextBillingDate.HasValue
            && enrollment.NextBillingDate.Value > DateTime.UtcNow)
        {
            var daysLeft = (int)(enrollment.NextBillingDate.Value - DateTime.UtcNow).TotalDays;
            return Result<BillingResultResponse>.Fail(
                $"Already charged. Next billing in {daysLeft} days " +
                $"({enrollment.NextBillingDate.Value:dd.MM.yyyy})",
                ErrorType.Conflict);
        }

        var course = await unitOfWork.Courses.GetByIdAsync(group.CourseId);
        if (course is null)
            return Result<BillingResultResponse>.Fail("Course not found");

        var basePrice = course.Price;
        var discountPercent = Math.Clamp(enrollment.DiscountPercent, 0, 100);
        var discountAmount = basePrice * (discountPercent / 100m);
        var monthlyAmount = basePrice - discountAmount; 

        var balanceBefore = await unitOfWork.Payments.GetStudentBalanceAsync(studentId);

        var note = discountPercent > 0
            ? $"Оплата за курс «{course.Name}» (скидка {discountPercent}%)"
            : $"Оплата за курс «{course.Name}»";

        var chargePayment = new Payment
        {
            StudentId = studentId,
            GroupId = groupId,
            Amount = monthlyAmount,
            Type = PaymentType.CourseFee,
            Method = PaymentMethod.Other,
            IsConfirmed = true,
            Note = note,
            Date = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };
        await unitOfWork.Payments.CreateAsync(chargePayment);
        await unitOfWork.SaveChangesAsync(ct);

        var balanceAfter = await unitOfWork.Payments.GetStudentBalanceAsync(studentId);
        student.Balance = balanceAfter;
        await unitOfWork.Students.UpdateAsync(student);

        enrollment.LastBilledAt = DateTime.UtcNow;
        enrollment.NextBillingDate = DateTime.UtcNow.AddDays(30);
        await unitOfWork.GroupStudents.UpdateAsync(enrollment, ct);
        await unitOfWork.SaveChangesAsync(ct);

        var wentNegative = balanceAfter < 0;
        decimal? debtAmount = wentNegative ? Math.Abs(balanceAfter) : null;

        if (wentNegative)
            try
            {
                await notificationService.CreateAsync(
                    new CreateNotificationRequest
                    {
                        UserId = student.UserId,
                        Title = "Долг за обучение",
                        Message = $"Ваш баланс: {balanceAfter:F2} TJS. " +
                                  $"Пополните счёт чтобы продолжить обучение.",
                        Type = NotificationType.Payment
                    },
                    ct);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex,
                    "Failed to send debt notification to user {UserId}", student.UserId);
            }

        await cache.RemoveByPrefixAsync("users:");
        await cache.RemoveByPrefixAsync("students:");
        await cache.RemoveByPrefixAsync("payments:");
        await cache.RemoveByPrefixAsync("groupstudents:");

        await auditLogService.LogAsync(
            null, AuditActions.ChargeStudent, nameof(Student), studentId,
            newValues: new
            {
                BasePrice = basePrice,
                DiscountPercent = discountPercent,
                Charged = monthlyAmount,
                BalanceBefore = balanceBefore,
                BalanceAfter = balanceAfter,
                WentNegative = wentNegative,
                GroupId = groupId
            });

        return Result<BillingResultResponse>.Ok(new BillingResultResponse
        {
            StudentId = studentId,
            GroupId = groupId,
            AmountCharged = monthlyAmount,
            BalanceBefore = balanceBefore,
            BalanceAfter = balanceAfter,
            WentNegative = wentNegative,
            DebtAmount = debtAmount,
            NextBillingDate = enrollment.NextBillingDate!.Value,
            PaymentId = chargePayment.Id
        });
    }

    public async Task<Result<int>> ProcessDueBillingsAsync(CancellationToken ct = default)
    {
        var dueEnrollments = await unitOfWork.GroupStudents
            .GetDueBillingsAsync(DateTime.UtcNow, ct);

        var processed = 0;
        var failed = 0;

        foreach (var enrollment in dueEnrollments)
        {
            var result = await ChargeMonthlyAsync(
                enrollment.StudentId, enrollment.GroupId, ct);

            if (result.IsSuccess)
            {
                processed++;
            }
            else
            {
                failed++;
                logger.LogWarning(
                    "Billing failed for student {S} group {G}: {Err}",
                    enrollment.StudentId, enrollment.GroupId, result.Error);
            }
        }

        logger.LogInformation(
            "ProcessDueBillings done: {Processed} processed, {Failed} failed",
            processed, failed);

        return Result<int>.Ok(processed);
    }

    public async Task<Result<BillingResultResponse>> ChargeOnEnrollmentAsync(
        int studentId, int groupId, CancellationToken ct = default)
    {
        return await ChargeMonthlyAsync(studentId, groupId, ct);
    }
}