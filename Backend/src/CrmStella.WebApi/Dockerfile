# ---------- BUILD ----------
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build

WORKDIR /src

COPY . .

RUN dotnet restore CrmStella.WebApi.csproj

RUN dotnet publish CrmStella.WebApi.csproj \
    -c Release \
    -o /app/publish \
    --no-restore

# ---------- RUNTIME ----------
FROM mcr.microsoft.com/dotnet/aspnet:9.0

WORKDIR /app

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:10000

EXPOSE 10000

ENTRYPOINT ["dotnet","CrmStella.WebApi.dll"]
