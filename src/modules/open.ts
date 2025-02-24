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
  type ButtonInteraction,
} from "discord.js";
import { isSubscribed } from "../utils/isSubscribed.js";
import { logger } from "../utils/logger.js";
import { replyToError } from "../utils/replyToError.js";
import type { PrismaClient } from "@prisma/client";

/**
 * Opens a new ticket when a user clicks on the button.
 * @param interaction - The interaction payload from Discord.
 * @param database - The Prisma client.
 */
// eslint-disable-next-line max-lines-per-function, max-statements -- We're close!
export const open = async(
  interaction: ButtonInteraction<"cached">,
  database: PrismaClient,
): Promise<void> => {
  try {
    await interaction.deferReply({ flags: [ MessageFlags.Ephemeral ] });

    const subscribed = await isSubscribed(interaction);

    if (!subscribed) {
      return;
    }

    const supportRole = await database.roles.findUnique({
      where: {
        serverId: interaction.guild.id,
      },
    });

    if (!supportRole) {
      await interaction.editReply({
        content:
        // eslint-disable-next-line stylistic/max-len -- This is a long string.
        "No support role has been set for this server. Please notify the admins.",
      });
      return;
    }

    const { channel, user } = interaction;

    if (channel?.type !== ChannelType.GuildText) {
      await interaction.editReply({
        content: "How did this button show up in a non-text channel???",
      });
      return;
    }

    const hasTicket = await database.tickets.findFirst({
      where: {
        open: true,
        uuid: user.id,
      },
    });

    if (hasTicket) {
      await interaction.editReply({
        content: `You already have an open ticket: <#${hasTicket.threadId}>`,
      });
      return;
    }

    const ticket = await channel.threads.create({
      autoArchiveDuration: 1440,
      name:                `ticket-${user.username}`,
      type:                ChannelType.PrivateThread,
    });

    const closeButton = new ButtonBuilder().setCustomId("close").
      setStyle(ButtonStyle.Danger).
      setLabel("Close Ticket").
      setEmoji("🔒");
    const row = new ActionRowBuilder<ButtonBuilder>().
      addComponents(closeButton);

    await ticket.send({
      allowedMentions: {
        roles: [ supportRole.roleId ],
        users: [ user.id ],
      },
      components: [ row ],
      content:    `Hey <@${user.id}>, this is your private ticket with the <@&${supportRole.roleId}> team. How can we help you today?`,
    });

    await database.tickets.create({
      data: {
        open:     true,
        threadId: ticket.id,
        uuid:     user.id,
      },
    });

    await interaction.editReply({
      content: `Ticket created~!`,
    });
  } catch (error) {
    await replyToError(interaction);
    if (error instanceof Error) {
      await logger.error("open command", error);
    }
  }
};
