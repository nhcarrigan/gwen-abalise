/**
 * @copyright nhcarrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */
import { PrismaClient } from "@prisma/client";
import { Client, Events, GatewayIntentBits } from "discord.js";
import { about } from "./modules/about.js";
import { close } from "./modules/close.js";
import { open } from "./modules/open.js";
import { role } from "./modules/role.js";
import { start } from "./modules/start.js";
import { instantiateServer } from "./server/serve.js";
import { logger } from "./utils/logger.js";
import { DiscordAnalytics } from "@nhcarrigan/discord-analytics";

process.on("unhandledRejection", (error) => {
  if (error instanceof Error) {
    void logger.error("Unhandled Rejection", error);
    return;
  }
  void logger.error("unhandled rejection", new Error(String(error)));
});

process.on("uncaughtException", (error) => {
  if (error instanceof Error) {
    void logger.error("Uncaught Exception", error);
    return;
  }
  void logger.error("uncaught exception", new Error(String(error)));
});

const client = new Client({
  intents: [ GatewayIntentBits.Guilds ],
});

const analytics = new DiscordAnalytics(client, logger);

const database = new PrismaClient();

// eslint-disable-next-line max-lines-per-function -- One too many...
client.on(Events.InteractionCreate, (interaction) => {
  if (interaction.isButton()) {
    if (!interaction.inCachedGuild()) {
      void interaction.reply({
        content:   "I'm sorry, but I can only be used in a server.",
        ephemeral: true,
      });
      return;
    }
    switch (interaction.customId) {
      case "open":
        void open(interaction, database);
        break;
      case "close":
        void close(interaction, database);
        break;
      default:
        void interaction.reply({
          content:   "I'm sorry, I don't know what to do with this button.",
          ephemeral: true,
        });
        break;
    }
  }
  if (interaction.isChatInputCommand()) {
    if (!interaction.inCachedGuild()) {
      void interaction.reply({
        content:   "I'm sorry, but I can only be used in a server.",
        ephemeral: true,
      });
      return;
    }
    switch (interaction.commandName) {
      case "about":
        void about(interaction);
        break;
      case "start":
        void start(interaction, database);
        break;
      case "role":
        void role(interaction, database);
        break;
      default:
        void interaction.reply({
          content:   `I'm sorry, I don't know the ${interaction.commandName} command.`,
          ephemeral: true,
        });
        break;
    }
  }
});

client.on(Events.EntitlementCreate, (entitlement) => {
  void logger.log("info", `User ${entitlement.userId} has subscribed!`);
});

client.on(Events.EntitlementDelete, (entitlement) => {
  void logger.log("info", `User ${entitlement.userId} has unsubscribed... :c`);
});

client.on(Events.ClientReady, () => {
  void logger.log("debug", "Bot is ready.");
  analytics.startCron();
});

instantiateServer();
await client.login(process.env.DISCORD_TOKEN);
