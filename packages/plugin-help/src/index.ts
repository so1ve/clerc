/* eslint-disable no-console */
import type { Clerc, CommandRecord, HandlerContext } from "clerc";
import { NoSuchCommandsError, definePlugin, resolveCommand } from "clerc";
import pc from "picocolors";
import { generateFlagNameAndAliasFromCommand, generateNameAndAliasFromCommands, getPadLength } from "./utils";

// (desc)

// Usage: (name)[EXE] [OPTIONS] [NAME] [COMMAND]

// Commands:
//   test  does testing things
//   help  Print this message or the help of the given subcommand(s)

const newline = () => { console.log(); };

interface Options {
  /**
   * Register a help command or not.
   */
  command?: boolean
  /**
   * [example command, description]
   */
  examples?: [string, string][]
  /**
   * notes
   */
  notes?: string[]
}
const defaultOptions: Required<Options> = {
  command: true,
  examples: [],
  notes: [],
};
export const helpPlugin = (_options?: Options) => definePlugin({
  setup (cli) {
    const { command, ...rest } = { ...defaultOptions, ..._options } as Required<Options>;
    if (command) {
      cli = cli.command("help", "Show help")
        .on("help", (ctx) => {
          showHelp(cli, ctx, rest);
        });
    }
    cli = cli.inspector((ctx, next) => {
      if ((ctx.flags.h || ctx.flags.help)) {
        if (ctx.resolved) {
          showSubcommandHelp(cli, ctx as any);
        } else {
          showHelp(cli, ctx as any, rest);
        }
        return;
      }
      next();
    });
    return cli;
  },
});

type ShowHelpOptions = Required<Omit<Options, "command">>;
function showHelp (cli: Clerc, ctx: HandlerContext, { examples, notes }: ShowHelpOptions) {
  if (ctx.parameters.length > 0) {
    showSubcommandHelp(cli, ctx);
    return;
  }
  cli._name && console.log(`${pc.green(cli._name)} ${cli._version}`);
  if (cli._description) {
    console.log(cli._description);
    newline();
  }
  console.log(pc.yellow("USAGE:"));
  console.log(`    ${cli._name} <SUBCOMMAND> [OPTIONS]`);
  newline();
  console.log(pc.yellow("COMMANDS:"));
  const commandNameAndAlias = generateNameAndAliasFromCommands(cli._commands);
  const commandsPadLength = getPadLength(Object.values(commandNameAndAlias));
  for (const [name, nameAndAlias] of Object.entries(commandNameAndAlias)) {
    console.log(`    ${pc.green(nameAndAlias.padEnd(commandsPadLength))}${(cli._commands as CommandRecord)[name].description}`);
  }
  if (examples.length > 0) {
    newline();
    console.log(pc.yellow("EXAMPLES:"));
    const examplesPadLength = getPadLength(examples.map(e => e[0]));
    for (const [exampleCommand, exampleDescription] of examples) {
      console.log(`  ${exampleCommand.padEnd(examplesPadLength)}${exampleDescription}`);
    }
  }
  if (notes.length > 0) {
    newline();
    console.log(pc.yellow("NOTES:"));
    for (const note of notes) {
      console.log(`  ${note}`);
    }
  }
}

function showSubcommandHelp (cli: Clerc, ctx: HandlerContext) {
  const commandName = String(ctx.name || ctx.parameters[0]);
  const commandToShowHelp = resolveCommand(cli._commands, commandName);
  if (!commandToShowHelp) {
    throw new NoSuchCommandsError(`No such command: ${commandName}`);
  }
  console.log(`${pc.green(`${cli._name} ${commandToShowHelp.name}`)} ${cli._version}`);
  commandToShowHelp.description && console.log(commandToShowHelp.description);
  newline();
  console.log(pc.yellow("USAGE:"));
  console.log(`    ${cli._name} ${commandToShowHelp.name} [PARAMETERS] [FLAGS]`);
  newline();
  console.log(pc.yellow("PARAMETERS:"));
  const parameters = commandToShowHelp.parameters || {};
  const parametersPadLength = getPadLength(Object.keys(parameters));
  for (const [name, param] of Object.entries(parameters)) {
    const resuired = param.required ? pc.red(" (required)") : "";
    console.log(`    ${pc.green(name.padEnd(parametersPadLength))}${param.description}${resuired}`);
  }
  newline();
  console.log(pc.yellow("FLAGS:"));
  const flagNameAndAlias = generateFlagNameAndAliasFromCommand(commandToShowHelp);
  const flagsPadLength = getPadLength(Object.values(flagNameAndAlias));
  for (const [name, nameAndAlias] of Object.entries(flagNameAndAlias)) {
    console.log(`    ${pc.green(nameAndAlias.padEnd(flagsPadLength))}${commandToShowHelp.flags![name].description}`);
  }
}
