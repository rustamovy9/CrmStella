using EduCrm.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduCrm.Infrastructure.Persistence.Configurations;

public class LessonScoreConfiguration : IEntityTypeConfiguration<LessonScore>
{
    public void Configure(EntityTypeBuilder<LessonScore> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Score)
            .HasPrecision(5, 2)
            .IsRequired();

        builder.Property(x => x.MentorFeedback)
            .HasMaxLength(1000);

        builder.Property(x => x.ScoredAt)
            .IsRequired();

        builder.HasOne(x => x.Lesson)
            .WithMany(x => x.LessonScores)
            .HasForeignKey(x => x.LessonId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Student)
            .WithMany(x => x.LessonScores)
            .HasForeignKey(x => x.StudentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.HomeworkSubmission)
            .WithOne(x => x.LessonScore)
            .HasForeignKey<LessonScore>(x => x.HomeworkSubmissionId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(x => new { x.LessonId, x.StudentId })
            .IsUnique();

        builder.HasIndex(x => x.StudentId);
    }
}