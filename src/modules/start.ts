/**
 * @copyright nhcarrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  MessageFlags,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
} from "discord.js";
import { isSubscribed } from "../utils/isSubscribed.js";
import { logger } from "../utils/logger.js";
import { replyToError } from "../utils/replyToError.js";
import type { PrismaClient } from "@prisma/client";

/**
 * Sends the standard ticket start post in the specified channel.
 * @param interaction - The interaction payload from Discord.
 * @param database - The Prisma client.
 */
// eslint-disable-next-line max-lines-per-function, max-statements -- We're close enough.
export const start = async(
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

    const { me } = interaction.guild.members;
    const requiredPermissions = [
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.CreatePrivateThreads,
      PermissionFlagsBits.ManageThreads,
    ];

    if (!me) {
      await interaction.editReply(
        { content: "Error loading my permissions. Please try again later." },
      );
      return;
    }

    const channel = interaction.
      options.
      getChannel("channel", true, [ ChannelType.GuildText ]);

    const permissions = channel.permissionsFor(me);

    if (requiredPermissions.some((permission) => {
      return !permissions.has(permission);
    })) {
      await interaction.editReply(
        {
          content:
          // eslint-disable-next-line stylistic/max-len -- This is a long string.
          "I do not have the required permissions send messages or manage private ticket threads in that channel.",
        },
      );
      return;
    }

    const role = await database.roles.findUnique({
      where: {
        serverId: interaction.guild.id,
      },
    });

    if (!role) {
      await interaction.editReply({
        content:
        "You must set a support role before starting the ticket system.",
      });
      return;
    }

    const button = new ButtonBuilder().setCustomId("open").
      setLabel("Create Ticket").
      setEmoji("🎫").
      setStyle(ButtonStyle.Success);
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

    await channel.send({
      allowedMentions: {
        parse: [],
      },
      components: [ row ],
      content:    `Please click the button below to create a new ticket with <@&${role.roleId}>.`,
    });

    await interaction.editReply({
      content: "Your ticket system is ready!",
    });
    await logger.metric("start_command", 1, {});
  } catch (error) {
    await replyToError(interaction);
    if (error instanceof Error) {
      await logger.error("start command", error);
    }
  }
};
