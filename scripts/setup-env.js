#!/usr/bin/env node

/**
 * Environment Setup Script
 * Uses .env.example as a template to create environment-specific files
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (prompt) => {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
};

async function setupEnvironment() {
  console.log("🚀 Environment Setup Wizard\n");

  // Check if .env.example exists
  const examplePath = path.resolve(process.cwd(), ".env.example");
  if (!fs.existsSync(examplePath)) {
    console.log("❌ .env.example file not found!");
    process.exit(1);
  }

  // Read template
  const template = fs.readFileSync(examplePath, "utf8");

  console.log("Which environment would you like to set up?");
  console.log("1. Development (.env.development)");
  console.log("2. Production (.env.production)");
  console.log("3. Local override (.env)");
  console.log("4. All environments");

  const choice = await question("\nEnter your choice (1-4): ");

  const environments = [];
  switch (choice) {
    case "1":
      environments.push("development");
      break;
    case "2":
      environments.push("production");
      break;
    case "3":
      environments.push("local");
      break;
    case "4":
      environments.push("development", "production", "local");
      break;
    default:
      console.log("❌ Invalid choice");
      process.exit(1);
  }

  for (const env of environments) {
    const fileName = env === "local" ? ".env" : `.env.${env}`;
    const filePath = path.resolve(process.cwd(), fileName);

    if (fs.existsSync(filePath)) {
      const overwrite = await question(
        `⚠️  ${fileName} already exists. Overwrite? (y/N): `
      );
      if (overwrite.toLowerCase() !== "y") {
        console.log(`⏭️  Skipping ${fileName}`);
        continue;
      }
    }

    // Create environment-specific content
    let content = template;

    if (env === "development") {
      content = content.replace("NODE_ENV=development", "NODE_ENV=development");
      content = content.replace("PORT=3000", "PORT=3000");
      content = content.replace("DEBUG=true", "DEBUG=true");
      content = content.replace("SWAGGER_ENABLED=true", "SWAGGER_ENABLED=true");
    } else if (env === "production") {
      content = content.replace("NODE_ENV=development", "NODE_ENV=production");
      content = content.replace("PORT=3000", "PORT=8080");
      content = content.replace("DEBUG=true", "DEBUG=false");
      content = content.replace("LOG_LEVEL=debug", "LOG_LEVEL=error");
      content = content.replace(
        "SWAGGER_ENABLED=true",
        "SWAGGER_ENABLED=false"
      );
      content = content.replace(
        "CORS_ORIGIN=http://localhost:3000,http://localhost:3001",
        "CORS_ORIGIN=https://yourdomain.com"
      );
    }

    fs.writeFileSync(filePath, content);
    console.log(`✅ Created ${fileName}`);
  }

  console.log("\n🎉 Environment setup complete!");
  console.log("\n📝 Next steps:");
  console.log("1. Edit the created files with your actual values");
  console.log("2. Update Firebase configuration");
  console.log("3. Set strong JWT secrets for production");
  console.log("4. Configure admin credentials");
  console.log("\n🔍 Validate your configuration:");
  console.log("   npm run test:env");

  rl.close();
}

setupEnvironment().catch(console.error);
