/**
 * @copyright nhcarrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */

import {
  ApplicationIntegrationType,
  SlashCommandBuilder,
  InteractionContextType,
  ChannelType,
} from "discord.js";

const command = new SlashCommandBuilder().
  setContexts(
    InteractionContextType.Guild,
  ).
  setIntegrationTypes(ApplicationIntegrationType.GuildInstall).
  setName("start").
  setDescription("Send the ticket start post in the specified channel.").
  addChannelOption((option) => {
    return option.setName("channel").
      setDescription("The channel to send the ticket start post in.").
      setRequired(true).
      addChannelTypes(ChannelType.GuildText);
  });

// eslint-disable-next-line no-console -- We don't need our logger here as this never runs in production.
console.log(JSON.stringify(command.toJSON()));
