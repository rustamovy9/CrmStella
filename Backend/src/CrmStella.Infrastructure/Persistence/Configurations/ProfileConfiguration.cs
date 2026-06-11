using CrmStella.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CrmStella.Infrastructure.Persistence.Configurations;

public class ProfileConfiguration : IEntityTypeConfiguration<Profile>
{
    public void Configure(EntityTypeBuilder<Profile> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.AvatarUrl)
            .HasMaxLength(500);

        builder.Property(x => x.Address)
            .HasMaxLength(300);

        builder.Property(x => x.TelegramUsername)
            .HasMaxLength(100);

        builder.Property(x => x.LinkedInUrl)
            .HasMaxLength(300);

        builder.Property(x => x.GithubUrl)
            .HasMaxLength(300);

        builder.Property(x => x.AboutMe)
            .HasMaxLength(1000);

        builder.HasIndex(x => x.UserId)
            .IsUnique();

        builder.HasOne(x => x.User)
            .WithOne(x => x.Profile)
            .HasForeignKey<Profile>(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}