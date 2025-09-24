
using Microsoft.EntityFrameworkCore;
using BoardingBee_backend.models;

namespace BoardingBee_backend.Models
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<UserSettings> UserSettings => Set<UserSettings>();
    public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();
    public DbSet<TestTable> TestTables => Set<TestTable>();
    public DbSet<PasswordResetTestToken> PasswordResetTestTokens => Set<PasswordResetTestToken>();
    public DbSet<Listing> Listings => Set<Listing>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // 1:1 uniqueness per user for UserSettings
            modelBuilder.Entity<UserSettings>()
                .HasIndex(s => s.UserId)
                .IsUnique();
        }
    }
}
