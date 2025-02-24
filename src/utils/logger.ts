/**
 * @copyright nhcarrigan
 * @license Naomi's Public License
 * @author Naomi Carrigan
 */

import { Logger } from "@nhcarrigan/logger";

export const logger = new Logger(
  "Gwen Abalise",
  process.env.LOG_TOKEN ?? "",
);
