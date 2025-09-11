using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using Microsoft.Extensions.Configuration;
using BoardingBee_backend.Models;
using BoardingBee_backend.Services; // <-- after you add the services folder
using DotNetEnv;

Env.Load(); // loads variables from .env if present

var builder = WebApplication.CreateBuilder(args);

// 1) Controllers
builder.Services.AddControllers();

// 2) Connection string with safe fallbacks
// Priority: appsettings.json -> env var DB_CONNECTION_STRING -> a dev default
var config = new ConfigurationBuilder()
    .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
    .AddEnvironmentVariables()
    .Build();

var connectionString =
    config.GetConnectionString("DefaultConnection")
    ?? Environment.GetEnvironmentVariable("DB_CONNECTION_STRING")
    ?? "Server=(localdb)\\mssqllocaldb;Database=BoardingBee;Trusted_Connection=True;MultipleActiveResultSets=true";

// 3) EF Core
builder.Services.AddDbContext<AppDbContext>(options => options.UseSqlServer(connectionString));

// 4) CORS (allow your Next.js dev URLs)
builder.Services.AddCors(options =>
{
    options.AddPolicy("frontend", p => p
        .WithOrigins("http://localhost:3000", "http://127.0.0.1:3000")
        .AllowAnyHeader()
        .AllowAnyMethod());
});

// 5) Forgot-Password dependencies (add these files first)
// IEmailSender / SmtpEmailSender, IPasswordResetService / PasswordResetService
builder.Services.AddScoped<IEmailSender, SmtpEmailSender>();
builder.Services.AddScoped<IPasswordResetService, PasswordResetService>();

// 6) Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "BoardingBee API", Version = "v1" });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("frontend");
app.UseAuthorization();
app.MapControllers();

await app.RunAsync();
