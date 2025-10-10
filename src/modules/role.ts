/**
 * @copyright nhcarrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */

import {
  MessageFlags,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
} from "discord.js";
import { isSubscribed } from "../utils/isSubscribed.js";
import { logger } from "../utils/logger.js";
import { replyToError } from "../utils/replyToError.js";
import type { PrismaClient } from "@prisma/client";

/**
 * Updates the role that is added to new tickets.
 * @param interaction - The interaction payload from Discord.
 * @param database - The Prisma client.
 */
export const role = async(
  interaction: ChatInputCommandInteraction<"cached">,
  database: PrismaClient,
): Promise<void> => {
  try {
    await interaction.deferReply({ flags: [ MessageFlags.Ephemeral ] });

    const subscribed = await isSubscribed(interaction);

    if (!subscribed) {
      return;
    }

    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
      await interaction.editReply({
        content:
        "You must have the `MANAGE_GUILD` permission to use this command.",
      });
      return;
    }

    const supportRole = interaction.
      options.
      getRole("role", true);

    await database.roles.upsert({
      create: {
        roleId:   supportRole.id,
        serverId: interaction.guild.id,
      },
      update: {
        roleId: supportRole.id,
      },
      where: {
        serverId: interaction.guild.id,
      },
    });

    await interaction.editReply({
      content: `Your support role has been set to <@&${supportRole.id}>. This role will be pinged in new tickets.`,
    });
    await logger.metric("role_command", 1, {});
  } catch (error) {
    await replyToError(interaction);
    if (error instanceof Error) {
      await logger.error("role command", error);
    }
  }
};
