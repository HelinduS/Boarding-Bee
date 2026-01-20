using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.EntityFrameworkCore;
using BoardingBee_backend.Models;
using DotNetEnv;
using BoardingBee_backend.Auth.Services;
using BoardingBee_backend.Services;                 // ReviewsService, ListingService
using BoardingBee_backend.Services.Notifications;   // ⬅️ EmailNotifier, NotificationService

DotNetEnv.Env.Load();

var builder = WebApplication.CreateBuilder(args);

// App services
builder.Services.AddScoped<BoardingBee_backend.Services.ListingService>(); // keep as-is
builder.Services.AddScoped<ReviewsService>();

// ⬇️ Email-only notifications (no SMS)
builder.Services.AddScoped<EmailNotifier>();
builder.Services.AddScoped<NotificationService>();

// JWT Authentication setup
var jwtKey = Environment.GetEnvironmentVariable("JWT_SECRET") ?? "your_dev_secret_key";
var jwtIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER") ?? "BoardingBee_backend";
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = false,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ClockSkew = TimeSpan.Zero,
    };
    options.RequireHttpsMetadata = false; // for local dev only
});

builder.Services.AddControllers();
builder.Services.AddScoped<IAuthService, AuthService>();

// DB connection (SQL Server). Set DB_CONNECTION_STRING env var.
var connectionString = Environment.GetEnvironmentVariable("DB_CONNECTION_STRING");
Console.WriteLine($"[DEBUG] DB_CONNECTION_STRING: {connectionString}");
if (!string.IsNullOrEmpty(connectionString) && connectionString.Trim().ToLower().Contains("sqlite"))
{
    Console.WriteLine("[DEBUG] Using SQLite provider");
    builder.Services.AddDbContext<AppDbContext>(options => options.UseSqlite(connectionString));
}
else if (!string.IsNullOrEmpty(connectionString) && connectionString.Trim().ToLower().Contains("postgres"))
{
    Console.WriteLine("[DEBUG] Using PostgreSQL provider");
    builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(connectionString));
}
else
{
    Console.WriteLine("[DEBUG] Using SQL Server provider");
    builder.Services.AddDbContext<AppDbContext>(options => options.UseSqlServer(connectionString));
}

// CORS for Next.js (local dev + production)
var allowedOrigins = Environment.GetEnvironmentVariable("ALLOWED_ORIGINS")?.Split(',') ?? new[] {
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://boarding-hjna4k050-helindusenadheera-gmailcoms-projects.vercel.app"
};

builder.Services.AddCors(options =>
{
    options.AddPolicy("NextJs", policy =>
    {
        policy.WithOrigins(allowedOrigins)
        .AllowAnyHeader()
        .AllowAnyMethod();
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo { Title = "BoardingBee API", Version = "v1" });
    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Enter 'Bearer' [space] and then your valid JWT token."
    });
    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();

app.UseCors("NextJs");

// Serve wwwroot for uploaded avatars
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

await app.RunAsync();
