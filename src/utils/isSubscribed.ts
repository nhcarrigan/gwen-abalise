/**
 * @copyright nhcarrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type ButtonInteraction,
  type ChatInputCommandInteraction,
} from "discord.js";
import { entitledGuilds } from "../config/entitledGuilds.js";

/**
 * Checks if a server has an active entitlement (subscription) for the bot.
 * If they do not, it responds to the interaction with a button to subscribe.
 * @param interaction -- The interaction payload from Discord.
 * @returns A boolean indicating whether the user is subscribed.
 */
export const isSubscribed = async(
  interaction:
    | ChatInputCommandInteraction<"cached">
    | ButtonInteraction<"cached">,
): Promise<boolean> => {
  if (entitledGuilds.includes(interaction.guild.id)) {
    return true;
  }
  const isEntitled = interaction.entitlements.find((entitlement) => {
    return (
      entitlement.guildId === interaction.guild.id && entitlement.isActive()
    );
  });

  if (!isEntitled && interaction.user.id !== "465650873650118659") {
    const subscribeButton = new ButtonBuilder().
      setStyle(ButtonStyle.Premium).
      setSKUId("1343419585117945936");
    const helpButton = new ButtonBuilder().
      setStyle(ButtonStyle.Link).
      setURL("https://chat.nhcarrigan.com").
      setLabel("Need help?");
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      subscribeButton,
      helpButton,
    );
    await interaction.editReply({
      components: [ row ],
      // eslint-disable-next-line stylistic/max-len -- This is a long string.
      content:    "Your server does not appear to have an active subscription. Without one, the ticket system will not function.",
    });
    return false;
  }
  return true;
};
