#!/usr/bin/env node

import chalk from "chalk";
import yargs from "yargs";

import * as check_balances from "./actions/checkBalance";
import * as compare from "./actions/checkAddress";
import * as display from "./display";
import { getSortedOperations } from "./actions/processTransactions"
import { checkXpub } from "./helpers";
import { importOperations, checkImportedOperations } from "./actions/importOperations";
import { saveJSON } from "./actions/saveAnalysis"

const VERSION = '0.0.2'

const args = yargs
  .option('account', {
      alias: 'a',
      description: "Account number",
      demand: false,
      type: 'number'
  })
  .option('index', {
      alias: 'i',
      description: "Index number",
      demand: false,
      type: 'number'
  })
  .option('address', {
      description: "Address",
      demand: false,
      type: 'string'
  })
  .option('import', {
    description: "Import transactions",
    demand: false,
    type: 'string'
  })
  .option('save', {
    description: "Save analysis",
    demand: false,
    type: 'boolean'
  }).argv;

const account = args.account;
const index = args.index;
const address = args.address

const xpub = String(args._[0]);
checkXpub(xpub);

// TODO: remove once stable enough
function displayWarning() {
  console.log(
    chalk.redBright(
      '\nXpub scan is not stable yet (pre-alpha release): do not hesitate to double-check its output.',
      '\nIf you notice any error, please open an issue at: https://github.com/LedgerHQ/xpub-scan/issues',
      '\nThank you.'
      )
    );
}

let now = new Date()

if (address) {
  // comparison mode
  compare.run(xpub, address);
  displayWarning();
}
else if (typeof(account) !== 'undefined' && typeof(index) !== 'undefined') {
  // specific derivation mode
  const scanResult = check_balances.run(xpub, account, index);

  const addresses = scanResult.addresses;
  const summary = scanResult.summary;

  const actualTransactions = getSortedOperations(addresses);

  display.showOpsAndSummary(actualTransactions, summary);
  displayWarning();
}
else {
  // scan mode
  let importedTransactions;

  if (!args.import) {
    // if no file path has been provided, only the xpub is expected to have
    // been specified
    if (args._.length > 1) {
      console.log(
        chalk.red('Only 1 arg expected (xpub). Please check the documentation.')
      )
      process.exit(1);
    }
  }
  else {
    // if a file path has been provided, import its transactions
    importedTransactions = importOperations(args.import);
  }

  const scanResult = check_balances.run(xpub);

  const activeAddresses = scanResult.addresses
  const summary = scanResult.summary

  const actualTransactions = getSortedOperations(activeAddresses);

  display.showOpsAndSummary(actualTransactions, summary);

  if (typeof(importedTransactions) !== 'undefined') {
    const comparisonResults = checkImportedOperations(importedTransactions, actualTransactions);

    const meta = {
      xpub: xpub,
      date: now,
      version: VERSION
    }

    const data = {
      addresses: activeAddresses,
      summary: summary,
      transactions: actualTransactions,
      comparisons: comparisonResults
    }

    if (args.save) {
      saveJSON(meta, data);
    }
  }

  displayWarning();
}
