import { ethers } from 'ethers';

class WalletService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet | null = null;

  constructor() {
    // Base network RPC
    const rpcUrl = process.env.BASE_RPC_URL || 'https://mainnet.base.org';
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
  }

  /**
   * Initialize wallet from private key
   */
  initializeWallet(): ethers.Wallet {
    const privateKey = process.env.TREASURY_WALLET_PRIVATE_KEY;

    if (!privateKey) {
      throw new Error('TREASURY_WALLET_PRIVATE_KEY is required');
    }

    this.wallet = new ethers.Wallet(privateKey, this.provider);
    return this.wallet;
  }

  /**
   * Get wallet instance
   */
  getWallet(): ethers.Wallet {
    if (!this.wallet) {
      return this.initializeWallet();
    }
    return this.wallet;
  }

  /**
   * Get wallet address
   */
  getAddress(): string {
    return this.getWallet().address;
  }

  /**
   * Get wallet balance in ETH
   */
  async getBalance(): Promise<string> {
    const balance = await this.provider.getBalance(this.getAddress());
    return ethers.formatEther(balance);
  }

  /**
   * Sign a message
   */
  async signMessage(message: string): Promise<string> {
    return this.getWallet().signMessage(message);
  }

  /**
   * Send a transaction
   */
  async sendTransaction(tx: ethers.TransactionRequest): Promise<ethers.TransactionResponse> {
    return this.getWallet().sendTransaction(tx);
  }

  /**
   * Get provider
   */
  getProvider(): ethers.JsonRpcProvider {
    return this.provider;
  }
}

export const walletService = new WalletService();
