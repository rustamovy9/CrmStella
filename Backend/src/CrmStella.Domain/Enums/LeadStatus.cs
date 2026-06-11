namespace CrmStella.Domain.Enums;

public enum LeadStatus
{
    New = 1,
    Contacted = 2,
    Qualified = 3,
    TrialScheduled = 4,
    TrialCompleted = 5,
    Converted = 6,
    Lost = 7
}

public enum LeadSource
{
    Instagram = 1,
    Website = 2,
    Telegram = 3,
    Referral = 4,
    WalkIn = 5,
    Phone = 6,
    Other = 99
}