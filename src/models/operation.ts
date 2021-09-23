import BigNumber from "bignumber.js";

type OperationType =
  | "Received" // Received - common case
  | "Received (non-sibling to change)" // Received - edge case: address not belonging to the xpub
  //                                                            sending funds to change address
  | "Received (token)" // Received - common case
  | "Sent" // Sent - common case
  | "Sent (token)" // Sent - token
  | "Sent to self" // Sent - edge case 1: The recipient is the sender (identity)
  | "Sent to sibling" // Sent - edge case 2: recipient belongs to same xpub ("sibling")
  | "Failed to send"; // Sent - edge case 3: failed send operation that impacts the balance (fees) (Ethereum)

class Operation {
  operationType: OperationType;
  txid: string;
  date: string;
  block: number;
  address: string;
  cashAddress: string | undefined; // Bitcoin Cash: Cash Address format
  amount: BigNumber;

  constructor(date: string, amount: BigNumber | string) {
    this.date = date;

    if (typeof amount === "string") {
      this.amount = new BigNumber(amount);
    } else {
      this.amount = amount;
    }
  }

  setTxid(txid: string) {
    this.txid = txid; // txid to which it belongs
  }

  getTxid() {
    return this.txid;
  }

  setBlockNumber(blockNumber: number) {
    this.block = blockNumber;
  }

  getBlockNumber() {
    return this.block;
  }

  setAddress(address?: string) {
    if (!address || address === "") {
      this.address = "(no address)";
    } else {
      this.address = address;
    }
  }

  setCashAddress(cashAddress: string | undefined) {
    this.cashAddress = cashAddress;
  }

  getAddress() {
    return this.address;
  }

  setOperationType(operationType: OperationType) {
    this.operationType = operationType;

    // if the operation has failed, set its amount to 0
    if (operationType === "Failed to send") {
      this.amount = new BigNumber(0);
    }
  }

  getOperationType() {
    return this.operationType;
  }
}

export { Operation, OperationType };
