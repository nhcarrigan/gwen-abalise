/**
 * @copyright nhcarrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */

import {
  ChannelType,
  MessageFlags,
  type ButtonInteraction,
} from "discord.js";
import { isSubscribed } from "../utils/isSubscribed.js";
import { logger } from "../utils/logger.js";
import { replyToError } from "../utils/replyToError.js";
import type { PrismaClient } from "@prisma/client";

/**
 * Closes a ticket when a user clicks on the button.
 * @param interaction - The interaction payload from Discord.
 * @param database - The Prisma client.
 */
// eslint-disable-next-line max-lines-per-function, max-statements -- We're close!
export const close = async(
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

    if (channel?.type !== ChannelType.PrivateThread) {
      await interaction.editReply({
        content: "How did this button show up outside of a thread???",
      });
      return;
    }

    const foundTicket = await database.tickets.findUnique({
      where: {
        threadId: channel.id,
      },
    });

    if (!foundTicket) {
      await interaction.editReply({
        content: `I do not have a record for this ticket...`,
      });
      return;
    }

    if (!foundTicket.open) {
      await interaction.editReply({
        content: `This ticket has already been closed...`,
      });
      return;
    }

    await channel.members.remove(foundTicket.uuid);

    await channel.send({
      allowedMentions: {
        parse: [],
      },
      content: `# Ticket Closed

This ticket has been closed by <@${user.id}> and locked. The member has been removed from the thread, and this thread is private so they cannot add themselves back.

Staff are welcome to discuss further here. The thread is preserved for logging.

Discord will auto-archive it, or if you are done discussing and want it out of the way you may archive it manually.`,
    });

    await database.tickets.update({
      data: {
        open: false,
      },
      where: {
        id: foundTicket.id,
      },
    });

    await interaction.editReply({
      content: `Ticket closed~!`,
    }).catch(() => {
      return null;
    });
  } catch (error) {
    await replyToError(interaction);
    if (error instanceof Error) {
      await logger.error("close command", error);
    }
  }
};
