/**
 * @copyright nhcarrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */

import {
  ApplicationIntegrationType,
  SlashCommandBuilder,
  InteractionContextType,
} from "discord.js";

const command = new SlashCommandBuilder().
  setContexts(
    InteractionContextType.Guild,
  ).
  setIntegrationTypes(ApplicationIntegrationType.GuildInstall).
  setName("role").
  setDescription("Set the support role that is added to each ticket.").
  addRoleOption((option) => {
    return option.setName("role").
      setDescription("The role that should be invited to each thread.").
      setRequired(true);
  });

// eslint-disable-next-line no-console -- We don't need our logger here as this never runs in production.
console.log(JSON.stringify(command.toJSON()));
